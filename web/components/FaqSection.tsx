import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { FAQ } from "@/lib/seo/config";

/**
 * Visible FAQ rendered into the landing page. Mirrors the
 * `FAQPage` JSON-LD entries 1:1 (`lib/seo/config.ts` is the single
 * source of truth for both) so AI search engines see matched on-page
 * + schema content -- a Princeton GEO method that compounds the
 * citation rate of either signal alone.
 *
 * Format chosen for AI extractability: question-led H3, direct
 * one-paragraph answer immediately after, no nested headings, no
 * surrounding chrome that would dilute the answer block.
 */
export function FaqSection() {
	return (
		<>
			<div className="flex items-baseline justify-between gap-3">
				<div>
					<ReticleLabel>FAQ</ReticleLabel>
					<h2 className="ret-display mt-2 text-xl md:text-2xl">
						Common questions about persistent agent machines.
					</h2>
				</div>
				<p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)] md:block">
					{FAQ.length} answers
				</p>
			</div>

			<dl className="mt-5 flex flex-col divide-y divide-[var(--ret-border)] border-y border-[var(--ret-border)]">
				{FAQ.map(({ question, answer }, i) => (
					<div
						key={question}
						className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-8"
					>
						<dt className="flex items-baseline gap-3">
							<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ret-text-muted)]">
								{String(i + 1).padStart(2, "0")}
							</span>
							<h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[var(--ret-text)] md:text-[16px]">
								{question}
							</h3>
						</dt>
						<dd className="text-[13px] leading-relaxed text-[var(--ret-text-dim)]">
							{answer}
						</dd>
					</div>
				))}
			</dl>
		</>
	);
}
