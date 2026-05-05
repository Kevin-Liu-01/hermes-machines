import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";

export function HeroBlock() {
	return (
		<div className="grid items-start gap-12 md:grid-cols-[1.4fr_1fr]">
			<div>
				<div className="flex flex-wrap items-center gap-2">
					<ReticleLabel>HERMES PERSISTENT</ReticleLabel>
					<ReticleBadge variant="accent">v0.1</ReticleBadge>
					<ReticleBadge>dedalus machines</ReticleBadge>
				</div>
				<h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
					A persistent agent
					<br />
					with a body{" "}
					<span className="text-[var(--ret-text-dim)]">and a memory.</span>
				</h1>
				<p className="mt-5 max-w-[58ch] text-base leading-relaxed text-[var(--ret-text-dim)] md:text-lg">
					Hermes Agent, deployed inside a Dedalus microVM. It has a shell, a
					browser, file access, scheduled crons, and a knowledge base of
					skills lifted from my personal LLM wiki. Talk to it here. It
					remembers.
				</p>
				<div className="mt-7 flex flex-wrap gap-3">
					<ReticleButton
						as="a"
						href="https://github.com/Kevin-Liu-01/hermes-persistent"
						target="_blank"
						variant="primary"
					>
						View on GitHub
					</ReticleButton>
					<ReticleButton
						as="a"
						href="https://github.com/NousResearch/hermes-agent"
						target="_blank"
						variant="secondary"
					>
						Hermes docs
					</ReticleButton>
					<ReticleButton
						as="a"
						href="https://docs.dedaluslabs.ai/dcs"
						target="_blank"
						variant="ghost"
					>
						Dedalus DCS
					</ReticleButton>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[var(--ret-border)] bg-[var(--ret-border)]">
				<HeroStat label="vCPU" value="2" />
				<HeroStat label="memory" value="4 GiB" />
				<HeroStat label="storage" value="20 GiB" />
				<HeroStat label="ports" value="8642 / 9119" />
				<HeroStat label="skills" value="13" hint="kevin-wiki" />
				<HeroStat label="crons" value="4" hint="seeded" />
			</div>
		</div>
	);
}

function HeroStat({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="bg-[var(--ret-bg)] p-5">
			<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
				{label}
			</p>
			<p className="mt-3 font-mono text-2xl text-[var(--ret-text)]">{value}</p>
			{hint ? (
				<p className="mt-1 font-mono text-[10px] tracking-wide text-[var(--ret-text-dim)]">
					{hint}
				</p>
			) : null}
		</div>
	);
}
