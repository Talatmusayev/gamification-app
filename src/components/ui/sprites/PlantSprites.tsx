import type { ReactNode } from 'react';
import {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export type GrowthStage = 1 | 2 | 3;

const PLANT_KEYS = [
  'lavender',
  'bonsai_sprout',
  'sunlit_fern',
  'mossy_clover',
  'meadow_daisy',
  'chamomile_tuft',
  'rosemary_sprig',
  'morning_glory',
  'sakura_sapling',
  'moonflower_vine',
  'weeping_willow',
  'golden_ginkgo',
  'lotus_blossom',
  'starlight_orchid',
  'silver_olive',
  'wild_wisteria',
  'amber_maple',
  'night_jasmine',
] as const;

export type PlantAssetKey = (typeof PLANT_KEYS)[number];

export const PLANT_ASSET_KEYS: ReadonlySet<string> = new Set<string>(PLANT_KEYS);

interface SproutPalette {
  leafLight: string;
  leafMid: string;
  leafDark: string;
  stem: string;
  tipTint: string;
  soilVariant?: 'earth' | 'terracotta' | 'water' | 'moss';
  fiddlehead?: boolean;
  vineCurl?: boolean;
}

/**
 * Shared Stage-1 Sprout renderer: shaded soil mound (or pot/water/moss bed),
 * 2-3 tender curved shoots with veined baby leaves subtly tinted to the plant's
 * signature palette, and a glistening morning dewdrop highlight.
 */
function renderBotanicalSprout(uid: string, p: SproutPalette): ReactNode {
  const aoId = `${uid}_ao`;
  const soilId = `${uid}_soil`;
  const leafId = `${uid}_sleaf`;
  const leafDarkId = `${uid}_sleafd`;
  const dewId = `${uid}_dew`;
  const potId = `${uid}_spot`;
  const waterId = `${uid}_swater`;

  return (
    <>
      <Defs>
        <RadialGradient id={aoId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1E2C1F" stopOpacity={0.32} />
          <Stop offset="65%" stopColor="#263628" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#263628" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={soilId} x1="20%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor={p.soilVariant === 'moss' ? '#79A465' : '#8A6A4F'} />
          <Stop offset="55%" stopColor={p.soilVariant === 'moss' ? '#4F7B4B' : '#654935'} />
          <Stop offset="100%" stopColor={p.soilVariant === 'moss' ? '#2F5033' : '#432F22'} />
        </LinearGradient>
        <LinearGradient id={leafId} x1="15%" y1="10%" x2="90%" y2="95%">
          <Stop offset="0%" stopColor={p.leafLight} />
          <Stop offset="55%" stopColor={p.leafMid} />
          <Stop offset="100%" stopColor={p.leafDark} />
        </LinearGradient>
        <LinearGradient id={leafDarkId} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor={p.leafMid} />
          <Stop offset="100%" stopColor={p.leafDark} />
        </LinearGradient>
        <RadialGradient id={dewId} cx="35%" cy="30%" rx="60%" ry="60%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
          <Stop offset="55%" stopColor="#D7F2F5" stopOpacity={0.75} />
          <Stop offset="100%" stopColor="#7EB7C4" stopOpacity={0.45} />
        </RadialGradient>
        {p.soilVariant === 'terracotta' && (
          <LinearGradient id={potId} x1="10%" y1="0%" x2="90%" y2="100%">
            <Stop offset="0%" stopColor="#D9906A" />
            <Stop offset="55%" stopColor="#B86B49" />
            <Stop offset="100%" stopColor="#7E422A" />
          </LinearGradient>
        )}
        {p.soilVariant === 'water' && (
          <RadialGradient id={waterId} cx="42%" cy="40%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor="#8CC3C2" />
            <Stop offset="65%" stopColor="#4A888C" />
            <Stop offset="100%" stopColor="#2A5B61" />
          </RadialGradient>
        )}
      </Defs>

      <G>
        {/* Ground ambient occlusion */}
        <Ellipse cx={32} cy={56} rx={17} ry={5} fill={`url(#${aoId})`} />

        {/* Base bed: earth, moss, terracotta tray, or lotus water ring */}
        {p.soilVariant === 'terracotta' ? (
          <G>
            <Path d="M19 49 L45 49 L42 55.5 Q32 57.5 22 55.5 Z" fill={`url(#${potId})`} />
            <Rect x={17.5} y={46.5} width={29} height={3.4} rx={1.7} fill={`url(#${potId})`} />
            <Path
              d="M19 47.4 Q32 46.6 45 47.4"
              stroke="#F0B795"
              strokeOpacity={0.55}
              strokeWidth={0.9}
              strokeLinecap="round"
            />
            <Ellipse cx={32} cy={47.2} rx={11} ry={2.4} fill={`url(#${soilId})`} />
          </G>
        ) : p.soilVariant === 'water' ? (
          <G>
            <Ellipse cx={32} cy={53} rx={18} ry={5.5} fill={`url(#${waterId})`} />
            <Path
              d="M19 52.5 Q26 50.2 33 51.2"
              stroke="#CBEAE8"
              strokeOpacity={0.5}
              strokeWidth={0.9}
              strokeLinecap="round"
            />
            <Path
              d="M35 54.8 Q41 55.6 45 53.5"
              stroke="#CBEAE8"
              strokeOpacity={0.35}
              strokeWidth={0.8}
              strokeLinecap="round"
            />
            {/* Baby floating lily pad */}
            <Path
              d="M23 52 C21 49.5, 25 47.5, 31 48.2 C36 48.8, 39 50.8, 36.5 53 C34 54.8, 25.5 54.5, 23 52 Z"
              fill={`url(#${leafDarkId})`}
            />
            <Path d="M31 50.8 L36.5 51.8" stroke="#2A5B61" strokeWidth={1.1} />
          </G>
        ) : (
          <G>
            {/* Shaded organic soil or moss mound */}
            <Path
              d="M18 54.5 C19.5 49.2, 25.5 46.8, 32 46.8 C38.5 46.8, 44.5 49.2, 46 54.5 C42.5 56.4, 21.5 56.4, 18 54.5 Z"
              fill={`url(#${soilId})`}
            />
            {/* Warm sunlit top-left mound rim */}
            <Path
              d="M21 51.5 C23.5 48.6, 28 47.6, 33 47.8"
              stroke={p.soilVariant === 'moss' ? '#B1D494' : '#B59272'}
              strokeOpacity={0.45}
              strokeWidth={1.2}
              strokeLinecap="round"
            />
            {/* Soil crumbs / pebbles */}
            <Circle cx={24.5} cy={53} r={1.1} fill="#3F2D21" fillOpacity={0.4} />
            <Circle cx={38.5} cy={52.5} r={1.3} fill="#3F2D21" fillOpacity={0.35} />
            <Circle cx={32.5} cy={54} r={0.9} fill="#A78566" fillOpacity={0.45} />
          </G>
        )}

        {/* Tender curved shoots */}
        {p.fiddlehead ? (
          <G>
            {/* Unfurling fern fiddleheads */}
            <Path
              d="M31 49 C29.5 42, 26 36, 22.5 34.5 C20 33.5, 19.5 36.8, 21.8 37.8 C23.5 38.5, 24.5 36.8, 23.2 35.8"
              stroke={p.leafDark}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M32 49 C32.5 40, 34 32, 37.5 29.5 C40.5 27.5, 42.5 30.8, 40 32.5 C38 33.8, 36.5 31.8, 38.2 30.6"
              stroke={p.leafMid}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <Path
              d="M33.5 49 C36 44, 39.5 40.5, 42.5 39.5 C44.5 39, 44.8 41.2, 43 41.8"
              stroke={p.leafLight}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <Circle cx={39.4} cy={31.2} r={1.5} fill={p.tipTint} fillOpacity={0.75} />
          </G>
        ) : (
          <G>
            {/* Left tender shoot */}
            <Path
              d="M31.5 49 C30.5 43.5, 29 38.5, 26.5 35"
              stroke={p.stem}
              strokeWidth={1.9}
              strokeLinecap="round"
            />
            <Path
              d="M27.2 36 C22.5 33.5, 19.5 35.8, 21.2 39.2 C23 41.5, 26.8 40.2, 28.5 37.5 Z"
              fill={`url(#${leafId})`}
            />
            <Path
              d="M22.2 37.5 Q25 37.2 27.5 37.2"
              stroke="#FFFFFF"
              strokeOpacity={0.35}
              strokeWidth={0.7}
              strokeLinecap="round"
            />

            {/* Main center shoot */}
            <Path
              d="M32.2 49 C32.4 42, 33.2 35.5, 34.5 30.5"
              stroke={p.stem}
              strokeWidth={2.1}
              strokeLinecap="round"
            />
            <Path
              d="M34.2 31.5 C37.5 27.5, 43 28.5, 42.5 32.8 C42 36.2, 37.2 36.8, 33.8 34.2 Z"
              fill={`url(#${leafId})`}
            />
            <Path
              d="M35 33 Q38.5 31.5 41.2 31.8"
              stroke="#FFFFFF"
              strokeOpacity={0.38}
              strokeWidth={0.75}
              strokeLinecap="round"
            />

            {/* Signature-tinted tender apex bud / third baby leaf */}
            <Path
              d="M33.5 34 C31.5 30, 32.5 25.5, 35.2 24.5 C37 26.8, 36.6 31.2, 34.4 33.8 Z"
              fill={p.tipTint}
            />
            <Path
              d="M33.8 27.2 C34.2 25.8, 34.8 25.3, 35.2 25.1"
              stroke="#FFFFFF"
              strokeOpacity={0.55}
              strokeWidth={0.8}
              strokeLinecap="round"
            />

            {/* Optional baby curling tendril for vine species */}
            {p.vineCurl && (
              <Path
                d="M32.8 41.5 C37 39.5, 41 40.5, 41.5 38.2 C41.9 36.6, 39.8 36.4, 39.5 37.8"
                stroke={p.leafMid}
                strokeWidth={1.15}
                strokeLinecap="round"
              />
            )}
          </G>
        )}

        {/* Glistening morning dewdrop on leaf */}
        <Circle cx={39.4} cy={30.8} r={2.1} fill={`url(#${dewId})`} />
        <Circle cx={38.7} cy={30.0} r={0.75} fill="#FFFFFF" />
      </G>
    </>
  );
}

/* ============================================================================
 * 1. LAVENDER
 * Layered violet-indigo spikes, silvery-sage narrow leaves, curved stems
 * ========================================================================== */
function renderLavender(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#B4C9B2',
      leafMid: '#7D9B83',
      leafDark: '#4D6B56',
      stem: '#5D7C64',
      tipTint: '#9C87C8',
    });
  }

  const ao = `${uid}_ao`;
  const soil = `${uid}_soil`;
  const leafSun = `${uid}_lsun`;
  const leafShd = `${uid}_lshd`;
  const spikeDark = `${uid}_spkD`;
  const spikeMid = `${uid}_spkM`;
  const spikeLit = `${uid}_spkL`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1F2C22" stopOpacity={0.32} />
          <Stop offset="68%" stopColor="#27362A" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#27362A" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={soil} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#856A54" />
          <Stop offset="100%" stopColor="#483629" />
        </LinearGradient>
        <LinearGradient id={leafSun} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#C1D5BE" />
          <Stop offset="55%" stopColor="#86A48B" />
          <Stop offset="100%" stopColor="#4F6D57" />
        </LinearGradient>
        <LinearGradient id={leafShd} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#729078" />
          <Stop offset="100%" stopColor="#3B5644" />
        </LinearGradient>
        <LinearGradient id={spikeDark} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7C64B3" />
          <Stop offset="100%" stopColor="#453370" />
        </LinearGradient>
        <LinearGradient id={spikeMid} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#A58EE0" />
          <Stop offset="60%" stopColor="#755CA9" />
          <Stop offset="100%" stopColor="#4E3B7D" />
        </LinearGradient>
        <LinearGradient id={spikeLit} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#D3C4F5" />
          <Stop offset="55%" stopColor="#9A82D2" />
          <Stop offset="100%" stopColor="#654E9B" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={19} ry={5.5} fill={`url(#${ao})`} />

        {/* Grounded soil & moss tuft */}
        <Path
          d="M21 54.2 C23 50.2, 28 49, 32 49 C36 49, 41 50.2, 43 54.2 C39 55.8, 25 55.8, 21 54.2 Z"
          fill={`url(#${soil})`}
        />

        {/* Back silvery-sage narrow basal leaves */}
        <Path d="M31 52 C25 46, 17 41, 13 38 C17 43, 23 48, 29 53 Z" fill={`url(#${leafShd})`} />
        <Path d="M33 52 C39 46, 47 41, 51 38 C47 43, 41 48, 35 53 Z" fill={`url(#${leafShd})`} />
        <Path d="M30 51 C26 42, 22 35, 19 31 C22 37, 25 44, 29 52 Z" fill={`url(#${leafShd})`} />
        <Path d="M34 51 C38 42, 42 35, 45 31 C42 37, 39 44, 35 52 Z" fill={`url(#${leafShd})`} />

        {/* Graceful curved stems */}
        <Path d="M30 51 C27 42, 22 31, 18 22" stroke="#53725B" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M31 51 C29 40, 27 28, 25 16" stroke="#628269" strokeWidth={1.65} strokeLinecap="round" />
        <Path d="M32 51 C32 39, 32 25, 32 12" stroke="#5A7A61" strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M33 51 C35 40, 37 28, 39 17" stroke="#506E58" strokeWidth={1.65} strokeLinecap="round" />
        <Path d="M34 51 C37 42, 42 31, 46 23" stroke="#486450" strokeWidth={1.5} strokeLinecap="round" />

        {/* Front sunlit silvery-sage basal foliage */}
        <Path d="M31 53 C24 49, 17 47, 14 48 C19 50.5, 25 52.5, 30 54 Z" fill={`url(#${leafSun})`} />
        <Path d="M33 53 C40 49, 47 47, 50 48 C45 50.5, 39 52.5, 34 54 Z" fill={`url(#${leafSun})`} />
        <Path d="M31.5 52.5 C28 45, 26 39, 25.5 34.5 C28.2 39.5, 30.2 46, 32 53 Z" fill={`url(#${leafSun})`} />
        <Path d="M32.5 52.5 C36 45, 38 39, 38.5 35.5 C36.2 40.5, 34.2 46, 32.5 53 Z" fill={`url(#${leafSun})`} />

        {stage === 2 ? (
          /* Stage 2: Tight sage-violet calyces & closed buds */
          <G>
            {/* Outer left bud spike */}
            <Ellipse cx={18.5} cy={22.5} rx={1.9} ry={3.2} fill={`url(#${spikeDark})`} />
            <Ellipse cx={20} cy={27} rx={1.7} ry={2.4} fill="#667D6C" />
            {/* Mid-left bud spike */}
            <Ellipse cx={25.2} cy={16.5} rx={2.1} ry={3.6} fill={`url(#${spikeMid})`} />
            <Ellipse cx={26} cy={21.5} rx={1.9} ry={2.8} fill="#6E8672" />
            {/* Center hero bud spike */}
            <Ellipse cx={32} cy={12.5} rx={2.4} ry={4.2} fill={`url(#${spikeLit})`} />
            <Ellipse cx={32} cy={18.2} rx={2.2} ry={3.1} fill={`url(#${spikeMid})`} />
            <Ellipse cx={32} cy={23.2} rx={1.9} ry={2.4} fill="#67816E" />
            {/* Mid-right bud spike */}
            <Ellipse cx={38.8} cy={17.5} rx={2.0} ry={3.5} fill={`url(#${spikeDark})`} />
            <Ellipse cx={38} cy={22.5} rx={1.8} ry={2.6} fill="#5C7563" />
            {/* Outer right bud spike */}
            <Ellipse cx={45.5} cy={23.5} rx={1.8} ry={3.0} fill={`url(#${spikeDark})`} />
          </G>
        ) : (
          /* Stage 3: Full lush tiered lavender spikes + sunlit florets + pollen */
          <G>
            {/* Outer left spike */}
            <Ellipse cx={17.5} cy={21.5} rx={2.3} ry={3.4} fill={`url(#${spikeMid})`} />
            <Ellipse cx={19.4} cy={26.2} rx={2.5} ry={3.1} fill={`url(#${spikeDark})`} />
            <Ellipse cx={21.2} cy={30.6} rx={2.1} ry={2.6} fill={`url(#${spikeDark})`} />
            <Circle cx={16.8} cy={20.2} r={1.0} fill="#DFD4FA" fillOpacity={0.85} />

            {/* Mid-left spike */}
            <Ellipse cx={24.8} cy={15.2} rx={2.6} ry={3.8} fill={`url(#${spikeLit})`} />
            <Ellipse cx={23.4} cy={20.2} rx={2.2} ry={2.8} fill={`url(#${spikeLit})`} />
            <Ellipse cx={26.6} cy={20.6} rx={2.2} ry={2.8} fill={`url(#${spikeMid})`} />
            <Ellipse cx={25.8} cy={25.5} rx={2.6} ry={3.0} fill={`url(#${spikeDark})`} />
            <Ellipse cx={26.8} cy={30.0} rx={2.2} ry={2.4} fill={`url(#${spikeDark})`} />
            <Circle cx={24.0} cy={14.0} r={1.1} fill="#EFE9FF" fillOpacity={0.9} />

            {/* Center hero spike */}
            <Ellipse cx={32} cy={10.8} rx={2.9} ry={4.2} fill={`url(#${spikeLit})`} />
            <Ellipse cx={29.6} cy={16.2} rx={2.4} ry={3.1} fill={`url(#${spikeLit})`} />
            <Ellipse cx={34.4} cy={16.5} rx={2.4} ry={3.1} fill={`url(#${spikeMid})`} />
            <Ellipse cx={32} cy={21.4} rx={3.1} ry={3.4} fill={`url(#${spikeMid})`} />
            <Ellipse cx={29.8} cy={26.2} rx={2.3} ry={2.7} fill={`url(#${spikeMid})`} />
            <Ellipse cx={34.2} cy={26.5} rx={2.3} ry={2.7} fill={`url(#${spikeDark})`} />
            <Ellipse cx={32} cy={30.6} rx={2.4} ry={2.5} fill={`url(#${spikeDark})`} />
            {/* Sunlit floret rim highlights */}
            <Circle cx={31.0} cy={9.6} r={1.2} fill="#F4EEFF" fillOpacity={0.92} />
            <Circle cx={28.8} cy={15.4} r={0.95} fill="#E6DCFC" fillOpacity={0.85} />
            <Circle cx={30.8} cy={20.4} r={0.95} fill="#DDD0FA" fillOpacity={0.78} />

            {/* Mid-right spike */}
            <Ellipse cx={39.2} cy={16.4} rx={2.5} ry={3.7} fill={`url(#${spikeMid})`} />
            <Ellipse cx={37.6} cy={21.4} rx={2.2} ry={2.7} fill={`url(#${spikeMid})`} />
            <Ellipse cx={40.6} cy={21.8} rx={2.2} ry={2.7} fill={`url(#${spikeDark})`} />
            <Ellipse cx={38.4} cy={26.6} rx={2.5} ry={2.9} fill={`url(#${spikeDark})`} />
            <Circle cx={38.4} cy={15.2} r={0.95} fill="#DDD2FA" fillOpacity={0.8} />

            {/* Outer right spike */}
            <Ellipse cx={46.2} cy={22.4} rx={2.2} ry={3.3} fill={`url(#${spikeMid})`} />
            <Ellipse cx={44.5} cy={27.0} rx={2.3} ry={2.9} fill={`url(#${spikeDark})`} />
            <Ellipse cx={42.8} cy={31.2} rx={2.0} ry={2.4} fill={`url(#${spikeDark})`} />

            {/* Drifting sunlit pollen / fragrance motes */}
            <Circle cx={21} cy={11.5} r={1.0} fill="#F3E6B8" fillOpacity={0.85} />
            <Circle cx={42.5} cy={11.0} r={0.9} fill="#E5D7FF" fillOpacity={0.85} />
            <Circle cx={36.5} cy={7.5} r={0.8} fill="#FFF5D6" fillOpacity={0.8} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 2. BONSAI SPROUT
 * Sculpted gnarled S-curve trunk with bark highlights, ceramic terracotta tray
 * pot, 3-tier lush emerald cloud pads
 * ========================================================================== */
function renderBonsaiSprout(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#9AC980',
      leafMid: '#558B58',
      leafDark: '#2F593B',
      stem: '#6D4E3B',
      tipTint: '#B4DC8E',
      soilVariant: 'terracotta',
    });
  }

  const ao = `${uid}_ao`;
  const pot = `${uid}_pot`;
  const rim = `${uid}_rim`;
  const bark = `${uid}_bark`;
  const padDark = `${uid}_padD`;
  const padMid = `${uid}_padM`;
  const padSun = `${uid}_padS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1D2A1E" stopOpacity={0.35} />
          <Stop offset="70%" stopColor="#263527" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#263527" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={pot} x1="8%" y1="0%" x2="92%" y2="100%">
          <Stop offset="0%" stopColor="#D98D67" />
          <Stop offset="50%" stopColor="#B86845" />
          <Stop offset="100%" stopColor="#7C3F27" />
        </LinearGradient>
        <LinearGradient id={rim} x1="5%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0%" stopColor="#E6A17D" />
          <Stop offset="55%" stopColor="#C2714D" />
          <Stop offset="100%" stopColor="#85452B" />
        </LinearGradient>
        <LinearGradient id={bark} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#946D52" />
          <Stop offset="50%" stopColor="#6B4B37" />
          <Stop offset="100%" stopColor="#3F2B1F" />
        </LinearGradient>
        <LinearGradient id={padDark} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#3C6E4B" />
          <Stop offset="100%" stopColor="#1F422D" />
        </LinearGradient>
        <LinearGradient id={padMid} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#699F66" />
          <Stop offset="55%" stopColor="#42764F" />
          <Stop offset="100%" stopColor="#274F36" />
        </LinearGradient>
        <LinearGradient id={padSun} x1="10%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#A6D184" />
          <Stop offset="55%" stopColor="#6DA268" />
          <Stop offset="100%" stopColor="#3D704B" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={21} ry={5.5} fill={`url(#${ao})`} />

        {/* Ceramic terracotta bonsai tray pot */}
        <Rect x={20} y={53.5} width={4.2} height={2.3} rx={1} fill="#7B3E26" />
        <Rect x={39.8} y={53.5} width={4.2} height={2.3} rx={1} fill="#6D3520" />
        <Path d="M16 47.5 L48 47.5 L45 54.2 Q32 56 19 54.2 Z" fill={`url(#${pot})`} />
        <Rect x={14} y={44.5} width={36} height={3.6} rx={1.8} fill={`url(#${rim})`} />
        {/* Pot sunlit lip highlight */}
        <Path
          d="M16 45.4 Q32 44.6 46 45.4"
          stroke="#F5C3A6"
          strokeOpacity={0.55}
          strokeWidth={0.9}
          strokeLinecap="round"
        />
        {/* Mossy soil bed inside tray */}
        <Ellipse cx={32} cy={45.2} rx={14.5} ry={2.3} fill="#4D6B44" />
        <Ellipse cx={25} cy={44.8} rx={4.5} ry={1.4} fill="#6E945B" />
        {/* Tiny decorative river stone */}
        <Ellipse cx={41.5} cy={44.8} rx={2.5} ry={1.5} fill="#9AA098" />
        <Ellipse cx={40.8} cy={44.3} rx={1.1} ry={0.6} fill="#C5CBC2" />

        {/* Gnarled S-curve bonsai trunk & nebari roots */}
        <Path
          d="M27.5 45.5 C28.5 43.5, 29.8 41.5, 29.5 38.5 C29.2 35, 26.5 32.5, 28.5 28.5 C30.5 24.5, 36.5 23.8, 37.5 19.5 C38 17.5, 36.5 16.5, 35.5 16.5 C34.5 18.8, 33 20.8, 29.5 22.8 C25 25.4, 23.2 29.5, 25 34.5 C26.2 37.8, 26.5 42, 23.5 45.2 Z"
          fill={`url(#${bark})`}
        />
        {/* Left & right sculpted branches */}
        <Path
          d="M27 32.5 C23.5 31.2, 20.5 30.2, 18 29.5"
          stroke={`url(#${bark})`}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
        <Path
          d="M32.5 25 C37 24.5, 41 25, 44.5 26"
          stroke={`url(#${bark})`}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        {/* Sunlit left bark highlight */}
        <Path
          d="M26 42.5 C26.6 38.5, 25.5 34.5, 26.2 30.2 C27 26.5, 30.5 24.5, 33.8 22"
          stroke="#BA9274"
          strokeOpacity={0.55}
          strokeWidth={1.1}
          strokeLinecap="round"
        />

        {stage === 2 ? (
          /* Stage 2: Compact budding emerald foliage tufts */
          <G>
            <Ellipse cx={18.5} cy={28.5} rx={6.5} ry={3.8} fill={`url(#${padMid})`} />
            <Ellipse cx={17.5} cy={27.3} rx={4.2} ry={2.3} fill={`url(#${padSun})`} />

            <Ellipse cx={44.5} cy={25.5} rx={6.2} ry={3.5} fill={`url(#${padDark})`} />
            <Ellipse cx={43.5} cy={24.4} rx={3.8} ry={2.0} fill={`url(#${padMid})`} />

            <Ellipse cx={35.5} cy={16.5} rx={8.5} ry={4.8} fill={`url(#${padMid})`} />
            <Ellipse cx={34} cy={15.0} rx={5.5} ry={3.0} fill={`url(#${padSun})`} />
            {/* Fresh lime-jade leaf buds */}
            <Circle cx={15} cy={26.5} r={1.3} fill="#BEE092" />
            <Circle cx={32} cy={12.8} r={1.4} fill="#C6E69B" />
            <Circle cx={46.5} cy={23.8} r={1.2} fill="#A9CF81" />
          </G>
        ) : (
          /* Stage 3: 3-tier lush emerald cloud pads + scalloped highlights */
          <G>
            {/* Tier 1: Left cloud pad */}
            <Path
              d="M9.5 30.2 C8.8 26.8, 12.2 24, 16.5 24.4 C18.8 22.4, 24.2 22.8, 26.2 25.8 C28.5 26.8, 28.4 30.8, 25.5 32.0 C21.5 33.2, 13.5 33.2, 9.5 30.2 Z"
              fill={`url(#${padDark})`}
            />
            <Path
              d="M10.8 29.2 C10.4 26.5, 13.4 24.4, 17 24.8 C19.2 23.0, 23.8 23.4, 25.5 26.0 C27.2 27.0, 26.6 29.8, 24 30.5 C20 31.4, 13.8 31.2, 10.8 29.2 Z"
              fill={`url(#${padMid})`}
            />
            <Ellipse cx={16.8} cy={26.0} rx={5.2} ry={2.4} fill={`url(#${padSun})`} />

            {/* Tier 2: Right cloud pad */}
            <Path
              d="M36.5 27.8 C36.2 24.6, 39.5 22.4, 43.2 22.8 C45.8 21.0, 50.8 21.8, 52.5 24.8 C54.5 26.0, 54.0 29.6, 51.0 30.6 C46.8 31.6, 39.6 31.0, 36.5 27.8 Z"
              fill={`url(#${padDark})`}
            />
            <Path
              d="M37.8 26.8 C37.8 24.4, 40.5 22.8, 43.6 23.2 C46.0 21.6, 50.2 22.4, 51.6 24.8 C52.8 26.0, 52.0 28.6, 49.5 29.2 C45.8 30.0, 40.2 29.2, 37.8 26.8 Z"
              fill={`url(#${padMid})`}
            />
            <Ellipse cx={44.2} cy={24.2} rx={5.0} ry={2.2} fill={`url(#${padSun})`} />

            {/* Tier 3: Crown apex cloud pad */}
            <Path
              d="M21.5 18.8 C20.8 14.8, 24.8 11.4, 30.2 11.8 C33.5 8.8, 41.2 9.2, 44.5 13.0 C48.2 14.2, 48.8 19.2, 44.8 21.0 C39.5 22.8, 26.5 22.5, 21.5 18.8 Z"
              fill={`url(#${padDark})`}
            />
            <Path
              d="M23.0 17.6 C22.5 14.4, 26.0 11.8, 30.8 12.2 C33.8 9.6, 40.5 10.0, 43.5 13.4 C46.5 14.4, 46.8 18.2, 43.2 19.5 C38.5 21.0, 27.5 20.6, 23.0 17.6 Z"
              fill={`url(#${padMid})`}
            />
            <Path
              d="M25.5 15.6 C26.2 12.8, 29.5 11.2, 33.2 11.6 C35.8 10.2, 40.2 11.0, 41.8 13.4 C42.8 15.0, 40.8 16.8, 37.5 17.2 C32.5 17.8, 27.0 17.4, 25.5 15.6 Z"
              fill={`url(#${padSun})`}
            />

            {/* Delicate foliage texture scallops & sunlit rim */}
            <Path
              d="M28 12.8 Q31.5 10.8 35.5 11.5"
              stroke="#C9E7A2"
              strokeOpacity={0.6}
              strokeWidth={1.0}
              strokeLinecap="round"
            />
            <Path
              d="M13.5 25.5 Q16.5 24.0 19.8 24.8"
              stroke="#C9E7A2"
              strokeOpacity={0.5}
              strokeWidth={0.9}
              strokeLinecap="round"
            />
            <Path
              d="M32 16.5 Q35 15.5 38 16.6"
              stroke="#244B32"
              strokeOpacity={0.4}
              strokeWidth={0.9}
              strokeLinecap="round"
            />

            {/* Sunlit floating motes */}
            <Circle cx={22} cy={10.5} r={0.95} fill="#F4E5B3" fillOpacity={0.85} />
            <Circle cx={49.5} cy={17.5} r={0.85} fill="#D5EDAC" fillOpacity={0.8} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 3. SUNLIT FERN
 * Arching pinnate fronds with fine leaflets and warm sunlit tips
 * ========================================================================== */
function renderSunlitFern(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#A8D47C',
      leafMid: '#5E9858',
      leafDark: '#34643F',
      stem: '#45764A',
      tipTint: '#CBE690',
      soilVariant: 'moss',
      fiddlehead: true,
    });
  }

  const ao = `${uid}_ao`;
  const moss = `${uid}_moss`;
  const frondDark = `${uid}_frD`;
  const frondMid = `${uid}_frM`;
  const frondSun = `${uid}_frS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1B2C1D" stopOpacity={0.32} />
          <Stop offset="68%" stopColor="#253827" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#253827" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={moss} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#7EA866" />
          <Stop offset="55%" stopColor="#4F7B4A" />
          <Stop offset="100%" stopColor="#2C4D32" />
        </LinearGradient>
        <LinearGradient id={frondDark} x1="20%" y1="0%" x2="80%" y2="100%">
          <Stop offset="0%" stopColor="#5D9257" />
          <Stop offset="100%" stopColor="#285336" />
        </LinearGradient>
        <LinearGradient id={frondMid} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#94C56E" />
          <Stop offset="55%" stopColor="#4F8752" />
          <Stop offset="100%" stopColor="#2E5C3B" />
        </LinearGradient>
        <LinearGradient id={frondSun} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#CFE588" />
          <Stop offset="50%" stopColor="#86BA67" />
          <Stop offset="100%" stopColor="#437648" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={20} ry={5.5} fill={`url(#${ao})`} />

        {/* Forest moss hummock */}
        <Path
          d="M18 54 C20 49, 26 47.2, 32 47.2 C38 47.2, 44 49, 46 54 C41.5 56, 22.5 56, 18 54 Z"
          fill={`url(#${moss})`}
        />

        {/* Back shadow fronds */}
        <Path
          d="M31 50 C26 39, 19 31, 10 27"
          stroke={`url(#${frondDark})`}
          strokeWidth={1.7}
          strokeLinecap="round"
        />
        <Path
          d="M33 50 C38 39, 45 31, 54 27"
          stroke={`url(#${frondDark})`}
          strokeWidth={1.7}
          strokeLinecap="round"
        />

        {/* Pinnate leaflets on left back frond */}
        <Path d="M26 42 L20 42.5 M23 37 L16.5 37 M19.5 33 L13.5 32.5 M15.5 30 L11 29.2" stroke="#356642" strokeWidth={1.9} strokeLinecap="round" />
        <Path d="M27 41 L24 36.5 M23.5 36.5 L21 32 M20 32.5 L18 28.5" stroke="#467A4E" strokeWidth={1.6} strokeLinecap="round" />

        {/* Pinnate leaflets on right back frond */}
        <Path d="M38 42 L44 42.5 M41 37 L47.5 37 M44.5 33 L50.5 32.5 M48.5 30 L53 29.2" stroke="#2F5E3C" strokeWidth={1.9} strokeLinecap="round" />
        <Path d="M37 41 L40 36.5 M40.5 36.5 L43 32 M44 32.5 L46 28.5" stroke="#3E7047" strokeWidth={1.6} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Developing central fronds + unfurling fiddlehead */
          <G>
            <Path d="M31.5 50 C29 38, 26 27, 22 20" stroke={`url(#${frondMid})`} strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M28.5 38 L23 36.5 M26.5 32 L21 30.5 M24.5 26.5 L20 25.5" stroke="#62985A" strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M29 37 L32.5 33.5 M27 31 L30 27.5" stroke="#75AB64" strokeWidth={1.6} strokeLinecap="round" />

            {/* Central unfurling fiddlehead */}
            <Path
              d="M32.5 50 C33 38, 35 26, 39 22 C42.2 19.2, 44.5 23, 41.8 25.2 C39.5 26.8, 37.8 24.5, 39.8 23.2"
              stroke={`url(#${frondSun})`}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Circle cx={40.6} cy={23.6} r={1.4} fill="#D5EC94" />
          </G>
        ) : (
          /* Stage 3: Full radiant sunlit overarching fern crown */
          <G>
            {/* Mid-left sunlit frond */}
            <Path d="M31 50 C27 37, 21 24, 15 16" stroke={`url(#${frondSun})`} strokeWidth={1.9} strokeLinecap="round" />
            <Path d="M27.5 40 L20.5 39.5 M25 34 L17.5 32.5 M22.5 28 L15.5 26.2 M19.5 22.5 L14 20.5" stroke="#6FA65E" strokeWidth={2.0} strokeLinecap="round" />
            <Path d="M28 39 L26.5 33.5 M25.5 33 L24.5 27.5 M23 27 L22.5 21.8 M20 22 L19.8 17.5" stroke="#9AC973" strokeWidth={1.8} strokeLinecap="round" />

            {/* Hero center-right sunlit arching frond */}
            <Path d="M32.2 50 C32.5 35, 34 21, 38.5 11.5" stroke={`url(#${frondSun})`} strokeWidth={2.1} strokeLinecap="round" />
            {/* Left pinnae of hero frond */}
            <Path d="M32.5 41 L26 39 M33 34.5 L26 32 M34 28.5 L27.5 25.8 M35.2 22.8 L29.5 20.2 M36.8 17.5 L32.5 15.2" stroke="#7EB364" strokeWidth={2.1} strokeLinecap="round" />
            {/* Right pinnae of hero frond */}
            <Path d="M33 41 L39.5 38.8 M33.5 34.5 L40.5 32 M34.5 28.5 L41.2 26.2 M35.8 22.8 L41.8 20.8 M37.2 17.5 L41.5 16.2" stroke="#A6D47A" strokeWidth={2.0} strokeLinecap="round" />
            {/* Warm sunlit tip highlights */}
            <Path d="M37.5 14.5 L38.8 11.2" stroke="#DBF09A" strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M16.8 18.2 L14.8 15.6" stroke="#D5EC92" strokeWidth={1.5} strokeLinecap="round" />

            {/* Foreground gracefully curling right frond */}
            <Path d="M34 50.5 C39 43, 45.5 38, 52 37.5" stroke={`url(#${frondMid})`} strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M38.5 45 L42.5 41.2 M43 41.5 L47 38.5 M47 39.2 L50.5 36.8" stroke="#92C46E" strokeWidth={1.7} strokeLinecap="round" />
            <Path d="M39.5 46 L44.5 45.8 M44 42.8 L49 42.5" stroke="#538A54" strokeWidth={1.6} strokeLinecap="round" />

            {/* Forest sunlight motes */}
            <Circle cx={28} cy={13} r={1.0} fill="#F6EBAC" fillOpacity={0.85} />
            <Circle cx={45} cy={17} r={0.9} fill="#DFF2A4" fillOpacity={0.8} />
            <Circle cx={13} cy={22} r={0.85} fill="#F2E9B0" fillOpacity={0.75} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 4. MOSSY CLOVER
 * Plush mounded moss cushion with layered 3- and 4-leaf clovers & tiny white
 * blossom
 * ========================================================================== */
function renderMossyClover(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#9ED182',
      leafMid: '#589457',
      leafDark: '#30613B',
      stem: '#467B4C',
      tipTint: '#F5F2E6',
      soilVariant: 'moss',
    });
  }

  const ao = `${uid}_ao`;
  const moss = `${uid}_moss`;
  const clvDark = `${uid}_clvD`;
  const clvSun = `${uid}_clvS`;
  const bloom = `${uid}_blm`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1C2C1D" stopOpacity={0.33} />
          <Stop offset="70%" stopColor="#263827" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#263827" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={moss} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#8DB86E" />
          <Stop offset="50%" stopColor="#58874F" />
          <Stop offset="100%" stopColor="#2E5436" />
        </LinearGradient>
        <LinearGradient id={clvDark} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#5C945C" />
          <Stop offset="100%" stopColor="#2B5939" />
        </LinearGradient>
        <LinearGradient id={clvSun} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#A8D684" />
          <Stop offset="55%" stopColor="#649D61" />
          <Stop offset="100%" stopColor="#386B45" />
        </LinearGradient>
        <RadialGradient id={bloom} cx="35%" cy="30%" rx="65%" ry="65%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="65%" stopColor="#F6EFE2" />
          <Stop offset="100%" stopColor="#DECFA8" />
        </RadialGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={21} ry={5.5} fill={`url(#${ao})`} />

        {/* Plush mounded moss cushion */}
        <Path
          d="M12 52.5 C12.5 45.2, 20 40.5, 32 40.5 C44 40.5, 51.5 45.2, 52 52.5 C46 56.2, 18 56.2, 12 52.5 Z"
          fill={`url(#${moss})`}
        />
        <Path
          d="M17 48.2 C21 43.2, 27.5 41.8, 35 42.2"
          stroke="#B4DA8F"
          strokeOpacity={0.5}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        {/* Velvety moss texture tufts */}
        <Path d="M19 51 Q21 49.5 23 51 M39 51.5 Q41 50 43 51.5 M28 53 Q30 51.8 32 53" stroke="#2D5234" strokeOpacity={0.4} strokeWidth={1.0} strokeLinecap="round" />

        {/* Clover stems */}
        <Path d="M24 44 C22.5 39, 21 35, 20.5 31.5" stroke="#42744B" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M32 43 C32 36.5, 32.5 31, 33 26.5" stroke="#4B8053" strokeWidth={1.65} strokeLinecap="round" />
        <Path d="M41 44.5 C42.5 39.5, 44 36, 45 33" stroke="#3B6B44" strokeWidth={1.5} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Young clover leaflets + closed white blossom bud */
          <G>
            {/* Left budding clover */}
            <Ellipse cx={18} cy={31} rx={3.6} ry={2.8} fill={`url(#${clvSun})`} />
            <Ellipse cx={22.5} cy={31.2} rx={3.4} ry={2.6} fill={`url(#${clvDark})`} />
            <Ellipse cx={20.2} cy={28.5} rx={3.2} ry={2.6} fill={`url(#${clvSun})`} />
            {/* Center 4-leaf clover */}
            <Ellipse cx={30} cy={25} rx={3.8} ry={3.0} fill={`url(#${clvSun})`} />
            <Ellipse cx={36} cy={25} rx={3.8} ry={3.0} fill={`url(#${clvDark})`} />
            <Ellipse cx={30.5} cy={29.5} rx={3.5} ry={2.8} fill={`url(#${clvDark})`} />
            <Ellipse cx={35.5} cy={29.5} rx={3.5} ry={2.8} fill={`url(#${clvSun})`} />
            {/* Closed blossom bud */}
            <Path d="M41 44 C41.5 38, 43 32, 44 29" stroke="#538559" strokeWidth={1.3} strokeLinecap="round" />
            <Ellipse cx={44.2} cy={27.5} rx={2.2} ry={3.0} fill="#EBF0E0" />
            <Path d="M42.2 29 C43.5 28.2, 45 28.2, 46.2 29" stroke="#4D7E52" strokeWidth={1.2} />
          </G>
        ) : (
          /* Stage 3: Lush layered 3-leaf & lucky 4-leaf clovers + dainty white blossom */
          <G>
            {/* Left 3-leaf clover */}
            <Path d="M20.5 32.5 C16 32.5, 13.5 29.2, 16.2 27.2 C18 26, 20 28.2, 20.5 31 Z" fill={`url(#${clvSun})`} />
            <Path d="M20.5 32.5 C25 32.5, 27.2 29.2, 24.5 27.2 C22.8 26, 21 28.2, 20.5 31 Z" fill={`url(#${clvDark})`} />
            <Path d="M20.5 32 C18 28.5, 19 24.5, 21 25.5 C23 24.5, 23.5 28.5, 20.5 32 Z" fill={`url(#${clvSun})`} />
            {/* Pale clover chevron markings */}
            <Path d="M17.2 29.5 Q18.5 29 19.4 30.2 M21.6 30.2 Q22.5 29 23.8 29.5" stroke="#D1E9BD" strokeOpacity={0.65} strokeWidth={0.85} strokeLinecap="round" />

            {/* Right 3-leaf clover */}
            <Path d="M45 34.5 C40.5 34.5, 38.5 31.2, 41 29.5 C42.8 28.2, 44.5 30.5, 45 33.2 Z" fill={`url(#${clvDark})`} />
            <Path d="M45 34.5 C49.5 34.5, 51.5 31.2, 49 29.5 C47.2 28.2, 45.5 30.5, 45 33.2 Z" fill={`url(#${clvSun})`} />
            <Path d="M45 34 C42.5 30.5, 43.5 26.8, 45.2 27.8 C47 26.8, 47.8 30.5, 45 34 Z" fill={`url(#${clvSun})`} />

            {/* Center lucky 4-leaf clover (hero) */}
            <Path d="M33 27.5 C27.8 27, 25.2 22.8, 28.2 20.5 C30.5 18.8, 32.6 22.2, 33 26 Z" fill={`url(#${clvSun})`} />
            <Path d="M33 27.5 C38.2 27, 40.8 22.8, 37.8 20.5 C35.5 18.8, 33.4 22.2, 33 26 Z" fill={`url(#${clvDark})`} />
            <Path d="M33 27.5 C28.2 28.5, 26.2 32.5, 29.2 34.2 C31.5 35.2, 32.8 32, 33 28.8 Z" fill={`url(#${clvDark})`} />
            <Path d="M33 27.5 C37.8 28.5, 39.8 32.5, 36.8 34.2 C34.5 35.2, 33.2 32, 33 28.8 Z" fill={`url(#${clvSun})`} />
            {/* Hero clover chevron markings & center */}
            <Path d="M29.2 23.2 Q30.8 22.8 31.8 24.4 M34.2 24.4 Q35.2 22.8 36.8 23.2 M29.8 31.2 Q31.2 31.6 32.0 30.0 M34.0 30.0 Q34.8 31.6 36.2 31.2" stroke="#D9EFC6" strokeOpacity={0.7} strokeWidth={0.9} strokeLinecap="round" />
            <Circle cx={33} cy={27.5} r={1.0} fill="#B8E096" />

            {/* Dainty white clover blossom on slender stem */}
            <Path d="M36.5 43 C38.5 36, 41 26, 43.2 20.5" stroke="#4E8154" strokeWidth={1.35} strokeLinecap="round" />
            <Circle cx={43.5} cy={19.5} r={4.2} fill={`url(#${bloom})`} />
            <Circle cx={41.5} cy={18.2} r={2.0} fill="#FFFFFF" />
            <Circle cx={45.2} cy={18.5} r={1.8} fill="#F9F4E8" />
            <Circle cx={43.5} cy={16.8} r={1.9} fill="#FFFFFF" />
            <Circle cx={43.5} cy={20.2} r={1.4} fill="#F3D6E0" fillOpacity={0.55} />

            {/* Foreground small clover resting on moss */}
            <Ellipse cx={26.5} cy={45.5} rx={3.2} ry={2.0} fill={`url(#${clvSun})`} />
            <Ellipse cx={31.2} cy={46.5} rx={3.0} ry={1.9} fill={`url(#${clvDark})`} />

            {/* Sunlit dew & pollen accents */}
            <Circle cx={28.5} cy={17} r={0.95} fill="#F5EAB2" fillOpacity={0.85} />
            <Circle cx={48.5} cy={16.5} r={0.85} fill="#FFFFFF" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 5. MEADOW DAISY
 * Crisp layered white petals with warm golden domed disk centers and serrated
 * basal leaves
 * ========================================================================== */
function renderMeadowDaisy(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#9AC97D',
      leafMid: '#568B53',
      leafDark: '#2E5B39',
      stem: '#487A4D',
      tipTint: '#F5DA7C',
    });
  }

  const ao = `${uid}_ao`;
  const leafSun = `${uid}_lsun`;
  const leafShd = `${uid}_lshd`;
  const petal = `${uid}_pet`;
  const disk = `${uid}_dsk`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1F2D20" stopOpacity={0.32} />
          <Stop offset="70%" stopColor="#263628" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#263628" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={leafSun} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#94C276" />
          <Stop offset="55%" stopColor="#558751" />
          <Stop offset="100%" stopColor="#2E5938" />
        </LinearGradient>
        <LinearGradient id={leafShd} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#5C8B57" />
          <Stop offset="100%" stopColor="#294F33" />
        </LinearGradient>
        <LinearGradient id={petal} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="70%" stopColor="#F5F2EA" />
          <Stop offset="100%" stopColor="#D9DDD5" />
        </LinearGradient>
        <RadialGradient id={disk} cx="35%" cy="30%" rx="65%" ry="65%">
          <Stop offset="0%" stopColor="#FBE178" />
          <Stop offset="55%" stopColor="#E6AE3C" />
          <Stop offset="100%" stopColor="#B8721A" />
        </RadialGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={19} ry={5.5} fill={`url(#${ao})`} />

        {/* Serrated meadow basal leaves */}
        <Path
          d="M31 53 C25 49, 18 47, 13.5 48.5 C15.5 51.5, 20 53.2, 24.5 53.8 C27.5 54, 30 53.8, 31 53 Z"
          fill={`url(#${leafShd})`}
        />
        <Path
          d="M33 53 C39 49, 46 47, 50.5 48.5 C48.5 51.5, 44 53.2, 39.5 53.8 C36.5 54, 34 53.8, 33 53 Z"
          fill={`url(#${leafShd})`}
        />
        <Path
          d="M31.5 52.5 C26.5 46, 20.5 42.5, 16.5 42.8 C17.8 45.8, 22 49.5, 28 52.5 Z"
          fill={`url(#${leafSun})`}
        />
        <Path
          d="M32.5 52.5 C37.5 46, 43.5 42.5, 47.5 42.8 C46.2 45.8, 42 49.5, 36 52.5 Z"
          fill={`url(#${leafSun})`}
        />
        {/* Leaf midrib veins */}
        <Path d="M29.5 51.5 Q24 47.5 18.5 44.5" stroke="#B7DA9A" strokeOpacity={0.5} strokeWidth={0.8} strokeLinecap="round" />
        <Path d="M34.5 51.5 Q40 47.5 45.5 44.5" stroke="#B7DA9A" strokeOpacity={0.45} strokeWidth={0.8} strokeLinecap="round" />

        {/* Graceful curving stems */}
        <Path d="M31 52 C29 44, 24 38, 19.5 34" stroke="#4D7E52" strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M32 52 C32 42, 32 33, 32 23" stroke="#437349" strokeWidth={2.0} strokeLinecap="round" />
        <Path d="M33 52 C36 44, 41 38.5, 45 35" stroke="#3D6B44" strokeWidth={1.6} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Furled daisy buds in ribbed green sepals */
          <G>
            <Ellipse cx={19.5} cy={31.5} rx={3.0} ry={4.2} fill="#F5F2EA" />
            <Path d="M16.5 33.5 Q19.5 36.2 22.5 33.5" fill="#4E7F53" />
            <Ellipse cx={32} cy={20.2} rx={4.2} ry={5.8} fill={`url(#${petal})`} />
            <Path d="M27.8 23.5 Q32 27.5 36.2 23.5" fill="#46774C" />
            <Path d="M30.5 16.5 Q32 14.8 33.5 16.5" stroke="#E5B95B" strokeWidth={1.1} strokeLinecap="round" />
            <Ellipse cx={45} cy={32.8} rx={2.8} ry={3.8} fill="#ECE9E0" />
            <Path d="M42.2 34.5 Q45 37 47.8 34.5" fill="#427248" />
          </G>
        ) : (
          /* Stage 3: Full layered white daisies with golden domed centers */
          <G>
            {/* Left companion daisy */}
            <G>
              <Ellipse cx={19.5} cy={27.5} rx={2.2} ry={4.2} fill="#DFE3DC" />
              <Ellipse cx={19.5} cy={35.5} rx={2.2} ry={4.2} fill="#DFE3DC" />
              <Ellipse cx={15.2} cy={31.5} rx={4.2} ry={2.2} fill={`url(#${petal})`} />
              <Ellipse cx={23.8} cy={31.5} rx={4.2} ry={2.2} fill={`url(#${petal})`} />
              <Ellipse cx={16.6} cy={28.6} rx={3.2} ry={2.2} fill={`url(#${petal})`} />
              <Ellipse cx={22.4} cy={28.6} rx={3.2} ry={2.2} fill={`url(#${petal})`} />
              <Ellipse cx={16.6} cy={34.4} rx={3.2} ry={2.2} fill="#EFF0EA" />
              <Ellipse cx={22.4} cy={34.4} rx={3.2} ry={2.2} fill="#EFF0EA" />
              <Circle cx={19.5} cy={31.5} r={3.2} fill={`url(#${disk})`} />
              <Circle cx={18.6} cy={30.6} r={0.9} fill="#FFF2B3" />
            </G>

            {/* Right companion daisy */}
            <G>
              <Ellipse cx={45} cy={29.5} rx={2.0} ry={3.8} fill="#DCE0D9" />
              <Ellipse cx={45} cy={36.5} rx={2.0} ry={3.8} fill="#DCE0D9" />
              <Ellipse cx={41.2} cy={33} rx={3.8} ry={2.0} fill={`url(#${petal})`} />
              <Ellipse cx={48.8} cy={33} rx={3.8} ry={2.0} fill={`url(#${petal})`} />
              <Ellipse cx={42.4} cy={30.4} rx={2.8} ry={2.0} fill={`url(#${petal})`} />
              <Ellipse cx={47.6} cy={30.4} rx={2.8} ry={2.0} fill={`url(#${petal})`} />
              <Circle cx={45} cy={33} r={2.9} fill={`url(#${disk})`} />
              <Circle cx={44.2} cy={32.2} r={0.8} fill="#FFF2B3" />
            </G>

            {/* Hero center meadow daisy */}
            <G>
              {/* Back shadow petals */}
              <Path d="M32 21.5 L26 11.5 C28.5 10.5, 31 11.5, 32 15 Z" fill="#DFE3DC" />
              <Path d="M32 21.5 L38 11.5 C35.5 10.5, 33 11.5, 32 15 Z" fill="#DFE3DC" />
              <Path d="M32 21.5 L42.5 16.5 C43.2 19, 42 21.2, 38.5 21.8 Z" fill="#DCE0D8" />
              <Path d="M32 21.5 L42.5 26.5 C41.2 28.8, 38.8 29, 36.2 26.5 Z" fill="#D5D9D1" />
              <Path d="M32 21.5 L21.5 26.5 C22.8 28.8, 25.2 29, 27.8 26.5 Z" fill="#DCE0D8" />
              <Path d="M32 21.5 L21.5 16.5 C20.8 19, 22 21.2, 25.5 21.8 Z" fill="#E3E6DF" />

              {/* Front sunlit crisp white petals */}
              <Ellipse cx={32} cy={14.2} rx={2.7} ry={6.0} fill={`url(#${petal})`} />
              <Ellipse cx={32} cy={28.8} rx={2.7} ry={6.0} fill={`url(#${petal})`} />
              <Ellipse cx={24.5} cy={21.5} rx={6.0} ry={2.7} fill={`url(#${petal})`} />
              <Ellipse cx={39.5} cy={21.5} rx={6.0} ry={2.7} fill={`url(#${petal})`} />
              <Path d="M32 21.5 C28.5 17.2, 24.2 14.5, 25.5 13.2 C26.8 12, 30.2 15.8, 32 21.5 Z" fill="#FFFFFF" />
              <Path d="M32 21.5 C35.5 17.2, 39.8 14.5, 38.5 13.2 C37.2 12, 33.8 15.8, 32 21.5 Z" fill="#FAF8F2" />
              <Path d="M32 21.5 C28.5 25.8, 24.2 28.5, 25.5 29.8 C26.8 31, 30.2 27.2, 32 21.5 Z" fill="#F5F3EC" />
              <Path d="M32 21.5 C35.5 25.8, 39.8 28.5, 38.5 29.8 C37.2 31, 33.8 27.2, 32 21.5 Z" fill="#F1EFE7" />

              {/* Golden domed disk center */}
              <Circle cx={32} cy={21.5} r={5.0} fill={`url(#${disk})`} />
              <Circle cx={30.5} cy={20.0} r={1.8} fill="#FFF3B0" fillOpacity={0.75} />
              {/* Seed stipple accents */}
              <Circle cx={33.2} cy={22.4} r={0.55} fill="#A36114" fillOpacity={0.65} />
              <Circle cx={31.2} cy={23.2} r={0.55} fill="#A36114" fillOpacity={0.6} />
              <Circle cx={34.0} cy={20.6} r={0.5} fill="#A36114" fillOpacity={0.55} />
            </G>

            {/* Floating sunlit pollen */}
            <Circle cx={24} cy={10.5} r={0.95} fill="#F9DC75" fillOpacity={0.85} />
            <Circle cx={42} cy={12} r={0.85} fill="#FFF6D1" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 6. CHAMOMILE TUFT
 * Feathery foliage tuft with dainty golden-domed chamomile heads at varied
 * heights
 * ========================================================================== */
function renderChamomileTuft(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#A5D184',
      leafMid: '#5E945A',
      leafDark: '#36643F',
      stem: '#4D8051',
      tipTint: '#F2C95A',
    });
  }

  const ao = `${uid}_ao`;
  const tuft = `${uid}_tft`;
  const dome = `${uid}_dom`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1F2D20" stopOpacity={0.32} />
          <Stop offset="70%" stopColor="#263628" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#263628" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={tuft} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#8DBF73" />
          <Stop offset="55%" stopColor="#528452" />
          <Stop offset="100%" stopColor="#2F593A" />
        </LinearGradient>
        <RadialGradient id={dome} cx="35%" cy="28%" rx="65%" ry="65%">
          <Stop offset="0%" stopColor="#FCE076" />
          <Stop offset="55%" stopColor="#E3A836" />
          <Stop offset="100%" stopColor="#B46F19" />
        </RadialGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={19} ry={5.5} fill={`url(#${ao})`} />

        {/* Feathery foliage tuft base */}
        <Path
          d="M17 53 C19 47, 25 45, 32 45 C39 45, 45 47, 47 53 C42 55.5, 22 55.5, 17 53 Z"
          fill={`url(#${tuft})`}
        />
        {/* Delicate feathery leaf wisps */}
        <Path
          d="M24 50 C19 46, 15 44, 12 44.5 M21 47 L17 42.5 M26 48 C22 42, 20 38, 17.5 37 M40 50 C45 46, 49 44, 52 44.5 M43 47 L47 42.5 M38 48 C42 42, 44 38, 46.5 37"
          stroke="#5C8F59"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <Path
          d="M28 49 C25 44, 23 41, 21 39.5 M36 49 C39 44, 41 41, 43 39.5"
          stroke="#89BB72"
          strokeWidth={1.25}
          strokeLinecap="round"
        />

        {/* Slender arching chamomile stems */}
        <Path d="M27 49 C23 41, 19 35, 16.5 30" stroke="#538457" strokeWidth={1.4} strokeLinecap="round" />
        <Path d="M30 49 C28 38, 26.5 29, 25 22" stroke="#4D7E52" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M32 49 C33 36, 34 25, 35.5 16.5" stroke="#46764C" strokeWidth={1.65} strokeLinecap="round" />
        <Path d="M34 49 C38 40, 42 33, 45.5 27" stroke="#48784E" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M36 50 C41 44, 46 39, 49.5 35.5" stroke="#3F6E46" strokeWidth={1.35} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Golden-green button buds */
          <G>
            <Circle cx={16.5} cy={29.5} r={2.4} fill="#D5B85B" />
            <Circle cx={25} cy={21.5} r={2.8} fill="#E4C158" />
            <Circle cx={35.5} cy={16} r={3.3} fill={`url(#${dome})`} />
            <Circle cx={45.5} cy={26.5} r={2.7} fill="#D9B652" />
            <Circle cx={49.5} cy={35} r={2.2} fill="#C9AF5A" />
            {/* Tiny emerging white tips */}
            <Circle cx={33.2} cy={17.8} r={1.0} fill="#FFFDF7" />
            <Circle cx={37.8} cy={17.8} r={1.0} fill="#FFFDF7" />
          </G>
        ) : (
          /* Stage 3: 5 dainty reflexed chamomile blossoms with glowing golden cones */
          <G>
            {/* Bloom 1 (far left) */}
            <Ellipse cx={12.5} cy={30.8} rx={3.0} ry={1.5} fill="#F9F6EE" />
            <Ellipse cx={20.2} cy={30.8} rx={3.0} ry={1.5} fill="#F2EFE5" />
            <Ellipse cx={14.5} cy={32.6} rx={2.5} ry={1.4} fill="#ECE9DF" />
            <Ellipse cx={18.5} cy={32.6} rx={2.5} ry={1.4} fill="#E6E3D9" />
            <Ellipse cx={16.5} cy={29.2} rx={2.8} ry={3.0} fill={`url(#${dome})`} />
            <Circle cx={15.8} cy={28.2} r={0.85} fill="#FFF5BC" />

            {/* Bloom 2 (upper left) */}
            <Ellipse cx={20.5} cy={22.8} rx={3.5} ry={1.7} fill="#FFFFFF" />
            <Ellipse cx={29.5} cy={22.8} rx={3.5} ry={1.7} fill="#F5F2E8" />
            <Ellipse cx={22.8} cy={25.0} rx={2.8} ry={1.6} fill="#EFECE2" />
            <Ellipse cx={27.2} cy={25.0} rx={2.8} ry={1.6} fill="#E9E6DC" />
            <Ellipse cx={25} cy={21.0} rx={3.3} ry={3.5} fill={`url(#${dome})`} />
            <Circle cx={24.1} cy={19.8} r={1.0} fill="#FFF6C2" />

            {/* Bloom 3 (hero center-top) */}
            <Ellipse cx={30.2} cy={17.8} rx={4.2} ry={1.9} fill="#FFFFFF" />
            <Ellipse cx={40.8} cy={17.8} rx={4.2} ry={1.9} fill="#F6F3EA" />
            <Ellipse cx={32.4} cy={20.4} rx={3.2} ry={1.8} fill="#F0EDE4" />
            <Ellipse cx={38.6} cy={20.4} rx={3.2} ry={1.8} fill="#E8E5DC" />
            <Ellipse cx={35.5} cy={21.0} rx={1.9} ry={2.8} fill="#ECEAE2" />
            <Ellipse cx={35.5} cy={15.6} rx={3.8} ry={4.2} fill={`url(#${dome})`} />
            <Circle cx={34.3} cy={14.2} r={1.2} fill="#FFF7C8" />

            {/* Bloom 4 (mid right) */}
            <Ellipse cx={41.2} cy={28.0} rx={3.4} ry={1.6} fill="#FFFFFF" />
            <Ellipse cx={49.8} cy={28.0} rx={3.4} ry={1.6} fill="#F2EFE6" />
            <Ellipse cx={43.5} cy={30.2} rx={2.6} ry={1.5} fill="#EAE7DE" />
            <Ellipse cx={47.5} cy={30.2} rx={2.6} ry={1.5} fill="#E4E1D8" />
            <Ellipse cx={45.5} cy={26.4} rx={3.1} ry={3.3} fill={`url(#${dome})`} />
            <Circle cx={44.6} cy={25.4} r={0.95} fill="#FFF5BE" />

            {/* Bloom 5 (lower right) */}
            <Ellipse cx={46.2} cy={36.4} rx={2.8} ry={1.4} fill="#F8F5ED" />
            <Ellipse cx={52.8} cy={36.4} rx={2.8} ry={1.4} fill="#ECE9E0" />
            <Ellipse cx={49.5} cy={35.0} rx={2.5} ry={2.7} fill={`url(#${dome})`} />
            <Circle cx={48.8} cy={34.2} r={0.75} fill="#FFF3B8" />

            {/* Sunlit pollen motes */}
            <Circle cx={28} cy={12} r={0.95} fill="#FBE07A" fillOpacity={0.85} />
            <Circle cx={44} cy={16} r={0.85} fill="#FFF6CC" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 7. ROSEMARY SPRIG
 * Woody upright stems with dense silvery-green needle clusters and tiny pale
 * blue flowers
 * ========================================================================== */
function renderRosemarySprig(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#B4CCB6',
      leafMid: '#6E947A',
      leafDark: '#3E624D',
      stem: '#6D5441',
      tipTint: '#9DBBE8',
    });
  }

  const ao = `${uid}_ao`;
  const soil = `${uid}_soil`;
  const wood = `${uid}_wood`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1E2C22" stopOpacity={0.32} />
          <Stop offset="70%" stopColor="#27362A" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#27362A" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={soil} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#9E8267" />
          <Stop offset="100%" stopColor="#594433" />
        </LinearGradient>
        <LinearGradient id={wood} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8E6E54" />
          <Stop offset="100%" stopColor="#4B3728" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={18} ry={5.2} fill={`url(#${ao})`} />

        {/* Mediterranean sandy-earth base */}
        <Path
          d="M21 54.2 C23 50.2, 28 49, 32 49 C36 49, 41 50.2, 43 54.2 C38.5 55.8, 25.5 55.8, 21 54.2 Z"
          fill={`url(#${soil})`}
        />

        {/* Woody upright branching stems */}
        <Path d="M32 52 C32 44, 32 30, 32 13" stroke={`url(#${wood})`} strokeWidth={2.3} strokeLinecap="round" />
        <Path d="M31.5 46 C27 40, 22.5 32, 19.5 22" stroke={`url(#${wood})`} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M32.5 45 C37 39, 41.5 31, 44.5 22" stroke={`url(#${wood})`} strokeWidth={1.8} strokeLinecap="round" />

        {/* Dense dark shadow rosemary needles */}
        <G stroke="#3B614C" strokeWidth={1.8} strokeLinecap="round">
          <Path d="M32 44 L25 40 M32 44 L39 40 M32 37 L24 32 M32 37 L40 32 M32 30 L24.5 25 M32 30 L39.5 25 M32 23 L25.5 18 M32 23 L38.5 18 M32 16 L27.5 12 M32 16 L36.5 12" />
          <Path d="M24 35 L17.5 32 M22 29 L15.5 26 M20.5 24 L15 20.5" />
          <Path d="M40 35 L46.5 32 M42 29 L48.5 26 M43.5 24 L49 20.5" />
        </G>

        {/* Silvery-sage sunlit upper needle whorls */}
        <G stroke="#8FB298" strokeWidth={1.55} strokeLinecap="round">
          <Path d="M31.5 41 L25.5 36.5 M32.5 41 L38.5 36.5 M31.5 34 L25 28.5 M32.5 34 L39 28.5 M31.5 27 L25.5 21.5 M32.5 27 L38.5 21.5 M31.5 20 L26.5 14.5 M32.5 20 L37.5 14.5" />
          <Path d="M23.5 32 L18.5 27.5 M21.5 26.5 L17.5 22 M20 22 L17 17.5" />
          <Path d="M40.5 32 L45.5 27.5 M42.5 26.5 L46.5 22 M44 22 L47 17.5" />
        </G>

        {/* Bright glaucous needle highlights */}
        <G stroke="#C3DAC4" strokeWidth={0.95} strokeLinecap="round" strokeOpacity={0.8}>
          <Path d="M31 32 L26.5 27.5 M31 25 L26.8 20.5 M31 18 L27.5 13.5 M21 25 L17.8 21" />
        </G>

        {stage === 2 ? (
          /* Stage 2: Tiny pale-blue rosemary buds in leaf axils */
          <G>
            <Circle cx={29.5} cy={22.5} r={1.3} fill="#9AB5DE" />
            <Circle cx={34.5} cy={26.5} r={1.3} fill="#89A6D4" />
            <Circle cx={21.5} cy={27.5} r={1.2} fill="#9AB5DE" />
            <Circle cx={42.5} cy={27.5} r={1.2} fill="#89A6D4" />
          </G>
        ) : (
          /* Stage 3: Delicate pale-blue two-lipped rosemary blossoms + sunlit accents */
          <G>
            {/* Center sprig flowers */}
            <Ellipse cx={29.2} cy={19.5} rx={2.2} ry={1.4} fill="#B3CCF2" />
            <Circle cx={28.5} cy={19.0} r={0.9} fill="#E5F0FF" />
            <Ellipse cx={35.0} cy={24.5} rx={2.2} ry={1.4} fill="#96B5E6" />
            <Circle cx={34.4} cy={24.0} r={0.85} fill="#DCEBFF" />
            <Ellipse cx={29.0} cy={31.2} rx={2.0} ry={1.3} fill="#A4C1ED" />
            <Circle cx={32.0} cy={12.0} r={1.8} fill="#BDD5F7" />
            <Circle cx={31.5} cy={11.5} r={0.75} fill="#FFFFFF" />

            {/* Left sprig flowers */}
            <Ellipse cx={19.2} cy={21.5} rx={2.0} ry={1.3} fill="#AEC9F0" />
            <Circle cx={18.7} cy={21.0} r={0.8} fill="#EAF2FF" />
            <Ellipse cx={23.2} cy={29.5} rx={1.9} ry={1.2} fill="#96B5E6" />

            {/* Right sprig flowers */}
            <Ellipse cx={44.8} cy={22.0} rx={2.0} ry={1.3} fill="#9EBCEB" />
            <Circle cx={44.3} cy={21.5} r={0.75} fill="#E3EEFF" />
            <Ellipse cx={40.8} cy={30.0} rx={1.9} ry={1.2} fill="#8AA9DC" />

            {/* Sunlit aromatic motes */}
            <Circle cx={25.5} cy={11.5} r={0.9} fill="#E4F0FF" fillOpacity={0.85} />
            <Circle cx={41.5} cy={14.5} r={0.85} fill="#F5EBBE" fillOpacity={0.8} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 8. MORNING GLORY
 * Graceful curling vine on a small bamboo stake with trumpet-shaped sky-indigo
 * blossoms & heart leaves
 * ========================================================================== */
function renderMorningGlory(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#8EC474',
      leafMid: '#4E874E',
      leafDark: '#2B5936',
      stem: '#467B4A',
      tipTint: '#7A96E6',
      vineCurl: true,
    });
  }

  const ao = `${uid}_ao`;
  const bamboo = `${uid}_bmb`;
  const leaf = `${uid}_lf`;
  const trumpet = `${uid}_trp`;
  const throat = `${uid}_thr`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1D2B1F" stopOpacity={0.32} />
          <Stop offset="70%" stopColor="#263628" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#263628" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={bamboo} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#DFC48A" />
          <Stop offset="55%" stopColor="#B8995E" />
          <Stop offset="100%" stopColor="#7C6338" />
        </LinearGradient>
        <LinearGradient id={leaf} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#8CC173" />
          <Stop offset="55%" stopColor="#4B834E" />
          <Stop offset="100%" stopColor="#295435" />
        </LinearGradient>
        <RadialGradient id={trumpet} cx="42%" cy="40%" rx="60%" ry="60%">
          <Stop offset="0%" stopColor="#A9C4FA" />
          <Stop offset="55%" stopColor="#5C7AD6" />
          <Stop offset="100%" stopColor="#3B4D9E" />
        </RadialGradient>
        <RadialGradient id={throat} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#FFF7C7" />
          <Stop offset="70%" stopColor="#F0E9FF" />
          <Stop offset="100%" stopColor="#8EA8F0" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={19} ry={5.5} fill={`url(#${ao})`} />

        {/* Small shaded earth mound */}
        <Ellipse cx={32} cy={53} rx={12} ry={3.6} fill="#5E4634" />

        {/* Segmented bamboo stake */}
        <Path d="M33 53 L36 11" stroke={`url(#${bamboo})`} strokeWidth={3.2} strokeLinecap="round" />
        <Line x1={32.4} y1={43} x2={36.0} y2={43.2} stroke="#6E552E" strokeWidth={1.1} />
        <Line x1={33.3} y1={31} x2={36.8} y2={31.2} stroke="#6E552E" strokeWidth={1.1} />
        <Line x1={34.2} y1={19} x2={37.6} y2={19.2} stroke="#6E552E" strokeWidth={1.1} />

        {/* Curling emerald vine wrapping the stake */}
        <Path
          d="M28 52 C24 46, 39 43, 38 37 C37 31, 24 29, 27 22 C30 16, 41 16, 42 11.5"
          stroke="#467A4B"
          strokeWidth={1.85}
          strokeLinecap="round"
        />
        {/* Delicate curling tendril */}
        <Path
          d="M41.5 13 C44.5 11.5, 46.5 13.5, 45 15.2 C43.8 16.2, 42.5 15, 43.6 14.2"
          stroke="#689E62"
          strokeWidth={1.1}
          strokeLinecap="round"
        />

        {/* Heart-shaped leaves */}
        <Path
          d="M27 44 C21 42, 16.5 45.5, 19.5 49.5 C21.8 51.5, 25.5 49.5, 27.5 46 Z"
          fill={`url(#${leaf})`}
        />
        <Path
          d="M38 38 C44 35.5, 48.5 39, 45.8 43.2 C43.5 45.5, 39.5 43.5, 37.5 40 Z"
          fill={`url(#${leaf})`}
        />
        <Path
          d="M27 29 C21.5 27.5, 18.5 31, 21.2 34.2 C23.2 35.8, 26.2 33.8, 27.8 30.8 Z"
          fill={`url(#${leaf})`}
        />
        <Path
          d="M37 22 C42.5 19.5, 47 22.5, 44.5 26.5 C42.5 28.5, 39 26.8, 37 23.8 Z"
          fill={`url(#${leaf})`}
        />
        {/* Subtle leaf veins */}
        <Path d="M26 45.5 Q22.5 46.5 20.2 48.2 M38.8 39.5 Q42.5 40.2 44.8 41.8" stroke="#B4DC98" strokeOpacity={0.5} strokeWidth={0.8} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Twisted spiralled indigo-violet buds */
          <G>
            <Path d="M26 24 C22 21, 18 19, 17.5 16.5 C20.5 16.5, 24.5 19.5, 27 23 Z" fill={`url(#${trumpet})`} />
            <Path d="M38 17 C41.5 13.5, 45.5 12, 47 13.5 C45.5 16.5, 41.5 18.5, 38 18.5 Z" fill={`url(#${trumpet})`} />
            <Path d="M36 33 C40.5 30.5, 44.5 29.8, 45.5 31.8 C43.5 34.2, 39.5 35, 36.2 34.5 Z" fill="#526EC7" />
          </G>
        ) : (
          /* Stage 3: 3 radiant sky-indigo trumpet blossoms with luminous star throats */
          <G>
            {/* Upper-left hero morning glory */}
            <G>
              <Path
                d="M26.5 22.5 C21 23, 15.5 19.5, 16.5 14.5 C17.5 10.2, 24 9.5, 28 13.2 C31.2 16.2, 30.5 21.8, 26.5 22.5 Z"
                fill={`url(#${trumpet})`}
              />
              <Circle cx={23.2} cy={16.2} r={3.6} fill={`url(#${throat})`} />
              <Path
                d="M23.2 16.2 L18.5 14.5 M23.2 16.2 L22.5 11.5 M23.2 16.2 L27.5 14.8 M23.2 16.2 L25.5 20.5 M23.2 16.2 L19.8 19.8"
                stroke="#E4ECFF"
                strokeOpacity={0.75}
                strokeWidth={0.85}
                strokeLinecap="round"
              />
              <Circle cx={23.2} cy={16.2} r={1.2} fill="#FFF2B2" />
            </G>

            {/* Right-middle morning glory */}
            <G>
              <Path
                d="M38.5 31.5 C43.5 32, 48.5 29, 47.8 24.5 C47.2 20.8, 41.5 20.2, 37.8 23.5 C34.8 26.2, 35.2 31, 38.5 31.5 Z"
                fill={`url(#${trumpet})`}
              />
              <Circle cx={41.8} cy={26.0} r={3.1} fill={`url(#${throat})`} />
              <Circle cx={41.8} cy={26.0} r={1.0} fill="#FFF2B2" />
            </G>

            {/* Lower-left blossom */}
            <G>
              <Path
                d="M24 39.5 C19.5 39.8, 15.8 37, 16.5 33.2 C17.2 30, 22 29.8, 25 32.8 C27.2 35, 26.8 39, 24 39.5 Z"
                fill={`url(#${trumpet})`}
              />
              <Circle cx={21.2} cy={34.8} r={2.4} fill={`url(#${throat})`} />
              <Circle cx={21.2} cy={34.8} r={0.85} fill="#FFF2B2" />
            </G>

            {/* Sunlit morning motes */}
            <Circle cx={30} cy={9.5} r={0.95} fill="#D5E3FF" fillOpacity={0.85} />
            <Circle cx={48.5} cy={19} r={0.85} fill="#FFF4C2" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 9. SAKURA SAPLING
 * Graceful dark cherry bark trunk with layered blush-pink sakura cloud
 * canopies & drifting petals
 * ========================================================================== */
function renderSakuraSapling(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#A8CA8A',
      leafMid: '#689361',
      leafDark: '#3E6444',
      stem: '#5C3F3B',
      tipTint: '#F4B6C7',
    });
  }

  const ao = `${uid}_ao`;
  const bark = `${uid}_brk`;
  const cloudDark = `${uid}_cldD`;
  const cloudMid = `${uid}_cldM`;
  const cloudSun = `${uid}_cldS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#261D22" stopOpacity={0.32} />
          <Stop offset="70%" stopColor="#32262C" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#32262C" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={bark} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#724F4A" />
          <Stop offset="55%" stopColor="#4D3230" />
          <Stop offset="100%" stopColor="#2E1C1C" />
        </LinearGradient>
        <LinearGradient id={cloudDark} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#DF94A8" />
          <Stop offset="100%" stopColor="#A85C74" />
        </LinearGradient>
        <LinearGradient id={cloudMid} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#FBD2DD" />
          <Stop offset="55%" stopColor="#EE9FB6" />
          <Stop offset="100%" stopColor="#C8758E" />
        </LinearGradient>
        <LinearGradient id={cloudSun} x1="10%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#FFF5F8" />
          <Stop offset="55%" stopColor="#FAD0DC" />
          <Stop offset="100%" stopColor="#E69BB1" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={20} ry={5.5} fill={`url(#${ao})`} />

        {/* Mossy root mound */}
        <Ellipse cx={32} cy={53.8} rx={12} ry={3.2} fill="#5C7D53" />

        {/* Graceful dark cherry bark trunk & branches */}
        <Path
          d="M28 54 C29.8 50, 30.8 44, 30.2 38 C29.8 33.5, 28 29.5, 26.5 26 L28.5 25 C30 28, 31.8 31.5, 32.5 34.5 C34 30, 36.5 26, 39.5 23 L41 24.5 C37.8 28, 35.2 32.5, 34 38.5 C33.4 44, 34.5 50, 36.5 54 Z"
          fill={`url(#${bark})`}
        />
        <Path d="M30 33 C25 30, 20 28.5, 16.5 28" stroke={`url(#${bark})`} strokeWidth={2.0} strokeLinecap="round" />
        <Path d="M33.5 31 C38 28, 43 27, 47 27.5" stroke={`url(#${bark})`} strokeWidth={1.8} strokeLinecap="round" />
        {/* Cherry bark lenticel highlights */}
        <Path d="M30.5 46 L32.8 46 M30.8 41.5 L33 41.5" stroke="#9C746E" strokeOpacity={0.55} strokeWidth={0.9} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Plump rose-pink cherry buds along dark twigs */
          <G>
            <Circle cx={17} cy={27.5} r={2.2} fill="#E488A2" />
            <Circle cx={21.5} cy={26.2} r={2.0} fill="#F2B0C3" />
            <Circle cx={26.5} cy={24.2} r={2.5} fill="#EB95AE" />
            <Circle cx={31.5} cy={22} r={2.6} fill="#F6BDD0" />
            <Circle cx={38.5} cy={22.5} r={2.4} fill="#E488A2" />
            <Circle cx={43.5} cy={25.5} r={2.1} fill="#F2B0C3" />
            <Circle cx={47} cy={27.5} r={2.0} fill="#D87893" />
            <Circle cx={34.5} cy={18.5} r={2.2} fill="#FBD5E0" />
          </G>
        ) : (
          /* Stage 3: Lush layered blush-pink sakura cloud canopies & drifting petals */
          <G>
            {/* Back shadow sakura canopy */}
            <Path
              d="M11 31 C9.5 25.5, 14 20.5, 20 21 C22 15.5, 29.5 12.5, 36 14.5 C41.5 13, 48.5 16.5, 49.5 22.5 C53.5 24.5, 53 31, 47.5 33.2 C42 35.2, 18 35.2, 11 31 Z"
              fill={`url(#${cloudDark})`}
            />
            {/* Midtone lush blush-pink cloud puffs */}
            <Circle cx={18.5} cy={26.5} r={7.2} fill={`url(#${cloudMid})`} />
            <Circle cx={45.5} cy={26.8} r={6.8} fill={`url(#${cloudMid})`} />
            <Circle cx={28} cy={19.5} r={8.8} fill={`url(#${cloudMid})`} />
            <Circle cx={38.5} cy={20.2} r={8.2} fill={`url(#${cloudMid})`} />
            <Circle cx={32.5} cy={25.5} r={7.5} fill={`url(#${cloudMid})`} />

            {/* Sunlit top-left sakura petal crowns */}
            <Circle cx={26.5} cy={16.5} r={5.8} fill={`url(#${cloudSun})`} />
            <Circle cx={17.5} cy={24.5} r={4.4} fill={`url(#${cloudSun})`} />
            <Circle cx={36.5} cy={17.5} r={4.8} fill={`url(#${cloudSun})`} />

            {/* Crisp individual 5-petal sakura blossom accents */}
            <G>
              <Circle cx={25.5} cy={16.5} r={1.8} fill="#FFFFFF" fillOpacity={0.85} />
              <Circle cx={25.5} cy={16.5} r={0.65} fill="#E07D96" />
              <Circle cx={36.5} cy={18.2} r={1.7} fill="#FFF7FA" fillOpacity={0.85} />
              <Circle cx={36.5} cy={18.2} r={0.6} fill="#E07D96" />
              <Circle cx={18.5} cy={25.0} r={1.6} fill="#FFF7FA" fillOpacity={0.8} />
              <Circle cx={18.5} cy={25.0} r={0.55} fill="#E07D96" />
              <Circle cx={44.5} cy={24.5} r={1.5} fill="#FFEBF1" fillOpacity={0.75} />
              <Circle cx={44.5} cy={24.5} r={0.55} fill="#D9738D" />
            </G>

            {/* Drifting sakura petals in the breeze */}
            <Ellipse cx={12.5} cy={38.5} rx={2.0} ry={1.1} fill="#F9C5D4" />
            <Ellipse cx={49.5} cy={37.0} rx={1.8} ry={1.0} fill="#F5B2C5" />
            <Ellipse cx={43.0} cy={45.5} rx={1.7} ry={0.95} fill="#FAD0DC" />
            <Circle cx={21} cy={10.5} r={0.9} fill="#FFF2F6" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 10. MOONFLOWER VINE
 * Velvety deep-teal heart leaves with luminous pearlescent cream trumpet
 * blooms
 * ========================================================================== */
function renderMoonflowerVine(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#6CA89E',
      leafMid: '#37736B',
      leafDark: '#1C4542',
      stem: '#2D5E59',
      tipTint: '#F8F4DF',
      vineCurl: true,
    });
  }

  const ao = `${uid}_ao`;
  const leafSun = `${uid}_lsun`;
  const leafShd = `${uid}_lshd`;
  const moon = `${uid}_moon`;
  const glow = `${uid}_glw`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#122424" stopOpacity={0.35} />
          <Stop offset="70%" stopColor="#1B3030" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#1B3030" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={leafSun} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#65A198" />
          <Stop offset="55%" stopColor="#2F6A64" />
          <Stop offset="100%" stopColor="#183D3B" />
        </LinearGradient>
        <LinearGradient id={leafShd} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3B736C" />
          <Stop offset="100%" stopColor="#163634" />
        </LinearGradient>
        <RadialGradient id={moon} cx="42%" cy="38%" rx="60%" ry="60%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="58%" stopColor="#F5F3E4" />
          <Stop offset="100%" stopColor="#C9DEC7" />
        </RadialGradient>
        <RadialGradient id={glow} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#FFFCE6" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#FFFCE6" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={19} ry={5.5} fill={`url(#${ao})`} />

        {/* Twilight mossy mound */}
        <Ellipse cx={32} cy={53.2} rx={13} ry={3.8} fill="#254A46" />

        {/* Curved rustic trellis twig & curling vine */}
        <Path d="M25 53 C20 40, 24 22, 36 12" stroke="#4D3E36" strokeWidth={2.2} strokeLinecap="round" />
        <Path d="M37 53 C42 42, 41 28, 34 15" stroke="#2B5B56" strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M29 52 C33 44, 24 37, 26 28 C28 20, 38 19, 43 14" stroke="#3B756E" strokeWidth={1.6} strokeLinecap="round" />
        {/* Delicate vine tendril */}
        <Path d="M43 14 C46 12.5, 48 15, 46 16.5 C44.5 17.5, 43.5 16, 44.8 15.2" stroke="#6AA69D" strokeWidth={1.05} strokeLinecap="round" />

        {/* Velvety deep-teal heart leaves */}
        <Path d="M25 45 C18 42.5, 13.5 46.5, 16.8 51 C19.5 53.2, 24 50.5, 26 47 Z" fill={`url(#${leafShd})`} />
        <Path d="M39 43 C46 40.5, 50.5 44.5, 47.2 49 C44.5 51.2, 40 48.5, 38 45 Z" fill={`url(#${leafSun})`} />
        <Path d="M25 32 C18.5 29, 14 33, 17 37.5 C19.5 39.8, 24 37.2, 26 34 Z" fill={`url(#${leafSun})`} />
        <Path d="M38 28 C44.5 25, 49.5 28.8, 46.5 33.5 C44 35.8, 39.5 33.2, 37.5 30 Z" fill={`url(#${leafShd})`} />
        <Path d="M32 19 C28 13, 32 9.5, 36.2 12.5 C38 14.8, 35.8 18.2, 32.8 19.5 Z" fill={`url(#${leafSun})`} />
        {/* Moonlit leaf veins */}
        <Path d="M24.5 33.5 Q20.5 34.5 18 36.5 M39.5 44.5 Q43.5 45.2 46 47.2" stroke="#93C9C0" strokeOpacity={0.45} strokeWidth={0.8} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Slender luminous spiralled cream buds */
          <G>
            <Path d="M27 27 C23 23.5, 18.5 21, 17 18.5 C20.5 18.2, 25 21.5, 28 25.5 Z" fill={`url(#${moon})`} />
            <Path d="M37 22 C41 18.5, 45.5 16.5, 47.5 18 C45.5 21, 41 23.5, 37 23.5 Z" fill={`url(#${moon})`} />
          </G>
        ) : (
          /* Stage 3: Luminous pearlescent cream moonflower trumpet blooms */
          <G>
            {/* Soft lunar halos */}
            <Circle cx={24.5} cy={22.5} r={10.5} fill={`url(#${glow})`} />
            <Circle cx={40.5} cy={35.5} r={8.5} fill={`url(#${glow})`} />

            {/* Hero upper-left moonflower bloom */}
            <Path
              d="M24.5 13.8 C27.2 15.2, 30.8 15.8, 32.2 18.5 C33.5 21.2, 31.8 25.2, 29.5 27.5 C27 29.8, 22 29.8, 19.5 27.5 C17.2 25.2, 15.5 21.2, 16.8 18.5 C18.2 15.8, 21.8 15.2, 24.5 13.8 Z"
              fill={`url(#${moon})`}
            />
            {/* Delicate pale-celadon 5-star throat rays */}
            <Path
              d="M24.5 22.2 L24.5 15.5 M24.5 22.2 L30.5 19.5 M24.5 22.2 L28.2 27.2 M24.5 22.2 L20.8 27.2 M24.5 22.2 L18.5 19.5"
              stroke="#B5D4B8"
              strokeOpacity={0.75}
              strokeWidth={1.0}
              strokeLinecap="round"
            />
            <Circle cx={24.5} cy={22.2} r={2.2} fill="#E9F2C9" />
            <Circle cx={24.5} cy={22.2} r={1.0} fill="#FFFCE6" />

            {/* Companion lower-right moonflower bloom */}
            <Path
              d="M40.5 28.8 C42.8 30, 45.5 30.5, 46.5 32.8 C47.5 35, 46 38.2, 44 39.8 C42 41.5, 38.2 41.5, 36.2 39.8 C34.5 38.2, 33.2 35, 34.2 32.8 C35.2 30.5, 38.2 30, 40.5 28.8 Z"
              fill={`url(#${moon})`}
            />
            <Path
              d="M40.5 35.5 L40.5 30.5 M40.5 35.5 L45 33.5 M40.5 35.5 L43.5 39.2 M40.5 35.5 L37.5 39.2 M40.5 35.5 L36 33.5"
              stroke="#B5D4B8"
              strokeOpacity={0.7}
              strokeWidth={0.9}
              strokeLinecap="round"
            />
            <Circle cx={40.5} cy={35.5} r={1.7} fill="#E9F2C9" />

            {/* Starlit lunar motes */}
            <Circle cx={15} cy={13.5} r={1.0} fill="#FFFCE6" fillOpacity={0.9} />
            <Circle cx={48.5} cy={22} r={0.9} fill="#E2F2EE" fillOpacity={0.85} />
            <Circle cx={33} cy={9} r={0.8} fill="#FFFCE6" fillOpacity={0.8} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 11. WEEPING WILLOW
 * Sculpted gnarled trunk with sweeping cascading curtain fronds of sunlit
 * willow green
 * ========================================================================== */
function renderWeepingWillow(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#B4DA7E',
      leafMid: '#6CA15A',
      leafDark: '#3A6B40',
      stem: '#6D5540',
      tipTint: '#CBE68C',
      soilVariant: 'moss',
    });
  }

  const ao = `${uid}_ao`;
  const bark = `${uid}_brk`;
  const crownDark = `${uid}_crnD`;
  const crownMid = `${uid}_crnM`;
  const crownSun = `${uid}_crnS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1C2B1D" stopOpacity={0.34} />
          <Stop offset="70%" stopColor="#263727" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#263727" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={bark} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#8C7158" />
          <Stop offset="55%" stopColor="#614A38" />
          <Stop offset="100%" stopColor="#3B2B1F" />
        </LinearGradient>
        <LinearGradient id={crownDark} x1="20%" y1="0%" x2="80%" y2="100%">
          <Stop offset="0%" stopColor="#4F824E" />
          <Stop offset="100%" stopColor="#264D32" />
        </LinearGradient>
        <LinearGradient id={crownMid} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#84B865" />
          <Stop offset="55%" stopColor="#52884F" />
          <Stop offset="100%" stopColor="#2F5D3A" />
        </LinearGradient>
        <LinearGradient id={crownSun} x1="10%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#CBE485" />
          <Stop offset="60%" stopColor="#86B964" />
          <Stop offset="100%" stopColor="#4B804B" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={21} ry={5.5} fill={`url(#${ao})`} />

        {/* Mossy riverbank mound */}
        <Ellipse cx={32} cy={53.6} rx={14} ry={3.5} fill="#4D784B" />

        {/* Sculpted leaning gnarled trunk & root toes */}
        <Path
          d="M25 54 C28 50.5, 29.5 44.5, 29.8 38 C30 32.5, 29 27.5, 27 23.5 L30.5 22.5 C32 25.5, 33.2 28, 34 30 C35.5 27, 37.5 24, 40 22 L42 24 C38.8 27.5, 36.2 32, 35.2 38 C34.5 44, 36.5 50.5, 39.5 54 Z"
          fill={`url(#${bark})`}
        />
        {/* Sunlit trunk bark ridge */}
        <Path
          d="M29.5 50 C30.8 44, 31 37, 30.2 30"
          stroke="#B39579"
          strokeOpacity={0.5}
          strokeWidth={1.1}
          strokeLinecap="round"
        />

        {stage === 2 ? (
          /* Stage 2: Arching willow boughs with budding catkins & young leaves */
          <G>
            <Path d="M29 24 C22 22, 16 26, 14 35" stroke="#5E8A52" strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M31 23 C26 17, 19 20, 18 30" stroke="#75A65E" strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M34 22 C37 16, 44 19, 46 31" stroke="#649456" strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M36 24 C43 22, 48 26, 50 36" stroke="#4D7B48" strokeWidth={1.6} strokeLinecap="round" />
            {/* Silky willow catkins */}
            <Ellipse cx={15.5} cy={31} rx={1.3} ry={2.2} fill="#DCE8B0" />
            <Ellipse cx={20} cy={25} rx={1.3} ry={2.2} fill="#CBE09C" />
            <Ellipse cx={44.5} cy={26} rx={1.3} ry={2.2} fill="#D4E5A4" />
            <Ellipse cx={49} cy={32} rx={1.2} ry={2.0} fill="#B8D48C" />
          </G>
        ) : (
          /* Stage 3: Full sweeping weeping willow curtain canopy */
          <G>
            {/* Deep inner shadow curtain behind trunk */}
            <Path
              d="M12 37 C11 23, 19 12, 32 12 C45 12, 53 23, 52 37 C50 42, 46.5 44, 44 41 C42.5 34, 40 28, 32 28 C24 28, 21.5 34, 20 41 C17.5 44, 14 42, 12 37 Z"
              fill={`url(#${crownDark})`}
            />

            {/* Midtone dome & cascading willow curtains */}
            <Path
              d="M11 35 C11 21, 20 11, 32 11 C44 11, 53 21, 53 35 C51.5 37, 49.5 35.5, 48.5 32 C47 38, 44.5 43, 42.5 44 C41.5 38, 40.5 31, 38.5 27 C37 33, 35.5 39, 34 40 C33 34, 32 27, 30.5 26 C29 32, 27.5 38, 25.5 41 C24.2 35, 23 29, 21.5 27 C19.5 33, 18 40, 16 43 C14 41, 12.5 38, 11 35 Z"
              fill={`url(#${crownMid})`}
            />

            {/* Sunlit top-left willow crown & outer wisps */}
            <Path
              d="M14.5 27 C16 17, 23 11.5, 32 11.5 C38 11.5, 43.5 14.5, 46 20 C41 18, 35.5 18.5, 30 20.5 C24.5 22.5, 19 25.5, 14.5 27 Z"
              fill={`url(#${crownSun})`}
            />

            {/* Delicate sweeping curtain strands */}
            <G stroke="#AED476" strokeWidth={1.25} strokeLinecap="round" strokeOpacity={0.85}>
              <Path d="M16 25 C14.5 31, 14 37, 14.8 43.5" />
              <Path d="M21 21 C19.5 28, 19 35, 19.5 42.5" />
              <Path d="M26.5 19 C25.5 26, 25.2 33, 25.8 39.5" />
              <Path d="M37.5 19.5 C38.5 26, 39 33, 38.8 40" />
              <Path d="M43.5 21.5 C45 28, 45.5 35, 45 43" />
              <Path d="M48 25 C49.5 31, 50 37, 49.2 42.5" />
            </G>
            {/* Deeper green interior curtain strokes */}
            <G stroke="#33623D" strokeWidth={1.1} strokeLinecap="round" strokeOpacity={0.6}>
              <Path d="M23.5 24 C22.8 31, 22.5 37, 23 42" />
              <Path d="M41 24 C41.8 31, 42 37, 41.5 42.5" />
            </G>

            {/* Dappled sunlight motes */}
            <Circle cx={20} cy={12} r={0.95} fill="#F6EEB0" fillOpacity={0.85} />
            <Circle cx={47} cy={14.5} r={0.85} fill="#DCF09E" fillOpacity={0.8} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 12. GOLDEN GINKGO
 * Slender trunk crowned with overlapping fan-shaped golden-amber ginkgo leaves
 * ========================================================================== */
function renderGoldenGinkgo(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#F3D26B',
      leafMid: '#B5B858',
      leafDark: '#6A7B3B',
      stem: '#7B6D5B',
      tipTint: '#F8D460',
    });
  }

  const ao = `${uid}_ao`;
  const bark = `${uid}_brk`;
  const goldDark = `${uid}_gldD`;
  const goldMid = `${uid}_gldM`;
  const goldSun = `${uid}_gldS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#2B2418" stopOpacity={0.32} />
          <Stop offset="70%" stopColor="#382F1F" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#382F1F" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={bark} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9C8D7B" />
          <Stop offset="55%" stopColor="#6E6050" />
          <Stop offset="100%" stopColor="#43392F" />
        </LinearGradient>
        <LinearGradient id={goldDark} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#DF9728" />
          <Stop offset="100%" stopColor="#A65E14" />
        </LinearGradient>
        <LinearGradient id={goldMid} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#F8C846" />
          <Stop offset="55%" stopColor="#E09924" />
          <Stop offset="100%" stopColor="#B56D17" />
        </LinearGradient>
        <LinearGradient id={goldSun} x1="10%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#FFF099" />
          <Stop offset="55%" stopColor="#F6C644" />
          <Stop offset="100%" stopColor="#D68C1E" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={19} ry={5.5} fill={`url(#${ao})`} />

        {/* Autumn leaf-strewn earth mound */}
        <Ellipse cx={32} cy={53.6} rx={12.5} ry={3.3} fill="#6B5842" />

        {/* Slender upright pale-ash trunk & ascending forks */}
        <Path
          d="M29.2 54 C30.2 48, 30.8 40, 30.8 33 L24 25.5 L25.6 24.2 L31 30 L31.2 21 L33 21 L33.2 30.5 L38.8 24.5 L40.2 25.8 L33.4 33.5 C33.4 40.5, 34 48, 35 54 Z"
          fill={`url(#${bark})`}
        />
        <Path d="M31.2 51 L31.5 34" stroke="#BCAE9B" strokeOpacity={0.5} strokeWidth={0.95} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Emerging chartreuse-gold fan leaf buds */
          <G>
            <Path d="M24 25 L19.5 21 C21.5 18.5, 24.5 19, 25.5 21.5 Z" fill="#D5C852" />
            <Path d="M32 21.5 L28.5 16 C31 14, 33.5 14.5, 35.5 16.5 Z" fill={`url(#${goldSun})`} />
            <Path d="M40 25 L44.5 21 C42.5 18.5, 39.5 19, 38.5 21.5 Z" fill="#CCA838" />
          </G>
        ) : (
          /* Stage 3: Overlapping fan-shaped golden-amber ginkgo crown & fluttering leaves */
          <G>
            {/* Back amber shadow fans */}
            <Path d="M22 30 L12 24 C13.5 18.5, 19 16.5, 23 19.5 L22 30 Z" fill={`url(#${goldDark})`} />
            <Path d="M42 30 L52 24 C50.5 18.5, 45 16.5, 41 19.5 L42 30 Z" fill={`url(#${goldDark})`} />
            <Path d="M32 28 L23 17 C27 12.5, 37 12.5, 41 17 L32 28 Z" fill={`url(#${goldDark})`} />

            {/* Midtone overlapping notched fan leaves */}
            {/* Left fan */}
            <Path
              d="M25 32 L14.5 28.5 C14.5 22.5, 19 19.5, 22.2 21.5 L22.8 23.2 L24 21 C27.2 21, 29.5 24.5, 28 29 Z"
              fill={`url(#${goldMid})`}
            />
            {/* Right fan */}
            <Path
              d="M39 32 L49.5 28.5 C49.5 22.5, 45 19.5, 41.8 21.5 L41.2 23.2 L40 21 C36.8 21, 34.5 24.5, 36 29 Z"
              fill={`url(#${goldMid})`}
            />
            {/* Center-lower fan */}
            <Path
              d="M32 33 L24.5 25.5 C26.8 21, 30.2 20.5, 31.8 23 L32.2 23 C33.8 20.5, 37.2 21, 39.5 25.5 Z"
              fill={`url(#${goldMid})`}
            />

            {/* Sunlit top crown fan leaves */}
            <Path
              d="M28 23.5 L18.5 17.5 C20.5 11.8, 25.5 10.5, 28.2 13.5 L28.5 15.2 L29.8 12.8 C33 11.5, 36.2 14.2, 35.5 19 Z"
              fill={`url(#${goldSun})`}
            />
            <Path
              d="M36 23.5 L45.5 17.5 C43.5 11.8, 38.5 10.5, 35.8 13.5 L35.5 15.2 L34.2 12.8 C31 11.5, 27.8 14.2, 28.5 19 Z"
              fill={`url(#${goldSun})`}
            />

            {/* Radiating ginkgo fan veins */}
            <G stroke="#FFF3B3" strokeOpacity={0.55} strokeWidth={0.8} strokeLinecap="round">
              <Path d="M27.5 21 L23 15.5 M28 21 L26.8 14 M28.5 21 L31 15" />
              <Path d="M36.5 21 L41 15.5 M36 21 L37.2 14" />
              <Path d="M24 29.5 L18.5 25.5 M40 29.5 L45.5 25.5" />
            </G>

            {/* Drifting golden ginkgo leaves */}
            <Path d="M16 41 L12.5 38.5 C13.5 36.5, 16 36.5, 17 38.5 Z" fill="#F6C846" />
            <Path d="M48 43 L51.5 40.5 C50.5 38.5, 48 38.5, 47 40.5 Z" fill="#E6A128" />
            <Circle cx={22} cy={10} r={0.95} fill="#FFF2A6" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 13. LOTUS BLOSSOM
 * Floating layered emerald lily pads over a small shaded water ring with
 * sculpted blush-cream lotus petals
 * ========================================================================== */
function renderLotusBlossom(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#8CC482',
      leafMid: '#4A895A',
      leafDark: '#24593E',
      stem: '#3B754E',
      tipTint: '#F4B6C6',
      soilVariant: 'water',
    });
  }

  const ao = `${uid}_ao`;
  const water = `${uid}_wtr`;
  const padSun = `${uid}_padS`;
  const padDark = `${uid}_padD`;
  const petalOuter = `${uid}_ptO`;
  const petalInner = `${uid}_ptI`;
  const center = `${uid}_ctr`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#142F33" stopOpacity={0.32} />
          <Stop offset="72%" stopColor="#1E4045" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#1E4045" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={water} cx="42%" cy="38%" rx="58%" ry="58%">
          <Stop offset="0%" stopColor="#8BC4C3" />
          <Stop offset="62%" stopColor="#48878B" />
          <Stop offset="100%" stopColor="#26565C" />
        </RadialGradient>
        <LinearGradient id={padSun} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#7EB776" />
          <Stop offset="55%" stopColor="#458054" />
          <Stop offset="100%" stopColor="#245238" />
        </LinearGradient>
        <LinearGradient id={padDark} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#4E895C" />
          <Stop offset="100%" stopColor="#1E4731" />
        </LinearGradient>
        <LinearGradient id={petalOuter} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#F9CEDB" />
          <Stop offset="55%" stopColor="#E695AE" />
          <Stop offset="100%" stopColor="#BD6380" />
        </LinearGradient>
        <LinearGradient id={petalInner} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="60%" stopColor="#FCE0E8" />
          <Stop offset="100%" stopColor="#E6A1B7" />
        </LinearGradient>
        <RadialGradient id={center} cx="40%" cy="35%" rx="60%" ry="60%">
          <Stop offset="0%" stopColor="#FFE680" />
          <Stop offset="65%" stopColor="#E6AE36" />
          <Stop offset="100%" stopColor="#B87A1A" />
        </RadialGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={23} ry={6} fill={`url(#${ao})`} />

        {/* Shaded tranquil water ring */}
        <Ellipse cx={32} cy={51} rx={22.5} ry={7.5} fill={`url(#${water})`} />
        {/* Water ripple arcs */}
        <Path
          d="M14 50.5 C19 47.2, 26 46.5, 32 46.8 M38 54.5 C44 54.2, 48.5 52.5, 51 50.5"
          stroke="#D2F0EE"
          strokeOpacity={0.45}
          strokeWidth={0.95}
          strokeLinecap="round"
        />

        {/* Back lily pads */}
        <Path
          d="M12.5 48.2 C11.5 43.8, 17.5 41.2, 24.5 42.2 C29.5 42.8, 31 46, 28.5 48.8 C25 51.2, 14.5 51.5, 12.5 48.2 Z"
          fill={`url(#${padDark})`}
        />
        <Path d="M21 46 L13.5 45.2" stroke="#2D6266" strokeWidth={1.3} />

        <Path
          d="M36 48.2 C35 44.2, 40.5 41.5, 47.2 42.5 C52 43.2, 53 46.5, 50.2 49.2 C46.8 51.2, 37.5 51, 36 48.2 Z"
          fill={`url(#${padDark})`}
        />
        <Path d="M44 46.2 L51 45.5" stroke="#2D6266" strokeWidth={1.3} />

        {/* Front hero sunlit lily pad */}
        <Path
          d="M18 52.5 C16.5 47.8, 24 44.8, 32.5 45.5 C41 46.2, 47 49.2, 45 53.2 C42.5 56.2, 21.5 56.2, 18 52.5 Z"
          fill={`url(#${padSun})`}
        />
        {/* V-notch & radiating veins */}
        <Path d="M32 50.5 L39 54.8" stroke="#366E72" strokeWidth={1.6} />
        <Path d="M31.5 50.5 L22 49.5 M31.5 50.5 L25 53.5 M32.5 50.2 L41 49.2" stroke="#9ED194" strokeOpacity={0.45} strokeWidth={0.8} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Sculpted upright blush lotus bud cradled in sepals */
          <G>
            <Path d="M32 45 C27 41, 26.5 32, 32 25 C37.5 32, 37 41, 32 45 Z" fill={`url(#${petalOuter})`} />
            <Path d="M32 44 C29 40, 29 32.5, 32 26.5 C35 32.5, 35 40, 32 44 Z" fill={`url(#${petalInner})`} />
            <Path d="M26 45 C28 42.5, 30 42, 32 45 C34 42, 36 42.5, 38 45 C35 46.8, 29 46.8, 26 45 Z" fill="#3D754D" />
          </G>
        ) : (
          /* Stage 3: Full architectural multi-tiered blush-cream lotus blossom */
          <G>
            {/* Outer wide spreading petals */}
            <Path d="M32 45 C23 45, 16.5 40.5, 17 36 C21.5 35.5, 28 38.5, 32 45 Z" fill={`url(#${petalOuter})`} />
            <Path d="M32 45 C41 45, 47.5 40.5, 47 36 C42.5 35.5, 36 38.5, 32 45 Z" fill={`url(#${petalOuter})`} />
            <Path d="M32 44 C22 40.5, 18.5 33, 21.5 29 C26 30.5, 30 36, 32 44 Z" fill={`url(#${petalOuter})`} />
            <Path d="M32 44 C42 40.5, 45.5 33, 42.5 29 C38 30.5, 34 36, 32 44 Z" fill={`url(#${petalOuter})`} />

            {/* Middle sculpted blush-cream petals */}
            <Path d="M32 43.5 C25.5 39, 23 30.5, 26.5 25 C30 27.5, 31.8 34.5, 32 43.5 Z" fill={`url(#${petalInner})`} />
            <Path d="M32 43.5 C38.5 39, 41 30.5, 37.5 25 C34 27.5, 32.2 34.5, 32 43.5 Z" fill={`url(#${petalInner})`} />

            {/* Golden seedpod & stamen crown nestled inside */}
            <Ellipse cx={32} cy={35.5} rx={4.5} ry={3.2} fill={`url(#${center})`} />
            <Circle cx={30.5} cy={34.5} r={0.8} fill="#FFF6BE" />
            <Circle cx={33.5} cy={34.5} r={0.8} fill="#FFF6BE" />

            {/* Central upright sunlit cream lotus petal */}
            <Path d="M32 43.5 C27.5 38, 27.5 29, 32 23.5 C36.5 29, 36.5 38, 32 43.5 Z" fill={`url(#${petalInner})`} />
            <Path d="M32 25.5 C30.5 30, 30.5 36, 32 41" stroke="#FFFFFF" strokeOpacity={0.65} strokeWidth={1.0} strokeLinecap="round" />

            {/* Glistening water bead on front lily pad */}
            <Circle cx={25.5} cy={51.5} r={1.6} fill="#D5F2F2" />
            <Circle cx={25.0} cy={51.0} r={0.6} fill="#FFFFFF" />

            {/* Sunlit pond motes */}
            <Circle cx={22} cy={22} r={0.95} fill="#FFF3C4" fillOpacity={0.85} />
            <Circle cx={42} cy={24} r={0.85} fill="#FFE5EE" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 14. STARLIGHT ORCHID
 * Arching graceful stem from mossy bark with intricately sculpted violet-cream
 * orchid petals
 * ========================================================================== */
function renderStarlightOrchid(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#8EC27A',
      leafMid: '#4A8252',
      leafDark: '#265236',
      stem: '#3D6E48',
      tipTint: '#B992E8',
      soilVariant: 'moss',
    });
  }

  const ao = `${uid}_ao`;
  const bark = `${uid}_brk`;
  const leaf = `${uid}_lf`;
  const petal = `${uid}_pet`;
  const lip = `${uid}_lip`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1E2822" stopOpacity={0.33} />
          <Stop offset="70%" stopColor="#26332B" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#26332B" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={bark} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#7C5F4C" />
          <Stop offset="100%" stopColor="#3B2A20" />
        </LinearGradient>
        <LinearGradient id={leaf} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#83B872" />
          <Stop offset="55%" stopColor="#437A4E" />
          <Stop offset="100%" stopColor="#224C32" />
        </LinearGradient>
        <LinearGradient id={petal} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#F5EBFF" />
          <Stop offset="50%" stopColor="#BE9AE8" />
          <Stop offset="100%" stopColor="#724AA8" />
        </LinearGradient>
        <LinearGradient id={lip} x1="20%" y1="0%" x2="80%" y2="100%">
          <Stop offset="0%" stopColor="#F7CE5E" />
          <Stop offset="55%" stopColor="#9A48B8" />
          <Stop offset="100%" stopColor="#4D2175" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={19} ry={5.5} fill={`url(#${ao})`} />

        {/* Mossy driftwood bark base */}
        <Path
          d="M17 53.8 C19 49.5, 25 48, 32 48.2 C39 48.4, 44 50, 46 53.8 C41 55.8, 22 55.8, 17 53.8 Z"
          fill={`url(#${bark})`}
        />
        <Ellipse cx={27} cy={49.2} rx={7} ry={2.2} fill="#5C8B54" />

        {/* Broad glossy arched orchid leaves */}
        <Path
          d="M28 50 C20 46, 13 42, 11 45 C13 49.5, 20 52, 28 52 Z"
          fill={`url(#${leaf})`}
        />
        <Path
          d="M30 50 C38 45.5, 46 43, 49 46.5 C46.5 50.5, 39 52.5, 30 52 Z"
          fill={`url(#${leaf})`}
        />
        <Path d="M27 50.5 Q20 47 13 45" stroke="#B6DF9E" strokeOpacity={0.5} strokeWidth={0.9} strokeLinecap="round" />
        <Path d="M31 50.5 Q39 47 47 46.5" stroke="#B6DF9E" strokeOpacity={0.45} strokeWidth={0.9} strokeLinecap="round" />

        {/* Tall gracefully arching flower spike */}
        <Path
          d="M28 49 C25.5 36, 25 22, 31 15.5 C36.5 10, 46 13.5, 49 23.5"
          stroke="#46784D"
          strokeWidth={1.85}
          strokeLinecap="round"
        />

        {stage === 2 ? (
          /* Stage 2: Glossy violet-plum tear-shaped orchid buds */
          <G>
            <Ellipse cx={32} cy={15} rx={2.5} ry={3.6} fill={`url(#${petal})`} />
            <Ellipse cx={40.5} cy={14.5} rx={2.3} ry={3.3} fill="#9C75CE" />
            <Ellipse cx={47} cy={20.2} rx={2.1} ry={3.0} fill="#825BB5" />
            <Ellipse cx={49} cy={25.5} rx={1.6} ry={2.3} fill="#6E499E" />
          </G>
        ) : (
          /* Stage 3: 3 intricately sculpted violet-cream orchid blossoms */
          <G>
            {/* Bloom 1 (upper-left hero orchid) */}
            <G>
              {/* Sepals */}
              <Ellipse cx={29} cy={12} rx={2.3} ry={4.6} fill="#9E76D1" />
              <Ellipse cx={25.2} cy={20.2} rx={2.2} ry={4.0} fill="#825AB8" />
              <Ellipse cx={32.8} cy={20.2} rx={2.2} ry={4.0} fill="#825AB8" />
              {/* Broad butterfly petals */}
              <Ellipse cx={23.2} cy={16.5} rx={4.8} ry={3.6} fill={`url(#${petal})`} />
              <Ellipse cx={34.8} cy={16.5} rx={4.8} ry={3.6} fill={`url(#${petal})`} />
              {/* Sculpted plum & gold labellum (lip) */}
              <Path d="M29 15.8 C27 16.5, 26.8 20, 29 21.2 C31.2 20, 31 16.5, 29 15.8 Z" fill={`url(#${lip})`} />
              <Circle cx={29} cy={16.6} r={1.1} fill="#FFF2A8" />
            </G>

            {/* Bloom 2 (mid-right orchid) */}
            <G>
              <Ellipse cx={41.5} cy={15.2} rx={2.0} ry={3.8} fill="#966EC9" />
              <Ellipse cx={37.2} cy={19.2} rx={4.0} ry={3.0} fill={`url(#${petal})`} />
              <Ellipse cx={45.8} cy={19.2} rx={4.0} ry={3.0} fill={`url(#${petal})`} />
              <Path d="M41.5 18.5 C39.8 19.2, 39.8 22, 41.5 23 C43.2 22, 43.2 19.2, 41.5 18.5 Z" fill={`url(#${lip})`} />
              <Circle cx={41.5} cy={19.2} r={0.95} fill="#FFF2A8" />
            </G>

            {/* Bloom 3 (lower-right smaller orchid + tip bud) */}
            <G>
              <Ellipse cx={47.5} cy={26.5} rx={3.2} ry={2.4} fill={`url(#${petal})`} />
              <Ellipse cx={51.5} cy={26.5} rx={3.0} ry={2.2} fill="#A781D9" />
              <Circle cx={49.5} cy={26.8} r={1.4} fill={`url(#${lip})`} />
              <Circle cx={49.5} cy={26.4} r={0.65} fill="#FFF2A8" />
            </G>

            {/* Starlight pollen sparkles */}
            <Circle cx={19} cy={11} r={1.0} fill="#FFF4C2" fillOpacity={0.9} />
            <Circle cx={38} cy={9.5} r={0.9} fill="#F2E6FF" fillOpacity={0.9} />
            <Circle cx={52} cy={18.5} r={0.85} fill="#FFF4C2" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 15. SILVER OLIVE
 * Twisted Mediterranean trunk with silvery-sage oval leaf canopy & tiny olives
 * ========================================================================== */
function renderSilverOlive(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#C5D8C6',
      leafMid: '#85A38C',
      leafDark: '#4D6B57',
      stem: '#7B7064',
      tipTint: '#D7E6D5',
    });
  }

  const ao = `${uid}_ao`;
  const bark = `${uid}_brk`;
  const sageDark = `${uid}_sgD`;
  const sageMid = `${uid}_sgM`;
  const sageSun = `${uid}_sgS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#222B22" stopOpacity={0.32} />
          <Stop offset="70%" stopColor="#2B362C" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#2B362C" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={bark} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#A69B8D" />
          <Stop offset="55%" stopColor="#756A5D" />
          <Stop offset="100%" stopColor="#463E36" />
        </LinearGradient>
        <LinearGradient id={sageDark} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#6E8E78" />
          <Stop offset="100%" stopColor="#3B5746" />
        </LinearGradient>
        <LinearGradient id={sageMid} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#A6C0AA" />
          <Stop offset="55%" stopColor="#72927C" />
          <Stop offset="100%" stopColor="#476654" />
        </LinearGradient>
        <LinearGradient id={sageSun} x1="10%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#DCE8DA" />
          <Stop offset="55%" stopColor="#9EB9A2" />
          <Stop offset="100%" stopColor="#688872" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={20} ry={5.5} fill={`url(#${ao})`} />

        {/* Sun-warmed rocky Mediterranean earth mound */}
        <Ellipse cx={32} cy={53.6} rx={13} ry={3.4} fill="#87755E" />
        <Ellipse cx={23} cy={53.2} rx={3.2} ry={1.6} fill="#C6BFB2" />

        {/* Twisted gnarled Mediterranean trunk */}
        <Path
          d="M26.5 54 C28.5 50, 30 45, 29 40 C28 35.5, 30.5 31.5, 27 27 L29.5 25.5 C31.5 28, 32.5 30.5, 33 32.5 C34.5 29.5, 36.5 27, 39 25 L41 26.8 C38 29.8, 35.8 33.5, 35 38.5 C34.5 43.5, 36 49.5, 38.5 54 Z"
          fill={`url(#${bark})`}
        />
        <Path d="M29.8 50 C31 44, 30 39, 31.2 33" stroke="#C9C0B4" strokeOpacity={0.55} strokeWidth={1.0} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Compact silvery-sage leaf tufts + tiny cream flower buds */
          <G>
            <Ellipse cx={22} cy={25} rx={7} ry={4.8} fill={`url(#${sageMid})`} />
            <Ellipse cx={42} cy={25} rx={7} ry={4.8} fill={`url(#${sageDark})`} />
            <Ellipse cx={32} cy={19} rx={8.5} ry={5.5} fill={`url(#${sageSun})`} />
            <Circle cx={26} cy={18} r={1.2} fill="#FAF5DC" />
            <Circle cx={37} cy={21} r={1.2} fill="#FAF5DC" />
            <Circle cx={21} cy={24} r={1.1} fill="#FAF5DC" />
          </G>
        ) : (
          /* Stage 3: Airy layered silvery-sage oval leaf canopy & tiny olives */
          <G>
            {/* Shadow canopy base */}
            <Ellipse cx={32} cy={24} rx={19} ry={10.5} fill={`url(#${sageDark})`} />
            {/* Layered silvery-sage foliage clouds */}
            <Ellipse cx={20} cy={24} rx={9.5} ry={6.5} fill={`url(#${sageMid})`} />
            <Ellipse cx={44} cy={24.5} rx={9.0} ry={6.2} fill={`url(#${sageMid})`} />
            <Ellipse cx={31} cy={17.5} rx={11.5} ry={7.2} fill={`url(#${sageMid})`} />

            {/* Sunlit shimmering silver-sage oval leaf clusters */}
            <Ellipse cx={25.5} cy={15.5} rx={6.8} ry={4.0} fill={`url(#${sageSun})`} />
            <Ellipse cx={18} cy={21.5} rx={5.2} ry={3.2} fill={`url(#${sageSun})`} />
            <Ellipse cx={38} cy={17} rx={5.6} ry={3.4} fill={`url(#${sageSun})`} />

            {/* Individual crisp oval olive leaf accents */}
            <Ellipse cx={14.5} cy={25.5} rx={3.0} ry={1.3} fill="#C6D9C6" />
            <Ellipse cx={29} cy={12} rx={3.2} ry={1.3} fill="#E0ECE0" />
            <Ellipse cx={46.5} cy={21} rx={2.8} ry={1.2} fill="#B3C9B6" />
            <Ellipse cx={35} cy={27.5} rx={3.0} ry={1.3} fill="#8FA895" />

            {/* Glossy tiny Mediterranean olives (deep plum & green-amber) */}
            <Ellipse cx={23.5} cy={26.5} rx={1.6} ry={2.1} fill="#3E324A" />
            <Circle cx={23.0} cy={25.7} r={0.5} fill="#C9BFD6" />
            <Ellipse cx={39.5} cy={26.0} rx={1.6} ry={2.1} fill="#463854" />
            <Circle cx={39.0} cy={25.2} r={0.5} fill="#C9BFD6" />
            <Ellipse cx={32.5} cy={22.2} rx={1.5} ry={2.0} fill="#7B8F48" />
            <Circle cx={32.0} cy={21.5} r={0.5} fill="#D8E5A8" />
            <Ellipse cx={18.5} cy={20.2} rx={1.4} ry={1.9} fill="#4A3C58" />

            {/* Sunlit Mediterranean motes */}
            <Circle cx={20} cy={11.5} r={0.95} fill="#F8EBC0" fillOpacity={0.85} />
            <Circle cx={45} cy={13.5} r={0.85} fill="#E3EFE3" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 16. WILD WISTERIA
 * Curved arbor vine draped in cascading lavender-periwinkle flower racemes
 * ========================================================================== */
function renderWildWisteria(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#9AC97E',
      leafMid: '#548C54',
      leafDark: '#2E5B3A',
      stem: '#5C4639',
      tipTint: '#A996E6',
      vineCurl: true,
    });
  }

  const ao = `${uid}_ao`;
  const wood = `${uid}_wd`;
  const leaf = `${uid}_lf`;
  const raceme = `${uid}_rcm`;
  const racemeSun = `${uid}_rcmS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1E242E" stopOpacity={0.33} />
          <Stop offset="70%" stopColor="#28303B" stopOpacity={0.13} />
          <Stop offset="100%" stopColor="#28303B" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={wood} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#85654E" />
          <Stop offset="55%" stopColor="#5C4232" />
          <Stop offset="100%" stopColor="#38261C" />
        </LinearGradient>
        <LinearGradient id={leaf} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#94C776" />
          <Stop offset="55%" stopColor="#4F8650" />
          <Stop offset="100%" stopColor="#2A5536" />
        </LinearGradient>
        <LinearGradient id={raceme} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#5E4699" />
          <Stop offset="55%" stopColor="#9580D4" />
          <Stop offset="100%" stopColor="#D6CCF7" />
        </LinearGradient>
        <LinearGradient id={racemeSun} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#7C63BA" />
          <Stop offset="50%" stopColor="#B5A3EB" />
          <Stop offset="100%" stopColor="#F0EBFF" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={21} ry={5.5} fill={`url(#${ao})`} />

        {/* Grounded mossy base */}
        <Ellipse cx={20} cy={53.8} rx={9} ry={3.0} fill="#4D7448" />

        {/* Curved rustic wooden arbor arch */}
        <Path
          d="M17.5 54 C17.5 37, 17 22, 23 15.5 C28.5 9.5, 42 10.5, 50 16"
          stroke={`url(#${wood})`}
          strokeWidth={3.6}
          strokeLinecap="round"
        />
        <Path
          d="M16.5 52 C16.5 36, 16.5 22.5, 22.5 16.2"
          stroke="#A8846A"
          strokeOpacity={0.45}
          strokeWidth={1.0}
          strokeLinecap="round"
        />

        {/* Twining vine & sunlit foliage canopy along top crest */}
        <Path
          d="M21 53 C23 44, 15 36, 19 26 C22 18, 33 12, 47 15"
          stroke="#487B4C"
          strokeWidth={1.7}
          strokeLinecap="round"
        />
        <Ellipse cx={24} cy={14} rx={7.5} ry={4.2} fill={`url(#${leaf})`} />
        <Ellipse cx={35} cy={12.5} rx={8.5} ry={4.5} fill={`url(#${leaf})`} />
        <Ellipse cx={45.5} cy={15} rx={6.5} ry={3.8} fill={`url(#${leaf})`} />
        <Ellipse cx={18} cy={21} rx={4.5} ry={2.8} fill="#6CA262" />

        {stage === 2 ? (
          /* Stage 2: Tapered hanging violet-periwinkle flower buds */
          <G>
            <Path d="M26 17.5 C24.5 22, 24.5 26, 26 29.5 C27.5 26, 27.5 22, 26 17.5 Z" fill={`url(#${raceme})`} />
            <Path d="M35 16.5 C33 22, 33 27.5, 35 32.5 C37 27.5, 37 22, 35 16.5 Z" fill={`url(#${racemeSun})`} />
            <Path d="M44 18.5 C42.5 23, 42.5 26.5, 44 29.5 C45.5 26.5, 45.5 23, 44 18.5 Z" fill={`url(#${raceme})`} />
          </G>
        ) : (
          /* Stage 3: 4 lavish cascading lavender-periwinkle racemes & drifting petals */
          <G>
            {/* Raceme 1 (left) */}
            <Path
              d="M24.5 17.5 C21 21, 21.5 29, 24.5 36.5 C27.5 29, 28 21, 24.5 17.5 Z"
              fill={`url(#${raceme})`}
            />
            <Circle cx={23.2} cy={22} r={1.8} fill="#A794E0" />
            <Circle cx={25.5} cy={27} r={1.6} fill="#C6B8F2" />

            {/* Raceme 2 (hero center-left) */}
            <Path
              d="M32.5 16.5 C28.2 21, 28.8 32, 32.5 42.5 C36.2 32, 36.8 21, 32.5 16.5 Z"
              fill={`url(#${racemeSun})`}
            />
            <Circle cx={30.8} cy={21.5} r={2.2} fill="#A18CE0" />
            <Circle cx={34.2} cy={23.5} r={2.0} fill="#8973CC" />
            <Circle cx={31.2} cy={28.5} r={1.9} fill="#C8BAF5" />
            <Circle cx={33.8} cy={31.5} r={1.6} fill="#DDD4FA" />
            <Circle cx={32.5} cy={37.5} r={1.4} fill="#F2EDFF" />

            {/* Raceme 3 (center-right) */}
            <Path
              d="M40.5 17 C36.8 21.5, 37.5 31, 40.5 39.5 C43.5 31, 44.2 21.5, 40.5 17 Z"
              fill={`url(#${raceme})`}
            />
            <Circle cx={39.2} cy={22.5} r={1.9} fill="#A693E2" />
            <Circle cx={41.6} cy={28.5} r={1.7} fill="#C8BAF5" />
            <Circle cx={40.5} cy={34.5} r={1.3} fill="#E6DFFE" />

            {/* Raceme 4 (far right) */}
            <Path
              d="M47.5 18.5 C44.8 22, 45.2 29, 47.5 34.5 C49.8 29, 50.2 22, 47.5 18.5 Z"
              fill={`url(#${racemeSun})`}
            />
            <Circle cx={47.5} cy={29.5} r={1.3} fill="#EAE3FF" />

            {/* Drifting lavender petals */}
            <Ellipse cx={28} cy={46} rx={1.6} ry={0.95} fill="#C8BAF5" />
            <Ellipse cx={43.5} cy={45} rx={1.5} ry={0.9} fill="#DFD6FA" />
            <Circle cx={37} cy={49} r={0.85} fill="#EDE7FF" />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 17. AMBER MAPLE
 * Sculpted autumn Japanese maple with layered burnt-amber, russet, and crimson
 * star-leaf clusters
 * ========================================================================== */
function renderAmberMaple(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#F09B4A',
      leafMid: '#C95628',
      leafDark: '#82281A',
      stem: '#664336',
      tipTint: '#F7B452',
    });
  }

  const ao = `${uid}_ao`;
  const bark = `${uid}_brk`;
  const mapleDark = `${uid}_mpD`;
  const mapleMid = `${uid}_mpM`;
  const mapleSun = `${uid}_mpS`;

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#2B1C18" stopOpacity={0.34} />
          <Stop offset="70%" stopColor="#38251F" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#38251F" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={bark} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#825A48" />
          <Stop offset="55%" stopColor="#57392D" />
          <Stop offset="100%" stopColor="#331F18" />
        </LinearGradient>
        <LinearGradient id={mapleDark} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#B83B22" />
          <Stop offset="100%" stopColor="#6E1C14" />
        </LinearGradient>
        <LinearGradient id={mapleMid} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#EB7A2C" />
          <Stop offset="55%" stopColor="#C94520" />
          <Stop offset="100%" stopColor="#8A2416" />
        </LinearGradient>
        <LinearGradient id={mapleSun} x1="10%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#FCE07A" />
          <Stop offset="50%" stopColor="#F08B32" />
          <Stop offset="100%" stopColor="#C74520" />
        </LinearGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={20} ry={5.5} fill={`url(#${ao})`} />

        {/* Moss & fallen autumn leaves ground hummock */}
        <Ellipse cx={32} cy={53.6} rx={13} ry={3.3} fill="#664B38" />
        <Ellipse cx={23} cy={53.8} rx={2.2} ry={1.0} fill="#D45724" />
        <Ellipse cx={41.5} cy={53.5} rx={2.0} ry={0.95} fill="#EB8B32" />

        {/* Sculpted slender Japanese maple trunk */}
        <Path
          d="M27.5 54 C29.5 49.5, 30.8 43.5, 30.2 37.5 C29.8 33.5, 27 29.5, 24 26.5 L26 25 C28.5 27.5, 30.8 30, 32 32.5 C33.5 28.5, 36.5 25.5, 40 23.5 L41.5 25 C38 27.5, 35.2 31.5, 34 37.5 C33.2 43.5, 34.8 49.5, 37.2 54 Z"
          fill={`url(#${bark})`}
        />
        <Path d="M29.8 32 C24.5 29.5, 20 28.5, 16.5 28.5" stroke={`url(#${bark})`} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M34 30.5 C39 28, 44 27.5, 47.5 28" stroke={`url(#${bark})`} strokeWidth={1.7} strokeLinecap="round" />

        {stage === 2 ? (
          /* Stage 2: Crimson-amber folded star-leaf buds */
          <G>
            <Path d="M16.5 28.5 L12.5 26 L15.5 24 L18 22.5 L19 26 Z" fill="#D44D22" />
            <Path d="M25.5 25.5 L22 21.5 L26 20 L29 22 Z" fill={`url(#${mapleSun})`} />
            <Path d="M32.5 23 L29.5 18 L33 16 L36.5 18.5 L34.5 23 Z" fill={`url(#${mapleMid})`} />
            <Path d="M40.5 24.5 L43.5 20.5 L46 22.5 L42.5 26 Z" fill="#B8351C" />
            <Path d="M47.5 28 L51 25.5 L49 23.5 L46 26 Z" fill="#D44D22" />
          </G>
        ) : (
          /* Stage 3: Dramatic layered autumn Japanese maple star-leaf canopy */
          <G>
            {/* Deep burgundy-russet shadow canopy */}
            <Path
              d="M10 31 L14 26.5 L12 22.5 L18 21.5 L20 16 L26.5 17 L31.5 11.5 L37 16 L43.5 15 L45 20.5 L51.5 21.5 L49 26.5 L53.5 30.5 L47 33.5 L39 32.5 L32 34.5 L24 32.5 L16 33.5 Z"
              fill={`url(#${mapleDark})`}
            />

            {/* Rich burnt-amber & vermilion midtone star-leaf clusters */}
            <Path
              d="M12.5 29.5 L16 25.5 L15 21.8 L20.5 21 L23 16.5 L28 18 L32 13 L36.5 17.5 L42 16.5 L43.5 21.5 L49 22.5 L46.5 27 L50.5 29.5 L44.5 31.5 L37.5 30.5 L32 32.5 L25.5 30.5 L18 31.5 Z"
              fill={`url(#${mapleMid})`}
            />

            {/* Sunlit honey-gold & tangerine upper maple star clusters */}
            <Path
              d="M19 23.5 L21.5 19.5 L20.5 16.5 L25 16.5 L28 12.5 L31.5 15.5 L36 13.8 L37.5 17.8 L41.5 18.8 L38.5 22 L40.5 24.8 L35 24.5 L31.5 26.8 L27.5 24.5 L22.5 25.5 Z"
              fill={`url(#${mapleSun})`}
            />
            <Path
              d="M14 27 L17 24 L20.5 24.8 L18.8 27.5 L20.5 29.5 L16.5 29.2 Z"
              fill={`url(#${mapleSun})`}
            />

            {/* Crisp sunlit rim accents */}
            <Path d="M27.8 13.5 L31.2 15.8 M21 17.2 L24.5 17" stroke="#FFF0A8" strokeOpacity={0.65} strokeWidth={0.9} strokeLinecap="round" />

            {/* Drifting crimson-amber maple leaves */}
            <Path d="M13 40 L15.5 38 L16.5 40.5 L14.5 41.8 Z" fill="#EB7B2D" />
            <Path d="M49 38.5 L51.5 37 L52 39.5 L49.5 40.5 Z" fill="#C9411E" />
            <Path d="M44 46.5 L46.5 45 L47 47.2 L44.8 48 Z" fill="#F29838" />
          </G>
        )}
      </G>
    </>
  );
}

