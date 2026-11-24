import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

const FREE_FEATURES = [
  'Full 8×8 living sanctuary with Morning Reveal',
  'Apple Health, Android Health Connect & Phone-Only Goodnight Lantern',
  'Starter botanicals, Morning Fog grace & Garden Harmony rhythm',
  'Works locally on your device with zero account required',
];

const PRO_FEATURES = [
  'All 35+ seasonal botanicals, stone lanterns, ponds & rare critters',
  'Duo Shared Meadow with a partner or close friend',
  'All Home Screen widget sizes & deeper Garden Keeper notes',
  'Optional encrypted cloud backup with 1-tap deletion',
];

export function PricingPrivacySection() {
  return (
    <section id="pricing" className="section" aria-labelledby="pricing-heading">
      <div className="wrap">
        <div className="section-header">
          <span className="section-eyebrow">Calm Pricing &amp; Privacy Pledge</span>
          <h2 id="pricing-heading" className="section-title">
            Free to start. Honest forever.
          </h2>
          <p className="section-lead">
            Begin your sanctuary at no cost and keep your basic meadow as long as you like. Upgrade
            only if you want the full seasonal greenhouse.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <article className="pricing-card">
            <div className="pricing-top">
              <h3 className="pricing-name">Free Meadow</h3>
            </div>
            <div className="pricing-price-row">
              <span className="pricing-amount">$0</span>
              <span className="pricing-period">forever</span>
            </div>
            <p className="pricing-alt">No credit card needed to plant your first seedling.</p>

            <ul className="pricing-list">
              {FREE_FEATURES.map((item) => (
                <li key={item}>
                  <Check size={17} className="pricing-check" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a className="btn-outline" href="#download">
              Start free meadow
            </a>
          </article>

          {/* Pro Tier */}
          <article className="pricing-card pricing-card-pro">
            <div className="pricing-top">
              <h3 className="pricing-name">Dewy Pro</h3>
              <span className="pricing-badge">7-day free trial</span>
            </div>
            <div className="pricing-price-row">
              <span className="pricing-amount">$19.99</span>
              <span className="pricing-period">/ year</span>
            </div>
            <p className="pricing-alt">Or $39.99 once for lifetime access &middot; Cancel anytime.</p>

            <ul className="pricing-list">
              {PRO_FEATURES.map((item) => (
                <li key={item}>
                  <Check size={17} className="pricing-check" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a className="btn-primary" href="#download">
              Try 7 days free
            </a>
          </article>
        </div>

        {/* Privacy Pledge Banner */}
        <aside className="privacy-banner" aria-label="Privacy pledge">
          <div className="privacy-banner-main">
            <div className="privacy-shield" aria-hidden="true">
              <ShieldCheck size={22} strokeWidth={1.85} />
            </div>
            <div>
              <p className="privacy-banner-title">Private by design, not by fine print.</p>
              <p className="privacy-banner-copy">
                Your sleep and step records are never sold and never shared with ad networks.
              </p>
            </div>
          </div>

          <a className="privacy-link" href="/privacy.html">
            <span>Read privacy policy</span>
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </aside>
      </div>
    </section>
  );
}
