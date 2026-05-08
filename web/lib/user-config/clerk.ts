/**
 * Clerk-backed multi-tenant user config store.
 *
 * Each signed-in user's `UserConfig` is stored in their Clerk private
 * metadata. Secrets (Dedalus API key, Cursor API key, Hermes bearer
 * token) live in `privateMetadata`; everything else (agent kind,
 * provider, machine spec, setup step, machine ID, bootstrap progress)
 * lives in `publicMetadata` so the client can read it without a separate
 * API roundtrip.
 *
 * Resolution rule: when a request arrives, we read the user's config.
 * If a field is missing on the user (new sign-up, partial wizard), we
 * fall through to the env var equivalent. This keeps the existing
 * single-tenant behavior alive for the project owner who already wired
 * `DEDALUS_API_KEY` + `HERMES_MACHINE_ID` into Vercel env, while letting
 * fresh users provision their own machine through the wizard.
 *
 * The Clerk private metadata payload is small (4 strings + 1 enum), so
 * we don't bother chunking. The 8KB Clerk metadata limit applies to
 * each metadata field independently.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";

import {
	BOOTSTRAP_PHASES,
	DEFAULT_MACHINE_SPEC,
	DEFAULT_MODEL,
	DEFAULT_USER_CONFIG,
	INITIAL_BOOTSTRAP_STATE,
	type AgentKind,
	type BootstrapPhaseId,
	type BootstrapState,
	type MachineSpec,
	type ProviderKind,
	type SetupStep,
	type UserConfig,
} from "./schema";

type RawPublicMeta = {
	agentKind?: unknown;
	providerKind?: unknown;
	machineSpec?: unknown;
	model?: unknown;
	setupStep?: unknown;
	machineId?: unknown;
	apiUrl?: unknown;
	bootstrapState?: unknown;
};

type RawPrivateMeta = {
	dedalusApiKey?: unknown;
	cursorApiKey?: unknown;
	apiKey?: unknown;
};

const KNOWN_AGENTS: ReadonlySet<AgentKind> = new Set(["hermes", "openclaw"]);
const KNOWN_PROVIDERS: ReadonlySet<ProviderKind> = new Set([
	"dedalus",
	"vercel-sandbox",
	"fly",
]);
const KNOWN_STEPS: ReadonlySet<SetupStep> = new Set([
	"api-key",
	"agent",
	"provider",
	"spec",
	"review",
	"provisioned",
]);
const KNOWN_PHASES: ReadonlySet<BootstrapPhaseId> = new Set(BOOTSTRAP_PHASES);

function asString(value: unknown, fallback?: string): string | undefined {
	if (typeof value === "string" && value.trim().length > 0) return value.trim();
	return fallback;
}

function asAgent(value: unknown): AgentKind {
	const v = asString(value);
	return v && KNOWN_AGENTS.has(v as AgentKind) ? (v as AgentKind) : "hermes";
}

function asProvider(value: unknown): ProviderKind {
	const v = asString(value);
	return v && KNOWN_PROVIDERS.has(v as ProviderKind)
		? (v as ProviderKind)
		: "dedalus";
}

function asStep(value: unknown): SetupStep {
	const v = asString(value);
	return v && KNOWN_STEPS.has(v as SetupStep) ? (v as SetupStep) : "api-key";
}

function asSpec(value: unknown): MachineSpec {
	if (!value || typeof value !== "object") return DEFAULT_MACHINE_SPEC;
	const v = value as Record<string, unknown>;
	const vcpu = Number(v.vcpu);
	const mem = Number(v.memoryMib);
	const stor = Number(v.storageGib);
	return {
		vcpu: Number.isFinite(vcpu) && vcpu > 0 ? vcpu : DEFAULT_MACHINE_SPEC.vcpu,
		memoryMib:
			Number.isFinite(mem) && mem > 0
				? mem
				: DEFAULT_MACHINE_SPEC.memoryMib,
		storageGib:
			Number.isFinite(stor) && stor > 0
				? stor
				: DEFAULT_MACHINE_SPEC.storageGib,
	};
}

function asBootstrapState(value: unknown): BootstrapState {
	if (!value || typeof value !== "object") return INITIAL_BOOTSTRAP_STATE;
	const raw = value as Record<string, unknown>;
	const phase = asString(raw.phase);
	const allowedPhases = new Set(["idle", "running", "succeeded", "failed"]);
	const completed: BootstrapPhaseId[] = Array.isArray(raw.completed)
		? raw.completed
				.map((entry) => asString(entry))
				.filter(
					(entry): entry is string =>
						typeof entry === "string" &&
						KNOWN_PHASES.has(entry as BootstrapPhaseId),
				)
				.map((entry) => entry as BootstrapPhaseId)
		: [];
	const currentRaw = asString(raw.current);
	const current =
		currentRaw && KNOWN_PHASES.has(currentRaw as BootstrapPhaseId)
			? (currentRaw as BootstrapPhaseId)
			: null;
	return {
		phase: allowedPhases.has(phase ?? "")
			? (phase as BootstrapState["phase"])
			: "idle",
		current,
		completed,
		startedAt: asString(raw.startedAt) ?? null,
		finishedAt: asString(raw.finishedAt) ?? null,
		lastError: asString(raw.lastError) ?? null,
	};
}

/**
 * Default values pulled from Vercel env. Used as fallbacks when a user
 * hasn't filled in a wizard field yet, and as initial values when
 * pre-populating the wizard for the project owner.
 *
 * `hermes-agent` is the literal model id the deployed gateway exposes,
 * not anthropic/claude-sonnet. Keep it in sync with the bootstrap step
 * that writes Hermes config on the VM.
 */
