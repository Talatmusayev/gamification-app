import { useState } from 'react';
import { ArrowRight, Move } from 'lucide-react';
import { DewyToggleIcons, LiquidDayNightToggle } from './LiquidDayNightToggle';
import { MeadowIsland3D } from './MeadowIsland3D';

export function HeroSection() {
  const [isNight, setIsNight] = useState(false);

  return (
    <section id="top" className="hero" aria-labelledby="hero-heading">
      {/* Warm organic atmospheric glow (morning mist & sunlit honey, zero violet) */}
      <div className="hero-atmosphere" aria-hidden="true">
        <div className="hero-glow hero-glow-sun" />
        <div className="hero-glow hero-glow-mist" />
        <div className="hero-glow hero-glow-sage" />
      </div>

      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <h1 id="hero-heading" className="hero-h1">
              Sleep and step tracker that grows a cozy garden.
            </h1>

            <p className="hero-subtitle">
              Sync Apple Health or Android Health Connect, or tap the Goodnight Lantern on your
              nightstand. Clear the mist in sixty seconds each morning with zero streak-death.
            </p>

            <div className="hero-actions" role="group" aria-label="Primary actions">
              <a className="btn-primary hero-btn" href="#early-access">
                <span>Join early access</span>
                <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
              </a>

              <a className="btn-outline hero-btn" href="#sanctuary">
                See app walkthrough
              </a>
            </div>

            <p className="hero-fact">
              <span className="hero-fact-dot" aria-hidden="true" />
              <span>Free to start &middot; $19.99/yr Pro &middot; No smartwatch needed</span>
            </p>
          </div>

          <div className={`hero-stage ${isNight ? 'is-night' : 'is-day'}`}>
            <div className="hero-stage-bar">
              <div className="hero-stage-mode">
                <span className="hero-stage-dot" aria-hidden="true" />
                <span>{isNight ? 'Goodnight lantern · Twilight' : 'Morning meadow · Daylight'}</span>
              </div>
              <LiquidDayNightToggle
                checked={isNight}
                onCheckedChange={setIsNight}
                tone={isNight ? 'dark' : 'light'}
                size={44}
                icons={{ off: DewyToggleIcons.sun, on: DewyToggleIcons.moon }}
                label="Switch between Morning meadow and Goodnight lantern"
              />
            </div>

            <MeadowIsland3D isNight={isNight} />

            <div className="hero-stage-hint" aria-hidden="true">
              <Move size={14} strokeWidth={1.75} />
              <span>Drag island to orbit</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
