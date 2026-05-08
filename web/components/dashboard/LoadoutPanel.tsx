"use client";

import { useMemo, useState } from "react";

import { Logo } from "@/components/Logo";
import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleFrame } from "@/components/reticle/ReticleFrame";
import { ReticleHatch } from "@/components/reticle/ReticleHatch";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { ServiceIcon } from "@/components/ServiceIcon";
import { ToolIcon } from "@/components/ToolIcon";
import { cn } from "@/lib/cn";
import {
	CATEGORY_LABEL,
	INTERFACE_LABEL,
	type AgentSupport,
	type BuiltinTool,
	type LoadoutCounts,
	type ServiceEntry,
	type TaskEntry,
	type TaskTool,
	type ToolCategory,
} from "@/lib/dashboard/loadout";
import type { McpServerWithBrand } from "@/lib/dashboard/mcps";
import type { SkillSummary } from "@/lib/dashboard/types";

type Props = {
	counts: LoadoutCounts;
	skills: SkillSummary[];
	mcps: McpServerWithBrand[];
	builtins: BuiltinTool[];
	services: ServiceEntry[];
	tasks: TaskEntry[];
};

type Tab = "all" | "builtin" | "mcp" | "skills" | "services" | "tasks";

const TABS: ReadonlyArray<{ id: Tab; label: string; count: (c: Props) => number }> = [
	{ id: "all", label: "All", count: (p) => p.counts.total + p.services.length + p.tasks.length },
	{ id: "builtin", label: "Built-in tools", count: (p) => p.builtins.length },
	{ id: "mcp", label: "MCP servers", count: (p) => p.counts.mcpTools },
	{ id: "skills", label: "Skills", count: (p) => p.skills.length },
	{ id: "services", label: "Services", count: (p) => p.services.length },
	{ id: "tasks", label: "Tasks", count: (p) => p.tasks.length },
];