export function getEnvDefaults(): Partial<UserConfig> {
	const env = process.env;
	const defaults: Partial<UserConfig> = {};
	if (env.DEDALUS_API_KEY) defaults.dedalusApiKey = env.DEDALUS_API_KEY.trim();
	if (env.CURSOR_API_KEY) defaults.cursorApiKey = env.CURSOR_API_KEY.trim();
	if (env.HERMES_MACHINE_ID)
		defaults.machineId = env.HERMES_MACHINE_ID.trim();
	if (env.HERMES_API_URL) defaults.apiUrl = env.HERMES_API_URL.trim();
	if (env.HERMES_API_KEY) defaults.apiKey = env.HERMES_API_KEY.trim();
	if (env.HERMES_MODEL) defaults.model = env.HERMES_MODEL.trim();
	const vcpu = Number(env.HERMES_VCPU);
	const mem = Number(env.HERMES_MEMORY_MIB);
	const stor = Number(env.HERMES_STORAGE_GIB);
	if (Number.isFinite(vcpu) || Number.isFinite(mem) || Number.isFinite(stor)) {
		defaults.machineSpec = {
			vcpu: Number.isFinite(vcpu) && vcpu > 0 ? vcpu : DEFAULT_MACHINE_SPEC.vcpu,
			memoryMib:
				Number.isFinite(mem) && mem > 0
					? mem
					: DEFAULT_MACHINE_SPEC.memoryMib,
			storageGib:
				Number.isFinite(stor) && stor > 0
					? stor
					: DEFAULT_MACHINE_SPEC.storageGib,
		};
	}
	return defaults;
}

/**
 * Render the owner-only seed values for the wizard. Returns a frozen
 * `UserConfig`-shaped object; the caller patches per-user choices on
 * top of it. Anyone signed in can call this -- there's no owner check
 * because the values come from the deployment's own env, not from
 * another user's account.
 */
export function getOwnerDefaults(): UserConfig {
	return {
		...DEFAULT_USER_CONFIG,
		...getEnvDefaults(),
		bootstrapState: { ...INITIAL_BOOTSTRAP_STATE },
		machineSpec: getEnvDefaults().machineSpec ?? DEFAULT_MACHINE_SPEC,
		model: getEnvDefaults().model ?? DEFAULT_MODEL,
	};
}

function buildConfig(
	publicMeta: RawPublicMeta,
	privateMeta: RawPrivateMeta,
): UserConfig {
	const envDefaults = getEnvDefaults();
	const machineId =
		asString(publicMeta.machineId) ?? asString(envDefaults.machineId) ?? null;
	const apiUrl =
		asString(publicMeta.apiUrl) ?? asString(envDefaults.apiUrl) ?? null;
	return {
		agentKind: asAgent(publicMeta.agentKind),
		providerKind: asProvider(publicMeta.providerKind),
		machineSpec: publicMeta.machineSpec
			? asSpec(publicMeta.machineSpec)
			: envDefaults.machineSpec ?? DEFAULT_MACHINE_SPEC,
		model:
			asString(publicMeta.model) ?? envDefaults.model ?? DEFAULT_MODEL,
		setupStep: asStep(publicMeta.setupStep),
		machineId,
		apiUrl,
		dedalusApiKey:
			asString(privateMeta.dedalusApiKey) ?? envDefaults.dedalusApiKey,
		cursorApiKey:
			asString(privateMeta.cursorApiKey) ??
			envDefaults.cursorApiKey ??
			null,
		apiKey: asString(privateMeta.apiKey) ?? envDefaults.apiKey ?? null,
		bootstrapState: asBootstrapState(publicMeta.bootstrapState),
	};
}

/**
 * Read the current signed-in user's effective config. Throws if no user
 * is on the request -- the route should already have rejected via the
 * Clerk middleware, so this is a defensive double-check.
 */
