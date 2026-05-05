import "dotenv/config";
import Dedalus from "dedalus";

const machineId = process.argv[2];
if (!machineId) {
	console.error("usage: tsx scripts/debug-vm.ts <machine-id>");
	process.exit(1);
}

const client = new Dedalus({
	xAPIKey: process.env.DEDALUS_API_KEY,
	baseURL: process.env.DEDALUS_BASE_URL ?? "https://dcs.dedaluslabs.ai",
});

async function exec(cmd: string, timeout = 60_000) {
	const e = await client.machines.executions.create({
		machine_id: machineId,
		command: ["/bin/bash", "-c", cmd],
		timeout_ms: timeout,
	});
	let r = e;
	while (r.status !== "succeeded" && r.status !== "failed") {
		await new Promise((res) => setTimeout(res, 1000));
		r = await client.machines.executions.retrieve({
			machine_id: machineId,
			execution_id: e.execution_id,
		});
	}
	const o = await client.machines.executions.output({
		machine_id: machineId,
		execution_id: e.execution_id,
	});
	console.log(`--- ${cmd}`);
	if (o.stdout?.trim()) console.log(o.stdout.trim());
	if (o.stderr?.trim()) console.log(`stderr: ${o.stderr.trim()}`);
	console.log(`exit ${r.exit_code} (${r.status})\n`);
}

const ENV =
	"export HOME=/home/machine && export VIRTUAL_ENV=/home/machine/.venv && " +
	"export PATH=/home/machine/.local/bin:/home/machine/.venv/bin:$PATH";

async function main() {
	await exec(`ls /home/machine/cursor-bridge/ 2>&1`);
	await exec(
		`${ENV} && cd /home/machine/cursor-bridge && rm -rf node_modules && npm install --no-audit --no-fund 2>&1 | tail -20`,
		600_000,
	);
	await exec(`${ENV} && cd /home/machine/cursor-bridge && npm run build 2>&1 | tail -20`);
	await exec(`ls /home/machine/cursor-bridge/dist/ 2>&1`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
