import type { ReactNode } from "react";

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
	as?: "section" | "div" | "header" | "footer" | "main";
	id?: string;
};

/**
 * A page section. Renders full-width so its `border-t` / `border-b`
 * extend edge-to-edge, breaking the page grid's vertical rails into
 * discrete segments (Tailwind / chanhdai pattern). The inner content
 * is constrained to `--ret-content-max` and centered.
 *
 * Default vertical padding is generous (`py-14 md:py-16`) so adjacent
 * sections feel like distinct moments instead of touching each other.
 * The corner crosses sit exactly where the rails meet the border.
 */
export function ReticleSection({
	children,
	className,
	contentClassName = "px-6 py-14 md:py-16",
	borderTop = true,
	borderBottom = false,
	corners,
	as: Tag = "section",
	id,
}: Props) {
	const showCorners = corners ?? borderTop;
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
					"mx-auto max-w-[var(--ret-content-max)]",
					contentClassName,
				)}
			>
				{children}
			</div>
		</Tag>
	);
}
