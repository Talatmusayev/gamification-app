import type React from 'react';
import {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export const CRITTER_ASSET_KEYS: ReadonlySet<string> = new Set([
  'garden_robin',
  'meadow_butterfly',
  'hedgehog',
  'firefly_cluster',
  'moss_frog',
  'ginger_cat',
  'golden_koi',
]);

export function renderCritterSprite(assetKey: string, uid: string): React.ReactNode | null {
  switch (assetKey) {
    case 'garden_robin':
      return renderGardenRobin(uid);
    case 'meadow_butterfly':
      return renderMeadowButterfly(uid);
    case 'hedgehog':
      return renderHedgehog(uid);
    case 'firefly_cluster':
      return renderFireflyCluster(uid);
    case 'moss_frog':
      return renderMossFrog(uid);
    case 'ginger_cat':
      return renderGingerCat(uid);
    case 'golden_koi':
      return renderGoldenKoi(uid);
    default:
      return null;
  }
}

function renderGardenRobin(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_back`} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#8A7E72" />
          <Stop offset="55%" stopColor="#6B6056" />
          <Stop offset="100%" stopColor="#4D443C" />
        </LinearGradient>
        <RadialGradient id={`${uid}_breast`} cx="40%" cy="32%" r="68%">
          <Stop offset="0%" stopColor="#EB8A58" />
          <Stop offset="55%" stopColor="#D1683D" />
          <Stop offset="100%" stopColor="#A64927" />
        </RadialGradient>
        <LinearGradient id={`${uid}_wing`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7C7065" />
          <Stop offset="65%" stopColor="#594F46" />
          <Stop offset="100%" stopColor="#3F3731" />
        </LinearGradient>
        <LinearGradient id={`${uid}_belly`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F2E7D8" />
          <Stop offset="100%" stopColor="#D4C5B2" />
        </LinearGradient>
      </Defs>

      {/* Soft ground contact shadow */}
      <Ellipse cx="32.5" cy="53.5" rx="12.5" ry="4.2" fill="#232B23" fillOpacity={0.22} />

      {/* Delicate legs and perched toes */}
      <G stroke="#6B5140" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M29.5 45.5 L28.5 52.5 M28.5 52.5 L25.2 53.2 M28.5 52.5 L31.2 53.4" />
        <Path d="M35.5 45.5 L35.2 52.5 M35.2 52.5 L32.8 53.3 M35.2 52.5 L38.4 53.1" />
      </G>

      {/* Upturned tail feathers */}
      <Path d="M22.5 39.5 L11.5 32.8 L13.4 38.2 L23.5 43.2 Z" fill="#524840" />
      <Path d="M22.8 39.6 L13.8 34.4" stroke="#8C7F73" strokeWidth="0.8" strokeOpacity={0.6} />

      {/* Plump sculpted body */}
      <Path
        d="M21 39.2 C21 31.2, 28 24.5, 36.2 25.2 C42.8 25.8, 46.2 31.5, 45.5 38.2 C44.8 44.8, 38.5 48.2, 31.2 47.6 C24.5 47.0, 21 43.8, 21 39.2 Z"
        fill={`url(#${uid}_back)`}
      />

      {/* Soft cream lower belly */}
      <Path
        d="M27 45.5 C31 47.8, 37.8 47.6, 41.5 44.2 C38.2 44.5, 32.5 44.2, 27 45.5 Z"
        fill={`url(#${uid}_belly)`}
      />

      {/* Warm russet-orange breast */}
      <Path
        d="M32.5 33.2 C36.5 31.4, 42.5 31.8, 44.8 35.6 C46.2 38.8, 44.5 44.2, 39.2 45.8 C34.5 47.0, 30.8 44.5, 30.5 40.2 C30.2 36.8, 31.0 34.2, 32.5 33.2 Z"
        fill={`url(#${uid}_breast)`}
      />
      {/* Soft russet throat flush */}
      <Path
        d="M35.5 31.6 C38.5 30.8, 42.2 31.4, 43.8 33.8 C41.5 34.8, 37.5 34.2, 35.5 31.6 Z"
        fill="#E88250"
        fillOpacity={0.75}
      />

      {/* Folded layered wing feathers */}
      <Path
        d="M22.2 37.6 C24.5 33.5, 31.2 32.8, 35.2 35.8 C36.2 39.5, 32.2 43.4, 25.4 43.2 C22.5 43.0, 21.2 40.2, 22.2 37.6 Z"
        fill={`url(#${uid}_wing)`}
      />
      {/* Scalloped wing feather detail strokes */}
      <Path d="M24.2 36.8 Q28.2 35.4 33.2 37.0" stroke="#9C8F82" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <Path d="M23.6 39.5 Q27.8 38.4 32.2 39.6" stroke="#8C7F73" strokeWidth="0.85" strokeLinecap="round" fill="none" />
      <Path d="M24.8 41.8 Q28.0 41.0 31.0 41.8" stroke="#786C61" strokeWidth="0.8" strokeLinecap="round" fill="none" />

      {/* Sculpted golden-ochre beak */}
      <Path d="M43.2 28.4 L49.6 30.4 L43.2 32.0 Z" fill="#E3B152" />
      <Path d="M43.2 30.4 L49.6 30.4 L43.2 32.0 Z" fill="#BC8734" />

      {/* Expressive dark eye with soft ring & crisp catchlight */}
      <Circle cx="39.4" cy="29.4" r="2.3" fill="#EAE1D3" fillOpacity={0.55} />
      <Circle cx="39.4" cy="29.4" r="1.65" fill="#1D221D" />
      <Circle cx="39.9" cy="28.8" r="0.6" fill="#FFFFFF" />
      <Circle cx="38.8" cy="30.0" r="0.28" fill="#FFFFFF" fillOpacity={0.7} />

      {/* Sunlit crown highlight */}
      <Path d="M33.2 26.2 Q36.8 25.0 40.2 26.6" stroke="#ABA093" strokeWidth="1.0" strokeLinecap="round" strokeOpacity={0.6} fill="none" />
    </G>
  );
}

function renderMeadowButterfly(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_wingTop`} cx="35%" cy="35%" r="70%">
          <Stop offset="0%" stopColor="#FCE08B" />
          <Stop offset="52%" stopColor="#E9A944" />
          <Stop offset="100%" stopColor="#C46A34" />
        </RadialGradient>
        <RadialGradient id={`${uid}_wingBot`} cx="45%" cy="35%" r="70%">
          <Stop offset="0%" stopColor="#F5C76B" />
          <Stop offset="58%" stopColor="#D6863A" />
          <Stop offset="100%" stopColor="#9E4F26" />
        </RadialGradient>
        <LinearGradient id={`${uid}_body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#5C4A3D" />
          <Stop offset="50%" stopColor="#3D3027" />
          <Stop offset="100%" stopColor="#261E18" />
        </LinearGradient>
      </Defs>

      {/* Soft ground hover shadow */}
      <Ellipse cx="32" cy="52.5" rx="11.5" ry="3.4" fill="#232B23" fillOpacity={0.14} />

      {/* Slight graceful 3/4 tilt */}
      <G transform="rotate(-8 32 32)">
        {/* Left & Right Hindwings */}
        <Path
          d="M31 33 C25 32, 16.5 34.5, 16.8 40.5 C17.0 45.2, 23.2 46.8, 27.6 43.2 C29.8 41.4, 30.8 37.8, 31 33 Z"
          fill={`url(#${uid}_wingBot)`}
          stroke="#4A3324"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <Path
          d="M33 33 C39 32, 47.5 34.5, 47.2 40.5 C47.0 45.2, 40.8 46.8, 36.4 43.2 C34.2 41.4, 33.2 37.8, 33 33 Z"
          fill={`url(#${uid}_wingBot)`}
          stroke="#4A3324"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* Left & Right Forewings */}
        <Path
          d="M31.2 31.2 C26.5 23.2, 15.8 18.2, 11.8 22.8 C8.5 26.5, 13.5 35.2, 22.8 35.4 C27.2 35.5, 29.8 33.6, 31.2 31.2 Z"
          fill={`url(#${uid}_wingTop)`}
          stroke="#4A3324"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <Path
          d="M32.8 31.2 C37.5 23.2, 48.2 18.2, 52.2 22.8 C55.5 26.5, 50.5 35.2, 41.2 35.4 C36.8 35.5, 34.2 33.6, 32.8 31.2 Z"
          fill={`url(#${uid}_wingTop)`}
          stroke="#4A3324"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Delicate dark wing veins */}
        <G stroke="#523726" strokeWidth="0.85" strokeOpacity={0.65} fill="none" strokeLinecap="round">
          <Path d="M30 30.5 Q22 25.5 14.5 24.0" />
          <Path d="M29.8 32.0 Q21.5 30.8 15.2 31.6" />
          <Path d="M34 30.5 Q42 25.5 49.5 24.0" />
          <Path d="M34.2 32.0 Q42.5 30.8 48.8 31.6" />
          <Path d="M30 35.5 Q24 38.5 20 42.2" />
          <Path d="M34 35.5 Q40 38.5 44 42.2" />
        </G>

        {/* Crisp white margin dots along outer wing edges */}
        <Circle cx="13.8" cy="24.2" r="0.95" fill="#FFFDF6" />
        <Circle cx="12.8" cy="27.4" r="0.85" fill="#FFFDF6" />
        <Circle cx="14.5" cy="30.6" r="0.8" fill="#FFFDF6" />
        <Circle cx="50.2" cy="24.2" r="0.95" fill="#FFFDF6" />
        <Circle cx="51.2" cy="27.4" r="0.85" fill="#FFFDF6" />
        <Circle cx="49.5" cy="30.6" r="0.8" fill="#FFFDF6" />

        <Circle cx="19.2" cy="42.4" r="0.8" fill="#FFFDF6" />
        <Circle cx="22.4" cy="44.2" r="0.75" fill="#FFFDF6" />
        <Circle cx="44.8" cy="42.4" r="0.8" fill="#FFFDF6" />
        <Circle cx="41.6" cy="44.2" r="0.75" fill="#FFFDF6" />

        {/* Slender segmented body & head */}
        <Ellipse cx="32" cy="34.2" rx="1.8" ry="7.6" fill={`url(#${uid}_body)`} />
        <Circle cx="32" cy="25.6" r="2.0" fill="#3B2E26" />
        <Circle cx="31.4" cy="25.0" r="0.55" fill="#FFFFFF" fillOpacity={0.65} />

        {/* Graceful curved club-tipped antennae */}
        <Path d="M31.2 24.2 C29.5 19.5, 26.8 17.8, 25.0 18.2" stroke="#3D3027" strokeWidth="1.0" fill="none" strokeLinecap="round" />
        <Circle cx="24.8" cy="18.3" r="0.9" fill="#3D3027" />
        <Path d="M32.8 24.2 C34.5 19.5, 37.2 17.8, 39.0 18.2" stroke="#3D3027" strokeWidth="1.0" fill="none" strokeLinecap="round" />
        <Circle cx="39.2" cy="18.3" r="0.9" fill="#3D3027" />
      </G>
    </G>
  );
}

