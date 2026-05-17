"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useState, type SVGProps } from "react";

import { SignedIn, SignedOut } from "@/components/AuthSwitch";
import {
	HERO_AGENTS,
	type HeroAgent,
} from "@/components/HeroAgentPortrait";
import { Logo, type CompositeMark } from "@/components/Logo";
import { ServiceIcon } from "@/components/ServiceIcon";
import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";

/* ── Per-agent 3D scenes (lazy) ── */

const HermesBustScene = dynamic(
	() => import("@/components/three").then((m) => m.HermesBustScene),
	{ ssr: false, loading: () => null },
);
const WireframeAgentScene = dynamic(
	() => import("@/components/three").then((m) => m.WireframeAgent),
	{ ssr: false, loading: () => null },
);
const HeadTriptychScene = dynamic(
	() => import("@/components/three").then((m) => m.HeadTriptych),
	{ ssr: false, loading: () => null },
);
const WireframeMachineScene = dynamic(
	() => import("@/components/three").then((m) => m.WireframeMachine),
	{ ssr: false, loading: () => null },
);
const WireframeDashboardScene = dynamic(
	() => import("@/components/three").then((m) => m.WireframeDashboard),
	{ ssr: false, loading: () => null },
);
const WireframeHostsScene = dynamic(
	() => import("@/components/three").then((m) => m.WireframeHosts),
	{ ssr: false, loading: () => null },
);
const WireframeEnvironmentScene = dynamic(
	() => import("@/components/three").then((m) => m.WireframeEnvironment),
	{ ssr: false, loading: () => null },
);

const AGENT_SCENE: Record<HeroAgent, React.ComponentType<{ className?: string }>> = {
	hermes: HermesBustScene,
	openclaw: WireframeAgentScene,
	"claude-code": HeadTriptychScene,
	codex: WireframeMachineScene,
};

/* ── Agent metadata ── */

const AGENT_WORD: Record<HeroAgent, string> = {
	hermes: "Persistent",
	openclaw: "Autonomous",
	"claude-code": "Stateful",
	codex: "Sandboxed",
};

const AGENT_CAPABILITIES: Record<HeroAgent, string[]> = {
	hermes: ["memory", "cron", "sessions", "MCP-native"],
	openclaw: ["computer use", "browser", "shell", "vision"],
	"claude-code": ["agentic coding", "file edit", "shell", "SDK"],
	codex: ["agentic coding", "sandbox", "exec mode"],
};

const AGENT_HUE: Record<HeroAgent, string> = {
	hermes: "#7c8cf8",
	openclaw: "#e5443b",
	"claude-code": "#d4a574",
	codex: "#4ae0a0",
};

const AGENT_MARK: Record<HeroAgent, CompositeMark> = {
	hermes: "nous",
	openclaw: "openclaw",
	"claude-code": "anthropic",
	codex: "openai",
};

const AGENT_LABEL: Record<HeroAgent, string> = {
	hermes: "Hermes",
	openclaw: "OpenClaw",
	"claude-code": "Claude Code",
	codex: "Codex CLI",
};

/* ── Animated heading word ── */

function AnimatedWord({ word, hue }: { word: string; hue: string }) {
	const [display, setDisplay] = useState(word);
	const [animating, setAnimating] = useState(false);

	useEffect(() => {
		if (word === display) return;
		setAnimating(true);
		const t = setTimeout(() => {
			setDisplay(word);
			setAnimating(false);
		}, 200);
		return () => clearTimeout(t);
	}, [word, display]);

	return (
		<span
			className="inline-block transition-all duration-200"
			style={{
				color: hue,
				opacity: animating ? 0 : 1,
				transform: animating ? "translateY(8px)" : "translateY(0)",
				filter: animating ? "blur(2px)" : "blur(0)",
			}}
		>
			{display}
		</span>
	);
}

/* ── Grid cell with hover visuals ── */

