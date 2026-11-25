import { useEffect, useState } from 'react';
import { Droplets, Leaf, Moon, Move, Pause, Play, Sun } from 'lucide-react';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** Smoothly rolling tabular number for HUD pills */
function AnimatedCount({ target, reduced }: { target: number; reduced: boolean }) {
  const [shown, setShown] = useState(target);

  useEffect(() => {
    if (reduced) {
      setShown(target);
      return;
    }
    const start = shown;
    if (start === target) return;
    const t0 = performance.now();
    const dur = 420;
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (target - start) * ease));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduced]);

  return <span className="ss-num">{shown}</span>;
}

/** Shared native iOS phone bezel + status bar + Dynamic Island (Stageshow craft rule: never hand-draw sloppy chrome) */
function StagePhoneFrame({
  dark = false,
  time = '7:42',
  className = '',
  children,
}: {
  dark?: boolean;
  time?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`ss-phone ${dark ? 'ss-phone-dark' : ''} ${className}`}>
      <div className="ss-phone-screen">
        <div className="ss-ios-bar" aria-hidden="true">
          <span className="ss-ios-time">{time}</span>
          <span className="ss-island" />
          <span className="ss-ios-status">
            <span className="ss-signal-bars">
              <i />
              <i />
              <i />
            </span>
            <span className="ss-battery">
              <span className="ss-battery-fill" />
            </span>
          </span>
        </div>
        <div className="ss-phone-body">{children}</div>
      </div>
    </div>
  );
}

