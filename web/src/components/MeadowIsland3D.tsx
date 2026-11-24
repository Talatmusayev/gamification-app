import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

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
function StaticMeadowFallback() {
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
      aria-label="Floating meadow sanctuary island with bonsai, lavender sprigs, stone lantern, turquoise pond, and Pip the meadow spirit"
    >
      <svg viewBox="0 0 420 360" width="380" height="325" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="fbGlow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#E3B261" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FAF8F4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="210" cy="175" r="155" fill="url(#fbGlow)" />
        {/* Underside limestone rock */}
        <path d="M96 196 L324 196 L262 292 L210 318 L154 282 Z" fill="#9E988D" />
        <path d="M210 196 L324 196 L262 292 L210 318 Z" fill="#8A8479" />
        {/* Terracotta rim */}
        <ellipse cx="210" cy="196" rx="126" ry="44" fill="#9A6E50" />
        {/* Mossy plateau */}
        <ellipse cx="210" cy="184" rx="128" ry="44" fill="#5E8B63" />
        <ellipse cx="204" cy="180" rx="102" ry="32" fill="#75A374" />
        {/* Turquoise pond + waterfall */}
        <ellipse cx="256" cy="188" rx="38" ry="16" fill="#5CA6B0" />
        <path d="M250 198 C252 240 250 282 248 312 L268 312 C270 282 272 240 272 198 Z" fill="#7CC5CF" opacity="0.72" />
        {/* Bonsai */}
        <path d="M142 174 C140 150 152 138 158 122" stroke="#6B4B37" strokeWidth="9" strokeLinecap="round" />
        <ellipse cx="158" cy="112" rx="34" ry="18" fill="#365E44" />
        <ellipse cx="136" cy="126" rx="22" ry="13" fill="#4F7F5A" />
        {/* Stone lantern */}
        <rect x="282" y="148" width="10" height="22" rx="2" fill="#B6B0A4" />
        <rect x="279" y="138" width="16" height="12" rx="2" fill="#E3B261" />
        <path d="M272 140 L287 128 L302 140 Z" fill="#9E988D" />
        {/* Pip the meadow spirit */}
        <ellipse cx="204" cy="166" rx="18" ry="16" fill="#FAF6EE" />
        <circle cx="198" cy="164" r="2.2" fill="#1E241E" />
        <circle cx="210" cy="164" r="2.2" fill="#1E241E" />
        <path d="M196 150 C204 140 218 142 222 152 C212 155 202 154 196 150 Z" fill="#4E8259" />
      </svg>
    </div>
  );
}

/** Gently curved miniature bonsai tree */
function BonsaiTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Lower trunk */}
      <mesh position={[0, 0.24, 0]} rotation={[0.08, 0, -0.14]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.125, 0.52, 7]} />
        <meshStandardMaterial color="#6B4B37" roughness={0.9} flatShading />
      </mesh>
      {/* Upper curved branch */}
      <mesh position={[0.1, 0.56, 0.03]} rotation={[0.04, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 0.42, 6]} />
        <meshStandardMaterial color="#6B4B37" roughness={0.9} flatShading />
      </mesh>
      {/* Side branch */}
      <mesh position={[-0.14, 0.46, 0.06]} rotation={[0.12, 0, 0.65]} castShadow>
        <cylinderGeometry args={[0.032, 0.052, 0.34, 6]} />
        <meshStandardMaterial color="#6B4B37" roughness={0.9} flatShading />
      </mesh>
      {/* Sculptural emerald foliage pads */}
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

