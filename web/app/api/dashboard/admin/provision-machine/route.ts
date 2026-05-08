/**
 * POST /api/dashboard/admin/provision-machine
 *
 * Creates a fresh Dedalus machine for the calling user and saves the
 * resulting `machine_id` into their Clerk metadata so every subsequent
 * dashboard call resolves to it.
 *
 * Provisioning is split into two stages so the browser flow is snappy:
 *   1. POST /v1/machines (this endpoint) -- returns immediately with the
 *      machine ID. The wizard then polls `/api/dashboard/machine` to
 *      watch the phase advance from `accepted` -> `placement_pending`
 *      -> `starting` -> `running`.
 *   2. Bootstrap (PR2) -- runs the 12 install phases on the running VM.
 *      For PR1 the user runs `npm run deploy` locally to bootstrap.
 *
 * Idempotency: if the user already has a `machineId` we refuse unless
 * `force: true` is in the body. That stops a frantic double-click from
 * burning Dedalus quota on a duplicate machine.
 */

import { auth } from "@clerk/nextjs/server";

import { getUserConfig, setUserConfig } from "@/lib/user-config/clerk";
import {
	DEFAULT_MACHINE_SPEC,
	type MachineSpec,
} from "@/lib/user-config/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
	force?: boolean;
};

type RawMachine = {
	machine_id: string;
	status: { phase: string };
};

function asSpec(spec: MachineSpec | undefined): MachineSpec {
	return spec ?? DEFAULT_MACHINE_SPEC;
}

export async function POST(request: Request): Promise<Response> {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	let body: CreateBody = {};
	try {
		body = (await request.json().catch(() => ({}))) as CreateBody;
	} catch {
		body = {};
	}

	const config = await getUserConfig();
	if (!config.dedalusApiKey) {
		return Response.json(
			{
				error: "missing_dedalus_key",
				message:
					"No Dedalus API key on file. Save one in /dashboard/setup step 1 first.",
			},
			{ status: 400 },
		);
	}
	if (config.machineId && !body.force) {
		return Response.json(
			{
				error: "machine_exists",
				message: `Machine ${config.machineId} is already attached. Pass { force: true } to provision a new one (your old machine keeps running).`,
				machineId: config.machineId,
			},
			{ status: 409 },
		);
	}
	if (config.providerKind !== "dedalus") {
		return Response.json(
			{
				error: "provider_unsupported",
				message: `Provider '${config.providerKind}' lands in PR4. Switch to 'dedalus' in /dashboard/setup step 3.`,
			},
			{ status: 400 },
		);
	}

	const spec = asSpec(config.machineSpec);
	const baseUrl = (process.env.DEDALUS_BASE_URL ?? "https://dcs.dedaluslabs.ai")
		.trim()
		.replace(/\/$/, "");

	let raw: RawMachine;
	try {
		const response = await fetch(`${baseUrl}/v1/machines`, {
			method: "POST",
			headers: {
				"X-API-Key": config.dedalusApiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				vcpu: spec.vcpu,
				memory_mib: spec.memoryMib,
				storage_gib: spec.storageGib,
			}),
		});
		if (!response.ok) {
			const text = await response.text();
			return Response.json(
				{
					error: "dedalus_create_failed",
					status: response.status,
					message: text.slice(0, 400),
				},
				{ status: 502 },
			);
		}
		raw = (await response.json()) as RawMachine;
	} catch (err) {
		return Response.json(
			{
				error: "network_error",
				message: err instanceof Error ? err.message : "fetch failed",
			},
			{ status: 502 },
		);
	}

	await setUserConfig({
		machineId: raw.machine_id,
		setupStep: "provisioned",
	});

	return Response.json({
		ok: true,
		machineId: raw.machine_id,
		phase: raw.status.phase,
		message:
			"Machine accepted. Phase will advance to 'running' in 30-90s. Bootstrap install lands in PR2; for now run `npm run deploy` locally to install Hermes onto this machine.",
	});
}
