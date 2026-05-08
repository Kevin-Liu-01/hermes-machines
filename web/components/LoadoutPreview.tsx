import { Logo } from "@/components/Logo";
import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleHatch } from "@/components/reticle/ReticleHatch";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { listMcpServers } from "@/lib/dashboard/mcps";
import { listSkills } from "@/lib/dashboard/skills";
import {
	BUILTIN_TOOLS,
	CATEGORY_LABEL,
	SERVICES,
	TASKS,
	type ToolCategory,
} from "@/lib/dashboard/loadout";

/**
 * Landing-page preview of the rig's loadout.
 *
 * Three-up summary (built-ins, services, tasks) plus a category strip
 * for built-in tools and a partner strip for services. Designed to
 * read in two seconds: "your agent has X tools across Y categories,
 * here's a glimpse, click through for the full inventory."
 */
export function LoadoutPreview() {
	const skills = listSkills();
	const mcps = listMcpServers();
	const mcpToolCount = mcps.reduce((sum, m) => sum + m.tools.length, 0);
	const totalCallable = BUILTIN_TOOLS.length + mcpToolCount;

	const catCounts = BUILTIN_TOOLS.reduce<Record<string, number>>(
		(acc, t) => ({ ...acc, [t.category]: (acc[t.category] ?? 0) + 1 }),
		{},
	);
	const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

	const skillCats = skills.reduce<Record<string, number>>(
		(acc, s) => ({ ...acc, [s.category]: (acc[s.category] ?? 0) + 1 }),
		{},
	);
	const skillEntries = Object.entries(skillCats).sort((a, b) => b[1] - a[1]);

	const featuredTasks = TASKS.slice(0, 6);

	return (
		<>
			<div className="flex items-baseline justify-between gap-3">
				<div>
					<ReticleLabel>LOADOUT</ReticleLabel>
					<h2 className="ret-display mt-2 text-xl md:text-2xl">
						Your agent's complete kit.
					</h2>
				</div>
				<ReticleButton
					as="a"
					href="/dashboard/loadout"
					variant="secondary"
					size="sm"
				>
					See full loadout
				</ReticleButton>
			</div>

			<p className="mt-2 max-w-[80ch] text-[12px] text-[var(--ret-text-dim)]">
				Mirrors the wiki's <code>tool-hierarchy.mdc</code>: every tool the
				agent picks from, ranked. Built-in tools fire in one turn. MCP servers
				get auto-spawned at bootstrap. Service entries cover{" "}
				<strong className="text-[var(--ret-text)]">{SERVICES.length}</strong>{" "}
				platforms (Vercel, Stripe, Supabase, Sentry, ...). Task entries rank
				which skill or tool to use for code review, design review, QA,
				research, and more.
			</p>

			<div className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] sm:grid-cols-4">
				<Tally label="callable tools" value={totalCallable} />
				<Tally label="skills" value={skills.length} />
				<Tally label="services" value={SERVICES.length} />
				<Tally label="task categories" value={TASKS.length} />
			</div>

			<div className="mt-px grid grid-cols-1 gap-px overflow-hidden border border-[var(--ret-border)] border-t-0 bg-[var(--ret-border)] lg:grid-cols-3">
				{/* Built-in tools by category */}
				<div className="space-y-3 bg-[var(--ret-bg)] p-4">
					<div className="flex items-baseline justify-between">
						<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
							built-in tools . {BUILTIN_TOOLS.length}
						</p>
						<a
							href="/dashboard/loadout?tab=builtin"
							className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-purple)] hover:underline"
						>
							view {">"}
						</a>
					</div>
					<ReticleHatch
						className="h-px border-t border-[var(--ret-border)]"
						pitch={6}
					/>
					<ul className="space-y-1.5">
						{catEntries.map(([cat, count]) => (
							<li
								key={cat}
								className="flex items-center justify-between gap-2 font-mono text-[11px]"
							>
								<span className="text-[var(--ret-text)]">
									{CATEGORY_LABEL[cat as ToolCategory] ?? cat}
								</span>
								<span className="font-mono tabular-nums text-[var(--ret-text-muted)]">
									{count}
								</span>
							</li>
						))}
					</ul>
				</div>

				{/* Services by partner */}
				<div className="space-y-3 bg-[var(--ret-bg)] p-4">
					<div className="flex items-baseline justify-between">
						<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
							services . {SERVICES.length}
						</p>
						<a
							href="/dashboard/loadout?tab=services"
							className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-purple)] hover:underline"
						>
							view {">"}
						</a>
					</div>
					<ReticleHatch
						className="h-px border-t border-[var(--ret-border)]"
						pitch={6}
					/>
					<ul className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
						{SERVICES.slice(0, 12).map((s) => (
							<li
								key={s.id}
								className="truncate text-[var(--ret-text)]"
								title={s.tagline}
							>
								<span className="text-[var(--ret-text-muted)]">.</span>{" "}
								{s.name}
							</li>
						))}
					</ul>
					<div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-[var(--ret-text-muted)]">
						<span>each ranks</span>
						<ReticleBadge variant="default" className="text-[10px]">
							MCP
						</ReticleBadge>
						<span>{">"}</span>
						<ReticleBadge variant="default" className="text-[10px]">
							CLI
						</ReticleBadge>
						<span>{">"}</span>
						<ReticleBadge variant="default" className="text-[10px]">
							skills
						</ReticleBadge>
					</div>
				</div>

				{/* Task hierarchy */}
				<div className="space-y-3 bg-[var(--ret-bg)] p-4">
					<div className="flex items-baseline justify-between">
						<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
							tasks . {TASKS.length}
						</p>
						<a
							href="/dashboard/loadout?tab=tasks"
							className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-purple)] hover:underline"
						>
							view {">"}
						</a>
					</div>
					<ReticleHatch
						className="h-px border-t border-[var(--ret-border)]"
						pitch={6}
					/>
					<ul className="space-y-2">
						{featuredTasks.map((t) => (
							<li key={t.id} className="font-mono text-[11px]">
								<span className="text-[var(--ret-text)]">{t.name}</span>
								<span className="ml-1.5 text-[10px] text-[var(--ret-text-muted)]">
									{t.tools[0]?.label}
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="mt-px grid grid-cols-2 gap-px overflow-hidden border border-[var(--ret-border)] border-t-0 bg-[var(--ret-border)] sm:grid-cols-3 lg:grid-cols-7">
				{skillEntries.map(([cat, count]) => (
					<div
						key={cat}
						className="flex items-center justify-between gap-2 bg-[var(--ret-bg)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]"
					>
						<span>skill . {cat}</span>
						<span className="font-mono tabular-nums text-[var(--ret-text)]">
							{count}
						</span>
					</div>
				))}
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
				<span>callable by</span>
				<span className="flex items-center gap-1.5">
					<Logo mark="nous" size={14} />
					hermes
				</span>
				<span className="text-[var(--ret-text-muted)]">/</span>
				<span className="flex items-center gap-1.5">
					<Logo mark="openclaw" size={14} />
					openclaw
				</span>
				<span className="ml-auto hidden md:inline">
					mirrors{" "}
					<code className="bg-[var(--ret-surface)] px-1">
						tool-hierarchy.mdc
					</code>
				</span>
			</div>
		</>
	);
}

function Tally({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col gap-0.5 bg-[var(--ret-bg)] px-4 py-3">
			<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
				{label}
			</p>
			<p className="font-mono text-base tabular-nums text-[var(--ret-text)]">
				{value}
			</p>
		</div>
	);
}
