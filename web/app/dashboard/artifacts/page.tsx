import { ArtifactsPanel } from "@/components/dashboard/ArtifactsPanel";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const dynamic = "force-dynamic";

export default function ArtifactsPage() {
	return (
		<div className="flex flex-col">
			<PageHeader
				kicker="ARTIFACTS"
				title="Persistent files"
				description="Drop files here -- agent outputs, screenshots, exported docs. Storage is Vercel Blob, scoped to your account. Public URLs are unguessable; share at your discretion."
			/>
			<ArtifactsPanel />
		</div>
	);
}
