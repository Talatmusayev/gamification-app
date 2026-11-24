import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme/tokens';

export type BotanicalIllustrationVariant =
  | 'welcome_sanctuary'
  | 'lavender'
  | 'bonsai_sprout'
  | 'sunlit_fern';

export interface BotanicalIllustrationProps {
  variant: BotanicalIllustrationVariant;
  size?: number;
}

export function BotanicalIllustration({
  variant,
  size = 64,
}: BotanicalIllustrationProps) {
  switch (variant) {
    case 'welcome_sanctuary':
      return <WelcomeSanctuarySvg width={size} height={Math.round(size * 0.72)} />;
    case 'lavender':
      return <LavenderSvg size={size} />;
    case 'bonsai_sprout':
      return <BonsaiSproutSvg size={size} />;
    case 'sunlit_fern':
      return <SunlitFernSvg size={size} />;
  }
}

function WelcomeSanctuarySvg({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 240 172" fill="none">
      {/* Soft linen sky & morning warmth */}
      <Rect x="0" y="0" width="240" height="172" rx="16" fill="#F5F1E8" />

      {/* Quiet morning sun */}
      <Circle cx="182" cy="44" r="22" fill="#EFE0C2" />
      <Circle cx="182" cy="44" r="14" fill="#E4C68E" />

      {/* Distant misty meadow hill */}
      <Path
        d="M0 116 C42 94, 96 92, 146 108 C184 120, 214 110, 240 100 L240 172 L0 172 Z"
        fill="#E5EBE1"
      />

      {/* Midground sunlit slope */}
      <Path
        d="M0 132 C58 112, 128 112, 186 126 C210 132, 228 130, 240 126 L240 172 L0 172 Z"
        fill="#D5E1CF"
      />

      {/* Foreground meadow island */}
      <Ellipse cx="120" cy="144" rx="92" ry="20" fill="#C4D4BC" />

      {/* Stepping stones */}
      <Ellipse cx="96" cy="147" rx="10" ry="3.5" fill="#DDD6C8" />
      <Ellipse cx="118" cy="153" rx="12" ry="4" fill="#D4CCBC" />
      <Ellipse cx="142" cy="148" rx="9" ry="3" fill="#DDD6C8" />

      {/* Left botanical sprig (fern) */}
      <G stroke={palette.accentMoss} strokeWidth="1.8" strokeLinecap="round">
        <Path d="M68 136 C65 118, 56 106, 46 98" />
        <Path d="M63 122 C56 120, 52 117, 49 113" />
        <Path d="M59 112 C53 110, 49 107, 46 104" />
        <Path d="M66 126 C72 122, 76 118, 79 114" />
      </G>
      <Path
        d="M68 136 C72 120, 79 109, 88 103"
        stroke="#527B5E"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Center terracotta pot & bonsai sprout */}
      <Path d="M107 132 L133 132 L130 142 L110 142 Z" fill="#C47D59" />
      <Rect x="105" y="129" width="30" height="4" rx="2" fill="#B26B48" />
      <Path
        d="M120 129 C120 118, 117 111, 121 103 C124 97, 129 94, 130 89"
        stroke="#6E5544"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <Path
        d="M119 112 C113 108, 108 106, 104 106"
        stroke="#6E5544"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Ellipse cx="129" cy="86" rx="15" ry="9" fill={palette.accentMoss} />
      <Ellipse cx="104" cy="103" rx="11" ry="6.5" fill="#4E785B" />
      <Ellipse cx="122" cy="94" rx="10" ry="6" fill="#638E70" />

      {/* Right lavender stems */}
      <G>
        <Path
          d="M168 137 C167 121, 165 109, 162 96"
          stroke="#4F745A"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <Path
          d="M174 138 C176 122, 179 111, 183 99"
          stroke="#4F745A"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <Ellipse cx="162" cy="94" rx="3" ry="5" fill="#8272A1" />
        <Ellipse cx="163" cy="102" rx="3" ry="4.5" fill="#9586B3" />
        <Ellipse cx="164" cy="109" rx="2.8" ry="4" fill="#8272A1" />
        <Ellipse cx="183" cy="97" rx="3" ry="5" fill="#8272A1" />
        <Ellipse cx="181" cy="105" rx="3" ry="4.5" fill="#9586B3" />
        <Ellipse cx="179" cy="112" rx="2.6" ry="4" fill="#8272A1" />
      </G>

      {/* Morning dew droplets */}
      <Path
        d="M52 54 C52 54, 47 61, 47 64 C47 66.8, 49.2 69, 52 69 C54.8 69, 57 66.8, 57 64 C57 61, 52 54, 52 54 Z"
        fill={palette.accentDew}
        fillOpacity={0.22}
      />
      <Path
        d="M52 56.5 C52 56.5, 48.8 61.2, 48.8 63.5 C48.8 65.3, 50.2 66.8, 52 66.8 C53.8 66.8, 55.2 65.3, 55.2 63.5 C55.2 61.2, 52 56.5, 52 56.5 Z"
        fill={palette.accentDew}
        fillOpacity={0.65}
      />
      <Circle cx="68" cy="70" r="2.2" fill={palette.accentDew} fillOpacity={0.35} />
    </Svg>
  );
}

