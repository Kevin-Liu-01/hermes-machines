/**
 * Server-side Dedalus REST helpers.
 *
 * We talk to Dedalus directly with `fetch` instead of pulling in the full
 * `dedalus` SDK because the dashboard only needs read-only machine state.
 * Skipping the SDK keeps the Vercel function bundle small and the auth
 * surface obvious -- one header, one base URL, one endpoint per call.
 */

import type { MachinePhase, MachineSummary } from "./types";

type RawMachine = {
	machine_id: string;
	vcpu: number;
	memory_mib: number;
	storage_gib: number;
	created_at: string;
	configured_at?: string | null;
	desired_state: string;
	status: {
		phase: string;
		revision?: string | number;
		reason?: string | null;
		last_error?: string | null;
	};
};

const PHASE_ALLOW: ReadonlyArray<MachinePhase> = [
	"running",
	"sleeping",
	"starting",
	"wake_pending",
	"sleep_pending",
	"placement_pending",
	"accepted",
	"failed",
	"destroyed",
	"destroying",
];

function asPhase(value: string): MachinePhase {
	if ((PHASE_ALLOW as ReadonlyArray<string>).includes(value)) {
		return value as MachinePhase;
	}
	return "unknown";
}

function asDesired(value: string): MachineSummary["desired"] {
	if (value === "running" || value === "sleeping" || value === "destroyed") {
		return value;
	}
	return "unknown";
}

function getEnv() {
	const apiKey = process.env.DEDALUS_API_KEY?.trim();
	const baseUrl = (process.env.DEDALUS_BASE_URL ?? "https://dcs.dedaluslabs.ai")
		.trim()
		.replace(/\/$/, "");
	const machineId = process.env.HERMES_MACHINE_ID?.trim();
	if (!apiKey) throw new Error("DEDALUS_API_KEY is not set");
	if (!machineId) throw new Error("HERMES_MACHINE_ID is not set");
	return { apiKey, baseUrl, machineId };
}

async function fetchRawMachine(): Promise<RawMachine> {
	const { apiKey, baseUrl, machineId } = getEnv();
	const response = await fetch(`${baseUrl}/v1/machines/${machineId}`, {
		headers: { "X-API-Key": apiKey },
		cache: "no-store",
	});
	if (!response.ok) {
		throw new Error(
			`dedalus ${response.status}: ${(await response.text()).slice(0, 200)}`,
		);
	}
	return (await response.json()) as RawMachine;
}

function summarize(raw: RawMachine): MachineSummary {
	return {
		machineId: raw.machine_id,
		phase: asPhase(raw.status.phase),
		desired: asDesired(raw.desired_state),
		vcpu: raw.vcpu,
		memoryMib: raw.memory_mib,
		storageGib: raw.storage_gib,
		createdAt: raw.created_at,
		configuredAt: raw.configured_at ?? null,
		reason: raw.status.last_error ?? raw.status.reason ?? null,
	};
}

export async function fetchMachineSummary(): Promise<MachineSummary> {
	return summarize(await fetchRawMachine());
}

/**
 * Wake a sleeping machine. Idempotent: if already running, returns the
 * current summary without calling the API; if mid-transition, returns
 * whatever phase the machine is in so the UI can keep polling.
 *
 * Wake is a state-transition request -- Dedalus accepts it asynchronously
 * and the machine moves through `wake_pending` -> `starting` -> `running`.
 * We return immediately after submitting; the caller polls
 * `/api/dashboard/machine` to follow the transition.
 */
export async function wakeMachine(): Promise<MachineSummary> {
	const { apiKey, baseUrl, machineId } = getEnv();
	const raw = await fetchRawMachine();
	if (raw.status.phase === "running" || raw.status.phase === "wake_pending" || raw.status.phase === "starting") {
		return summarize(raw);
	}
	if (raw.status.phase !== "sleeping") {
		throw new Error(
			`cannot wake machine in phase '${raw.status.phase}'; expected 'sleeping'`,
		);
	}
	const revision = raw.status.revision;
	if (revision === undefined || revision === null) {
		throw new Error("machine has no revision token; cannot submit wake");
	}
	const response = await fetch(`${baseUrl}/v1/machines/${machineId}/wake`, {
		method: "POST",
		headers: {
			"X-API-Key": apiKey,
			"If-Match": String(revision),
		},
	});
	if (!response.ok) {
		throw new Error(
			`wake ${response.status}: ${(await response.text()).slice(0, 200)}`,
		);
	}
	return summarize(await fetchRawMachine());
}

/**
 * Sleep a running machine. Idempotent: returns the current summary
 * unchanged if the machine is already in any non-running state.
 */
export async function sleepMachine(): Promise<MachineSummary> {
	const { apiKey, baseUrl, machineId } = getEnv();
	const raw = await fetchRawMachine();
	if (raw.status.phase !== "running") return summarize(raw);
	const revision = raw.status.revision;
	if (revision === undefined || revision === null) {
		throw new Error("machine has no revision token; cannot submit sleep");
	}
	const response = await fetch(`${baseUrl}/v1/machines/${machineId}/sleep`, {
		method: "POST",
		headers: {
			"X-API-Key": apiKey,
			"If-Match": String(revision),
		},
	});
	if (!response.ok) {
		throw new Error(
			`sleep ${response.status}: ${(await response.text()).slice(0, 200)}`,
		);
	}
	return summarize(await fetchRawMachine());
}
