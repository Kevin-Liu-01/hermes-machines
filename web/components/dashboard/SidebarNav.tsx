"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/cn";

type NavItem = {
	href: string;
	label: string;
	hint: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	disabled?: boolean;
	dot?: boolean;
};

type Props = {
	setupComplete: boolean;
};

const BASE_NAV: ReadonlyArray<NavItem> = [
	{ href: "/dashboard", label: "Overview", hint: "machine + counters", icon: IconGrid },
	{ href: "/dashboard/chat", label: "Chat", hint: "talk to agent", icon: IconChat },
	{ href: "/dashboard/machines", label: "Machines", hint: "your fleet", icon: IconStack },
	{ href: "/dashboard/artifacts", label: "Artifacts", hint: "files", icon: IconBox },
	{ href: "/dashboard/skills", label: "Skills", hint: "bundled", icon: IconScroll },
	{ href: "/dashboard/mcps", label: "MCPs", hint: "tool servers", icon: IconPlug },
	{ href: "/dashboard/sessions", label: "Sessions", hint: "live", icon: IconRows },
	{ href: "/dashboard/logs", label: "Logs", hint: "live", icon: IconWave },
	{ href: "/dashboard/cursor", label: "Cursor runs", hint: "live", icon: IconBolt },
];

const SETUP_ITEM: NavItem = {
	href: "/dashboard/setup",
	label: "Setup",
	hint: "your machine",
	icon: IconKey,
};

export function SidebarNav({ setupComplete }: Props) {
	const pathname = usePathname();
	const setupItem: NavItem = { ...SETUP_ITEM, dot: !setupComplete };
	const nav: NavItem[] = [...BASE_NAV, setupItem];
	return (
		<nav
			aria-label="Dashboard"
			className="flex flex-col gap-1 px-3 pt-5 pb-6 font-mono text-[13px]"
		>
			<p className="px-3 pb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--ret-text-muted)]">
				Dashboard
			</p>
			{nav.map((item) => {
				const active =
					pathname === item.href ||
					(item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
				return item.disabled ? (
					<DisabledRow key={item.href} item={item} />
				) : (
					<ActiveRow key={item.href} item={item} active={active} />
				);
			})}
		</nav>
	);
}

function ActiveRow({ item, active }: { item: NavItem; active: boolean }) {
	const Icon = item.icon;
	return (
		<Link
			href={item.href}
			className={cn(
				"group flex items-center gap-3 px-3 py-2 transition-colors",
				active
					? "bg-[var(--ret-purple-glow)] text-[var(--ret-purple)]"
					: "text-[var(--ret-text-dim)] hover:bg-[var(--ret-surface)] hover:text-[var(--ret-text)]",
			)}
		>
			<Icon
				className={cn(
					"h-3.5 w-3.5",
					active ? "text-[var(--ret-purple)]" : "text-[var(--ret-text-muted)]",
				)}
			/>
			<span className="flex-1">{item.label}</span>
			{item.dot ? (
				<span
					aria-label="needs setup"
					className="h-1.5 w-1.5 bg-[var(--ret-amber)]"
				/>
			) : null}
			<span className="text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
				{item.hint}
			</span>
		</Link>
	);
}

function DisabledRow({ item }: { item: NavItem }) {
	const Icon = item.icon;
	return (
		<div
			className={cn(
				"flex cursor-not-allowed items-center gap-3 px-3 py-2",
				"text-[var(--ret-text-muted)]",
			)}
			title="Shipping later"
		>
			<Icon className="h-3.5 w-3.5" />
			<span className="flex-1">{item.label}</span>
			<span className="border border-[var(--ret-border)] px-1.5 py-px text-[9px] uppercase tracking-[0.2em]">
				{item.hint}
			</span>
		</div>
	);
}

function IconGrid(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<rect x="2" y="2" width="5" height="5" />
			<rect x="9" y="2" width="5" height="5" />
			<rect x="2" y="9" width="5" height="5" />
			<rect x="9" y="9" width="5" height="5" />
		</svg>
	);
}

function IconChat(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<path d="M2 4 a2 2 0 0 1 2 -2 h8 a2 2 0 0 1 2 2 v5 a2 2 0 0 1 -2 2 H7 l-3 3 v-3 H4 a2 2 0 0 1 -2 -2 z" />
		</svg>
	);
}

function IconScroll(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<path d="M3 3 h8 v10 h-8 z" />
			<path d="M5 6 h4 M5 8 h4 M5 10 h2" />
		</svg>
	);
}

function IconPlug(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<path d="M6 2 v3 M10 2 v3" />
			<rect x="4" y="5" width="8" height="4" rx="1" />
			<path d="M8 9 v5" />
		</svg>
	);
}

function IconRows(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<path d="M2 4 h12 M2 8 h12 M2 12 h12" />
		</svg>
	);
}

function IconWave(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<path d="M2 8 q2 -4 4 0 t4 0 t4 0" />
		</svg>
	);
}

function IconBolt(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...props}>
			<path d="M9 2 L4 9 h4 l-1 5 l5 -7 h-4 z" />
		</svg>
	);
}

function IconKey(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<circle cx="11" cy="5" r="2.5" />
			<path d="M9 7 L3 13 M5 11 L7 13 M3 13 L4.5 14.5" />
		</svg>
	);
}

function IconStack(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<rect x="2" y="3" width="12" height="3" />
			<rect x="2" y="7" width="12" height="3" />
			<rect x="2" y="11" width="12" height="3" />
		</svg>
	);
}

function IconBox(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
			<path d="M2 5 L8 2 L14 5 V11 L8 14 L2 11 Z" />
			<path d="M2 5 L8 8 L14 5 M8 8 V14" />
		</svg>
	);
}