function LavenderSvg({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Soft linen backing circle */}
      <Circle cx="32" cy="32" r="28" fill="#F1EEF4" />

      {/* Terracotta pot */}
      <Path d="M21 44 L43 44 L40 55 L24 55 Z" fill="#C47D59" />
      <Rect x="19" y="41" width="26" height="4" rx="2" fill="#B26B48" />

      {/* Stems */}
      <Path
        d="M32 41 C32 32, 32 24, 32 14"
        stroke={palette.accentMoss}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M29 41 C26 33, 23 26, 20 19"
        stroke="#4F745A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <Path
        d="M35 41 C38 33, 41 26, 44 19"
        stroke="#4F745A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Narrow sage leaves */}
      <Path d="M31 39 C26 36, 22 35, 19 37" stroke="#5F866B" strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M33 39 C38 36, 42 35, 45 37" stroke="#5F866B" strokeWidth="1.6" strokeLinecap="round" />

      {/* Center lavender spike */}
      <Ellipse cx="32" cy="13" rx="2.6" ry="3.6" fill="#7D6B9E" />
      <Ellipse cx="29.5" cy="18" rx="2.2" ry="3" fill="#9282B0" />
      <Ellipse cx="34.5" cy="18" rx="2.2" ry="3" fill="#9282B0" />
      <Ellipse cx="29.5" cy="23.5" rx="2.1" ry="2.8" fill="#7D6B9E" />
      <Ellipse cx="34.5" cy="23.5" rx="2.1" ry="2.8" fill="#7D6B9E" />
      <Ellipse cx="32" cy="28" rx="2.2" ry="2.6" fill="#9E90BA" />

      {/* Left spike */}
      <Ellipse cx="20" cy="18" rx="2.2" ry="3.2" fill="#8D7DAC" />
      <Ellipse cx="22" cy="23" rx="2.1" ry="2.8" fill="#7D6B9E" />
      <Ellipse cx="24" cy="28" rx="2" ry="2.5" fill="#9E90BA" />

      {/* Right spike */}
      <Ellipse cx="44" cy="18" rx="2.2" ry="3.2" fill="#8D7DAC" />
      <Ellipse cx="42" cy="23" rx="2.1" ry="2.8" fill="#7D6B9E" />
      <Ellipse cx="40" cy="28" rx="2" ry="2.5" fill="#9E90BA" />
    </Svg>
  );
}

function BonsaiSproutSvg({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Soft sage-linen backing circle */}
      <Circle cx="32" cy="32" r="28" fill="#EDF2EC" />

      {/* Shallow ceramic bonsai tray */}
      <Path d="M16 46 L48 46 L45 53 L19 53 Z" fill="#5D7066" />
      <Rect x="14" y="44" width="36" height="3.5" rx="1.75" fill="#495B52" />
      <Ellipse cx="32" cy="44" rx="14" ry="2.5" fill="#7E967F" />

      {/* Curved warm bark trunk */}
      <Path
        d="M30 44 C29 37, 26 33, 30 27 C33 23, 38 22, 39 18"
        stroke="#735846"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <Path
        d="M28 32 C24 30, 21 28, 19 27"
        stroke="#735846"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Layered foliage clouds */}
      <Ellipse cx="38" cy="17" rx="12" ry="7" fill={palette.accentMoss} />
      <Ellipse cx="34" cy="21" rx="8" ry="4.5" fill="#4D785B" />
      <Ellipse cx="20" cy="26" rx="9" ry="5.5" fill="#5B8669" />
      <Ellipse cx="24" cy="24" rx="6" ry="3.8" fill="#719A7E" />
    </Svg>
  );
}

function SunlitFernSvg({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Warm sunlit linen backing circle */}
      <Circle cx="32" cy="32" r="28" fill="#F5F0E3" />

      {/* Subtle warm sun accent */}
      <Circle cx="44" cy="19" r="6" fill="#E8CE9B" />

      {/* Mossy earth mound */}
      <Ellipse cx="32" cy="49" rx="16" ry="5.5" fill="#A8BFA4" />
      <Ellipse cx="32" cy="50.5" rx="12" ry="3.5" fill="#8AA687" />

      {/* Left arching frond */}
      <G stroke={palette.accentMoss} strokeWidth="1.7" strokeLinecap="round">
        <Path d="M31 48 C27 37, 21 29, 13 24" />
        <Line x1="27" y1="39" x2="21" y2="38" />
        <Line x1="24" y1="34" x2="18" y2="33" />
        <Line x1="20" y1="29" x2="15" y2="28" />
        <Line x1="25" y1="36" x2="28" y2="31" />
        <Line x1="21" y1="31" x2="24" y2="26" />
      </G>

      {/* Center tall frond */}
      <G stroke="#3D6B4C" strokeWidth="1.8" strokeLinecap="round">
        <Path d="M32 48 C32 36, 33 25, 35 15" />
        <Line x1="32" y1="38" x2="27" y2="35" />
        <Line x1="32.5" y1="32" x2="27.5" y2="29" />
        <Line x1="33" y1="26" x2="29" y2="23" />
        <Line x1="32.5" y1="37" x2="37.5" y2="34" />
        <Line x1="33" y1="31" x2="38" y2="28" />
        <Line x1="34" y1="25" x2="38.5" y2="22" />
      </G>

      {/* Right unfurling frond with fiddlehead curl */}
      <G stroke="#558263" strokeWidth="1.7" strokeLinecap="round">
        <Path d="M34 48 C38 40, 44 35, 49 34 C51.5 33.5, 52 36.5, 49.5 37.5 C48 38, 47 36.5, 48 35.5" />
        <Line x1="38" y1="42" x2="43" y2="42" />
        <Line x1="41" y1="38" x2="46" y2="38.5" />
      </G>
    </Svg>
  );
}
