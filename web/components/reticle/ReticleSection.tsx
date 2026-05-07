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
 * A page section. Tighter default padding than before (`py-10 md:py-12`
 * down from `py-12 md:py-16`) so two sections per fold instead of one.
 * When `corners` is true (default when `borderTop` is on), `+` marks
 * sit precisely at the page-rail intersections.
 */
export function ReticleSection({
	children,
	className,
	contentClassName = "px-6 py-10 md:py-12",
	borderTop = true,
	borderBottom = false,
	corners,
	as: Tag = "section",
	id,
}: Props) {
	const showCorners = corners ?? borderTop;
	return (
		<Tag id={id} className={cn("relative", className)}>
			{showCorners ? (
				<>
					<ReticleCross
						className="absolute z-10"
						style={{ top: "-5px", left: "-5px" }}
					/>
					<ReticleCross
						className="absolute z-10"
						style={{ top: "-5px", right: "-5px" }}
					/>
				</>
			) : null}
			<div
				className={cn(
					borderTop && "border-t border-[var(--ret-border)]",
					borderBottom && "border-b border-[var(--ret-border)]",
					contentClassName,
				)}
			>
				{children}
			</div>
		</Tag>
	);
}
