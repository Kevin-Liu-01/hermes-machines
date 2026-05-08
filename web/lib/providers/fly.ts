/**
 * Fly Machines provider stub.
 *
 * Fly Machines (machines.dev API) are persistent Firecracker microVMs
 * with autostart-on-connect and global placement. They are a real
 * alternative to Dedalus for the persistent agent flavor, but the
 * lifecycle (apps + machines + secrets + volumes) is meaningfully
 * different and warrants its own bootstrap flow. That work lands in
 * PR4 alongside Vercel Sandbox.
 *
 * For PR-multi we accept the API token + org slug in the wizard and
 * ship this stub so the multi-provider plumbing is exercised. Calling
 * any operation here raises `not_supported`.
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

export type FlyCreds = {
	apiKey: string;
	orgSlug?: string;
};

const NOT_YET = (op: string): MachineProviderError =>
	new MachineProviderError(
		"fly",
		"not_supported",
		`Fly Machines ${op} is not wired yet. The provider is accepted by the wizard so the multi-tenant plumbing can store credentials and machine intent without pretending provisioning is live.`,
	);

export class FlyProvider implements MachineProvider {
	readonly kind = "fly" as const;
	private readonly apiKey: string;

	constructor(creds: FlyCreds) {
		if (!creds.apiKey) {
			throw new MachineProviderError(
				"fly",
				"missing_credentials",
				"Fly.io API token is required for the Fly provider.",
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
