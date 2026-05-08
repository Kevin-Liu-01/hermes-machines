"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/cn";
import { AGENT_KINDS, type AgentKind } from "@/lib/user-config/schema";

type Props = {
	value: AgentKind;
};

const LABEL: Record<AgentKind, string> = {
	hermes: "Hermes",
	openclaw: "OpenClaw",
};

const TAGLINE: Record<AgentKind, string> = {
	hermes: "self-improving . persistent memory",
	openclaw: "computer-use . shell + browser",
};

/**
 * Header dropdown that lets the user swap their agent personality. The
 * actual switch is a POST to `/api/dashboard/admin/setup` -- the
 * gateway behavior changes lazily on the next reload (PR2 will trigger
 * a SOUL.md rewrite + gateway restart so the change is immediate).
 *
 * Clicking outside the open menu collapses it. We don't use a portal
 * because the dropdown is small and the header is sticky -- z-index 50
 * is sufficient to cover the page below.
 */
export function AgentSwitcher({ value }: Props) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState<AgentKind | null>(null);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;
		function handler(event: MouseEvent) {
			if (!ref.current) return;
			if (ref.current.contains(event.target as Node)) return;
			setOpen(false);
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	async function pick(next: AgentKind) {
		if (next === value || pending) {
			setOpen(false);
			return;
		}
		setPending(next);
		try {
			const response = await fetch("/api/dashboard/admin/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ agentKind: next }),
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			router.refresh();
		} catch {
			// Swallow -- the next page navigation will refetch state.
		} finally {
			setPending(null);
			setOpen(false);
		}
	}

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className={cn(
					"flex items-center gap-2 border border-[var(--ret-border)] bg-[var(--ret-bg)] px-2 py-1 transition-colors",
					"hover:border-[var(--ret-border-hover)] hover:bg-[var(--ret-surface)]",
				)}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<BrandMark agent={value} size={14} gap="tight" withLabel={false} />
				<span className="font-mono text-[11px] text-[var(--ret-text)]">
					{LABEL[value]}
				</span>
				<svg
					viewBox="0 0 10 10"
					className="h-2 w-2 text-[var(--ret-text-muted)]"
					fill="currentColor"
				>
					<path d="M5 7 L1 3 H9 z" />
				</svg>
			</button>
			{open ? (
				<ul
					role="listbox"
					className="absolute right-0 top-[calc(100%+4px)] z-50 w-64 border border-[var(--ret-border)] bg-[var(--ret-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
				>
					{AGENT_KINDS.map((kind) => {
						const selected = kind === value;
						const inFlight = pending === kind;
						return (
							<li key={kind}>
								<button
									type="button"
									onClick={() => void pick(kind)}
									disabled={inFlight}
									className={cn(
										"flex w-full items-start gap-3 border-b border-[var(--ret-border)] px-3 py-2 text-left transition-colors last:border-b-0",
										selected
											? "bg-[var(--ret-purple-glow)] text-[var(--ret-purple)]"
											: "hover:bg-[var(--ret-surface)]",
									)}
								>
									<BrandMark
										agent={kind}
										size={14}
										gap="tight"
										withLabel={false}
									/>
									<span className="min-w-0 flex-1">
										<span className="block font-mono text-[12px] text-[var(--ret-text)]">
											{LABEL[kind]}
										</span>
										<span className="block font-mono text-[10px] text-[var(--ret-text-muted)]">
											{inFlight ? "switching..." : TAGLINE[kind]}
										</span>
									</span>
									{selected ? (
										<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-purple)]">
											active
										</span>
									) : null}
								</button>
							</li>
						);
					})}
				</ul>
			) : null}
		</div>
	);
}
