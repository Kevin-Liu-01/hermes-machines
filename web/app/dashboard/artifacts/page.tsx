import { ArtifactsPanel } from "@/components/dashboard/ArtifactsPanel";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const dynamic = "force-dynamic";

export default function ArtifactsPage() {
	return (
		<div className="flex flex-col">
			<PageHeader
				kicker="ARTIFACTS"
				title="Persistent files"
				description="Drop files here -- agent outputs, screenshots, exported docs. Persistent-machine artifacts live under /home/machine/.agent-machines and downloads are proxied through the dashboard. Ephemeral sandboxes use the account's external storage backend."
			/>
			<ArtifactsPanel />
		</div>
	);
}
