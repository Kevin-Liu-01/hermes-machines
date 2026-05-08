/**
 * GET / POST /api/dashboard/admin/setup
 *
 * The wizard's read-and-write endpoint. GET returns the caller's current
 * config (with secrets stripped). POST applies a partial patch.
 *
 * The wizard is multi-step but every step is its own POST -- we never
 * batch the wizard state on the client. That way a refresh during step 3
 * resumes from step 3 instead of restarting at step 1.
 *
 * Validation lives here (not in `setUserConfig`) so the wire-shape errors
 * surface as 400s with a useful message. `setUserConfig` is the storage
 * layer; this endpoint is the entry guard.
 */

import { auth } from "@clerk/nextjs/server";

import {
	getOwnerDefaults,
	getUserConfig,
	setUserConfig,
} from "@/lib/user-config/clerk";
import {
	AGENT_KINDS,
	PROVIDER_KINDS,
	SETUP_STEPS,
	toPublicConfig,
	type AgentKind,
	type MachineSpec,
	type ProviderKind,
	type SetupStep,
	type UserConfig,
} from "@/lib/user-config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAgent(value: unknown): value is AgentKind {
	return typeof value === "string" && (AGENT_KINDS as ReadonlyArray<string>).includes(value);
}

function isProvider(value: unknown): value is ProviderKind {
	return (
		typeof value === "string" &&
		(PROVIDER_KINDS as ReadonlyArray<string>).includes(value)
	);
}

function isStep(value: unknown): value is SetupStep {
	return typeof value === "string" && (SETUP_STEPS as ReadonlyArray<string>).includes(value);
}

function asSpec(value: unknown): MachineSpec | null {
	if (!value || typeof value !== "object") return null;
	const v = value as Record<string, unknown>;
	const vcpu = Number(v.vcpu);
	const mem = Number(v.memoryMib);
	const stor = Number(v.storageGib);
	if (!Number.isFinite(vcpu) || vcpu < 1 || vcpu > 16) return null;
	if (!Number.isFinite(mem) || mem < 512 || mem > 65_536) return null;
	if (!Number.isFinite(stor) || stor < 5 || stor > 200) return null;
	return { vcpu, memoryMib: mem, storageGib: stor };
}

type SetupBody = {
	dedalusApiKey?: string;
	cursorApiKey?: string;
	agentKind?: AgentKind;
	providerKind?: ProviderKind;
	machineSpec?: MachineSpec;
	model?: string;
	setupStep?: SetupStep;
};

export async function GET(): Promise<Response> {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	const config = await getUserConfig();
	const defaults = getOwnerDefaults();
	return Response.json({
		config: toPublicConfig(config),
		defaults: {
			machineSpec: defaults.machineSpec,
			model: defaults.model,
			hasOwnerDedalusKey: Boolean(defaults.dedalusApiKey),
			hasOwnerCursorKey: Boolean(defaults.cursorApiKey),
			hasOwnerMachine: Boolean(defaults.machineId),
		},
	});
}

export async function POST(request: Request): Promise<Response> {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	let body: SetupBody;
	try {
		body = (await request.json()) as SetupBody;
	} catch {
		return Response.json({ error: "invalid_json" }, { status: 400 });
	}

	const patch: Partial<UserConfig> = {};

	if (body.dedalusApiKey !== undefined) {
		const v = String(body.dedalusApiKey).trim();
		if (v.length > 0 && !v.startsWith("dsk-")) {
			return Response.json(
				{ error: "invalid_dedalus_key", message: "Dedalus keys start with 'dsk-'" },
				{ status: 400 },
			);
		}
		patch.dedalusApiKey = v.length > 0 ? v : undefined;
	}

	if (body.cursorApiKey !== undefined) {
		const v = String(body.cursorApiKey).trim();
		patch.cursorApiKey = v.length > 0 ? v : null;
	}

	if (body.agentKind !== undefined) {
		if (!isAgent(body.agentKind)) {
			return Response.json({ error: "invalid_agent_kind" }, { status: 400 });
		}
		patch.agentKind = body.agentKind;
	}

	if (body.providerKind !== undefined) {
		if (!isProvider(body.providerKind)) {
			return Response.json({ error: "invalid_provider_kind" }, { status: 400 });
		}
		// PR1 only wires Dedalus end-to-end; reject the others until PR4.
		if (body.providerKind !== "dedalus") {
			return Response.json(
				{
					error: "provider_unsupported",
					message: `Provider '${body.providerKind}' lands in PR4. Pick 'dedalus' for now.`,
				},
				{ status: 400 },
			);
		}
		patch.providerKind = body.providerKind;
	}

	if (body.machineSpec !== undefined) {
		const spec = asSpec(body.machineSpec);
		if (!spec) {
			return Response.json(
				{
					error: "invalid_machine_spec",
					message:
						"Spec must be { vcpu: 1-16, memoryMib: 512-65536, storageGib: 5-200 }",
				},
				{ status: 400 },
			);
		}
		patch.machineSpec = spec;
	}

	if (body.model !== undefined) {
		const m = String(body.model).trim();
		if (m.length > 0) patch.model = m;
	}

	if (body.setupStep !== undefined) {
		if (!isStep(body.setupStep)) {
			return Response.json({ error: "invalid_setup_step" }, { status: 400 });
		}
		patch.setupStep = body.setupStep;
	}

	const next = await setUserConfig(patch);
	return Response.json({ config: toPublicConfig(next) });
}
