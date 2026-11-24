import { CloudFog, Droplets, Sun } from 'lucide-react';

const RITUAL_STEPS = [
  {
    step: '01 · Sleep',
    title: 'Rest gathers Morning Dew',
    body: 'Sync passively with Apple Health or Health Connect, or tap the Goodnight Lantern before bed. A steady night fills your sanctuary with Dew to nourish new flora.',
    icon: Droplets,
    tone: 'ritual-icon-dew',
  },
  {
    step: '02 · Movement',
    title: 'Steps bring Warm Sunlight',
    body: 'Every unhurried walk through the day collects Warm Sunlight from your phone or wearable—turning ordinary movement into bonsai trees, lanterns, and visiting critters.',
    icon: Sun,
    tone: 'ritual-icon-sun',
  },
  {
    step: '03 · Grace',
    title: 'Morning Fog, never streak-death',
    body: 'Rough nights happen. When life gets busy, nothing wilts or resets to zero—a soft morning mist settles over your meadow and lifts naturally on your next good rest.',
    icon: CloudFog,
    tone: 'ritual-icon-fog',
  },
] as const;

export function MorningRitualSection() {
  return (
    <section id="ritual" className="section" aria-labelledby="ritual-heading">
      <div className="wrap">
        <div className="section-header">
          <span className="section-eyebrow">The 60-Second Morning Ritual</span>
          <h2 id="ritual-heading" className="section-title">
            Open your meadow, not your feed.
          </h2>
          <p className="section-lead">
            Once each morning, clear the mist, collect what yesterday&rsquo;s rest and steps
            gathered, and plant one quiet detail before the day begins.
          </p>
        </div>

        <div className="ritual-grid">
          {RITUAL_STEPS.map(({ step, title, body, icon: Icon, tone }) => (
            <article key={title} className="ritual-col">
              <div className={`ritual-icon ${tone}`} aria-hidden="true">
                <Icon size={21} strokeWidth={1.85} />
              </div>
              <span className="ritual-step">{step}</span>
              <h3 className="ritual-heading">{title}</h3>
              <p className="ritual-body">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
