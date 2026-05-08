import type { ReactElement, SVGProps } from "react";

import { cn } from "@/lib/cn";
import type { ToolCategory } from "@/lib/dashboard/loadout";

/**
 * Lucide-style category icon, used as the fallback whenever a tool has
 * no third-party brand to attach. Inline SVG (no `lucide-react` dep --
 * 11 paths is too few to justify a tree-shake gamble), all rendered
 * with `currentColor` so they adopt the surrounding text color.
 *
 * Pair with `<ServiceIcon>` for branded surfaces -- the call-site
 * decides which to use based on whether the tool has an upstream brand.
 */

type IconProps = SVGProps<SVGSVGElement>;

const ICONS: Record<
	ToolCategory | "task" | "skill" | "subagent" | "rig",
	(props: IconProps) => ReactElement
> = {
	shell: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<polyline points="4 17 10 11 4 5" />
			<line x1="12" y1="19" x2="20" y2="19" />
		</svg>
	),
	filesystem: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
		</svg>
	),
	browser: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<circle cx="12" cy="12" r="10" />
			<line x1="2" y1="12" x2="22" y2="12" />
			<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
		</svg>
	),
	vision: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	),
	code: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<polyline points="16 18 22 12 16 6" />
			<polyline points="8 6 2 12 8 18" />
		</svg>
	),
	memory: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<rect x="3" y="6" width="18" height="12" rx="2" />
			<line x1="7" y1="6" x2="7" y2="18" />
			<line x1="11" y1="6" x2="11" y2="18" />
			<line x1="15" y1="6" x2="15" y2="18" />
			<line x1="19" y1="6" x2="19" y2="18" />
		</svg>
	),
	schedule: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	),
	search: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
	),
	audio: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<path d="M11 5L6 9H2v6h4l5 4V5z" />
			<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
		</svg>
	),
	image: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<polyline points="21 15 16 10 5 21" />
		</svg>
	),
	delegate: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<circle cx="12" cy="6" r="3" />
			<circle cx="6" cy="18" r="3" />
			<circle cx="18" cy="18" r="3" />
			<line x1="12" y1="9" x2="6" y2="15" />
			<line x1="12" y1="9" x2="18" y2="15" />
		</svg>
	),
	task: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<path d="M9 11l3 3L22 4" />
			<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
		</svg>
	),
	skill: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
			<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
		</svg>
	),
	subagent: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<rect x="3" y="11" width="18" height="10" rx="2" />
			<circle cx="12" cy="5" r="2" />
			<path d="M12 7v4" />
			<line x1="8" y1="16" x2="8" y2="16" />
			<line x1="16" y1="16" x2="16" y2="16" />
		</svg>
	),
	rig: (p) => (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
			<rect x="2" y="2" width="20" height="8" rx="2" />
			<rect x="2" y="14" width="20" height="8" rx="2" />
			<line x1="6" y1="6" x2="6.01" y2="6" />
			<line x1="6" y1="18" x2="6.01" y2="18" />
		</svg>
	),
};

type Props = {
	name: keyof typeof ICONS;
	size?: number;
	className?: string;
};

export function ToolIcon({ name, size = 14, className }: Props) {
	const Icon = ICONS[name];
	return (
		<Icon
			width={size}
			height={size}
			className={cn("inline-block shrink-0", className)}
			aria-hidden="true"
		/>
	);
}
