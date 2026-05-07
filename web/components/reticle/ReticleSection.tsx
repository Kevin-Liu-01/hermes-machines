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