function renderHedgehog(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_quillBase`} cx="35%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#9C7F66" />
          <Stop offset="55%" stopColor="#725946" />
          <Stop offset="100%" stopColor="#4A382B" />
        </RadialGradient>
        <RadialGradient id={`${uid}_face`} cx="40%" cy="35%" r="70%">
          <Stop offset="0%" stopColor="#F5E8D5" />
          <Stop offset="65%" stopColor="#DEC8AF" />
          <Stop offset="100%" stopColor="#BA9F82" />
        </RadialGradient>
      </Defs>

      {/* Ground contact shadow */}
      <Ellipse cx="32" cy="51.8" rx="17" ry="4.8" fill="#232B23" fillOpacity={0.22} />

      {/* Tiny warm-taupe paws */}
      <Ellipse cx="24.5" cy="50.4" rx="3.4" ry="2.0" fill="#A68B72" />
      <Ellipse cx="36.8" cy="50.6" rx="3.4" ry="2.0" fill="#B69B82" />
      <Path d="M38.8 50.6 L39.8 51.2" stroke="#7A624E" strokeWidth="0.8" strokeLinecap="round" />

      {/* Sculpted spiny quill silhouette */}
      <Path
        d="M15.5 47.2 C13.2 42.5, 14.2 35.8, 17.8 32.5 L16.2 31.2 L20.8 29.8 L20.2 27.4 L25.2 27.6 L26.2 25.2 L30.6 26.8 L33.2 25.0 L36.2 27.8 L39.8 27.6 L40.8 31.2 C43.2 34.2, 43.8 40.2, 42.0 46.2 C38.5 49.5, 21.5 50.2, 15.5 47.2 Z"
        fill={`url(#${uid}_quillBase)`}
      />

      {/* Layered textured brown-cream quill ridges */}
      <G stroke="#E6D5BE" strokeWidth="1.25" strokeLinecap="round" strokeOpacity={0.72}>
        <Line x1="21.5" y1="33.2" x2="18.2" y2="35.6" />
        <Line x1="26.5" y1="30.6" x2="23.0" y2="33.2" />
        <Line x1="31.8" y1="30.2" x2="28.4" y2="32.8" />
        <Line x1="36.2" y1="31.8" x2="33.2" y2="34.2" />
        <Line x1="20.2" y1="38.5" x2="17.0" y2="41.0" />
        <Line x1="25.5" y1="36.6" x2="22.2" y2="39.0" />
        <Line x1="31.0" y1="36.2" x2="27.8" y2="38.6" />
        <Line x1="23.0" y1="43.0" x2="19.8" y2="45.2" />
        <Line x1="28.6" y1="42.4" x2="25.4" y2="44.6" />
      </G>
      <G stroke="#493629" strokeWidth="1.15" strokeLinecap="round" strokeOpacity={0.6}>
        <Line x1="23.8" y1="35.0" x2="20.5" y2="37.2" />
        <Line x1="29.0" y1="33.6" x2="25.8" y2="35.8" />
        <Line x1="34.0" y1="34.0" x2="31.0" y2="36.4" />
        <Line x1="26.4" y1="39.8" x2="23.2" y2="42.0" />
      </G>

      {/* Soft cream snout & cheek */}
      <Path
        d="M32.5 40.5 C34.2 35.5, 39.2 34.2, 43.8 36.8 C46.8 38.6, 49.6 41.2, 50.8 43.4 C49.4 46.8, 44.5 49.4, 38.2 49.4 C33.5 49.4, 31.2 45.2, 32.5 40.5 Z"
        fill={`url(#${uid}_face)`}
      />

      {/* Tiny rounded ear */}
      <Circle cx="36.8" cy="34.2" r="2.8" fill="#C9B198" />
      <Circle cx="36.8" cy="34.4" r="1.5" fill="#DDAFA0" />

      {/* Warm rosy cheek */}
      <Ellipse cx="41.8" cy="44.2" rx="2.2" ry="1.3" fill="#E3A38E" fillOpacity={0.5} />

      {/* Expressive dark eye with white catchlight */}
      <Circle cx="42.2" cy="40.4" r="1.85" fill="#1E1A17" />
      <Circle cx="42.8" cy="39.8" r="0.65" fill="#FFFFFF" />

      {/* Glossy dark button nose */}
      <Ellipse cx="50.4" cy="43.2" rx="2.1" ry="1.7" fill="#2B231E" />
      <Ellipse cx="50.0" cy="42.5" rx="0.65" ry="0.45" fill="#FFFFFF" fillOpacity={0.55} />

      {/* Gentle storybook smile */}
      <Path d="M45.8 46.4 Q47.6 47.4 49.0 45.8" stroke="#6E5746" strokeWidth="0.95" strokeLinecap="round" fill="none" />
    </G>
  );
}