export function LoadoutPanel(props: Props) {
	const [tab, setTab] = useState<Tab>("all");
	const [query, setQuery] = useState("");

	const q = query.trim().toLowerCase();
	const matchSkill = (s: SkillSummary): boolean =>
		!q ||
		s.name.toLowerCase().includes(q) ||
		s.description.toLowerCase().includes(q) ||
		s.category.toLowerCase().includes(q);
	const matchTool = (t: BuiltinTool): boolean =>
		!q ||
		t.name.toLowerCase().includes(q) ||
		t.title.toLowerCase().includes(q) ||
		t.description.toLowerCase().includes(q) ||
		t.category.toLowerCase().includes(q);
	const matchService = (s: ServiceEntry): boolean =>
		!q ||
		s.name.toLowerCase().includes(q) ||
		s.tagline.toLowerCase().includes(q) ||
		s.interfaces.some(
			(i) => i.label.toLowerCase().includes(q) || i.use.toLowerCase().includes(q),
		);
	const matchTask = (t: TaskEntry): boolean =>
		!q ||
		t.name.toLowerCase().includes(q) ||
		t.tagline.toLowerCase().includes(q) ||
		t.tools.some(
			(tool) =>
				tool.label.toLowerCase().includes(q) ||
				tool.use.toLowerCase().includes(q),
		);

	const filteredSkills = useMemo(
		() => props.skills.filter(matchSkill),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[props.skills, q],
	);
	const filteredBuiltins = useMemo(
		() => props.builtins.filter(matchTool),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[props.builtins, q],
	);
	const filteredServices = useMemo(
		() => props.services.filter(matchService),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[props.services, q],
	);
	const filteredTasks = useMemo(
		() => props.tasks.filter(matchTask),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[props.tasks, q],
	);

	return (
		<div className="space-y-6 px-5 py-5">
			<CountStrip counts={props.counts} />

			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ret-border)] pb-3">
				<div className="flex flex-wrap gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)]">
					{TABS.map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={() => setTab(t.id)}
							className={cn(
								"flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] transition-colors",
								tab === t.id
									? "bg-[var(--ret-purple-glow)] text-[var(--ret-purple)]"
									: "bg-[var(--ret-bg)] text-[var(--ret-text-dim)] hover:bg-[var(--ret-surface)] hover:text-[var(--ret-text)]",
							)}
						>
							<span>{t.label}</span>
							<span className="text-[10px] text-[var(--ret-text-muted)]">
								{t.count(props)}
							</span>
						</button>
					))}
				</div>
				<input
					type="search"
					placeholder="filter..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="border border-[var(--ret-border)] bg-[var(--ret-bg)] px-3 py-1.5 font-mono text-[11px] text-[var(--ret-text)] placeholder:text-[var(--ret-text-muted)] focus:border-[var(--ret-purple)] focus:outline-none"
				/>
			</div>

			{(tab === "all" || tab === "builtin") && filteredBuiltins.length > 0 ? (
				<Section
					kicker={`BUILT-IN TOOLS · ${filteredBuiltins.length}`}
					title="Native tools the agent calls without going through MCP"
					body="Ship with the Hermes / OpenClaw install itself. The agent invokes these in a single turn -- no MCP roundtrip, no auth handshake, just a function call into the runtime."
				>
					<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
						{filteredBuiltins.map((t) => (
							<BuiltinCard key={t.name} tool={t} />
						))}
					</div>
				</Section>
			) : null}

			{(tab === "all" || tab === "mcp") && props.mcps.length > 0 ? (
				<Section
					kicker={`MCP SERVERS · ${props.mcps.length} . TOOLS · ${props.counts.mcpTools}`}
					title="External tool servers the agent talks to over stdio"
					body="cursor-bridge spawns Cursor coding agents for actual file edits. hermes-builtins exposes Hermes's full tool surface. Both registered in ~/.hermes/config.toml on bootstrap."
				>
					<div className="grid gap-3 md:grid-cols-2">
						{props.mcps.map((server) => (
							<McpCard key={server.name} server={server} query={q} />
						))}
					</div>
				</Section>
			) : null}

			{(tab === "all" || tab === "services") && filteredServices.length > 0 ? (
				<Section
					kicker={`SERVICES · ${filteredServices.length}`}
					title="Per-service interface ranking"
					body="Mirrors the wiki's tool-hierarchy.mdc. For each service, the agent picks the highest-ranked interface that can do the job. MCP > CLI > skills, with deliberate exceptions per service."
				>
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{filteredServices.map((s) => (
							<ServiceCard key={s.id} service={s} />
						))}
					</div>
				</Section>
			) : null}

			{(tab === "all" || tab === "tasks") && filteredTasks.length > 0 ? (
				<Section
					kicker={`TASKS · ${filteredTasks.length}`}
					title="Per-task tool ranking"
					body="When the agent has to do code review, design review, QA, research, etc., it picks from a ranked list of skills + tools. Lower ranks only fire when the higher ranks can't handle the case."
				>
					<div className="grid gap-3 md:grid-cols-2">
						{filteredTasks.map((t) => (
							<TaskCard key={t.id} task={t} />
						))}
					</div>
				</Section>
			) : null}

			{(tab === "all" || tab === "skills") && filteredSkills.length > 0 ? (
				<Section
					kicker={`SKILLS · ${filteredSkills.length}`}
					title="SKILL.md files loaded on demand"
					body="Each skill is a markdown file the agent loads when its description matches the user's intent. Edit on GitHub, click Reload, the agent picks it up. No redeploy."
				>
					<SkillsByCategory skills={filteredSkills} />
				</Section>
			) : null}

			{filteredSkills.length === 0 &&
			filteredBuiltins.length === 0 &&
			filteredServices.length === 0 &&
			filteredTasks.length === 0 ? (
				<ReticleFrame>
					<div className="p-8 text-center font-mono text-[12px] text-[var(--ret-text-muted)]">
						no matches for &quot;{query}&quot;
					</div>
				</ReticleFrame>
			) : null}
		</div>
	);
}

function CountStrip({ counts }: { counts: LoadoutCounts }) {
	const items = [
		{ label: "skills", value: counts.skills },
		{ label: "mcp servers", value: counts.mcpServers },
		{ label: "mcp tools", value: counts.mcpTools },
		{ label: "built-in tools", value: counts.builtinTools },
		{ label: "services", value: counts.services },
		{ label: "task categories", value: counts.tasks },
	];
	return (
		<div className="grid grid-cols-2 gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] sm:grid-cols-3 lg:grid-cols-6">
			{items.map((i) => (
				<div
					key={i.label}
					className="flex flex-col gap-0.5 bg-[var(--ret-bg)] px-4 py-3"
				>
					<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
						{i.label}
					</p>
					<p className="font-mono text-base tabular-nums text-[var(--ret-text)]">
						{i.value}
					</p>
				</div>
			))}
		</div>
	);
}

