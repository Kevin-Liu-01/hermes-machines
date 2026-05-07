"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { ReticleCross } from "./ReticleCross";

type Props = {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
	/**
	 * Pull the corner cross marks slightly outside the border so they sit
	 * exactly on the corner intersection rather than inside the box.
	 * Default 5 (half of crossArm) lines up with `RETICLE_SIZES.crossArm = 10`.
	 */
	crossOffset?: number;
	/**
	 * Whether to render any of the four corner crosses. Pass `false` to
	 * temporarily hide them without removing the wrapping component.
	 */
	corners?: boolean;
	as?: "div" | "section" | "article";
};

/**
 * Bordered frame with `+` cross marks at all four corners. The default
 * Reticle pattern: hairline border, sharp edges, structural marks at
 * the corner intersections. Use as a drop-in for cards, panels, and
 * any container that wants to read as part of the engineering grid.
 *
 *   <ReticleFrame className="p-6">
 *     <h2>...</h2>
 *   </ReticleFrame>
 */
export function ReticleFrame({
	children,
	className,
	style,
	crossOffset = 5,
	corners = true,
	as: Tag = "div",
}: Props) {
	const off = `-${crossOffset}px`;
	return (
		<Tag
			className={cn(
				"relative border border-[var(--ret-border)] bg-[var(--ret-bg)]",
				className,
			)}
			style={style}
		>
			{corners ? (
				<>
					<ReticleCross className="absolute" style={{ top: off, left: off }} />
					<ReticleCross className="absolute" style={{ top: off, right: off }} />
					<ReticleCross className="absolute" style={{ bottom: off, left: off }} />
					<ReticleCross className="absolute" style={{ bottom: off, right: off }} />
				</>
			) : null}
			{children}
		</Tag>
	);
}
