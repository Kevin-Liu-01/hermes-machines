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
 * Top-level page grid in the tightened Tailwind / chanhdai aesthetic.
 *
 * Three columns: rail | content | rail. The rails are simple vertical
 * hairlines (no 48x48 grid pattern, no horizontal tick marks). Sections
 * provide their own top borders; the rails hold everything together
 * along the side margins. Cross marks at intersections come from
 * `ReticleSection` (top corners) and `Footer` (bottom corners).
 *
 * No empty gutter columns -- the previous 5-col `[margin | gutter |
 * content | gutter | margin]` layout was visual noise that fought
 * the content. The new shape is: edge | content | edge, where each
 * edge is just a 1px line.
 */
export function ReticlePageGrid({
	children,
	className,
	contentMax = RETICLE_SIZES.contentMax,
}: Props) {
	const gridCols: CSSProperties = {
		gridTemplateColumns: `1fr minmax(0,${contentMax}px) 1fr`,
	};
	return (
		<PageGridContext.Provider value={true}>
			<div className={cn("grid min-h-[100dvh] bg-[var(--ret-bg)]", className)} style={gridCols}>
				<div aria-hidden="true" className="border-r border-[var(--ret-border)]" />
				<div className="flex min-w-0 flex-col border-x border-[var(--ret-border)]">
					{children}
				</div>
				<div aria-hidden="true" className="border-l border-[var(--ret-border)]" />
			</div>
		</PageGridContext.Provider>
	);
}
