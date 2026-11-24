import { Move } from 'lucide-react';
import { MeadowIsland3D } from './MeadowIsland3D';

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a1.75 1.75 0 0 1-.61-1.335V3.149c0-.517.224-.998.609-1.335zm11.24 11.24l2.742 2.742-10.97 6.265 8.228-9.007zm3.822-2.182l2.198 1.255c.84.48.84 1.692 0 2.172l-2.198 1.255-2.99-2.99 2.99-1.692zM6.621 1.939l10.97 6.265-2.742 2.742L6.621 1.939z" />
    </svg>
  );
}

export function HeroSection() {
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
              Your sleep and daily steps grow a living sanctuary.
            </h1>

            <p className="hero-subtitle">
              Restful nights gather Morning Dew and daily walks bring Warm Sunlight. Clear the
              morning mist in sixty calm seconds—no streak-death, no manual logging.
            </p>

            <div id="download" className="download-dock liquid-glass" role="group" aria-label="Download Dewy">
              <a
                className="store-btn store-btn-primary"
                href="#pricing"
                aria-label="Download Dewy on the App Store"
              >
                <AppleIcon />
                <span className="store-btn-text">
                  <span className="store-btn-kicker">Download on the</span>
                  <span className="store-btn-label">App Store</span>
                </span>
              </a>

              <a
                className="store-btn store-btn-secondary"
                href="#pricing"
                aria-label="Get Dewy on Google Play"
              >
                <PlayStoreIcon />
                <span className="store-btn-text">
                  <span className="store-btn-kicker">Get it on</span>
                  <span className="store-btn-label">Google Play</span>
                </span>
              </a>
            </div>

            <p className="hero-fact">
              <span className="hero-fact-dot" aria-hidden="true" />
              <span>Free to start &middot; No smartwatch required</span>
            </p>
          </div>

          <div className="hero-stage">
            <MeadowIsland3D />
            <div className="hero-stage-hint liquid-glass" aria-hidden="true">
              <Move size={14} />
              <span>Drag to explore the meadow</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
