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
				kicker="LIVE -- /v1/chat/completions"
				title="Chat"
				description="Streams from the OpenAI-compatible gateway on your active machine. Tools fire on the VM. Past chats persist to Vercel Blob, scoped to your account."
			/>
			<ChatShell
				activeMachineId={active?.id ?? null}
				model={active?.model ?? null}
			/>
		</div>
	);
}
