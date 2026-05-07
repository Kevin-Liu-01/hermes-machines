import skillsData from "@/data/skills.json";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { cn } from "@/lib/cn";

type RawSkill = {
	slug: string;
	description: string;
	category: string;
};

const SKILLS = skillsData as RawSkill[];

const CATEGORY_BLURB: Record<string, string> = {
	philosophy: "How the agent thinks about code -- minimal-fix bias, invariants, taste.",
	engineering: "Conventions and refactors -- commits, comments, types, language style.",
	review: "Bug-finding and audit discipline -- adversarial review, perf, postmortems.",
	design: "Frontend craft -- React, taste systems, component design, image direction.",
	content: "Writing -- copy, voice, social, SEO/GEO.",
	ops: "Run things, schedule things, browse the internet, query databases.",
	delegation: "When and how to spawn another agent (Cursor, sub-agents, skill discovery).",
	uncategorized: "Skills not yet classified -- the dashboard still loads them.",
};

const CATEGORY_ORDER = [
	"philosophy",
	"engineering",
	"review",
	"design",
	"content",
	"ops",
	"delegation",
	"uncategorized",
];

type Bucket = {
	category: string;
	count: number;
	samples: string[];
};

function bucketize(): Bucket[] {
	const map = new Map<string, RawSkill[]>();
	for (const skill of SKILLS) {
		const list = map.get(skill.category) ?? [];
		list.push(skill);
		map.set(skill.category, list);
	}
	const buckets: Bucket[] = [];
	for (const category of CATEGORY_ORDER) {
		const list = map.get(category);
		if (!list || list.length === 0) continue;
		buckets.push({
			category,
			count: list.length,
			samples: list
				.slice()
				.sort((a, b) => a.slug.localeCompare(b.slug))
				.slice(0, 6)
				.map((s) => s.slug),
		});
	}
	return buckets;
}

export function SkillsManifest() {
	const buckets = bucketize();
	return (
		<>
			<div className="flex items-end justify-between gap-4">
				<div>
					<ReticleLabel>SKILLS -- BUNDLED LIBRARY</ReticleLabel>
					<h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
						Loaded into{" "}
						<span className="font-mono text-[var(--ret-purple)]">~/.hermes/skills/</span>
					</h2>
				</div>
				<p className="hidden font-mono text-xs text-[var(--ret-text-muted)] md:block">
					{SKILLS.length} skills . all on disk . zero RAG roundtrips
				</p>
			</div>

			<div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{buckets.map((bucket) => (
					<div
						key={bucket.category}
						className={cn(
							"rounded-md border border-[var(--ret-border)] bg-[var(--ret-bg)] p-5",
							"transition-colors duration-200 hover:border-[var(--ret-border-hover)]",
						)}
					>
						<div className="flex items-baseline justify-between gap-2">
							<p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
								{bucket.category}
							</p>
							<p className="font-mono text-sm tabular-nums text-[var(--ret-purple)]">
								{bucket.count}
							</p>
						</div>
						<p className="mt-2 text-sm leading-relaxed text-[var(--ret-text-dim)]">
							{CATEGORY_BLURB[bucket.category] ?? "(no description)"}
						</p>
						<div className="mt-3 flex flex-wrap gap-1.5">
							{bucket.samples.map((slug) => (
								<span
									key={slug}
									className="rounded border border-[var(--ret-border)] bg-[var(--ret-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ret-text-dim)]"
								>
									{slug}
								</span>
							))}
							{bucket.count > bucket.samples.length ? (
								<span className="rounded px-1.5 py-0.5 font-mono text-[10px] text-[var(--ret-text-muted)]">
									+{bucket.count - bucket.samples.length} more
								</span>
							) : null}
						</div>
					</div>
				))}
			</div>

			<p className="mt-6 max-w-prose text-sm text-[var(--ret-text-dim)]">
				Each one is a{" "}
				<code className="rounded border border-[var(--ret-border)] bg-[var(--ret-surface)] px-1 font-mono text-[0.85em]">
					knowledge/skills/&lt;name&gt;/SKILL.md
				</code>{" "}
				on this repo. Edit any of them on GitHub, click{" "}
				<span className="font-mono text-[var(--ret-purple)]">Reload knowledge</span>{" "}
				on the dashboard, and the agent picks them up on its next session.
			</p>
		</>
	);
}
