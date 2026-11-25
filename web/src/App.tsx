import { useState } from 'react';
import { LiquidGlassNav } from './components/LiquidGlassNav';
import { HeroSection } from './components/HeroSection';
import { MorningRitualSection } from './components/MorningRitualSection';
import { SanctuaryWaysSection } from './components/SanctuaryWaysSection';
import { PricingPrivacySection } from './components/PricingPrivacySection';
import { EarlyAccessSection } from './components/EarlyAccessSection';
import { Footer } from './components/Footer';

export function App() {
  const [selectedPlan, setSelectedPlan] = useState('Free Meadow / 7-day Pro trial');

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <LiquidGlassNav />
      <main id="main-content">
        <HeroSection />
        <MorningRitualSection />
        <SanctuaryWaysSection />
        <PricingPrivacySection onChoosePlan={setSelectedPlan} />
        <EarlyAccessSection selectedPlan={selectedPlan} />
      </main>
      <Footer />
    </>
  );
}
