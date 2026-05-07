import type { CSSProperties } from "react";

import { RETICLE_SIZES } from "./constants";

const CELL = RETICLE_SIZES.gridCell;

const GRID_STYLE: CSSProperties = {
	backgroundImage: [
		"linear-gradient(to right, var(--ret-rail) 1px, transparent 1px)",
		`linear-gradient(to bottom, transparent ${CELL - 1}px, var(--ret-rail) ${CELL - 1}px)`,
	].join(","),
	backgroundSize: `${CELL}px ${CELL}px`,
};

type Props = {
	showGrid?: boolean;
};

/** Inner gutter strip that draws the 48x48 grid between margins and content. */
export function ReticleGutter({ showGrid = true }: Props) {
	return (
		<div
			className="relative overflow-hidden border-x border-[var(--ret-border)] bg-[var(--ret-bg)]"
			aria-hidden="true"
		>
			{showGrid ? (
				<div className="absolute inset-0" style={GRID_STYLE} />
			) : null}
		</div>
	);
}