/* ============================================================================
 * 18. NIGHT JASMINE
 * Lush deep-emerald shrub dotted with luminous warm-ivory star-shaped jasmine
 * blossoms
 * ========================================================================== */
function renderNightJasmine(uid: string, stage: GrowthStage): ReactNode {
  if (stage === 1) {
    return renderBotanicalSprout(uid, {
      leafLight: '#6CA678',
      leafMid: '#36704F',
      leafDark: '#1A422F',
      stem: '#2A593E',
      tipTint: '#FFF7D6',
    });
  }

  const ao = `${uid}_ao`;
  const shrubDark = `${uid}_shD`;
  const shrubMid = `${uid}_shM`;
  const shrubLit = `${uid}_shL`;
  const glow = `${uid}_glw`;

  const renderJasmineStar = (cx: number, cy: number, r: number) => (
    <G>
      <Path
        d={`M${cx} ${cy - r} L${cx + r * 0.28} ${cy - r * 0.28} L${cx + r} ${cy - r * 0.22} L${cx + r * 0.4} ${cy + r * 0.22} L${cx + r * 0.62} ${cy + r * 0.92} L${cx} ${cy + r * 0.48} L${cx - r * 0.62} ${cy + r * 0.92} L${cx - r * 0.4} ${cy + r * 0.22} L${cx - r} ${cy - r * 0.22} L${cx - r * 0.28} ${cy - r * 0.28} Z`}
        fill="#FFFDF2"
      />
      <Circle cx={cx} cy={cy} r={r * 0.28} fill="#F3C85A" />
    </G>
  );

  return (
    <>
      <Defs>
        <RadialGradient id={ao} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#122119" stopOpacity={0.35} />
          <Stop offset="70%" stopColor="#1A2E23" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#1A2E23" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={shrubDark} x1="15%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#2B5E46" />
          <Stop offset="100%" stopColor="#133326" />
        </LinearGradient>
        <LinearGradient id={shrubMid} x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#4F8A66" />
          <Stop offset="55%" stopColor="#2A5E45" />
          <Stop offset="100%" stopColor="#163B2C" />
        </LinearGradient>
        <LinearGradient id={shrubLit} x1="10%" y1="0%" x2="85%" y2="100%">
          <Stop offset="0%" stopColor="#77B084" />
          <Stop offset="55%" stopColor="#3F7858" />
          <Stop offset="100%" stopColor="#214E38" />
        </LinearGradient>
        <RadialGradient id={glow} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#FFF7CC" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#FFF7CC" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <G>
        <Ellipse cx={32} cy={56} rx={21} ry={5.5} fill={`url(#${ao})`} />

        {/* Compact woody shrub base */}
        <Path d="M29 54 L28 45 M32 54 L32 43 M35 54 L36 45" stroke="#4D3A2D" strokeWidth={2.0} strokeLinecap="round" />

        {/* Lush deep-emerald rounded shrub body */}
        <Path
          d="M12.5 41.5 C10.5 32.5, 16.5 22.5, 25 21 C28 16.5, 37 16.5, 40 21 C48.5 22.5, 53.5 32.5, 51.5 41.5 C49.5 48.5, 41 51.5, 32 51.5 C23 51.5, 14.5 48.5, 12.5 41.5 Z"
          fill={`url(#${shrubDark})`}
        />

        {/* Layered foliage mounds */}
        <Circle cx={21} cy={36} r={9.5} fill={`url(#${shrubMid})`} />
        <Circle cx={43} cy={36.5} r={9.2} fill={`url(#${shrubMid})`} />
        <Circle cx={32} cy={29} r={11} fill={`url(#${shrubMid})`} />
        <Circle cx={32} cy={40} r={10} fill={`url(#${shrubDark})`} />

        {/* Moonlit top-left foliage highlights & distinct pointed leaves */}
        <Circle cx={26} cy={26} r={6.8} fill={`url(#${shrubLit})`} />
        <Circle cx={19} cy={33.5} r={5.2} fill={`url(#${shrubLit})`} />
        <Circle cx={38} cy={28} r={5.4} fill={`url(#${shrubLit})`} />
        <Path d="M16 30 C13 28, 12.5 25, 15.5 24.5 C17.5 26, 17.5 28.5, 16 30 Z" fill="#5D966E" />
        <Path d="M47.5 31 C50.5 29, 51 26, 48 25.5 C46 27, 46 29.5, 47.5 31 Z" fill="#467E5C" />
        <Path d="M31 19 C30 15.5, 32.5 13.5, 34.5 16 C34.5 18, 33 19, 31 19 Z" fill="#6AA378" />

        {stage === 2 ? (
          /* Stage 2: Slender tubular ivory-green jasmine buds poised to open */
          <G>
            <Ellipse cx={23} cy={27} rx={1.4} ry={2.8} fill="#F2F0D8" />
            <Ellipse cx={33} cy={23} rx={1.5} ry={3.0} fill="#FAF7E0" />
            <Ellipse cx={42} cy={30} rx={1.4} ry={2.7} fill="#EAEAD0" />
            <Ellipse cx={26} cy={38} rx={1.3} ry={2.5} fill="#E6E8CE" />
            <Ellipse cx={38} cy={40} rx={1.3} ry={2.5} fill="#E2E5CA" />
          </G>
        ) : (
          /* Stage 3: Luminous warm-ivory 5-pointed star jasmine blossoms + scent motes */
          <G>
            {/* Subtle luminous aura behind hero blossoms */}
            <Circle cx={25.5} cy={27.5} r={6.5} fill={`url(#${glow})`} />
            <Circle cx={36.5} cy={24.5} r={6.0} fill={`url(#${glow})`} />
            <Circle cx={32.5} cy={37.5} r={6.0} fill={`url(#${glow})`} />

            {renderJasmineStar(25.5, 27.5, 4.4)}
            {renderJasmineStar(36.5, 24.5, 4.0)}
            {renderJasmineStar(18.5, 36.5, 3.6)}
            {renderJasmineStar(32.5, 37.5, 4.1)}
            {renderJasmineStar(44.0, 34.5, 3.7)}
            {renderJasmineStar(26.0, 44.5, 3.2)}
            {renderJasmineStar(40.0, 43.5, 3.1)}

            {/* Floating warm-ivory night fragrance motes */}
            <Circle cx={20} cy={17} r={1.0} fill="#FFF8D2" fillOpacity={0.9} />
            <Circle cx={43} cy={17.5} r={0.9} fill="#FFF8D2" fillOpacity={0.85} />
            <Circle cx={31.5} cy={12} r={0.85} fill="#FFFFFF" fillOpacity={0.85} />
          </G>
        )}
      </G>
    </>
  );
}

