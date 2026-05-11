/**
 * Vercel Sandbox provider.
 *
 * Sandbox is intentionally ephemeral: sessions time out and do not
 * provide durable `/home/machine` storage. We still model it through the
 * provider interface so short-lived code execution and agent-browser
 * workflows can sit beside persistent Dedalus/Fly machines without
 * pretending sleep/wake exist.
 */

import { Sandbox } from "@vercel/sandbox";

import {
	MachineProviderError,
	type ExecOptions,
	type ExecResult,
	type MachineProvider,
	type ProviderCapabilities,
	type ProviderMachineSummary,
	type ProvisionInput,
	type ProvisionResult,
} from "./types";

export type VercelSandboxCreds = {
	apiKey: string;
	teamId?: string;
	projectId?: string;
};

const UNSUPPORTED = (op: string): MachineProviderError =>
	new MachineProviderError(
		"vercel-sandbox",
		"not_supported",
		`Vercel Sandbox does not support ${op}; it is an ephemeral execution session, not a persistent sleeping machine.`,
	);

function mapStatus(status: string): ProviderMachineSummary["state"] {
	switch (status) {
		case "running":
			return "ready";
		case "pending":
			return "starting";
		case "stopping":
			return "destroying";
		case "stopped":
		case "aborted":
			return "destroyed";
		case "failed":
			return "error";
		default:
			return "unknown";
	}
}

export class VercelSandboxProvider implements MachineProvider {
	readonly kind = "vercel-sandbox" as const;
	readonly capabilities: ProviderCapabilities = {
		runtime: "ephemeral-session",
		canProvision: true,
		canWake: false,
		canSleep: false,
		canDestroy: true,
		canExec: true,
		hasPersistentDisk: false,
		usesExternalStorage: true,
	};
	private readonly apiKey: string;
	private readonly teamId: string | undefined;
	private readonly projectId: string | undefined;

	constructor(creds: VercelSandboxCreds) {
		if (!creds.apiKey) {
			throw new MachineProviderError(
				"vercel-sandbox",
				"missing_credentials",
				"Vercel API token is required for the Vercel Sandbox provider.",
			);
		}
		this.apiKey = creds.apiKey;
		this.teamId = creds.teamId;
		this.projectId = creds.projectId;
	}

	get hasCredentials(): boolean {
		return Boolean(this.apiKey);
	}

	async provision(input: ProvisionInput): Promise<ProvisionResult> {
		const sandbox = await Sandbox.create({
			token: this.apiKey,
			teamId: this.teamId,
			projectId: this.projectId,
			runtime: "node24",
			timeout: 45 * 60 * 1000,
			resources: { vcpus: Math.max(1, input.spec.vcpu) },
			env: {
				AGENT_KIND: input.agentKind ?? "hermes",
				AGENT_MODEL: input.model ?? "",
				...(input.env ?? {}),
			},
		});
		return {
			id: sandbox.sandboxId,
			state: mapStatus(sandbox.status),
			rawPhase: sandbox.status,
		};
	}

	async state(machineId: string): Promise<ProviderMachineSummary> {
		const sandbox = await Sandbox.get({
			sandboxId: machineId,
			token: this.apiKey,
			teamId: this.teamId,
			projectId: this.projectId,
		});
		return {
			id: sandbox.sandboxId,
			state: mapStatus(sandbox.status),
			rawPhase: sandbox.status,
			spec: {
				vcpu: 1,
				memoryMib: 2048,
				storageGib: 0,
			},
			createdAt: sandbox.createdAt.toISOString(),
			lastError: sandbox.status === "failed" ? "sandbox failed" : null,
		};
	}
	async wake(_machineId: string): Promise<ProviderMachineSummary> {
		throw UNSUPPORTED("wake");
	}
	async sleep(_machineId: string): Promise<ProviderMachineSummary> {
		throw UNSUPPORTED("sleep");
	}

	async destroy(machineId: string): Promise<void> {
		const sandbox = await Sandbox.get({
			sandboxId: machineId,
			token: this.apiKey,
			teamId: this.teamId,
			projectId: this.projectId,
		});
		await sandbox.stop({ blocking: true });
	}

	async exec(
		machineId: string,
		command: string,
		_options?: ExecOptions,
	): Promise<ExecResult> {
		const sandbox = await Sandbox.get({
			sandboxId: machineId,
			token: this.apiKey,
			teamId: this.teamId,
			projectId: this.projectId,
		});
		const result = await sandbox.runCommand("bash", ["-lc", command]);
		const [stdout, stderr] = await Promise.all([
			result.stdout(),
			result.stderr(),
		]);
		return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: result.exitCode };
	}
}
