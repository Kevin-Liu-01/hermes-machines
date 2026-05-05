import type { CSSProperties } from "react";

import { RETICLE_SIZES } from "./constants";

const SUB = RETICLE_SIZES.gridCell / 3;

const MARGIN_LINES: CSSProperties = {
	backgroundImage: `linear-gradient(to bottom, transparent ${SUB - 1}px, var(--ret-cross) ${SUB - 1}px)`,
	backgroundSize: `100% ${SUB}px`,
};

/**
 * Outer page margin: thin horizontal tick marks every ~16px.
 * Renders the rail aesthetic without ever touching the content column.
 */
export function ReticleMargin() {
	return (
		<div
			aria-hidden="true"
			className="bg-[var(--ret-bg)]"
			style={MARGIN_LINES}
		/>
	);
}
