import { LiquidGlassNav } from './components/LiquidGlassNav';
import { HeroSection } from './components/HeroSection';
import { MorningRitualSection } from './components/MorningRitualSection';
import { SanctuaryWaysSection } from './components/SanctuaryWaysSection';
import { PricingPrivacySection } from './components/PricingPrivacySection';
import { Footer } from './components/Footer';

export function App() {
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
        <PricingPrivacySection />
      </main>
      <Footer />
    </>
  );
}
