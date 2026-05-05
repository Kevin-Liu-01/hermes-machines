/**
 * `npm run deploy` — provision (or wake), bootstrap, and expose a Hermes Agent.
 *
 * The deploy is idempotent in three layers:
 *   1. State file. If a machine ID is recorded, we wake it instead of creating.
 *   2. Phase guards. Each bootstrap phase short-circuits when its work exists.
 *   3. Preview create. Hermes preview create is naturally idempotent per port.
 *
 * On success we print the public API URL, the dashboard URL, the API key,
 * and a one-line `npm run chat -- "..."` example. The state file is updated
 * so subsequent CLI commands reuse the same machine without re-deploying.
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runBootstrap } from "../lib/bootstrap.js";
import {
	loadState,
	makeClient,
	saveState,
	type MachineState,
} from "../lib/client.js";
import {
	DEPLOY_VERSION,
	PORT_API,
	PORT_DASHBOARD,
} from "../lib/constants.js";
import { loadConfig } from "../lib/env.js";
import {
	createMachine,
	getMachine,
	wakeMachine,
	waitForRunning,
} from "../lib/machine.js";
import { probeApi, generateApiServerKey } from "../lib/api.js";
import { dim, header, info, phase, success, warn } from "../lib/progress.js";

function repoRoot(): string {
	const here = fileURLToPath(import.meta.url);
	return resolve(here, "..", "..", "..");
}

async function ensurePreview(args: {
	client: ReturnType<typeof makeClient>;
	machineId: string;
	port: number;
}): Promise<string> {
	const existing = await args.client.machines.previews.list({
		machine_id: args.machineId,
	});
	const match = existing.items?.find(
		(p) => p.port === args.port && p.status === "ready",
	);
	if (match?.url) return match.url;

	const created = await args.client.machines.previews.create({
		machine_id: args.machineId,
		port: args.port,
		protocol: "http",
		visibility: "public",
	});
	return created.url ?? "";
}

export async function deploy(): Promise<void> {
	const config = loadConfig();
	const client = makeClient(config);
	const existing = loadState();
	const apiServerKey = existing?.apiServerKey ?? generateApiServerKey();

	header("Hermes Persistent — deploy");
	info(
		`Model: ${config.model}  ·  vCPU ${config.vcpu}  ·  ${config.memoryMib} MiB  ·  ${config.storageGib} GiB`,
	);

	const machineId = await phase("Provision or wake machine", async () => {
		if (existing?.machineId) {
			info(`  reusing machine ${existing.machineId}`);
			const machine = await getMachine(client, existing.machineId);
			if (machine.status.phase === "destroyed") {
				warn(`  recorded machine ${existing.machineId} is destroyed; creating a fresh one`);
			} else {
				const ready = await wakeMachine(client, machine);
				return ready.machine_id;
			}
		}
		const created = await createMachine(client, {
			vcpu: config.vcpu,
			memoryMib: config.memoryMib,
			storageGib: config.storageGib,
		});
		info(`  created ${created.machine_id}`);
		const ready = await waitForRunning(client, created.machine_id, (p) =>
			dim(`  phase: ${p}`),
		);
		return ready.machine_id;
	});

	await runBootstrap({
		client,
		machineId,
		config,
		apiServerKey,
		repoRoot: repoRoot(),
	});

	const apiPreviewUrl = await phase(
		`Expose API on public preview (port ${PORT_API})`,
		() => ensurePreview({ client, machineId, port: PORT_API }),
	);
	const dashboardPreviewUrl = await phase(
		`Expose dashboard on public preview (port ${PORT_DASHBOARD})`,
		() => ensurePreview({ client, machineId, port: PORT_DASHBOARD }),
	);

	const state: MachineState = {
		machineId,
		apiServerKey,
		apiPreviewUrl,
		dashboardPreviewUrl,
		deployedAt: new Date().toISOString(),
		deployVersion: DEPLOY_VERSION,
		model: config.model,
	};
	saveState(state);

	await phase("Probe API server health", async () => {
		const probe = await probeApi({ apiUrl: apiPreviewUrl, apiKey: apiServerKey });
		if (!probe.ok) {
			warn(`  /v1/models returned ${probe.status}: ${probe.body.slice(0, 200)}`);
			warn("  the gateway may still be warming; retry `npm run status` in 30s");
		} else {
			success(`  /v1/models OK (${probe.status})`);
		}
	});

	header("Ready");
	console.log(`  API URL:        ${apiPreviewUrl}/v1`);
	console.log(`  API Key:        ${apiServerKey}`);
	console.log(`  Dashboard:      ${dashboardPreviewUrl}`);
	console.log(`  Machine ID:     ${machineId}`);
	console.log("");
	console.log(`  Quick chat:     npm run chat -- "Say hi in one sentence."`);
	console.log(`  Curl:           curl ${apiPreviewUrl}/v1/chat/completions \\`);
	console.log(`                       -H "Authorization: Bearer ${apiServerKey}" \\`);
	console.log(`                       -H "Content-Type: application/json" \\`);
	console.log(`                       -d '{"model":"hermes-agent","messages":[{"role":"user","content":"hi"}]}'`);
	console.log("");
	console.log(`  Pause to save:  npm run sleep`);
	console.log(`  Resume:         npm run wake`);
	console.log(`  Permanently:    npm run destroy`);
}