function renderFireflyCluster(uid: string): React.ReactNode {
  const flies = [
    { x: 18, y: 40, scale: 0.92, glowR: 11.5, rot: -18 },
    { x: 30, y: 27, scale: 1.08, glowR: 13.5, rot: -10 },
    { x: 44, y: 34, scale: 0.96, glowR: 12.0, rot: 14 },
    { x: 37, y: 46, scale: 0.82, glowR: 10.0, rot: 8 },
  ];

  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_glow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF8D2" stopOpacity={0.95} />
          <Stop offset="34%" stopColor="#F9D062" stopOpacity={0.52} />
          <Stop offset="70%" stopColor="#E6A63A" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#D98F2B" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${uid}_lantern`} cx="45%" cy="45%" r="55%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="55%" stopColor="#FFE58A" />
          <Stop offset="100%" stopColor="#E8A938" />
        </RadialGradient>
      </Defs>

      {/* Delicate magical flight trail arc */}
      <Path
        d="M16 42 C21 35, 25 28, 31 27 C37 26, 42 30, 45 35 C46 39, 41 44, 37 46"
        stroke="#F6D983"
        strokeWidth="0.9"
        strokeDasharray="1.8 3.2"
        strokeLinecap="round"
        strokeOpacity={0.45}
        fill="none"
      />

      {/* Ambient stardust motes */}
      <Circle cx="24" cy="34" r="0.9" fill="#FFF2B8" fillOpacity={0.8} />
      <Circle cx="38" cy="24" r="0.8" fill="#FFE694" fillOpacity={0.75} />
      <Circle cx="49" cy="28" r="0.7" fill="#FFF2B8" fillOpacity={0.7} />
      <Circle cx="26" cy="46" r="0.75" fill="#FFE694" fillOpacity={0.65} />

      {/* Four winged fireflies with layered warm amber glows */}
      {flies.map((fly, idx) => (
        <G key={idx}>
          <Circle cx={fly.x} cy={fly.y} r={fly.glowR} fill={`url(#${uid}_glow)`} />
          <G transform={`translate(${fly.x} ${fly.y}) rotate(${fly.rot}) scale(${fly.scale})`}>
            {/* Translucent gossamer wings */}
            <Ellipse
              cx="-2.8"
              cy="-2.6"
              rx="3.4"
              ry="1.5"
              fill="#FFFDF2"
              fillOpacity={0.68}
              transform="rotate(-28 -2.8 -2.6)"
            />
            <Ellipse
              cx="2.8"
              cy="-2.6"
              rx="3.4"
              ry="1.5"
              fill="#FFFDF2"
              fillOpacity={0.62}
              transform="rotate(28 2.8 -2.6)"
            />
            {/* Tiny dark thorax/head */}
            <Ellipse cx="0" cy="-2.2" rx="1.4" ry="1.8" fill="#4A4232" />
            {/* Glowing amber lantern abdomen */}
            <Ellipse cx="0" cy="0.8" rx="2.1" ry="2.6" fill={`url(#${uid}_lantern)`} />
            <Circle cx="-0.4" cy="0.4" r="0.85" fill="#FFFFFF" fillOpacity={0.9} />
          </G>
        </G>
      ))}
    </G>
  );
}

