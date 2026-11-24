import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import { palette } from '@/theme/tokens';

export interface GardenSpriteProps {
  assetKey: string;
  size?: number;
}

export function GardenSprite({ assetKey, size = 44 }: GardenSpriteProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Ellipse cx="32" cy="54" rx="16" ry="5" fill="#2A382B" fillOpacity={0.14} />
      {renderSpriteArtwork(assetKey)}
    </Svg>
  );
}

function renderSpriteArtwork(assetKey: string) {
  switch (assetKey) {
    // --- PLANTS (FREE) ---
    case 'lavender':
      return (
        <G>
          <Path d="M23 44 L41 44 L38 53 L26 53 Z" fill="#C47D59" />
          <Rect x="21" y="41" width="22" height="3.5" rx="1.75" fill="#B26B48" />
          <Path d="M32 41 L32 16" stroke={palette.accentMoss} strokeWidth="2" strokeLinecap="round" />
          <Path d="M29 41 L22 21" stroke="#4F745A" strokeWidth="1.6" strokeLinecap="round" />
          <Path d="M35 41 L42 21" stroke="#4F745A" strokeWidth="1.6" strokeLinecap="round" />
          <Ellipse cx="32" cy="15" rx="2.8" ry="4" fill="#7D6B9E" />
          <Ellipse cx="30" cy="21" rx="2.3" ry="3.2" fill="#9282B0" />
          <Ellipse cx="34" cy="21" rx="2.3" ry="3.2" fill="#9282B0" />
          <Ellipse cx="32" cy="27" rx="2.4" ry="3" fill="#7D6B9E" />
          <Ellipse cx="22" cy="20" rx="2.3" ry="3.4" fill="#8D7DAC" />
          <Ellipse cx="24" cy="26" rx="2.1" ry="2.8" fill="#7D6B9E" />
          <Ellipse cx="42" cy="20" rx="2.3" ry="3.4" fill="#8D7DAC" />
          <Ellipse cx="40" cy="26" rx="2.1" ry="2.8" fill="#7D6B9E" />
        </G>
      );

    case 'bonsai_sprout':
      return (
        <G>
          <Path d="M18 46 L46 46 L43 53 L21 53 Z" fill="#5D7066" />
          <Rect x="16" y="44" width="32" height="3" rx="1.5" fill="#495B52" />
          <Path
            d="M30 44 C29 37, 27 33, 31 27 C34 23, 38 22, 39 18"
            stroke="#735846"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <Path d="M29 33 C25 31, 22 29, 20 28" stroke="#735846" strokeWidth="2.2" strokeLinecap="round" />
          <Ellipse cx="38" cy="18" rx="12" ry="7" fill={palette.accentMoss} />
          <Ellipse cx="34" cy="21" rx="8" ry="4.5" fill="#4D785B" />
          <Ellipse cx="21" cy="27" rx="9" ry="5.5" fill="#5B8669" />
        </G>
      );

    case 'sunlit_fern':
      return (
        <G>
          <Ellipse cx="32" cy="50" rx="14" ry="4.5" fill="#8AA687" />
          <G stroke={palette.accentMoss} strokeWidth="1.9" strokeLinecap="round">
            <Path d="M31 49 C27 38, 21 30, 14 25" />
            <Line x1="27" y1="40" x2="21" y2="39" />
            <Line x1="23" y1="34" x2="18" y2="33" />
          </G>
          <G stroke="#3D6B4C" strokeWidth="2" strokeLinecap="round">
            <Path d="M32 49 C32 37, 33 26, 35 16" />
            <Line x1="32" y1="38" x2="27" y2="35" />
            <Line x1="33" y1="31" x2="28" y2="28" />
            <Line x1="32.5" y1="37" x2="38" y2="34" />
            <Line x1="33.5" y1="30" x2="38.5" y2="27" />
          </G>
          <Path
            d="M34 49 C38 41, 44 36, 49 35 C51 34.5, 51.5 37.5, 49 38.5"
            stroke="#558263"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </G>
      );

    case 'mossy_clover':
      return (
        <G>
          <Ellipse cx="32" cy="49" rx="16" ry="6" fill="#6F9471" />
          <Circle cx="24" cy="44" r="5" fill="#4D785B" />
          <Circle cx="30" cy="42" r="5.5" fill={palette.accentMoss} />
          <Circle cx="39" cy="44" r="5" fill="#5B8669" />
          <Circle cx="34" cy="48" r="4.5" fill="#7CA382" />
          <Circle cx="26" cy="48" r="4" fill="#638E70" />
        </G>
      );

    case 'meadow_daisy':
      return (
        <G>
          <Path d="M32 51 L32 28" stroke="#4D785B" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M32 45 C26 42, 23 41, 20 43" stroke="#5B8669" strokeWidth="2" strokeLinecap="round" />
          <Path d="M32 43 C38 40, 41 39, 44 41" stroke="#5B8669" strokeWidth="2" strokeLinecap="round" />
          <Circle cx="32" cy="19" r="4.5" fill="#FAF7F0" />
          <Circle cx="39" cy="24" r="4.5" fill="#FAF7F0" />
          <Circle cx="36" cy="32" r="4.5" fill="#FAF7F0" />
          <Circle cx="28" cy="32" r="4.5" fill="#FAF7F0" />
          <Circle cx="25" cy="24" r="4.5" fill="#FAF7F0" />
          <Circle cx="32" cy="26" r="5" fill="#E3B252" />
        </G>
      );

    case 'chamomile_tuft':
      return (
        <G>
          <Path d="M26 50 L22 30" stroke="#557D60" strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M32 51 L33 24" stroke="#486E53" strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M38 50 L43 32" stroke="#557D60" strokeWidth="1.8" strokeLinecap="round" />
          <Circle cx="22" cy="29" r="5.5" fill="#FDFBF7" />
          <Circle cx="22" cy="29" r="2.6" fill="#DDA94B" />
          <Circle cx="33" cy="23" r="6.5" fill="#FDFBF7" />
          <Circle cx="33" cy="23" r="3" fill="#DDA94B" />
          <Circle cx="43" cy="31" r="5" fill="#FDFBF7" />
          <Circle cx="43" cy="31" r="2.4" fill="#DDA94B" />
        </G>
      );

    case 'rosemary_sprig':
      return (
        <G>
          <Path d="M32 52 L32 16" stroke="#4F6E5B" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M32 45 L22 39 M32 45 L42 39" stroke="#628570" strokeWidth="2" strokeLinecap="round" />
          <Path d="M32 37 L21 31 M32 37 L43 31" stroke="#4F745E" strokeWidth="2" strokeLinecap="round" />
          <Path d="M32 29 L23 23 M32 29 L41 23" stroke="#628570" strokeWidth="2" strokeLinecap="round" />
          <Path d="M32 22 L26 17 M32 22 L38 17" stroke="#759882" strokeWidth="1.8" strokeLinecap="round" />
        </G>
      );

    case 'morning_glory':
      return (
        <G>
          <Path d="M28 52 C26 40, 34 32, 32 20" stroke="#4D785B" strokeWidth="2" strokeLinecap="round" />
          <Ellipse cx="24" cy="38" rx="6" ry="4" fill="#5D876A" />
          <Ellipse cx="40" cy="36" rx="5.5" ry="3.8" fill="#5D876A" />
          <Circle cx="32" cy="22" r="8" fill="#6D94B8" />
          <Circle cx="32" cy="22" r="3.5" fill="#EEF4FA" />
          <Circle cx="24" cy="29" r="5.5" fill="#82A7C7" />
          <Circle cx="24" cy="29" r="2.2" fill="#EEF4FA" />
        </G>
      );

    // --- PLANTS (PRO) ---
    case 'sakura_sapling':
      return (
        <G>
          <Path d="M32 52 C32 42, 31 35, 33 27" stroke="#785B4C" strokeWidth="3.6" strokeLinecap="round" />
          <Path d="M32 38 L24 31 M32 35 L41 29" stroke="#785B4C" strokeWidth="2.2" strokeLinecap="round" />
          <Circle cx="32" cy="21" r="11" fill="#E8B8C2" />
          <Circle cx="22" cy="27" r="8" fill="#F0C8D0" />
          <Circle cx="42" cy="26" r="8.5" fill="#DFABB6" />
          <Circle cx="33" cy="25" r="7" fill="#F4D5DC" />
        </G>
      );

    case 'moonflower_vine':
      return (
        <G>
          <Path d="M25 52 L25 20 M39 52 L39 20 M22 26 L42 26 M22 38 L42 38" stroke="#8C7E70" strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M25 48 C30 40, 35 34, 39 22" stroke="#4D6E5C" strokeWidth="2" strokeLinecap="round" />
          <Circle cx="31" cy="30" r="6" fill="#ECEAE2" />
          <Circle cx="31" cy="30" r="2.2" fill="#D5D9C4" />
          <Circle cx="39" cy="22" r="5" fill="#F6F5F0" />
          <Circle cx="25" cy="39" r="4.5" fill="#ECEAE2" />
        </G>
      );

    case 'weeping_willow':
      return (
        <G>
          <Path d="M32 52 L32 24" stroke="#6E5847" strokeWidth="4" strokeLinecap="round" />
          <Ellipse cx="32" cy="21" rx="16" ry="9" fill="#6F9471" />
          <Path d="M20 24 C18 33, 18 40, 19 46" stroke="#5B8260" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M26 24 C25 34, 25 41, 26 47" stroke="#7AA07C" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M38 24 C39 34, 39 41, 38 47" stroke="#5B8260" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M44 24 C46 33, 46 40, 45 46" stroke="#7AA07C" strokeWidth="2.2" strokeLinecap="round" />
        </G>
      );

    case 'golden_ginkgo':
      return (
        <G>
          <Path d="M32 52 L32 26" stroke="#7A604B" strokeWidth="3.5" strokeLinecap="round" />
          <Circle cx="32" cy="21" r="11" fill="#D9A74A" />
          <Circle cx="23" cy="27" r="8" fill="#E3B962" />
          <Circle cx="41" cy="27" r="8" fill="#C99438" />
          <Circle cx="32" cy="26" r="7" fill="#EAC678" />
        </G>
      );

    case 'lotus_blossom':
      return (
        <G>
          <Ellipse cx="32" cy="47" rx="18" ry="6.5" fill="#5D876A" />
          <Path d="M32 47 L46 44" stroke="#365E44" strokeWidth="1.5" />
          <Ellipse cx="24" cy="40" rx="6" ry="9" fill="#E4B5BE" transform="rotate(-22 24 40)" />
          <Ellipse cx="40" cy="40" rx="6" ry="9" fill="#E4B5BE" transform="rotate(22 40 40)" />
          <Ellipse cx="32" cy="36" rx="6.5" ry="11" fill="#F2D0D7" />
          <Circle cx="32" cy="39" r="3" fill="#E6BE68" />
        </G>
      );

    case 'starlight_orchid':
      return (
        <G>
          <Path d="M28 52 C28 38, 34 26, 42 18" stroke="#4D785B" strokeWidth="2.2" strokeLinecap="round" />
          <Circle cx="31" cy="35" r="5" fill="#B5A4CC" />
          <Circle cx="31" cy="35" r="1.8" fill="#F5E6B3" />
          <Circle cx="36" cy="26" r="5.5" fill="#9E8BB8" />
          <Circle cx="36" cy="26" r="2" fill="#F5E6B3" />
          <Circle cx="42" cy="18" r="4.5" fill="#C4B5D9" />
        </G>
      );

    case 'silver_olive':
      return (
        <G>
          <Path d="M31 52 C30 42, 34 36, 32 27" stroke="#857869" strokeWidth="3.6" strokeLinecap="round" />
          <Ellipse cx="32" cy="22" rx="13" ry="8.5" fill="#8EA393" />
          <Ellipse cx="22" cy="28" rx="8.5" ry="6" fill="#A2B5A7" />
          <Ellipse cx="41" cy="28" rx="8.5" ry="6" fill="#7E9483" />
        </G>
      );

    case 'wild_wisteria':
      return (
        <G>
          <Path d="M24 52 C24 38, 26 24, 38 20" stroke="#735A4A" strokeWidth="3.2" strokeLinecap="round" />
          <Ellipse cx="30" cy="27" rx="3.5" ry="8" fill="#9E88BF" />
          <Ellipse cx="37" cy="29" rx="3.5" ry="9" fill="#B4A0D1" />
          <Ellipse cx="43" cy="26" rx="3" ry="7" fill="#8C75B0" />
          <Ellipse cx="34" cy="19" rx="12" ry="5.5" fill="#5D8266" />
        </G>
      );

    case 'amber_maple':
      return (
        <G>
          <Path d="M32 52 L32 26" stroke="#6E5242" strokeWidth="3.6" strokeLinecap="round" />
          <Circle cx="32" cy="20" r="11" fill="#C26A46" />
          <Circle cx="22" cy="27" r="8" fill="#D48157" />
          <Circle cx="42" cy="27" r="8" fill="#AD5837" />
          <Circle cx="32" cy="26" r="6.5" fill="#DE9368" />
        </G>
      );

    case 'night_jasmine':
      return (
        <G>
          <Ellipse cx="32" cy="40" rx="15" ry="11" fill="#355441" />
          <Ellipse cx="24" cy="42" rx="9" ry="7" fill="#436650" />
          <Ellipse cx="40" cy="42" rx="9" ry="7" fill="#2D4737" />
          <Circle cx="25" cy="36" r="2.8" fill="#F7F3E6" />
          <Circle cx="34" cy="33" r="3" fill="#F7F3E6" />
          <Circle cx="41" cy="38" r="2.6" fill="#F7F3E6" />
          <Circle cx="30" cy="43" r="2.4" fill="#F7F3E6" />
        </G>
      );

    // --- DECOR (FREE) ---
    case 'stepping_stone':
      return (
        <G>
          <Ellipse cx="26" cy="47" rx="12" ry="5.5" fill="#B8B3A6" />
          <Ellipse cx="26" cy="45.5" rx="11" ry="4.5" fill="#CFCAC0" />
          <Ellipse cx="41" cy="42" rx="8" ry="4" fill="#ABA699" />
          <Ellipse cx="41" cy="41" rx="7" ry="3.2" fill="#C4BFB4" />
        </G>
      );

    case 'pebble_path':
      return (
        <G>
          <Ellipse cx="22" cy="46" rx="6" ry="3.2" fill="#C8C1B4" />
          <Ellipse cx="33" cy="49" rx="7" ry="3.5" fill="#B8B1A4" />
          <Ellipse cx="43" cy="45" rx="5.5" ry="3" fill="#D1CABD" />
          <Ellipse cx="31" cy="42" rx="5" ry="2.8" fill="#C4BDB0" />
          <Ellipse cx="39" cy="39" rx="4.5" ry="2.4" fill="#B8B1A4" />
        </G>
      );

    case 'wooden_bench':
      return (
        <G>
          <Rect x="17" y="42" width="3" height="10" rx="1" fill="#6F513B" />
          <Rect x="44" y="42" width="3" height="10" rx="1" fill="#6F513B" />
          <Rect x="15" y="38" width="34" height="5" rx="2" fill="#A67855" />
          <Rect x="17" y="29" width="30" height="4" rx="1.5" fill="#B58763" />
          <Rect x="17" y="34" width="30" height="3" rx="1.2" fill="#9A6D4B" />
          <Rect x="18" y="28" width="2.5" height="11" fill="#7D5C43" />
          <Rect x="43.5" y="28" width="2.5" height="11" fill="#7D5C43" />
        </G>
      );

    case 'clay_birdbath':
      return (
        <G>
          <Ellipse cx="32" cy="51" rx="10" ry="3.5" fill="#B26B48" />
          <Rect x="28" y="35" width="8" height="15" rx="2" fill="#C47D59" />
          <Ellipse cx="32" cy="34" rx="15" ry="5.5" fill="#B26B48" />
          <Ellipse cx="32" cy="33" rx="12" ry="3.8" fill="#82AFC0" />
          <Path d="M27 33 Q32 31 37 33" stroke="#E2F0F5" strokeWidth="1.2" strokeLinecap="round" />
        </G>
      );

    case 'reed_lantern':
      return (
        <G>
          <Rect x="29" y="46" width="6" height="6" rx="1.5" fill="#7A6248" />
          <Rect x="22" y="24" width="20" height="23" rx="7" fill="#C9A875" />
          <Rect x="26" y="28" width="12" height="15" rx="4" fill="#F2CA74" />
          <Line x1="22" y1="32" x2="42" y2="32" stroke="#9C7B4B" strokeWidth="1.2" />
          <Line x1="22" y1="39" x2="42" y2="39" stroke="#9C7B4B" strokeWidth="1.2" />
          <Path d="M25 24 Q32 16 39 24" stroke="#7A6248" strokeWidth="2" fill="none" />
        </G>
      );

    // --- DECOR (PRO) ---
    case 'stone_lantern':
      return (
        <G>
          <Rect x="24" y="47" width="16" height="5" rx="1.5" fill="#94938C" />
          <Rect x="28" y="35" width="8" height="12" fill="#A6A59E" />
          <Rect x="24" y="25" width="16" height="10" rx="1.5" fill="#94938C" />
          <Rect x="28" y="27" width="8" height="6" rx="1" fill="#F0C76E" />
          <Polygon points="18,26 32,16 46,26" fill="#84837C" />
          <Circle cx="32" cy="15" r="2.2" fill="#84837C" />
        </G>
      );

    case 'koi_pond':
      return (
        <G>
          <Ellipse cx="32" cy="43" rx="22" ry="11" fill="#A8A397" />
          <Ellipse cx="32" cy="43" rx="18" ry="8.5" fill="#5D92A6" />
          <Ellipse cx="32" cy="42" rx="14" ry="6" fill="#72A8BC" />
          <Path d="M24 42 Q28 39 33 42" stroke="#E88B5A" strokeWidth="2.5" strokeLinecap="round" />
          <Circle cx="41" cy="44" r="3" fill="#5D876A" />
        </G>
      );

    case 'bamboo_fountain':
      return (
        <G>
          <Ellipse cx="32" cy="48" rx="14" ry="5.5" fill="#8F8D84" />
          <Ellipse cx="32" cy="47.5" rx="10.5" ry="3.8" fill="#6E9EB0" />
          <Path d="M40 46 L40 24" stroke="#6B8E5C" strokeWidth="4" strokeLinecap="round" />
          <Path d="M40 28 L29 34" stroke="#7FA36E" strokeWidth="3.2" strokeLinecap="round" />
          <Path d="M29 35 L29 45" stroke="#B7DAE6" strokeWidth="1.8" strokeDasharray="2 2" />
        </G>
      );

    case 'cedar_gazebo':
      return (
        <G>
          <Rect x="16" y="47" width="32" height="5" rx="1.5" fill="#8C674B" />
          <Rect x="19" y="28" width="3" height="20" fill="#9E7555" />
          <Rect x="42" y="28" width="3" height="20" fill="#9E7555" />
          <Polygon points="12,30 32,14 52,30" fill="#A86E49" />
          <Polygon points="16,29 32,17 48,29" fill="#BD8059" />
        </G>
      );

    case 'glass_greenhouse':
      return (
        <G>
          <Rect x="16" y="30" width="32" height="21" rx="2" fill="#DCEAE6" stroke="#628076" strokeWidth="2" />
          <Polygon points="14,30 32,16 50,30" fill="#E6F2EE" stroke="#628076" strokeWidth="2" />
          <Line x1="32" y1="16" x2="32" y2="51" stroke="#628076" strokeWidth="1.5" />
          <Line x1="16" y1="40" x2="48" y2="40" stroke="#628076" strokeWidth="1.2" />
          <Circle cx="24" cy="45" r="3" fill={palette.accentMoss} />
          <Circle cx="40" cy="45" r="3" fill="#5D876A" />
        </G>
      );

    // --- CRITTERS (FREE) ---
    case 'garden_robin':
      return (
        <G>
          <Line x1="29" y1="46" x2="29" y2="52" stroke="#6B5344" strokeWidth="1.6" />
          <Line x1="35" y1="46" x2="35" y2="52" stroke="#6B5344" strokeWidth="1.6" />
          <Ellipse cx="32" cy="39" rx="10" ry="8" fill="#6E655D" />
          <Ellipse cx="35" cy="41" rx="6" ry="5.5" fill="#C86D4A" />
          <Circle cx="36" cy="32" r="5.5" fill="#6E655D" />
          <Polygon points="41,31 46,33 41,34.5" fill="#D9A74A" />
          <Circle cx="38" cy="31" r="1.1" fill="#1E241E" />
        </G>
      );

    case 'meadow_butterfly':
      return (
        <G>
          <Ellipse cx="24" cy="28" rx="8" ry="6" fill="#E6B655" transform="rotate(-20 24 28)" />
          <Ellipse cx="40" cy="28" rx="8" ry="6" fill="#E6B655" transform="rotate(20 40 28)" />
          <Ellipse cx="25" cy="37" rx="6" ry="5" fill="#D49A3B" transform="rotate(15 25 37)" />
          <Ellipse cx="39" cy="37" rx="6" ry="5" fill="#D49A3B" transform="rotate(-15 39 37)" />
          <Rect x="30.8" y="24" width="2.4" height="16" rx="1.2" fill="#4A3D31" />
        </G>
      );

    // --- CRITTERS (PRO) ---
    case 'hedgehog':
      return (
        <G>
          <Ellipse cx="30" cy="43" rx="13" ry="9" fill="#7D6452" />
          <Ellipse cx="39" cy="45" rx="7" ry="5.5" fill="#D1BCA8" />
          <Circle cx="45" cy="44" r="1.8" fill="#362B24" />
          <Circle cx="40" cy="43" r="1.2" fill="#1E241E" />
          <Circle cx="24" cy="39" r="2" fill="#634E3F" />
          <Circle cx="30" cy="37" r="2" fill="#634E3F" />
          <Circle cx="27" cy="44" r="2" fill="#634E3F" />
        </G>
      );

    case 'firefly_cluster':
      return (
        <G>
          <Circle cx="24" cy="36" r="6" fill="#F2D172" fillOpacity={0.3} />
          <Circle cx="24" cy="36" r="2.4" fill="#F2D172" />
          <Circle cx="38" cy="26" r="7" fill="#F2D172" fillOpacity={0.32} />
          <Circle cx="38" cy="26" r="2.8" fill="#F5DC8B" />
          <Circle cx="36" cy="42" r="5" fill="#F2D172" fillOpacity={0.28} />
          <Circle cx="36" cy="42" r="2" fill="#F2D172" />
        </G>
      );

    case 'moss_frog':
      return (
        <G>
          <Ellipse cx="32" cy="45" rx="11" ry="7" fill="#5D8C5A" />
          <Circle cx="27" cy="38" r="3.5" fill="#6EA06A" />
          <Circle cx="37" cy="38" r="3.5" fill="#6EA06A" />
          <Circle cx="27" cy="37.5" r="1.3" fill="#1E241E" />
          <Circle cx="37" cy="37.5" r="1.3" fill="#1E241E" />
          <Ellipse cx="32" cy="47" rx="6" ry="3.5" fill="#A6C49D" />
        </G>
      );

    case 'ginger_cat':
      return (
        <G>
          <Ellipse cx="32" cy="44" rx="13" ry="8" fill="#D48B54" />
          <Circle cx="39" cy="37" r="6.5" fill="#DE9862" />
          <Polygon points="34,33 36,27 39,32" fill="#D48B54" />
          <Polygon points="40,32 43,27 45,33" fill="#D48B54" />
          <Path d="M36 37 Q37.5 38.5 39 37 M40.5 37 Q42 38.5 43.5 37" stroke="#4F3624" strokeWidth="1.2" fill="none" />
          <Path d="M19 45 C16 40, 20 35, 25 38" stroke="#C47B45" strokeWidth="3" strokeLinecap="round" fill="none" />
        </G>
      );

    case 'golden_koi':
      return (
        <G>
          <Ellipse cx="32" cy="45" rx="16" ry="7" fill="#70A3B5" fillOpacity={0.35} />
          <Path
            d="M20 42 C25 34, 37 34, 44 42 C38 47, 26 47, 20 42 Z"
            fill="#E39746"
          />
          <Polygon points="21,42 14,37 15,46" fill="#EDAE66" />
          <Circle cx="39" cy="40.5" r="1.2" fill="#1E241E" />
        </G>
      );

    default:
      return (
        <G>
          <Path d="M32 50 L32 28" stroke={palette.accentMoss} strokeWidth="2.4" strokeLinecap="round" />
          <Ellipse cx="26" cy="34" rx="6" ry="4" fill="#5D876A" />
          <Ellipse cx="38" cy="30" rx="6" ry="4" fill={palette.accentMoss} />
        </G>
      );
  }
}
