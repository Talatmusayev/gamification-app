import { useEffect, useId, useState } from 'react';

interface LiquidDewLogoProps {
  size?: number;
}

/**
 * Living Liquid-Dew Logo (inspired by paper-design/liquid-logo):
 * Shimmering liquid-dewdrop + botanical leaf mark with an animated specular edge highlight.
 * Respects prefers-reduced-motion.
 */
export function LiquidDewLogo({ size = 32 }: LiquidDewLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bodyGrad = `dew-body-${uid}`;
  const sheenGrad = `dew-sheen-${uid}`;
  const rimGrad = `dew-rim-${uid}`;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bodyGrad} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#467C8B" />
          <stop offset="52%" stopColor="#376675" />
          <stop offset="100%" stopColor="#365E44" />
        </linearGradient>

        <linearGradient id={sheenGrad} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0.62" />
          <stop offset="56%" stopColor="#E3B261" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          {!reduced && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-24 -24"
              to="24 24"
              dur="5.5s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>

        <linearGradient id={rimGrad} x1="12" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#E3B261" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Main liquid dewdrop silhouette */}
      <path
        d="M24 4.5C24 4.5 9.5 20.8 9.5 30.2C9.5 38.2 16 44 24 44C32 44 38.5 38.2 38.5 30.2C38.5 20.8 24 4.5 24 4.5Z"
        fill={`url(#${bodyGrad})`}
      />

      {/* Specular sweep */}
      <path
        className="liquid-dew-shimmer"
        d="M24 4.5C24 4.5 9.5 20.8 9.5 30.2C9.5 38.2 16 44 24 44C32 44 38.5 38.2 38.5 30.2C38.5 20.8 24 4.5 24 4.5Z"
        fill={`url(#${sheenGrad})`}
      />

      {/* Crisp liquid-glass edge rim */}
      <path
        d="M24 5.5C24 5.5 10.5 21.1 10.5 30.2C10.5 37.6 16.5 43 24 43C31.5 43 37.5 37.6 37.5 30.2C37.5 21.1 24 5.5 24 5.5Z"
        stroke={`url(#${rimGrad})`}
        strokeWidth="1.25"
      />

      {/* Botanical leaf nested inside the drop */}
      <path
        d="M19.2 33.4C19.2 26.8 23.6 21.6 30.5 19.6C29.4 26.5 25.4 32.1 19.2 33.4Z"
        fill="#FAF8F4"
        fillOpacity="0.92"
      />
      <path
        d="M18.6 34.4C21.2 31.1 24.4 27.6 28.2 24.2"
        stroke="#365E44"
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      {/* Top-left liquid specular bead */}
      <ellipse
        cx="17.5"
        cy="23.5"
        rx="2.1"
        ry="4.2"
        transform="rotate(24 17.5 23.5)"
        fill="#FFFFFF"
        fillOpacity="0.6"
      />
    </svg>
  );
}