export async function getUserConfig(): Promise<UserConfig> {
	const { userId } = await auth();
	if (!userId) throw new Error("getUserConfig called without an authenticated user");
	return getUserConfigById(userId);
}

export async function getUserConfigById(userId: string): Promise<UserConfig> {
	const client = await clerkClient();
	const user = await client.users.getUser(userId);
	const publicMeta = (user.publicMetadata ?? {}) as RawPublicMeta;
	const privateMeta = (user.privateMetadata ?? {}) as RawPrivateMeta;
	return buildConfig(publicMeta, privateMeta);
}

/**
 * Persist a partial config update. Anything in `patch` that's a known
 * secret moves into `privateMetadata`; everything else lands in
 * `publicMetadata`. We always write both halves rather than `null` out
 * fields the caller didn't pass -- the existing Clerk metadata is
 * merged with the patch.
 */
export async function setUserConfig(
	patch: Partial<UserConfig>,
): Promise<UserConfig> {
	const { userId } = await auth();
	if (!userId) throw new Error("setUserConfig called without an authenticated user");
	return setUserConfigById(userId, patch);
}

export async function setUserConfigById(
	userId: string,
	patch: Partial<UserConfig>,
): Promise<UserConfig> {
	const client = await clerkClient();
	const user = await client.users.getUser(userId);
	const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
	const existingPrivate = (user.privateMetadata ?? {}) as Record<string, unknown>;

	const nextPublic: Record<string, unknown> = { ...existingPublic };
	const nextPrivate: Record<string, unknown> = { ...existingPrivate };

	if (patch.agentKind !== undefined) nextPublic.agentKind = patch.agentKind;
	if (patch.providerKind !== undefined) nextPublic.providerKind = patch.providerKind;
	if (patch.machineSpec !== undefined) nextPublic.machineSpec = patch.machineSpec;
	if (patch.model !== undefined) nextPublic.model = patch.model;
	if (patch.setupStep !== undefined) nextPublic.setupStep = patch.setupStep;
	if (patch.machineId !== undefined) nextPublic.machineId = patch.machineId;
	if (patch.apiUrl !== undefined) nextPublic.apiUrl = patch.apiUrl;
	if (patch.bootstrapState !== undefined)
		nextPublic.bootstrapState = patch.bootstrapState;

	if (patch.dedalusApiKey !== undefined)
		nextPrivate.dedalusApiKey = patch.dedalusApiKey;
	if (patch.cursorApiKey !== undefined)
		nextPrivate.cursorApiKey = patch.cursorApiKey;
	if (patch.apiKey !== undefined) nextPrivate.apiKey = patch.apiKey;

	await client.users.updateUserMetadata(userId, {
		publicMetadata: nextPublic,
		privateMetadata: nextPrivate,
	});

	return buildConfig(nextPublic as RawPublicMeta, nextPrivate as RawPrivateMeta);
}

/**
 * Resolve the effective Dedalus environment for a user. The dashboard
 * read endpoints call this to get `{ apiKey, baseUrl, machineId }` --
 * one place to change if we ever switch storage backends.
 */
export async function getDedalusEnvForUser(): Promise<{
	apiKey: string;
	baseUrl: string;
	machineId: string;
}> {
	const config = await getUserConfig();
	const apiKey = config.dedalusApiKey;
	const machineId = config.machineId;
	const baseUrl = (process.env.DEDALUS_BASE_URL ?? "https://dcs.dedaluslabs.ai")
		.trim()
		.replace(/\/$/, "");
	if (!apiKey) {
		throw new Error(
			"DEDALUS_API_KEY is not set on this user. Complete /dashboard/setup first.",
		);
	}
	if (!machineId) {
		throw new Error(
			"HERMES_MACHINE_ID is not set on this user. Complete /dashboard/setup -> provision first.",
		);
	}
	return { apiKey, baseUrl, machineId };
}

/**
 * Resolve the effective Hermes gateway env for a user. Returns the
 * fields needed to call the OpenAI-compatible API.
 */
export async function getGatewayEnvForUser(): Promise<{
	apiUrl: string;
	apiKey: string;
	model: string;
}> {
	const config = await getUserConfig();
	const apiUrl = config.apiUrl;
	const apiKey = config.apiKey;
	if (!apiUrl) {
		throw new Error(
			"HERMES_API_URL is not set on this user. Run /dashboard/setup -> provision and wait for bootstrap to finish.",
		);
	}
	if (!apiKey) {
		throw new Error("HERMES_API_KEY is not set on this user.");
	}
	return {
		apiUrl: apiUrl.replace(/\/$/, ""),
		apiKey,
		model: config.model,
	};
}