function Cell({
	action,
	agent,
	hue,
	children,
	className,
	hoverVisual,
	noLabel,
}: {
	action: string;
	agent: HeroAgent;
	hue: string;
	children?: ReactNode;
	className?: string;
	hoverVisual?: ReactNode;
	noLabel?: boolean;
}) {
	return (
		<div
			className={`group/cell relative border-b border-r border-[var(--ret-border)] transition-colors duration-200 ${className ?? ""}`}
		>
			{children}
			<div className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-200 group-hover/cell:opacity-100">
				{hoverVisual ?? (
					<div className="absolute inset-0" style={{ background: `${hue}08` }} />
				)}
				{!noLabel && (
					<div
						className="absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-12px)] items-center gap-1.5 border px-1.5 py-0.5"
						style={{ borderColor: `${hue}44`, background: "var(--ret-bg)" }}
					>
						<Logo mark={AGENT_MARK[agent]} size={9} />
						<span className="truncate font-mono text-[8px]" style={{ color: hue }}>
							{action}
						</span>
						<span
							className="h-1 w-1 shrink-0 animate-pulse rounded-full"
							style={{ background: hue }}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

/* ── Hover visual primitives ── */

function HoverHatch({ color, angle = 135 }: { color: string; angle?: number }) {
	return (
		<div
			className="absolute inset-0"
			style={{
				backgroundImage: `repeating-linear-gradient(${angle}deg, ${color}18 0 1px, transparent 1px 6px)`,
			}}
		/>
	);
}

function HoverGlow({ color }: { color: string }) {
	return (
		<div
			className="absolute inset-0"
			style={{
				background: `radial-gradient(circle at center, ${color}15 0%, transparent 70%)`,
			}}
		/>
	);
}

function HoverPulseGrid({ color }: { color: string }) {
	return (
		<div className="absolute inset-0 flex items-center justify-center">
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `
						linear-gradient(${color}10 1px, transparent 1px),
						linear-gradient(90deg, ${color}10 1px, transparent 1px)
					`,
					backgroundSize: "12px 12px",
				}}
			/>
			<div
				className="h-3 w-3 animate-pulse rounded-full"
				style={{ background: color, boxShadow: `0 0 20px ${color}` }}
			/>
		</div>
	);
}

function HoverScene({ Scene }: { Scene: React.ComponentType<{ className?: string }> }) {
	return (
		<div className="absolute inset-0">
			<Scene className="h-full w-full" />
		</div>
	);
}

function HoverGradient({ color }: { color: string }) {
	return (
		<div
			className="absolute inset-0"
			style={{ background: `linear-gradient(135deg, ${color}0c 0%, transparent 60%)` }}
		/>
	);
}

/* ── Agent rail cell for column 1 ── */

const RAIL_AGENTS: ReadonlyArray<{
	mark: CompositeMark;
	label: string;
	id: HeroAgent | null;
}> = [
	{ mark: "nous", label: "Hermes", id: "hermes" },
	{ mark: "openclaw", label: "OpenClaw", id: "openclaw" },
	{ mark: "anthropic", label: "Claude", id: "claude-code" },
	{ mark: "openai", label: "Codex", id: "codex" },
	{ mark: "cursor", label: "Cursor", id: null },
];

function agentRailCell(
	agentId: HeroAgent | null,
	row: number,
	activeAgent: HeroAgent,
	setAgent: (a: HeroAgent) => void,
) {
	const railAgent = agentId !== null
		? RAIL_AGENTS.find((a) => a.id === agentId)!
		: RAIL_AGENTS[4];
	const isSelectable = railAgent.id !== null;
	const active = isSelectable && activeAgent === railAgent.id;
	const agentHue = railAgent.id ? AGENT_HUE[railAgent.id] : "var(--ret-purple)";

	return (
		<button
			key={`rail-${row}`}
			type="button"
			onClick={() => isSelectable && railAgent.id && setAgent(railAgent.id)}
			className="hidden cursor-pointer border-b border-r border-[var(--ret-border)] transition-colors hover:bg-[var(--ret-surface)] md:flex md:flex-col md:items-center md:justify-center md:gap-1 md:px-3 md:py-3"
			style={{
				borderLeft: active ? `2px solid ${agentHue}` : "2px solid transparent",
				gridColumn: "1",
				gridRow: `${row}`,
			}}
		>
			<Logo mark={railAgent.mark} size={16} />
			<span
				className="text-[8px] font-medium"
				style={{ color: active ? "var(--ret-text)" : "var(--ret-text-muted)" }}
			>
				{railAgent.label}
			</span>
			{isSelectable && (
				<span
					className="h-1 w-1 rounded-full transition-opacity"
					style={{ background: agentHue, opacity: active ? 1 : 0.15 }}
				/>
			)}
		</button>
	);
}

/* ── Main component ── */

export function HeroBlock() {
	const [agent, setAgent] = useState<HeroAgent>("hermes");
	const capabilities = AGENT_CAPABILITIES[agent];
	const hue = AGENT_HUE[agent];
	const Scene = AGENT_SCENE[agent];

	/* Auto-cycle agents every 6s when idle */
	useEffect(() => {
		const id = setInterval(() => {
			setAgent((cur) => {
				const idx = HERO_AGENTS.indexOf(cur);
				return HERO_AGENTS[(idx + 1) % HERO_AGENTS.length];
			});
		}, 6000);
		return () => clearInterval(id);
	}, []);

	return (
		<div className="relative overflow-hidden">
			{/* ── Announcement banner ── */}
			<a
				href="https://dedaluslabs.ai"
				target="_blank"
				rel="noopener noreferrer"
				className="group/banner flex items-center gap-3 border-b border-[var(--ret-border)] bg-[var(--ret-bg-soft)] px-5 py-2 transition-colors hover:bg-[var(--ret-surface)]"
			>
				<Logo mark="dedalus" size={14} />
				<span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
					Dedalus Machines
				</span>
				<span className="hidden text-[9px] text-[var(--ret-text-muted)] sm:inline">·</span>
				<span className="hidden text-[10px] text-[var(--ret-text-dim)] sm:inline">
					Now in alpha — persistent VMs for AI agents
				</span>
				<span className="ml-auto flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-[var(--ret-purple)] opacity-70 transition-opacity group-hover/banner:opacity-100">
					dedaluslabs.ai
					<IconArrowRight className="h-2.5 w-2.5" />
				</span>
			</a>

			{/* ── Single unified grid: col 1 = rail, cols 2-8 = content ── */}
			<div className="grid grid-cols-4 auto-rows-auto md:grid-cols-[auto_repeat(7,1fr)]">

				{/* ═══ Row 1: Automation tools | Kicker + empty ═══ */}
				<Cell action="loading cron drivers..." agent={agent} hue={hue} className="hidden md:flex md:items-center md:justify-center" hoverVisual={<HoverGlow color={hue} />}>
					<div className="flex flex-col items-center gap-1.5 px-3 py-3">
						<span className="text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">Automate</span>
						<div className="grid grid-cols-2 gap-1">
							<ServiceIcon slug="vercel" size={12} tone="mono" />
							<ServiceIcon slug="github" size={12} tone="mono" />
							<ServiceIcon slug="slack" size={12} tone="mono" />
							<ServiceIcon slug="linear" size={12} tone="mono" />
						</div>
					</div>
				</Cell>
				<Cell action="reading project metadata..." agent={agent} hue={hue} className="col-span-3" hoverVisual={<HoverGradient color={hue} />}>
					<div className="flex flex-wrap items-center gap-2 px-5 py-4">
						<ReticleLabel>DEVELOPED BY</ReticleLabel>
						<ReticleBadge variant="accent">KEVIN LIU</ReticleBadge>
						<ReticleBadge>DEDALUS LABS</ReticleBadge>
					</div>
				</Cell>
				<Cell action="scanning org graph..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverHatch color={hue} />} />
				<Cell action="resolving license..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverPulseGrid color={hue} />} />
				<Cell action="checking version..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverGlow color={hue} />}>
					<div className="flex h-full items-center justify-center gap-1.5 px-2 py-3">
						<span className="text-[8px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">VER</span>
						<span className="font-mono text-[9px] text-[var(--ret-text-dim)]">0.1.0</span>
					</div>
				</Cell>
				<Cell action="polling status..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverHatch color={hue} angle={45} />}>
					<div className="flex h-full items-center justify-center gap-1.5 px-2 py-3">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ret-green)]" />
						<ReticleBadge variant="success" className="!py-0 !text-[7px]">LIVE</ReticleBadge>
					</div>
				</Cell>

				{/* ═══ Rows 2-3: 5 agents stacked in col 1 | Heading + 3D ═══ */}
				<div
					className="hidden border-b border-r border-[var(--ret-border)] md:block"
					style={{ gridColumn: "1", gridRow: "2 / 4" }}
				>
					<div className="flex h-full flex-col">
						{RAIL_AGENTS.map((a) => {
							const isSelectable = a.id !== null;
							const active = isSelectable && agent === a.id;
							const agentHue = a.id ? AGENT_HUE[a.id] : "var(--ret-purple)";
							return (
								<button
									key={a.label}
									type="button"
									onClick={() => isSelectable && a.id && setAgent(a.id)}
									className="flex flex-1 flex-col items-center justify-center gap-0.5 border-b border-[var(--ret-border)] px-3 transition-colors last:border-b-0 hover:bg-[var(--ret-surface)]"
									style={{
										borderLeft: active ? `2px solid ${agentHue}` : "2px solid transparent",
									}}
								>
									<Logo mark={a.mark} size={15} />
									<span
										className="text-[7px] font-medium"
										style={{ color: active ? "var(--ret-text)" : "var(--ret-text-muted)" }}
									>
										{a.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				<Cell
					action="generating copy variant..."
					agent={agent} hue={hue}
					className="col-span-4 md:col-span-5 md:row-span-2 !border-r-0"
					hoverVisual={<HoverGlow color={hue} />}
				>
					<div className="h-full border-r border-[var(--ret-border)] bg-[var(--ret-border)]">
						<div className="h-full rounded-3xl bg-[var(--ret-bg)]">
							<div className="px-6 py-10 md:px-10 md:py-16">
								<h1 className="ret-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.95] tracking-tight">
									<span className="block whitespace-nowrap">
										<AnimatedWord word={AGENT_WORD[agent]} hue={hue} />
										{" "}Machines
									</span>
									<span className="block text-[var(--ret-text-muted)]">
										for your Agent.
									</span>
								</h1>
							</div>
						</div>
					</div>
				</Cell>
				<Cell
					action="rendering wireframe..."
					agent={agent} hue={hue}
					className="hidden bg-[var(--ret-bg-soft)] md:col-span-2 md:row-span-2 md:block"
					hoverVisual={<HoverGlow color={hue} />}
				>
					<div className="relative h-full min-h-[200px]">
						<Scene className="h-full w-full" />
						<span className="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-[var(--ret-cross)]" />
						<span className="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-[var(--ret-cross)]" />
						<span className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b border-l border-[var(--ret-cross)]" />
						<span className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-[var(--ret-cross)]" />
						<span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
							RUNNING {AGENT_LABEL[agent]}
						</span>
					</div>
				</Cell>

				{/* ═══ Row 4: Code tools | Description + spec cells ═══ */}
				<Cell action="connecting dev tools..." agent={agent} hue={hue} className="hidden md:flex md:items-center md:justify-center" hoverVisual={<HoverHatch color={hue} angle={135} />}>
					<div className="flex flex-col items-center gap-1.5 px-3 py-3">
						<span className="text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">Code</span>
						<div className="grid grid-cols-2 gap-1">
							<ServiceIcon slug="typescript" size={12} tone="mono" />
							<ServiceIcon slug="nextdotjs" size={12} tone="mono" />
							<ServiceIcon slug="tailwindcss" size={12} tone="mono" />
							<ServiceIcon slug="react" size={12} tone="mono" />
						</div>
					</div>
				</Cell>
				<Cell action="analyzing value proposition..." agent={agent} hue={hue} className="col-span-4" hoverVisual={<HoverGradient color={hue} />}>
					<div className="px-5 py-5">
						<p className="max-w-[56ch] text-[15px] leading-relaxed text-[var(--ret-text-dim)]">
							One stateful microVM per account.{" "}
							<strong className="text-[var(--ret-text)]">
								Boot in 30 seconds, sleep on idle, wake on the first prompt.
							</strong>
						</p>
					</div>
				</Cell>
				<Cell action="provisioning VM..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverGlow color={hue} />}>
					<div className="flex h-full flex-col items-center justify-center px-2 py-4">
						<span className="text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">RUNTIME</span>
						<span className="mt-1 text-[13px] font-medium tabular-nums text-[var(--ret-text-dim)]">microVM</span>
					</div>
				</Cell>
				<Cell action="cold start benchmark..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverPulseGrid color={hue} />}>
					<div className="flex h-full flex-col items-center justify-center px-2 py-4">
						<span className="text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">BOOT</span>
						<span className="mt-1 text-[13px] font-medium tabular-nums text-[var(--ret-text-dim)]">~30s</span>
					</div>
				</Cell>
				<Cell action="mounting volumes..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverHatch color={hue} angle={45} />}>
					<div className="flex h-full flex-col items-center justify-center px-2 py-4">
						<span className="text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">PERSIST</span>
						<span className="mt-1 text-[13px] font-medium tabular-nums text-[var(--ret-text-dim)]">disk + mem</span>
					</div>
				</Cell>

				{/* ═══ Row 5: Data tools | Capabilities + empty ═══ */}
				<Cell action="mounting data stores..." agent={agent} hue={hue} className="hidden md:flex md:items-center md:justify-center" hoverVisual={<HoverGlow color={hue} />}>
					<div className="flex flex-col items-center gap-1.5 px-3 py-3">
						<span className="text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">Data</span>
						<div className="grid grid-cols-2 gap-1">
							<ServiceIcon slug="supabase" size={12} tone="mono" />
							<ServiceIcon slug="neon" size={12} tone="mono" />
							<ServiceIcon slug="upstash" size={12} tone="mono" />
							<ServiceIcon slug="firebase" size={12} tone="mono" />
						</div>
					</div>
				</Cell>
				<Cell action="indexing tool capabilities..." agent={agent} hue={hue} className="col-span-3" hoverVisual={<HoverHatch color={hue} angle={90} />}>
					<div className="flex flex-wrap items-center gap-1.5 px-5 py-3">
						{capabilities.map((cap) => (
							<span
								key={cap}
								className="inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-[var(--ret-text-muted)] transition-colors"
								style={{ borderColor: `${hue}33`, background: `${hue}08` }}
							>
								<span className="h-1 w-1 rounded-full" style={{ background: hue }} />
								{cap}
							</span>
						))}
					</div>
				</Cell>
				<Cell action="loading MCP servers..." agent={agent} hue={hue} hoverVisual={<HoverGlow color={hue} />} />
				<Cell action="resolving providers..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverScene Scene={WireframeHostsScene} />} />
				<Cell action="syncing dotfiles..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverHatch color={hue} angle={135} />} />
				<Cell action="warming sandbox..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverScene Scene={WireframeEnvironmentScene} />} />

				{/* ═══ Row 6: Observe tools | CTAs + empty ═══ */}
				<Cell action="wiring observability..." agent={agent} hue={hue} className="hidden md:flex md:items-center md:justify-center" hoverVisual={<HoverPulseGrid color={hue} />}>
					<div className="flex flex-col items-center gap-1.5 px-3 py-3">
						<span className="text-[7px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">Observe</span>
						<div className="grid grid-cols-2 gap-1">
							<ServiceIcon slug="sentry" size={12} tone="mono" />
							<ServiceIcon slug="datadog" size={12} tone="mono" />
							<ServiceIcon slug="posthog" size={12} tone="mono" />
							<ServiceIcon slug="grafana" size={12} tone="mono" />
						</div>
					</div>
				</Cell>
				<Cell action="routing to dashboard..." agent={agent} hue={hue} className="col-span-3" hoverVisual={<HoverGlow color={hue} />}>
					<div className="flex flex-wrap items-center gap-2.5 px-5 py-5">
						<SignedIn>
							<ReticleButton as="a" href="/dashboard" variant="primary" size="md">
								<IconArrowRight className="h-3.5 w-3.5" />
								Open dashboard
							</ReticleButton>
						</SignedIn>
						<SignedOut>
							<ReticleButton as="a" href="/sign-in" variant="primary" size="md">
								<IconArrowRight className="h-3.5 w-3.5" />
								Get started
							</ReticleButton>
						</SignedOut>
						<ReticleButton
							as="a"
							href="https://github.com/Kevin-Liu-01/agent-machines"
							target="_blank"
							variant="secondary"
							size="sm"
						>
							<ServiceIcon slug="github" size={13} tone="mono" />
							GitHub
						</ReticleButton>
					</div>
				</Cell>
				<Cell action="allocating vCPU..." agent={agent} hue={hue} hoverVisual={<HoverGradient color={hue} />} />
				<Cell action="initializing fs..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverPulseGrid color={hue} />} />
				<Cell action="connecting gateway..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverHatch color={hue} />} />
				<Cell action="compiling schema..." agent={agent} hue={hue} className="hidden md:block" hoverVisual={<HoverGradient color={hue} />} />

			</div>
		</div>
	);
}

function IconArrowRight(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<path d="M3 8h10M9 4l4 4-4 4" />
		</svg>
	);
}
