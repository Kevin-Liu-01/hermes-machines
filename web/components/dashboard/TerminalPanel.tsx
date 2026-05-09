"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { BrailleSpinner } from "@/components/ui/BrailleSpinner";
import { cn } from "@/lib/cn";

/**
 * Lightweight terminal-style command surface.
 *
 * We deliberately did NOT pull in xterm.js / wterm: the goal here is
 * not a real PTY (Dedalus exec is a single-shot RPC, not an
 * interactive shell), it's a clean way for the operator to peek and
 * poke at their VM without dropping into the CLI. Each prompt becomes
 * one POST to `/api/dashboard/exec`; the response renders as a
 * scrollback entry with stdout, stderr, exit code, and duration.
 *
 * Persisted history is per-tab (sessionStorage) so a refresh keeps
 * the scrollback but a new tab starts clean. Up/Down recall walks the
 * command history like a real shell. Cmd+K / Ctrl+L clears the
 * scrollback. The starter chips at the top dump common diagnostic
 * commands into the input so the first run is one click.
 */

type Entry = {
	id: string;
	startedAt: string;
	finishedAt: string;
	command: string;
	exitCode: number | null;
	stdout: string;
	stderr: string;
	elapsedMs: number;
	error?: string;
	cwdHint?: string | null;
};

type ExecResponse = {
	ok?: boolean;
	error?: string;
	message?: string;
	startedAt?: string;
	finishedAt?: string;
	command?: string;
	exitCode?: number;
	stdout?: string;
	stderr?: string;
	elapsedMs?: number;
	retryAfterMs?: number;
};

const HISTORY_KEY = "agent-machines:terminal:history";
const SCROLLBACK_KEY = "agent-machines:terminal:scrollback";
const MAX_HISTORY = 200;
const MAX_SCROLLBACK = 100;

const STARTERS: ReadonlyArray<{ label: string; command: string; hint: string }> = [
	{
		label: "where am I",
		command: "whoami && hostname && pwd",
		hint: "user + host + cwd",
	},
	{
		label: "tail gateway",
		command: "tail -n 30 ~/.hermes/logs/gateway.log 2>/dev/null || echo '(no gateway log yet)'",
		hint: "last 30 lines",
	},
	{
		label: "list skills",
		command: "ls ~/.hermes/skills 2>/dev/null | head -40 || echo '(no skills dir yet)'",
		hint: "skills dir",
	},
	{
		label: "list MCPs",
		command: "ls ~/.hermes/mcps 2>/dev/null | head -40 || echo '(no MCP dir yet)'",
		hint: "mcps dir",
	},
	{
		label: "disk usage",
		command: "df -h /home/machine && echo --- && du -sh ~/.hermes ~/.openclaw ~/.agent-machines 2>/dev/null",
		hint: "/home/machine + agent paths",
	},
	{
		label: "running processes",
		command: "ps aux --sort=-pcpu | head -10",
		hint: "top by cpu",
	},
];

type Props = {
	/**
	 * Optional starting command. If supplied, shows up in the input
	 * but is not executed automatically -- the operator presses Enter.
	 * Used by the "tap a chip" UX above the input.
	 */
	initialCommand?: string;
};

