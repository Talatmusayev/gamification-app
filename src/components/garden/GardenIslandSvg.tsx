import { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import {
  getSanctuaryLandmarks,
  type SanctuaryLandmarks,
} from '@/domain/landmarks';
import type { GardenPlacement } from '@/domain/types';

export interface GardenGridCoord {
  x: number;
  y: number;
}

export interface IslandAnchorPoint {
  x: number;
  y: number;
}

export interface IslandLandmarkAnchors {
  pond: IslandAnchorPoint;
  waterfallLip: IslandAnchorPoint;
  waterfallMist: IslandAnchorPoint;
  postbox: IslandAnchorPoint;
  greenhouse: IslandAnchorPoint;
  greenhouseVent: IslandAnchorPoint;
  pier: IslandAnchorPoint;
  well: IslandAnchorPoint;
}

export function getIslandLandmarkAnchors({
  originX,
  originY,
  tileWidth,
  tileHeight,
}: {
  originX: number;
  originY: number;
  tileWidth: number;
  tileHeight: number;
}): IslandLandmarkAnchors {
  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;
  const rightX = originX + GRID_SIZE * halfW;
  const rightY = originY + (GRID_SIZE - 1) * halfH;
  const bottomX = originX;
  const bottomY = originY + (GRID_SIZE * 2 - 1) * halfH;
  const leftX = originX - GRID_SIZE * halfW;
  const leftY = originY + (GRID_SIZE - 1) * halfH;
  const topX = originX;
  const topY = originY - halfH;

  const padX = 48;
  const padY = 25;
  const oTopX = topX;
  const oTopY = topY - padY;
  const oRightX = rightX + padX;
  const oRightY = rightY;
  const oBottomX = bottomX;
  const oBottomY = bottomY + padY;
  const oLeftX = leftX - padX;
  const oLeftY = leftY;

  // Front-right pond cove & waterfall lip (outside the 8x8 playable grid)
  const pondCx = oRightX - 128; // ~578
  const pondCy = oRightY + 69; // ~278
  const wfLipX = pondCx + 36; // ~614
  const wfLipY = pondCy + 8; // ~286

  // Front-left Keeper postbox along scenic verge
  const postboxX = oLeftX + (oBottomX - oLeftX) * 0.505; // ~204
  const postboxY = oLeftY + (oBottomY - oLeftY) * 0.505 - 8; // ~290

  // Back-right Corner Conservatory / Greenhouse nook on upper rim pocket
  const greenhouseX = oTopX + (oRightX - oTopX) * 0.57; // ~562
  const greenhouseY = oTopY + (oRightY - oTopY) * 0.57 - 15; // ~118

  // Front-right Pier & Stone Wishing Well
  const pierX = pondCx - 38; // ~540
  const pierY = pondCy + 10; // ~288
  const wellX = oBottomX + 98; // ~468
  const wellY = oBottomY - 60; // ~326

  return {
    pond: { x: pondCx, y: pondCy },
    waterfallLip: { x: wfLipX, y: wfLipY },
    waterfallMist: { x: wfLipX - 6, y: wfLipY + 78 },
    postbox: { x: postboxX, y: postboxY },
    greenhouse: { x: greenhouseX, y: greenhouseY },
    greenhouseVent: { x: greenhouseX + 6, y: greenhouseY - 34 },
    pier: { x: pierX, y: pierY },
    well: { x: wellX, y: wellY },
  };
}

export interface GardenIslandSvgProps {
  canvasWidth: number;
  canvasHeight: number;
  originX: number;
  originY: number;
  tileWidth: number;
  tileHeight: number;
  cliffDepth: number;
  allTiles: readonly GardenGridCoord[];
  placementByCoord: Map<string, GardenPlacement>;
  isInteractiveMode: boolean;
  movingPlacementId?: string | null;
  isNight: boolean;
  isDusk: boolean;
  landmarks?: SanctuaryLandmarks;
  hasPendingReveal?: boolean;
}

export function GardenIslandSvg({
  canvasWidth,
  canvasHeight,
  originX,
  originY,
  tileWidth,
  tileHeight,
  cliffDepth,
  allTiles,
  placementByCoord,
  isInteractiveMode,
  movingPlacementId,
  isNight,
  isDusk,
  landmarks,
  hasPendingReveal = false,
}: GardenIslandSvgProps) {
  const rawId = useId();
  const uid = `island_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const resolvedLandmarks =
    landmarks ??
    getSanctuaryLandmarks({
      daysTended: 0,
      harmonyDays: 0,
      placementCount: placementByCoord.size,
    });

  const halfW = tileWidth / 2;
  const halfH = tileHeight / 2;

  // Inner 8x8 playable diamond corners
  const topX = originX;
  const topY = originY - halfH;
  const rightX = originX + GRID_SIZE * halfW;
  const rightY = originY + (GRID_SIZE - 1) * halfH;
  const bottomX = originX;
  const bottomY = originY + (GRID_SIZE * 2 - 1) * halfH;
  const leftX = originX - GRID_SIZE * halfW;
  const leftY = originY + (GRID_SIZE - 1) * halfH;

  // Outer lush apron border (expanded generously for Hay Day scenic framing)
  const padX = 48;
  const padY = 25;
  const oTopX = topX;
  const oTopY = topY - padY;
  const oRightX = rightX + padX;
  const oRightY = rightY;
  const oBottomX = bottomX;
  const oBottomY = bottomY + padY;
  const oLeftX = leftX - padX;
  const oLeftY = leftY;

  const anchors = getIslandLandmarkAnchors({
    originX,
    originY,
    tileWidth,
    tileHeight,
  });

  const pondCx = anchors.pond.x;
  const pondCy = anchors.pond.y;
  const wfLipX = anchors.waterfallLip.x;
  const wfLipY = anchors.waterfallLip.y;
  const postboxX = anchors.postbox.x;
  const postboxY = anchors.postbox.y;
  const ghX = anchors.greenhouse.x;
  const ghY = anchors.greenhouse.y;
  const pierX = anchors.pier.x;
  const pierY = anchors.pier.y;
  const wellX = anchors.well.x;
  const wellY = anchors.well.y;

  const outerTopPoints = `${oTopX},${oTopY} ${oRightX},${oRightY} ${oBottomX},${oBottomY} ${oLeftX},${oLeftY}`;
  const innerTopPoints = `${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`;

  // Multi-strata cliff depths
  const rimDepth = 11;
  const soilDepth = 22;
  const midRockDepth = cliffDepth + 4;
  const underTipY = oBottomY + midRockDepth + 36;

  // Grass overhang rim
  const leftRimPoints = `${oLeftX},${oLeftY} ${oBottomX},${oBottomY} ${oBottomX},${oBottomY + rimDepth} ${oLeftX},${oLeftY + rimDepth}`;
  const rightRimPoints = `${oBottomX},${oBottomY} ${oRightX},${oRightY} ${oRightX},${oRightY + rimDepth} ${oBottomX},${oBottomY + rimDepth}`;

  // Terracotta topsoil band
  const leftSoilPoints = `${oLeftX},${oLeftY + rimDepth} ${oBottomX},${oBottomY + rimDepth} ${oBottomX},${oBottomY + soilDepth} ${oLeftX + 8},${oLeftY + soilDepth}`;
  const rightSoilPoints = `${oBottomX},${oBottomY + rimDepth} ${oRightX},${oRightY + rimDepth} ${oRightX - 8},${oRightY + soilDepth} ${oBottomX},${oBottomY + soilDepth}`;

  // Faceted weathered limestone rock walls
  const leftRockPoints = `${oLeftX + 8},${oLeftY + soilDepth} ${oBottomX},${oBottomY + soilDepth} ${oBottomX},${oBottomY + midRockDepth} ${oLeftX + 32},${oLeftY + midRockDepth + 8}`;
  const rightRockPoints = `${oBottomX},${oBottomY + soilDepth} ${oRightX - 8},${oRightY + soilDepth} ${oRightX - 32},${oRightY + midRockDepth + 8} ${oBottomX},${oBottomY + midRockDepth}`;

  // Tapered floating rocky underside
  const leftUnderPoints = `${oLeftX + 32},${oLeftY + midRockDepth + 8} ${oBottomX},${oBottomY + midRockDepth} ${oBottomX},${underTipY} ${oLeftX + 108},${oLeftY + midRockDepth + 34}`;
  const rightUnderPoints = `${oBottomX},${oBottomY + midRockDepth} ${oRightX - 32},${oRightY + midRockDepth + 8} ${oRightX - 108},${oRightY + midRockDepth + 34} ${oBottomX},${underTipY}`;

  const diamondPoints = (cx: number, cy: number): string =>
    `${cx},${cy - halfH} ${cx + halfW},${cy} ${cx},${cy + halfH} ${cx - halfW},${cy}`;

  // Atmosphere palette
  const grassStart = isNight ? '#334E3C' : isDusk ? '#D8DFC2' : '#E7F1DC';
  const grassMid = isNight ? '#284032' : isDusk ? '#C3D0B2' : '#D3E3C5';
  const grassEnd = isNight ? '#203328' : isDusk ? '#AEC09E' : '#BCD2AE';
  const apronColor = isNight ? '#253B2E' : isDusk ? '#B8C7A5' : '#C3D7B2';
  const rimLeftColor = isNight ? '#2D4A36' : '#7CA26E';
  const rimRightColor = isNight ? '#233B2B' : '#648A5A';
  const terraceTopColor = isNight ? '#32513B' : isDusk ? '#BAC9A4' : '#B8D0A3';
  const terraceWallColor = isNight ? '#3E3933' : '#9C8D79';
  const warmGlowActive = isNight || isDusk;

  const scenicOpacity = isInteractiveMode ? 0.42 : 1;

  return (
    <Svg
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
    >
      <Defs>
        <RadialGradient id={`${uid}_shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="rgba(26, 34, 28, 0.24)" />
          <Stop offset="55%" stopColor="rgba(26, 34, 28, 0.10)" />
          <Stop offset="100%" stopColor="rgba(26, 34, 28, 0)" />
        </RadialGradient>
        <LinearGradient id={`${uid}_grass`} x1="12%" y1="0%" x2="88%" y2="100%">
          <Stop offset="0%" stopColor={grassStart} />
          <Stop offset="52%" stopColor={grassMid} />
          <Stop offset="100%" stopColor={grassEnd} />
        </LinearGradient>
        <LinearGradient id={`${uid}_leftSoil`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#5C4B3B' : '#B98C66'} />
          <Stop offset="100%" stopColor={isNight ? '#4A3C2F' : '#9C7250'} />
        </LinearGradient>
        <LinearGradient id={`${uid}_rightSoil`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#493B2F' : '#9E7453'} />
          <Stop offset="100%" stopColor={isNight ? '#382D24' : '#805B3F'} />
        </LinearGradient>
        <LinearGradient id={`${uid}_leftRock`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#49453E' : '#B7A48C'} />
          <Stop offset="58%" stopColor={isNight ? '#3A3731' : '#9C876E'} />
          <Stop offset="100%" stopColor={isNight ? '#2D2A26' : '#826E57'} />
        </LinearGradient>
        <LinearGradient id={`${uid}_rightRock`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#3A3732' : '#95816A'} />
          <Stop offset="60%" stopColor={isNight ? '#2D2B27' : '#7D6A54'} />
          <Stop offset="100%" stopColor={isNight ? '#22201E' : '#655441'} />
        </LinearGradient>
        <RadialGradient id={`${uid}_pondWater`} cx="42%" cy="38%" r="62%">
          <Stop offset="0%" stopColor={isNight ? '#427080' : '#9FD7E2'} />
          <Stop offset="58%" stopColor={isNight ? '#2E5563' : '#63A4B4'} />
          <Stop offset="100%" stopColor={isNight ? '#1E3C47' : '#3E798A'} />
        </RadialGradient>
        <LinearGradient id={`${uid}_waterfall`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#588999' : '#B2E3EC'} stopOpacity={0.94} />
          <Stop offset="55%" stopColor={isNight ? '#406E7D' : '#7AC2D0'} stopOpacity={0.8} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.05} />
        </LinearGradient>
        <RadialGradient id={`${uid}_amberPool`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#E3B261" stopOpacity={0.46} />
          <Stop offset="55%" stopColor="#E3B261" stopOpacity={0.16} />
          <Stop offset="100%" stopColor="#E3B261" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`${uid}_glassPane`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop
            offset="0%"
            stopColor={
              resolvedLandmarks.greenhouseStage === 'overgrown'
                ? '#B9C7BA'
                : warmGlowActive
                  ? '#F8DA98'
                  : '#DCEFF2'
            }
          />
          <Stop
            offset="100%"
            stopColor={
              resolvedLandmarks.greenhouseStage === 'overgrown'
                ? '#8EA091'
                : warmGlowActive
                  ? '#E3B261'
                  : '#A7CBD4'
            }
          />
        </LinearGradient>
      </Defs>

      {/* Soft elliptical floating shadow underneath the island */}
      <Ellipse
        cx={originX}
        cy={underTipY + 26}
        rx={GRID_SIZE * halfW * 0.86}
        ry={21}
        fill={`url(#${uid}_shadow)`}
      />

      {/* Layer 4: Tapered floating rocky underside & organic rock spurs */}
      <Polygon points={leftUnderPoints} fill={isNight ? '#2A2824' : '#7B6753'} />
      <Polygon points={rightUnderPoints} fill={isNight ? '#1F1D1A' : '#625140'} />
      <Polygon
        points={`${oBottomX - 42},${oBottomY + midRockDepth + 4} ${oBottomX},${oBottomY + midRockDepth} ${oBottomX + 24},${oBottomY + midRockDepth + 14} ${oBottomX},${underTipY + 4}`}
        fill={isNight ? '#24221F' : '#6E5B48'}
      />

      {/* Trailing underside roots */}
      <G stroke={isNight ? '#43382C' : '#6B533E'} strokeLinecap="round" fill="none">
        <Path
          d={`M ${oBottomX - 88} ${oBottomY + 18} Q ${oBottomX - 96} ${oBottomY + 54} ${oBottomX - 80} ${oBottomY + 72}`}
          strokeWidth={2.4}
        />
        <Path
          d={`M ${oBottomX - 22} ${oBottomY + 42} Q ${oBottomX - 14} ${oBottomY + 72} ${oBottomX - 24} ${oBottomY + 88}`}
          strokeWidth={2}
        />
        <Path
          d={`M ${oBottomX + 52} ${oBottomY + 32} Q ${oBottomX + 60} ${oBottomY + 60} ${oBottomX + 46} ${oBottomY + 76}`}
          strokeWidth={1.9}
        />
        <Path
          d={`M ${oBottomX + 126} ${oBottomY - 12} Q ${oBottomX + 132} ${oBottomY + 18} ${oBottomX + 120} ${oBottomY + 34}`}
          strokeWidth={1.6}
        />
      </G>

      {/* Layer 3: Weathered sandstone & limestone cliff walls */}
      <Polygon points={leftRockPoints} fill={`url(#${uid}_leftRock)`} />
      <Polygon points={rightRockPoints} fill={`url(#${uid}_rightRock)`} />

      {/* Organic rock strata highlights, crevices & lower outcrop ledges */}
      <Polygon
        points={`${oLeftX + 76},${oLeftY + 56} ${oLeftX + 142},${oLeftY + 90} ${oLeftX + 126},${oLeftY + 114} ${oLeftX + 68},${oLeftY + 78}`}
        fill="rgba(255, 248, 232, 0.10)"
      />
      <Polygon
        points={`${oLeftX + 190},${oLeftY + 116} ${oLeftX + 252},${oLeftY + 148} ${oLeftX + 240},${oLeftY + 168} ${oLeftX + 184},${oLeftY + 134}`}
        fill="rgba(255, 248, 232, 0.08)"
      />
      <Polygon
        points={`${oBottomX + 68},${oBottomY - 10} ${oBottomX + 138},${oBottomY - 46} ${oBottomX + 128},${oBottomY - 14} ${oBottomX + 66},${oBottomY + 18}`}
        fill="rgba(0, 0, 0, 0.10)"
      />
      <Path
        d={`M ${oLeftX + 112} ${oLeftY + 62} L ${oLeftX + 120} ${oLeftY + 86} M ${oBottomX + 48} ${oBottomY + 6} L ${oBottomX + 44} ${oBottomY + 34} M ${oBottomX + 178} ${oBottomY - 68} L ${oBottomX + 174} ${oBottomY - 42}`}
        stroke={isNight ? 'rgba(18, 16, 14, 0.45)' : 'rgba(72, 58, 44, 0.24)'}
        strokeWidth={1.3}
        strokeLinecap="round"
      />

      {/* Layer 2: Rich terracotta topsoil band */}
      <Polygon points={leftSoilPoints} fill={`url(#${uid}_leftSoil)`} />
      <Polygon points={rightSoilPoints} fill={`url(#${uid}_rightSoil)`} />

      {/* Layer 1: Lush overhanging grass rim */}
      <Polygon points={leftRimPoints} fill={rimLeftColor} />
      <Polygon points={rightRimPoints} fill={rimRightColor} />

      {/* Outer meadow verge apron + scenic organic edge pockets */}
      <Polygon
        points={outerTopPoints}
        fill={apronColor}
        stroke="rgba(54, 94, 68, 0.16)"
        strokeWidth={1.2}
      />

      {/* Front-right curved pond cove cliff & grass pocket */}
      <Path
        d={`M ${pondCx - 54} ${pondCy + 16} Q ${pondCx - 10} ${pondCy + 38} ${wfLipX + 18} ${wfLipY + 4} L ${wfLipX + 18} ${wfLipY + 18} Q ${pondCx - 8} ${pondCy + 50} ${pondCx - 54} ${pondCy + 27} Z`}
        fill={rimRightColor}
      />
      <Ellipse
        cx={pondCx - 6}
        cy={pondCy + 6}
        rx={58}
        ry={27}
        fill={apronColor}
      />

      {/* Front-left postbox landing & Wishing well terrace verge pockets */}
      <Ellipse
        cx={postboxX - 4}
        cy={postboxY + 6}
        rx={26}
        ry={13}
        fill={apronColor}
      />
      <Ellipse
        cx={wellX + 4}
        cy={wellY + 10}
        rx={32}
        ry={15}
        fill={apronColor}
      />

      {/* Back-right conservatory pocket terrace pad */}
      <Ellipse
        cx={ghX + 4}
        cy={ghY + 12}
        rx={44}
        ry={20}
        fill={isNight ? '#2B4536' : '#BACFA8'}
        stroke="rgba(54, 94, 68, 0.16)"
        strokeWidth={1}
      />

      {/* Scalloped overhanging moss tufts along front edges */}
      <G fill={rimLeftColor}>
        {[0.18, 0.34, 0.56, 0.78].map((t, i) => {
          const mx = oLeftX + (oBottomX - oLeftX) * t;
          const my = oLeftY + (oBottomY - oLeftY) * t + rimDepth;
          return <Ellipse key={`ml_${i}`} cx={mx} cy={my} rx={11} ry={4.2} />;
        })}
      </G>
      <G fill={rimRightColor}>
        {[0.22, 0.48, 0.76].map((t, i) => {
          const mx = oBottomX + (oRightX - oBottomX) * t;
          const my = oBottomY + (oRightY - oBottomY) * t + rimDepth;
          return <Ellipse key={`mr_${i}`} cx={mx} cy={my} rx={10.5} ry={4} />;
        })}
      </G>

      {/* Inner 8x8 sunlit meadow plateau */}
      <Polygon
        points={innerTopPoints}
        fill={`url(#${uid}_grass)`}
        stroke="rgba(54, 94, 68, 0.12)"
        strokeWidth={1}
      />

      {/* Warm dappled tree shadows & layered sunlit meadow contours */}
      {!isInteractiveMode ? (
        <G>
          <Ellipse
            cx={originX - 72}
            cy={originY + 126}
            rx={68}
            ry={28}
            fill={isNight ? '#344F3D' : '#E5F0D8'}
            opacity={0.74}
          />
          <Ellipse
            cx={originX + 64}
            cy={originY + 170}
            rx={56}
            ry={24}
            fill={isNight ? '#24392C' : '#C3D7B2'}
            opacity={0.55}
          />
          <Ellipse
            cx={originX - 8}
            cy={originY + 216}
            rx={50}
            ry={19}
            fill={isNight ? '#334D3C' : '#E1ECD4'}
            opacity={0.62}
          />
          {/* Dappled canopy shadows near back-left terrace and back-right nook */}
          <Ellipse
            cx={leftX + 94}
            cy={leftY - 18}
            rx={34}
            ry={14}
            fill={isNight ? 'rgba(10, 18, 12, 0.25)' : 'rgba(54, 94, 68, 0.10)'}
          />
          <Ellipse
            cx={topX - 42}
            cy={topY + 42}
            rx={28}
            ry={12}
            fill={isNight ? 'rgba(10, 18, 12, 0.22)' : 'rgba(54, 94, 68, 0.09)'}
          />
          <Ellipse
            cx={rightX - 96}
            cy={rightY - 26}
            rx={32}
            ry={13}
            fill={isNight ? 'rgba(10, 18, 12, 0.22)' : 'rgba(54, 94, 68, 0.09)'}
          />
        </G>
      ) : null}

      {/* Stepped Upper Moss Terrace & 3 Carved Stone Steps (back-left ridge) */}
      <G opacity={scenicOpacity}>
        {/* Retaining stone & moss terrace face */}
        <Path
          d={`M ${oLeftX + 54} ${oLeftY - 12} Q ${oLeftX + 122} ${oLeftY - 56} ${oTopX - 110} ${oTopY + 42} L ${oTopX - 110} ${oTopY + 56} Q ${oLeftX + 122} ${oLeftY - 40} ${oLeftX + 54} ${oLeftY + 2} Z`}
          fill={terraceWallColor}
        />
        {/* Lush curved moss plateau */}
        <Path
          d={`M ${oLeftX + 44} ${oLeftY - 16} Q ${oLeftX + 114} ${oLeftY - 68} ${oTopX - 104} ${oTopY + 34} Q ${oLeftX + 132} ${oLeftY - 56} ${oLeftX + 54} ${oLeftY - 10} Z`}
          fill={terraceTopColor}
          stroke={isNight ? '#40654A' : '#85AA75'}
          strokeWidth={1}
        />
        <Ellipse
          cx={oLeftX + 118}
          cy={oLeftY - 48}
          rx={54}
          ry={16}
          transform={`rotate(-26 ${oLeftX + 118} ${oLeftY - 48})`}
          fill={terraceTopColor}
        />
        {/* 3 Carved Stone Steps leading down from upper terrace to meadow */}
        {[0, 1, 2].map((stepIdx) => {
          const sx = oLeftX + 146 + stepIdx * 10;
          const sy = oLeftY - 48 + stepIdx * 6;
          return (
            <G key={`step_${stepIdx}`}>
              <Polygon
                points={`${sx},${sy + 3} ${sx + 16},${sy - 5} ${sx + 16},${sy - 1} ${sx},${sy + 7}`}
                fill={isNight ? '#4B524C' : '#AFA898'}
              />
              <Polygon
                points={`${sx - 6},${sy} ${sx + 10},${sy - 8} ${sx + 16},${sy - 5} ${sx},${sy + 3}`}
                fill={isNight ? '#646D65' : '#E2DCCE'}
                stroke={isNight ? '#464E47' : '#C2BBA9'}
                strokeWidth={0.7}
              />
            </G>
          );
        })}
      </G>

      {/* Meandering Cobblestone Trail linking Postbox -> Meadow -> Wishing Well -> Pier */}
      <G opacity={isInteractiveMode ? 0.34 : 0.92}>
        {[
          { cx: postboxX + 14, cy: postboxY - 6, rx: 8.5, ry: 4.5 },
          { cx: postboxX + 34, cy: postboxY - 16, rx: 10, ry: 5.2 },
          { cx: originX - 96, cy: originY + 154, rx: 12, ry: 6.2 },
          { cx: originX - 62, cy: originY + 166, rx: 14, ry: 7.2 },
          { cx: originX - 28, cy: originY + 176, rx: 11.5, ry: 6 },
          { cx: originX + 8, cy: originY + 186, rx: 14.5, ry: 7.4 },
          { cx: originX + 42, cy: originY + 196, rx: 12.5, ry: 6.4 },
          { cx: wellX - 26, cy: wellY - 12, rx: 10, ry: 5.2 },
          { cx: wellX + 28, cy: wellY - 10, rx: 9.5, ry: 4.8 },
          { cx: pierX - 28, cy: pierY + 6, rx: 9.5, ry: 4.8 },
        ].map((stone, idx) => (
          <G key={`path_${idx}`}>
            <Ellipse
              cx={stone.cx}
              cy={stone.cy + 1.5}
              rx={stone.rx}
              ry={stone.ry}
              fill="rgba(42, 54, 44, 0.16)"
            />
            <Ellipse
              cx={stone.cx}
              cy={stone.cy}
              rx={stone.rx}
              ry={stone.ry}
              fill={
                idx % 2 === 0
                  ? isNight
                    ? '#5B645C'
                    : '#DFD9CB'
                  : isNight
                    ? '#4F5750'
                    : '#D1CBB9'
              }
              stroke={isNight ? '#444C45' : '#BDB6A4'}
              strokeWidth={0.85}
            />
          </G>
        ))}
      </G>

      {/* Organic Perimeter Framing: Layered Birch & Cedar Trees, Berry Bushes & Fencing */}
      <G opacity={scenicOpacity}>
        {/* Back-left split-rail cedar fence near north peak */}
        <G stroke={isNight ? '#5E4B3B' : '#A98462'} strokeLinecap="round">
          <Path d={`M ${oTopX - 42} ${oTopY + 22} L ${oTopX - 42} ${oTopY + 7}`} strokeWidth={3} />
          <Path d={`M ${oTopX - 72} ${oTopY + 38} L ${oTopX - 72} ${oTopY + 23}`} strokeWidth={3} />
          <Path d={`M ${oTopX - 102} ${oTopY + 54} L ${oTopX - 102} ${oTopY + 39}`} strokeWidth={3} />
          <Path d={`M ${oTopX - 42} ${oTopY + 12} L ${oTopX - 102} ${oTopY + 44}`} strokeWidth={2.2} />
          <Path d={`M ${oTopX - 42} ${oTopY + 18} L ${oTopX - 102} ${oTopY + 50}`} strokeWidth={2} />
        </G>

        {/* Upper terrace Birch Tree #1 (cream bark + airy sage canopy) */}
        <G>
          <Ellipse cx={oLeftX + 94} cy={oLeftY - 54} rx={14} ry={6} fill="rgba(26,38,28,0.16)" />
          <Path
            d={`M ${oLeftX + 94} ${oLeftY - 54} L ${oLeftX + 93} ${oLeftY - 78}`}
            stroke={isNight ? '#9C988B' : '#EAE4D5'}
            strokeWidth={3.8}
            strokeLinecap="round"
          />
          <Path
            d={`M ${oLeftX + 92} ${oLeftY - 62} L ${oLeftX + 95} ${oLeftY - 62} M ${oLeftX + 92} ${oLeftY - 70} L ${oLeftX + 95} ${oLeftY - 70}`}
            stroke="#59564C"
            strokeWidth={1.1}
          />
          <Circle cx={oLeftX + 86} cy={oLeftY - 82} r={11} fill={isNight ? '#2B4C37' : '#6A9B6D'} />
          <Circle cx={oLeftX + 101} cy={oLeftY - 80} r={10} fill={isNight ? '#264330' : '#58895D'} />
          <Circle cx={oLeftX + 94} cy={oLeftY - 91} r={11.5} fill={isNight ? '#355B43' : '#7EB07F'} />
        </G>

        {/* Upper terrace Conical Cedar Pine */}
        <G>
          <Ellipse cx={oLeftX + 132} cy={oLeftY - 66} rx={12} ry={5} fill="rgba(26,38,28,0.16)" />
          <Path d={`M ${oLeftX + 132} ${oLeftY - 66} L ${oLeftX + 132} ${oLeftY - 78}`} stroke="#6E523A" strokeWidth={3.4} />
          <Polygon
            points={`${oLeftX + 132},${oLeftY - 104} ${oLeftX + 148},${oLeftY - 76} ${oLeftX + 116},${oLeftY - 76}`}
            fill={isNight ? '#223E2B' : '#3E6B49'}
          />
          <Polygon
            points={`${oLeftX + 132},${oLeftY - 114} ${oLeftX + 144},${oLeftY - 88} ${oLeftX + 120},${oLeftY - 88}`}
            fill={isNight ? '#2C4E37' : '#51835B'}
          />
        </G>

        {/* Back-left flowering berry bush & birch sapling */}
        <G>
          <Ellipse cx={oLeftX + 58} cy={oLeftY - 22} rx={11} ry={4.5} fill="rgba(26,38,28,0.14)" />
          <Circle cx={oLeftX + 54} cy={oLeftY - 27} r={8} fill={isNight ? '#284532' : '#4E7D58'} />
          <Circle cx={oLeftX + 64} cy={oLeftY - 25} r={7} fill={isNight ? '#32543D' : '#65946B'} />
          <Circle cx={oLeftX + 59} cy={oLeftY - 32} r={6.5} fill={isNight ? '#3B6348' : '#79A87C'} />
          <Circle cx={oLeftX + 55} cy={oLeftY - 30} r={1.8} fill="#DF7872" />
          <Circle cx={oLeftX + 63} cy={oLeftY - 27} r={1.7} fill="#F4C7C9" />
          <Circle cx={oLeftX + 58} cy={oLeftY - 24} r={1.6} fill="#FFF3D2" />
        </G>

        {/* North peak cypress & flowering shrub cluster */}
        <G>
          <Ellipse cx={oTopX + 26} cy={oTopY + 19} rx={12} ry={5} fill="rgba(30,40,30,0.14)" />
          <Circle cx={oTopX + 20} cy={oTopY + 13} r={8.5} fill={isNight ? '#284532' : '#4E7D58'} />
          <Circle cx={oTopX + 32} cy={oTopY + 15} r={7.5} fill={isNight ? '#32543D' : '#65946B'} />
          <Circle cx={oTopX + 25} cy={oTopY + 6} r={7} fill={isNight ? '#3B6348' : '#79A87C'} />
          <Circle cx={oTopX + 21} cy={oTopY + 9} r={1.8} fill="#F6D1D3" />
          <Circle cx={oTopX + 30} cy={oTopY + 12} r={1.7} fill="#FFF3D2" />
        </G>

        {/* Back-right cedar & birch framing beside Conservatory */}
        <G>
          <Ellipse cx={oTopX + 106} cy={oTopY + 56} rx={11} ry={4.5} fill="rgba(26,38,28,0.14)" />
          <Path d={`M ${oTopX + 106} ${oTopY + 56} L ${oTopX + 106} ${oTopY + 44}`} stroke="#6E523A" strokeWidth={2.8} />
          <Polygon
            points={`${oTopX + 106},${oTopY + 20} ${oTopX + 119},${oTopY + 46} ${oTopX + 93},${oTopY + 46}`}
            fill={isNight ? '#25432F' : '#45744F'}
          />
          <Polygon
            points={`${oTopX + 106},${oTopY + 12} ${oTopX + 116},${oTopY + 34} ${oTopX + 96},${oTopY + 34}`}
            fill={isNight ? '#2F543B' : '#5B8E63'}
          />
        </G>

        {/* Right-wing birch & berry bush near east peak */}
        <G>
          <Ellipse cx={oRightX - 58} cy={oRightY - 12} rx={12} ry={5} fill="rgba(26,38,28,0.14)" />
          <Path
            d={`M ${oRightX - 58} ${oRightY - 12} L ${oRightX - 58} ${oRightY - 30}`}
            stroke={isNight ? '#9C988B' : '#EAE4D5'}
            strokeWidth={3.2}
            strokeLinecap="round"
          />
          <Circle cx={oRightX - 63} cy={oRightY - 34} r={8.5} fill={isNight ? '#2B4C37' : '#659668'} />
          <Circle cx={oRightX - 52} cy={oRightY - 32} r={8} fill={isNight ? '#355B43' : '#78AA79'} />
          <Circle cx={oRightX - 57} cy={oRightY - 41} r={8.5} fill={isNight ? '#3F6A4E' : '#89BA89'} />
          <Circle cx={oRightX - 44} cy={oRightY - 14} r={6.5} fill={isNight ? '#294933' : '#55875C'} />
          <Circle cx={oRightX - 43} cy={oRightY - 16} r={1.6} fill="#E08078" />
        </G>

        {/* Mossy boulders, clover & pebble clusters */}
        <Ellipse cx={oTopX - 88} cy={oTopY + 62} rx={13} ry={7.5} fill={isNight ? '#4F5750' : '#A9A598'} />
        <Ellipse cx={oTopX - 96} cy={oTopY + 67} rx={8} ry={4.5} fill={isNight ? '#5C655D' : '#BEB9AC'} />
        <Path d={`M ${oTopX - 94} ${oTopY + 59} Q ${oTopX - 88} ${oTopY + 54} ${oTopX - 82} ${oTopY + 59}`} fill="#6C9464" />

        <Ellipse cx={oLeftX + 56} cy={oLeftY + 14} rx={11} ry={6} fill={isNight ? '#4D554E' : '#A5A092'} />
        <Path d={`M ${oLeftX + 42} ${oLeftY + 10} Q ${oLeftX + 38} ${oLeftY - 1} ${oLeftX + 34} ${oLeftY + 6}`} stroke="#4E7C53" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M ${oLeftX + 44} ${oLeftY + 9} Q ${oLeftX + 46} ${oLeftY - 3} ${oLeftX + 51} ${oLeftY + 3}`} stroke="#629166" strokeWidth={1.8} fill="none" strokeLinecap="round" />

        {/* Clover & wildflower clusters scattered around the outer rim */}
        {[
          { x: oTopX - 24, y: oTopY + 16, c: '#FFF4D4' },
          { x: oTopX + 16, y: oTopY + 20, c: '#F4C9CE' },
          { x: oLeftX + 38, y: oLeftY - 2, c: '#DCEAF7' },
          { x: oBottomX - 74, y: oBottomY - 14, c: '#FFF4D4' },
          { x: oBottomX + 34, y: oBottomY - 12, c: '#F4C9CE' },
          { x: oRightX - 38, y: oRightY + 4, c: '#FFF4D4' },
        ].map((fl, i) => (
          <G key={`wf_${i}`}>
            <Circle cx={fl.x} cy={fl.y} r={2.6} fill={fl.c} />
            <Circle cx={fl.x} cy={fl.y} r={1} fill="#E2B154" />
          </G>
        ))}

        {/* Small clover & pebble tufts */}
        {[
          { x: oLeftX + 94, y: oLeftY + 36 },
          { x: oBottomX - 24, y: oBottomY - 8 },
          { x: oRightX - 72, y: oRightY + 22 },
          { x: oTopX + 64, y: oTopY + 38 },
        ].map((cl, i) => (
          <G key={`clv_${i}`}>
            <Circle cx={cl.x - 2} cy={cl.y} r={2.2} fill={isNight ? '#34583D' : '#6F9E6E'} />
            <Circle cx={cl.x + 2} cy={cl.y - 1} r={2} fill={isNight ? '#3D6547' : '#7DAE7B'} />
            <Circle cx={cl.x} cy={cl.y + 2} r={1.8} fill={isNight ? '#2B4A33' : '#5E8E5E'} />
            <Ellipse cx={cl.x + 6} cy={cl.y + 2} rx={2.5} ry={1.4} fill={isNight ? '#5C645C' : '#C6C0B2'} />
          </G>
        ))}
      </G>

      {/* LANDMARK 1: Back-Right Corner Conservatory / Greenhouse Nook */}
      <G opacity={scenicOpacity}>
        {/* Night / dusk warm conservatory ground light pool */}
        {warmGlowActive && resolvedLandmarks.greenhouseStage !== 'overgrown' ? (
          <Ellipse
            cx={ghX}
            cy={ghY + 12}
            rx={48}
            ry={22}
            fill={`url(#${uid}_amberPool)`}
          />
        ) : null}

        {/* Conservatory stone plinth shadow */}
        <Ellipse cx={ghX} cy={ghY + 14} rx={28} ry={12} fill="rgba(26, 36, 28, 0.22)" />
        {/* Low stone foundation base */}
        <Polygon
          points={`${ghX - 22},${ghY + 6} ${ghX},${ghY + 17} ${ghX + 22},${ghY + 6} ${ghX},${ghY - 5}`}
          fill={isNight ? '#4F5650' : '#C7C1B2'}
          stroke={isNight ? '#393F3A' : '#9B9587'}
          strokeWidth={1}
        />
        {/* Left & Right glass walls */}
        <Polygon
          points={`${ghX - 20},${ghY + 5} ${ghX},${ghY + 15} ${ghX},${ghY - 9} ${ghX - 20},${ghY - 19}`}
          fill={`url(#${uid}_glassPane)`}
          opacity={0.9}
          stroke={isNight ? '#4E5D52' : '#5E7C67'}
          strokeWidth={1.1}
        />
        <Polygon
          points={`${ghX},${ghY + 15} ${ghX + 20},${ghY + 5} ${ghX + 20},${ghY - 19} ${ghX},${ghY - 9}`}
          fill={`url(#${uid}_glassPane)`}
          opacity={0.85}
          stroke={isNight ? '#4E5D52' : '#5E7C67'}
          strokeWidth={1.1}
        />
        {/* Mullion frame bars */}
        <Path
          d={`M ${ghX - 10} ${ghY - 14} L ${ghX - 10} ${ghY + 10} M ${ghX + 10} ${ghY - 14} L ${ghX + 10} ${ghY + 10}`}
          stroke={isNight ? '#4E5D52' : '#65846E'}
          strokeWidth={1}
        />
        {/* Pitched glass conservatory roof */}
        <Polygon
          points={`${ghX - 22},${ghY - 18} ${ghX},${ghY - 8} ${ghX + 12},${ghY - 27} ${ghX - 10},${ghY - 35}`}
          fill={`url(#${uid}_glassPane)`}
          stroke={isNight ? '#5C6B5F' : '#5C7B65'}
          strokeWidth={1.1}
        />
        <Polygon
          points={`${ghX},${ghY - 8} ${ghX + 22},${ghY - 18} ${ghX + 12},${ghY - 27}`}
          fill={isNight ? '#4A594D' : '#B5D7DD'}
          stroke={isNight ? '#5C6B5F' : '#5C7B65'}
          strokeWidth={1.1}
        />
        {/* Roof ridge beam & copper finial */}
        <Path
          d={`M ${ghX - 10} ${ghY - 35} L ${ghX + 12} ${ghY - 27}`}
          stroke={resolvedLandmarks.greenhouseStage === 'overgrown' ? '#6D685E' : '#B87A4B'}
          strokeWidth={2}
          strokeLinecap="round"
        />

        {resolvedLandmarks.greenhouseStage === 'overgrown' ? (
          /* Stage 1: Overgrown vines & weathered boards */
          <G>
            <Path
              d={`M ${ghX - 16} ${ghY - 26} Q ${ghX - 4} ${ghY - 16} ${ghX + 8} ${ghY - 22} M ${ghX - 12} ${ghY - 4} Q ${ghX} ${ghY + 2} ${ghX + 14} ${ghY - 12}`}
              fill="none"
              stroke={isNight ? '#35573D' : '#4E7A52'}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Circle cx={ghX - 12} cy={ghY - 22} r={3.5} fill="#5C8A5E" />
            <Circle cx={ghX + 6} cy={ghY - 20} r={3} fill="#4E7A52" />
            <Circle cx={ghX + 10} cy={ghY + 4} r={3.8} fill="#5B865D" />
          </G>
        ) : resolvedLandmarks.greenhouseStage === 'tended' ? (
          /* Stage 2: Tended neat pots & tidy glass sheen */
          <G>
            <Path
              d={`M ${ghX - 14} ${ghY - 12} L ${ghX - 6} ${ghY - 4} M ${ghX + 6} ${ghY - 8} L ${ghX + 13} ${ghY - 1}`}
              stroke="rgba(255,255,255,0.62)"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
            <Circle cx={ghX - 16} cy={ghY + 12} r={2.5} fill="#B86E4B" />
            <Circle cx={ghX - 16} cy={ghY + 9} r={2.2} fill="#5D8F61" />
          </G>
        ) : (
          /* Stage 3: Restored gleaming glass, blooms inside & hanging basket */
          <G>
            {/* Interior blooms glowing behind glass */}
            <Circle cx={ghX - 6} cy={ghY + 2} r={3.2} fill="#6EA671" />
            <Circle cx={ghX - 7} cy={ghY - 1} r={1.6} fill="#F4C7C9" />
            <Circle cx={ghX + 7} cy={ghY} r={3} fill="#5D9462" />
            <Circle cx={ghX + 7} cy={ghY - 2.5} r={1.5} fill="#FFF2B8" />
            {/* Crisp sky reflection glints */}
            <Path
              d={`M ${ghX - 15} ${ghY - 13} L ${ghX - 5} ${ghY - 3} M ${ghX + 5} ${ghY - 9} L ${ghX + 13} ${ghY - 2}`}
              stroke="rgba(255,255,255,0.75)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            {/* Copper finial */}
            <Circle cx={ghX + 1} cy={ghY - 32} r={2} fill="#D18E56" />
            {/* Exterior blooming flower box */}
            <Ellipse cx={ghX - 18} cy={ghY + 11} rx={5} ry={3} fill="#5D9262" />
            <Circle cx={ghX - 20} cy={ghY + 10} r={1.6} fill="#F5C7CA" />
            <Circle cx={ghX - 16} cy={ghY + 11} r={1.5} fill="#FFF4C8" />
          </G>
        )}
      </G>

      {/* LANDMARK 2: Front-Right Expanded Lotus Pond, Brook, Pier & Skiff */}
      <G opacity={isInteractiveMode ? 0.58 : 1}>
        {/* Pond stone bank */}
        <Ellipse
          cx={pondCx}
          cy={pondCy}
          rx={44}
          ry={20}
          fill={isNight ? '#4D574F' : '#B9B5A6'}
        />
        {/* Water surface */}
        <Ellipse
          cx={pondCx}
          cy={pondCy + 1}
          rx={39}
          ry={17}
          fill={`url(#${uid}_pondWater)`}
        />
        {/* Brook spilling cleanly over the front-right cove cliff lip */}
        <Path
          d={`M ${pondCx + 20} ${pondCy + 4} Q ${pondCx + 32} ${pondCy + 8} ${wfLipX + 5} ${wfLipY - 3} L ${wfLipX - 8} ${wfLipY + 5} Q ${pondCx + 18} ${pondCy + 14} ${pondCx + 8} ${pondCy + 12} Z`}
          fill={`url(#${uid}_pondWater)`}
        />
        {/* Lily pads & tiny lotus blossom */}
        <Ellipse cx={pondCx - 14} cy={pondCy + 3} rx={7} ry={3.6} fill="#5C9160" />
        <Path
          d={`M ${pondCx - 14} ${pondCy + 3} L ${pondCx - 8} ${pondCy + 1}`}
          stroke="#3E798A"
          strokeWidth={1.2}
        />
        <Ellipse cx={pondCx + 10} cy={pondCy - 4} rx={5.8} ry={3} fill="#6CA36E" />
        <Circle cx={pondCx - 15} cy={pondCy + 1.5} r={2.2} fill="#F4C7C9" />
        <Circle cx={pondCx - 15} cy={pondCy + 1} r={1} fill="#FFF2E2" />

        {/* Night / dusk starry reflections on pond surface */}
        {warmGlowActive ? (
          <G>
            <Circle cx={pondCx + 4} cy={pondCy + 5} r={1.1} fill="#FFF5D6" opacity={0.85} />
            <Circle cx={pondCx - 4} cy={pondCy - 5} r={0.9} fill="#F4E8C6" opacity={0.7} />
            <Circle cx={pondCx + 15} cy={pondCy + 2} r={1} fill="#FFF2B8" opacity={0.75} />
          </G>
        ) : (
          <Path
            d={`M ${pondCx - 20} ${pondCy - 5} Q ${pondCx - 8} ${pondCy - 9} ${pondCx + 4} ${pondCy - 6}`}
            fill="none"
            stroke="rgba(255,255,255,0.48)"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        )}

        {/* Pier & Moored Wooden Skiff */}
        {resolvedLandmarks.pierStage === 'restored' && warmGlowActive ? (
          <Ellipse
            cx={pierX - 4}
            cy={pierY - 4}
            rx={26}
            ry={13}
            fill={`url(#${uid}_amberPool)`}
          />
        ) : null}

        {/* Wooden pier pilings & deck */}
        <G>
          <Path
            d={`M ${pierX - 4} ${pierY - 2} L ${pierX - 4} ${pierY + 7} M ${pierX + 12} ${pierY - 8} L ${pierX + 12} ${pierY + 1}`}
            stroke={isNight ? '#4E3B2B' : '#7D5C3E'}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Polygon
            points={`${pierX - 10},${pierY - 3} ${pierX + 10},${pierY - 13} ${pierX + 18},${pierY - 8} ${pierX - 2},${pierY + 2}`}
            fill={
              resolvedLandmarks.pierStage === 'restored'
                ? isNight
                  ? '#7D5E44'
                  : '#C49A6E'
                : isNight
                  ? '#5B4B3D'
                  : '#9B8672'
            }
            stroke={isNight ? '#4A392B' : '#856444'}
            strokeWidth={0.9}
          />
          {resolvedLandmarks.pierStage === 'restored' ? (
            <>
              {/* Plank lines */}
              <Path
                d={`M ${pierX - 4} ${pierY - 5} L ${pierX + 2} ${pierY - 1} M ${pierX + 3} ${pierY - 9} L ${pierX + 9} ${pierY - 5}`}
                stroke="#8E6945"
                strokeWidth={0.8}
              />
              {/* Cozy pier lantern post */}
              <Path
                d={`M ${pierX - 6} ${pierY - 3} L ${pierX - 6} ${pierY - 17} L ${pierX - 1} ${pierY - 17}`}
                fill="none"
                stroke="#6E5239"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Rect
                x={pierX - 3.5}
                y={pierY - 16}
                width={5}
                height={6}
                rx={1.5}
                fill={warmGlowActive ? '#F7D27D' : '#F2DDA8'}
                stroke="#7B5D3E"
                strokeWidth={0.8}
              />
              {/* Moored miniature wooden skiff */}
              <G>
                <Ellipse
                  cx={pierX + 24}
                  cy={pierY - 2}
                  rx={11}
                  ry={4.8}
                  fill="rgba(26, 48, 56, 0.28)"
                />
                <Path
                  d={`M ${pierX + 14} ${pierY - 4} Q ${pierX + 24} ${pierY + 2} ${pierX + 34} ${pierY - 5} Q ${pierX + 25} ${pierY - 10} ${pierX + 14} ${pierY - 4} Z`}
                  fill={isNight ? '#7E5E42' : '#B98759'}
                  stroke="#6D4B2F"
                  strokeWidth={0.9}
                />
                <Path
                  d={`M ${pierX + 19} ${pierY - 5} L ${pierX + 28} ${pierY - 6}`}
                  stroke="#D9B68C"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
                {/* Mooring rope */}
                <Path
                  d={`M ${pierX + 11} ${pierY - 7} Q ${pierX + 12} ${pierY - 3} ${pierX + 15} ${pierY - 4}`}
                  fill="none"
                  stroke="#CFC2A6"
                  strokeWidth={0.9}
                />
              </G>
            </>
          ) : null}
        </G>
      </G>

      {/* Cascading waterfall ribbon spilling directly off the front-right cliff edge */}
      <G opacity={0.92}>
        <Path
          d={`M ${wfLipX - 8} ${wfLipY + 3} C ${wfLipX - 7} ${wfLipY + 32}, ${wfLipX - 10} ${wfLipY + 60}, ${wfLipX - 6} ${wfLipY + 88} L ${wfLipX + 7} ${wfLipY + 84} C ${wfLipX + 5} ${wfLipY + 56}, ${wfLipX + 9} ${wfLipY + 28}, ${wfLipX + 6} ${wfLipY - 3} Z`}
          fill={`url(#${uid}_waterfall)`}
        />
        <Path
          d={`M ${wfLipX - 2} ${wfLipY + 7} L ${wfLipX - 3} ${wfLipY + 64}`}
          stroke="rgba(255,255,255,0.52)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d={`M ${wfLipX + 3} ${wfLipY + 3} L ${wfLipX + 2} ${wfLipY + 48}`}
          stroke="rgba(255,255,255,0.36)"
          strokeWidth={1.1}
          strokeLinecap="round"
        />
        <Ellipse cx={wfLipX - 1} cy={wfLipY + 1} rx={8} ry={3.2} fill="rgba(255,255,255,0.8)" />
      </G>

      {/* LANDMARK 3: Stone Wishing Well (front-right scenic verge) */}
      <G opacity={scenicOpacity}>
        {resolvedLandmarks.wellActive ? (
          <Ellipse
            cx={wellX}
            cy={wellY + 4}
            rx={28}
            ry={14}
            fill={`url(#${uid}_amberPool)`}
          />
        ) : null}
        <Ellipse cx={wellX} cy={wellY + 6} rx={15} ry={7.5} fill="rgba(26, 36, 28, 0.2)" />
        {/* Circular stone wall */}
        <Path
          d={`M ${wellX - 11} ${wellY - 2} L ${wellX - 11} ${wellY + 5} A 11 5.5 0 0 0 ${wellX + 11} ${wellY + 5} L ${wellX + 11} ${wellY - 2} Z`}
          fill={isNight ? '#5C645E' : '#B5AFA0'}
          stroke={isNight ? '#424943' : '#8C8677'}
          strokeWidth={0.9}
        />
        {/* Rim & interior water */}
        <Ellipse
          cx={wellX}
          cy={wellY - 2}
          rx={11.5}
          ry={5.6}
          fill={isNight ? '#6E7770' : '#D5D0C2'}
          stroke={isNight ? '#4A524C' : '#9B9587'}
          strokeWidth={0.9}
        />
        <Ellipse
          cx={wellX}
          cy={wellY - 2}
          rx={7.6}
          ry={3.4}
          fill={
            resolvedLandmarks.wellActive
              ? '#7EC6D6'
              : isNight
                ? '#2B4047'
                : '#4E7785'
          }
        />
        {resolvedLandmarks.wellActive ? (
          <>
            <Ellipse
              cx={wellX}
              cy={wellY - 2}
              rx={4.5}
              ry={1.8}
              fill="none"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={0.9}
            />
            {/* Warm amber moss glow accents */}
            <Circle cx={wellX - 9} cy={wellY + 6} r={2} fill="#7DA86B" />
            <Circle cx={wellX + 9} cy={wellY + 5} r={1.8} fill="#E3B261" />
            <Circle cx={wellX + 6} cy={wellY - 12} r={1.4} fill="#FFF2B8" />
          </>
        ) : null}
        {/* Twin cedar roof posts & pitched shingle roof */}
        <Path
          d={`M ${wellX - 9} ${wellY - 2} L ${wellX - 9} ${wellY - 16} M ${wellX + 9} ${wellY - 2} L ${wellX + 9} ${wellY - 16}`}
          stroke="#7D5A3D"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Polygon
          points={`${wellX - 14},${wellY - 14} ${wellX},${wellY - 24} ${wellX + 14},${wellY - 14} ${wellX},${wellY - 10}`}
          fill={isNight ? '#5C4330' : '#A97852'}
          stroke="#6E4C31"
          strokeWidth={0.9}
        />
      </G>

      {/* LANDMARK 4: Front-Left Keeper Wooden Postbox */}
      <G opacity={scenicOpacity}>
        {hasPendingReveal ? (
          <Ellipse
            cx={postboxX}
            cy={postboxY + 4}
            rx={24}
            ry={11}
            fill={`url(#${uid}_amberPool)`}
          />
        ) : null}
        <Ellipse cx={postboxX} cy={postboxY + 6} rx={11} ry={5} fill="rgba(26, 36, 28, 0.2)" />
        {/* Mossy base stone */}
        <Ellipse cx={postboxX} cy={postboxY + 4} rx={7} ry={3.5} fill={isNight ? '#505851' : '#BFB9A8'} />
        {/* Timber post */}
        <Path
          d={`M ${postboxX} ${postboxY + 4} L ${postboxX} ${postboxY - 12}`}
          stroke={isNight ? '#604936' : '#8E6747'}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        {/* Wooden postbox cabinet */}
        <Rect
          x={postboxX - 7.5}
          y={postboxY - 22}
          width={15}
          height={11}
          rx={2.5}
          fill={isNight ? '#77593F' : '#B9875C'}
          stroke="#6E4C31"
          strokeWidth={0.9}
        />
        {/* Arched terracotta shingle cap */}
        <Path
          d={`M ${postboxX - 9} ${postboxY - 20} Q ${postboxX} ${postboxY - 29} ${postboxX + 9} ${postboxY - 20} Z`}
          fill={isNight ? '#7B4D38' : '#B86E4E'}
          stroke="#6E3D29"
          strokeWidth={0.85}
        />
        {/* Crisp parchment letter peeking out when reveal awaits */}
        {hasPendingReveal ? (
          <Polygon
            points={`${postboxX - 4},${postboxY - 17} ${postboxX + 3},${postboxY - 19} ${postboxX + 4},${postboxY - 14} ${postboxX - 3},${postboxY - 12}`}
            fill="#FAF6EC"
            stroke="#CBBFA6"
            strokeWidth={0.6}
          />
        ) : null}
        {/* Postbox signal flag: raised warm amber when hasPendingReveal, lowered otherwise */}
        {hasPendingReveal ? (
          <G>
            <Path
              d={`M ${postboxX + 7} ${postboxY - 17} L ${postboxX + 7} ${postboxY - 29}`}
              stroke="#5A422E"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
            <Polygon
              points={`${postboxX + 7},${postboxY - 29} ${postboxX + 14},${postboxY - 27} ${postboxX + 7},${postboxY - 24}`}
              fill="#E3B261"
              stroke="#98601A"
              strokeWidth={0.6}
            />
          </G>
        ) : (
          <G>
            <Path
              d={`M ${postboxX + 7} ${postboxY - 17} L ${postboxX + 12} ${postboxY - 15}`}
              stroke="#6B513A"
              strokeWidth={1.3}
              strokeLinecap="round"
            />
            <Circle cx={postboxX + 12} cy={postboxY - 15} r={1.8} fill="#9E734C" />
          </G>
        )}
      </G>

      {/* Lush hanging ivy vines with tiny leaves along front cliffs */}
      <G>
        {[
          { x: oLeftX + 64, y: oLeftY + 36, len: 28 },
          { x: oLeftX + 148, y: oLeftY + 80, len: 34 },
          { x: oLeftX + 236, y: oLeftY + 124, len: 24 },
          { x: oBottomX + 66, y: oBottomY - 26, len: 32 },
          { x: oBottomX + 162, y: oBottomY - 76, len: 28 },
        ].map((vine, idx) => (
          <G key={`vine_${idx}`}>
            <Path
              d={`M ${vine.x} ${vine.y} Q ${vine.x + 3} ${vine.y + vine.len * 0.55} ${vine.x - 2} ${vine.y + vine.len}`}
              fill="none"
              stroke={isNight ? '#35573D' : '#537D58'}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Ellipse
              cx={vine.x - 3}
              cy={vine.y + vine.len * 0.38}
              rx={3.5}
              ry={2}
              fill={isNight ? '#3F6948' : '#6C986E'}
            />
            <Ellipse
              cx={vine.x + 3.5}
              cy={vine.y + vine.len * 0.72}
              rx={3.2}
              ry={1.8}
              fill={isNight ? '#34583D' : '#5B875E'}
            />
          </G>
        ))}
      </G>

      {/* Isometric tile grid lines: shown when placing or moving */}
      {isInteractiveMode
        ? allTiles.map(({ x, y }) => {
            const { sx, sy } = gridToScreen(x, y, tileWidth, tileHeight);
            const cx = originX + sx;
            const cy = originY + sy;
            const isChecker = (x + y) % 2 === 0;
            const occupant = placementByCoord.get(`${x},${y}`);
            const isMovingTarget = occupant && occupant.id === movingPlacementId;
            const highlightAvailable = !occupant;

            let fill = isChecker
              ? 'rgba(235, 244, 229, 0.76)'
              : 'rgba(222, 236, 215, 0.76)';
            if (isMovingTarget) {
              fill = 'rgba(243, 229, 196, 0.90)';
            } else if (occupant) {
              fill = 'rgba(206, 221, 199, 0.44)';
            }

            return (
              <Polygon
                key={`tile_${x}_${y}`}
                points={diamondPoints(cx, cy)}
                fill={fill}
                stroke={
                  highlightAvailable
                    ? 'rgba(54, 94, 68, 0.48)'
                    : 'rgba(54, 94, 68, 0.16)'
                }
                strokeWidth={highlightAvailable ? 1.35 : 0.8}
              />
            );
          })
        : null}
    </Svg>
  );
}
