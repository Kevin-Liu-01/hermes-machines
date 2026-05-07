import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

type Props = {
	className?: string;
	/** Stroke spacing in px. Tighter = denser hatching. Default 8. */
	pitch?: number;
	/** Direction of the diagonal. Default 45deg. */
	angle?: number;
	/** Optional aria-label override. Default is hidden. */
	label?: string;
};

/**
 * Diagonal hairline hatching, used to fill spacer cells and dividers
 * with structural-visibility decoration. The stroke color is
 * `--ret-rail` so it sits between text-dim and grid in visual weight.
 *
 * The container is `pointer-events-none` and aria-hidden by default --
 * hatching is a graphic, never an interactive surface.
 *
 * Usage:
 *   <div className="relative h-24 border border-[var(--ret-border)]">
 *     <ReticleHatch className="absolute inset-0" />
 *   </div>
 */
export function ReticleHatch({ className, pitch = 8, angle = 45, label }: Props) {
	const style: CSSProperties = {
		backgroundImage: `repeating-linear-gradient(${angle}deg, var(--ret-rail) 0 1px, transparent 1px ${pitch}px)`,
	};
	return (
		<div
			className={cn("pointer-events-none", className)}
			style={style}
			role={label ? "img" : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : true}
		/>
	);
}
