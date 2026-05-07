import { UserButton } from "@clerk/nextjs";

import { ArchitectureFlow } from "@/components/ArchitectureFlow";
import { SignedIn, SignedOut } from "@/components/AuthSwitch";
import { BrandMark } from "@/components/BrandMark";
import { CapabilityGrid } from "@/components/CapabilityGrid";
import {
	ComponentShowcase,
	ShowcaseAttribution,
} from "@/components/ComponentShowcase";
import { Footer } from "@/components/Footer";
import { HeroBlock } from "@/components/HeroBlock";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleNavbar } from "@/components/reticle/ReticleNavbar";
import { ReticlePageGrid } from "@/components/reticle/ReticlePageGrid";
import { ReticleSection } from "@/components/reticle/ReticleSection";
import { SkillsManifest } from "@/components/SkillsManifest";
import { StatsRow } from "@/components/StatsRow";

const CLERK_READY = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function HomePage() {
	return (
		<ReticlePageGrid>
			<ReticleNavbar>
				<div className="flex h-12 items-center justify-between px-5">
					<a href="#top" className="flex items-center">
						<BrandMark size={20} />
					</a>
					<div className="flex items-center gap-4 font-mono text-[11px] text-[var(--ret-text-dim)]">
						<a
							href="#capabilities"
							className="hidden hover:text-[var(--ret-text)] md:inline"
						>
							capabilities
						</a>
						<a
							href="#components"
							className="hidden hover:text-[var(--ret-text)] md:inline"
						>
							components
						</a>
						<a
							href="#skills"
							className="hidden hover:text-[var(--ret-text)] md:inline"
						>
							skills
						</a>
						<a
							href="#architecture"
							className="hidden hover:text-[var(--ret-text)] md:inline"
						>
							architecture
						</a>
						<a
							href="https://github.com/Kevin-Liu-01/hermes-machines"
							target="_blank"
							rel="noreferrer"
							className="hidden hover:text-[var(--ret-text)] md:inline"
						>
							github
						</a>
						<SignedIn>
							<ReticleButton as="a" href="/dashboard" variant="primary" size="sm">
								Dashboard
							</ReticleButton>
							{CLERK_READY ? (
								<UserButton
									appearance={{ elements: { avatarBox: "h-6 w-6" } }}
								/>
							) : null}
						</SignedIn>
						<SignedOut>
							<ReticleButton as="a" href="/sign-in" variant="primary" size="sm">
								Sign in
							</ReticleButton>
						</SignedOut>
					</div>
				</div>
			</ReticleNavbar>

			<main id="top">
				<ReticleSection
					borderTop={false}
					contentClassName="px-6 pt-12 pb-10 md:pt-14"
				>
					<HeroBlock />
					<StatsRow />
				</ReticleSection>

				<ReticleSection id="capabilities" contentClassName="px-6 py-10">
					<CapabilityGrid />
				</ReticleSection>

				<ReticleSection id="components" contentClassName="px-6 py-10">
					<ComponentShowcase />
					<ShowcaseAttribution />
				</ReticleSection>

				<ReticleSection id="skills" contentClassName="px-6 py-10">
					<SkillsManifest />
				</ReticleSection>

				<ReticleSection id="architecture" contentClassName="px-6 py-10">
					<ArchitectureFlow />
				</ReticleSection>
			</main>

			<Footer />
		</ReticlePageGrid>
	);
}
