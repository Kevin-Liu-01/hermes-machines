import { ChatShell } from "@/components/dashboard/ChatShell";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getUserConfig } from "@/lib/user-config/clerk";

export const dynamic = "force-dynamic";

export default async function DashboardChatPage() {
	const config = await getUserConfig();
	const active = config.machines.find((m) => m.id === config.activeMachineId);
	return (
		<div className="flex flex-col">
			<PageHeader
				kicker={`LIVE -- ${active?.agentKind === "openclaw" ? "openclaw" : "hermes"} gateway`}
				title="Chat"
				description="Streams from the resolved gateway profile for your active machine. Switch agents (Hermes / OpenClaw) from the navbar dropdown -- the dropdown changes the draft for new machines; existing machines keep their installed agent. Persistent-machine chats live under /home/machine/.agent-machines; ephemeral sandboxes use the external storage backend configured for the account."
			/>
			<ChatShell
				activeMachineId={active?.id ?? null}
				model={active?.model ?? null}
			/>
		</div>
	);
}
