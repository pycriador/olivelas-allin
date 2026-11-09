import { PublicLayout } from "@/layouts/public-layout";
import { HeroSection } from "@/features/landing/ui/hero-section";
import { TrustSection } from "@/features/landing/ui/trust-section";
import { FeaturesSection } from "@/features/landing/ui/features-section";
import { HowItWorksSection } from "@/features/landing/ui/how-it-works-section";
import { BenefitsSection } from "@/features/landing/ui/benefits-section";
import { SecuritySection } from "@/features/landing/ui/security-section";
import { IntegrationsSection } from "@/features/landing/ui/integrations-section";
import { PricingSection } from "@/features/landing/ui/pricing-section";
import { FaqSection } from "@/features/landing/ui/faq-section";
import { CtaSection } from "@/features/landing/ui/cta-section";

export function LandingPage() {
  return (
    <PublicLayout>
      <HeroSection />
      <TrustSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <SecuritySection />
      <IntegrationsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </PublicLayout>
  );
}
