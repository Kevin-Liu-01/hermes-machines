/**
 * Environment loading + validation. Fails fast with a helpful message
 * when DEDALUS_API_KEY is missing instead of letting the SDK 401 silently.
 */

import "dotenv/config";

import { DEFAULTS } from "./constants.js";

export type Config = {
	apiKey: string;
	machinesBaseUrl: string;
	chatBaseUrl: string;
	model: string;
	vcpu: number;
	memoryMib: number;
	storageGib: number;
};

function readNumber(key: string, fallback: number): number {
	const raw = process.env[key];
	if (!raw) return fallback;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`${key} must be a positive number, got "${raw}"`);
	}
	return parsed;
}

export function loadConfig(): Config {
	const apiKey = process.env.DEDALUS_API_KEY;
	if (!apiKey || apiKey === "dsk-live-replace-me") {
		throw new Error(
			"DEDALUS_API_KEY is missing. Copy .env.example to .env and set your key:\n" +
				"  cp .env.example .env\n" +
				"  echo 'DEDALUS_API_KEY=dsk-live-...' >> .env",
		);
	}

	return {
		apiKey,
		machinesBaseUrl: process.env.DEDALUS_BASE_URL ?? DEFAULTS.dedalusBaseUrl,
		chatBaseUrl: process.env.DEDALUS_CHAT_BASE_URL ?? DEFAULTS.dedalusChatBaseUrl,
		model: process.env.HERMES_MODEL ?? DEFAULTS.model,
		vcpu: readNumber("HERMES_VCPU", DEFAULTS.vcpu),
		memoryMib: readNumber("HERMES_MEMORY_MIB", DEFAULTS.memoryMib),
		storageGib: readNumber("HERMES_STORAGE_GIB", DEFAULTS.storageGib),
	};
}
