/**
 * Per-user configuration for the multi-tenant rig.
 *
 * Each signed-in user owns one of these, persisted to their Clerk
 * metadata (private fields encrypted at rest by Clerk; public fields
 * available to the client). The dashboard reads from this instead of
 * `process.env` so every user can have their own machine, their own
 * agent, and their own provider.
 *
 * The owner's Vercel env vars become the defaults via `getOwnerDefaults()`
 * so the project owner doesn't have to re-enter their own keys through
 * the wizard, and so anonymous-but-allowlisted callers fall through to
 * the existing behavior on the deployed instance.
 */

export type AgentKind = "hermes" | "openclaw";

export const AGENT_KINDS: ReadonlyArray<AgentKind> = ["hermes", "openclaw"];

/**
 * Where the agent's microVM lives. Currently only `dedalus` is wired
 * end-to-end; the others ship as placeholder stubs so the wizard
 * surfaces the choice and PR4 can fill them in.
 */
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
 * provisioned. Each phase is its own POST to
 * `/api/dashboard/admin/bootstrap/[phase]` (PR2). Phase IDs are stable
 * keys -- never reorder, only append new ones, otherwise the resume
 * logic on a partial run will skip phases.
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

/**
 * Wizard step the user has completed. The wizard reads this on mount
 * so a refresh during step 3 resumes there instead of restarting at
 * step 1. Persisted in public metadata since it's not sensitive.
 */
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

export type UserConfig = {
	agentKind: AgentKind;
	providerKind: ProviderKind;
	machineSpec: MachineSpec;
	model: string;

	/** Where the user is in the setup wizard. */
	setupStep: SetupStep;

	/* Sensitive -- private metadata only. Optional because new users
	 * have not yet provided them. */
	dedalusApiKey?: string;
	cursorApiKey?: string | null;
	apiKey?: string | null;

	/* Populated by the provision endpoint. */
	machineId?: string | null;
	apiUrl?: string | null;

	/** Bootstrap progress (PR2 wires this in; PR1 leaves it idle). */
	bootstrapState: BootstrapState;
};

export const DEFAULT_USER_CONFIG: UserConfig = {
	agentKind: "hermes",
	providerKind: "dedalus",
	machineSpec: DEFAULT_MACHINE_SPEC,
	model: DEFAULT_MODEL,
	setupStep: "api-key",
	bootstrapState: INITIAL_BOOTSTRAP_STATE,
};

/**
 * The subset of `UserConfig` safe to expose to the client. Strips every
 * key holding secrets so we never accidentally hydrate the browser with
 * a Dedalus or Cursor API key.
 */
export type PublicUserConfig = Omit<
	UserConfig,
	"dedalusApiKey" | "cursorApiKey" | "apiKey"
> & {
	hasDedalusKey: boolean;
	hasCursorKey: boolean;
	hasApiKey: boolean;
};

export function toPublicConfig(config: UserConfig): PublicUserConfig {
	const { dedalusApiKey, cursorApiKey, apiKey, ...rest } = config;
	return {
		...rest,
		hasDedalusKey: Boolean(dedalusApiKey),
		hasCursorKey: Boolean(cursorApiKey),
		hasApiKey: Boolean(apiKey),
	};
}

export function isProvisioned(config: UserConfig): boolean {
	return Boolean(config.machineId);
}
