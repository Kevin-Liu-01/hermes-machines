import { LoadoutPanel } from "@/components/dashboard/LoadoutPanel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { listMcpServers } from "@/lib/dashboard/mcps";
import { listSkills } from "@/lib/dashboard/skills";
import {
	BUILTIN_TOOLS,
	SERVICES,
	TASKS,
	computeCounts,
} from "@/lib/dashboard/loadout";

export const dynamic = "force-dynamic";

export default function LoadoutPage() {
	const skills = listSkills();
	const mcps = listMcpServers();
	const mcpToolCount = mcps.reduce((sum, m) => sum + m.tools.length, 0);
	const counts = computeCounts({
		skills: skills.length,
		mcpServers: mcps.length,
		mcpTools: mcpToolCount,
	});
	return (
		<div className="flex flex-col">
			<PageHeader
				kicker="LOADOUT"
				title="The rig your agent is wearing"
				description="Everything callable from the chat surface, organized exactly the way the agent picks tools: built-ins first, MCP servers next, then the service registry (what's the right interface per service) and the task hierarchy (what's the right tool per task). Every entry is loaded onto your machine at bootstrap and ready to call."
			/>
			<LoadoutPanel
				counts={counts}
				skills={skills}
				mcps={mcps}
				builtins={[...BUILTIN_TOOLS]}
				services={[...SERVICES]}
				tasks={[...TASKS]}
			/>
		</div>
	);
}
