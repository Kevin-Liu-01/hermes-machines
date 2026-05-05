/**
 * Wrapper around the Dedalus execution API.
 *
 * Each `exec` call submits a command to the VM, polls the execution until it
 * reaches a terminal state, and returns stdout. Stderr is surfaced via thrown
 * errors so the deploy script fails loudly on any step.
 *
 * Quirks of the execution API discovered through the AgentWings baseline:
 *  - heredocs (`cat << 'EOF'`) are unreliable; we encode payloads as base64.
 *  - root filesystem is small (~2.4 GB); always pin caches/HOME to /home/machine.
 *  - guest agent needs ~5s after `phase=running` before the first exec succeeds.
 */

import type Dedalus from "dedalus";

const POLL_INTERVAL_MS = 1000;

export type ExecResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

export type ExecOptions = {
	timeoutMs?: number;
	silent?: boolean;
	stdin?: string;
};

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a shell command inside the machine and resolve once the execution
 * finishes. Throws when the execution exits non-zero or the API errors out.
 */
export async function exec(
	client: Dedalus,
	machineId: string,
	command: string,
	options: ExecOptions = {},
): Promise<ExecResult> {
	const timeoutMs = options.timeoutMs ?? 120_000;

	const created = await client.machines.executions.create({
		machine_id: machineId,
		command: ["/bin/bash", "-c", command],
		timeout_ms: timeoutMs,
		...(options.stdin !== undefined && { stdin: options.stdin }),
	});

	let result = created;
	while (result.status !== "succeeded" && result.status !== "failed") {
		if (result.status === "expired" || result.status === "cancelled") {
			throw new Error(
				`exec ${result.status} after ${timeoutMs}ms: ${command.slice(0, 80)}`,
			);
		}
		await sleep(POLL_INTERVAL_MS);
		result = await client.machines.executions.retrieve({
			machine_id: machineId,
			execution_id: created.execution_id,
		});
	}

	const output = await client.machines.executions.output({
		machine_id: machineId,
		execution_id: created.execution_id,
	});

	const stdout = output.stdout?.trim() ?? "";
	const stderr = output.stderr?.trim() ?? "";
	const exitCode = result.exit_code ?? (result.status === "succeeded" ? 0 : 1);

	if (result.status === "failed") {
		const tail = stderr || stdout || `exit ${exitCode}`;
		throw new Error(`exec failed (${exitCode}): ${tail.slice(0, 800)}`);
	}

	return { stdout, stderr, exitCode };
}

/**
 * Convenience: run a command and return its trimmed stdout.
 * Use when you don't care about stderr or the exit code.
 */
export async function execOut(
	client: Dedalus,
	machineId: string,
	command: string,
	options: ExecOptions = {},
): Promise<string> {
	const result = await exec(client, machineId, command, options);
	return result.stdout;
}

/**
 * Test whether a check command exits zero. Used for idempotency probes
 * (e.g. "is uv installed?", "is the gateway port bound?").
 */
export async function check(
	client: Dedalus,
	machineId: string,
	command: string,
): Promise<boolean> {
	try {
		const result = await exec(
			client,
			machineId,
			`${command} && echo __ok__ || echo __no__`,
			{ timeoutMs: 30_000 },
		);
		return result.stdout.includes("__ok__");
	} catch {
		return false;
	}
}
