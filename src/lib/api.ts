/**
 * Helpers for talking to the deployed Hermes API server through the Dedalus
 * preview URL. We use plain fetch with SSE streaming because the Hermes API
 * is OpenAI-compatible and any client would do the same.
 */

import { randomBytes } from "node:crypto";

export function generateApiServerKey(): string {
	return `hp-${randomBytes(20).toString("hex")}`;
}

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type StreamChunk = {
	delta: string;
	done: boolean;
};

/**
 * Stream a chat completion from the Hermes API and yield text deltas.
 * Errors are surfaced inline so the caller sees failure without parsing SSE
 * frames manually.
 */
export async function* streamChat(args: {
	apiUrl: string;
	apiKey: string;
	model?: string;
	messages: ChatMessage[];
}): AsyncGenerator<StreamChunk> {
	const url = `${args.apiUrl.replace(/\/$/, "")}/v1/chat/completions`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${args.apiKey}`,
		},
		body: JSON.stringify({
			model: args.model ?? "hermes-agent",
			messages: args.messages,
			stream: true,
		}),
	});

	if (!response.ok || !response.body) {
		const text = await response.text().catch(() => "");
		throw new Error(`Hermes API ${response.status}: ${text.slice(0, 400)}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		const events = buffer.split("\n\n");
		buffer = events.pop() ?? "";

		for (const evt of events) {
			for (const line of evt.split("\n")) {
				if (!line.startsWith("data: ")) continue;
				const payload = line.slice(6).trim();
				if (payload === "[DONE]") {
					yield { delta: "", done: true };
					return;
				}
				try {
					const parsed = JSON.parse(payload);
					const delta: string = parsed.choices?.[0]?.delta?.content ?? "";
					if (delta) yield { delta, done: false };
				} catch {
					// Hermes also emits `event: hermes.tool.progress` frames that
					// are not standard chat.completion.chunk JSON. Skip silently.
				}
			}
		}
	}
	yield { delta: "", done: true };
}

/** Hit /v1/models on the Hermes API server to confirm it's healthy. */
export async function probeApi(args: {
	apiUrl: string;
	apiKey: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
	try {
		const response = await fetch(
			`${args.apiUrl.replace(/\/$/, "")}/v1/models`,
			{
				headers: { Authorization: `Bearer ${args.apiKey}` },
			},
		);
		const body = (await response.text()).slice(0, 400);
		return { ok: response.ok, status: response.status, body };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, status: 0, body: message };
	}
}
