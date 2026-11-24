import type React from 'react';
import {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export const DECOR_ASSET_KEYS: ReadonlySet<string> = new Set([
  'stepping_stone',
  'pebble_path',
  'wooden_bench',
  'clay_birdbath',
  'reed_lantern',
  'stone_lantern',
  'koi_pond',
  'bamboo_fountain',
  'cedar_gazebo',
  'glass_greenhouse',
]);

export function renderDecorSprite(assetKey: string, uid: string): React.ReactNode | null {
  switch (assetKey) {
    case 'stepping_stone':
      return renderSteppingStone(uid);
    case 'pebble_path':
      return renderPebblePath(uid);
    case 'wooden_bench':
      return renderWoodenBench(uid);
    case 'clay_birdbath':
      return renderClayBirdbath(uid);
    case 'reed_lantern':
      return renderReedLantern(uid);
    case 'stone_lantern':
      return renderStoneLantern(uid);
    case 'koi_pond':
      return renderKoiPond(uid);
    case 'bamboo_fountain':
      return renderBambooFountain(uid);
    case 'cedar_gazebo':
      return renderCedarGazebo(uid);
    case 'glass_greenhouse':
      return renderGlassGreenhouse(uid);
    default:
      return null;
  }
}

function renderSteppingStone(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_slabTop1`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E6E0D3" />
          <Stop offset="55%" stopColor="#CFC8B8" />
          <Stop offset="100%" stopColor="#B8B09E" />
        </LinearGradient>
        <LinearGradient id={`${uid}_slabTop2`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#DFD8CA" />
          <Stop offset="100%" stopColor="#B2AA98" />
        </LinearGradient>
        <LinearGradient id={`${uid}_slabLeft`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#B0A897" />
          <Stop offset="100%" stopColor="#8F8878" />
        </LinearGradient>
        <LinearGradient id={`${uid}_slabRight`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#8B8475" />
          <Stop offset="100%" stopColor="#6D675B" />
        </LinearGradient>
        <RadialGradient id={`${uid}_moss`} cx="35%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#7EA368" />
          <Stop offset="100%" stopColor="#466944" />
        </RadialGradient>
      </Defs>

      {/* Soft ground shadows */}
      <Ellipse cx="24" cy="48.5" rx="15" ry="6.2" fill="#233024" fillOpacity={0.22} />
      <Ellipse cx="44" cy="41.5" rx="10.5" ry="4.8" fill="#233024" fillOpacity={0.2} />
      <Ellipse cx="28" cy="36.5" rx="7.5" ry="3.4" fill="#233024" fillOpacity={0.18} />

      {/* Upper-left small flagstone */}
      <Path
        d="M21 34.2 L27.5 31.2 L35.2 33.4 L33.5 37 L25.5 37.8 Z"
        fill={`url(#${uid}_slabLeft)`}
      />
      <Path
        d="M25.5 37.8 L33.5 37 L35.2 35.1 L35.2 33.4 L25.5 36.2 Z"
        fill={`url(#${uid}_slabRight)`}
      />
      <Path
        d="M21 33.2 L27.5 30.2 L35.2 32.4 L33.2 35.6 L25.4 36.2 Z"
        fill={`url(#${uid}_slabTop2)`}
        stroke="#F2EDE1"
        strokeWidth="0.6"
        strokeOpacity={0.7}
      />

      {/* Mid-right medium flagstone */}
      <Path
        d="M34.2 39.2 L43.5 35.5 L53.4 38.6 L52.6 42.2 L42.4 44.8 L34.4 42.4 Z"
        fill={`url(#${uid}_slabLeft)`}
      />
      <Path
        d="M42.4 44.8 L52.6 42.2 L53.4 39.8 L53.4 38.6 L42.6 42.6 Z"
        fill={`url(#${uid}_slabRight)`}
      />
      <Path
        d="M34.2 38.4 L43.4 34.7 L53.4 37.8 L51.8 40.8 L42.4 42.6 L34.6 40.4 Z"
        fill={`url(#${uid}_slabTop2)`}
        stroke="#F3EEE3"
        strokeWidth="0.65"
        strokeOpacity={0.65}
      />
      <Path d="M40.5 37.4 L44.8 39.2 L47.2 38.4" stroke="#8E8777" strokeWidth="0.7" strokeOpacity={0.55} />

      {/* Moss tufts in crevices */}
      <Ellipse cx="34.6" cy="40.5" rx="3.2" ry="1.8" fill={`url(#${uid}_moss)`} />
      <Circle cx="36.8" cy="39.8" r="1.4" fill="#6F955C" />
      <Ellipse cx="31.5" cy="36.6" rx="2.4" ry="1.3" fill={`url(#${uid}_moss)`} />

      {/* Foreground hero sculpted flagstone */}
      <Path
        d="M10.5 44.2 L21.8 39.2 L36.6 42.4 L37.6 46.8 L25.6 52.6 L11.4 48.2 Z"
        fill={`url(#${uid}_slabLeft)`}
      />
      <Path
        d="M25.6 52.6 L37.6 46.8 L37.6 44.2 L36.6 42.4 L25.4 49.4 Z"
        fill={`url(#${uid}_slabRight)`}
      />
      <Path
        d="M10.5 43.2 L21.8 38.2 L36.6 41.6 L35.8 44.8 L25.4 49.4 L11.6 45.6 Z"
        fill={`url(#${uid}_slabTop1)`}
        stroke="#F6F1E6"
        strokeWidth="0.75"
        strokeOpacity={0.75}
      />
      {/* Weathering crevices & mineral flecks */}
      <Path
        d="M18.2 42.4 L23.5 43.6 L26.2 46.5"
        stroke="#8F8879"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeOpacity={0.5}
      />
      <Path d="M23.5 43.6 L27.8 42.2" stroke="#8F8879" strokeWidth="0.65" strokeLinecap="round" strokeOpacity={0.4} />
      <Ellipse cx="15.5" cy="44.2" rx="2.2" ry="0.9" fill="#F7F3EA" fillOpacity={0.45} />
      <Ellipse cx="28.6" cy="45.8" rx="1.6" ry="0.7" fill="#A59E8E" fillOpacity={0.5} />

      {/* Moss creeping onto stone corner */}
      <Ellipse cx="13.2" cy="48.2" rx="2.8" ry="1.5" fill={`url(#${uid}_moss)`} />
      <Circle cx="15.4" cy="48.8" r="1.2" fill="#89AE72" />
      <Ellipse cx="35.6" cy="47.2" rx="2.5" ry="1.3" fill={`url(#${uid}_moss)`} />
    </G>
  );
}

function renderPebblePath(uid: string): React.ReactNode {
  const pebbles: Array<{
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    grad: string;
    rot?: number;
  }> = [
    { cx: 36, cy: 33.2, rx: 4.2, ry: 2.2, grad: 'cream', rot: -10 },
    { cx: 43.5, cy: 35.8, rx: 3.6, ry: 2.0, grad: 'slate', rot: 8 },
    { cx: 28.5, cy: 36.2, rx: 4.5, ry: 2.4, grad: 'terra', rot: -14 },
    { cx: 36.5, cy: 38.6, rx: 5.2, ry: 2.7, grad: 'slate', rot: 6 },
    { cx: 20.5, cy: 40.5, rx: 4.8, ry: 2.5, grad: 'cream', rot: -8 },
    { cx: 45.2, cy: 41.2, rx: 4.9, ry: 2.6, grad: 'cream', rot: 12 },
    { cx: 30.8, cy: 43.0, rx: 5.6, ry: 3.0, grad: 'sage', rot: -6 },
    { cx: 39.5, cy: 45.4, rx: 5.2, ry: 2.8, grad: 'terra', rot: 10 },
    { cx: 19.2, cy: 46.2, rx: 5.4, ry: 2.9, grad: 'slate', rot: -12 },
    { cx: 29.2, cy: 49.0, rx: 6.2, ry: 3.2, grad: 'cream', rot: 4 },
    { cx: 44.5, cy: 47.6, rx: 4.1, ry: 2.2, grad: 'sage', rot: -8 },
  ];

  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_bed`} cx="45%" cy="45%" r="55%">
          <Stop offset="0%" stopColor="#9E937E" stopOpacity={0.5} />
          <Stop offset="70%" stopColor="#7C7765" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#5C6B52" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${uid}_cream`} cx="32%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#F5EFE3" />
          <Stop offset="55%" stopColor="#D9CEBC" />
          <Stop offset="100%" stopColor="#9E9380" />
        </RadialGradient>
        <RadialGradient id={`${uid}_slate`} cx="32%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#B8C0C2" />
          <Stop offset="55%" stopColor="#889296" />
          <Stop offset="100%" stopColor="#5C6569" />
        </RadialGradient>
        <RadialGradient id={`${uid}_terra`} cx="32%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#E6B292" />
          <Stop offset="55%" stopColor="#C48260" />
          <Stop offset="100%" stopColor="#8B5439" />
        </RadialGradient>
        <RadialGradient id={`${uid}_sage`} cx="32%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#C9D1BE" />
          <Stop offset="55%" stopColor="#98A48E" />
          <Stop offset="100%" stopColor="#697561" />
        </RadialGradient>
      </Defs>

      {/* Soft sandy loam winding path bed */}
      <Path
        d="M12 48 C15 41, 24 34, 34 31 C42 29, 51 33, 52 40 C53 47, 45 53, 33 54 C21 55, 10 53, 12 48 Z"
        fill={`url(#${uid}_bed)`}
      />
      {/* Tiny moss accents peeking between pebbles */}
      <Ellipse cx="24.5" cy="43.8" rx="3.2" ry="1.5" fill="#5D8456" fillOpacity={0.7} />
      <Ellipse cx="41.5" cy="38.5" rx="2.6" ry="1.2" fill="#6B9362" fillOpacity={0.65} />
      <Ellipse cx="35.5" cy="48.5" rx="3.0" ry="1.3" fill="#547B4E" fillOpacity={0.65} />

      {/* Individual smooth 3D river pebbles */}
      {pebbles.map((p, idx) => (
        <G key={idx} transform={p.rot ? `rotate(${p.rot} ${p.cx} ${p.cy})` : undefined}>
          <Ellipse
            cx={p.cx + 0.6}
            cy={p.cy + 1.1}
            rx={p.rx * 0.96}
            ry={p.ry * 0.92}
            fill="#273126"
            fillOpacity={0.24}
          />
          <Ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={`url(#${uid}_${p.grad})`} />
          <Ellipse
            cx={p.cx - p.rx * 0.3}
            cy={p.cy - p.ry * 0.32}
            rx={p.rx * 0.36}
            ry={p.ry * 0.28}
            fill="#FFFDF8"
            fillOpacity={0.55}
          />
        </G>
      ))}
    </G>
  );
}

