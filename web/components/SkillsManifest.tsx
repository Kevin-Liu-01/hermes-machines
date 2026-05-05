import { ReticleLabel } from "@/components/reticle/ReticleLabel";

const SKILLS: ReadonlyArray<{
	name: string;
	source: string;
	purpose: string;
}> = [
	{ name: "agent-ethos", source: "wiki/concepts/agent-ethos.md", purpose: "minimal-fix philosophy, hard limits" },
	{ name: "empirical-verification", source: "wiki/concepts/empirical-verification.md", purpose: "scientific method for code" },
	{ name: "production-safety", source: "wiki/concepts/production-safety.md", purpose: "never patch prod databases" },
	{ name: "git-workflow", source: "AGENTS.md / CLAUDE.md", purpose: "switch over checkout, worktrees, conventional commits" },
	{ name: "kevin-voice", source: "wiki/skills/kevin-voice", purpose: "third-person credential-forward writing" },
	{ name: "content-strategy", source: "wiki/skills/content-strategy", purpose: "what to post on X / LinkedIn" },
	{ name: "frontend-design-taste", source: "wiki/skills/frontend-design-taste", purpose: "anti-slop UI rules" },
	{ name: "reticle-design-system", source: "wiki/projects/sigil-ui.md", purpose: "Reticle/Sigil tokens & components" },
	{ name: "automation-cron", source: "hermes-agent docs/cron.md", purpose: "schedule recurring agent tasks" },
	{ name: "security-audit", source: "wiki/skills/deepsec", purpose: "CTF-style adversarial review" },
	{ name: "computer-use", source: "wiki/skills/agent-browser", purpose: "Playwright browser_* patterns" },
	{ name: "plan-mode-review", source: ".cursor/rules/plan-mode-review.mdc", purpose: "structured pre-implementation checklist" },
	{ name: "taste-output", source: "wiki/skills/taste-output", purpose: "no truncation, no skeleton stubs" },
	{ name: "dedalus-machines", source: "wiki/architecture/dedalus-machines-overview", purpose: "DCS runtime model" },
	{ name: "cursor-coding", source: "cursor.com/docs/sdk/typescript", purpose: "delegate real code work to a Cursor agent via cursor_agent MCP tool" },
];

export function SkillsManifest() {
	return (
		<>
			<div className="flex items-end justify-between gap-4">
				<div>
					<ReticleLabel>SKILLS — KNOWLEDGE BASE</ReticleLabel>
					<h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
						Loaded into{" "}
						<span className="font-mono text-[var(--ret-purple)]">~/.hermes/skills/</span>
					</h2>
				</div>
				<p className="hidden font-mono text-xs text-[var(--ret-text-muted)] md:block">
					{SKILLS.length} skills · all on disk · zero RAG roundtrips
				</p>
			</div>

			<div className="mt-6 overflow-hidden rounded-md border border-[var(--ret-border)]">
				<div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.4fr)] gap-px bg-[var(--ret-border)]">
					<HeaderCell>name</HeaderCell>
					<HeaderCell>purpose</HeaderCell>
					<HeaderCell>source</HeaderCell>
					{SKILLS.map((s) => (
						<Row key={s.name} {...s} />
					))}
				</div>
			</div>
		</>
	);
}

function HeaderCell({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-[var(--ret-bg-soft)] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
			{children}
		</div>
	);
}

function Row({ name, purpose, source }: { name: string; purpose: string; source: string }) {
	return (
		<>
			<div className="bg-[var(--ret-bg)] px-4 py-3 font-mono text-sm text-[var(--ret-purple)]">
				{name}
			</div>
			<div className="bg-[var(--ret-bg)] px-4 py-3 text-sm text-[var(--ret-text)]">
				{purpose}
			</div>
			<div className="bg-[var(--ret-bg)] px-4 py-3 font-mono text-xs text-[var(--ret-text-dim)]">
				{source}
			</div>
		</>
	);
}
