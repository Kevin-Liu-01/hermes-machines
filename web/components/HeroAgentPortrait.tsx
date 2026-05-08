"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { cn } from "@/lib/cn";

/**
 * Client-only agent bust portrait shown on the landing hero.
 *
 * Lives in its own client component because `next/dynamic` with
 * `ssr: false` isn't allowed inside server components -- HeroBlock
 * stays a server component to keep the rest of the marketing surface
 * SSR-friendly. This isolates the WebGL boundary cleanly.
 *
 * Visual mirror of the dashboard IDENTITY card (156x156 panel,
 * cross-mark corners, agent caption beneath) plus a click affordance:
 * clicking the canvas cycles the previewed agent (Hermes <->
 * OpenClaw) and updates the caption underneath. The "default" badge
 * marks Hermes; flipping shows a "preview" badge for OpenClaw so the
 * default-vs-preview distinction stays visible.
 *
 * Until a dedicated OpenClaw diorama lands, both agents share the
 * Hermes wireframe scene; the badge + caption + accent border carry
 * the agent identity instead.
 */

const HermesBustScene = dynamic(
	() => import("@/components/three").then((m) => m.HermesBustScene),
	{ ssr: false, loading: () => null },
);

type Agent = "hermes" | "openclaw";

const META: Record<
	Agent,
	{
		label: string;
		source: string;
		tagline: string;
		mark: "nous" | "openclaw";
		isDefault: boolean;
	}
> = {
	hermes: {
		label: "Hermes",
		source: "by Nous Research",
		tagline: "memory . cron . sessions . MCP-native",
		mark: "nous",
		isDefault: true,
	},
	openclaw: {
		label: "OpenClaw",
		source: "by openclaw/openclaw",
		tagline: "computer use . browser . shell . vision",
		mark: "openclaw",
		isDefault: false,
	},
};

export function HeroAgentPortrait() {
	const [agent, setAgent] = useState<Agent>("hermes");
	const meta = META[agent];
	const other = agent === "hermes" ? "openclaw" : "hermes";
	const otherLabel = META[other].label;

	function toggle() {
		setAgent((cur) => (cur === "hermes" ? "openclaw" : "hermes"));
	}

	return (
		<aside className="relative hidden w-[170px] shrink-0 lg:block">
			<button
				type="button"
				onClick={toggle}
				aria-label={`Preview ${otherLabel} agent`}
				title={`Click to preview ${otherLabel}`}
				className={cn(
					"group relative block aspect-square w-full overflow-hidden border bg-[var(--ret-bg-soft)] transition-colors duration-200",
					"focus:outline-none focus:ring-1 focus:ring-[var(--ret-purple)]/60",
					meta.isDefault
						? "border-[var(--ret-border)] hover:border-[var(--ret-border-hover)]"
						: "border-[var(--ret-purple)]/55 shadow-[0_0_24px_var(--ret-purple-glow)] hover:border-[var(--ret-purple)]",
				)}
			>
				<HermesBustScene className="h-full w-full" />
				{/* Cross marks on the four corners pin the canvas into the
				    Reticle grid -- same treatment as the dashboard
				    IDENTITY card. */}
				<span className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 border-l border-t border-[var(--ret-cross)]" />
				<span className="pointer-events-none absolute right-1.5 top-1.5 h-2.5 w-2.5 border-r border-t border-[var(--ret-cross)]" />
				<span className="pointer-events-none absolute bottom-1.5 left-1.5 h-2.5 w-2.5 border-b border-l border-[var(--ret-cross)]" />
				<span className="pointer-events-none absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b border-r border-[var(--ret-cross)]" />
				{/* Status badge: default for Hermes, preview for OpenClaw */}
				<span
					className={cn(
						"pointer-events-none absolute left-1.5 top-1.5 z-10 border px-1 py-px font-mono text-[8px] uppercase tracking-[0.22em]",
						meta.isDefault
							? "border-[var(--ret-green)]/45 bg-[var(--ret-green)]/10 text-[var(--ret-green)]"
							: "border-[var(--ret-purple)]/45 bg-[var(--ret-purple-glow)] text-[var(--ret-purple)]",
					)}
				>
					{meta.isDefault ? "default" : "preview"}
				</span>
				{/* Click affordance: small "tap to swap" pill in the bottom right */}
				<span className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 border border-[var(--ret-border)] bg-[var(--ret-bg)]/85 px-1 py-px font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)] backdrop-blur-sm transition-opacity group-hover:text-[var(--ret-text-dim)]">
					<svg
						viewBox="0 0 10 10"
						className="h-2 w-2"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.4"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M2 4l-1 1 1 1M8 6l1-1-1-1M2 5h7" />
					</svg>
					tap
				</span>
			</button>
			<div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
				<Logo mark={meta.mark} size={10} />
				<span className="text-[var(--ret-text-dim)]">{meta.label}</span>
				<span className="text-[var(--ret-text-muted)]">. {meta.source}</span>
			</div>
			<p className="mt-0.5 font-mono text-[10px] leading-snug text-[var(--ret-text-muted)]">
				{meta.tagline}
			</p>
			<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ret-purple)]/80">
				{"->"} click to preview {otherLabel}
			</p>
		</aside>
	);
}