export function TerminalPanel({ initialCommand }: Props) {
	const [input, setInput] = useState(initialCommand ?? "");
	const [entries, setEntries] = useState<Entry[]>([]);
	const [history, setHistory] = useState<string[]>([]);
	const [historyCursor, setHistoryCursor] = useState<number | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	// Hydrate persisted state on mount. Wrapped in try/catch because
	// localStorage can throw in private browsing modes.
	useEffect(() => {
		try {
			const rawHistory = window.sessionStorage.getItem(HISTORY_KEY);
			if (rawHistory) {
				const parsed = JSON.parse(rawHistory) as string[];
				if (Array.isArray(parsed)) setHistory(parsed.slice(-MAX_HISTORY));
			}
			const rawScroll = window.sessionStorage.getItem(SCROLLBACK_KEY);
			if (rawScroll) {
				const parsed = JSON.parse(rawScroll) as Entry[];
				if (Array.isArray(parsed)) setEntries(parsed.slice(-MAX_SCROLLBACK));
			}
		} catch {
			// Storage unavailable; in-memory mode is fine.
		}
	}, []);

	useEffect(() => {
		try {
			window.sessionStorage.setItem(
				SCROLLBACK_KEY,
				JSON.stringify(entries.slice(-MAX_SCROLLBACK)),
			);
		} catch {
			// Quota or unavailable; ignore.
		}
	}, [entries]);

	useEffect(() => {
		try {
			window.sessionStorage.setItem(
				HISTORY_KEY,
				JSON.stringify(history.slice(-MAX_HISTORY)),
			);
		} catch {
			// ignore
		}
	}, [history]);

	useEffect(() => {
		// Keep the scrollback pinned to the bottom whenever a new
		// entry lands. The user can scroll back manually after.
		const el = scrollRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [entries]);

	const submit = useCallback(
		async (commandRaw: string): Promise<void> => {
			const command = commandRaw.trim();
			if (!command || submitting) return;
			setSubmitting(true);
			setError(null);
			setHistoryCursor(null);
			setHistory((prev) => {
				const dedup = prev.filter((c) => c !== command);
				return [...dedup, command].slice(-MAX_HISTORY);
			});

			const tempId = `pending-${Date.now()}`;
			const startedAt = new Date().toISOString();
			setEntries((prev) =>
				[
					...prev,
					{
						id: tempId,
						startedAt,
						finishedAt: startedAt,
						command,
						exitCode: null,
						stdout: "",
						stderr: "",
						elapsedMs: 0,
					} satisfies Entry,
				].slice(-MAX_SCROLLBACK),
			);

			try {
				const response = await fetch("/api/dashboard/exec", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ command }),
				});
				const body = (await response
					.json()
					.catch(() => ({}) as ExecResponse)) as ExecResponse;
				if (!response.ok || body.ok === false) {
					const message =
						body.message ?? body.error ?? `exec failed (HTTP ${response.status})`;
					setEntries((prev) =>
						prev.map((entry) =>
							entry.id === tempId
								? {
										...entry,
										finishedAt: body.finishedAt ?? new Date().toISOString(),
										elapsedMs: body.elapsedMs ?? 0,
										stdout: body.stdout ?? "",
										stderr: body.stderr ?? "",
										exitCode:
											typeof body.exitCode === "number" ? body.exitCode : -1,
										error: message,
									}
								: entry,
						),
					);
					return;
				}
				setEntries((prev) =>
					prev.map((entry) =>
						entry.id === tempId
							? {
									...entry,
									finishedAt: body.finishedAt ?? new Date().toISOString(),
									elapsedMs: body.elapsedMs ?? 0,
									stdout: body.stdout ?? "",
									stderr: body.stderr ?? "",
									exitCode: body.exitCode ?? 0,
								}
							: entry,
					),
				);
			} catch (err) {
				const message = err instanceof Error ? err.message : "fetch failed";
				setError(message);
				setEntries((prev) =>
					prev.map((entry) =>
						entry.id === tempId
							? { ...entry, error: message, exitCode: -1 }
							: entry,
					),
				);
			} finally {
				setSubmitting(false);
				setInput("");
				setTimeout(() => inputRef.current?.focus(), 0);
			}
		},
		[submitting],
	);

	const onKey = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>): void => {
			// Ctrl/Cmd+L to clear scrollback. Mirrors a real shell.
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
				event.preventDefault();
				setEntries([]);
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				void submit(input);
				return;
			}
			if (event.key === "ArrowUp" && history.length > 0) {
				event.preventDefault();
				const next =
					historyCursor === null
						? history.length - 1
						: Math.max(0, historyCursor - 1);
				setHistoryCursor(next);
				setInput(history[next] ?? "");
				return;
			}
			if (event.key === "ArrowDown" && historyCursor !== null) {
				event.preventDefault();
				const next = historyCursor + 1;
				if (next >= history.length) {
					setHistoryCursor(null);
					setInput("");
				} else {
					setHistoryCursor(next);
					setInput(history[next] ?? "");
				}
				return;
			}
		},
		[input, history, historyCursor, submit],
	);

	function clearScrollback(): void {
		setEntries([]);
		try {
			window.sessionStorage.removeItem(SCROLLBACK_KEY);
		} catch {
			// ignore
		}
	}

	const stats = useMemo(() => statsFor(entries), [entries]);

	return (
		<section className="grid gap-3">
			{/* Starter strip: one-tap diagnostic prompts. */}
			<div className="flex flex-wrap items-center gap-2">
				<ReticleLabel>STARTERS</ReticleLabel>
				{STARTERS.map((s) => (
					<button
						key={s.command}
						type="button"
						onClick={() => {
							setInput(s.command);
							inputRef.current?.focus();
						}}
						title={`${s.hint} -- click to load into prompt`}
						className="border border-[var(--ret-border)] bg-[var(--ret-bg)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-dim)] transition-colors hover:border-[var(--ret-purple)]/40 hover:text-[var(--ret-purple)]"
					>
						{s.label}
					</button>
				))}
			</div>

			{/* Scrollback. Fixed-height region so the prompt stays glued
			    to the bottom of the viewport instead of disappearing on
			    long output. */}
			<div className="flex flex-col border border-[var(--ret-border)] bg-[var(--ret-bg)]">
				<div className="flex items-center justify-between gap-2 border-b border-[var(--ret-border)] px-3 py-2">
					<div className="flex items-center gap-2">
						<ReticleLabel>SCROLLBACK</ReticleLabel>
						<ReticleBadge>
							{stats.entryCount} {stats.entryCount === 1 ? "command" : "commands"}
						</ReticleBadge>
						{stats.failureCount > 0 ? (
							<ReticleBadge variant="warning">
								{stats.failureCount} non-zero
							</ReticleBadge>
						) : null}
					</div>
					<button
						type="button"
						onClick={clearScrollback}
						disabled={entries.length === 0}
						className={cn(
							"font-mono text-[10px] uppercase tracking-[0.18em]",
							entries.length === 0
								? "cursor-not-allowed text-[var(--ret-text-muted)]"
								: "text-[var(--ret-text-dim)] hover:text-[var(--ret-purple)]",
						)}
					>
						clear
					</button>
				</div>
				<div
					ref={scrollRef}
					className="max-h-[60vh] min-h-[280px] overflow-y-auto px-3 py-3 font-mono text-[12px]"
				>
					{entries.length === 0 ? (
						<div className="flex h-full flex-col items-start gap-1 py-6 text-[var(--ret-text-muted)]">
							<p className="text-[11px] uppercase tracking-[0.2em]">
								empty scrollback
							</p>
							<p className="max-w-[60ch] text-[12px] text-[var(--ret-text-dim)]">
								Run any shell command on the active machine. Use the
								starter chips above for one-tap diagnostics, or type your
								own. Ctrl/Cmd-L clears.
							</p>
						</div>
					) : (
						<ul className="flex flex-col gap-3">
							{entries.map((entry) => (
								<EntryRow key={entry.id} entry={entry} />
							))}
						</ul>
					)}
				</div>
				<div className="border-t border-[var(--ret-border)]">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							void submit(input);
						}}
						className="flex items-center gap-2 px-3 py-2"
					>
						<span
							aria-hidden="true"
							className="select-none font-mono text-[12px] text-[var(--ret-purple)]"
						>
							machine $
						</span>
						<input
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={onKey}
							placeholder="ls ~/.hermes/skills"
							disabled={submitting}
							spellCheck={false}
							autoCorrect="off"
							autoCapitalize="off"
							className="flex-1 bg-transparent font-mono text-[12px] text-[var(--ret-text)] outline-none placeholder:text-[var(--ret-text-muted)] disabled:opacity-60"
						/>
						{submitting ? (
							<BrailleSpinner className="text-[var(--ret-purple)]" />
						) : null}
						<ReticleButton
							as="button"
							type="submit"
							variant="primary"
							size="sm"
							disabled={!input.trim() || submitting}
						>
							run
						</ReticleButton>
					</form>
					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ret-border)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
						<span>history: up/down . clear: ctrl/cmd+L</span>
						{error ? (
							<span className="text-[var(--ret-red)]">! {error}</span>
						) : (
							<span>POST /api/dashboard/exec . 30s default timeout</span>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

function EntryRow({ entry }: { entry: Entry }) {
	const pending = entry.exitCode === null && !entry.error;
	const exitTone =
		entry.exitCode === null
			? "text-[var(--ret-text-muted)]"
			: entry.exitCode === 0
				? "text-[var(--ret-green)]"
				: "text-[var(--ret-red)]";
	return (
		<li className="border-l border-[var(--ret-border)] pl-3">
			<div className="flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
				<span>
					<span className="text-[var(--ret-purple)]">$</span>{" "}
					<span className="text-[var(--ret-text)] normal-case tracking-tight">
						{entry.command}
					</span>
				</span>
				<span className="flex items-baseline gap-2">
					<span className={exitTone}>
						{pending
							? "running"
							: entry.exitCode === null
								? "error"
								: `exit ${entry.exitCode}`}
					</span>
					{entry.elapsedMs > 0 ? (
						<span>{Math.round(entry.elapsedMs)}ms</span>
					) : null}
				</span>
			</div>
			{entry.stdout ? (
				<pre className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[var(--ret-text)]">
					{entry.stdout}
				</pre>
			) : null}
			{entry.stderr ? (
				<pre className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[var(--ret-amber)]">
					{entry.stderr}
				</pre>
			) : null}
			{entry.error ? (
				<p className="mt-1 text-[12px] text-[var(--ret-red)]">! {entry.error}</p>
			) : null}
		</li>
	);
}

function statsFor(entries: Entry[]) {
	let failureCount = 0;
	for (const entry of entries) {
		// One entry, one failure count -- the previous version
		// double-counted entries that had BOTH a non-zero exit and
		// an `error` field set (e.g. the "machine offline" 503 we
		// surface as both an explicit error string AND exit -1).
		const failed =
			(entry.exitCode !== null && entry.exitCode !== 0) || Boolean(entry.error);
		if (failed) failureCount += 1;
	}
	return { entryCount: entries.length, failureCount };
}
