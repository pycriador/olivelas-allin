import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { Benefits } from '@/components/landing/Benefits';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { OfflineSection } from '@/components/landing/OfflineSection';
import { UserProfiles } from '@/components/landing/UserProfiles';
import { EvidenceSection } from '@/components/landing/EvidenceSection';
import { FinalCta } from '@/components/landing/FinalCta';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Hero />
        <Benefits />
        <HowItWorks />
        <EvidenceSection />
        <OfflineSection />
        <UserProfiles />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