function Section({
	kicker,
	title,
	body,
	children,
}: {
	kicker: string;
	title: string;
	body: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-3">
			<div>
				<ReticleLabel>{kicker}</ReticleLabel>
				<h2 className="ret-display mt-1 text-base">{title}</h2>
				<p className="mt-1 max-w-[80ch] text-[12px] text-[var(--ret-text-dim)]">
					{body}
				</p>
			</div>
			<ReticleHatch
				className="h-1 border-t border-b border-[var(--ret-border)]"
				pitch={6}
			/>
			{children}
		</section>
	);
}

const AGENT_BADGE: Record<AgentSupport, { label: string; tone: "accent" | "default" | "warning" }> = {
	hermes: { label: "hermes", tone: "default" },
	openclaw: { label: "openclaw", tone: "warning" },
	both: { label: "both agents", tone: "accent" },
};

function BuiltinCard({ tool }: { tool: BuiltinTool }) {
	const agent = AGENT_BADGE[tool.agent];
	const provider = tool.provider === "rig" ? null : tool.provider;
	return (
		<ReticleFrame>
			<div className="flex items-start justify-between gap-2 border-b border-[var(--ret-border)] px-3 py-2">
				<div className="flex items-center gap-2 min-w-0">
					{/* Brand mark when the tool ships from a partner; otherwise
					    the category icon (Lucide-style) so every tool has a
					    visual anchor. */}
					{provider ? (
						<Logo mark={provider} size={14} />
					) : (
						<ToolIcon
							name={tool.category}
							size={14}
							className="text-[var(--ret-text-muted)]"
						/>
					)}
					<span className="truncate font-mono text-[12px] text-[var(--ret-text)]">
						{tool.name}
					</span>
				</div>
				<ReticleBadge variant={agent.tone} className="text-[10px]">
					{agent.label}
				</ReticleBadge>
			</div>
			<div className="space-y-2 p-3">
				<p className="text-[12px] font-semibold tracking-tight text-[var(--ret-text)]">
					{tool.title}
				</p>
				<p className="text-[11px] leading-relaxed text-[var(--ret-text-dim)]">
					{tool.description}
				</p>
				<p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
					<ToolIcon name={tool.category} size={10} />
					{CATEGORY_LABEL[tool.category as ToolCategory]}
				</p>
			</div>
		</ReticleFrame>
	);
}

function McpCard({
	server,
	query,
}: {
	server: McpServerWithBrand;
	query: string;
}) {
	const tools = query
		? server.tools.filter(
				(t) =>
					t.name.toLowerCase().includes(query) ||
					t.title.toLowerCase().includes(query) ||
					t.description.toLowerCase().includes(query),
			)
		: server.tools;
	return (
		<ReticleFrame>
			<div className="flex items-center justify-between gap-2 border-b border-[var(--ret-border)] px-3 py-2">
				<div className="flex items-center gap-2">
					{server.brand ? <Logo mark={server.brand} size={14} /> : null}
					<span className="font-mono text-[12px] text-[var(--ret-text)]">
						{server.name}
					</span>
					<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
						{server.transport}
					</span>
				</div>
				{server.link ? (
					<a
						href={server.link}
						target="_blank"
						rel="noreferrer"
						className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-purple)] hover:underline"
					>
						docs
					</a>
				) : null}
			</div>
			<div className="space-y-1 p-3">
				<p className="font-mono text-[10px] text-[var(--ret-text-muted)]">
					{server.source}
				</p>
				<ul className="mt-2 space-y-2">
					{tools.map((t) => (
						<li
							key={t.name}
							className="border-l-2 border-[var(--ret-border)] pl-2"
						>
							<p className="font-mono text-[11px] text-[var(--ret-text)]">
								{t.name}
							</p>
							<p className="text-[11px] text-[var(--ret-text-dim)]">
								{t.title}
							</p>
							<p className="mt-0.5 text-[10px] text-[var(--ret-text-muted)]">
								{t.description}
							</p>
						</li>
					))}
				</ul>
			</div>
		</ReticleFrame>
	);
}

