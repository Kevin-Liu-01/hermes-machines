import { PageHeader } from "@/components/dashboard/PageHeader";
import { TerminalPanel } from "@/components/dashboard/TerminalPanel";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Terminal -- Agent Machines",
};

/**
 * Terminal route.
 *
 * Each prompt issues one POST to `/api/dashboard/exec` which routes
 * through Dedalus's executions API. Not a real PTY -- exec is a
 * single-shot RPC, so interactive TTY apps (vim, less, htop) won't
 * work. For everything else (`ls`, `cat`, `tail`, `python -c ...`,
 * `pip install`, `git status`) the experience matches an SSH session
 * closely enough that you don't need to drop into the CLI to inspect
 * the machine.
 */
export default function TerminalPage() {
	return (
		<div className="flex flex-col">
			<PageHeader
				kicker="TERMINAL -- /api/dashboard/exec"
				title="Run anything on the machine."
				description="One-shot shell exec on the active machine via Dedalus. Use the starter chips for common diagnostics, or type your own. History walks with up/down; Ctrl/Cmd+L clears the scrollback. Interactive TTY apps (vim, less) won't work because exec is single-shot, not a PTY."
			/>
			<div className="px-5 py-5">
				<TerminalPanel />
			</div>
		</div>
	);
}
