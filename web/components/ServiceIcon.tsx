import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Brand mark for a third-party service. Looks up an SVG in
 * `/brand/services/{slug}.svg`.
 *
 * Two render modes:
 *
 * - `tone="color"` (default) -- renders the SVG via `<Image>` so the
 *   brand's official palette is preserved. Use this in cards / chips
 *   where the logo carries identity.
 *
 * - `tone="mono"` -- renders the SVG as a CSS mask filled with
 *   `currentColor`. Use this in dense list rows where the logo should
 *   adopt the surrounding text color (preserves contrast in dark mode
 *   and keeps a tight monochrome rhythm).
 *
 * If the slug isn't downloaded yet, this returns `null` so callers can
 * fall back to a generic `ToolIcon` without throwing.
 */

export type ServiceSlug =
	| "vercel"
	| "stripe"
	| "supabase"
	| "clerk"
	| "firebase"
	| "figma"
	| "posthog"
	| "sentry"
	| "datadog"
	| "linear"
	| "slack"
	| "shopify"
	| "clickhouse"
	| "github"
	| "amazonwebservices"
	| "cloudflare"
	| "anthropic"
	| "openai"
	| "googlechrome"
	| "playwright"
	| "nextdotjs"
	| "react"
	| "gsap"
	| "framer"
	| "playcanvas"
	| "threedotjs"
	| "typescript"
	| "tailwindcss";

export const SERVICE_LABEL: Record<ServiceSlug, string> = {
	vercel: "Vercel",
	stripe: "Stripe",
	supabase: "Supabase",
	clerk: "Clerk",
	firebase: "Firebase",
	figma: "Figma",
	posthog: "PostHog",
	sentry: "Sentry",
	datadog: "Datadog",
	linear: "Linear",
	slack: "Slack",
	shopify: "Shopify",
	clickhouse: "ClickHouse",
	github: "GitHub",
	amazonwebservices: "AWS",
	cloudflare: "Cloudflare",
	anthropic: "Anthropic",
	openai: "OpenAI",
	googlechrome: "Chrome",
	playwright: "Playwright",
	nextdotjs: "Next.js",
	react: "React",
	gsap: "GSAP",
	framer: "Framer",
	playcanvas: "PlayCanvas",
	threedotjs: "Three.js",
	typescript: "TypeScript",
	tailwindcss: "Tailwind",
};

const SERVICE_SET = new Set<string>(Object.keys(SERVICE_LABEL));

export function isServiceSlug(value: string): value is ServiceSlug {
	return SERVICE_SET.has(value);
}

type Props = {
	slug: ServiceSlug;
	size?: number;
	className?: string;
	tone?: "color" | "mono";
};

export function ServiceIcon({
	slug,
	size = 14,
	className,
	tone = "color",
}: Props) {
	const src = `/brand/services/${slug}.svg`;
	const dim = `${size}px`;
	const label = SERVICE_LABEL[slug];

	if (tone === "mono") {
		return (
			<span
				role="img"
				aria-label={label}
				className={cn("inline-block shrink-0 bg-[currentColor]", className)}
				style={{
					width: dim,
					height: dim,
					WebkitMaskImage: `url(${src})`,
					maskImage: `url(${src})`,
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskPosition: "center",
					maskPosition: "center",
					WebkitMaskSize: "contain",
					maskSize: "contain",
				}}
			/>
		);
	}

	return (
		<span
			role="img"
			aria-label={label}
			className={cn("relative inline-block shrink-0", className)}
			style={{ width: dim, height: dim }}
		>
			<Image
				src={src}
				alt=""
				fill
				sizes={dim}
				className="object-contain"
			/>
		</span>
	);
}
