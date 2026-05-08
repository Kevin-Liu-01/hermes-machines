"use client";

import { useMemo, useState } from "react";
import {
	Background,
	BackgroundVariant,
	Controls,
	Handle,
	MarkerType,
	MiniMap,
	Panel,
	Position,
	ReactFlow,
	type Edge,
	type Node,
	type NodeProps,
	useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { Logo, type CompositeMark } from "@/components/Logo";
import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { ServiceIcon, type ServiceSlug } from "@/components/ServiceIcon";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ *
 * Layout philosophy                                                   *
 *                                                                     *
 * 11 nodes in a clean vertical funnel. Each node carries more         *
 * information in bullets so the canvas stays readable; click any node *
 * for the full body in the side panel. No sister-node fan-outs --     *
 * those compress into bullet lists inside one parent node.            *
 *                                                                     *
 *   row 0  operator                                                   *
 *   row 1  dashboard           CLI                                    *
 *   row 2  fleet metadata                                             *
 *   row 3  provider tier (3 sub-providers as bullets)                 *
 *   row 4  persistent machine (the product boundary)                  *
 *   row 5  gateway                                                    *
 *   row 6  agent runtimes (Hermes/OpenClaw as bullets)                *
 *   row 7  filesystem layout (4 path roots as bullets)                *
 *   row 8  tool surface       cursor-bridge                           *
 *   row 9  inference router                                           *
 *   row 10 model providers (3 catalogs as bullets)                    *
 * ------------------------------------------------------------------ */

type NodeTone =
	| "operator"
	| "control"
	| "fleet"
	| "provider"
	| "machine"
	| "gateway"
	| "agent"
	| "state"
	| "tools"
	| "delegation"
	| "router"
	| "model";

const NODE_TONE: Record<NodeTone, string> = {
	operator: "border-[var(--ret-border)] bg-[var(--ret-bg)]",
	control: "border-[var(--ret-border-hover)] bg-[var(--ret-surface)]",
	fleet: "border-[var(--ret-border-hover)] bg-[var(--ret-bg-soft)]",
	provider: "border-[var(--ret-amber)]/40 bg-[var(--ret-amber)]/5",
	machine:
		"border-[var(--ret-purple)]/65 bg-[var(--ret-purple-glow)] shadow-[0_0_44px_var(--ret-purple-glow)]",
	gateway: "border-[var(--ret-border-hover)] bg-[var(--ret-bg)]",
	agent: "border-[var(--ret-border-hover)] bg-[var(--ret-bg)]",
	state: "border-[var(--ret-border)] bg-[var(--ret-bg-soft)]",
	tools: "border-[var(--ret-green)]/35 bg-[var(--ret-green)]/5",
	delegation: "border-[var(--ret-border)] bg-[var(--ret-bg)]",
	router: "border-[var(--ret-border-hover)] bg-[var(--ret-surface)]",
	model: "border-[var(--ret-purple)]/40 bg-[var(--ret-purple-glow)]",
};

type NodeStatus = "live" | "stub" | "optional";

const STATUS_LABEL: Record<NodeStatus, { label: string; tone: string }> = {
	live: {
		label: "live",
		tone: "border-[var(--ret-green)]/45 bg-[var(--ret-green)]/10 text-[var(--ret-green)]",
	},
	stub: {
		label: "shaped",
		tone: "border-[var(--ret-amber)]/45 bg-[var(--ret-amber)]/10 text-[var(--ret-amber)]",
	},
	optional: {
		label: "optional",
		tone: "border-[var(--ret-border)] bg-[var(--ret-surface)] text-[var(--ret-text-dim)]",
	},
};

type NodeData = {
	eyebrow: string;
	title: string;
	subtitle: string;
	body: string;
	bullets: ReadonlyArray<string>;
	mark?: CompositeMark;
	services?: ReadonlyArray<ServiceSlug>;
	tone: NodeTone;
	size?: "sm" | "md" | "lg";
	status?: NodeStatus;
};

const NODE_SIZE: Record<NonNullable<NodeData["size"]>, string> = {
	sm: "w-[230px]",
	md: "w-[280px]",
	lg: "w-[340px]",
};

function FlowNode({
	data,
	selected,
	sourcePosition,
	targetPosition,
}: NodeProps<NodeData>) {
	const status = data.status ? STATUS_LABEL[data.status] : null;
	return (
		<div
			className={cn(
				"arch-node border px-3 py-3 font-mono text-[11px] backdrop-blur-sm",
				"transition-[border-color,background-color,box-shadow,transform] duration-150",
				"hover:-translate-y-0.5 hover:border-[var(--ret-purple)]/45 hover:bg-[var(--ret-surface)] hover:shadow-[0_8px_22px_rgba(0,0,0,0.18)]",
				NODE_TONE[data.tone],
				NODE_SIZE[data.size ?? "md"],
				selected &&
					"border-[var(--ret-purple)] bg-[var(--ret-purple-glow)] shadow-[0_0_38px_var(--ret-purple-glow)]",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-[var(--ret-text-muted)]">
						{data.eyebrow}
						{status ? (
							<span
								className={cn(
									"border px-1 py-px text-[8px] tracking-[0.22em]",
									status.tone,
								)}
							>
								{status.label}
							</span>
						) : null}
					</p>
					<div className="mt-1 flex items-center gap-1.5">
						{data.mark ? (
							<span className="text-[var(--ret-text)]">
								<Logo mark={data.mark} size={14} />
							</span>
						) : null}
						<h3 className="truncate text-[13px] font-semibold tracking-tight text-[var(--ret-text)]">
							{data.title}
						</h3>
					</div>
				</div>
				{data.services ? (
					<div className="flex max-w-[96px] flex-wrap justify-end gap-1 text-[var(--ret-text-dim)]">
						{data.services.slice(0, 6).map((slug) => (
							<ServiceIcon key={slug} slug={slug} size={12} tone="mono" />
						))}
					</div>
				) : null}
			</div>
			<p className="mt-1.5 text-[11px] leading-snug text-[var(--ret-text-dim)]">
				{data.subtitle}
			</p>
			{data.bullets.length > 0 ? (
				<ul className="mt-2 space-y-0.5 text-[10px] leading-snug text-[var(--ret-text-muted)]">
					{data.bullets.map((b) => (
						<li key={b} className="flex items-baseline gap-1.5">
							<span className="text-[var(--ret-purple)]">.</span>
							<span className="truncate">{b}</span>
						</li>
					))}
				</ul>
			) : null}
			<Handle
				type="target"
				position={targetPosition ?? Position.Top}
				style={{ background: "transparent", border: "none" }}
			/>
			<Handle
				type="source"
				position={sourcePosition ?? Position.Bottom}
				style={{ background: "transparent", border: "none" }}
			/>
		</div>
	);
}

const NODE_TYPES = { box: FlowNode };

const INITIAL_NODES: Node<NodeData>[] = [
	// Row 0 -- operator
	{
		id: "operator",
		type: "box",
		position: { x: 540, y: 0 },
		data: {
			eyebrow: "operator",
			title: "you",
			subtitle: "browser, CLI, or API client",
			body: "You talk to one active machine through the dashboard, CLI, or the OpenAI-compatible gateway.",
			bullets: [
				"browser dashboard",
				"npm run chat",
				"POST /v1/chat/completions",
			],
			tone: "operator",
			size: "sm",
		},
	},

	// Row 1 -- control plane (left + right)
	{
		id: "web",
		type: "box",
		position: { x: 180, y: 160 },
		targetPosition: Position.Top,
		sourcePosition: Position.Right,
		data: {
			eyebrow: "control plane",
			title: "Next.js dashboard",
			subtitle: "Clerk-gated console",
			body: "The web app handles auth, setup, machine selection, live polling, chat, artifacts, logs, skills, MCPs, and fleet metadata.",
			bullets: [
				"per-user UserConfig",
				"active machine switcher",
				"chat + artifacts + logs",
			],
			services: ["nextdotjs", "vercel", "clerk"],
			tone: "control",
			size: "md",
		},
	},
	{
		id: "cli",
		type: "box",
		position: { x: 940, y: 160 },
		targetPosition: Position.Top,
		sourcePosition: Position.Left,
		data: {
			eyebrow: "local ops",
			title: "CLI lifecycle",
			subtitle: "deploy, chat, wake, sleep, reload",
			body: "The root CLI is the reliable bootstrap path: provision/wake a machine, install Hermes or OpenClaw, expose the gateway, reload knowledge.",
			bullets: [
				"npm run deploy",
				"npm run deploy:openclaw",
				"npm run reload",
			],
			tone: "control",
			size: "md",
		},
	},

	// Row 2 -- fleet metadata
	{
		id: "fleet",
		type: "box",
		position: { x: 540, y: 320 },
		data: {
			eyebrow: "fleet state",
			title: "Clerk UserConfig",
			subtitle: "providers, machines, active id",
			body: "Provider keys and gateway bearers live in Clerk private metadata. Public metadata only exposes redacted machine status.",
			bullets: [
				"multiple MachineRef entries",
				"activeMachineId",
				"server-only provider keys",
			],
			services: ["clerk"],
			tone: "fleet",
			size: "md",
		},
	},

	// Row 3 -- provider tier (collapsed: one node with sub-providers as bullets)
	{
		id: "providers",
		type: "box",
		position: { x: 540, y: 480 },
		data: {
			eyebrow: "provider tier",
			title: "MachineProvider",
			subtitle: "Dedalus live . Vercel/Fly shaped",
			body: "One interface, three providers. Dedalus is wired today; Vercel Sandbox + Fly Machines accept credentials and return explicit not_supported errors until their provisioners land. Providers are interchangeable -- the agent doesn't care which microVM hosts it.",
			bullets: [
				"Dedalus Machines  --  live",
				"Vercel Sandbox  --  shaped",
				"Fly Machines  --  shaped",
			],
			mark: "dedalus",
			services: ["vercel"],
			tone: "provider",
			size: "lg",
			status: "live",
		},
	},

	// Row 4 -- the machine (product boundary)
	{
		id: "machine",
		type: "box",
		position: { x: 540, y: 660 },
		data: {
			eyebrow: "active runtime",
			title: "persistent Linux machine",
			subtitle: "/home/machine is the durable volume",
			body: "The important object: a resumable microVM with persistent disk. Sleep stops compute; the filesystem survives. Everything below this row lives on this machine.",
			bullets: [
				"1 vCPU / 2 GiB / 10 GiB default",
				"sleep / wake by the second",
				"gateway + agent + tools + state on disk",
			],
			tone: "machine",
			size: "lg",
		},
	},

	// Row 5 -- gateway
	{
		id: "gateway",
		type: "box",
		position: { x: 540, y: 850 },
		data: {
			eyebrow: "public api",
			title: "agent gateway :8642",
			subtitle: "OpenAI-compatible /v1",
			body: "Exposed via Dedalus preview URL or a Cloudflare quick tunnel. The browser proxies through Next.js so bearer tokens stay server-side.",
			bullets: [
				"SSE chat streaming",
				"server-side bearer proxy",
				"public preview or tunnel",
			],
			services: ["cloudflare"],
			tone: "gateway",
			size: "md",
		},
	},

	// Row 6 -- agent runtimes (collapsed: one node with both as bullets)
	{
		id: "agent",
		type: "box",
		position: { x: 540, y: 1010 },
		data: {
			eyebrow: "agent runtime",
			title: "Hermes or OpenClaw",
			subtitle: "swap any time, same gateway port",
			body: "Hermes (Nous Research) brings the dashboard, FTS5 sessions, MEMORY.md, USER.md, cron, and MCP server registry. OpenClaw (openclaw/openclaw) brings the Anthropic computer-use loop with browser, screenshot, click_xy, type_text. Both expose the same OpenAI-compatible /v1.",
			bullets: [
				"Hermes  --  memory + cron + MCP",
				"OpenClaw  --  computer-use + browser",
				"both speak /v1/chat/completions",
			],
			mark: "agent",
			tone: "agent",
			size: "lg",
			status: "live",
		},
	},

	// Row 7 -- filesystem layout (collapsed: one node with 4 paths as bullets)
	{
		id: "filesystem",
		type: "box",
		position: { x: 540, y: 1190 },
		data: {
			eyebrow: "on-disk layout",
			title: "/home/machine/",
			subtitle: "four roots, no overlap",
			body: "Product data, agent runtime, and the git checkout each get their own root so upgrading one never owns the others. Survives every sleep cycle.",
			bullets: [
				".agent-machines/  --  app data (chats, artifacts, indexes)",
				".hermes/  --  Hermes runtime (skills, crons, sessions)",
				".openclaw/  --  OpenClaw runtime (state, screenshots)",
				"agent-machines/  --  git checkout for reloads",
			],
			tone: "state",
			size: "lg",
		},
	},

	// Row 8 -- tools (left) + delegation (right)
	{
		id: "tools",
		type: "box",
		position: { x: 180, y: 1380 },
		targetPosition: Position.Top,
		sourcePosition: Position.Right,
		data: {
			eyebrow: "tool surface",
			title: "Tools + skills",
			subtitle: "23 built-ins . 17 services . 95 skills",
			body: "Layered loadout. Built-ins are first-class and called directly. MCP services mount per-service tool catalogs (Vercel, Stripe, Supabase, Linear, GitHub, Slack, PostHog, Sentry, ...). Skills are SKILL.md files that load by intent match.",
			bullets: [
				"23 built-in tools  --  shell, fs, browser, vision",
				"17 MCP services  --  branded integrations",
				"95 SKILL.md files  --  load on demand",
			],
			services: ["vercel", "stripe", "supabase", "github", "linear", "slack"],
			tone: "tools",
			size: "lg",
		},
	},
	{
		id: "cursor",
		type: "box",
		position: { x: 940, y: 1380 },
		targetPosition: Position.Top,
		sourcePosition: Position.Left,
		data: {
			eyebrow: "delegation",
			title: "cursor-bridge",
			subtitle: "MCP server wrapping @cursor/sdk",
			body: "Optional. When CURSOR_API_KEY is set, the agent can spawn Cursor coding agents for code edits with the rig's skills injected as .cursor/rules.",
			bullets: [
				"cursor_agent",
				"cursor_resume",
				".cursor/rules from skills",
			],
			mark: "cursor",
			tone: "delegation",
			size: "md",
			status: "optional",
		},
	},

	// Row 9 -- inference router
	{
		id: "router",
		type: "box",
		position: { x: 540, y: 1560 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "inference router",
			title: "Dedalus AI router",
			subtitle: "api.dedaluslabs.ai/v1",
			body: "Fronts 200+ models. Hermes is configured via model.base_url; swap DEDALUS_CHAT_BASE_URL to target a different OpenAI-compatible endpoint.",
			bullets: [
				"single key, 200+ models",
				"model slug per machine",
				"swap base_url to switch",
			],
			mark: "dedalus",
			tone: "router",
			size: "lg",
		},
	},

	// Row 10 -- model providers (collapsed: one node with 3 catalogs as bullets)
	{
		id: "models",
		type: "box",
		position: { x: 540, y: 1745 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "model catalogs",
			title: "OpenAI-compatible models",
			subtitle: "Anthropic . OpenAI . others via the router",
			body: "Anything the Dedalus router lists, plus alternatives via DEDALUS_CHAT_BASE_URL. Default Hermes model is anthropic/claude-sonnet-4-6; OpenClaw uses Anthropic for the computer-use loop.",
			bullets: [
				"Anthropic  --  Claude family",
				"OpenAI  --  GPT family",
				"200+ slugs via the router (Mistral, Together, Groq, ...)",
			],
			services: ["anthropic", "openai"],
			tone: "model",
			size: "lg",
		},
	},
];

const EDGES: Edge[] = [
	// Operator -> control plane
	{ id: "e-op-web", source: "operator", target: "web", label: "browser" },
	{ id: "e-op-cli", source: "operator", target: "cli", label: "terminal" },
	// Control plane -> fleet
	{ id: "e-web-fleet", source: "web", target: "fleet", label: "auth + config" },
	// Fleet -> providers
	{
		id: "e-fleet-providers",
		source: "fleet",
		target: "providers",
		label: "active provider",
	},
	// CLI -> providers (deploy path)
	{
		id: "e-cli-providers",
		source: "cli",
		target: "providers",
		label: "deploy / wake",
	},
	// Providers -> machine
	{
		id: "e-providers-machine",
		source: "providers",
		target: "machine",
		label: "provision / exec",
	},
	// Machine -> gateway
	{
		id: "e-machine-gateway",
		source: "machine",
		target: "gateway",
		label: "serve :8642",
	},
	// Gateway -> agent
	{
		id: "e-gateway-agent",
		source: "gateway",
		target: "agent",
		label: "turn loop",
	},
	// Agent -> filesystem
	{
		id: "e-agent-fs",
		source: "agent",
		target: "filesystem",
		label: "reads / writes",
	},
	// Agent -> tools (filesystem column splits left)
	{
		id: "e-fs-tools",
		source: "filesystem",
		target: "tools",
		label: "calls",
	},
	// Agent -> cursor (filesystem column splits right)
	{
		id: "e-fs-cursor",
		source: "filesystem",
		target: "cursor",
		label: "spawn",
	},
	// Tools + cursor -> router
	{
		id: "e-tools-router",
		source: "tools",
		target: "router",
		label: "tool-backed inference",
	},
	{
		id: "e-cursor-router",
		source: "cursor",
		target: "router",
		label: "model fan-in",
	},
	// Router -> models
	{
		id: "e-router-models",
		source: "router",
		target: "models",
		label: "200+ slugs",
	},
];

export function ArchitectureFlow() {
	const [nodes, , onNodesChange] = useNodesState<NodeData>(INITIAL_NODES);
	const [activeNodeId, setActiveNodeId] = useState("machine");

	const active = nodes.find((node) => node.id === activeNodeId) ?? nodes[0];
	const styledEdges = useMemo<Edge[]>(
		() =>
			EDGES.map((edge) => {
				const isActive =
					edge.source === activeNodeId || edge.target === activeNodeId;
				const isHero =
					edge.id === "e-providers-machine" ||
					edge.id === "e-machine-gateway" ||
					edge.id === "e-gateway-agent" ||
					edge.id === "e-router-models";
				return {
					...edge,
					type: "smoothstep",
					animated: isActive || isHero,
					style: {
						stroke: isActive
							? "var(--ret-purple)"
							: "var(--ret-border-strong)",
						strokeWidth: isActive ? 2 : 1.25,
						opacity: activeNodeId && !isActive ? 0.55 : 1,
					},
					markerEnd: {
						type: MarkerType.ArrowClosed,
						color: isActive
							? "var(--ret-purple)"
							: "var(--ret-border-strong)",
					},
					labelStyle: {
						fontFamily: "var(--font-mono)",
						fontSize: 10,
						fill: isActive
							? "var(--ret-text)"
							: "var(--ret-text-muted)",
					},
					labelBgStyle: {
						fill: "var(--ret-bg)",
						fillOpacity: 0.95,
					},
					labelBgPadding: [5, 2] as [number, number],
					labelBgBorderRadius: 0,
				};
			}),
		[activeNodeId],
	);

	return (
		<>
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<ReticleLabel>ARCHITECTURE</ReticleLabel>
					<h2 className="ret-display mt-2 text-xl md:text-2xl">
						The machine is the product boundary.
					</h2>
					<p className="mt-3 max-w-[78ch] text-[13px] leading-relaxed text-[var(--ret-text-dim)]">
						Eleven nodes, top-down. The persistent Linux machine in the
						middle is the product boundary -- everything above provisions
						and routes to it, everything below runs inside it. Click any
						node to inspect the full body; drag to rearrange the layout.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<ReticleBadge variant="accent">drag nodes</ReticleBadge>
					<ReticleBadge>scroll to zoom</ReticleBadge>
					<ReticleBadge>click to inspect</ReticleBadge>
				</div>
			</div>

			<div className="mt-5 grid gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] md:grid-cols-4">
				<MachineNote
					label="machine state"
					value="/home/machine persists"
					body="Sleep pauses compute. Disk remains the source of truth."
				/>
				<MachineNote
					label="path split"
					value="four roots, no overlap"
					body=".agent-machines (app), .hermes (runtime), .openclaw, repo checkout."
				/>
				<MachineNote
					label="providers"
					value="dedalus + 2 stubs"
					body="Dedalus is live. Vercel Sandbox + Fly Machines accept credentials."
				/>
				<MachineNote
					label="loadout"
					value="more than cursor"
					body="23 built-ins + 17 service MCPs + 95 skills + optional cursor."
				/>
			</div>

			<div className="architecture-canvas relative mt-4 h-[920px] overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-bg)] md:h-[1000px]">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(circle at 50% 38%, var(--ret-purple-glow), transparent 22%), radial-gradient(circle at 50% 80%, rgba(34,197,94,0.08), transparent 20%), radial-gradient(circle at 18% 12%, rgba(245,158,11,0.06), transparent 18%), radial-gradient(circle at 82% 88%, rgba(170,165,230,0.10), transparent 20%)",
					}}
				/>
				<ReactFlow
					nodes={nodes}
					edges={styledEdges}
					nodeTypes={NODE_TYPES}
					onNodesChange={onNodesChange}
					onNodeClick={(_, node) => setActiveNodeId(node.id)}
					onPaneClick={() => setActiveNodeId("machine")}
					fitView
					fitViewOptions={{ padding: 0.10 }}
					defaultViewport={{ x: 0, y: 0, zoom: 0.78 }}
					minZoom={0.32}
					maxZoom={1.6}
					snapToGrid
					snapGrid={[12, 12]}
					nodesDraggable
					nodesConnectable={false}
					elementsSelectable
					zoomOnScroll
					panOnScroll
					panOnDrag
					zoomOnPinch
					zoomOnDoubleClick={false}
					proOptions={{ hideAttribution: true }}
				>
					<Background
						variant={BackgroundVariant.Dots}
						gap={24}
						size={1}
						color="var(--ret-grid)"
					/>
					<MiniMap
						className="hidden border border-[var(--ret-border)] bg-[var(--ret-bg)] md:block"
						nodeColor={(node) =>
							node.id === activeNodeId
								? "var(--ret-purple)"
								: "var(--ret-border-strong)"
						}
						maskColor="rgba(0,0,0,0.08)"
						pannable
						zoomable
					/>
					<Controls showInteractive={false} />
					<Panel position="top-left" className="max-w-[340px]">
						<div className="border border-[var(--ret-border)] bg-[var(--ret-bg)]/95 p-3 font-mono text-[11px] shadow-[0_18px_44px_rgba(0,0,0,0.22)] backdrop-blur">
							<p className="text-[9px] uppercase tracking-[0.22em] text-[var(--ret-text-muted)]">
								selected
							</p>
							<div className="mt-1 flex items-center gap-1.5 text-[var(--ret-text)]">
								{active?.data.mark ? (
									<Logo mark={active.data.mark} size={14} />
								) : null}
								<strong className="text-[13px]">{active?.data.title}</strong>
							</div>
							<p className="mt-2 leading-relaxed text-[var(--ret-text-dim)]">
								{active?.data.body}
							</p>
							<ul className="mt-2 grid gap-1">
								{active?.data.bullets.map((bullet) => (
									<li
										key={bullet}
										className="flex items-baseline gap-1.5 text-[var(--ret-text-dim)]"
									>
										<span className="text-[var(--ret-purple)]">{"->"}</span>
										<span>{bullet}</span>
									</li>
								))}
							</ul>
						</div>
					</Panel>
					<Panel position="bottom-right" className="hidden md:block">
						<div className="border border-[var(--ret-border)] bg-[var(--ret-bg)]/95 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)] backdrop-blur">
							{nodes.length} nodes . {EDGES.length} edges
						</div>
					</Panel>
				</ReactFlow>
			</div>
		</>
	);
}

function MachineNote({
	label,
	value,
	body,
}: {
	label: string;
	value: string;
	body: string;
}) {
	return (
		<div className="bg-[var(--ret-bg)] p-4">
			<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
				{label}
			</p>
			<p className="mt-1 font-mono text-[13px] text-[var(--ret-text)]">
				{value}
			</p>
			<p className="mt-1 text-[12px] leading-relaxed text-[var(--ret-text-dim)]">
				{body}
			</p>
		</div>
	);
}
