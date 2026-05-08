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
 * Tone tokens                                                         *
 * Each tone maps to a foreground border + background pair so a node   *
 * tells you what tier of the system it belongs to at a glance.       *
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
	| "service"
	| "delegation"
	| "model"
	| "router";

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
	service: "border-[var(--ret-border)] bg-[var(--ret-bg-soft)]",
	delegation: "border-[var(--ret-border)] bg-[var(--ret-bg)]",
	model: "border-[var(--ret-purple)]/40 bg-[var(--ret-purple-glow)]",
	router: "border-[var(--ret-border-hover)] bg-[var(--ret-surface)]",
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

/* ------------------------------------------------------------------ *
 * Node data                                                           *
 * ------------------------------------------------------------------ */

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
	sm: "w-[210px]",
	md: "w-[250px]",
	lg: "w-[300px]",
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
			<div className="flex items-start justify-between gap-3">
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
					<div className="flex max-w-[88px] flex-wrap justify-end gap-1 text-[var(--ret-text-dim)]">
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

/* ------------------------------------------------------------------ *
 * Layout                                                              *
 * Twelve-row flow, grouped into five horizontal zones (operator,      *
 * control plane, provider tier, machine, runtime + downstream).       *
 * ------------------------------------------------------------------ */

const INITIAL_NODES: Node<NodeData>[] = [
	// Row 0 -- operator
	{
		id: "operator",
		type: "box",
		position: { x: 620, y: 0 },
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
	// Row 1 -- control plane
	{
		id: "web",
		type: "box",
		position: { x: 280, y: 130 },
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
		position: { x: 940, y: 130 },
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
		position: { x: 600, y: 250 },
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
	// Row 3 -- provider tier (3 sisters)
	{
		id: "provider-dedalus",
		type: "box",
		position: { x: 200, y: 400 },
		data: {
			eyebrow: "provider",
			title: "Dedalus Machines",
			subtitle: "default microVM provider",
			body: "Provisions, wakes, sleeps, executes commands. Second-billed; ~30s cold boot, <5s warm.",
			bullets: [
				"provision / wake / sleep",
				"state / exec / destroy",
				"second-billed microVM",
			],
			mark: "dedalus",
			tone: "provider",
			size: "md",
			status: "live",
		},
	},
	{
		id: "provider-vercel",
		type: "box",
		position: { x: 555, y: 400 },
		data: {
			eyebrow: "provider",
			title: "Vercel Sandbox",
			subtitle: "Firecracker microVM",
			body: "Same MachineProvider contract, accepted by the schema and setup UI; provisioner returns explicit not_supported until wired.",
			bullets: [
				"per-team scoped sandbox",
				"agent-browser-friendly runtime",
				"contract-only today",
			],
			services: ["vercel"],
			tone: "provider",
			size: "md",
			status: "stub",
		},
	},
	{
		id: "provider-fly",
		type: "box",
		position: { x: 905, y: 400 },
		data: {
			eyebrow: "provider",
			title: "Fly Machines",
			subtitle: "regional microVM",
			body: "Region-pinned alternative. Org slug + token captured in setup; provisioner returns explicit not_supported until wired.",
			bullets: [
				"region pinning",
				"per-org isolation",
				"contract-only today",
			],
			tone: "provider",
			size: "md",
			status: "stub",
		},
	},
	// Row 4 -- the machine itself (the product boundary)
	{
		id: "machine",
		type: "box",
		position: { x: 540, y: 565 },
		data: {
			eyebrow: "active runtime",
			title: "persistent Linux machine",
			subtitle: "/home/machine is the durable volume",
			body: "This is the important object: a resumable microVM with persistent disk. Sleep stops compute; the filesystem survives. Everything below this row lives on this machine.",
			bullets: [
				"1 vCPU / 2 GiB / 10 GiB default",
				"sleep/wake lifecycle",
				"gateway + agent + tools + state run here",
			],
			tone: "machine",
			size: "lg",
		},
	},
	// Row 5 -- gateway
	{
		id: "gateway",
		type: "box",
		position: { x: 570, y: 745 },
		data: {
			eyebrow: "public api",
			title: "agent gateway",
			subtitle: ":8642 . OpenAI-compatible /v1",
			body: "The machine exposes the chat API through a Dedalus preview URL or a Cloudflare quick tunnel. The browser proxies through Next.js so bearer tokens stay server-side.",
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
	// Row 6 -- agent runtimes (sisters)
	{
		id: "agent-hermes",
		type: "box",
		position: { x: 240, y: 720 },
		sourcePosition: Position.Right,
		targetPosition: Position.Top,
		data: {
			eyebrow: "agent runtime",
			title: "Hermes",
			subtitle: "memory + cron + sessions + MCP",
			body: "Default runtime. Brings the dashboard, FTS5 sessions, MEMORY.md, USER.md, cron, and MCP server registry. Owns ~/.hermes; survives sleep.",
			bullets: [
				"~/.hermes/ (skills, crons, sessions)",
				"MEMORY.md / USER.md",
				"OpenAI-compatible /v1",
			],
			mark: "nous",
			tone: "agent",
			size: "md",
			status: "live",
		},
	},
	{
		id: "agent-openclaw",
		type: "box",
		position: { x: 920, y: 720 },
		sourcePosition: Position.Left,
		targetPosition: Position.Top,
		data: {
			eyebrow: "agent runtime",
			title: "OpenClaw",
			subtitle: "Anthropic computer-use loop",
			body: "Alternative runtime. Anthropic-style computer use with browser, screenshot, click_xy, type_text. Owns ~/.openclaw; same gateway port.",
			bullets: [
				"~/.openclaw/ (state, screenshots)",
				"X server + browser",
				"OpenAI-compatible /v1",
			],
			mark: "openclaw",
			tone: "agent",
			size: "md",
			status: "live",
		},
	},
	// Row 7 -- on-disk paths (sisters)
	{
		id: "path-app",
		type: "box",
		position: { x: 30, y: 905 },
		sourcePosition: Position.Right,
		targetPosition: Position.Top,
		data: {
			eyebrow: "on-disk path",
			title: "~/.agent-machines/",
			subtitle: "app data: chats, artifacts, indexes",
			body: "Product data lives separately from agent runtime state so Hermes/OpenClaw upgrades never own user files.",
			bullets: [
				"chats/*.json",
				"artifacts/<id>/",
				"machine-readable indexes",
			],
			tone: "state",
			size: "md",
		},
	},
	{
		id: "path-hermes",
		type: "box",
		position: { x: 280, y: 905 },
		sourcePosition: Position.Right,
		targetPosition: Position.Top,
		data: {
			eyebrow: "on-disk path",
			title: "~/.hermes/",
			subtitle: "Hermes runtime, NOT app data",
			body: "Footgun defused: ~/.hermes is the Hermes runtime root. Skills, crons, sessions, gateway logs, model config. Not the app data root.",
			bullets: [
				"skills/ + crons/",
				"sessions.db (FTS5)",
				"gateway log + config",
			],
			mark: "nous",
			tone: "state",
			size: "md",
		},
	},
	{
		id: "path-repo",
		type: "box",
		position: { x: 540, y: 905 },
		sourcePosition: Position.Right,
		targetPosition: Position.Top,
		data: {
			eyebrow: "on-disk path",
			title: "/home/machine/agent-machines/",
			subtitle: "git checkout for reloads",
			body: "Just the repo checkout used by reload-from-git.sh. Not ~/.hermes and not the agent runtime.",
			bullets: [
				"git fetch origin/main",
				"sync knowledge/ into ~/.hermes",
				"used by Reload Knowledge",
			],
			tone: "state",
			size: "md",
		},
	},
	{
		id: "path-openclaw",
		type: "box",
		position: { x: 800, y: 905 },
		sourcePosition: Position.Right,
		targetPosition: Position.Top,
		data: {
			eyebrow: "on-disk path",
			title: "~/.openclaw/",
			subtitle: "OpenClaw runtime state",
			body: "Only present when OpenClaw is installed. Gateway log, screenshots, computer-use cache, model config.",
			bullets: [
				"screenshots/",
				"gateway log + config",
				"X server scratch",
			],
			mark: "openclaw",
			tone: "state",
			size: "md",
		},
	},
	// Row 8 -- tool layer (loadout cluster)
	{
		id: "loadout-builtins",
		type: "box",
		position: { x: 60, y: 1095 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "tool surface",
			title: "23 built-in tools",
			subtitle: "agent calls these directly",
			body: "Terminal, filesystem, browser (Playwright), vision, image generation, code execution, web search, memory, schedule, subagent delegation.",
			bullets: [
				"terminal . fs_read/write",
				"browser_* . vision",
				"execute_code . delegate",
			],
			tone: "tools",
			size: "md",
		},
	},
	{
		id: "loadout-services",
		type: "box",
		position: { x: 350, y: 1095 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "tool surface",
			title: "17 MCP services",
			subtitle: "branded tool integrations",
			body: "Each service mounts as an MCP server with its own tool catalog. The agent picks a service interface (MCP > CLI > skill) per service.",
			bullets: [
				"Vercel . Stripe . Supabase",
				"Linear . GitHub . Slack . Sentry",
				"PostHog . Figma . Shopify ...",
			],
			services: ["vercel", "stripe", "supabase", "linear", "github", "slack"],
			tone: "service",
			size: "md",
		},
	},
	{
		id: "loadout-skills",
		type: "box",
		position: { x: 660, y: 1095 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "behavior packs",
			title: "95 SKILL.md files",
			subtitle: "load on demand by intent",
			body: "Behavior packs that activate when a prompt matches the skill description. Reload from GitHub via the dashboard.",
			bullets: [
				"design + code review",
				"security + perf + content",
				"reload via git pull",
			],
			tone: "tools",
			size: "md",
		},
	},
	{
		id: "loadout-cursor",
		type: "box",
		position: { x: 970, y: 1095 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "delegation",
			title: "cursor-bridge",
			subtitle: "MCP server wrapping @cursor/sdk",
			body: "Optional delegation surface. When CURSOR_API_KEY is set, Hermes can spawn Cursor coding agents for code edits.",
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
		position: { x: 540, y: 1280 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "inference router",
			title: "Dedalus AI router",
			subtitle: "api.dedaluslabs.ai/v1",
			body: "OpenAI-compatible router that fronts 200+ models. Hermes is configured via model.base_url; swap DEDALUS_CHAT_BASE_URL to target a different OpenAI-compatible endpoint.",
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
	// Row 10 -- model providers (sisters)
	{
		id: "model-anthropic",
		type: "box",
		position: { x: 220, y: 1455 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "model provider",
			title: "Anthropic",
			subtitle: "Claude family",
			body: "Default Hermes model is anthropic/claude-sonnet-4-6. OpenClaw uses anthropic-prefixed models for the computer-use loop.",
			bullets: ["claude-sonnet-4-6", "computer-use", "tool-use"],
			services: ["anthropic"],
			tone: "model",
			size: "md",
		},
	},
	{
		id: "model-openai",
		type: "box",
		position: { x: 540, y: 1455 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "model provider",
			title: "OpenAI",
			subtitle: "GPT family",
			body: "Routed through the same OpenAI-compatible gateway. Set the model slug on the machine record to switch.",
			bullets: ["gpt-4o family", "structured output", "OpenAI-compatible"],
			services: ["openai"],
			tone: "model",
			size: "md",
		},
	},
	{
		id: "model-others",
		type: "box",
		position: { x: 860, y: 1455 },
		targetPosition: Position.Top,
		sourcePosition: Position.Bottom,
		data: {
			eyebrow: "model provider",
			title: "Other catalogs",
			subtitle: "Mistral . Together . Groq . xAI . ...",
			body: "Anything the Dedalus router lists. Or point DEDALUS_CHAT_BASE_URL at an alternative gateway.",
			bullets: [
				"200+ slugs via the router",
				"swap base_url to use another gateway",
				"per-machine model choice",
			],
			tone: "model",
			size: "md",
		},
	},
];

const EDGES: Edge[] = [
	// Operator -> control plane
	{ id: "e-operator-web", source: "operator", target: "web", label: "browser" },
	{ id: "e-operator-cli", source: "operator", target: "cli", label: "terminal" },
	// Control plane -> fleet
	{ id: "e-web-fleet", source: "web", target: "fleet", label: "auth + config" },
	// Fleet -> providers (3-way fan-out)
	{
		id: "e-fleet-dedalus",
		source: "fleet",
		target: "provider-dedalus",
		label: "active provider",
	},
	{
		id: "e-fleet-vercel",
		source: "fleet",
		target: "provider-vercel",
		label: "alt",
	},
	{
		id: "e-fleet-fly",
		source: "fleet",
		target: "provider-fly",
		label: "alt",
	},
	// CLI -> Dedalus (root path)
	{
		id: "e-cli-dedalus",
		source: "cli",
		target: "provider-dedalus",
		label: "deploy/wake",
	},
	// Providers -> machine (Dedalus is the live one)
	{
		id: "e-dedalus-machine",
		source: "provider-dedalus",
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
	// Gateway -> agents (2-way fan-out)
	{
		id: "e-gateway-hermes",
		source: "gateway",
		target: "agent-hermes",
		label: "turn loop",
	},
	{
		id: "e-gateway-openclaw",
		source: "gateway",
		target: "agent-openclaw",
		label: "turn loop",
	},
	// Agents -> on-disk paths
	{
		id: "e-hermes-app",
		source: "agent-hermes",
		target: "path-app",
		label: "writes",
	},
	{
		id: "e-hermes-runtime",
		source: "agent-hermes",
		target: "path-hermes",
		label: "owns",
	},
	{
		id: "e-hermes-repo",
		source: "agent-hermes",
		target: "path-repo",
		label: "reload sync",
	},
	{
		id: "e-openclaw-app",
		source: "agent-openclaw",
		target: "path-app",
		label: "writes",
	},
	{
		id: "e-openclaw-runtime",
		source: "agent-openclaw",
		target: "path-openclaw",
		label: "owns",
	},
	// Agents -> tool surface
	{
		id: "e-hermes-builtins",
		source: "agent-hermes",
		target: "loadout-builtins",
		label: "calls",
	},
	{
		id: "e-hermes-services",
		source: "agent-hermes",
		target: "loadout-services",
		label: "MCP",
	},
	{
		id: "e-hermes-skills",
		source: "agent-hermes",
		target: "loadout-skills",
		label: "load",
	},
	{
		id: "e-hermes-cursor",
		source: "agent-hermes",
		target: "loadout-cursor",
		label: "spawn",
	},
	{
		id: "e-openclaw-builtins",
		source: "agent-openclaw",
		target: "loadout-builtins",
		label: "calls",
	},
	{
		id: "e-openclaw-services",
		source: "agent-openclaw",
		target: "loadout-services",
		label: "MCP",
	},
	// Tool surface -> inference router (gateway too for first-class chat)
	{
		id: "e-builtins-router",
		source: "loadout-builtins",
		target: "router",
		label: "tool-backed inference",
	},
	{
		id: "e-services-router",
		source: "loadout-services",
		target: "router",
		label: "tool-backed inference",
	},
	{
		id: "e-cursor-router",
		source: "loadout-cursor",
		target: "router",
		label: "model fan-in",
	},
	// Gateway -> router (the chat path)
	{
		id: "e-gateway-router",
		source: "gateway",
		target: "router",
		label: "chat completions",
	},
	// Router -> models
	{
		id: "e-router-anthropic",
		source: "router",
		target: "model-anthropic",
		label: "claude-*",
	},
	{
		id: "e-router-openai",
		source: "router",
		target: "model-openai",
		label: "gpt-*",
	},
	{
		id: "e-router-others",
		source: "router",
		target: "model-others",
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
					edge.id === "e-dedalus-machine" ||
					edge.id === "e-machine-gateway" ||
					edge.id === "e-gateway-router";
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
						gateway. The diagram below shows everything the rig actually has:
						three providers, two agent runtimes, four on-disk path roots, the
						full tool surface (built-ins + 17 services + 95 skills + optional
						cursor delegation), and a configurable inference router that
						fronts 200+ models. Click any node to inspect; drag to rearrange.
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
					body="~/.agent-machines (app), ~/.hermes (runtime), ~/.openclaw, repo checkout."
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

			<div className="architecture-canvas relative mt-4 h-[860px] overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-bg)] md:h-[940px]">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(circle at 50% 36%, var(--ret-purple-glow), transparent 24%), radial-gradient(circle at 50% 73%, rgba(34,197,94,0.08), transparent 22%), radial-gradient(circle at 24% 14%, rgba(245,158,11,0.06), transparent 20%), radial-gradient(circle at 78% 86%, rgba(170,165,230,0.10), transparent 22%)",
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
					fitViewOptions={{ padding: 0.12 }}
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
