"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleCard } from "@/components/reticle/ReticleCard";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { BrailleSpinner } from "@/components/ui/BrailleSpinner";
import { cn } from "@/lib/cn";
import type { Message } from "@/lib/types";

const STARTER_PROMPTS: ReadonlyArray<{ label: string; prompt: string }> = [
	{
		label: "Introduce yourself",
		prompt:
			"Introduce yourself in three sentences. Mention which skills you have loaded, which tools you can call (including any MCP servers), and which scheduled crons are running.",
	},
	{
		label: "Spawn a Cursor agent",
		prompt:
			"In /home/machine/work, scaffold a tiny TypeScript project that prints fibonacci(20). Use the cursor_agent tool with load_skills=['agent-ethos','taste-output']. Report what files it created and the final stdout.",
	},
	{
		label: "Show your skills",
		prompt:
			"List the skills installed in ~/.hermes/skills. For each, give a one-line description of what it does and when it would activate.",
	},
	{
		label: "Schedule a daily briefing",
		prompt:
			"Schedule a cron job to run every weekday at 8am that summarizes overnight changes in any active repos and writes the digest to ~/briefing.md.",
	},
];

function makeId(): string {
	return Math.random().toString(36).slice(2, 12);
}

type StreamState = "idle" | "streaming" | "error";

type HealthInfo = {
	ok: boolean;
	model?: string;
	apiHost?: string;
	error?: string;
};

async function* readSseDeltas(
	body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
	const reader = body.getReader();
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
				if (!line.startsWith("data:")) continue;
				const payload = line.slice(6).trim();
				if (payload === "[DONE]") return;
				try {
					const parsed = JSON.parse(payload);
					const delta: string = parsed.choices?.[0]?.delta?.content ?? "";
					if (delta) yield delta;
				} catch {
					// Hermes also emits hermes.tool.progress events that aren't
					// standard chat-completion chunks. Skip silently.
				}
			}
		}
	}
}

export type ChatProps = {
	messages: Message[];
	onMessagesChange: (next: Message[]) => void;
	onTurnComplete?: (final: Message[]) => void;
	disabled?: boolean;
	disabledReason?: string;
};

/**
 * Controlled chat component. Parent owns the message buffer; this
 * component owns the streaming state, the textarea, and SSE plumbing.
 *
 * `onTurnComplete` fires after the assistant finishes a stream so the
 * parent can persist the new turn (chat sidebar in dashboard chat).
 */
