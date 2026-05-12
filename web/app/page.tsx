import { CapabilityGrid } from "@/components/CapabilityGrid";
import { RuntimeVizGrid } from "@/components/RuntimeVizGrid";
import {
	ComponentShowcase,
	ShowcaseAttribution,
} from "@/components/ComponentShowcase";
import { FaqSection } from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import { HeroBlock } from "@/components/HeroBlock";
import { LoadoutPreview } from "@/components/LoadoutPreview";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ReticleBand } from "@/components/reticle/ReticleBand";
import { ReticlePageGrid } from "@/components/reticle/ReticlePageGrid";
import { ReticleSection } from "@/components/reticle/ReticleSection";
import { ReticleSpacer } from "@/components/reticle/ReticleSpacer";
import { SkillsManifest } from "@/components/SkillsManifest";
import { StatsRow } from "@/components/StatsRow";
import { StickyRuntimeStory } from "@/components/StickyRuntimeStory";
import { WorkflowNavigator } from "@/components/WorkflowNavigator";

export default function HomePage() {
	return (
		<ReticlePageGrid>
			<PublicNavbar githubRepo="Kevin-Liu-01/agent-machines" />

			<main id="top">
				<ReticleSection
					borderTop={false}
					contentClassName="px-3 pt-10 pb-8 md:px-4 md:pt-12 md:pb-10"
				>
					<HeroBlock />
				</ReticleSection>

				{/*
				  StatsRow rides as its own band so its surrounding hairlines
				  extend edge-to-edge through the page rails, with hatching
				  filling the margin strips. Reads as a structural ledger
				  beneath the hero copy.
				*/}
				<ReticleBand hatchMargins contentClassName="px-3 py-4 md:px-4 md:py-5">
					<StatsRow />
				</ReticleBand>

				<ReticleSpacer height={10} />

				<ReticleSection
					id="workflow"
					borderTop={false}
					contentClassName="px-3 py-6 md:px-4 md:py-8"
				>
					<WorkflowNavigator />
				</ReticleSection>

				<ReticleSpacer height={10} />

				<ReticleSection
					id="capabilities"
					borderTop={false}
					contentClassName="px-3 py-6 md:px-4 md:py-8"
				>
					<CapabilityGrid />
				</ReticleSection>

				<ReticleSpacer height={10} />

				<ReticleBand id="runtime" hatchMargins contentClassName="px-3 py-6 md:px-4 md:py-8">
					<RuntimeVizGrid />
				</ReticleBand>

				<ReticleSpacer height={10} />

				<ReticleSection
					id="architecture"
					borderTop={false}
					contentClassName="px-3 py-6 md:px-4 md:py-8"
				>
					<StickyRuntimeStory />
				</ReticleSection>

				<ReticleSpacer height={10} />

				<ReticleSection
					id="loadout"
					borderTop={false}
					contentClassName="px-3 py-6 md:px-4 md:py-8"
				>
					<LoadoutPreview />
				</ReticleSection>

				<ReticleSpacer height={10} />

				<ReticleSection
					id="components"
					borderTop={false}
					contentClassName="px-3 py-6 md:px-4 md:py-8"
				>
					<ComponentShowcase />
					<ShowcaseAttribution />
				</ReticleSection>

				<ReticleSpacer height={10} />

				<ReticleSection
					id="skills"
					borderTop={false}
					contentClassName="px-3 py-6 md:px-4 md:py-8"
				>
					<SkillsManifest />
				</ReticleSection>

				<ReticleSpacer height={10} />

				<ReticleBand id="faq" hatchMargins contentClassName="px-3 py-6 md:px-4 md:py-8">
					<FaqSection />
				</ReticleBand>
			</main>

			<Footer />
		</ReticlePageGrid>
	);
}