function renderMossFrog(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <LinearGradient id={`${uid}_leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8BB470" />
          <Stop offset="55%" stopColor="#5D8C54" />
          <Stop offset="100%" stopColor="#3C6440" />
        </LinearGradient>
        <RadialGradient id={`${uid}_frogBack`} cx="35%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#8CC474" />
          <Stop offset="52%" stopColor="#589452" />
          <Stop offset="100%" stopColor="#35663C" />
        </RadialGradient>
        <LinearGradient id={`${uid}_throat`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#EBF2D8" />
          <Stop offset="100%" stopColor="#C3D8AC" />
        </LinearGradient>
      </Defs>

      {/* Soft ground shadow beneath leaf */}
      <Ellipse cx="32" cy="52.8" rx="20" ry="5.5" fill="#1E2B20" fillOpacity={0.2} />

      {/* Sculpted curved resting leaf */}
      <Path
        d="M11 47.5 C15 41.2, 26 39.2, 37.5 41.0 C45.5 42.2, 52.5 45.2, 54.5 48.2 C48.5 52.8, 35.5 54.5, 24.5 53.0 C17.5 52.0, 13.0 49.8, 11 47.5 Z"
        fill={`url(#${uid}_leaf)`}
      />
      {/* Leaf central vein */}
      <Path
        d="M13.5 47.6 Q32 46.2 52.2 48.0"
        stroke="#A4CB88"
        strokeWidth="0.9"
        strokeOpacity={0.55}
        fill="none"
      />

      {/* Frog contact shadow on leaf */}
      <Ellipse cx="32" cy="46.2" rx="13" ry="4.4" fill="#234229" fillOpacity={0.32} />

      {/* Folded hind legs */}
      <Ellipse cx="21.5" cy="43.8" rx="5.5" ry="3.8" fill="#467B46" transform="rotate(-15 21.5 43.8)" />
      <Ellipse cx="42.5" cy="43.8" rx="5.5" ry="3.8" fill="#3D6E40" transform="rotate(15 42.5 43.8)" />

      {/* Plump sculpted frog body */}
      <Path
        d="M19.5 42.2 C19.2 35.4, 24.8 30.8, 32 30.8 C39.2 30.8, 44.8 35.4, 44.5 42.2 C44.2 46.4, 38.8 48.2, 32 48.2 C25.2 48.2, 19.8 46.4, 19.5 42.2 Z"
        fill={`url(#${uid}_frogBack)`}
      />

      {/* Glossy sunlit highlight along frog's back */}
      <Ellipse cx="29.5" cy="35.6" rx="5.5" ry="2.2" fill="#BCE09E" fillOpacity={0.48} transform="rotate(-12 29.5 35.6)" />

      {/* Creamy pale-pistachio throat & belly */}
      <Ellipse cx="32" cy="44.2" rx="7.8" ry="3.8" fill={`url(#${uid}_throat)`} />

      {/* Delicate front arms & webbed toes gripping the leaf */}
      <Path d="M24.2 42.8 C23.2 45.2, 23.8 47.6, 25.5 48.2" stroke="#4F8A4D" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <Path d="M39.8 42.8 C40.8 45.2, 40.2 47.6, 38.5 48.2" stroke="#427844" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <Circle cx="24.2" cy="48.4" r="1.0" fill="#6AA862" />
      <Circle cx="26.2" cy="48.8" r="1.0" fill="#6AA862" />
      <Circle cx="39.8" cy="48.4" r="1.0" fill="#5D9858" />
      <Circle cx="37.8" cy="48.8" r="1.0" fill="#5D9858" />

      {/* Prominent rounded eye domes */}
      <Circle cx="25.8" cy="31.5" r="4.4" fill="#629D5A" />
      <Circle cx="38.2" cy="31.5" r="4.4" fill="#548E50" />

      {/* Bright expressive eyes: amber iris, dark pupil & crisp catchlight */}
      <Circle cx="25.8" cy="31.4" r="3.0" fill="#E8C25A" />
      <Circle cx="25.8" cy="31.4" r="1.9" fill="#1A211B" />
      <Circle cx="26.5" cy="30.6" r="0.75" fill="#FFFFFF" />

      <Circle cx="38.2" cy="31.4" r="3.0" fill="#E8C25A" />
      <Circle cx="38.2" cy="31.4" r="1.9" fill="#1A211B" />
      <Circle cx="38.9" cy="30.6" r="0.75" fill="#FFFFFF" />

      {/* Subtle rosy cheeks & gentle serene smile */}
      <Ellipse cx="23.4" cy="39.8" rx="1.8" ry="1.0" fill="#E8A292" fillOpacity={0.42} />
      <Ellipse cx="40.6" cy="39.8" rx="1.8" ry="1.0" fill="#E8A292" fillOpacity={0.42} />
      <Path d="M27.8 39.2 Q32 41.2 36.2 39.2" stroke="#2D5232" strokeWidth="1.15" strokeLinecap="round" fill="none" />
    </G>
  );
}

function renderGingerCat(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_furBody`} cx="35%" cy="28%" r="72%">
          <Stop offset="0%" stopColor="#F2B374" />
          <Stop offset="55%" stopColor="#DB8A48" />
          <Stop offset="100%" stopColor="#B2622D" />
        </RadialGradient>
        <RadialGradient id={`${uid}_furHead`} cx="38%" cy="32%" r="70%">
          <Stop offset="0%" stopColor="#F6BD82" />
          <Stop offset="62%" stopColor="#E09250" />
          <Stop offset="100%" stopColor="#BA6B32" />
        </RadialGradient>
        <LinearGradient id={`${uid}_cream`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFF7E8" />
          <Stop offset="100%" stopColor="#EBD8BE" />
        </LinearGradient>
      </Defs>

      {/* Soft ground shadow */}
      <Ellipse cx="32" cy="51.6" rx="18" ry="5.2" fill="#232922" fillOpacity={0.22} />

      {/* Curled marmalade body */}
      <Path
        d="M15.5 44.5 C15.2 36.2, 23.2 32.5, 32.2 33.2 C41.5 33.8, 47.8 38.8, 47.2 45.2 C46.6 50.2, 39.2 52.2, 30.8 52.0 C21.5 51.8, 15.8 49.0, 15.5 44.5 Z"
        fill={`url(#${uid}_furBody)`}
      />

      {/* Organic tabby stripes across the back */}
      <Path d="M21.8 35.6 Q24.2 38.8 22.8 42.4" stroke="#B55F29" strokeWidth="2.1" strokeLinecap="round" fill="none" strokeOpacity={0.7} />
      <Path d="M26.8 34.0 Q29.4 37.8 27.6 41.8" stroke="#B55F29" strokeWidth="2.2" strokeLinecap="round" fill="none" strokeOpacity={0.72} />
      <Path d="M32.0 33.8 Q34.2 37.2 32.8 40.4" stroke="#B55F29" strokeWidth="2.0" strokeLinecap="round" fill="none" strokeOpacity={0.68} />

      {/* Fluffy curled tail wrapping around left-front with cream tip */}
      <Path
        d="M17.2 46.2 C12.5 44.2, 12.2 37.8, 17.5 36.5 C21.2 35.6, 23.2 38.4, 21.6 40.8"
        stroke="#C97639"
        strokeWidth="4.4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M17.8 36.5 C20.8 35.8, 22.8 38.2, 21.6 40.6"
        stroke="#FFF4E0"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Soft cream chest bib & tucked front paws */}
      <Ellipse cx="36.2" cy="46.2" rx="6.2" ry="4.4" fill={`url(#${uid}_cream)`} />
      <Ellipse cx="32.8" cy="49.8" rx="3.4" ry="2.2" fill={`url(#${uid}_cream)`} />
      <Ellipse cx="40.2" cy="49.8" rx="3.4" ry="2.2" fill={`url(#${uid}_cream)`} />
      <Line x1="32.4" y1="49.8" x2="32.4" y2="51.4" stroke="#C9AE92" strokeWidth="0.7" />
      <Line x1="40.0" y1="49.8" x2="40.0" y2="51.4" stroke="#C9AE92" strokeWidth="0.7" />

      {/* Triangular ears with warm dusty-rose inner ears */}
      <Path d="M32.4 31.6 L33.6 23.4 L39.2 28.4 Z" fill="#DA8947" />
      <Path d="M33.6 30.2 L34.4 25.4 L37.8 28.6 Z" fill="#E8A99A" />

      <Path d="M41.2 28.4 L46.6 23.4 L47.6 31.8 Z" fill="#C9783A" />
      <Path d="M42.4 28.6 L45.8 25.4 L46.4 30.2 Z" fill="#DEA091" />

      {/* Rounded marmalade head */}
      <Ellipse cx="40.0" cy="34.8" rx="8.2" ry="7.2" fill={`url(#${uid}_furHead)`} />

      {/* Cream muzzle cheeks */}
      <Ellipse cx="38.2" cy="37.4" rx="2.6" ry="1.9" fill="#FFF4E4" fillOpacity={0.85} />
      <Ellipse cx="42.2" cy="37.4" rx="2.6" ry="1.9" fill="#FFF4E4" fillOpacity={0.85} />

      {/* Forehead tabby "M" stripes */}
      <Path d="M37.8 28.6 L38.4 31.2 M40.0 28.2 L40.0 31.4 M42.2 28.6 L41.6 31.2" stroke="#B25D28" strokeWidth="1.2" strokeLinecap="round" />

      {/* Peaceful sleeping curved eyes */}
      <Path d="M35.2 34.4 Q37.0 36.2 38.6 34.4" stroke="#472F1E" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <Path d="M41.6 34.4 Q43.4 36.2 45.0 34.4" stroke="#472F1E" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* Tiny pink nose & cozy smile */}
      <Path d="M39.2 36.4 L41.2 36.4 L40.2 37.5 Z" fill="#DE8882" />
      <Path d="M38.8 38.4 Q40.2 39.4 40.2 37.6 Q40.2 39.4 41.6 38.4" stroke="#5E3E28" strokeWidth="0.9" strokeLinecap="round" fill="none" />

      {/* Delicate whiskers */}
      <G stroke="#7D5C43" strokeWidth="0.7" strokeOpacity={0.65} strokeLinecap="round">
        <Line x1="34.5" y1="36.6" x2="30.2" y2="35.8" />
        <Line x1="34.5" y1="37.8" x2="30.5" y2="38.4" />
        <Line x1="45.8" y1="36.6" x2="50.0" y2="35.8" />
        <Line x1="45.8" y1="37.8" x2="49.8" y2="38.4" />
      </G>
    </G>
  );
}

