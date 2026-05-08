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

type NodeTone =
	| "operator"
	| "control"
	| "machine"
	| "agent"
	| "state"
	| "tools"
	| "provider"
	| "model"
	| "delegation";

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
};

const NODE_TONE: Record<NodeTone, string> = {
	operator: "border-[var(--ret-border)] bg-[var(--ret-bg)]",
	control: "border-[var(--ret-border-hover)] bg-[var(--ret-surface)]",
	machine:
		"border-[var(--ret-purple)]/60 bg-[var(--ret-purple-glow)] shadow-[0_0_42px_var(--ret-purple-glow)]",
	agent: "border-[var(--ret-border-hover)] bg-[var(--ret-bg)]",
	state: "border-[var(--ret-border)] bg-[var(--ret-bg-soft)]",
	tools: "border-[var(--ret-green)]/35 bg-[var(--ret-green)]/5",
	provider: "border-[var(--ret-amber)]/40 bg-[var(--ret-amber)]/5",
	model: "border-[var(--ret-purple)]/40 bg-[var(--ret-purple-glow)]",
	delegation: "border-[var(--ret-border-hover)] bg-[var(--ret-bg)]",
};

const NODE_SIZE: Record<NonNullable<NodeData["size"]>, string> = {
	sm: "w-[210px]",
	md: "w-[250px]",
	lg: "w-[310px]",
};

