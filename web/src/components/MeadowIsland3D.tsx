import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export interface MeadowIsland3DProps {
  isNight?: boolean;
}

function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/** Graceful static illustration when WebGL is unavailable */
function StaticMeadowFallback({ isNight }: { isNight: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      role="img"
      aria-label={
        isNight
          ? 'Twilight sanctuary island with glowing stone lantern, wooden pier, fireflies, and sleeping Pip'
          : 'Morning meadow sanctuary island with bonsai, wooden pier, stepped stone terrace, wildflowers, and Pip'
      }
    >
      <svg viewBox="0 0 420 360" width="380" height="325" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fbGlow" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#E3B261" stopOpacity={isNight ? 0.42 : 0.28} />
            <stop offset="100%" stopColor={isNight ? '#141916' : '#FAF8F4'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="210" cy="175" r="158" fill="url(#fbGlow)" />
        {isNight && (
          <>
            <circle cx="88" cy="72" r="2.2" fill="#F4F1EA" opacity="0.65" />
            <circle cx="328" cy="64" r="2" fill="#E3B261" opacity="0.85" />
            <circle cx="132" cy="112" r="2.5" fill="#E3B261" opacity="0.7" />
            <circle cx="305" cy="120" r="1.8" fill="#F4F1EA" opacity="0.55" />
          </>
        )}
        {/* Underside limestone rock */}
        <path d="M96 196 L324 196 L262 292 L210 318 L154 282 Z" fill={isNight ? '#5C5B54' : '#9E988D'} />
        <path d="M210 196 L324 196 L262 292 L210 318 Z" fill={isNight ? '#4C4B45' : '#8A8479'} />
        {/* Terracotta rim */}
        <ellipse cx="210" cy="196" rx="126" ry="44" fill={isNight ? '#684B37' : '#9A6E50'} />
        {/* Mossy plateau */}
        <ellipse cx="210" cy="184" rx="128" ry="44" fill={isNight ? '#34523A' : '#5E8B63'} />
        <ellipse cx="204" cy="180" rx="102" ry="32" fill={isNight ? '#406646' : '#75A374'} />
        {/* Stepped stone terrace */}
        <ellipse cx="174" cy="192" rx="16" ry="6" fill={isNight ? '#77746B' : '#CEC8BC'} />
        <ellipse cx="192" cy="197" rx="14" ry="5.5" fill={isNight ? '#6B6860' : '#D8D2C6'} />
        {/* Turquoise pond + wooden pier */}
        <ellipse cx="256" cy="188" rx="38" ry="16" fill={isNight ? '#2F5C66' : '#5CA6B0'} />
        <rect x="218" y="180" width="28" height="9" rx="2" fill={isNight ? '#5A412E' : '#7B583F'} />
        <path
          d="M250 198 C252 240 250 282 248 312 L268 312 C270 282 272 240 272 198 Z"
          fill={isNight ? '#3C7580' : '#7CC5CF'}
          opacity="0.72"
        />
        {/* Bonsai */}
        <path d="M142 174 C140 150 152 138 158 122" stroke="#6B4B37" strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="158" cy="112" rx="34" ry="18" fill={isNight ? '#264431' : '#365E44'} />
        <ellipse cx="136" cy="126" rx="22" ry="13" fill={isNight ? '#31573B' : '#4F7F5A'} />
        {/* Stone lantern */}
        <rect x="282" y="148" width="10" height="22" rx="2" fill={isNight ? '#7A766C' : '#B6B0A4'} />
        <rect x="279" y="138" width="16" height="12" rx="2" fill="#E3B261" />
        <path d="M272 140 L287 128 L302 140 Z" fill={isNight ? '#6E6A60' : '#9E988D'} />
        {/* Pip the meadow spirit */}
        <ellipse cx="204" cy={isNight ? 168 : 166} rx="18" ry={isNight ? 14.5 : 16} fill="#FAF6EE" />
        {isNight ? (
          <>
            <path d="M195 166 Q198 169 201 166" stroke="#1E241E" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M207 166 Q210 169 213 166" stroke="#1E241E" strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="198" cy="164" r="2.2" fill="#1E241E" />
            <circle cx="210" cy="164" r="2.2" fill="#1E241E" />
          </>
        )}
        <path d="M196 150 C204 140 218 142 222 152 C212 155 202 154 196 150 Z" fill="#4E8259" />
      </svg>
    </div>
  );
}

/** Gently curved miniature bonsai tree */
function BonsaiTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.24, 0]} rotation={[0.08, 0, -0.14]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.125, 0.52, 7]} />
        <meshStandardMaterial color="#6B4B37" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.1, 0.56, 0.03]} rotation={[0.04, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 0.42, 6]} />
        <meshStandardMaterial color="#6B4B37" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.14, 0.46, 0.06]} rotation={[0.12, 0, 0.65]} castShadow>
        <cylinderGeometry args={[0.032, 0.052, 0.34, 6]} />
        <meshStandardMaterial color="#6B4B37" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.18, 0.84, 0.04]} scale={[1.25, 0.58, 1.05]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#3B6849" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.22, 0.66, 0.1]} scale={[1.1, 0.52, 0.95]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.31, 0]} />
        <meshStandardMaterial color="#4F7F5A" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.02, 1.04, -0.05]} scale={[1.05, 0.5, 0.95]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#64946B" roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

/** Wildflower tufts in botanical cream chamomile, cornflower-teal, and warm terracotta (zero violet) */
function WildflowerTufts({ position }: { position: [number, number, number] }) {
  const sprigs: Array<{
    pos: [number, number, number];
    rot: [number, number, number];
    h: number;
    bloomColor: string;
    centerColor: string;
  }> = [
    { pos: [0, 0, 0], rot: [0.08, 0, 0.06], h: 0.34, bloomColor: '#5D889C', centerColor: '#E3B261' },
    { pos: [0.13, 0, 0.08], rot: [-0.06, 0.4, -0.1], h: 0.28, bloomColor: '#F6F0DC', centerColor: '#E3B261' },
    { pos: [-0.12, 0, 0.09], rot: [0.12, 0.2, 0.14], h: 0.26, bloomColor: '#6C97AA', centerColor: '#FAF8F4' },
    { pos: [0.06, 0, -0.11], rot: [-0.1, 0.1, -0.08], h: 0.3, bloomColor: '#C87A62', centerColor: '#F6F0DC' },
    { pos: [-0.09, 0, -0.08], rot: [0.05, 0.5, 0.12], h: 0.24, bloomColor: '#F6F0DC', centerColor: '#98601A' },
  ];

  return (
    <group position={position}>
      {sprigs.map((sprig, idx) => (
        <group key={idx} position={sprig.pos} rotation={sprig.rot}>
          <mesh position={[0, sprig.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.013, 0.019, sprig.h, 5]} />
            <meshStandardMaterial color="#4D7354" roughness={0.9} />
          </mesh>
          <mesh position={[0, sprig.h + 0.04, 0]} scale={[1, 0.65, 1]} castShadow>
            <dodecahedronGeometry args={[0.058, 0]} />
            <meshStandardMaterial color={sprig.bloomColor} roughness={0.78} flatShading />
          </mesh>
          <mesh position={[0, sprig.h + 0.07, 0]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={sprig.centerColor} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Cozy wooden pier extending gently over the turquoise pond bank */
function WoodenPier({ position }: { position: [number, number, number] }) {
  const planks = [0, 0.12, 0.24, 0.36];
  return (
    <group position={position} rotation={[0, 0.42, 0]}>
      {/* Support rails */}
      <mesh position={[0.18, 0.02, -0.11]} castShadow>
        <boxGeometry args={[0.52, 0.035, 0.035]} />
        <meshStandardMaterial color="#5D412E" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0.18, 0.02, 0.11]} castShadow>
        <boxGeometry args={[0.52, 0.035, 0.035]} />
        <meshStandardMaterial color="#5D412E" roughness={0.92} flatShading />
      </mesh>
      {/* Planks */}
      {planks.map((offset, idx) => (
        <mesh key={idx} position={[offset, 0.045, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.095, 0.028, 0.3]} />
          <meshStandardMaterial color={idx % 2 === 0 ? '#7B583F' : '#8A6449'} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* Mooring posts */}
      <mesh position={[0.42, 0.09, -0.14]} castShadow>
        <cylinderGeometry args={[0.024, 0.028, 0.19, 6]} />
        <meshStandardMaterial color="#654834" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0.42, 0.09, 0.14]} castShadow>
        <cylinderGeometry args={[0.024, 0.028, 0.19, 6]} />
        <meshStandardMaterial color="#654834" roughness={0.92} flatShading />
      </mesh>
    </group>
  );
}

/** Low rustic split-rail meadow fence beside the bonsai grove */
function SplitRailFence({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.024, 0.22, 6]} />
          <meshStandardMaterial color="#73533C" roughness={0.92} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.66, 5]} />
        <meshStandardMaterial color="#876349" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.66, 5]} />
        <meshStandardMaterial color="#876349" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** Stepped stone terrace curving along the meadow path */
function SteppedStoneTerrace({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.42, 0.45, 0.06, 7]} />
        <meshStandardMaterial color="#C5BFB3" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0.12, 0.075, 0.1]} receiveShadow castShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.05, 7]} />
        <meshStandardMaterial color="#D5CFC3" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.24, 0.115, 0.18]} receiveShadow castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 7]} />
        <meshStandardMaterial color="#E0DBD0" roughness={0.88} flatShading />
      </mesh>
    </group>
  );
}