/** Cluster of stylized botanical lavender sprigs */
function LavenderCluster({ position }: { position: [number, number, number] }) {
  const sprigs: Array<{ pos: [number, number, number]; rot: [number, number, number]; h: number }> = [
    { pos: [0, 0, 0], rot: [0.08, 0, 0.06], h: 0.42 },
    { pos: [0.12, 0, 0.08], rot: [-0.06, 0.4, -0.1], h: 0.36 },
    { pos: [-0.11, 0, 0.1], rot: [0.12, 0.2, 0.14], h: 0.34 },
    { pos: [0.06, 0, -0.11], rot: [-0.1, 0.1, -0.08], h: 0.38 },
    { pos: [-0.09, 0, -0.08], rot: [0.05, 0.5, 0.12], h: 0.32 },
  ];

  return (
    <group position={position}>
      {sprigs.map((sprig, idx) => (
        <group key={idx} position={sprig.pos} rotation={sprig.rot}>
          <mesh position={[0, sprig.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.014, 0.02, sprig.h, 5]} />
            <meshStandardMaterial color="#4D7354" roughness={0.9} />
          </mesh>
          <mesh position={[0, sprig.h + 0.06, 0]} scale={[0.7, 1.6, 0.7]} castShadow>
            <dodecahedronGeometry args={[0.065, 0]} />
            <meshStandardMaterial color="#7C85A0" roughness={0.78} flatShading />
          </mesh>
          <mesh position={[0, sprig.h + 0.14, 0]} scale={[0.55, 1.2, 0.55]}>
            <dodecahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color="#959CB5" roughness={0.78} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Warm glowing stone lantern (Toro) */
function StoneLantern({ position, reducedMotion }: { position: [number, number, number]; reducedMotion: boolean }) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !glowRef.current) return;
    const pulse = 1.15 + Math.sin(clock.getElapsedTime() * 2.1) * 0.2;
    glowRef.current.emissiveIntensity = pulse;
  });

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.1, 6]} />
        <meshStandardMaterial color="#ABA599" roughness={0.92} flatShading />
      </mesh>
      {/* Post */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.085, 0.3, 6]} />
        <meshStandardMaterial color="#B8B2A6" roughness={0.9} flatShading />
      </mesh>
      {/* Mid platform */}
      <mesh position={[0, 0.41, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.06, 6]} />
        <meshStandardMaterial color="#A8A296" roughness={0.92} flatShading />
      </mesh>
      {/* Warm glowing firebox */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.17, 6]} />
        <meshStandardMaterial
          ref={glowRef}
          color="#F5CE7E"
          emissive="#E3B261"
          emissiveIntensity={1.25}
          roughness={0.35}
        />
      </mesh>
      <pointLight position={[0, 0.54, 0]} color="#E3B261" intensity={1.7} distance={3.8} decay={2} />
      {/* Pagoda roof */}
      <mesh position={[0, 0.67, 0]} castShadow>
        <coneGeometry args={[0.24, 0.16, 6]} />
        <meshStandardMaterial color="#9E988D" roughness={0.9} flatShading />
      </mesh>
      {/* Finial */}
      <mesh position={[0, 0.77, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ABA599" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** Pip — the plump meadow spirit with a green leaf cap */
function PipSpirit({ position, reducedMotion }: { position: [number, number, number]; reducedMotion: boolean }) {
  const pipRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !pipRef.current) return;
    const t = clock.getElapsedTime();
    pipRef.current.position.y = position[1] + Math.sin(t * 2.4) * 0.025;
    const breath = 1 + Math.sin(t * 2.4) * 0.025;
    pipRef.current.scale.set(1 / Math.sqrt(breath), breath, 1 / Math.sqrt(breath));
  });

  return (
    <group ref={pipRef} position={position} rotation={[0, 0.25, 0]}>
      {/* Plump cream body */}
      <mesh position={[0, 0.22, 0]} scale={[1.05, 0.92, 0.98]} castShadow receiveShadow>
        <sphereGeometry args={[0.23, 18, 16]} />
        <meshStandardMaterial color="#FAF6EE" roughness={0.78} />
      </mesh>
      {/* Tiny stubby feet */}
      <mesh position={[-0.08, 0.03, 0.06]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#EFE7DA" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.03, 0.06]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#EFE7DA" roughness={0.85} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.075, 0.25, 0.2]}>
        <sphereGeometry args={[0.024, 10, 10]} />
        <meshStandardMaterial color="#1E241E" roughness={0.2} />
      </mesh>
      <mesh position={[0.075, 0.25, 0.2]}>
        <sphereGeometry args={[0.024, 10, 10]} />
        <meshStandardMaterial color="#1E241E" roughness={0.2} />
      </mesh>
      {/* Warm rosy cheeks */}
      <mesh position={[-0.135, 0.21, 0.165]} scale={[1.2, 0.7, 0.5]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#DDA183" roughness={0.8} />
      </mesh>
      <mesh position={[0.135, 0.21, 0.165]} scale={[1.2, 0.7, 0.5]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#DDA183" roughness={0.8} />
      </mesh>
      {/* Green leaf cap */}
      <group position={[0, 0.42, -0.01]} rotation={[0.18, 0.2, -0.15]}>
        <mesh scale={[1.3, 0.35, 0.95]} castShadow>
          <sphereGeometry args={[0.14, 12, 10]} />
          <meshStandardMaterial color="#4B7E57" roughness={0.72} flatShading />
        </mesh>
        {/* Stem */}
        <mesh position={[-0.02, 0.07, -0.04]} rotation={[-0.3, 0, 0.2]}>
          <cylinderGeometry args={[0.012, 0.018, 0.1, 5]} />
          <meshStandardMaterial color="#365E44" roughness={0.85} />
        </mesh>
        {/* Tiny shimmering dewdrop on the leaf */}
        <mesh position={[0.07, 0.055, 0.03]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshPhysicalMaterial
            color="#D6EEF2"
            roughness={0.08}
            transmission={0.7}
            transparent
            opacity={0.9}
          />
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
      {/* Translucent water ribbon */}
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
      {/* Falling water droplets / mist beads */}
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

/** Main Floating Meadow Island Assembly */
function FloatingIslandScene({ reducedMotion }: { reducedMotion: boolean }) {
  const islandRef = useRef<THREE.Group>(null);
  const isletLeftRef = useRef<THREE.Group>(null);
  const isletRightRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
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
      {/* Warm sunlight + soft botanical ambient light */}
      <hemisphereLight args={['#FFF7E6', '#7F8E7B', 1.15]} />
      <directionalLight
        position={[4.5, 6.5, 4.2]}
        intensity={1.55}
        color="#FFEDC8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2.5, -3.5]} intensity={0.45} color="#CBE0E6" />

      {/* Main Levitating Island */}
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
        {/* Secondary underside rock facets for organic silhouette */}
        <mesh position={[-0.58, -0.68, 0.35]} rotation={[0.15, 0.5, 0.12]} castShadow>
          <coneGeometry args={[0.68, 0.92, 6]} />
          <meshStandardMaterial color="#8E887D" roughness={0.94} flatShading />
        </mesh>
        <mesh position={[0.62, -0.62, -0.25]} rotation={[-0.1, 0.2, -0.15]} castShadow>
          <coneGeometry args={[0.62, 0.85, 6]} />
          <meshStandardMaterial color="#ADA79B" roughness={0.94} flatShading />
        </mesh>

        {/* Tranquil turquoise pond */}
        <group position={[0.66, 0.095, 0.62]}>
          {/* Deeper pond basin */}
          <mesh position={[0, -0.02, 0]} rotation={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.56, 0.52, 0.05, 12]} />
            <meshStandardMaterial color="#3E7E8A" roughness={0.4} />
          </mesh>
          {/* Translucent turquoise water surface */}
          <mesh position={[0, 0.012, 0]} rotation={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.54, 0.54, 0.02, 12]} />
            <meshStandardMaterial
              color="#63B2BC"
              emissive="#376675"
              emissiveIntensity={0.14}
              transparent
              opacity={0.86}
              roughness={0.14}
            />
          </mesh>
          {/* Smooth river stones around the bank */}
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

        {/* Glowing translucent waterfall spilling over the front cliff edge */}
        <Waterfall reducedMotion={reducedMotion} />

        {/* Miniature bonsai tree */}
        <BonsaiTree position={[-0.74, 0.1, -0.52]} />

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

        {/* Lavender sprigs */}
        <LavenderCluster position={[-0.95, 0.1, 0.56]} />

        {/* Stepping stones */}
        {steppingStones.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y + 0.02, z]} receiveShadow>
            <cylinderGeometry args={[r, r * 1.06, 0.04, 7]} />
            <meshStandardMaterial color="#D6D0C4" roughness={0.9} flatShading />
          </mesh>
        ))}

        {/* Warm glowing stone lantern */}
        <StoneLantern position={[1.05, 0.1, 0.02]} reducedMotion={reducedMotion} />

        {/* Pip the plump meadow spirit */}
        <PipSpirit position={[-0.12, 0.11, 0.12]} reducedMotion={reducedMotion} />
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

      {/* Drifting golden pollen */}
      <Sparkles
        count={34}
        scale={[5.2, 3.2, 5.2]}
        size={2.6}
        speed={reducedMotion ? 0 : 0.28}
        opacity={0.72}
        color="#E3B261"
      />

      {/* Smooth interactive orbit controls */}
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

export function MeadowIsland3D() {
  const [webglReady, setWebglReady] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setWebglReady(detectWebGLSupport());
  }, []);

  if (!webglReady) {
    return <StaticMeadowFallback />;
  }

  return (
    <CanvasErrorBoundary fallback={<StaticMeadowFallback />}>
      <div className="hero-stage-canvas" aria-label="Interactive 3D Dew & Bloom floating meadow island">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0.4, 2.35, 5.1], fov: 37 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <FloatingIslandScene reducedMotion={reducedMotion} />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
