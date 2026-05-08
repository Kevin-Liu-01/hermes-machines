/**
 * Single source of truth for site-level SEO/GEO/AEO data. Used by
 * `app/layout.tsx` (metadata + JSON-LD), `app/sitemap.ts`, `app/robots.ts`,
 * the FAQ section on the landing, and `public/llms.txt`.
 *
 * Every field that points to a URL uses an absolute URL so structured
 * data validators stop complaining and so OpenGraph / Twitter render
 * correctly even when the page is fetched by a crawler that doesn't
 * resolve relative paths.
 */

export const SITE = {
	name: "Agent Machines",
	wordmark: "agent-machines",
	url: "https://www.agent-machines.dev",
	description:
		"A persistent machine for your agent. One stateful microVM per Clerk account; chat history, files, learned skills, and cron all live on /home/machine. Hermes or OpenClaw, any provider key (Dedalus / Vercel Sandbox / Fly), 95 skills + 17 MCP services.",
	tagline: "A persistent machine for your agent",
	ogImage: "/og.png",
	twitterHandle: "@kevin_liu_01",
	authorName: "Kevin Liu",
	authorUrl: "https://github.com/Kevin-Liu-01",
	githubRepo: "Kevin-Liu-01/agent-machines",
	githubUrl: "https://github.com/Kevin-Liu-01/agent-machines",
	keywords: [
		"persistent agent",
		"agent machine",
		"agent infrastructure",
		"Hermes agent",
		"OpenClaw agent",
		"Dedalus Machines",
		"microVM agent",
		"OpenAI-compatible chat completions",
		"agent fleet",
		"per-account agent",
		"MCP server",
		"Cursor SDK delegation",
		"agent memory",
		"agent sleep wake",
		"stateful agent",
		"sandbox agent",
		"AI agent runtime",
	],
} as const;

export type SiteConfig = typeof SITE;

/* ------------------------------------------------------------------ */
/* FAQ source -- mirrored on-page AND in JSON-LD per Princeton GEO    */
/* methods (FAQPage schema is one of the highest AI-citability boosts) */
/* ------------------------------------------------------------------ */

export type FaqEntry = {
	question: string;
	answer: string;
};

export const FAQ: ReadonlyArray<FaqEntry> = [
	{
		question: "What is Agent Machines?",
		answer:
			"Agent Machines is a per-account agent runtime. Each signed-in user provisions one persistent stateful microVM where the agent's chat history, working files, learned skills, and cron schedules all live on disk at /home/machine and survive every sleep cycle. The same machine wakes on every device the user signs in from.",
	},
	{
		question: "How is this different from a regular chatbot?",
		answer:
			"A regular chatbot is stateless -- conversation memory either lives in your browser or in a vendor-controlled black-box memory service. Agent Machines persists everything to a real Linux filesystem the agent owns: chat .jsonl files, USER.md, MEMORY.md, an FTS5 sessions database, cron schedules, the Python venv, learned skills. The agent can read, write, search, and rebuild context from disk on every wake.",
	},
	{
		question: "Which agents can I run?",
		answer:
			"Two production-ready open-source agents today: Hermes (Nous Research, memory + cron + MCP-native) and OpenClaw (Dedalus Labs reference, Anthropic computer-use loop with browser + screenshot + click). Both expose the same OpenAI-compatible /v1/chat/completions endpoint, both run on the same machine, and you can swap between them from the navbar without losing state.",
	},
	{
		question: "Which providers can host the machine?",
		answer:
			"Dedalus Machines is the default runtime (microVM, second-billed, ~30s cold boot, ~5s warm). The MachineProvider interface also accepts Vercel Sandbox and Fly Machines; users attach their own credentials per provider. Same agent, same persistence, different hosts.",
	},
	{
		question: "How do I sign up and get my own machine?",
		answer:
			"Sign in with Clerk at agent-machines.dev/sign-in. The five-step onboarding (agent / skills / tools / key / boot) provisions the machine end-to-end in 30-90 seconds. Bring a Dedalus API key from dedaluslabs.ai/dashboard/api-keys; the key authenticates both provisioning and inference.",
	},
	{
		question: "What tools and skills come pre-installed?",
		answer:
			"23 built-in tools (terminal, filesystem, browser via Playwright, vision, image generation, MCP servers, code execution, subagent delegation), 17 MCP service integrations (Vercel, Stripe, Supabase, Linear, GitHub, Slack, PostHog, Sentry, Clerk, Firebase, Figma, Shopify, ClickHouse, Datadog, AWS, Cloudflare, plus model providers), and 95 SKILL.md files that auto-load by intent.",
	},
	{
		question: "Where does my data live and who can see it?",
		answer:
			"All conversation, file, memory, and skill data lives on the user's own machine disk under /home/machine/.agent-machines/. The web dashboard's UserConfig (provider keys, machine fleet, active agent) lives in Clerk private metadata, which is server-only and never sent to the browser. No third-party analytics or memory service holds your agent state.",
	},
	{
		question: "What happens when the machine sleeps?",
		answer:
			"Idle Dedalus microVMs hibernate to save cost (second-billed). The disk is preserved across sleeps, so on the next /v1/chat/completions request the machine wakes (typically <5s after recent activity, <30s cold) and the agent resumes from disk -- chat history, learned skills, cron schedules, and venv intact.",
	},
];