function renderWoodenBench(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_woodTop`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#DEB07E" />
          <Stop offset="60%" stopColor="#C48E5B" />
          <Stop offset="100%" stopColor="#AB7646" />
        </LinearGradient>
        <LinearGradient id={`${uid}_woodLeft`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#B88251" />
          <Stop offset="100%" stopColor="#94643A" />
        </LinearGradient>
        <LinearGradient id={`${uid}_woodRight`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#855834" />
          <Stop offset="100%" stopColor="#633F23" />
        </LinearGradient>
        <LinearGradient id={`${uid}_backSlat`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#D6A472" />
          <Stop offset="100%" stopColor="#B27D4C" />
        </LinearGradient>
      </Defs>

      {/* Isometric ground shadow underneath bench */}
      <Polygon points="12,46 37,33.5 53,41.5 28,54" fill="#222E23" fillOpacity={0.22} />

      {/* Back legs (behind seat) */}
      <Polygon points="15.5,35 18,36.2 18,46 15.5,44.8" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="18,36.2 20,35.2 20,45 18,46" fill={`url(#${uid}_woodRight)`} />

      <Polygon points="37.5,24 40,25.2 40,35 37.5,33.8" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="40,25.2 42,24.2 42,34 40,35" fill={`url(#${uid}_woodRight)`} />

      {/* Under-seat cross stretcher */}
      <Polygon points="19,43 40,32.5 40,34.4 19,44.9" fill={`url(#${uid}_woodRight)`} />

      {/* Backrest uprights */}
      <Polygon points="15.5,23.5 18,24.7 18,36.2 15.5,35" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="18,24.7 19.8,23.8 19.8,35.3 18,36.2" fill={`url(#${uid}_woodRight)`} />

      <Polygon points="37.5,12.5 40,13.7 40,25.2 37.5,24" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="40,13.7 41.8,12.8 41.8,24.3 40,25.2" fill={`url(#${uid}_woodRight)`} />

      {/* Backrest lower slat (2:1 iso) */}
      <Polygon points="16.5,29.5 39.5,18 41.2,18.8 18.2,30.3" fill={`url(#${uid}_woodTop)`} />
      <Polygon points="18.2,30.3 41.2,18.8 41.2,22.4 18.2,33.9" fill={`url(#${uid}_backSlat)`} />
      <Line x1="20" y1="31.3" x2="39.5" y2="21.5" stroke="#8F6039" strokeWidth="0.55" strokeOpacity={0.45} />

      {/* Backrest upper slat (2:1 iso) */}
      <Polygon points="16.5,24.2 39.5,12.7 41.2,13.5 18.2,25" fill={`url(#${uid}_woodTop)`} />
      <Polygon points="18.2,25 41.2,13.5 41.2,17.2 18.2,28.7" fill={`url(#${uid}_backSlat)`} />
      <Line x1="20" y1="26.1" x2="39.5" y2="16.3" stroke="#8F6039" strokeWidth="0.55" strokeOpacity={0.45} />

      {/* Front legs */}
      <Polygon points="24.5,41 27,42.2 27,52.8 24.5,51.6" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="27,42.2 29,41.2 29,51.8 27,52.8" fill={`url(#${uid}_woodRight)`} />

      <Polygon points="46.5,30 49,31.2 49,41.8 46.5,40.6" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="49,31.2 51,30.2 51,40.8 49,41.8" fill={`url(#${uid}_woodRight)`} />

      {/* Side apron rails */}
      <Polygon points="17.5,41.5 24.8,45.2 24.8,47 17.5,43.3" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="29,46 46.8,37.1 46.8,38.9 29,47.8" fill={`url(#${uid}_woodRight)`} />

      {/* Seat slats (3 isometric cedar planks with gaps) */}
      {/* Back seat plank */}
      <Polygon points="15.8,36.2 39.8,24.2 43.2,25.9 19.2,37.9" fill={`url(#${uid}_woodTop)`} />
      <Polygon points="19.2,37.9 43.2,25.9 43.2,27.3 19.2,39.3" fill={`url(#${uid}_woodRight)`} />

      {/* Middle seat plank */}
      <Polygon points="19.8,38.2 43.8,26.2 47.2,27.9 23.2,39.9" fill={`url(#${uid}_woodTop)`} />
      <Polygon points="23.2,39.9 47.2,27.9 47.2,29.3 23.2,41.3" fill={`url(#${uid}_woodRight)`} />

      {/* Front seat plank */}
      <Polygon points="23.8,40.2 47.8,28.2 51.2,29.9 27.2,41.9" fill={`url(#${uid}_woodTop)`} />
      <Polygon points="23.8,40.2 27.2,41.9 27.2,43.8 23.8,42.1" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="27.2,41.9 51.2,29.9 51.2,31.8 27.2,43.8" fill={`url(#${uid}_woodRight)`} />

      {/* Sunlit woodgrain highlights on seat */}
      <Line x1="26.5" y1="40.4" x2="48.5" y2="29.4" stroke="#F5D7B2" strokeWidth="0.65" strokeOpacity={0.6} />
      <Line x1="22.5" y1="38.4" x2="44.5" y2="27.4" stroke="#F5D7B2" strokeWidth="0.55" strokeOpacity={0.5} />

      {/* Left & right armrests */}
      <Polygon points="15.5,31.2 17.8,30.1 27.4,34.9 25.1,36.0" fill={`url(#${uid}_woodTop)`} />
      <Polygon points="15.5,31.2 25.1,36.0 25.1,37.5 15.5,32.7" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="25.1,36.0 27.4,34.9 27.4,36.4 25.1,37.5" fill={`url(#${uid}_woodRight)`} />
      {/* Front-left armrest post */}
      <Polygon points="24.6,36.5 26.6,37.5 26.6,41.6 24.6,40.6" fill={`url(#${uid}_woodLeft)`} />

      <Polygon points="39.5,19.2 41.8,18.1 51.4,22.9 49.1,24.0" fill={`url(#${uid}_woodTop)`} />
      <Polygon points="39.5,19.2 49.1,24.0 49.1,25.5 39.5,20.7" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="49.1,24.0 51.4,22.9 51.4,24.4 49.1,25.5" fill={`url(#${uid}_woodRight)`} />
      {/* Front-right armrest post */}
      <Polygon points="48.6,24.5 50.6,25.5 50.6,29.6 48.6,28.6" fill={`url(#${uid}_woodRight)`} />

      {/* Brass joinery pegs */}
      <Circle cx="17.2" cy="27.2" r="0.6" fill="#E8C784" />
      <Circle cx="39.2" cy="16.2" r="0.6" fill="#E8C784" />
    </G>
  );
}

