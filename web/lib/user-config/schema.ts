/**
 * Per-user configuration for the multi-tenant rig.
 *
 * Each signed-in user owns one of these, persisted to their Clerk
 * metadata. Sensitive fields (provider API keys, gateway bearers) live
 * in `privateMetadata`; everything client-readable lives in
 * `publicMetadata`.
 *
 * The shape supports multiple providers (Dedalus, Vercel Sandbox, Fly)
 * and multiple machines per user. Each machine has its own provider,
 * agent kind, spec, and (after install) gateway URL + bearer. The user
 * picks one as `activeMachineId` -- that's the one the chat surface
 * targets and the dashboard polls.
 *
 * Backward compatibility: legacy single-machine configs (`dedalusApiKey`,
 * `machineId`, `apiUrl`, `apiKey`) are migrated on read in clerk.ts so
 * deployed users don't lose state when this schema lands.
 */

export type AgentKind = "hermes" | "openclaw";

export const AGENT_KINDS: ReadonlyArray<AgentKind> = ["hermes", "openclaw"];

/** Where the agent's microVM lives. */
export type ProviderKind = "dedalus" | "vercel-sandbox" | "fly";

export const PROVIDER_KINDS: ReadonlyArray<ProviderKind> = [
	"dedalus",
	"vercel-sandbox",
	"fly",
];

export type MachineSpec = {
	vcpu: number;
	memoryMib: number;
	storageGib: number;
};

export const DEFAULT_MACHINE_SPEC: MachineSpec = {
	vcpu: 1,
	memoryMib: 2048,
	storageGib: 10,
};

export const DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

/**
 * The 12 bootstrap phases the wizard executes after a machine is
 * provisioned. Phase IDs are stable keys -- never reorder, only append.
 */
export const BOOTSTRAP_PHASES = [
	"system-deps",
	"install-uv",
	"clone-hermes",
	"install-hermes",
	"install-node",
	"seed-knowledge",
	"install-git-reload",
	"install-cursor-bridge",
	"configure-hermes",
	"register-cursor-mcp",
	"seed-cron-jobs",
	"start-gateway",
] as const;

export type BootstrapPhaseId = (typeof BOOTSTRAP_PHASES)[number];

export type BootstrapState = {
	phase: "idle" | "running" | "succeeded" | "failed";
	current: BootstrapPhaseId | null;
	completed: BootstrapPhaseId[];
	startedAt: string | null;
	finishedAt: string | null;
	lastError: string | null;
};

export const INITIAL_BOOTSTRAP_STATE: BootstrapState = {
	phase: "idle",
	current: null,
	completed: [],
	startedAt: null,
	finishedAt: null,
	lastError: null,
};

export type SetupStep =
	| "api-key"
	| "agent"
	| "provider"
	| "spec"
	| "review"
	| "provisioned";

export const SETUP_STEPS: ReadonlyArray<SetupStep> = [
	"api-key",
	"agent",
	"provider",
	"spec",
	"review",
	"provisioned",
];

/**
 * Per-provider credentials. Each entry is the API key plus any
 * provider-specific scoping the SDK needs (Vercel team, Fly org).
 *
 * Stored in Clerk privateMetadata; the public-config helper strips them.
 */
export type ProviderCredentials = {
	dedalus?: { apiKey: string };
	"vercel-sandbox"?: { apiKey: string; teamId?: string };
	fly?: { apiKey: string; orgSlug?: string };
};

/**
 * One machine the user owns. Lives in publicMetadata since these are
 * not secrets -- the gateway bearer is the only sensitive bit and it
 * lives in `apiKey` here for ergonomics (API routes need both URL and
 * key in the same call). The bearer is exposed only to the user's own
 * authenticated requests, never to other users.
 */
export type MachineRef = {
	id: string;
	providerKind: ProviderKind;
	agentKind: AgentKind;
	name: string;
	spec: MachineSpec;
	model: string;
	createdAt: string;
	apiUrl: string | null;
	apiKey: string | null;
	bootstrapState: BootstrapState;
	archived?: boolean;
};

export type UserConfig = {
	providers: ProviderCredentials;
	machines: MachineRef[];
	activeMachineId: string | null;
	cursorApiKey: string | null;
	setupStep: SetupStep;

	/* Wizard scratch -- the choices the user made last in the wizard,
	 * kept so the wizard's "review" step can use them as defaults for
	 * the next provision call. */
	draftAgentKind: AgentKind;
	draftProviderKind: ProviderKind;
	draftSpec: MachineSpec;
	draftModel: string;
};

export const DEFAULT_USER_CONFIG: UserConfig = {
	providers: {},
	machines: [],
	activeMachineId: null,
	cursorApiKey: null,
	setupStep: "api-key",
	draftAgentKind: "hermes",
	draftProviderKind: "dedalus",
	draftSpec: DEFAULT_MACHINE_SPEC,
	draftModel: DEFAULT_MODEL,
};

/**
 * Public-facing view of UserConfig. We strip secrets from
 * `providers` (just report which ones are configured) and from
 * `machines[].apiKey` (just report whether each gateway has a bearer
 * on file). The chat API uses the in-memory full config; the client
 * only ever sees the public projection.
 */
export type PublicProviderStatus = {
	configured: boolean;
	scopeHint?: string;
};

export type PublicMachineRef = Omit<MachineRef, "apiKey"> & {
	hasApiKey: boolean;
};

export type PublicUserConfig = Omit<
	UserConfig,
	"providers" | "machines" | "cursorApiKey"
> & {
	providers: Record<ProviderKind, PublicProviderStatus>;
	machines: PublicMachineRef[];
	hasCursorKey: boolean;
};

export function toPublicConfig(config: UserConfig): PublicUserConfig {
	const providers: Record<ProviderKind, PublicProviderStatus> = {
		dedalus: { configured: Boolean(config.providers.dedalus?.apiKey) },
		"vercel-sandbox": {
			configured: Boolean(config.providers["vercel-sandbox"]?.apiKey),
			scopeHint: config.providers["vercel-sandbox"]?.teamId,
		},
		fly: {
			configured: Boolean(config.providers.fly?.apiKey),
			scopeHint: config.providers.fly?.orgSlug,
		},
	};
	const machines: PublicMachineRef[] = config.machines.map((m) => {
		const { apiKey, ...rest } = m;
		return { ...rest, hasApiKey: Boolean(apiKey) };
	});
	return {
		providers,
		machines,
		activeMachineId: config.activeMachineId,
		setupStep: config.setupStep,
		draftAgentKind: config.draftAgentKind,
		draftProviderKind: config.draftProviderKind,
		draftSpec: config.draftSpec,
		draftModel: config.draftModel,
		hasCursorKey: Boolean(config.cursorApiKey),
	};
}

export function activeMachine(config: UserConfig): MachineRef | null {
	if (!config.activeMachineId) return null;
	return config.machines.find((m) => m.id === config.activeMachineId) ?? null;
}

export function isProvisioned(config: UserConfig): boolean {
	return config.machines.some((m) => !m.archived);
}

/**
 * Display name for a provider in compact spaces (badges, dropdown).
 * Kept in the schema layer because UI and API both need it.
 */
export const PROVIDER_LABEL: Record<ProviderKind, string> = {
	dedalus: "Dedalus",
	"vercel-sandbox": "Vercel Sandbox",
	fly: "Fly Machines",
};

export const AGENT_LABEL: Record<AgentKind, string> = {
	hermes: "Hermes",
	openclaw: "OpenClaw",
};
