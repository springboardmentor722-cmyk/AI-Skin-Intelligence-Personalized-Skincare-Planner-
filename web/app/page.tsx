import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { ScoreExplainerBand } from "@/components/landing/score-explainer-band";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { RolesSection } from "@/components/landing/roles-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

// Public marketing landing page — web/designs/wireframes/landing-page.html (light
// wireframe chosen as the copy/structure source; light+dark diverged on content, see
// PROGRESS.md). No app shell — standalone over the global aurora, same pattern as the
// (auth) screens (docs/WIREFRAMES.md).
export default function Home() {
  return (
    <>
      <LandingNavbar />
      <main className="pb-16">
        <HeroSection />
        <ScoreExplainerBand />
        <HowItWorksSection />
        <FeaturesGrid />
        <RolesSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