function renderClayBirdbath(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_clayBody`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#DF9972" />
          <Stop offset="38%" stopColor="#C87A54" />
          <Stop offset="80%" stopColor="#9E5738" />
          <Stop offset="100%" stopColor="#7C4128" />
        </LinearGradient>
        <LinearGradient id={`${uid}_clayRim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#EBB08B" />
          <Stop offset="50%" stopColor="#CE825B" />
          <Stop offset="100%" stopColor="#945134" />
        </LinearGradient>
        <LinearGradient id={`${uid}_bowlUnder`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#C97C56" />
          <Stop offset="50%" stopColor="#A65E3D" />
          <Stop offset="100%" stopColor="#7A3F26" />
        </LinearGradient>
        <RadialGradient id={`${uid}_water`} cx="38%" cy="38%" r="65%">
          <Stop offset="0%" stopColor="#B8E0EC" />
          <Stop offset="48%" stopColor="#6FAAC0" />
          <Stop offset="100%" stopColor="#3B7288" />
        </RadialGradient>
      </Defs>

      {/* Ground contact shadow */}
      <Ellipse cx="32.5" cy="53.5" rx="14.5" ry="5.2" fill="#232E24" fillOpacity={0.22} />

      {/* Sculpted circular terracotta base */}
      <Ellipse cx="32" cy="51.2" rx="11.5" ry="4.4" fill="#8C4B2F" />
      <Path
        d="M20.6 50.8 C20.6 47.4, 25.5 45.6, 32 45.6 C38.5 45.6, 43.4 47.4, 43.4 50.8 C43.4 52.8, 38.3 54.4, 32 54.4 C25.7 54.4, 20.6 52.8, 20.6 50.8 Z"
        fill={`url(#${uid}_clayBody)`}
      />
      <Ellipse cx="32" cy="48.2" rx="8.2" ry="2.8" fill="#DF9972" fillOpacity={0.35} />

      {/* Pedestal column with turned collar */}
      <Path
        d="M27.2 48.4 C27.8 43.5, 28.4 39.2, 27.6 34.8 L36.4 34.8 C35.6 39.2, 36.2 43.5, 36.8 48.4 C35.4 49.4, 28.6 49.4, 27.2 48.4 Z"
        fill={`url(#${uid}_clayBody)`}
      />
      {/* Subtle sunlit vertical highlight on left of column */}
      <Path d="M29.4 47.2 C29.6 43, 29.8 39, 29.4 35.8" stroke="#F0BD9D" strokeWidth="1.2" strokeOpacity={0.45} strokeLinecap="round" />
      {/* Collar ring under bowl */}
      <Ellipse cx="32" cy="35.6" rx="6.2" ry="2.2" fill="#8E4D31" />
      <Ellipse cx="32" cy="35.1" rx="6.0" ry="2.0" fill={`url(#${uid}_clayBody)`} />

      {/* Flared bowl underside */}
      <Path
        d="M14.5 29.6 C15.2 34.8, 22.8 37.6, 32 37.6 C41.2 37.6, 48.8 34.8, 49.5 29.6 Z"
        fill={`url(#${uid}_bowlUnder)`}
      />

      {/* Sculpted terracotta rim */}
      <Ellipse cx="32" cy="29.4" rx="18" ry="6.8" fill={`url(#${uid}_clayRim)`} />
      <Ellipse cx="32" cy="29.0" rx="17.2" ry="6.2" fill="none" stroke="#F5CBB0" strokeWidth="0.7" strokeOpacity={0.65} />

      {/* Recessed shimmering water basin */}
      <Ellipse cx="32" cy="29.6" rx="14.6" ry="4.9" fill="#7D4329" />
      <Ellipse cx="32" cy="30.0" rx="14.2" ry="4.5" fill={`url(#${uid}_water)`} />

      {/* Sunlit water ripples & specular reflections */}
      <Path
        d="M22.5 29.5 Q27.5 27.6 33.5 29.1"
        stroke="#E9F7FB"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeOpacity={0.85}
      />
      <Path
        d="M27.8 31.6 Q33.2 30.2 39.2 31.4"
        stroke="#D4EFF7"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity={0.65}
      />
      <Ellipse cx="36.5" cy="28.6" rx="2.6" ry="0.9" fill="#FFFFFF" fillOpacity={0.45} />

      {/* Tiny moss accent at pedestal base */}
      <Ellipse cx="22.8" cy="51.6" rx="2.6" ry="1.3" fill="#5D8456" />
      <Circle cx="24.6" cy="51.9" r="1.0" fill="#7CA36E" />
    </G>
  );
}

