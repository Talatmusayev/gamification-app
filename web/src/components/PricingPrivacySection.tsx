import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

type BillingPeriod = 'annual' | 'monthly';

const FREE_FEATURES = [
  'Full passive sleep and daily steps (Apple Health & Health Connect)',
  'Phone-only Goodnight Lantern bedtime mode with no watch needed',
  '15 core botanicals, Morning Fog grace & Garden Harmony rhythm',
  'Optional rewarded Dew boosts, never forced or intrusive',
  '3-day Sunlit Guest Pass preview & join a Pro friend’s Duo meadow',
];

const PRO_FEATURES = [
  'All 35+ seasonal botanicals, stone lanterns, koi ponds & rare critters',
  'Host a Duo Shared Meadow with a partner or close friend',
  'All Home Screen widget sizes & deeper Garden Keeper reflections',
  'Zero rewarded ad prompts, ever & optional encrypted cloud backup',
];

const TRIAL_TIMELINE = [
  {
    day: 'Day 0 · Today',
    title: 'Full Pro greenhouse unlocked',
    copy: 'Explore all 35+ seasonal plants, critters, widgets, and Duo meadow hosting for $0.00.',
  },
  {
    day: 'Day 5 · Reminder',
    title: 'Heads-up before renewal',
    copy: 'Receive an honest reminder 48 hours before your 7-day trial ends so nothing surprises you.',
  },
  {
    day: 'Day 7 · Your choice',
    title: 'Stay Pro or return to Free',
    copy: 'Continue at $19.99/yr ($1.66/mo), or switch back to Free Meadow and keep planted items.',
  },
] as const;

function easeOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

/** Smoothly animates price digits when toggling Annual <-> Monthly (adapted from 21st.dev InkOrbitPricing) */
function PriceTicker({
  value,
  currency = '$',
  reduced,
}: {
  value: number;
  currency?: string;
  reduced: boolean;
}) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      fromRef.current = value;
      return;
    }

    const start = fromRef.current;
    const t0 = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 460);
      const next = start + (value - start) * easeOutCubic(p);
      setShown(next);
      fromRef.current = next;
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return (
    <span className="price-ticker">
      <span className="price-currency">{currency}</span>
      <span className="price-digits">{shown.toFixed(2)}</span>
    </span>
  );
}

export function PricingPrivacySection({
  onChoosePlan,
}: {
  onChoosePlan?: (planName: string) => void;
}) {
  const [billing, setBilling] = useState<BillingPeriod>('annual');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const proPrice = billing === 'annual' ? 19.99 : 2.99;

  return (
    <section id="pricing" className="section" aria-labelledby="pricing-heading">
      <div className="wrap">
        <div className="pricing-head-row">
          <div className="section-header section-header-tight">
            <span className="section-eyebrow">Simple pricing and privacy</span>
            <h2 id="pricing-heading" className="section-title">
              Free to start. Clear forever.
            </h2>
            <p className="section-lead">
              Keep your core sanctuary at no cost as long as you like. Upgrade only if you want
              every seasonal plant, widget, and Duo hosting.
            </p>
          </div>

          {/* 21st.dev InkOrbitPricing sliding billing toggle tuned to Dewy tokens */}
          <div className="billing-toggle" role="group" aria-label="Billing period">
            <span
              className="billing-toggle-pill"
              style={{ transform: billing === 'monthly' ? 'translateX(100%)' : 'translateX(0)' }}
              aria-hidden="true"
            />
            <button
              type="button"
              aria-pressed={billing === 'annual'}
              onClick={() => setBilling('annual')}
            >
              <span>Annual</span>
              <span className="billing-save">Save 44%</span>
            </button>
            <button
              type="button"
              aria-pressed={billing === 'monthly'}
              onClick={() => setBilling('monthly')}
            >
              <span>Monthly</span>
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {/* Free Meadow Tier */}
          <article className="pricing-card">
            <div className="pricing-top">
              <h3 className="pricing-name">Free Meadow</h3>
            </div>
            <div className="pricing-price-row">
              <span className="pricing-amount">$0</span>
              <span className="pricing-period">forever</span>
            </div>
            <p className="pricing-alt">
              Works locally on your device. No credit card needed to plant your first seedling.
            </p>

            <ul className="pricing-list">
              {FREE_FEATURES.map((item) => (
                <li key={item}>
                  <Check size={17} className="pricing-check" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              className="btn-outline"
              href="#early-access"
              onClick={() => onChoosePlan?.('Free Meadow')}
            >
              Start free meadow
            </a>
          </article>

          {/* Featured Dewy Pro Tier with corner brackets */}
          <div className="pricing-frame-pro">
            <span className="pf-corner pf-tl" aria-hidden="true" />
            <span className="pf-corner pf-tr" aria-hidden="true" />
            <span className="pf-corner pf-bl" aria-hidden="true" />
            <span className="pf-corner pf-br" aria-hidden="true" />

            <article className="pricing-card pricing-card-pro">
              <div className="pricing-top">
                <h3 className="pricing-name">Dewy Pro</h3>
                <span className="pricing-badge">
                  {billing === 'annual' ? '7-day free trial' : 'Cancel anytime'}
                </span>
              </div>
              <div className="pricing-price-row">
                <span className="pricing-amount">
                  <PriceTicker value={proPrice} reduced={reducedMotion} />
                </span>
                <span className="pricing-period">
                  {billing === 'annual' ? '/ year' : '/ month'}
                </span>
              </div>
              <p className="pricing-alt">
                {billing === 'annual'
                  ? '$1.66/mo · Save 44% · 7-day free trial · Or $39.99 once for Lifetime'
                  : 'Billed monthly · Or switch to $19.99/yr ($1.66/mo) or $39.99 Lifetime'}
              </p>

              <ul className="pricing-list">
                {PRO_FEATURES.map((item) => (
                  <li key={item}>
                    <Check size={17} className="pricing-check" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                className="btn-primary"
                href="#early-access"
                onClick={() =>
                  onChoosePlan?.(billing === 'annual' ? 'Dewy Pro Annual ($19.99/yr)' : 'Dewy Pro Monthly ($2.99/mo)')
                }
              >
                <span>{billing === 'annual' ? 'Start 7-day free trial' : 'Choose Monthly Pro'}</span>
                <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </article>
          </div>
        </div>

        {/* Transparent 7-Day Trial Timeline */}
        <div className="trial-timeline" aria-label="7-day free trial timeline">
          {TRIAL_TIMELINE.map((step) => (
            <div key={step.day} className="trial-step">
              <span className="trial-day">{step.day}</span>
              <h3 className="trial-title">{step.title}</h3>
              <p className="trial-copy">{step.copy}</p>
            </div>
          ))}
        </div>

        {/* Privacy Pledge Banner */}
        <aside className="privacy-banner" aria-label="Privacy pledge">
          <div className="privacy-banner-main">
            <div className="privacy-shield" aria-hidden="true">
              <ShieldCheck size={22} strokeWidth={1.75} />
            </div>
            <div>
              <p className="privacy-banner-title">Private by design, not by fine print.</p>
              <p className="privacy-banner-copy">
                Your sleep and step records stay on your device or encrypted backup—never sold and
                never shared with ad networks.
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