function ServiceCard({ service }: { service: ServiceEntry }) {
	return (
		<ReticleFrame>
			<div className="flex items-center justify-between gap-2 border-b border-[var(--ret-border)] px-3 py-2">
				<div className="flex items-center gap-2 min-w-0">
					{service.brand ? (
						<ServiceIcon slug={service.brand} size={16} tone="color" />
					) : (
						<ToolIcon
							name={service.icon}
							size={14}
							className="text-[var(--ret-text-muted)]"
						/>
					)}
					<span className="font-mono text-[12px] text-[var(--ret-text)]">
						{service.name}
					</span>
				</div>
				<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
					{service.interfaces.length} {service.interfaces.length === 1 ? "interface" : "interfaces"}
				</span>
			</div>
			<div className="space-y-2 p-3">
				<p className="text-[11px] text-[var(--ret-text-dim)]">
					{service.tagline}
				</p>
				<ol className="space-y-1.5">
					{service.interfaces.map((i) => (
						<li
							key={`${service.id}-${i.rank}`}
							className="flex items-start gap-2"
						>
							<span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-[var(--ret-purple)]/40 bg-[var(--ret-purple-glow)] font-mono text-[9px] tabular-nums text-[var(--ret-purple)]">
								{i.rank}
							</span>
							<span className="min-w-0 flex-1">
								<span className="font-mono text-[11px] text-[var(--ret-text)]">
									{i.label}
								</span>
								<span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
									{INTERFACE_LABEL[i.kind]}
								</span>
								<p className="text-[10px] text-[var(--ret-text-dim)]">
									{i.use}
								</p>
							</span>
						</li>
					))}
				</ol>
			</div>
		</ReticleFrame>
	);
}

function TaskCard({ task }: { task: TaskEntry }) {
	return (
		<ReticleFrame>
			<div className="flex items-center justify-between gap-2 border-b border-[var(--ret-border)] px-3 py-2">
				<div className="flex items-center gap-2 min-w-0">
					<ToolIcon
						name={task.category}
						size={14}
						className="text-[var(--ret-text-muted)]"
					/>
					<span className="font-mono text-[12px] text-[var(--ret-text)]">
						{task.name}
					</span>
				</div>
				<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
					{task.tools.length} ranked
				</span>
			</div>
			<div className="space-y-2 p-3">
				<p className="text-[11px] text-[var(--ret-text-dim)]">{task.tagline}</p>
				<ol className="space-y-1.5">
					{task.tools.map((tool) => (
						<TaskToolRow key={`${task.id}-${tool.rank}`} tool={tool} category={task.category} />
					))}
				</ol>
			</div>
		</ReticleFrame>
	);
}

function TaskToolRow({
	tool,
	category,
}: {
	tool: TaskTool;
	category: ToolCategory;
}) {
	return (
		<li className="flex items-start gap-2">
			<span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center border border-[var(--ret-amber)]/40 bg-[var(--ret-amber)]/10 font-mono text-[9px] tabular-nums text-[var(--ret-amber)]">
				{tool.rank}
			</span>
			<span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[var(--ret-text-muted)]">
				{tool.brand ? (
					<ServiceIcon slug={tool.brand} size={12} tone="mono" />
				) : (
					<ToolIcon name={category} size={12} />
				)}
			</span>
			<span className="min-w-0 flex-1">
				<span className="font-mono text-[11px] text-[var(--ret-text)]">
					{tool.label}
				</span>
				{tool.skill ? (
					<a
						href={`/dashboard/skills/${tool.skill}`}
						className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ret-purple)] hover:underline"
					>
						skill
					</a>
				) : null}
				<p className="text-[10px] text-[var(--ret-text-dim)]">{tool.use}</p>
			</span>
		</li>
	);
}

function SkillsByCategory({ skills }: { skills: SkillSummary[] }) {
	const grouped = useMemo(() => {
		const m: Record<string, SkillSummary[]> = {};
		for (const s of skills) {
			(m[s.category] ??= []).push(s);
		}
		const ordered = Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
		return ordered;
	}, [skills]);
	return (
		<div className="space-y-4">
			{grouped.map(([cat, list]) => (
				<div key={cat}>
					<p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
						{cat} . {list.length}
					</p>
					<div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
						{list.map((s) => (
							<a
								key={s.slug}
								href={`/dashboard/skills/${s.slug}`}
								className="group flex flex-col gap-1 border border-[var(--ret-border)] bg-[var(--ret-bg)] p-2.5 hover:border-[var(--ret-border-hover)] hover:bg-[var(--ret-surface)]"
							>
								<p className="font-mono text-[11px] text-[var(--ret-text)] group-hover:text-[var(--ret-purple)]">
									{s.name}
								</p>
								<p className="line-clamp-2 text-[10px] leading-snug text-[var(--ret-text-dim)]">
									{s.description}
								</p>
							</a>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