function renderReedLantern(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_halo`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFE394" stopOpacity={0.65} />
          <Stop offset="50%" stopColor="#F0B956" stopOpacity={0.26} />
          <Stop offset="100%" stopColor="#E6A23C" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${uid}_core`} cx="45%" cy="45%" r="55%">
          <Stop offset="0%" stopColor="#FFF7D6" />
          <Stop offset="52%" stopColor="#F9CC66" />
          <Stop offset="100%" stopColor="#D98B36" />
        </RadialGradient>
        <LinearGradient id={`${uid}_reedBody`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#DFBE84" />
          <Stop offset="45%" stopColor="#C9A062" />
          <Stop offset="100%" stopColor="#8E6837" />
        </LinearGradient>
        <LinearGradient id={`${uid}_cap`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#A8804C" />
          <Stop offset="50%" stopColor="#825E34" />
          <Stop offset="100%" stopColor="#5D4122" />
        </LinearGradient>
      </Defs>

      {/* Soft ground shadow + warm light pool */}
      <Ellipse cx="32" cy="53.5" rx="14" ry="4.8" fill="#232B20" fillOpacity={0.22} />
      <Ellipse cx="32" cy="53" rx="16" ry="5.5" fill={`url(#${uid}_halo)`} />

      {/* Warm radial ambient glow around lantern */}
      <Circle cx="32" cy="34" r="22" fill={`url(#${uid}_halo)`} />

      {/* Arched bamboo handle */}
      <Path
        d="M23.5 22.5 C23.5 12.5, 40.5 12.5, 40.5 22.5"
        stroke="#7D5C34"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M24.2 21.5 C24.5 13.8, 37.5 13.2, 39.5 19.5"
        stroke="#C49E66"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
        strokeOpacity={0.7}
      />

      {/* Low turned wooden/stone foot base */}
      <Ellipse cx="32" cy="51.2" rx="8.6" ry="3.1" fill={`url(#${uid}_cap)`} />
      <Rect x="25.5" y="46.5" width="13" height="4.5" rx="1.8" fill={`url(#${uid}_cap)`} />
      <Ellipse cx="32" cy="46.8" rx="7.6" ry="2.5" fill="#9E7744" />

      {/* Woven lantern body shell */}
      <Path
        d="M21 25.5 C19.2 31.5, 19.2 39.5, 22.5 46.2 C25.5 48.2, 38.5 48.2, 41.5 46.2 C44.8 39.5, 44.8 31.5, 43 25.5 C39 23.2, 25 23.2, 21 25.5 Z"
        fill={`url(#${uid}_reedBody)`}
      />

      {/* Glowing amber inner core visible through woven reeds */}
      <Path
        d="M24.2 27.6 C22.8 32.2, 22.8 38.5, 25.2 44.0 C27.8 45.4, 36.2 45.4, 38.8 44.0 C41.2 38.5, 41.2 32.2, 39.8 27.6 C36.6 26.0, 27.4 26.0, 24.2 27.6 Z"
        fill={`url(#${uid}_core)`}
      />
      {/* Bright candle flame highlight */}
      <Ellipse cx="32" cy="35.2" rx="3.2" ry="5.2" fill="#FFFDF0" fillOpacity={0.8} />

      {/* Curved vertical woven reed ribs */}
      <Path d="M24.5 25.2 C22.5 32.5, 22.8 39.5, 25.4 46.2" stroke="#8C6534" strokeWidth="1.25" fill="none" />
      <Path d="M28.5 24.5 C27.4 32.5, 27.5 39.8, 29.0 47.0" stroke="#9B723E" strokeWidth="1.2" fill="none" />
      <Path d="M35.5 24.5 C36.6 32.5, 36.5 39.8, 35.0 47.0" stroke="#7A562B" strokeWidth="1.2" fill="none" />
      <Path d="M39.5 25.2 C41.5 32.5, 41.2 39.5, 38.6 46.2" stroke="#6E4C24" strokeWidth="1.25" fill="none" />

      {/* Horizontal woven reed bands */}
      <Path d="M20.3 31.2 Q32 34.4 43.7 31.2" stroke="#876132" strokeWidth="1.35" fill="none" />
      <Path d="M20.2 37.8 Q32 41.0 43.8 37.8" stroke="#876132" strokeWidth="1.35" fill="none" />
      <Path d="M21.4 43.4 Q32 46.2 42.6 43.4" stroke="#755228" strokeWidth="1.2" fill="none" />

      {/* Sunlit reed highlights on left side */}
      <Path d="M21.6 28.0 C20.4 33.2, 20.6 38.6, 22.2 43.6" stroke="#F4D8A4" strokeWidth="0.9" strokeOpacity={0.65} fill="none" />

      {/* Top woven wooden collar cap */}
      <Ellipse cx="32" cy="24.4" rx="11.2" ry="3.6" fill={`url(#${uid}_cap)`} />
      <Ellipse cx="32" cy="23.6" rx="8.8" ry="2.6" fill="#B58C56" />
      <Circle cx="32" cy="23.2" r="1.4" fill="#6E4E28" />
    </G>
  );
}