/** Warm glowing stone lantern (Toro) responsive to Day / Night mode */
function StoneLantern({
  position,
  reducedMotion,
  isNight,
}: {
  position: [number, number, number];
  reducedMotion: boolean;
  isNight: boolean;
}) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const mixRef = useRef(isNight ? 1 : 0);

  useFrame(({ clock }, delta) => {
    const target = isNight ? 1 : 0;
    mixRef.current = reducedMotion ? target : THREE.MathUtils.damp(mixRef.current, target, 4.5, delta);
    const pulse = reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 2.1) * (0.18 + mixRef.current * 0.16);
    if (glowRef.current) {
      glowRef.current.emissiveIntensity = 1.05 + mixRef.current * 1.65 + pulse;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.35 + mixRef.current * 3.1 + pulse * 0.6;
      lightRef.current.distance = 3.6 + mixRef.current * 2.4;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.1, 6]} />
        <meshStandardMaterial color="#ABA599" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.085, 0.3, 6]} />
        <meshStandardMaterial color="#B8B2A6" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.41, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.06, 6]} />
        <meshStandardMaterial color="#A8A296" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.17, 6]} />
        <meshStandardMaterial
          ref={glowRef}
          color="#F7D68A"
          emissive="#E3B261"
          emissiveIntensity={1.25}
          roughness={0.32}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.56, 0]} color="#E3B261" intensity={1.7} distance={4} decay={2} />
      <mesh position={[0, 0.67, 0]} castShadow>
        <coneGeometry args={[0.24, 0.16, 6]} />
        <meshStandardMaterial color="#9E988D" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.77, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ABA599" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** Pip — the plump meadow spirit with gentle breathing, natural blink, and cozy night sleep pose */