function FlowNode({
	data,
	selected,
	sourcePosition,
	targetPosition,
}: NodeProps<NodeData>) {
	return (
		<div
			className={cn(
				"arch-node border px-3 py-3 font-mono text-[11px] backdrop-blur-sm",
				"transition-[border-color,background-color,box-shadow,transform] duration-150",
				"hover:-translate-y-0.5 hover:border-[var(--ret-purple)]/45 hover:bg-[var(--ret-surface)]",
				NODE_TONE[data.tone],
				NODE_SIZE[data.size ?? "md"],
				selected &&
					"border-[var(--ret-purple)] bg-[var(--ret-purple-glow)] shadow-[0_0_34px_var(--ret-purple-glow)]",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[9px] uppercase tracking-[0.22em] text-[var(--ret-text-muted)]">
						{data.eyebrow}
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
					<div className="flex max-w-[82px] flex-wrap justify-end gap-1 text-[var(--ret-text-dim)]">
						{data.services.slice(0, 6).map((slug) => (
							<ServiceIcon key={slug} slug={slug} size={13} tone="mono" />
						))}
					</div>
				) : null}
			</div>
			<p className="mt-1.5 text-[11px] leading-snug text-[var(--ret-text-dim)]">
				{data.subtitle}
			</p>
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
	{
		id: "operator",
		type: "box",
		position: { x: 560, y: 0 },
		data: {
			eyebrow: "operator",
			title: "you",
			subtitle: "browser, CLI, or API client",
			body: "You talk to one active machine through the dashboard, CLI, or its OpenAI-compatible gateway.",
			bullets: ["browser dashboard", "npm run chat", "POST /v1/chat/completions"],
			tone: "operator",
			size: "sm",
		},
	},
	{
		id: "web",
		type: "box",
		position: { x: 250, y: 120 },
		targetPosition: Position.Top,
		sourcePosition: Position.Right,
		data: {
			eyebrow: "control plane",
			title: "Next.js dashboard",
			subtitle: "Clerk-gated console",
			body: "The web app manages auth, setup, machine selection, live polling, chat, artifacts, logs, skills, MCPs, and fleet metadata.",
			bullets: ["per-user UserConfig", "active machine switcher", "chat + artifacts + logs"],
			services: ["nextdotjs", "vercel", "clerk"],
			tone: "control",
			size: "md",
		},
	},
	{
		id: "cli",
		type: "box",
		position: { x: 870, y: 120 },
		targetPosition: Position.Top,
		sourcePosition: Position.Left,
		data: {
			eyebrow: "local ops",
			title: "CLI lifecycle",
			subtitle: "deploy, chat, wake, sleep, reload",
			body: "The root CLI is still the reliable bootstrap path: provision or wake a Dedalus machine, install Hermes/OpenClaw, expose ports, and reload knowledge.",
			bullets: ["npm run deploy", "npm run deploy:openclaw", "npm run reload"],
			tone: "control",
			size: "md",
		},
	},
	{
		id: "fleet",
		type: "box",
		position: { x: 520, y: 150 },
		data: {
			eyebrow: "fleet state",
			title: "Clerk UserConfig",
			subtitle: "providers, machines, active id",
			body: "Provider keys and gateway bearers live in Clerk private metadata. Public metadata only exposes redacted machine status.",
			bullets: ["multiple MachineRef entries", "activeMachineId", "server-only provider keys"],
			services: ["clerk"],
			tone: "state",
			size: "md",
		},
	},
	{
		id: "provider",
		type: "box",
		position: { x: 545, y: 295 },
		data: {
			eyebrow: "machine provider",
			title: "MachineProvider",
			subtitle: "Dedalus live . Vercel/Fly shaped",
			body: "Dedalus is wired end-to-end today. Vercel Sandbox and Fly Machines are accepted by the schema/UI and return explicit not-supported errors until their provisioners land.",
			bullets: ["provision / wake / sleep", "state / exec", "same contract per host"],
			mark: "dedalus",
			services: ["vercel"],
			tone: "provider",
			size: "lg",
		},
	},
	{
		id: "machine",
		type: "box",
		position: { x: 515, y: 465 },
		data: {
			eyebrow: "active runtime",
			title: "persistent Linux machine",
			subtitle: "/home/machine is the durable volume",
			body: "This is the important object: a resumable microVM with persistent disk. Sleep stops compute; the filesystem survives.",
			bullets: ["1 vCPU / 2 GiB / 10 GiB default", "sleep/wake lifecycle", "gateway + agent + tools run here"],
			tone: "machine",
			size: "lg",
		},
	},
	{
		id: "gateway",
		type: "box",
		position: { x: 560, y: 650 },
		data: {
			eyebrow: "public api",
			title: "agent gateway",
			subtitle: ":8642 . OpenAI-compatible /v1",
			body: "The machine exposes the chat API through a Dedalus preview URL or a Cloudflare quick tunnel. The browser proxies through Next.js so bearer tokens stay server-side.",
			bullets: ["SSE chat streaming", "server-side bearer proxy", "public preview or tunnel"],
			mark: "agent",
			services: ["cloudflare"],
			tone: "agent",
			size: "md",
		},
	},
	{
		id: "agent",
		type: "box",
		position: { x: 230, y: 625 },
		sourcePosition: Position.Right,
		targetPosition: Position.Top,
		data: {
			eyebrow: "agent layer",
			title: "Hermes or OpenClaw",
			subtitle: "same machine, different runtime",
			body: "Hermes brings memory, cron, MCP, sessions, and the web dashboard. OpenClaw brings the computer-use loop. They are agent choices, not the app's whole state model.",
			bullets: ["Hermes: ~/.hermes", "OpenClaw: ~/.openclaw", "switching does not erase app data"],
			mark: "agent",
			tone: "agent",
			size: "md",
		},
	},
	{
		id: "app-data",
		type: "box",
		position: { x: 20, y: 820 },
		sourcePosition: Position.Right,
		targetPosition: Position.Top,
		data: {
			eyebrow: "app data",
			title: "~/.agent-machines/",
			subtitle: "chats, artifacts, indexes",
			body: "Agent Machines stores product data separately from agent runtime state so Hermes/OpenClaw upgrades do not own user artifacts.",
			bullets: ["chats/*.json", "artifacts/<id>/", "machine-readable indexes"],
			tone: "state",
			size: "md",
		},
	},
	{
		id: "agent-home",
		type: "box",
		position: { x: 285, y: 845 },
		targetPosition: Position.Top,
		sourcePosition: Position.Right,
		data: {
			eyebrow: "agent home",
			title: "~/.hermes/ != app data",
			subtitle: "skills, crons, sessions, config",
			body: "Important footgun defused: ~/.hermes is Hermes runtime state. It is not the app data root and not the repo checkout.",
			bullets: ["skills + crons", "MEMORY.md / USER.md", "gateway logs + config"],
			mark: "nous",
			tone: "state",
			size: "md",
		},
	},
	{
		id: "repo",
		type: "box",
		position: { x: 560, y: 845 },
		targetPosition: Position.Top,
		sourcePosition: Position.Right,
		data: {
			eyebrow: "repo checkout",
			title: "/home/machine/hermes-machines",
			subtitle: "git checkout for reloads",
			body: "This path is deliberately just the repo checkout used by reload-from-git.sh. It is not ~/.hermes and not ./hermes the agent runtime. Yes, naming goblin survived one refactor.",
			bullets: ["git fetch origin/main", "sync knowledge/ into ~/.hermes", "legacy path kept for old machines"],
			tone: "state",
			size: "lg",
		},
	},
	{
		id: "loadout",
		type: "box",
		position: { x: 860, y: 620 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "tool surface",
			title: "full loadout",
			subtitle: "23 built-ins . 17 services . 95 skills",
			body: "Cursor is one delegation tool, not the entire tool story. The agent chooses built-ins first, then MCP/CLI/service interfaces, then SKILL.md behavior packs.",
			bullets: ["terminal, filesystem, browser", "Vercel, Stripe, Supabase, GitHub", "Linear, Slack, Sentry, Figma, more"],
			services: ["vercel", "stripe", "supabase", "github", "linear", "slack"],
			tone: "tools",
			size: "lg",
		},
	},
	{
		id: "cursor",
		type: "box",
		position: { x: 1030, y: 845 },
		targetPosition: Position.Top,
		sourcePosition: Position.Left,
		data: {
			eyebrow: "optional delegation",
			title: "cursor-bridge",
			subtitle: "MCP server wrapping @cursor/sdk",
			body: "When configured, Hermes can spawn Cursor coding agents for code edits. If CURSOR_API_KEY is missing, the rest of the machine still works.",
			bullets: ["cursor_agent", "cursor_resume", ".cursor/rules from skills"],
			mark: "cursor",
			tone: "delegation",
			size: "md",
		},
	},
	{
		id: "models",
		type: "box",
		position: { x: 790, y: 1015 },
		targetPosition: Position.Top,
		sourcePosition: Position.Left,
		data: {
			eyebrow: "inference",
			title: "OpenAI-compatible models",
			subtitle: "Dedalus default . base URL configurable",
			body: "The default chat endpoint is api.dedaluslabs.ai/v1, but Hermes is configured through model.base_url and can target another OpenAI-compatible endpoint when DEDALUS_CHAT_BASE_URL changes.",
			bullets: ["Dedalus catalog by default", "Anthropic/OpenAI via provider routing", "model slug stored per machine"],
			mark: "dedalus",
			services: ["anthropic", "openai"],
			tone: "model",
			size: "lg",
		},
	},
];

const EDGES: Edge[] = [
	{ id: "operator-web", source: "operator", target: "web", label: "browser" },
	{ id: "operator-cli", source: "operator", target: "cli", label: "terminal" },
	{ id: "web-fleet", source: "web", target: "fleet", label: "auth + config" },
	{ id: "cli-provider", source: "cli", target: "provider", label: "deploy/wake" },
	{ id: "fleet-provider", source: "fleet", target: "provider", label: "active machine" },
	{ id: "provider-machine", source: "provider", target: "machine", label: "provision / exec" },
	{ id: "machine-gateway", source: "machine", target: "gateway", label: "serve :8642" },
	{ id: "gateway-agent", source: "gateway", target: "agent", label: "turn loop" },
	{ id: "agent-app-data", source: "agent", target: "app-data", label: "product state" },
	{ id: "agent-agent-home", source: "agent", target: "agent-home", label: "runtime state" },
	{ id: "agent-home-repo", source: "agent-home", target: "repo", label: "reload sync" },
	{ id: "agent-loadout", source: "agent", target: "loadout", label: "calls" },
	{ id: "loadout-cursor", source: "loadout", target: "cursor", label: "optional MCP" },
	{ id: "gateway-models", source: "gateway", target: "models", label: "chat completions" },
	{ id: "loadout-models", source: "loadout", target: "models", label: "tool-backed inference" },
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
				return {
					...edge,
					type: "smoothstep",
					animated:
						isActive ||
						edge.id === "provider-machine" ||
						edge.id === "gateway-models",
					style: {
						stroke: isActive
							? "var(--ret-purple)"
							: "var(--ret-border-strong)",
						strokeWidth: isActive ? 2 : 1.35,
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
						fillOpacity: 0.92,
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
						Agent Machines is not a thin wrapper around Cursor or one model
						gateway. It is a persistent Linux machine with a control plane,
						agent runtime, durable app data, skill reload path, service
						loadout, optional code delegation, and configurable
						OpenAI-compatible inference.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<ReticleBadge variant="accent">drag nodes</ReticleBadge>
					<ReticleBadge>scroll to zoom</ReticleBadge>
					<ReticleBadge>click to inspect</ReticleBadge>
				</div>
			</div>

			<div className="mt-5 grid gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] md:grid-cols-3">
				<MachineNote
					label="machine state"
					value="/home/machine persists"
					body="Sleep pauses compute. Disk remains the source of truth."
				/>
				<MachineNote
					label="path split"
					value="~/.agent-machines != ~/.hermes"
					body="App data, agent runtime, and repo checkout stay separate."
				/>
				<MachineNote
					label="loadout"
					value="more than cursor"
					body="Built-ins, services, MCP, CLI, and skills all sit in the graph."
				/>
			</div>

			<div className="architecture-canvas relative mt-4 h-[760px] overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-bg)] md:h-[820px]">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(circle at 50% 43%, var(--ret-purple-glow), transparent 28%), radial-gradient(circle at 78% 76%, rgba(34,197,94,0.08), transparent 24%), radial-gradient(circle at 24% 84%, rgba(245,158,11,0.08), transparent 22%)",
					}}
				/>
				<ReactFlow
					nodes={nodes}
					edges={styledEdges}
					nodeTypes={NODE_TYPES}
					onNodesChange={onNodesChange}
					onNodeClick={(_, node) => setActiveNodeId(node.id)}
					fitView
					fitViewOptions={{ padding: 0.14 }}
					defaultViewport={{ x: 0, y: 0, zoom: 0.82 }}
					minZoom={0.35}
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
					<Panel position="top-left" className="max-w-[330px]">
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
