import { cn } from "@/lib/cn";

import { ReticleCross } from "./ReticleCross";
import { ReticleHatch } from "./ReticleHatch";

/**
 * Section divider used between landing-page chapters. Renders the same
 * pattern that sits above the footer:
 *
 *   - top hairline rule extends edge-to-edge
 *   - corner cross marks pinned to the rail intersections
 *   - 16px diagonal hatch fill
 *   - bottom hairline rule
 *
 * Sits as a sibling between two `<ReticleSection>` blocks (NOT inside
 * one), so the hatch lives in its own row of the page grid and carries
 * the rails through.
 */
type Props = {
	className?: string;
	height?: number;
	pitch?: number;
	corners?: boolean;
};

export function ReticleSpacer({
	className,
	height = 16,
	pitch = 6,
	corners = true,
}: Props) {
	return (
		<div
			className={cn(
				"relative w-full border-t border-b border-[var(--ret-border)]",
				className,
			)}
			style={{ height: `${height}px` }}
			aria-hidden="true"
		>
			{corners ? (
				<>
					<ReticleCross
						className="absolute z-20"
						style={{
							top: "-5px",
							left: "calc(var(--ret-rail-offset) - 5px)",
						}}
					/>
					<ReticleCross
						className="absolute z-20"
						style={{
							top: "-5px",
							right: "calc(var(--ret-rail-offset) - 5px)",
						}}
					/>
					<ReticleCross
						className="absolute z-20"
						style={{
							bottom: "-5px",
							left: "calc(var(--ret-rail-offset) - 5px)",
						}}
					/>
					<ReticleCross
						className="absolute z-20"
						style={{
							bottom: "-5px",
							right: "calc(var(--ret-rail-offset) - 5px)",
						}}
					/>
				</>
			) : null}
			<ReticleHatch className="h-full w-full" pitch={pitch} />
		</div>
	);
}