function PipSpirit({
  position,
  reducedMotion,
  isNight,
}: {
  position: [number, number, number];
  reducedMotion: boolean;
  isNight: boolean;
}) {
  const pipRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const nightMix = useRef(isNight ? 1 : 0);

  useFrame(({ clock }, delta) => {
    const target = isNight ? 1 : 0;
    nightMix.current = reducedMotion ? target : THREE.MathUtils.damp(nightMix.current, target, 4.2, delta);

    if (pipRef.current) {
      const t = clock.getElapsedTime();
      const speed = 2.4 - nightMix.current * 1.1;
      const amp = reducedMotion ? 0 : 0.025 - nightMix.current * 0.012;
      const nestleY = nightMix.current * -0.022;
      pipRef.current.position.y = position[1] + nestleY + Math.sin(t * speed) * amp;
      const breath = 1 + Math.sin(t * speed) * (amp * 0.9);
      const squash = 1 - nightMix.current * 0.06;
      pipRef.current.scale.set(
        (1 / Math.sqrt(breath)) * (1 + nightMix.current * 0.04),
        breath * squash,
        (1 / Math.sqrt(breath)) * (1 + nightMix.current * 0.04)
      );
    }

    if (leftEyeRef.current && rightEyeRef.current) {
      const t = clock.getElapsedTime();
      let blinkScale = 1;
      if (!reducedMotion && nightMix.current < 0.5) {
        const cycle = t % 4.3;
        if (cycle > 4.08 && cycle < 4.26) {
          const p = (cycle - 4.08) / 0.18;
          blinkScale = Math.max(0.16, 1 - Math.sin(p * Math.PI) * 0.84);
        }
      }
      const sleepEye = 1 - nightMix.current * 0.78;
      const eyeY = blinkScale * sleepEye;
      leftEyeRef.current.scale.set(1 + nightMix.current * 0.15, eyeY, 1);
      rightEyeRef.current.scale.set(1 + nightMix.current * 0.15, eyeY, 1);
    }
  });

  return (
    <group ref={pipRef} position={position} rotation={[0, 0.25, 0]}>
      <mesh position={[0, 0.22, 0]} scale={[1.05, 0.92, 0.98]} castShadow receiveShadow>
        <sphereGeometry args={[0.23, 18, 16]} />
        <meshStandardMaterial color="#FAF6EE" roughness={0.78} />
      </mesh>
      <mesh position={[-0.08, 0.03, 0.06]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#EFE7DA" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.03, 0.06]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#EFE7DA" roughness={0.85} />
      </mesh>
      <mesh ref={leftEyeRef} position={[-0.075, 0.25, 0.2]}>
        <sphereGeometry args={[0.024, 10, 10]} />
        <meshStandardMaterial color="#1E241E" roughness={0.2} />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.075, 0.25, 0.2]}>
        <sphereGeometry args={[0.024, 10, 10]} />
        <meshStandardMaterial color="#1E241E" roughness={0.2} />
      </mesh>
      <mesh position={[-0.135, 0.21, 0.165]} scale={[1.2, 0.7, 0.5]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#DDA183" roughness={0.8} />
      </mesh>
      <mesh position={[0.135, 0.21, 0.165]} scale={[1.2, 0.7, 0.5]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#DDA183" roughness={0.8} />
      </mesh>
      <group position={[0, 0.42, -0.01]} rotation={[0.18, 0.2, -0.15]}>
        <mesh scale={[1.3, 0.35, 0.95]} castShadow>
          <sphereGeometry args={[0.14, 12, 10]} />
          <meshStandardMaterial color="#4B7E57" roughness={0.72} flatShading />
        </mesh>
        <mesh position={[-0.02, 0.07, -0.04]} rotation={[-0.3, 0, 0.2]}>
          <cylinderGeometry args={[0.012, 0.018, 0.1, 5]} />
          <meshStandardMaterial color="#365E44" roughness={0.85} />
        </mesh>
        <mesh position={[0.07, 0.055, 0.03]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshPhysicalMaterial color="#D6EEF2" roughness={0.08} transmission={0.7} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** Animated glowing translucent waterfall spilling over the front cliff edge */
function Waterfall({ reducedMotion }: { reducedMotion: boolean }) {
  const dropRefs = useRef<Array<THREE.Mesh | null>>([]);
  const ribbonRef = useRef<THREE.MeshStandardMaterial>(null);

  const dropConfigs = useMemo(
    () => [
      { x: 0.72, z: 1.56, offset: 0.0, speed: 0.9, size: 0.055 },
      { x: 0.86, z: 1.58, offset: 0.33, speed: 1.05, size: 0.045 },
      { x: 0.62, z: 1.54, offset: 0.66, speed: 0.85, size: 0.042 },
      { x: 0.79, z: 1.6, offset: 0.5, speed: 0.98, size: 0.05 },
    ],
    []
  );

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    if (ribbonRef.current) {
      ribbonRef.current.emissiveIntensity = 0.22 + Math.sin(t * 3.0) * 0.08;
    }
    dropRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const cfg = dropConfigs[i];
      const phase = (t * cfg.speed + cfg.offset) % 1;
      mesh.position.y = -0.18 - phase * 1.45;
      const scale = Math.sin(phase * Math.PI);
      mesh.scale.setScalar(Math.max(0.15, scale));
    });
  });

  return (
    <group>
      <mesh position={[0.75, -0.78, 1.47]} rotation={[0.08, 0.44, 0]}>
        <boxGeometry args={[0.36, 1.52, 0.09]} />
        <meshStandardMaterial
          ref={ribbonRef}
          color="#7CC5CF"
          emissive="#4C9CA8"
          emissiveIntensity={0.25}
          transparent
          opacity={0.76}
          roughness={0.18}
        />
      </mesh>
      {dropConfigs.map((cfg, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            dropRefs.current[idx] = el;
          }}
          position={[cfg.x, -0.4 - idx * 0.32, cfg.z]}
        >
          <sphereGeometry args={[cfg.size, 8, 8]} />
          <meshStandardMaterial
            color="#B8E5EC"
            emissive="#7CC5CF"
            emissiveIntensity={0.35}
            transparent
            opacity={0.75}
            roughness={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Main Floating Meadow Island Assembly with Day <-> Night atmospheric lighting */
function FloatingIslandScene({ reducedMotion, isNight }: { reducedMotion: boolean; isNight: boolean }) {
  const islandRef = useRef<THREE.Group>(null);
  const isletLeftRef = useRef<THREE.Group>(null);
  const isletRightRef = useRef<THREE.Group>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const pondMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const mixRef = useRef(isNight ? 1 : 0);

  const daySky = useMemo(() => new THREE.Color('#FFF7E6'), []);
  const nightSky = useMemo(() => new THREE.Color('#475E68'), []);
  const dayGround = useMemo(() => new THREE.Color('#7F8E7B'), []);
  const nightGround = useMemo(() => new THREE.Color('#232D26'), []);
  const daySun = useMemo(() => new THREE.Color('#FFEDC8'), []);
  const nightMoon = useMemo(() => new THREE.Color('#A6C2CE'), []);
  const dayPond = useMemo(() => new THREE.Color('#376675'), []);
  const nightPond = useMemo(() => new THREE.Color('#1F414B'), []);

  useFrame(({ clock }, delta) => {
    const target = isNight ? 1 : 0;
    mixRef.current = reducedMotion ? target : THREE.MathUtils.damp(mixRef.current, target, 4.0, delta);
    const m = mixRef.current;

    if (hemiRef.current) {
      hemiRef.current.color.copy(daySky).lerp(nightSky, m);
      hemiRef.current.groundColor.copy(dayGround).lerp(nightGround, m);
      hemiRef.current.intensity = THREE.MathUtils.lerp(1.15, 0.44, m);
    }
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(daySun).lerp(nightMoon, m);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(1.55, 0.52, m);
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.lerp(0.45, 0.28, m);
    }
    if (pondMatRef.current) {
      pondMatRef.current.emissive.copy(dayPond).lerp(nightPond, m);
      pondMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(0.14, 0.24, m);
    }

    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    if (islandRef.current) {
      islandRef.current.position.y = Math.sin(t * 0.85) * 0.11;
    }
    if (isletLeftRef.current) {
      isletLeftRef.current.position.y = 0.25 + Math.sin(t * 1.05 + 1.4) * 0.13;
    }
    if (isletRightRef.current) {
      isletRightRef.current.position.y = -0.35 + Math.sin(t * 1.15 + 3.1) * 0.12;
    }
  });

  const steppingStones: Array<[number, number, number, number]> = [
    [-0.45, 0.09, 0.42, 0.14],
    [-0.18, 0.09, 0.62, 0.12],
    [0.14, 0.09, 0.72, 0.13],
    [0.44, 0.09, 0.56, 0.11],
  ];

  return (
    <>
      <hemisphereLight ref={hemiRef} args={['#FFF7E6', '#7F8E7B', 1.15]} />
      <directionalLight
        ref={keyLightRef}
        position={[4.5, 6.5, 4.2]}
        intensity={1.55}
        color="#FFEDC8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight ref={rimLightRef} position={[-4, 2.5, -3.5]} intensity={0.45} color="#CBE0E6" />

      <group ref={islandRef} position={[0, 0, 0]} rotation={[0, -0.32, 0]}>
        {/* Mossy emerald-sage top plateau */}
        <mesh position={[0, -0.02, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.68, 1.62, 0.22, 9]} />
          <meshStandardMaterial color="#5E8B63" roughness={0.88} flatShading />
        </mesh>
        {/* Sunlit inner meadow patch */}
        <mesh position={[-0.14, 0.095, -0.06]} receiveShadow>
          <cylinderGeometry args={[1.22, 1.26, 0.04, 9]} />
          <meshStandardMaterial color="#75A374" roughness={0.9} flatShading />
        </mesh>

        {/* Terracotta soil rim */}
        <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.58, 1.38, 0.22, 9]} />
          <meshStandardMaterial color="#9A6E50" roughness={0.92} flatShading />
        </mesh>

        {/* Tapered weathered limestone rock underside */}
        <mesh position={[0, -0.92, 0]} castShadow receiveShadow>
          <coneGeometry args={[1.38, 1.24, 8]} />
          <meshStandardMaterial color="#9E988D" roughness={0.94} flatShading />
        </mesh>
        <mesh position={[-0.58, -0.68, 0.35]} rotation={[0.15, 0.5, 0.12]} castShadow>
          <coneGeometry args={[0.68, 0.92, 6]} />
          <meshStandardMaterial color="#8E887D" roughness={0.94} flatShading />
        </mesh>
        <mesh position={[0.62, -0.62, -0.25]} rotation={[-0.1, 0.2, -0.15]} castShadow>
          <coneGeometry args={[0.62, 0.85, 6]} />
          <meshStandardMaterial color="#ADA79B" roughness={0.94} flatShading />
        </mesh>

        {/* Cozy stepped stone terrace */}
        <SteppedStoneTerrace position={[-0.52, 0.09, -0.22]} />

        {/* Tranquil turquoise pond */}
        <group position={[0.66, 0.095, 0.62]}>
          <mesh position={[0, -0.02, 0]} rotation={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.56, 0.52, 0.05, 12]} />
            <meshStandardMaterial color="#3E7E8A" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.012, 0]} rotation={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.54, 0.54, 0.02, 12]} />
            <meshStandardMaterial
              ref={pondMatRef}
              color="#63B2BC"
              emissive="#376675"
              emissiveIntensity={0.14}
              transparent
              opacity={0.86}
              roughness={0.14}
            />
          </mesh>
          <mesh position={[-0.46, 0.04, -0.22]} scale={[1.2, 0.65, 0.9]}>
            <dodecahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial color="#C8C2B6" roughness={0.88} flatShading />
          </mesh>
          <mesh position={[-0.36, 0.03, 0.34]} scale={[1.1, 0.55, 0.95]}>
            <dodecahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color="#B9B3A7" roughness={0.88} flatShading />
          </mesh>
          <mesh position={[0.38, 0.035, -0.34]} scale={[1.15, 0.6, 0.9]}>
            <dodecahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#C4BEB2" roughness={0.88} flatShading />
          </mesh>
        </group>

        {/* Wooden pond pier & rustic split-rail fence */}
        <WoodenPier position={[0.14, 0.1, 0.36]} />
        <SplitRailFence position={[-0.12, 0.1, -0.96]} rotationY={-0.15} />

        {/* Glowing translucent waterfall spilling over the front cliff edge */}
        <Waterfall reducedMotion={reducedMotion} />

        {/* Miniature bonsai tree */}
        <BonsaiTree position={[-0.78, 0.14, -0.52]} />

        {/* Rounded cypress shrubs */}
        <mesh position={[0.55, 0.32, -0.78]} scale={[0.9, 1.35, 0.9]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial color="#447250" roughness={0.86} flatShading />
        </mesh>
        <mesh position={[0.88, 0.24, -0.55]} scale={[0.95, 1.1, 0.95]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#578560" roughness={0.86} flatShading />
        </mesh>
        <mesh position={[-1.15, 0.22, -0.05]} scale={[1, 0.95, 1]} castShadow>
          <dodecahedronGeometry args={[0.19, 0]} />
          <meshStandardMaterial color="#4A7754" roughness={0.86} flatShading />
        </mesh>

        {/* Wildflower tufts */}
        <WildflowerTufts position={[-0.95, 0.1, 0.56]} />
        <WildflowerTufts position={[0.96, 0.1, -0.18]} />

        {/* Stepping stones */}
        {steppingStones.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y + 0.02, z]} receiveShadow>
            <cylinderGeometry args={[r, r * 1.06, 0.04, 7]} />
            <meshStandardMaterial color="#D6D0C4" roughness={0.9} flatShading />
          </mesh>
        ))}

        {/* Warm glowing stone lantern */}
        <StoneLantern position={[1.05, 0.1, 0.02]} reducedMotion={reducedMotion} isNight={isNight} />

        {/* Pip the plump meadow spirit */}
        <PipSpirit position={[-0.12, 0.11, 0.06]} reducedMotion={reducedMotion} isNight={isNight} />
      </group>

      {/* Satellite Islet 1 (left-back) */}
      <group ref={isletLeftRef} position={[-2.35, 0.25, -0.65]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.38, 0.1, 7]} />
          <meshStandardMaterial color="#67966B" roughness={0.88} flatShading />
        </mesh>
        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.37, 0.31, 0.09, 7]} />
          <meshStandardMaterial color="#9A6E50" roughness={0.92} flatShading />
        </mesh>
        <mesh position={[0, -0.34, 0]}>
          <coneGeometry args={[0.31, 0.42, 6]} />
          <meshStandardMaterial color="#9B958A" roughness={0.94} flatShading />
        </mesh>
        <mesh position={[0.04, 0.18, 0]} scale={[0.85, 1.25, 0.85]} castShadow>
          <dodecahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#477653" roughness={0.86} flatShading />
        </mesh>
      </group>

      {/* Satellite Islet 2 (right-front lower) */}
      <group ref={isletRightRef} position={[2.25, -0.35, 0.55]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.29, 0.09, 7]} />
          <meshStandardMaterial color="#6A986E" roughness={0.88} flatShading />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.28, 0.22, 0.08, 7]} />
          <meshStandardMaterial color="#9A6E50" roughness={0.92} flatShading />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <coneGeometry args={[0.22, 0.34, 6]} />
          <meshStandardMaterial color="#A39D92" roughness={0.94} flatShading />
        </mesh>
        <mesh position={[-0.04, 0.09, 0.02]} scale={[1.1, 0.6, 0.9]}>
          <dodecahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#C8C2B6" roughness={0.9} flatShading />
        </mesh>
      </group>

      {/* Daytime pollen sparkles / Nighttime glowing lantern fireflies */}
      <Sparkles
        count={isNight ? 46 : 34}
        scale={[5.2, 3.2, 5.2]}
        size={isNight ? 3.8 : 2.6}
        speed={reducedMotion ? 0 : isNight ? 0.38 : 0.28}
        opacity={isNight ? 0.94 : 0.72}
        color={isNight ? '#F5C976' : '#E3B261'}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.25}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.55}
      />
    </>
  );
}

export function MeadowIsland3D({ isNight = false }: MeadowIsland3DProps) {
  const [webglReady, setWebglReady] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setWebglReady(detectWebGLSupport());
  }, []);

  if (!webglReady) {
    return <StaticMeadowFallback isNight={isNight} />;
  }

  return (
    <CanvasErrorBoundary fallback={<StaticMeadowFallback isNight={isNight} />}>
      <div
        className="hero-stage-canvas"
        aria-label={
          isNight
            ? 'Interactive 3D Dewy sanctuary island in Goodnight Lantern twilight mode'
            : 'Interactive 3D Dewy floating meadow island in Morning Meadow daylight mode'
        }
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0.4, 2.35, 5.1], fov: 37 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <FloatingIslandScene reducedMotion={reducedMotion} isNight={isNight} />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
