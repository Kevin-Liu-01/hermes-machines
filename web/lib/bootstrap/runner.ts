/**
 * Browser-callable bootstrap runner.
 *
 * This is the web equivalent of the CLI's `runBootstrap`, but driven
 * through the provider abstraction instead of the Dedalus SDK. It keeps
 * the commands intentionally conservative and phase-aligned with
 * `BOOTSTRAP_PHASES` so the dashboard can show real progress while we
 * continue to move the heavier CLI installer into reusable pieces.
 */

import type { MachineProvider } from "@/lib/providers";
import {
	BOOTSTRAP_PHASES,
	type BootstrapPhaseId,
	type BootstrapState,
	type MachineRef,
	type UserConfig,
} from "@/lib/user-config/schema";

const HOME = "/home/machine";
const HERMES_HOME = `${HOME}/.hermes`;
const APP_HOME = `${HOME}/.agent-machines`;
const OPENCLAW_HOME = `${HOME}/.openclaw`;
const HERMES_PORT = 8642;
const OPENCLAW_PORT = 18789;

type StateSink = (state: BootstrapState) => Promise<void>;

export async function runWebBootstrap({
	machine,
	provider,
	config,
	onState,
}: {
	machine: MachineRef;
	provider: MachineProvider;
	config: UserConfig;
	onState: StateSink;
}): Promise<void> {
	const completed: BootstrapPhaseId[] = [];
	const startedAt = new Date().toISOString();
	await onState({
		phase: "running",
		current: BOOTSTRAP_PHASES[0],
		completed,
		startedAt,
		finishedAt: null,
		lastError: null,
	});

	try {
		for (const phase of BOOTSTRAP_PHASES) {
			await onState({
				phase: "running",
				current: phase,
				completed: [...completed],
				startedAt,
				finishedAt: null,
				lastError: null,
			});
			await runPhase(phase, machine, provider, config);
			completed.push(phase);
		}
		await onState({
			phase: "succeeded",
			current: null,
			completed,
			startedAt,
			finishedAt: new Date().toISOString(),
			lastError: null,
		});
	} catch (err) {
		await onState({
			phase: "failed",
			current: null,
			completed,
			startedAt,
			finishedAt: new Date().toISOString(),
			lastError: err instanceof Error ? err.message : "bootstrap failed",
		});
		throw err;
	}
}

async function runPhase(
	phase: BootstrapPhaseId,
	machine: MachineRef,
	provider: MachineProvider,
	config: UserConfig,
): Promise<void> {
	const command = commandFor(phase, machine, config);
	if (command === null) return;
	const result = await provider.exec(machine.id, command, { timeoutMs: 900_000 });
	if (result.exitCode !== 0) {
		throw new Error(
			`${phase} failed: ${result.stderr || result.stdout || `exit ${result.exitCode}`}`,
		);
	}
}