function renderGoldenKoi(uid: string): React.ReactNode {
  return (
    <G>
      <Defs>
        <RadialGradient id={`${uid}_ripplePool`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#8AC8DA" stopOpacity={0.38} />
          <Stop offset="65%" stopColor="#5C9EB3" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#468399" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`${uid}_koiBody`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF3D6" />
          <Stop offset="42%" stopColor="#F5BD5B" />
          <Stop offset="100%" stopColor="#D97E30" />
        </LinearGradient>
        <LinearGradient id={`${uid}_fin`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF6E0" stopOpacity={0.85} />
          <Stop offset="100%" stopColor="#F2B463" stopOpacity={0.45} />
        </LinearGradient>
      </Defs>

      {/* Translucent cerulean water ripple pool */}
      <Ellipse cx="32" cy="40" rx="24" ry="11.5" fill={`url(#${uid}_ripplePool)`} />
      <Ellipse cx="32" cy="40" rx="19.5" ry="8.5" stroke="#B8E4F0" strokeWidth="1.0" strokeOpacity={0.55} fill="none" />
      <Ellipse cx="32" cy="40" rx="13.5" ry="5.6" stroke="#E0F6FC" strokeWidth="0.85" strokeOpacity={0.5} fill="none" />

      {/* Subtle underwater koi shadow */}
      <Path
        d="M17 44 C22 39, 32 38, 40 41 C45 43, 48 45, 45 47 C38 49, 28 48, 21 46 Z"
        fill="#244E5E"
        fillOpacity={0.22}
      />

      {/* Flowing translucent pectoral fins */}
      <Path
        d="M35.5 34.5 C34.2 28.5, 29.2 26.2, 26.5 29.2 C25.2 31.2, 29.5 34.8, 33.8 35.8 Z"
        fill={`url(#${uid}_fin)`}
        stroke="#E6A654"
        strokeWidth="0.6"
        strokeOpacity={0.6}
      />
      <Path
        d="M36.5 41.2 C36.2 46.8, 31.8 49.4, 28.8 46.8 C27.2 45.2, 30.8 41.8, 34.8 40.5 Z"
        fill={`url(#${uid}_fin)`}
        stroke="#E6A654"
        strokeWidth="0.6"
        strokeOpacity={0.6}
      />

      {/* Flowing forked translucent tail fin */}
      <Path
        d="M19.5 39.2 C14.2 34.2, 9.8 32.8, 8.8 36.2 C10.8 38.2, 12.2 39.5, 11.8 41.2 C9.5 43.2, 10.4 46.4, 14.2 45.8 C17.2 45.2, 19.2 42.2, 19.5 39.2 Z"
        fill={`url(#${uid}_fin)`}
        stroke="#E39D4A"
        strokeWidth="0.65"
        strokeOpacity={0.65}
      />
      <Line x1="17.8" y1="39.5" x2="11.2" y2="36.2" stroke="#D98B38" strokeWidth="0.55" strokeOpacity={0.5} />
      <Line x1="17.8" y1="40.5" x2="12.6" y2="44.2" stroke="#D98B38" strokeWidth="0.55" strokeOpacity={0.5} />

      {/* Graceful S-curved calico/golden koi body */}
      <Path
        d="M18.8 39.5 C23.2 33.2, 33.5 31.8, 42.4 34.6 C47.2 36.2, 50.5 38.8, 49.6 41.2 C48.4 44.2, 42.2 44.8, 35.8 43.4 C29.5 42.0, 23.8 43.4, 18.8 39.5 Z"
        fill={`url(#${uid}_koiBody)`}
      />

      {/* Warm vermilion calico markings (Hi) */}
      <Path
        d="M27.2 34.2 C30.5 32.8, 35.5 33.2, 37.2 35.8 C36.2 38.4, 31.8 39.2, 28.2 37.8 C26.4 37.0, 26.0 35.2, 27.2 34.2 Z"
        fill="#DE5D35"
      />
      <Ellipse cx="44.2" cy="37.8" rx="3.4" ry="2.2" fill="#DE5D35" transform="rotate(14 44.2 37.8)" />
      {/* Small charcoal ink calico accents (Sumi) */}
      <Ellipse cx="24.4" cy="39.6" rx="1.8" ry="1.1" fill="#3B3532" fillOpacity={0.78} />
      <Circle cx="36.8" cy="40.4" r="1.2" fill="#3B3532" fillOpacity={0.72} />

      {/* Translucent dorsal fin ridge along spine */}
      <Path
        d="M25.5 37.2 Q33.2 34.5 40.5 37.8"
        stroke="#FFF8E6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={0.75}
        fill="none"
      />

      {/* Expressive dark eye with white catchlight */}
      <Circle cx="46.2" cy="38.2" r="1.35" fill="#1C2224" />
      <Circle cx="46.6" cy="37.8" r="0.48" fill="#FFFFFF" />

      {/* Delicate koi barbels */}
      <Path d="M49.2 40.4 Q51.5 39.4 52.6 40.6" stroke="#E09446" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <Path d="M48.8 41.6 Q50.8 42.6 52.0 42.2" stroke="#E09446" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </G>
  );
}
