import { useId } from 'react';
import Svg, { Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { renderCritterSprite } from '@/components/ui/sprites/CritterSprites';
import { renderDecorSprite } from '@/components/ui/sprites/DecorSprites';
import { renderPlantSprite } from '@/components/ui/sprites/PlantSprites';
import { palette } from '@/theme/tokens';

export interface GardenSpriteProps {
  assetKey: string;
  size?: number;
  growthStage?: 1 | 2 | 3;
}

export function GardenSprite({
  assetKey,
  size = 44,
  growthStage = 3,
}: GardenSpriteProps) {
  const rawId = useId();
  const uid = `gs_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const artwork =
    renderPlantSprite(assetKey, uid, growthStage) ??
    renderDecorSprite(assetKey, uid) ??
    renderCritterSprite(assetKey, uid);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {artwork ?? (
        <G>
          <Defs>
            <RadialGradient id={`${uid}_fb_sh`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#263327" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="#263327" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="32" cy="56" rx="16" ry="5" fill={`url(#${uid}_fb_sh)`} />
          <Path
            d="M32 52 C32 42 32 34 32 26"
            stroke={palette.accentMoss}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <Path
            d="M32 34 C24 31 20 24 22 19 C28 20 32 26 32 34 Z"
            fill="#4F7F5E"
          />
          <Path
            d="M32 30 C40 27 44 20 42 15 C36 16 32 22 32 30 Z"
            fill="#669A74"
          />
        </G>
      )}
    </Svg>
  );
}