/** Stage 1: Morning Reveal & Passive Sync (cropped bottom bleed, animated tap -> Dew increments 140 -> 240) */
export function MorningRevealPhoneStage({ paused }: { paused: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [beat, setBeat] = useState<'ready' | 'hover' | 'press' | 'cleared'>('cleared');

  useEffect(() => {
    if (reduced) {
      setBeat('cleared');
      return;
    }
    if (paused) return;

    let step = 0;
    const sequence: Array<{ state: 'ready' | 'hover' | 'press' | 'cleared'; ms: number }> = [
      { state: 'ready', ms: 1300 },
      { state: 'hover', ms: 850 },
      { state: 'press', ms: 260 },
      { state: 'cleared', ms: 2600 },
    ];
    let timer = 0;

    const advance = () => {
      const current = sequence[step];
      setBeat(current.state);
      step = (step + 1) % sequence.length;
      timer = window.setTimeout(advance, current.ms);
    };

    step = 0;
    advance();
    return () => window.clearTimeout(timer);
  }, [paused, reduced]);

  const isCleared = beat === 'cleared';
  const isPressing = beat === 'press';
  const cursorActive = !reduced && !paused && (beat === 'hover' || beat === 'press');
  const dewTotal = isCleared ? 240 : 140;

  return (
    <div
      className="ss-stage-well ss-well-linen"
      role="region"
      aria-label="Dewy iPhone screen showing Morning reveal with 7h 45m rest, +100 Dew, +90 Sunlight, and Clear morning mist button"
    >
      <StagePhoneFrame time="7:42" className="ss-phone-centered">
        {/* Top Sanctuary HUD pills */}
        <div className="ss-hud-row">
          <div className={`ss-hud-pill ${isCleared ? 'is-boosted' : ''}`}>
            <Droplets size={12} strokeWidth={1.8} className="ss-ico-dew" />
            <AnimatedCount target={dewTotal} reduced={reduced} />
          </div>
          <div className="ss-hud-pill">
            <Sun size={12} strokeWidth={1.8} className="ss-ico-amber" />
            <span className="ss-num">{isCleared ? 400 : 310}</span>
          </div>
          <div className="ss-hud-pill ss-hud-harmony">
            <Leaf size={11} strokeWidth={1.8} className="ss-ico-moss" />
            <span className="ss-num">6/7</span>
          </div>
        </div>

        {/* Soft mist band that clears when tapped */}
        <div className={`ss-mist-veil ${isCleared ? 'is-cleared' : ''}`} aria-hidden="true" />

        {/* Morning Reveal Sheet */}
        <div className="ss-reveal-card">
          <div className="ss-reveal-head">
            <span className="ss-reveal-title">Morning reveal</span>
            <span className="ss-reveal-date">7h 45m</span>
          </div>

          <div className="ss-metrics-pair">
            <div className="ss-metric-tile">
              <span className="ss-metric-k">Rest</span>
              <span className="ss-metric-v">7h 45m</span>
              <span className="ss-reward ss-reward-dew">+100 Dew</span>
            </div>
            <div className="ss-metric-tile">
              <span className="ss-metric-k">Steps</span>
              <span className="ss-metric-v">8,420</span>
              <span className="ss-reward ss-reward-sun">+90 Sunlight</span>
            </div>
          </div>

          <button
            type="button"
            className={`ss-app-btn ${isCleared ? 'is-done' : ''} ${isPressing ? 'is-pressed' : ''}`}
            onClick={() => setBeat((prev) => (prev === 'cleared' ? 'ready' : 'cleared'))}
            tabIndex={-1}
          >
            <span>{isCleared ? 'Mist cleared' : 'Clear morning mist'}</span>
          </button>
        </div>

        {/* Touch pointer ring riding smoothly off the button text */}
        {!reduced && (
          <div
            className={`ss-touch-cursor ${cursorActive ? 'is-target' : ''} ${isPressing ? 'is-tap' : ''}`}
            aria-hidden="true"
          />
        )}
      </StagePhoneFrame>
    </div>
  );
}

/** Stage 2: Living Sanctuary & Plant Care (cropped bottom bleed, isometric island, Pip whisper, Lavender Budding 2/3 -> Water · 15) */
export function SanctuaryPlantCarePhoneStage({ paused }: { paused: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<'budding' | 'aim' | 'press' | 'blooming'>('budding');

  useEffect(() => {
    if (reduced) {
      setPhase('budding');
      return;
    }
    if (paused) return;

    let idx = 0;
    const steps: Array<{ phase: 'budding' | 'aim' | 'press' | 'blooming'; ms: number }> = [
      { phase: 'budding', ms: 1500 },
      { phase: 'aim', ms: 850 },
      { phase: 'press', ms: 260 },
      { phase: 'blooming', ms: 2400 },
    ];
    let timer = 0;

    const next = () => {
      const cur = steps[idx];
      setPhase(cur.phase);
      idx = (idx + 1) % steps.length;
      timer = window.setTimeout(next, cur.ms);
    };

    idx = 0;
    next();
    return () => window.clearTimeout(timer);
  }, [paused, reduced]);

  const watered = phase === 'blooming';
  const pressing = phase === 'press';
  const cursorTarget = !reduced && !paused && (phase === 'aim' || phase === 'press');
  const stageNum = watered ? 3 : 2;
  const stageLabel = watered ? 'Blooming · 3/3' : 'Budding · 2/3';

  return (
    <div
      className="ss-stage-well ss-well-meadow"
      role="region"
      aria-label="Dewy iPhone screen showing living isometric meadow, Pip whisper bubble, and Care Bar for Lavender at Budding 2/3 with Water 15 button"
    >
      <StagePhoneFrame time="8:14" className="ss-phone-centered">
        {/* Top Sanctuary HUD */}
        <div className="ss-hud-row">
          <div className="ss-hud-pill">
            <Droplets size={12} strokeWidth={1.8} className="ss-ico-dew" />
            <AnimatedCount target={watered ? 225 : 240} reduced={reduced} />
          </div>
          <div className="ss-hud-pill ss-hud-harmony">
            <Leaf size={11} strokeWidth={1.8} className="ss-ico-moss" />
            <span className="ss-num">5 of 7 restful days</span>
          </div>
        </div>

        {/* Isometric Island + Pip Whisper + Selected Lavender */}
        <div className="ss-meadow-canvas">
          <div className="ss-whisper-bubble">
            <span>Steady rest feeds every bloom</span>
          </div>

          <svg viewBox="0 0 220 96" width="100%" height="90" fill="none" aria-hidden="true">
            {/* Isometric diamond meadow */}
            <path d="M110 18 L194 50 L110 82 L26 50 Z" fill="#6D9B6E" />
            <path d="M26 50 L110 82 L110 90 L26 58 Z" fill="#9A6E50" />
            <path d="M194 50 L110 82 L110 90 L194 58 Z" fill="#825D43" />
            {/* Pond */}
            <ellipse cx="148" cy="51" rx="22" ry="10" fill="#5CA6B0" />
            {/* Bonsai */}
            <path d="M68 46 C67 36 72 31 75 26" stroke="#6B4B37" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="75" cy="22" rx="14" ry="8" fill="#365E44" />
            {/* Pip companion */}
            <ellipse cx="110" cy="49" rx="10" ry="8.5" fill="#FAF6EE" />
            <circle cx="107" cy="48" r="1.2" fill="#1E241E" />
            <circle cx="113" cy="48" r="1.2" fill="#1E241E" />
            <path d="M105 40 C109 34 117 35 119 40 Z" fill="#4B7E57" />
            {/* Selected Lavender tile with subtle moss halo */}
            <ellipse cx="83" cy="59" rx="17" ry="8" fill="rgba(54, 94, 68, 0.16)" stroke="#365E44" strokeWidth="1" />
            <line x1="80" y1="60" x2="78" y2="45" stroke="#365E44" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="84" y1="60" x2="85" y2="42" stroke="#365E44" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="88" y1="60" x2="90" y2="47" stroke="#365E44" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="78" cy="43" r="2.6" fill="#5D889C" />
            <circle cx="85" cy="40" r={watered ? 3.3 : 2.7} fill="#6C97AA" />
            <circle cx="90" cy="45" r="2.5" fill="#5D889C" />
          </svg>

          {/* Animated water ripple feedback when watered */}
          <span className={`ss-water-ripple ${watered ? 'is-rippling' : ''}`} aria-hidden="true" />
        </div>

        {/* Real Care Bar */}
        <div className="ss-care-bar">
          <div className="ss-care-head">
            <div>
              <div className="ss-care-name">Lavender</div>
              <div className="ss-care-stage">
                <span className="ss-stage-dots" aria-hidden="true">
                  {[1, 2, 3].map((dot) => (
                    <i key={dot} className={dot <= stageNum ? 'is-filled' : ''} />
                  ))}
                </span>
                <span>{stageLabel}</span>
              </div>
            </div>
          </div>

          <div className="ss-care-actions">
            <button
              type="button"
              className={`ss-care-water ${pressing ? 'is-pressed' : ''}`}
              onClick={() => setPhase((prev) => (prev === 'blooming' ? 'budding' : 'blooming'))}
              tabIndex={-1}
            >
              <Droplets size={11} strokeWidth={1.8} />
              <span>Water · 15</span>
            </button>
            <span className="ss-care-move">
              <Move size={11} strokeWidth={1.8} />
              <span>Move</span>
            </span>
          </div>
        </div>

        {!reduced && (
          <div
            className={`ss-touch-cursor ss-cursor-care ${cursorTarget ? 'is-target' : ''} ${pressing ? 'is-tap' : ''}`}
            aria-hidden="true"
          />
        )}
      </StagePhoneFrame>
    </div>
  );
}

/** Stage 3: Goodnight Lantern & Duo Shared Meadow (dark lantern mode phone + straddling Duo Shared Meadow satellite card) */
export function LanternAndDuoPhoneStage({ paused }: { paused: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [nudgeSent, setNudgeSent] = useState(true);

  useEffect(() => {
    if (reduced || paused) return;
    const interval = window.setInterval(() => {
      setNudgeSent((prev) => !prev);
    }, 3400);
    return () => window.clearInterval(interval);
  }, [paused, reduced]);

  return (
    <div
      className="ss-stage-well ss-well-twilight"
      role="region"
      aria-label="Dewy Goodnight Lantern screen showing Lantern glowing for 7h 12m paired with Duo Shared Meadow card showing Warm sunlight sent"
    >
      <StagePhoneFrame dark time="22:45" className="ss-phone-left-offset">
        <div className="ss-lantern-status">
          <Moon size={12} strokeWidth={1.8} className="ss-ico-lantern" />
          <span>Lantern glowing</span>
        </div>

        <div className="ss-lantern-orb-wrap" aria-hidden="true">
          <div className="ss-lantern-halo" />
          <svg viewBox="0 0 80 80" width="68" height="68" fill="none">
            <path d="M31 24 Q40 14 49 24" stroke="#B9C0B7" strokeWidth="2" strokeLinecap="round" />
            <rect x="25" y="24" width="30" height="4" rx="2" fill="#46514B" />
            <rect x="27" y="28" width="26" height="30" rx="6" fill="#252E29" stroke="#57635C" strokeWidth="1.4" />
            <rect x="32" y="33" width="16" height="20" rx="4" fill="#E3B261" />
            <circle cx="40" cy="43" r="4" fill="#FFF4D6" />
            <rect x="25" y="58" width="30" height="4" rx="2" fill="#46514B" />
          </svg>
        </div>

        <div className="ss-lantern-timer">7h 12m</div>
        <div className="ss-lantern-sub">Ready to gather dew at wake</div>
      </StagePhoneFrame>

      {/* Straddling Duo Shared Meadow Satellite Card (framing.md: overlaps bezel chrome, never content) */}
      <button
        type="button"
        className={`ss-duo-satellite ${nudgeSent ? 'is-sent' : ''}`}
        onClick={() => setNudgeSent((s) => !s)}
        tabIndex={-1}
        aria-label="Duo shared meadow status"
      >
        <div className="ss-duo-spirits" aria-hidden="true">
          <span className="ss-spirit-dot ss-spirit-you" />
          <span className="ss-duo-arc" />
          <span className="ss-spirit-dot ss-spirit-partner" />
        </div>
        <div className="ss-duo-title">Duo shared meadow</div>
        <div className="ss-duo-pill">
          <Sun size={11} strokeWidth={1.9} className="ss-ico-amber" />
          <span>{nudgeSent ? 'Warm sunlight sent' : 'Send warm sunlight'}</span>
        </div>
      </button>
    </div>
  );
}

/** Shared Pause / Play ambient control for the Stageshow demos */
export function StagePlaybackControl({
  paused,
  onToggle,
}: {
  paused: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="stage-playback-btn"
      onClick={onToggle}
      aria-pressed={paused}
      aria-label={paused ? 'Play walkthrough previews' : 'Pause walkthrough previews'}
    >
      {paused ? <Play size={14} strokeWidth={1.8} /> : <Pause size={14} strokeWidth={1.8} />}
      <span>{paused ? 'Play previews' : 'Pause previews'}</span>
    </button>
  );
}
