import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
	width?: string | number;
	height?: string | number;
};

/**
 * Reticle-styled skeleton placeholder. Hairline border, gentle pulse
 * overlay (no fill -- just a translucent shimmer band that drifts), so
 * it sits inside a card without competing with real content.
 *
 * Pair with `<BrailleSpinner />` per the loading-screens skill: the
 * skeleton preserves layout, the spinner provides motion. Together
 * they keep the page from ever showing as "blank" or "still" while
 * data loads.
 */
export function Skeleton({
	className,
	style,
	width,
	height,
	...rest
}: Props) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"ret-skeleton border border-[var(--ret-border)] bg-[var(--ret-bg-soft)]",
				className,
			)}
			style={{
				width: typeof width === "number" ? `${width}px` : width,
				height: typeof height === "number" ? `${height}px` : height,
				...style,
			}}
			{...rest}
		/>
	);
}
