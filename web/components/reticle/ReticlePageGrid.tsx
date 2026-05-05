"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/cn";

import { RETICLE_SIZES } from "./constants";
import { ReticleGutter } from "./ReticleGutter";
import { ReticleMargin } from "./ReticleMargin";

const PageGridContext = createContext(false);

export function useIsInsidePageGrid(): boolean {
	return useContext(PageGridContext);
}

const GAP = RETICLE_SIZES.railGap;

type Props = {
	children: ReactNode;
	className?: string;
	contentMax?: number;
	showGutterGrid?: boolean;
};

/**
 * Top-level page grid. Defines the 5-column structure (margin | gutter |
 * content | gutter | margin) for the entire page. Children that use
 * <ReticleSection> auto-detect the parent grid and skip rendering their own
 * margins/gutters, so we get one continuous set of rails for the whole page.
 */
export function ReticlePageGrid({
	children,
	className,
	contentMax = RETICLE_SIZES.contentMax,
	showGutterGrid = true,
}: Props) {
	const gridCols: CSSProperties = {
		gridTemplateColumns: `1fr ${GAP}px minmax(0,${contentMax}px) ${GAP}px 1fr`,
	};
	return (
		<PageGridContext.Provider value={true}>
			<div
				className={cn("grid min-h-[100dvh]", className)}
				style={gridCols}
			>
				<ReticleMargin />
				<ReticleGutter showGrid={showGutterGrid} />
				<div className="flex min-w-0 flex-col bg-[var(--ret-bg)]">
					{children}
				</div>
				<ReticleGutter showGrid={showGutterGrid} />
				<ReticleMargin />
			</div>
		</PageGridContext.Provider>
	);
}
