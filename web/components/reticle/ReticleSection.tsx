import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { ReticleCross } from "./ReticleCross";

type Props = {
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	borderTop?: boolean;
	borderBottom?: boolean;
	/** Render `+` cross marks where the top border meets the page rails. */
	corners?: boolean;
	/**
	 * Background hatching behind the inner content column. "none" (default)
	 * paints solid `--ret-bg`; "hatch" paints the same diagonal pattern
	 * the page-grid uses for its margins, so an emphasized section reads
	 * as belonging to the engineering grid. Tailwind's marketing site
	 * uses this for "feature highlight" sections.
	 */
	background?: "none" | "hatch";
	as?: "section" | "div" | "header" | "footer" | "main";
	id?: string;
};

const SECTION_HATCH =
	"repeating-linear-gradient(135deg, var(--ret-rail) 0 1px, transparent 1px 5px)";

/**
 * A page section. Renders full-width so its `border-t` / `border-b`
 * extend edge-to-edge through the page-grid margin hatching, breaking
 * the rails into discrete segments (Tailwind / chanhdai pattern). The
 * inner content is constrained to `--ret-content-max`, centered, and
 * paints `--ret-bg` so the diagonal margin hatching stops cleanly at
 * the rails -- it never bleeds into copy.
 *
 * Pass `background="hatch"` to flip that: the inner content area gets
 * the hatch and the section reads as one continuous patterned strip.
 */
export function ReticleSection({
	children,
	className,
	contentClassName = "px-6 py-14 md:py-16",
	borderTop = true,
	borderBottom = false,
	corners,
	background = "none",
	as: Tag = "section",
	id,
}: Props) {
	const showCorners = corners ?? borderTop;
	const innerStyle: CSSProperties =
		background === "hatch" ? { backgroundImage: SECTION_HATCH } : {};
	return (
		<Tag
			id={id}
			className={cn(
				"relative",
				borderTop && "border-t border-[var(--ret-border)]",
				borderBottom && "border-b border-[var(--ret-border)]",
				className,
			)}
		>
			{showCorners ? (
				<>
					{/*
					  ReticleCross renders a 20x20 SVG with the `+` centered at
					  (10,10). To pin the center on the rail intersection we
					  offset by the full crossArm (10px), not half. With the
					  half-offset the marks looked floated off the rails by 5px
					  in each direction; with the full offset they land exactly
					  on the rail/border crossing.
					*/}
					<ReticleCross
						className="absolute z-20"
						style={{
							top: "-10px",
							left: "calc(var(--ret-rail-offset) - 10px)",
						}}
					/>
					<ReticleCross
						className="absolute z-20"
						style={{
							top: "-10px",
							right: "calc(var(--ret-rail-offset) - 10px)",
						}}
					/>
				</>
			) : null}
			<div
				className={cn(
					"relative mx-auto max-w-[var(--ret-content-max)]",
					background === "hatch" ? null : "bg-[var(--ret-bg)]",
					contentClassName,
				)}
				style={innerStyle}
			>
				{children}
			</div>
		</Tag>
	);
}
