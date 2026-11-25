import { useState } from 'react';
import {
  LanternAndDuoPhoneStage,
  MorningRevealPhoneStage,
  SanctuaryPlantCarePhoneStage,
  StagePlaybackControl,
} from './AppStageShowcase';

const WAYS = [
  {
    tag: 'Morning reveal & passive sync',
    title: 'Clear the mist in one tap',
    body: 'Wake up to your sleep duration, step count, and earned Dew and Sunlight waiting in a single card. Tap once to clear the fog and watch your meadow fill.',
    Stage: MorningRevealPhoneStage,
  },
  {
    tag: 'Living sanctuary & plant care',
    title: 'Nurture 35+ botanicals and critters',
    body: 'Water sprouting lavender, miniature bonsai, stone lanterns, and visiting critters across an 8×8 isometric clearing. Every piece you plant stays yours.',
    Stage: SanctuaryPlantCarePhoneStage,
  },
  {
    tag: 'Goodnight lantern & duo meadow',
    title: 'Nightstand rest and shared warmth',
    body: 'No wearable needed. Tap Goodnight Lantern on your nightstand to log rest, or send warm sunlight across a shared clearing with a partner or close friend.',
    Stage: LanternAndDuoPhoneStage,
  },
] as const;

export function SanctuaryWaysSection() {
  const [paused, setPaused] = useState(false);

  return (
    <section id="sanctuary" className="section section-soft" aria-labelledby="sanctuary-heading">
      <div className="wrap">
        <div className="section-header-row">
          <div className="section-header section-header-tight">
            <span className="section-eyebrow">Inside the app</span>
            <h2 id="sanctuary-heading" className="section-title">
              Built for steady rest, with or without a watch.
            </h2>
            <p className="section-lead">
              Explore the three core screens: Morning Reveal, Living Sanctuary care, and the
              phone-only Goodnight Lantern paired with Duo Shared Meadow.
            </p>
          </div>

          <StagePlaybackControl paused={paused} onToggle={() => setPaused((p) => !p)} />
        </div>

        <div className="ways-grid">
          {WAYS.map(({ tag, title, body, Stage }) => (
            <article key={title} className="way-card">
              <div className="way-visual-stage">
                <Stage paused={paused} />
              </div>
              <div className="way-copy">
                <span className="way-tag">{tag}</span>
                <h3 className="way-title">{title}</h3>
                <p className="way-body">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
