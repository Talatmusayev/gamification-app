import { CloudFog, Droplets, Sun } from 'lucide-react';

const RITUAL_STEPS = [
  {
    step: '01 · Sleep',
    title: 'Rest gathers Morning Dew',
    body: 'Sync passively with Apple Health or Health Connect, or tap the Goodnight Lantern before bed. A steady night fills your meadow with Dew for new seedlings.',
    icon: Droplets,
    tone: 'ritual-icon-dew',
  },
  {
    step: '02 · Movement',
    title: 'Steps bring Warm Sunlight',
    body: 'Every unhurried walk through the day gathers Warm Sunlight from your phone or wearable, turning ordinary steps into bonsai trees, lanterns, and critters.',
    icon: Sun,
    tone: 'ritual-icon-sun',
  },
  {
    step: '03 · Grace',
    title: 'Morning Fog, never streak-death',
    body: 'Short nights happen. When schedules shift, nothing wilts or resets to zero. Soft morning mist settles over the island and lifts on your next good rest.',
    icon: CloudFog,
    tone: 'ritual-icon-fog',
  },
] as const;

export function MorningRitualSection() {
  return (
    <section id="ritual" className="section" aria-labelledby="ritual-heading">
      <div className="wrap">
        <div className="section-header">
          <span className="section-eyebrow">The 60-second morning ritual</span>
          <h2 id="ritual-heading" className="section-title">
            Open your meadow, not your feed.
          </h2>
          <p className="section-lead">
            Once each morning, clear the mist, collect what yesterday&rsquo;s rest and steps
            gathered, and plant one new detail before the day begins.
          </p>
        </div>

        <div className="ritual-grid">
          {RITUAL_STEPS.map(({ step, title, body, icon: Icon, tone }) => (
            <article key={title} className="ritual-col">
              <div className={`ritual-icon ${tone}`} aria-hidden="true">
                <Icon size={21} strokeWidth={1.75} />
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
