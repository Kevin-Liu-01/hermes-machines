import { ReticleLabel } from "@/components/reticle/ReticleLabel";

/**
 * ASCII-art-style architecture diagram rendered as a CSS box layout. Pure
 * decoration; the actual structural rails come from the page-level Reticle
 * grid. We use the same border tokens so it visually inherits.
 */
export function ArchitectureDiagram() {
	return (
		<>
			<ReticleLabel>ARCHITECTURE</ReticleLabel>
			<h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
				One key, two endpoints, full agent
			</h2>
			<p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-[var(--ret-text-dim)] md:text-base">
				The same{" "}
				<code className="rounded border border-[var(--ret-border)] bg-[var(--ret-surface)] px-1 font-mono text-[0.85em]">
					DEDALUS_API_KEY
				</code>{" "}
				provisions the machine and authenticates inference. The machine routes
				LLM calls through the Dedalus gateway, exposes itself on a public
				preview URL, and runs Hermes as the application layer.
			</p>

			<div className="mt-6 overflow-hidden rounded-md border border-[var(--ret-border)] bg-[var(--ret-bg)] p-6 font-mono text-[12px] leading-[1.85] md:text-[13px]">
				<pre className="text-[var(--ret-text-dim)]">
{`                      [ you @ npm run chat ]
                              │
                              │  POST /v1/chat/completions
                              ▼
            ┌──────────────────────────────────────────┐
            │  public preview / cloudflared tunnel     │
            └──────────────────────────────────────────┘
                              │
                              ▼
        ╔═════════════════ Dedalus Machine ═══════════════╗
        ║                                                  ║
        ║   :8642  hermes gateway  ── OpenAI API          ║
        ║   :9119  hermes dashboard                        ║
        ║                                                  ║
        ║   ┌──────────────┐         ┌──────────────────┐ ║
        ║   │ Hermes (Py)  │ ◀─MCP─▶ │ cursor-bridge    │ ║
        ║   │ tools, cron, │  stdio  │ (Node + @cursor/ │ ║
        ║   │ skills, mem  │         │  sdk)            │ ║
        ║   └──────────────┘         └──────────────────┘ ║
        ║         │                          │            ║
        ║         │                          ▼            ║
        ║         │                  ┌──────────────────┐ ║
        ║         │                  │ Cursor Agent     │ ║
        ║         │                  │ (composer-2)     │ ║
        ║         │                  │ files, terminal, │ ║
        ║         │                  │ semantic search  │ ║
        ║         │                  └──────────────────┘ ║
        ║         ▼                                       ║
        ║   /home/machine/.hermes/{skills,cron,memory}/  ║
        ╚══════════════════════════════════════════════════╝
                              │
                              ▼
            ┌──────────────────────────────────────────┐
            │  api.dedaluslabs.ai/v1  ── 200+ models   │
            └──────────────────────────────────────────┘`}
				</pre>
			</div>
		</>
	);
}
