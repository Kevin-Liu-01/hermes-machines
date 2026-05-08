import { Logo, type CompositeMark } from "@/components/Logo";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { cn } from "@/lib/cn";

type Capability = {
	kicker: string;
	title: string;
	body: string;
	notes: string[];
	mark?: CompositeMark;
};

const CAPABILITIES: ReadonlyArray<Capability> = [
	{
		kicker: "DELEGATION",
		title: "Spawns Cursor coding agents",
		body: "When you ask for real code changes, Hermes hands off to a Cursor agent via the cursor_agent MCP tool. Same model the Cursor IDE runs, full file access, with the rig's skills injected as .cursor/rules.",
		notes: ["cursor_agent", "@cursor/sdk", "load_skills"],
		mark: "cursor",
	},
	{
		kicker: "TOOLS",
		title: "40+ tools, one prompt away",
		body: "Terminal, file ops, web search, browser automation (Playwright), vision, image generation, MCP servers, code execution, subagent delegation.",
		notes: ["terminal", "browser_*", "web_search", "execute_code"],
		mark: "agent",
	},
	{
		kicker: "KNOWLEDGE",
		title: "95-skill bundled library",
		body: "SKILL.md docs that load on-demand. Ethos, empirical verification, production safety, design taste, security audit, performance, taste. Drop your own folders into knowledge/skills/ to extend.",
		notes: ["agent-ethos", "deepsec", "torvalds", "taste-stitch"],
	},
	{
		kicker: "MEMORY",
		title: "Persistent across sessions",
		body: "USER.md models you. MEMORY.md models the environment. FTS5 sessions DB lets the agent search every prior conversation.",
		notes: ["USER.md", "MEMORY.md", "FTS5"],
		mark: "agent",
	},
	{
		kicker: "SCHEDULE",
		title: "Cron, in plain English",
		body: 'Ask: "every weekday at 8am, brief me." It schedules itself. Pre-seeded with health checks, digests, audits.',
		notes: ["every 1h", "0 9 * * *", "0 4 * * mon"],
	},
	{
		kicker: "RUNTIME",
		title: "Sleep / wake, by the second",
		body: "Dedalus microVMs hibernate while idle and wake in seconds. Persistent volume keeps your skills, memory, and venv intact across sleeps.",
		notes: ["microVM", "/home/machine persists", "second-billing"],
		mark: "dedalus",
	},
	{
		kicker: "PERSIST",
		title: "Edit on GitHub, click reload",
		body: "knowledge/ lives in this repo. The dashboard's Reload button runs git pull on the VM and rsyncs the new SKILL.md files into ~/.hermes/. No CLI ever.",
		notes: ["git pull", "rsync", "no CLI"],
		mark: "dedalus",
	},
	{
		kicker: "API",
		title: "OpenAI-compatible endpoint",
		body: "Hermes exposes /v1/chat/completions, /v1/responses, /v1/models. Open WebUI, LobeChat, ChatBox -- anything that speaks OpenAI works as a frontend.",
		notes: ["/v1/chat/completions", "Bearer auth", "SSE streaming"],
		mark: "dedalus",
	},
];

export function CapabilityGrid() {
	return (
		<>
			<div className="flex items-baseline justify-between gap-3">
				<div>
					<ReticleLabel>CAPABILITIES</ReticleLabel>
					<h2 className="ret-display mt-2 text-xl md:text-2xl">
						Eight surfaces, one machine.
					</h2>
				</div>
				<p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)] md:block">
					{CAPABILITIES.length} entries
				</p>
			</div>
			<div className="mt-4 grid grid-cols-1 gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] md:grid-cols-2 lg:grid-cols-4">
				{CAPABILITIES.map((c) => (
					<div
						key={c.title}
						className={cn(
							"flex flex-col gap-2 bg-[var(--ret-bg)] p-4",
							"transition-colors duration-150 hover:bg-[var(--ret-surface)]",
						)}
					>
						<div className="flex items-center justify-between gap-2">
							<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
								{c.kicker}
							</p>
							{c.mark ? <Logo mark={c.mark} size={14} /> : null}
						</div>
						<h3 className="text-sm font-semibold leading-snug tracking-tight">
							{c.title}
						</h3>
						<p className="text-[12px] leading-relaxed text-[var(--ret-text-dim)]">
							{c.body}
						</p>
						<div className="mt-auto flex flex-wrap gap-1 pt-1">
							{c.notes.map((n) => (
								<span
									key={n}
									className="border border-[var(--ret-border)] bg-[var(--ret-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ret-text-dim)]"
								>
									{n}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</>
	);
}
