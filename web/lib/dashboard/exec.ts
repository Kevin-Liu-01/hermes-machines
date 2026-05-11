/**
 * Server-side helper that runs a shell command on the user's active
 * machine through the selected provider's exec adapter.
 *
 * The dashboard uses this to peek at on-VM state -- list session DBs,
 * tail the gateway log, dump cursor-runs.jsonl. Each call is a single
 * roundtrip create-execution + poll-status + fetch-output, so latency
 * is measured in seconds, not milliseconds. We rate-limit by polling
 * pages every 30s rather than streaming.
 *
 * The dashboard is read-only by contract -- never run a command that
 * mutates state. Use the CLI for that. Commands here should look like
 * `cat`, `tail`, `ls`, never `rm` or `>`.
 *
 * Multi-tenant: the provider credentials and active machine come from
 * the Clerk-backed UserConfig. Each request resolves the caller's
 * machine, never a shared one.
 */

import { getProvider } from "@/lib/providers";
import { getUserConfig } from "@/lib/user-config/clerk";
import { activeMachine } from "@/lib/user-config/schema";

export type ExecResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export async function execOnMachine(
	command: string,
	options: { timeoutMs?: number } = {},
): Promise<ExecResult> {
	const config = await getUserConfig();
	const machine = activeMachine(config);
	if (!machine) {
		throw new Error("No active machine selected.");
	}
	const provider = getProvider(machine.providerKind, config.providers);
	return provider.exec(machine.id, command, {
		timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
	});
}

/**
 * True iff the live machine is currently in a state where an exec is
 * likely to succeed. Routes call this first so they can return a typed
 * "machine_offline" payload instead of timing out.
 *
 * Returns false on any failure -- missing config, network error, dead
 * machine -- so callers don't have to distinguish between failure modes
 * before falling back to the offline UI.
 */
export async function isMachineRunning(): Promise<boolean> {
	try {
		const config = await getUserConfig();
		const machine = activeMachine(config);
		if (!machine) return false;
		const provider = getProvider(machine.providerKind, config.providers);
		const summary = await provider.state(machine.id);
		return summary.state === "ready";
	} catch {
		return false;
	}
}