function renderStoneLantern(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_fireGlow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF5CC" stopOpacity={0.95} />
          <Stop offset="45%" stopColor="#F5BF58" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#E69B38" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`${uid}_stoneTop`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D7D5CC" />
          <Stop offset="100%" stopColor="#B1AFA4" />
        </LinearGradient>
        <LinearGradient id={`${uid}_stoneLeft`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#BBB9AF" />
          <Stop offset="100%" stopColor="#949288" />
        </LinearGradient>
        <LinearGradient id={`${uid}_stoneRight`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8C8B82" />
          <Stop offset="100%" stopColor="#696860" />
        </LinearGradient>
        <LinearGradient id={`${uid}_roofLeft`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#CCCAC0" />
          <Stop offset="100%" stopColor="#9A988E" />
        </LinearGradient>
        <LinearGradient id={`${uid}_roofRight`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#89887F" />
          <Stop offset="100%" stopColor="#64635B" />
        </LinearGradient>
      </Defs>

      {/* Ground shadow */}
      <Ellipse cx="32.5" cy="54.5" rx="14.5" ry="5.2" fill="#212B22" fillOpacity={0.24} />

      {/* Warm firebox ambient glow */}
      <Circle cx="32" cy="29.5" r="16" fill={`url(#${uid}_fireGlow)`} />

      {/* Stepped isometric stone pedestal base (kiso) */}
      <Polygon points="20,49.5 32,44.2 44,49.5 32,54.8" fill={`url(#${uid}_stoneTop)`} />
      <Polygon points="20,49.5 32,54.8 32,57.4 20,52.1" fill={`url(#${uid}_stoneLeft)`} />
      <Polygon points="32,54.8 44,49.5 44,52.1 32,57.4" fill={`url(#${uid}_stoneRight)`} />

      {/* Upper base step */}
      <Polygon points="24.5,47.6 32,44.2 39.5,47.6 32,51.0" fill={`url(#${uid}_stoneTop)`} />
      <Polygon points="24.5,47.6 32,51.0 32,52.8 24.5,49.4" fill={`url(#${uid}_stoneLeft)`} />
      <Polygon points="32,51.0 39.5,47.6 39.5,49.4 32,52.8" fill={`url(#${uid}_stoneRight)`} />

      {/* Carved granite shaft (sao) */}
      <Polygon points="28.2,37.2 32,39.0 32,48.8 28.2,47.0" fill={`url(#${uid}_stoneLeft)`} />
      <Polygon points="32,39.0 35.8,37.2 35.8,47.0 32,48.8" fill={`url(#${uid}_stoneRight)`} />

      {/* Flared middle platform (chudai) */}
      <Polygon points="22.5,34.4 32,30.2 41.5,34.4 32,38.6" fill={`url(#${uid}_stoneTop)`} />
      <Polygon points="22.5,34.4 32,38.6 32,40.8 24.5,37.4" fill={`url(#${uid}_stoneLeft)`} />
      <Polygon points="32,38.6 41.5,34.4 39.5,37.4 32,40.8" fill={`url(#${uid}_stoneRight)`} />

      {/* Glowing amber firebox chamber (hibukuro) */}
      <Polygon points="25.2,26.2 32,29.4 32,36.4 25.2,33.2" fill="#F8C864" />
      <Polygon points="32,29.4 38.8,26.2 38.8,33.2 32,36.4" fill="#E6A542" />
      <Ellipse cx="32" cy="31.2" rx="3.4" ry="3.8" fill="#FFF7D6" fillOpacity={0.92} />

      {/* Stone corner pillars framing the firebox */}
      <Polygon points="24.2,25.5 26.2,26.4 26.2,34.2 24.2,33.3" fill={`url(#${uid}_stoneLeft)`} />
      <Polygon points="31.1,28.8 32.9,28.8 32.9,37.0 31.1,37.0" fill={`url(#${uid}_stoneLeft)`} />
      <Polygon points="37.8,26.4 39.8,25.5 39.8,33.3 37.8,34.2" fill={`url(#${uid}_stoneRight)`} />

      {/* Curved pagoda roof (kasa) with upturned eaves */}
      <Path
        d="M32 14.2 C27 18.4, 21.5 21.6, 15.2 22.8 L32 29.8 L32 14.2 Z"
        fill={`url(#${uid}_roofLeft)`}
      />
      <Path
        d="M32 14.2 C37 18.4, 42.5 21.6, 48.8 22.8 L32 29.8 L32 14.2 Z"
        fill={`url(#${uid}_roofRight)`}
      />
      {/* Roof eave thickness */}
      <Path d="M15.2 22.8 L32 29.8 L32 31.4 L16.2 24.6 Z" fill="#8C8B82" />
      <Path d="M32 29.8 L48.8 22.8 L47.8 24.6 L32 31.4 Z" fill="#5D5C54" />
      {/* Sunlit roof ridge highlight */}
      <Path d="M32 14.6 L16.8 22.6" stroke="#EAE8DF" strokeWidth="0.7" strokeOpacity={0.65} />

      {/* Lotus-bud finial (hoju) */}
      <Ellipse cx="32" cy="14.4" rx="3.2" ry="1.3" fill="#9E9C92" />
      <Path d="M32 9.4 C34.2 11.4, 34.2 13.8, 32 14.2 C29.8 13.8, 29.8 11.4, 32 9.4 Z" fill={`url(#${uid}_stoneTop)`} />

      {/* Velvety moss patches on roof & base */}
      <Ellipse cx="24.2" cy="21.4" rx="3.2" ry="1.4" fill="#5E8554" transform="rotate(-22 24.2 21.4)" />
      <Circle cx="26.4" cy="20.2" r="1.2" fill="#7CA36C" />
      <Ellipse cx="23.2" cy="51.2" rx="2.8" ry="1.3" fill="#587E4F" />
    </G>
  );
}

function renderKoiPond(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_pondWater`} cx="42%" cy="42%" r="60%">
          <Stop offset="0%" stopColor="#7DC2D4" />
          <Stop offset="48%" stopColor="#468CA3" />
          <Stop offset="100%" stopColor="#265A6E" />
        </RadialGradient>
        <RadialGradient id={`${uid}_rockLight`} cx="32%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#DBD7CB" />
          <Stop offset="58%" stopColor="#ABA698" />
          <Stop offset="100%" stopColor="#777367" />
        </RadialGradient>
        <RadialGradient id={`${uid}_rockDark`} cx="35%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#C4C0B4" />
          <Stop offset="58%" stopColor="#928E82" />
          <Stop offset="100%" stopColor="#656259" />
        </RadialGradient>
        <LinearGradient id={`${uid}_lilyPad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7CA96D" />
          <Stop offset="100%" stopColor="#426D47" />
        </LinearGradient>
      </Defs>

      {/* Soft ground shadow around pond */}
      <Ellipse cx="32" cy="45.5" rx="27" ry="13.5" fill="#212E24" fillOpacity={0.2} />

      {/* Outer recessed earthen bank */}
      <Path
        d="M9 42 C8 34, 19 28, 33 28.5 C47 29, 57 35.5, 55.5 43.5 C54 51.5, 42 56.5, 29 55.5 C16 54.5, 10 49.5, 9 42 Z"
        fill="#7E7A6D"
      />

      {/* Recessed water basin */}
      <Path
        d="M12 42.5 C11.5 36.2, 20.5 31.2, 33 31.5 C45 31.8, 53 37, 52 43.2 C51 49.5, 40.5 53.5, 29.5 52.8 C18.5 52.2, 12.5 48.2, 12 42.5 Z"
        fill={`url(#${uid}_pondWater)`}
      />

      {/* Shallow bank inner rim reflection */}
      <Path
        d="M14.5 42.5 C14.5 37.8, 22 33.8, 33 34 C43.2 34.2, 49.8 38.2, 49.2 43"
        stroke="#A4DCE8"
        strokeWidth="1.2"
        strokeOpacity={0.35}
        fill="none"
      />

      {/* Glimpsed golden-orange koi swimming beneath surface */}
      <Path
        d="M21 43.2 C24.5 39.2, 30.2 39.4, 34 42.4 C30.6 44.6, 25.2 45.2, 21 43.2 Z"
        fill="#E8844A"
        fillOpacity={0.85}
      />
      <Path d="M21.2 43.2 L17.6 41.4 L18.4 45.0 Z" fill="#F2A466" fillOpacity={0.78} />
      <Circle cx="30.2" cy="41.8" r="1.2" fill="#FFF3E0" fillOpacity={0.75} />

      {/* Sunlit water ripples */}
      <Path
        d="M23 37.8 Q28.5 36.2 34.5 37.6"
        stroke="#DDF5FA"
        strokeWidth="1.0"
        strokeLinecap="round"
        strokeOpacity={0.75}
      />
      <Path
        d="M27.5 47.6 Q33.5 46.2 39 47.8"
        stroke="#D4F0F7"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity={0.6}
      />

      {/* Notched lily pads & tiny lotus bud */}
      <Path
        d="M42 44.2 L47.2 43.2 A5.4 3.2 0 1 1 45.8 41.6 Z"
        fill={`url(#${uid}_lilyPad)`}
      />
      <Path
        d="M36.5 41.2 L39.8 40.5 A3.6 2.2 0 1 1 38.8 39.5 Z"
        fill="#6A9860"
      />
      <Path
        d="M41.5 42.6 C40.5 40.4, 41.8 38.8, 43.2 38.4 C44.6 38.8, 45.8 40.4, 44.8 42.6 Z"
        fill="#F5C6CE"
      />
      <Circle cx="43.2" cy="40.8" r="1.1" fill="#F9E3A0" />

      {/* Sculpted 3D mossy river boulders ringing the pond */}
      <Ellipse cx="15.5" cy="36.2" rx="6.2" ry="3.8" fill={`url(#${uid}_rockLight)`} />
      <Ellipse cx="24.5" cy="31.2" rx="7.2" ry="4.0" fill={`url(#${uid}_rockDark)`} />
      <Ellipse cx="36.5" cy="30.6" rx="6.5" ry="3.6" fill={`url(#${uid}_rockLight)`} />
      <Ellipse cx="47.2" cy="34.2" rx="6.2" ry="3.7" fill={`url(#${uid}_rockDark)`} />
      <Ellipse cx="52.8" cy="41.8" rx="5.0" ry="3.3" fill={`url(#${uid}_rockLight)`} />
      <Ellipse cx="11.2" cy="43.8" rx="5.2" ry="3.4" fill={`url(#${uid}_rockDark)`} />
      <Ellipse cx="18.2" cy="51.0" rx="6.0" ry="3.4" fill={`url(#${uid}_rockLight)`} />
      <Ellipse cx="45.8" cy="50.4" rx="5.8" ry="3.3" fill={`url(#${uid}_rockDark)`} />

      {/* Moss caps on key boulders */}
      <Ellipse cx="23.2" cy="29.6" rx="3.4" ry="1.5" fill="#5D8753" />
      <Ellipse cx="46.4" cy="32.6" rx="3.0" ry="1.4" fill="#6D9660" />
      <Ellipse cx="16.8" cy="49.4" rx="2.8" ry="1.3" fill="#587F4E" />
    </G>
  );
}

function renderBambooFountain(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_basinOut`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#B8B5AA" />
          <Stop offset="45%" stopColor="#928F85" />
          <Stop offset="100%" stopColor="#68665E" />
        </LinearGradient>
        <RadialGradient id={`${uid}_basinWater`} cx="40%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#9BD4E2" />
          <Stop offset="55%" stopColor="#5897AC" />
          <Stop offset="100%" stopColor="#31687A" />
        </RadialGradient>
        <LinearGradient id={`${uid}_bambooVert`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#A6C47E" />
          <Stop offset="45%" stopColor="#779B59" />
          <Stop offset="100%" stopColor="#4F703B" />
        </LinearGradient>
        <LinearGradient id={`${uid}_bambooSpout`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#B6D28E" />
          <Stop offset="55%" stopColor="#7FA360" />
          <Stop offset="100%" stopColor="#54743F" />
        </LinearGradient>
        <LinearGradient id={`${uid}_stream`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#EBF9FD" stopOpacity={0.95} />
          <Stop offset="55%" stopColor="#9FD9EA" stopOpacity={0.85} />
          <Stop offset="100%" stopColor="#D7F4FC" stopOpacity={0.9} />
        </LinearGradient>
      </Defs>

      {/* Ground shadow */}
      <Ellipse cx="32" cy="53.5" rx="18" ry="6.2" fill="#212D23" fillOpacity={0.22} />

      {/* Carved granite water basin (tsukubai) */}
      <Path
        d="M14.5 44.2 C14.5 51.2, 22 55.2, 31.5 55.2 C41 55.2, 48.5 51.2, 48.5 44.2 Z"
        fill={`url(#${uid}_basinOut)`}
      />
      <Ellipse cx="31.5" cy="44.2" rx="17" ry="6.6" fill="#C4C1B6" />
      <Ellipse cx="31.5" cy="44.2" rx="13.8" ry="4.9" fill="#6F6D65" />
      <Ellipse cx="31.5" cy="44.7" rx="13.2" ry="4.5" fill={`url(#${uid}_basinWater)`} />

      {/* Concentric splash ripples in basin */}
      <Ellipse cx="26.5" cy="45.2" rx="5.6" ry="2.0" stroke="#E0F6FC" strokeWidth="0.9" strokeOpacity={0.75} fill="none" />
      <Ellipse cx="26.5" cy="45.2" rx="2.8" ry="1.0" stroke="#FFFFFF" strokeWidth="1.0" strokeOpacity={0.85} fill="none" />

      {/* Rear bamboo support post */}
      <Rect x="39.5" y="21" width="4.4" height="24" rx="2" fill={`url(#${uid}_bambooVert)`} />
      <Line x1="39.4" y1="29" x2="44.0" y2="29" stroke="#4D6B39" strokeWidth="1.2" />
      <Line x1="39.4" y1="37" x2="44.0" y2="37" stroke="#4D6B39" strokeWidth="1.2" />
      <Ellipse cx="41.7" cy="21.2" rx="2.2" ry="0.9" fill="#C5DC9E" />

      {/* Secondary shorter pivot post */}
      <Rect x="45.5" y="27.5" width="3.8" height="20" rx="1.8" fill={`url(#${uid}_bambooVert)`} />
      <Line x1="45.4" y1="35" x2="49.4" y2="35" stroke="#4D6B39" strokeWidth="1.1" />
      <Ellipse cx="47.4" cy="27.7" rx="1.9" ry="0.8" fill="#C5DC9E" />

      {/* Tilted bamboo spout (shishi-odoshi) */}
      <G transform="rotate(-24 37 29)">
        <Rect x="24.5" y="26.8" width="23.5" height="4.8" rx="2.2" fill={`url(#${uid}_bambooSpout)`} />
        <Line x1="33" y1="26.7" x2="33" y2="31.7" stroke="#4B6937" strokeWidth="1.25" />
        <Line x1="41" y1="26.7" x2="41" y2="31.7" stroke="#4B6937" strokeWidth="1.25" />
        {/* Beveled hollow spout mouth */}
        <Ellipse cx="24.8" cy="29.2" rx="1.3" ry="2.2" fill="#3C542D" />
      </G>

      {/* Black twine lashing at bamboo joint */}
      <Path d="M39.2 28.5 L44.4 26.8 M39.2 30.2 L44.4 28.5" stroke="#3B3630" strokeWidth="1.1" strokeLinecap="round" />

      {/* Glistening arc of pouring water */}
      <Path
        d="M25.6 34.4 C24.2 36.8, 25.4 40.8, 26.4 45.0"
        stroke={`url(#${uid}_stream)`}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M25.2 35.0 C24.2 37.2, 25.0 40.4, 25.8 43.8"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity={0.85}
        fill="none"
      />
      {/* Sparkling splash droplets */}
      <Circle cx="24.2" cy="43.8" r="0.9" fill="#EFFBFF" />
      <Circle cx="28.6" cy="43.6" r="0.8" fill="#E3F7FC" />

      {/* Moss tuft clinging to basin front-left */}
      <Ellipse cx="18.2" cy="50.4" rx="3.4" ry="1.6" fill="#58804F" />
      <Circle cx="20.4" cy="50.8" r="1.2" fill="#7CA36D" />
    </G>
  );
}

function renderCedarGazebo(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_deckTop`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#DEB282" />
          <Stop offset="100%" stopColor="#BA8654" />
        </LinearGradient>
        <LinearGradient id={`${uid}_woodLeft`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#B88251" />
          <Stop offset="100%" stopColor="#8E5E36" />
        </LinearGradient>
        <LinearGradient id={`${uid}_woodRight`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#855834" />
          <Stop offset="100%" stopColor="#5E3C21" />
        </LinearGradient>
        <LinearGradient id={`${uid}_roofLeft`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D69463" />
          <Stop offset="55%" stopColor="#B87244" />
          <Stop offset="100%" stopColor="#945630" />
        </LinearGradient>
        <LinearGradient id={`${uid}_roofRight`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9E5E37" />
          <Stop offset="100%" stopColor="#6D3D21" />
        </LinearGradient>
        <RadialGradient id={`${uid}_lanternWarm`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF0B8" stopOpacity={0.9} />
          <Stop offset="60%" stopColor="#F0B554" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#E6A13C" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Isometric ground shadow */}
      <Polygon points="8,44.5 32,32.5 56,44.5 32,56.5" fill="#212B22" fillOpacity={0.22} />

      {/* Raised isometric cedar deck platform */}
      <Polygon points="12,43.5 32,33.5 52,43.5 32,53.5" fill={`url(#${uid}_deckTop)`} />
      <Polygon points="12,43.5 32,53.5 32,56.2 12,46.2" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="32,53.5 52,43.5 52,46.2 32,56.2" fill={`url(#${uid}_woodRight)`} />

      {/* Deck plank lines */}
      <Line x1="17" y1="41" x2="37" y2="51" stroke="#9B6B40" strokeWidth="0.6" strokeOpacity={0.5} />
      <Line x1="22" y1="38.5" x2="42" y2="48.5" stroke="#9B6B40" strokeWidth="0.6" strokeOpacity={0.5} />
      <Line x1="27" y1="36" x2="47" y2="46" stroke="#9B6B40" strokeWidth="0.6" strokeOpacity={0.5} />

      {/* Cozy interior shadow & back railings */}
      <Polygon points="16,42 32,34 48,42 32,50" fill="#5A3C25" fillOpacity={0.22} />
      {/* Back-left railing */}
      <Polygon points="15.5,37.8 32,29.6 32,31.2 15.5,39.4" fill={`url(#${uid}_woodLeft)`} />
      {/* Back-right railing */}
      <Polygon points="32,29.6 48.5,37.8 48.5,39.4 32,31.2" fill={`url(#${uid}_woodRight)`} />

      {/* Back post */}
      <Rect x="30.8" y="21" width="2.4" height="14" fill="#7D5432" />

      {/* Warm glowing interior tea lantern hanging inside */}
      <Circle cx="32" cy="31.5" r="7.5" fill={`url(#${uid}_lanternWarm)`} />
      <Ellipse cx="32" cy="31.5" rx="2.0" ry="2.6" fill="#FFE699" />

      {/* Left, right, and front timber corner posts */}
      <Polygon points="14.5,27 16.5,28 16.5,44 14.5,43" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="16.5,28 17.8,27.3 17.8,43.3 16.5,44" fill={`url(#${uid}_woodRight)`} />

      <Polygon points="46.2,27.3 47.5,28 47.5,44 46.2,43.3" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="47.5,28 49.5,27 49.5,43 47.5,44" fill={`url(#${uid}_woodRight)`} />

      <Polygon points="30.6,34.5 32,35.2 32,52.2 30.6,51.5" fill={`url(#${uid}_woodLeft)`} />
      <Polygon points="32,35.2 33.4,34.5 33.4,51.5 32,52.2" fill={`url(#${uid}_woodRight)`} />

      {/* Roof underside dark eaves shadow */}
      <Polygon points="8.5,27.2 32,16.5 55.5,27.2 32,37.8" fill="#4E311C" />

      {/* Pitched isometric shingled pavilion roof */}
      {/* Sunlit left-front slope */}
      <Polygon points="32,10.5 7.5,26.8 32,37.2" fill={`url(#${uid}_roofLeft)`} />
      {/* Shaded right-front slope */}
      <Polygon points="32,10.5 56.5,26.8 32,37.2" fill={`url(#${uid}_roofRight)`} />

      {/* Layered shingle texture lines */}
      <Line x1="25.5" y1="15.0" x2="14.2" y2="29.6" stroke="#854B27" strokeWidth="0.65" strokeOpacity={0.4} />
      <Line x1="32" y1="18.2" x2="17.5" y2="30.9" stroke="#F0BE90" strokeWidth="0.6" strokeOpacity={0.35} />
      <Line x1="32" y1="24.2" x2="21.5" y2="32.7" stroke="#854B27" strokeWidth="0.65" strokeOpacity={0.4} />
      <Line x1="38.5" y1="15.0" x2="49.8" y2="29.6" stroke="#4D2914" strokeWidth="0.65" strokeOpacity={0.45} />
      <Line x1="32" y1="18.2" x2="46.5" y2="30.9" stroke="#4D2914" strokeWidth="0.65" strokeOpacity={0.4} />

      {/* Roof ridge highlight & decorative finial */}
      <Line x1="32" y1="10.8" x2="32" y2="36.8" stroke="#EAB88A" strokeWidth="0.9" strokeOpacity={0.65} />
      <Circle cx="32" cy="9.8" r="2.1" fill="#C98A54" />
      <Circle cx="31.4" cy="9.2" r="0.7" fill="#F5D3AD" />
    </G>
  );
}

function renderGlassGreenhouse(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_baseLeft`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#C8C3B6" />
          <Stop offset="100%" stopColor="#9B9688" />
        </LinearGradient>
        <LinearGradient id={`${uid}_baseRight`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#8E8A7E" />
          <Stop offset="100%" stopColor="#6D6A60" />
        </LinearGradient>
        <LinearGradient id={`${uid}_glassLeft`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#EFFAF7" stopOpacity={0.78} />
          <Stop offset="55%" stopColor="#C8E6DF" stopOpacity={0.62} />
          <Stop offset="100%" stopColor="#9CC9BF" stopOpacity={0.7} />
        </LinearGradient>
        <LinearGradient id={`${uid}_glassRight`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#CFE8E2" stopOpacity={0.72} />
          <Stop offset="100%" stopColor="#88B5AC" stopOpacity={0.76} />
        </LinearGradient>
        <LinearGradient id={`${uid}_glassRoof`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F6FCFA" stopOpacity={0.86} />
          <Stop offset="100%" stopColor="#B8DDD5" stopOpacity={0.72} />
        </LinearGradient>
      </Defs>

      {/* Isometric ground shadow */}
      <Polygon points="9,44 32,32.5 55,44 32,55.5" fill="#212E27" fillOpacity={0.22} />

      {/* Interior floor & charming miniature plants visible inside */}
      <Polygon points="13,42.5 32,33 51,42.5 32,52" fill="#8B7E6B" fillOpacity={0.6} />
      {/* Interior terracotta pots & lush foliage */}
      <Path d="M24 41.5 L28 41.5 L27.3 44.5 L24.7 44.5 Z" fill="#C47852" />
      <Circle cx="26" cy="39.2" r="3.4" fill="#4E7D54" />
      <Circle cx="24.5" cy="38.2" r="2.0" fill="#6DA06B" />

      <Path d="M35 39.5 L39.5 39.5 L38.8 42.8 L35.7 42.8 Z" fill="#B86B46" />
      <Circle cx="37.2" cy="37.0" r="3.8" fill="#3E6B47" />
      <Circle cx="39.0" cy="36.2" r="2.4" fill="#5D8F60" />
      <Circle cx="36.8" cy="34.8" r="1.2" fill="#F2C864" />

      <Circle cx="31.5" cy="44.2" r="3.2" fill="#558758" />
      <Circle cx="32.8" cy="43.0" r="1.8" fill="#77AA72" />

      {/* Low mossy stone foundation wall */}
      <Polygon points="12,38.8 32,48.8 32,53.2 12,43.2" fill={`url(#${uid}_baseLeft)`} />
      <Polygon points="32,48.8 52,38.8 52,43.2 32,53.2" fill={`url(#${uid}_baseRight)`} />

      {/* Translucent isometric glass walls */}
      {/* Front-left gable wall */}
      <Polygon points="12,26.5 22,16.5 32,36.5 32,48.8 12,38.8" fill={`url(#${uid}_glassLeft)`} />
      {/* Front-right side wall */}
      <Polygon points="32,36.5 52,26.5 52,38.8 32,48.8" fill={`url(#${uid}_glassRight)`} />

      {/* Pitched translucent glass roof */}
      {/* Back-left roof slope */}
      <Polygon points="12,26.5 22,16.5 42,6.5 32,16.5" fill={`url(#${uid}_glassRoof)`} />
      {/* Front-right sunlit roof slope */}
      <Polygon points="22,16.5 42,6.5 52,26.5 32,36.5" fill={`url(#${uid}_glassRoof)`} />

      {/* Sunlit diagonal glass reflection streaks */}
      <Polygon points="27,16 32,13.5 39,29.5 34,32" fill="#FFFFFF" fillOpacity={0.38} />
      <Polygon points="16,28 20,26 24,42 20,40" fill="#FFFFFF" fillOpacity={0.32} />
      <Polygon points="39,34.5 44,32 42,42.5 37,45" fill="#FFFFFF" fillOpacity={0.28} />

      {/* Dark sage-iron frame & mullions */}
      <G stroke="#3D5950" strokeLinejoin="round" strokeLinecap="round" fill="none">
        {/* Main outer silhouette & eaves */}
        <Polygon points="12,26.5 22,16.5 32,36.5 32,48.8 12,38.8" strokeWidth="1.4" />
        <Polygon points="32,36.5 52,26.5 52,38.8 32,48.8" strokeWidth="1.4" />
        <Polygon points="22,16.5 42,6.5 52,26.5 32,36.5" strokeWidth="1.4" />
        <Line x1="12" y1="26.5" x2="22" y2="16.5" strokeWidth="1.4" />
        {/* Roof rafters */}
        <Line x1="28.6" y1="13.2" x2="38.6" y2="33.2" strokeWidth="1.0" />
        <Line x1="35.3" y1="9.8" x2="45.3" y2="29.8" strokeWidth="1.0" />
        {/* Side wall vertical mullions */}
        <Line x1="38.6" y1="33.2" x2="38.6" y2="45.5" strokeWidth="1.0" />
        <Line x1="45.3" y1="29.8" x2="45.3" y2="42.1" strokeWidth="1.0" />
        {/* Front-left doorway & gable mullions */}
        <Line x1="22" y1="16.5" x2="22" y2="43.8" strokeWidth="1.1" />
        <Line x1="17" y1="31.5" x2="17" y2="41.3" strokeWidth="0.9" />
        <Line x1="27" y1="36.5" x2="27" y2="46.3" strokeWidth="0.9" />
        {/* Horizontal transoms */}
        <Line x1="12" y1="32.5" x2="32" y2="42.5" strokeWidth="0.9" />
        <Line x1="32" y1="42.5" x2="52" y2="32.5" strokeWidth="0.9" />
      </G>

      {/* Roof ridge crest finial accents */}
      <Circle cx="22" cy="15.8" r="1.1" fill="#3D5950" />
      <Circle cx="42" cy="5.8" r="1.1" fill="#3D5950" />
    </G>
  );
}
