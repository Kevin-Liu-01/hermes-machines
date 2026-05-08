import { PageHeader } from "@/components/dashboard/PageHeader";
import { SetupWizard } from "@/components/dashboard/SetupWizard";
import { getOwnerDefaults, getUserConfig } from "@/lib/user-config/clerk";
import { toPublicConfig } from "@/lib/user-config/schema";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
	const [config, defaults] = await Promise.all([
		getUserConfig(),
		Promise.resolve(getOwnerDefaults()),
	]);
	return (
		<div className="flex flex-col">
			<PageHeader
				kicker="SETUP"
				title="Provision your agent"
				description="Five steps. Bring a Dedalus API key, pick an agent + provider, size the box, then provision. Your config persists across sessions in Clerk metadata."
			/>
			<SetupWizard
				initialConfig={toPublicConfig(config)}
				defaults={{
					machineSpec: defaults.machineSpec,
					model: defaults.model,
					hasOwnerDedalusKey: Boolean(defaults.dedalusApiKey),
					hasOwnerCursorKey: Boolean(defaults.cursorApiKey),
					hasOwnerMachine: Boolean(defaults.machineId),
				}}
			/>
		</div>
	);
}
