/**
 * Vercel Sandbox provider stub.
 *
 * Vercel Sandbox exposes Firecracker microVMs that live up to 45 minutes
 * each, with a `@vercel/sandbox` SDK. They are *ephemeral* by design --
 * no sleep/wake, no persistent disk -- which makes them a poor fit for
 * the persistent Hermes/OpenClaw model. Wiring them in productively
 * requires an "ephemeral session" agent flavor distinct from the
 * persistent Dedalus path; that is PR4 work.
 *
 * For PR-multi we accept the credentials in the wizard and ship this
 * stub so the rest of the multi-provider plumbing is exercised; the
 * stub's `provision`/`exec`/etc. raise `not_supported` so the UI can
 * render the right "coming soon" affordance instead of pretending.
 */

import {
	MachineProviderError,
	type ExecOptions,
	type ExecResult,
	type MachineProvider,
	type ProviderMachineSummary,
	type ProvisionInput,
	type ProvisionResult,
} from "./types";

export type VercelSandboxCreds = {
	apiKey: string;
	teamId?: string;
};

const NOT_YET = (op: string): MachineProviderError =>
	new MachineProviderError(
		"vercel-sandbox",
		"not_supported",
		`Vercel Sandbox ${op} is not yet wired in this PR. The provider is accepted by the wizard so the multi-tenant plumbing works end-to-end; full provisioning ships in PR4.`,
	);

export class VercelSandboxProvider implements MachineProvider {
	readonly kind = "vercel-sandbox" as const;
	private readonly apiKey: string;

	constructor(creds: VercelSandboxCreds) {
		if (!creds.apiKey) {
			throw new MachineProviderError(
				"vercel-sandbox",
				"missing_credentials",
				"Vercel API token is required for the Vercel Sandbox provider.",
			);
		}
		this.apiKey = creds.apiKey;
		void this.apiKey;
	}

	get hasCredentials(): boolean {
		return Boolean(this.apiKey);
	}

	async provision(_input: ProvisionInput): Promise<ProvisionResult> {
		throw NOT_YET("provision");
	}
	async state(_machineId: string): Promise<ProviderMachineSummary> {
		throw NOT_YET("state");
	}
	async wake(_machineId: string): Promise<ProviderMachineSummary> {
		throw NOT_YET("wake");
	}
	async sleep(_machineId: string): Promise<ProviderMachineSummary> {
		throw NOT_YET("sleep");
	}
	async destroy(_machineId: string): Promise<void> {
		throw NOT_YET("destroy");
	}
	async exec(
		_machineId: string,
		_command: string,
		_options?: ExecOptions,
	): Promise<ExecResult> {
		throw NOT_YET("exec");
	}
}
