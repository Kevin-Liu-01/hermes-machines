"use client";

import dynamic from "next/dynamic";

import { Logo } from "@/components/Logo";

/**
 * Client-only Hermes bust portrait used in the landing hero.
 *
 * Lives in its own client component because `next/dynamic` with
 * `ssr: false` is not allowed inside a server component, and
 * HeroBlock stays a server component to keep the rest of the marketing
 * surface SSR-friendly. This isolates the WebGL boundary cleanly.
 *
 * Mirrors the dashboard IDENTITY card visually -- 156x156 panel,
 * cross-mark corners, "default" green badge, agent caption beneath --
 * so the marketing surface and the in-product card share a single
 * agent-personality language.
 */
const HermesBustScene = dynamic(
	() => import("@/components/three").then((m) => m.HermesBustScene),
	{ ssr: false, loading: () => null },
);

export function HeroAgentPortrait() {
	return (
		<aside className="relative hidden shrink-0 lg:block">
			<div className="relative aspect-square w-[156px] border border-[var(--ret-border)] bg-[var(--ret-bg-soft)]">
				<HermesBustScene className="h-full w-full" />
				{/* Cross marks on the four corners pin the canvas into the
				    Reticle grid -- same treatment as the dashboard
				    IDENTITY card. */}
				<span className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t border-[var(--ret-cross)]" />
				<span className="pointer-events-none absolute right-1.5 top-1.5 h-2.5 w-2.5 border-r border-t border-[var(--ret-cross)]" />
				<span className="pointer-events-none absolute bottom-1.5 left-1.5 h-2.5 w-2.5 border-b border-l border-[var(--ret-cross)]" />
				<span className="pointer-events-none absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r border-[var(--ret-cross)]" />
				<span className="pointer-events-none absolute right-1.5 top-1.5 z-10 border border-[var(--ret-green)]/45 bg-[var(--ret-green)]/10 px-1 py-px font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--ret-green)]">
					default
				</span>
			</div>
			<div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
				<Logo mark="nous" size={10} />
				<span className="text-[var(--ret-text-dim)]">Hermes</span>
				<span className="text-[var(--ret-text-muted)]">. by Nous Research</span>
			</div>
			<p className="font-mono text-[10px] tracking-wide text-[var(--ret-text-muted)]">
				swap to OpenClaw any time
			</p>
		</aside>
	);
}
