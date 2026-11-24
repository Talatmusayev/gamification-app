function LanternVignette() {
  return (
    <svg viewBox="0 0 280 156" width="100%" height="100%" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="lanternGlow" cx="50%" cy="54%" r="48%">
          <stop offset="0%" stopColor="#E3B261" stopOpacity="0.65" />
          <stop offset="55%" stopColor="#E3B261" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#1D2621" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="140" cy="84" r="70" fill="url(#lanternGlow)" />
      {/* Hanging stone lantern silhouette */}
      <line x1="140" y1="0" x2="140" y2="34" stroke="#7A867A" strokeWidth="2" />
      <path d="M114 48 L140 32 L166 48 Z" fill="#5D685E" />
      <rect x="122" y="48" width="36" height="44" rx="6" fill="#2A362E" stroke="#7A867A" strokeWidth="1.5" />
      <rect x="129" y="55" width="22" height="30" rx="4" fill="#E3B261" />
      <rect x="118" y="92" width="44" height="7" rx="3.5" fill="#5D685E" />
      {/* Subtle twilight stars */}
      <circle cx="62" cy="44" r="1.6" fill="#FAF8F4" opacity="0.55" />
      <circle cx="218" cy="38" r="1.8" fill="#FAF8F4" opacity="0.45" />
      <circle cx="204" cy="112" r="1.4" fill="#E3B261" opacity="0.6" />
      <circle cx="78" cy="114" r="1.3" fill="#FAF8F4" opacity="0.4" />
      {/* Pill readout */}
      <rect x="92" y="118" width="96" height="22" rx="11" fill="rgba(250,248,244,0.1)" />
      <circle cx="106" cy="129" r="3.5" fill="#E3B261" />
      <rect x="116" y="126.5" width="56" height="5" rx="2.5" fill="#FAF8F4" opacity="0.72" />
    </svg>
  );
}

function BotanicalVignette() {
  return (
    <svg viewBox="0 0 280 156" width="100%" height="100%" fill="none" aria-hidden="true">
      {/* Three botanical tiles */}
      <rect x="24" y="28" width="68" height="100" rx="14" fill="#FFFFFF" stroke="rgba(30,36,30,0.08)" />
      <rect x="106" y="20" width="68" height="112" rx="14" fill="#FFFFFF" stroke="rgba(54,94,68,0.22)" />
      <rect x="188" y="28" width="68" height="100" rx="14" fill="#FFFFFF" stroke="rgba(30,36,30,0.08)" />

      {/* Tile 1: Bonsai */}
      <path d="M58 96 C57 82 62 76 64 68" stroke="#6B4B37" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="62" cy="62" rx="16" ry="9" fill="#365E44" />
      <ellipse cx="50" cy="72" rx="11" ry="6.5" fill="#5E8B63" />
      <rect x="42" y="106" width="32" height="5" rx="2.5" fill="#D5D0C5" />

      {/* Tile 2: Pip the Meadow Spirit */}
      <ellipse cx="140" cy="84" rx="16" ry="14" fill="#FAF6EE" stroke="#DDD6C8" strokeWidth="1.2" />
      <circle cx="135" cy="82" r="2" fill="#1E241E" />
      <circle cx="145" cy="82" r="2" fill="#1E241E" />
      <path d="M132 69 C139 60 150 61 153 69 C145 72 137 72 132 69 Z" fill="#4B7E57" />
      <rect x="122" y="109" width="36" height="5" rx="2.5" fill="#365E44" opacity="0.4" />

      {/* Tile 3: Koi Pond */}
      <ellipse cx="222" cy="78" rx="20" ry="12" fill="#63B2BC" opacity="0.85" />
      <ellipse cx="222" cy="78" rx="13" ry="7" fill="#376675" opacity="0.45" />
      <path d="M216 78 C219 74 225 75 228 79" stroke="#E3B261" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="206" y="106" width="32" height="5" rx="2.5" fill="#D5D0C5" />
    </svg>
  );
}

function DuoMeadowVignette() {
  return (
    <svg viewBox="0 0 280 156" width="100%" height="100%" fill="none" aria-hidden="true">
      {/* Shared meadow bridge between two islets */}
      <ellipse cx="94" cy="96" rx="54" ry="20" fill="#5E8B63" />
      <ellipse cx="186" cy="96" rx="54" ry="20" fill="#6D9B6E" />
      <rect x="122" y="88" width="36" height="10" rx="5" fill="#D4CEC2" />
      {/* Left companion */}
      <ellipse cx="88" cy="78" rx="12" ry="11" fill="#FAF6EE" stroke="#DDD6C8" strokeWidth="1.2" />
      <path d="M82 67 C88 60 96 61 98 67 Z" fill="#365E44" />
      {/* Right companion */}
      <ellipse cx="192" cy="78" rx="12" ry="11" fill="#FAF6EE" stroke="#DDD6C8" strokeWidth="1.2" />
      <path d="M186 67 C192 60 200 61 202 67 Z" fill="#376675" />
      {/* Floating sunlight arc connecting both */}
      <path
        d="M96 54 C122 32 158 32 184 54"
        stroke="#E3B261"
        strokeWidth="2"
        strokeDasharray="4 5"
        strokeLinecap="round"
      />
      <circle cx="140" cy="38" r="5" fill="#E3B261" />
    </svg>
  );
}

const WAYS = [
  {
    tag: 'Phone-Only Bedtime Mode',
    title: 'Goodnight Lantern',
    body: 'No smartwatch on your wrist? Tap the warm twilight lantern when you turn in, set your phone down, and wake up to Morning Dew waiting for your meadow.',
    visualClass: 'way-visual-lantern',
    Visual: LanternVignette,
  },
  {
    tag: 'Living Isometric Catalog',
    title: '35+ Handcrafted Botanicals & Critters',
    body: 'Place lavender sprigs, miniature bonsai, stone lanterns, koi ponds, and quiet visiting critters across your 8×8 meadow—every piece stays yours forever.',
    visualClass: 'way-visual-botanical',
    Visual: BotanicalVignette,
  },
  {
    tag: 'Gentle Accountability',
    title: 'Duo Shared Meadow',
    body: 'Grow a shared clearing alongside a partner or close friend. Check in on each other’s morning mist without leaderboards, noise, or social pressure.',
    visualClass: 'way-visual-duo',
    Visual: DuoMeadowVignette,
  },
] as const;

export function SanctuaryWaysSection() {
  return (
    <section id="sanctuary" className="section section-soft" aria-labelledby="sanctuary-heading">
      <div className="wrap">
        <div className="section-header">
          <span className="section-eyebrow">Three Ways to Grow</span>
          <h2 id="sanctuary-heading" className="section-title">
            Built for quiet consistency, however you rest.
          </h2>
          <p className="section-lead">
            Whether you wear a watch, keep your phone on a nightstand, or share a morning rhythm
            with someone you care about, your sanctuary adapts without friction.
          </p>
        </div>

        <div className="ways-grid">
          {WAYS.map(({ tag, title, body, visualClass, Visual }) => (
            <article key={title} className="way-card">
              <div className={`way-visual ${visualClass}`}>
                <Visual />
              </div>
              <span className="way-tag">{tag}</span>
              <h3 className="way-title">{title}</h3>
              <p className="way-body">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
