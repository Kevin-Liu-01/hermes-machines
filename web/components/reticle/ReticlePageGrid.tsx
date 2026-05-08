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
/**
 * Diagonal hatching for the margin strips. Pitch matches Tailwind's
 * marketing site (~5px between strokes). Stroke uses --ret-rail so the
 * hatch reads as engineering-grid texture, not as content.
 */
const MARGIN_HATCH =
	"repeating-linear-gradient(135deg, var(--ret-rail) 0 1px, transparent 1px 5px)";

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
				{/* Diagonal margin hatching -- Tailwind / chanhdai pattern.
				    Each strip fills the area between the viewport edge and
				    the inner content column rail. Width is exactly
				    --ret-rail-offset so the strip auto-collapses to zero on
				    narrow viewports where the rails sit at the screen edge.
				    z-0 keeps the hatching behind both the rails and the
				    content; section borders cross through it cleanly. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-0 bottom-0 left-0 z-0"
					style={{
						width: "var(--ret-rail-offset)",
						backgroundImage: MARGIN_HATCH,
					}}
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-0 bottom-0 right-0 z-0"
					style={{
						width: "var(--ret-rail-offset)",
						backgroundImage: MARGIN_HATCH,
					}}
				/>

				{/* Vertical rails. Hairline at the inner column edges, full
				    document height. Sit above the hatching so the rails
				    read as the boundary; section borders cross both. */}
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
				<div className="relative z-10 flex flex-col">{children}</div>
			</div>
		</PageGridContext.Provider>
	);
}
