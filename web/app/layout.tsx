import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

/**
 * Nacelle is the canonical Dedalus typeface. We load three weights
 * locally so the font ships with the bundle and never blocks paint on a
 * remote font server. The `--font-sans` CSS variable threads through
 * globals.css and Tailwind so every component picks it up automatically.
 */
const nacelle = localFont({
	src: [
		{ path: "../public/fonts/Nacelle-Regular.otf", weight: "400", style: "normal" },
		{ path: "../public/fonts/Nacelle-SemiBold.otf", weight: "600", style: "normal" },
		{ path: "../public/fonts/Nacelle-Bold.otf", weight: "700", style: "normal" },
	],
	variable: "--font-nacelle",
	display: "swap",
	preload: true,
});

/**
 * Instrument Serif italic for the wordmark only. A single weight, a
 * single style; we intentionally do not expose this as a default
 * typeface anywhere -- it's reserved for the brand wordmark in the
 * navbar so it reads as identity, not body copy.
 */
const instrumentSerif = Instrument_Serif({
	weight: "400",
	style: "italic",
	subsets: ["latin"],
	variable: "--font-display-serif",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Agent Machines -- a persistent machine for your agent",
	description:
		"One stateful microVM per Clerk account. Boot in 30 seconds, sleep on idle, wake on the first prompt. Chat history, files, learned skills, and cron all persist on /home/machine. Hermes or OpenClaw, any provider key, 95 skills + 17 MCP services.",
	openGraph: {
		title: "Agent Machines",
		description:
			"A persistent machine for your agent. One per account, stateful filesystem, sleep/wake by the second. Bring Hermes or OpenClaw, any provider key, any skill.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Agent Machines",
		description:
			"A persistent machine for your agent. Stateful filesystem, per-account fleet, sleep/wake by the second.",
	},
};

const CLERK_CONFIGURED = Boolean(
	process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

/**
 * Boot script that runs synchronously in <head> before first paint.
 * Reads the persisted theme from localStorage and writes data-theme
 * on <html> so the page renders in the right palette immediately --
 * without this the page flashes the system theme on every nav.
 *
 * Wrapped in IIFE + try/catch so a storage exception (private mode,
 * permissions denied) silently falls through to system-prefers.
 */
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("agent-machines.theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
	const tree = (
		<html
			lang="en"
			className={`${nacelle.variable} ${instrumentSerif.variable}`}
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
			</head>
			<body>
				{children}
				<div className="ret-grain" aria-hidden="true" />
			</body>
		</html>
	);
	// When Clerk isn't configured (fresh Vercel deploy, no env vars yet) we
	// skip the provider entirely so the public landing still renders. The
	// middleware handles gating /dashboard/* with a 503 + setup message.
	if (!CLERK_CONFIGURED) return tree;
	return (
		<ClerkProvider
			signInUrl="/sign-in"
			signInForceRedirectUrl="/dashboard"
			signUpForceRedirectUrl="/dashboard"
			afterSignOutUrl="/"
			appearance={{
				variables: {
					colorPrimary: "var(--ret-purple)",
					colorBackground: "var(--ret-bg)",
					colorText: "var(--ret-text)",
					fontFamily: "var(--font-sans)",
					borderRadius: "10px",
				},
			}}
		>
			{tree}
		</ClerkProvider>
	);
}
