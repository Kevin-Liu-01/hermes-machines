import { PageHeader } from "@/components/dashboard/PageHeader";
import { SetupWizard } from "@/components/dashboard/SetupWizard";
import { getOwnerDefaults, getUserConfig } from "@/lib/user-config/clerk";
import { toPublicConfig } from "@/lib/user-config/schema";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
	const config = await getUserConfig();
	const defaults = getOwnerDefaults();
	return (
		<div className="flex flex-col">
			<PageHeader
				kicker="SETUP"
				title="Provision your agent"
				description="Bring an API key for any supported provider, pick an agent, size the box, and provision. Each user gets their own machine; secrets persist in Clerk private metadata."
			/>
			<SetupWizard
				initialConfig={toPublicConfig(config)}
				defaults={{
					machineSpec: defaults.draftSpec,
					model: defaults.draftModel,
					hasOwnerDedalusKey: Boolean(defaults.providers.dedalus?.apiKey),
					hasOwnerCursorKey: Boolean(defaults.cursorApiKey),
					hasOwnerMachine: defaults.machines.length > 0,
				}}
			/>
		</div>
	);
}
