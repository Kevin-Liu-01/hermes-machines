import { Logo } from "@/components/Logo";
import { cn } from "@/lib/cn";
import type { AgentKind } from "@/lib/user-config/schema";

type Props = {
	size?: number;
	className?: string;
	withLabel?: boolean;
	gap?: "tight" | "default";
	/**
	 * Agent variant of the lockup. Defaults to "hermes" (Dedalus x Nous).
	 *   - "hermes"   -> Dedalus mark x Nous mark
	 *   - "openclaw" -> Dedalus mark x "OpenClaw" wordmark
	 *
	 * The Dedalus mark is always present because Dedalus runs the
	 * machine; the right side identifies the agent personality.
	 */
	agent?: AgentKind;
};

const SECONDARY_LABEL: Record<AgentKind, string> = {
	hermes: "Nous",
	openclaw: "OpenClaw",
};

/**
 * Lockup of the Dedalus mark and the agent's mark separated by a thin "x".
 * Used in the public landing navbar, the dashboard status header, and the
 * sign-in card so the collaboration is the first thing a visitor sees:
 * Hermes Machines is the binding between Dedalus's microVM runtime and an
 * agent personality (Hermes by default, OpenClaw as an alternative).
 */
export function BrandMark({
	size = 22,
	className,
	withLabel = true,
	gap = "default",
	agent = "hermes",
}: Props) {
	return (
		<span
			className={cn(
				"inline-flex items-center font-mono text-[var(--ret-text)]",
				gap === "tight" ? "gap-1.5" : "gap-2.5",
				className,
			)}
		>
			<Logo mark="dedalus" size={size} />
			<span
				aria-hidden="true"
				className="font-mono text-[0.7em] text-[var(--ret-text-muted)]"
			>
				{"\u00d7"}
			</span>
			{agent === "hermes" ? (
				<Logo mark="nous" size={size} />
			) : (
				<span
					className="font-mono text-[0.85em] text-[var(--ret-text)]"
					style={{ lineHeight: 1, letterSpacing: "-0.01em" }}
				>
					{SECONDARY_LABEL[agent]}
				</span>
			)}
			{withLabel ? <span className="text-sm">hermes-machines</span> : null}
		</span>
	);
}
