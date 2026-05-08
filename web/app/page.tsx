import { ArchitectureFlow } from "@/components/ArchitectureFlow";
import { CapabilityGrid } from "@/components/CapabilityGrid";
import { RuntimeVizGrid } from "@/components/RuntimeVizGrid";
import {
	ComponentShowcase,
	ShowcaseAttribution,
} from "@/components/ComponentShowcase";
import { Footer } from "@/components/Footer";
import { HeroBlock } from "@/components/HeroBlock";
import { LoadoutPreview } from "@/components/LoadoutPreview";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ReticlePageGrid } from "@/components/reticle/ReticlePageGrid";
import { ReticleSection } from "@/components/reticle/ReticleSection";
import { ReticleSpacer } from "@/components/reticle/ReticleSpacer";
import { SkillsManifest } from "@/components/SkillsManifest";
import { StatsRow } from "@/components/StatsRow";

export default function HomePage() {
	return (
		<ReticlePageGrid>
			<PublicNavbar githubRepo="Kevin-Liu-01/agent-machines" />

			<main id="top">
				<ReticleSection
					borderTop={false}
					contentClassName="px-6 pt-14 pb-16 md:pt-16 md:pb-20"
				>
					<HeroBlock />
					<StatsRow />
				</ReticleSection>

				<ReticleSpacer />

				<ReticleSection id="capabilities" background="wing-cloud" borderTop={false}>
					<CapabilityGrid />
				</ReticleSection>

				<ReticleSpacer />

				<ReticleSection id="runtime" borderTop={false}>
					<RuntimeVizGrid />
				</ReticleSection>

				<ReticleSpacer />

				<ReticleSection id="loadout" background="wing-nyx-lines" borderTop={false}>
					<LoadoutPreview />
				</ReticleSection>

				<ReticleSpacer />

				<ReticleSection id="components" borderTop={false}>
					<ComponentShowcase />
					<ShowcaseAttribution />
				</ReticleSection>

				<ReticleSpacer />

				<ReticleSection id="skills" borderTop={false}>
					<SkillsManifest />
				</ReticleSection>

				<ReticleSpacer />

				<ReticleSection id="architecture" background="wing-nyx-waves" borderTop={false}>
					<ArchitectureFlow />
				</ReticleSection>
			</main>

			<Footer />
		</ReticlePageGrid>
	);
}
