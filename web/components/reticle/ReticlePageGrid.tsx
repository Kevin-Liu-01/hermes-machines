"use client";

import {
	createContext,
	useContext,
	type CSSProperties,
	type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

import { RETICLE_SIZES } from "./constants";

const PageGridContext = createContext(false);

export function useIsInsidePageGrid(): boolean {
	return useContext(PageGridContext);
}

type Props = {
	children: ReactNode;
	className?: string;
	contentMax?: number;
};

/**
 * Top-level page frame.
 *
 * Sections render full-width and their borders extend edge-to-edge --
 * the chanhdai / Tailwind pattern. The vertical rails are absolute
 * hairlines positioned at the inner content column's left/right edges;
 * they appear to "break" wherever a section border crosses them, which
 * is exactly the effect we want. The break points get `+` marks from
 * `ReticleSection`'s corner crosses.
 *
 * `--ret-content-max` is set on this element so children (sections,
 * cross marks) can compute `--ret-rail-offset` without prop drilling.
 */
export function ReticlePageGrid({
	children,
	className,
	contentMax = RETICLE_SIZES.contentMax,
}: Props) {
	const style = {
		"--ret-content-max": `${contentMax}px`,
	} as CSSProperties;
	return (
		<PageGridContext.Provider value={true}>
			<div
				className={cn("relative min-h-[100dvh] bg-[var(--ret-bg)]", className)}
				style={style}
			>
				{/* Vertical rails. Hairline at the inner column edges, full
				    document height. They appear discontinuous wherever a
				    section's border-t crosses (Tailwind / chanhdai pattern). */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[var(--ret-border)]"
					style={{ left: "var(--ret-rail-offset)" }}
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[var(--ret-border)]"
					style={{ right: "var(--ret-rail-offset)" }}
				/>
				<div className="relative flex flex-col">{children}</div>
			</div>
		</PageGridContext.Provider>
	);
}