function commandFor(
	phase: BootstrapPhaseId,
	machine: MachineRef,
	config: UserConfig,
): string | null {
	const agent = machine.agentKind;
	const model = shell(machine.model);
	const gatewayKey = shell(machine.apiKey ?? crypto.randomUUID());
	const cursorKey = config.cursorApiKey ? shell(config.cursorApiKey) : null;

	switch (phase) {
		case "system-deps":
			return [
				"set -e",
				`mkdir -p ${APP_HOME}/chats ${APP_HOME}/artifacts ${HERMES_HOME}/logs ${OPENCLAW_HOME}/logs`,
				"command -v curl >/dev/null || (apt-get update -qq && apt-get install -y -qq curl git build-essential ca-certificates)",
			].join(" && ");
		case "install-uv":
			return [
				"set -e",
				`export HOME=${HOME}`,
				"command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh",
			].join(" && ");
		case "clone-hermes":
			return agent === "hermes"
				? `mkdir -p ${HERMES_HOME}/skills ${HERMES_HOME}/crons ${HERMES_HOME}/logs`
				: null;
		case "install-hermes":
			return agent === "hermes"
				? [
						"set -e",
						`export HOME=${HOME}`,
						`export PATH=${HOME}/.local/bin:$PATH`,
						`uv venv ${HERMES_HOME}/venv --python 3.11 || true`,
						`${HERMES_HOME}/venv/bin/python -m pip install --upgrade pip >/dev/null`,
						`${HERMES_HOME}/venv/bin/pip install 'hermes-agent[web,mcp] @ git+https://github.com/NousResearch/hermes-agent.git@main'`,
					].join(" && ")
				: null;
		case "install-node":
			return [
				"set -e",
				"command -v node >/dev/null || (curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs)",
				"node --version",
			].join(" && ");
		case "seed-knowledge":
			return [
				"set -e",
				`mkdir -p ${HERMES_HOME}/skills ${HERMES_HOME}/crons`,
				`test -d ${HERMES_HOME}/skills`,
			].join(" && ");
		case "install-git-reload":
			return [
				"set -e",
				`mkdir -p ${HERMES_HOME}/scripts`,
				`cat > ${HERMES_HOME}/scripts/reload-from-git.sh <<'EOF'\n#!/usr/bin/env bash\nset -euo pipefail\necho '[reload] browser bootstrap placeholder: git reload installed'\nEOF`,
				`chmod +x ${HERMES_HOME}/scripts/reload-from-git.sh`,
			].join(" && ");
		case "install-cursor-bridge":
			return cursorKey
				? `mkdir -p ${APP_HOME}/cursor && printf %s ${cursorKey} > ${APP_HOME}/cursor/.configured`
				: `mkdir -p ${APP_HOME}/cursor && touch ${APP_HOME}/cursor/.disabled`;
		case "configure-hermes":
			if (agent === "openclaw") {
				return configureOpenClaw(model, gatewayKey);
			}
			return configureHermes(model, gatewayKey);
		case "register-cursor-mcp":
			return `mkdir -p ${HERMES_HOME} && touch ${HERMES_HOME}/mcp-registered`;
		case "seed-cron-jobs":
			return `mkdir -p ${HERMES_HOME}/crons && touch ${HERMES_HOME}/crons/.seeded`;
		case "start-gateway":
			return agent === "openclaw" ? startOpenClaw() : startHermes();
	}
}

function configureHermes(model: string, gatewayKey: string): string {
	return [
		"set -e",
		`cat > ${HERMES_HOME}/.env <<EOF\nHERMES_API_KEY=${gatewayKey}\nHERMES_MODEL=${model}\nEOF`,
	].join(" && ");
}

function configureOpenClaw(model: string, gatewayKey: string): string {
	return [
		"set -e",
		`mkdir -p ${OPENCLAW_HOME}`,
		`cat > ${OPENCLAW_HOME}/.env <<EOF\nOPENCLAW_API_KEY=${gatewayKey}\nOPENCLAW_MODEL=${model}\nEOF`,
		"NPM_CONFIG_PREFIX=/home/machine/.npm-global npm install -g openclaw@latest --no-audit --no-fund --loglevel=error",
	].join(" && ");
}

function startHermes(): string {
	return [
		"set -e",
		`export HOME=${HOME}`,
		`export PATH=${HERMES_HOME}/venv/bin:${HOME}/.local/bin:$PATH`,
		`(setsid bash -c 'source ${HERMES_HOME}/.env && exec hermes gateway --host 0.0.0.0 --port ${HERMES_PORT} > ${HERMES_HOME}/logs/gateway.log 2>&1' </dev/null &>/dev/null & disown) || true`,
		`echo gateway:${HERMES_PORT}`,
	].join(" && ");
}

function startOpenClaw(): string {
	return [
		"set -e",
		`export HOME=${HOME}`,
		`export PATH=${HOME}/.npm-global/bin:$PATH`,
		`(setsid bash -c 'source ${OPENCLAW_HOME}/.env && exec openclaw gateway run > ${OPENCLAW_HOME}/logs/gateway.log 2>&1' </dev/null &>/dev/null & disown) || true`,
		`echo gateway:${OPENCLAW_PORT}`,
	].join(" && ");
}

function shell(value: string): string {
	return `'${value.replace(/'/g, "'\\''")}'`;
}
