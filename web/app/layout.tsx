import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
	title: "Hermes Persistent — agent on Dedalus Machines",
	description:
		"A self-improving Hermes Agent deployed to a Dedalus microVM. Tools, scheduled crons, and a knowledge base of skills lifted from kevin-wiki.",
	openGraph: {
		title: "Hermes Persistent",
		description:
			"A persistent agent with a body and a memory. Hermes Agent + Dedalus Machines.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Hermes Persistent",
		description: "A persistent agent with a body and a memory.",
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>{children}</body>
		</html>
	);
}