export function Chat({
	messages,
	onMessagesChange,
	onTurnComplete,
	disabled,
	disabledReason,
}: ChatProps) {
	const [input, setInput] = useState("");
	const [state, setState] = useState<StreamState>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [health, setHealth] = useState<HealthInfo | null>(null);
	const transcriptRef = useRef<HTMLDivElement>(null);
	const abortRef = useRef<AbortController | null>(null);
	const messagesRef = useRef(messages);
	messagesRef.current = messages;

	useEffect(() => {
		fetch("/api/health")
			.then((r) => r.json())
			.then((info: HealthInfo) => setHealth(info))
			.catch(() => setHealth({ ok: false, error: "unreachable" }));
	}, []);

	useEffect(() => {
		const node = transcriptRef.current;
		if (!node) return;
		node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
	}, [messages, state]);

	const send = useCallback(
		async (text: string) => {
			const trimmed = text.trim();
			if (!trimmed || state === "streaming" || disabled) return;

			setErrorMessage(null);
			const userMsg: Message = {
				id: makeId(),
				role: "user",
				content: trimmed,
				createdAt: Date.now(),
			};
			const assistantMsg: Message = {
				id: makeId(),
				role: "assistant",
				content: "",
				createdAt: Date.now(),
			};
			const next = [...messagesRef.current, userMsg, assistantMsg];
			onMessagesChange(next);
			messagesRef.current = next;
			setInput("");
			setState("streaming");

			const ctrl = new AbortController();
			abortRef.current = ctrl;

			try {
				const upstream = next.slice(0, -1).map((m) => ({
					role: m.role,
					content: m.content,
				}));
				const response = await fetch("/api/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ messages: upstream }),
					signal: ctrl.signal,
				});

				if (!response.ok || !response.body) {
					const detail = await response.json().catch(() => ({}));
					throw new Error(
						detail?.message || detail?.error || `HTTP ${response.status}`,
					);
				}

				let acc = "";
				for await (const delta of readSseDeltas(response.body)) {
					acc += delta;
					const updated = messagesRef.current.map((m) =>
						m.id === assistantMsg.id ? { ...m, content: acc } : m,
					);
					messagesRef.current = updated;
					onMessagesChange(updated);
				}
				setState("idle");
				onTurnComplete?.(messagesRef.current);
			} catch (err) {
				if (ctrl.signal.aborted) {
					setState("idle");
					return;
				}
				const message = err instanceof Error ? err.message : "unknown_error";
				setErrorMessage(message);
				setState("error");
				const trimmedMessages = messagesRef.current.filter(
					(m) => !(m.id === assistantMsg.id && m.content === ""),
				);
				messagesRef.current = trimmedMessages;
				onMessagesChange(trimmedMessages);
			} finally {
				abortRef.current = null;
			}
		},
		[disabled, onMessagesChange, onTurnComplete, state],
	);

	const stop = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		setState("idle");
	}, []);

	const onSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			send(input);
		},
		[input, send],
	);

	const onTextareaKey = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				send(input);
			}
		},
		[input, send],
	);

	const showStarters = messages.length === 0 && !disabled;
	const statusBadge = useMemo(() => {
		if (!health) {
			return (
				<ReticleBadge>
					<BrailleSpinner name="orbit" label="probing" className="text-[10px]" />
				</ReticleBadge>
			);
		}
		if (health.ok) {
			return (
				<ReticleBadge variant="success">
					<span className="inline-block h-1.5 w-1.5 bg-[var(--ret-green)]" />
					online
				</ReticleBadge>
			);
		}
		return <ReticleBadge variant="warning">offline</ReticleBadge>;
	}, [health]);

	return (
		<div className="flex flex-col gap-4">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<ReticleLabel>SESSION</ReticleLabel>
					{statusBadge}
					{health?.model ? (
						<span className="font-mono text-[11px] text-[var(--ret-text-dim)]">
							{health.model}
						</span>
					) : null}
				</div>
				<div className="flex items-center gap-2">
					{state === "streaming" ? (
						<ReticleButton variant="secondary" size="sm" onClick={stop}>
							Stop
						</ReticleButton>
					) : null}
				</div>
			</header>

			<ReticleCard hoverable={false} className="flex flex-col">
				<div
					ref={transcriptRef}
					className="flex max-h-[60vh] min-h-[420px] flex-col gap-5 overflow-y-auto p-5 md:p-7"
				>
					{disabled && disabledReason ? (
						<div className="border border-[var(--ret-amber)]/40 bg-[var(--ret-amber)]/5 p-4 font-mono text-[12px] text-[var(--ret-amber)]">
							{disabledReason}
						</div>
					) : null}
					{showStarters ? <StarterGrid onPick={send} /> : null}
					{messages.map((m) => (
						<MessageRow key={m.id} message={m} streaming={state === "streaming"} />
					))}
					{errorMessage ? (
						<div className="border border-[var(--ret-red)]/30 bg-[var(--ret-red)]/10 px-4 py-3 font-mono text-xs text-[var(--ret-red)]">
							error: {errorMessage}
						</div>
					) : null}
				</div>

				<form
					onSubmit={onSubmit}
					className="flex items-end gap-3 border-t border-[var(--ret-border)] p-4"
				>
					<textarea
						className={cn(
							"min-h-[44px] max-h-[200px] flex-1 resize-none",
							"border border-[var(--ret-border)] bg-[var(--ret-bg)]",
							"px-3 py-2.5 text-sm text-[var(--ret-text)]",
							"placeholder:text-[var(--ret-text-muted)]",
							"focus:border-[var(--ret-purple)] focus:outline-none",
							"font-mono",
						)}
						placeholder={
							disabled
								? "Pick or provision a machine first."
								: "Ask the agent something. Shift+Enter for newline."
						}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={onTextareaKey}
						rows={1}
						disabled={state === "streaming" || disabled}
					/>
					<ReticleButton
						type="submit"
						variant="primary"
						size="md"
						disabled={state === "streaming" || disabled || !input.trim()}
					>
						Send
					</ReticleButton>
				</form>
			</ReticleCard>
		</div>
	);
}

function StarterGrid({ onPick }: { onPick: (prompt: string) => void }) {
	return (
		<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
			{STARTER_PROMPTS.map((s) => (
				<button
					key={s.label}
					onClick={() => onPick(s.prompt)}
					className={cn(
						"group border border-[var(--ret-border)] bg-[var(--ret-bg)]",
						"p-4 text-left transition-colors duration-200",
						"hover:border-[var(--ret-border-hover)] hover:bg-[var(--ret-surface)]",
					)}
					type="button"
				>
					<p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)] transition-colors group-hover:text-[var(--ret-purple)]">
						{s.label}
					</p>
					<p className="mt-2 text-sm text-[var(--ret-text-dim)]">{s.prompt}</p>
				</button>
			))}
		</div>
	);
}

function MessageRow({
	message,
	streaming,
}: {
	message: Message;
	streaming: boolean;
}) {
	const isUser = message.role === "user";
	const isStreaming = streaming && !isUser && message.content === "";
	return (
		<div
			className={cn(
				"flex flex-col gap-1.5",
				isUser ? "items-end" : "items-start",
			)}
		>
			<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
				{isUser ? "you" : "agent"}
			</span>
			<div
				className={cn(
					"prose-msg max-w-[85%] px-4 py-3 text-sm leading-relaxed",
					isUser
						? "border border-[var(--ret-border)] bg-[var(--ret-surface)] text-[var(--ret-text)]"
						: "border border-[var(--ret-purple)]/30 bg-[var(--ret-purple-glow)] text-[var(--ret-text)]",
				)}
			>
				{isStreaming ? (
					<span className="ret-caret" aria-label="thinking" />
				) : (
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{message.content}
					</ReactMarkdown>
				)}
			</div>
		</div>
	);
}