/**
 * Renders one of the 18 botanical plant sprites inside a `<Svg viewBox="0 0 64 64">`.
 * Returns `null` if `assetKey` is not a recognized plant sprite.
 */
export function renderPlantSprite(
  assetKey: string,
  uid: string,
  growthStage: 1 | 2 | 3 = 3,
): ReactNode | null {
  switch (assetKey) {
    case 'lavender':
      return renderLavender(uid, growthStage);
    case 'bonsai_sprout':
      return renderBonsaiSprout(uid, growthStage);
    case 'sunlit_fern':
      return renderSunlitFern(uid, growthStage);
    case 'mossy_clover':
      return renderMossyClover(uid, growthStage);
    case 'meadow_daisy':
      return renderMeadowDaisy(uid, growthStage);
    case 'chamomile_tuft':
      return renderChamomileTuft(uid, growthStage);
    case 'rosemary_sprig':
      return renderRosemarySprig(uid, growthStage);
    case 'morning_glory':
      return renderMorningGlory(uid, growthStage);
    case 'sakura_sapling':
      return renderSakuraSapling(uid, growthStage);
    case 'moonflower_vine':
      return renderMoonflowerVine(uid, growthStage);
    case 'weeping_willow':
      return renderWeepingWillow(uid, growthStage);
    case 'golden_ginkgo':
      return renderGoldenGinkgo(uid, growthStage);
    case 'lotus_blossom':
      return renderLotusBlossom(uid, growthStage);
    case 'starlight_orchid':
      return renderStarlightOrchid(uid, growthStage);
    case 'silver_olive':
      return renderSilverOlive(uid, growthStage);
    case 'wild_wisteria':
      return renderWildWisteria(uid, growthStage);
    case 'amber_maple':
      return renderAmberMaple(uid, growthStage);
    case 'night_jasmine':
      return renderNightJasmine(uid, growthStage);
    default:
      return null;
  }
}
