import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import type { GardenPlacement } from '@/domain/types';

export interface GardenGridCoord {
  x: number;
  y: number;
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
}: GardenIslandSvgProps) {
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

  // Outer lush apron border (expanded by ~26px horizontally, ~14px vertically)
  const padX = 28;
  const padY = 15;
  const oTopX = topX;
  const oTopY = topY - padY;
  const oRightX = rightX + padX;
  const oRightY = rightY;
  const oBottomX = bottomX;
  const oBottomY = bottomY + padY;
  const oLeftX = leftX - padX;
  const oLeftY = leftY;

  const outerTopPoints = `${oTopX},${oTopY} ${oRightX},${oRightY} ${oBottomX},${oBottomY} ${oLeftX},${oLeftY}`;
  const innerTopPoints = `${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`;

  // Multi-strata cliff depths
  const rimDepth = 10;
  const soilDepth = 20;
  const midRockDepth = cliffDepth;
  const underTipY = oBottomY + midRockDepth + 38;

  // Grass overhang rim
  const leftRimPoints = `${oLeftX},${oLeftY} ${oBottomX},${oBottomY} ${oBottomX},${oBottomY + rimDepth} ${oLeftX},${oLeftY + rimDepth}`;
  const rightRimPoints = `${oBottomX},${oBottomY} ${oRightX},${oRightY} ${oRightX},${oRightY + rimDepth} ${oBottomX},${oBottomY + rimDepth}`;

  // Terracotta topsoil band
  const leftSoilPoints = `${oLeftX},${oLeftY + rimDepth} ${oBottomX},${oBottomY + rimDepth} ${oBottomX},${oBottomY + soilDepth} ${oLeftX + 6},${oLeftY + soilDepth}`;
  const rightSoilPoints = `${oBottomX},${oBottomY + rimDepth} ${oRightX},${oRightY + rimDepth} ${oRightX - 6},${oRightY + soilDepth} ${oBottomX},${oBottomY + soilDepth}`;

  // Faceted weathered limestone rock walls
  const leftRockPoints = `${oLeftX + 6},${oLeftY + soilDepth} ${oBottomX},${oBottomY + soilDepth} ${oBottomX},${oBottomY + midRockDepth} ${oLeftX + 26},${oLeftY + midRockDepth + 6}`;
  const rightRockPoints = `${oBottomX},${oBottomY + soilDepth} ${oRightX - 6},${oRightY + soilDepth} ${oRightX - 26},${oRightY + midRockDepth + 6} ${oBottomX},${oBottomY + midRockDepth}`;

  // Tapered floating rocky underside
  const leftUnderPoints = `${oLeftX + 26},${oLeftY + midRockDepth + 6} ${oBottomX},${oBottomY + midRockDepth} ${oBottomX},${underTipY} ${oLeftX + 95},${oLeftY + midRockDepth + 32}`;
  const rightUnderPoints = `${oBottomX},${oBottomY + midRockDepth} ${oRightX - 26},${oRightY + midRockDepth + 6} ${oRightX - 95},${oRightY + midRockDepth + 32} ${oBottomX},${underTipY}`;

  const diamondPoints = (cx: number, cy: number): string =>
    `${cx},${cy - halfH} ${cx + halfW},${cy} ${cx},${cy + halfH} ${cx - halfW},${cy}`;

  // Tranquil corner spring / brook tucked along the front-right meadow rim
  // Front-right rim runs from (oRightX, oRightY) to (oBottomX, oBottomY)
  // At t = 0.36 along that edge:
  const edgeT = 0.36;
  const wfLipX = oRightX + (oBottomX - oRightX) * edgeT;
  const wfLipY = oRightY + (oBottomY - oRightY) * edgeT;
  const pondCx = wfLipX - 42;
  const pondCy = wfLipY - 26;

  // Color shifts for night/dusk
  const grassStart = isNight ? '#35503E' : isDusk ? '#D8DFC2' : '#E7F1DC';
  const grassMid = isNight ? '#2B4234' : isDusk ? '#C3D0B2' : '#D3E3C5';
  const grassEnd = isNight ? '#22352A' : isDusk ? '#AEC09E' : '#BCD2AE';
  const apronColor = isNight ? '#273D2F' : isDusk ? '#B8C7A5' : '#C6D9B6';
  const rimLeftColor = isNight ? '#2D4A36' : '#7CA26E';
  const rimRightColor = isNight ? '#233B2B' : '#648A5A';

  return (
    <Svg
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
    >
      <Defs>
        <RadialGradient id="islandShadowGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="rgba(26, 34, 28, 0.24)" />
          <Stop offset="55%" stopColor="rgba(26, 34, 28, 0.10)" />
          <Stop offset="100%" stopColor="rgba(26, 34, 28, 0)" />
        </RadialGradient>
        <LinearGradient id="islandGrassGrad" x1="12%" y1="0%" x2="88%" y2="100%">
          <Stop offset="0%" stopColor={grassStart} />
          <Stop offset="52%" stopColor={grassMid} />
          <Stop offset="100%" stopColor={grassEnd} />
        </LinearGradient>
        <LinearGradient id="leftSoilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#5C4B3B' : '#B98C66'} />
          <Stop offset="100%" stopColor={isNight ? '#4A3C2F' : '#9C7250'} />
        </LinearGradient>
        <LinearGradient id="rightSoilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#493B2F' : '#9E7453'} />
          <Stop offset="100%" stopColor={isNight ? '#382D24' : '#805B3F'} />
        </LinearGradient>
        <LinearGradient id="leftRockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#49453E' : '#B5A188'} />
          <Stop offset="60%" stopColor={isNight ? '#3A3731' : '#9C876E'} />
          <Stop offset="100%" stopColor={isNight ? '#2D2A26' : '#826E57'} />
        </LinearGradient>
        <LinearGradient id="rightRockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#3A3732' : '#95816A'} />
          <Stop offset="60%" stopColor={isNight ? '#2D2B27' : '#7D6A54'} />
          <Stop offset="100%" stopColor={isNight ? '#22201E' : '#655441'} />
        </LinearGradient>
        <RadialGradient id="pondWaterGrad" cx="42%" cy="38%" r="62%">
          <Stop offset="0%" stopColor={isNight ? '#427080' : '#9BD3DE'} />
          <Stop offset="60%" stopColor={isNight ? '#2E5563' : '#63A4B4'} />
          <Stop offset="100%" stopColor={isNight ? '#1E3C47' : '#3E798A'} />
        </RadialGradient>
        <LinearGradient id="waterfallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={isNight ? '#588999' : '#A9DDE6'} stopOpacity={0.92} />
          <Stop offset="55%" stopColor={isNight ? '#406E7D' : '#7AC2D0'} stopOpacity={0.78} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.05} />
        </LinearGradient>
      </Defs>

      {/* Soft elliptical floating shadow underneath the island */}
      <Ellipse
        cx={originX}
        cy={underTipY + 26}
        rx={GRID_SIZE * halfW * 0.82}
        ry={22}
        fill="url(#islandShadowGrad)"
      />

      {/* Layer 4: Tapered floating rocky underside */}
      <Polygon points={leftUnderPoints} fill={isNight ? '#2A2824' : '#7B6753'} />
      <Polygon points={rightUnderPoints} fill={isNight ? '#1F1D1A' : '#625140'} />

      {/* Trailing underside roots */}
      <G stroke={isNight ? '#43382C' : '#6B533E'} strokeLinecap="round" fill="none">
        <Path d={`M ${oBottomX - 74} ${oBottomY + 24} Q ${oBottomX - 82} ${oBottomY + 56} ${oBottomX - 68} ${oBottomY + 72}`} strokeWidth={2.2} />
        <Path d={`M ${oBottomX - 18} ${oBottomY + 42} Q ${oBottomX - 10} ${oBottomY + 70} ${oBottomX - 20} ${oBottomY + 86}`} strokeWidth={1.8} />
        <Path d={`M ${oBottomX + 46} ${oBottomY + 34} Q ${oBottomX + 54} ${oBottomY + 62} ${oBottomX + 42} ${oBottomY + 74}`} strokeWidth={1.8} />
      </G>

      {/* Layer 3: Weathered sandstone & limestone cliff walls */}
      <Polygon points={leftRockPoints} fill="url(#leftRockGrad)" />
      <Polygon points={rightRockPoints} fill="url(#rightRockGrad)" />

      {/* Subtle carved rock facet ridges for 3D depth */}
      <Polygon
        points={`${oLeftX + 70},${oLeftY + 54} ${oLeftX + 128},${oLeftY + 84} ${oLeftX + 114},${oLeftY + 106} ${oLeftX + 64},${oLeftY + 74}`}
        fill="rgba(255,255,255,0.08)"
      />
      <Polygon
        points={`${oBottomX + 70},${oBottomY - 12} ${oBottomX + 132},${oBottomY - 46} ${oBottomX + 122},${oBottomY - 14} ${oBottomX + 68},${oBottomY + 16}`}
        fill="rgba(0,0,0,0.08)"
      />

      {/* Layer 2: Rich terracotta topsoil band */}
      <Polygon points={leftSoilPoints} fill="url(#leftSoilGrad)" />
      <Polygon points={rightSoilPoints} fill="url(#rightSoilGrad)" />

      {/* Layer 1: Lush overhanging grass rim */}
      <Polygon points={leftRimPoints} fill={rimLeftColor} />
      <Polygon points={rightRimPoints} fill={rimRightColor} />

      {/* Outer meadow verge apron */}
      <Polygon
        points={outerTopPoints}
        fill={apronColor}
        stroke="rgba(54, 94, 68, 0.16)"
        strokeWidth={1.2}
      />

      {/* Inner 8x8 sunlit meadow plateau */}
      <Polygon
        points={innerTopPoints}
        fill="url(#islandGrassGrad)"
        stroke="rgba(54, 94, 68, 0.12)"
        strokeWidth={1}
      />

      {/* Organic layered meadow clearings & sun-warmed grass contours */}
      {!isInteractiveMode ? (
        <G>
          <Ellipse
            cx={originX - 66}
            cy={originY + 128}
            rx={68}
            ry={28}
            fill={isNight ? '#344F3D' : '#E5F0D8'}
            opacity={0.72}
          />
          <Ellipse
            cx={originX + 62}
            cy={originY + 168}
            rx={56}
            ry={24}
            fill={isNight ? '#24392C' : '#C3D7B2'}
            opacity={0.55}
          />
          <Ellipse
            cx={originX - 8}
            cy={originY + 215}
            rx={48}
            ry={19}
            fill={isNight ? '#334D3C' : '#E1ECD4'}
            opacity={0.62}
          />
        </G>
      ) : null}

      {/* Winding flagstone garden stepping path */}
      <G opacity={isInteractiveMode ? 0.35 : 0.86}>
        {[
          { cx: originX - 86, cy: originY + 150, rx: 12, ry: 6.5 },
          { cx: originX - 58, cy: originY + 162, rx: 14, ry: 7.2 },
          { cx: originX - 28, cy: originY + 172, rx: 11, ry: 6 },
          { cx: originX + 4, cy: originY + 182, rx: 15, ry: 7.5 },
          { cx: originX + 38, cy: originY + 174, rx: 12, ry: 6.2 },
          { cx: originX + 66, cy: originY + 160, rx: 13, ry: 6.8 },
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
              fill={isNight ? '#5C655D' : '#DED8CA'}
              stroke={isNight ? '#464E47' : '#C6BFAE'}
              strokeWidth={0.9}
            />
          </G>
        ))}
      </G>

      {/* Tranquil Sanctuary Spring & Lily Pond (upper-right scenic verge) */}
      <G opacity={isInteractiveMode ? 0.55 : 1}>
        {/* Pond stone rim */}
        <Ellipse
          cx={pondCx}
          cy={pondCy}
          rx={46}
          ry={22}
          fill={isNight ? '#4D574F' : '#B9B5A6'}
        />
        {/* Water surface */}
        <Ellipse
          cx={pondCx}
          cy={pondCy + 1}
          rx={41}
          ry={18.5}
          fill="url(#pondWaterGrad)"
        />
        {/* Gentle brook channel spilling cleanly to the front-right cliff lip */}
        <Path
          d={`M ${pondCx + 24} ${pondCy + 6} Q ${pondCx + 36} ${pondCy + 14} ${wfLipX + 7} ${wfLipY - 2} L ${wfLipX - 8} ${wfLipY + 5} Q ${pondCx + 22} ${pondCy + 18} ${pondCx + 10} ${pondCy + 14} Z`}
          fill="url(#pondWaterGrad)"
        />
        {/* Miniature arched wooden footbridge over the brook */}
        <Path
          d={`M ${pondCx + 16} ${pondCy + 17} Q ${pondCx + 28} ${pondCy + 8} ${pondCx + 38} ${pondCy + 4}`}
          fill="none"
          stroke={isNight ? '#5C4430' : '#9E734C'}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <Path
          d={`M ${pondCx + 16} ${pondCy + 17} Q ${pondCx + 28} ${pondCy + 8} ${pondCx + 38} ${pondCy + 4}`}
          fill="none"
          stroke={isNight ? '#7A5B41' : '#C49A6E'}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Lily pads */}
        <G>
          <Ellipse cx={pondCx - 14} cy={pondCy + 3} rx={7.5} ry={4} fill="#5C9160" />
          <Path d={`M ${pondCx - 14} ${pondCy + 3} L ${pondCx - 8} ${pondCy + 1}`} stroke="#3E798A" strokeWidth={1.3} />
          <Ellipse cx={pondCx + 10} cy={pondCy - 4} rx={6} ry={3.2} fill="#6CA36E" />
          {/* Tiny lotus bud */}
          <Circle cx={pondCx - 15} cy={pondCy + 1.5} r={2.3} fill="#F4C7C9" />
          <Circle cx={pondCx - 15} cy={pondCy + 1} r={1.1} fill="#FFF2E2" />
        </G>
        {/* Static water highlight arcs */}
        <Path
          d={`M ${pondCx - 22} ${pondCy - 5} Q ${pondCx - 8} ${pondCy - 9} ${pondCx + 4} ${pondCy - 6}`}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      </G>

      {/* Cascading waterfall ribbon spilling directly off the front-right cliff edge */}
      <G opacity={0.92}>
        <Path
          d={`M ${wfLipX - 8} ${wfLipY + 4} C ${wfLipX - 7} ${wfLipY + 34}, ${wfLipX - 10} ${wfLipY + 64}, ${wfLipX - 6} ${wfLipY + 94} L ${wfLipX + 7} ${wfLipY + 90} C ${wfLipX + 5} ${wfLipY + 60}, ${wfLipX + 9} ${wfLipY + 30}, ${wfLipX + 6} ${wfLipY - 2} Z`}
          fill="url(#waterfallGrad)"
        />
        {/* Subtle vertical white water streaks */}
        <Path
          d={`M ${wfLipX - 2} ${wfLipY + 8} L ${wfLipX - 3} ${wfLipY + 68}`}
          stroke="rgba(255,255,255,0.48)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d={`M ${wfLipX + 3} ${wfLipY + 4} L ${wfLipX + 2} ${wfLipY + 52}`}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.1}
          strokeLinecap="round"
        />
        {/* Foam crest right at cliff lip */}
        <Ellipse cx={wfLipX - 1} cy={wfLipY + 2} rx={8} ry={3.2} fill="rgba(255,255,255,0.78)" />
      </G>

      {/* Scenic perimeter wooden fence, mossy boulders, corner trees, and wildflowers */}
      <G opacity={isInteractiveMode ? 0.45 : 0.96}>
        {/* Cozy low timber garden fence along upper-left rim */}
        <G stroke={isNight ? '#5E4B3B' : '#A98462'} strokeLinecap="round">
          <Path d={`M ${oTopX - 46} ${oTopY + 20} L ${oTopX - 46} ${oTopY + 6}`} strokeWidth={3} />
          <Path d={`M ${oTopX - 74} ${oTopY + 35} L ${oTopX - 74} ${oTopY + 21}`} strokeWidth={3} />
          <Path d={`M ${oTopX - 102} ${oTopY + 50} L ${oTopX - 102} ${oTopY + 36}`} strokeWidth={3} />
          <Path d={`M ${oTopX - 46} ${oTopY + 11} L ${oTopX - 102} ${oTopY + 41}`} strokeWidth={2.2} />
          <Path d={`M ${oTopX - 46} ${oTopY + 17} L ${oTopX - 102} ${oTopY + 47}`} strokeWidth={2} />
        </G>

        {/* Scenic botanical corner cypress/shrub cluster near north peak */}
        <G>
          <Ellipse cx={oTopX + 26} cy={oTopY + 20} rx={11} ry={5} fill="rgba(30,40,30,0.14)" />
          <Circle cx={oTopX + 20} cy={oTopY + 13} r={8.5} fill={isNight ? '#284532' : '#4E7D58'} />
          <Circle cx={oTopX + 31} cy={oTopY + 15} r={7} fill={isNight ? '#32543D' : '#65946B'} />
          <Circle cx={oTopX + 25} cy={oTopY + 7} r={6.5} fill={isNight ? '#3B6348' : '#79A87C'} />
          <Circle cx={oTopX + 22} cy={oTopY + 9} r={1.8} fill="#F6D1D3" />
          <Circle cx={oTopX + 29} cy={oTopY + 12} r={1.6} fill="#FFF3D2" />
        </G>

        {/* Top-left boulder cluster */}
        <Ellipse cx={oTopX - 88} cy={oTopY + 62} rx={13} ry={7.5} fill={isNight ? '#4F5750' : '#A9A598'} />
        <Ellipse cx={oTopX - 96} cy={oTopY + 67} rx={8} ry={4.5} fill={isNight ? '#5C655D' : '#BEB9AC'} />
        <Path d={`M ${oTopX - 94} ${oTopY + 59} Q ${oTopX - 88} ${oTopY + 54} ${oTopX - 82} ${oTopY + 59}`} fill="#6C9464" />

        {/* Bottom-left mossy stone & fern tuft */}
        <Ellipse cx={oLeftX + 48} cy={oLeftY + 10} rx={11} ry={6} fill={isNight ? '#4D554E' : '#A5A092'} />
        <Path d={`M ${oLeftX + 34} ${oLeftY + 6} Q ${oLeftX + 30} ${oLeftY - 5} ${oLeftX + 26} ${oLeftY + 2}`} stroke="#4E7C53" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M ${oLeftX + 36} ${oLeftY + 5} Q ${oLeftX + 38} ${oLeftY - 7} ${oLeftX + 43} ${oLeftY - 1}`} stroke="#629166" strokeWidth={1.8} fill="none" strokeLinecap="round" />

        {/* Scattered meadow wildflowers on the apron */}
        {[
          { x: oTopX - 24, y: oTopY + 14, c: '#FFF4D4' },
          { x: oTopX + 18, y: oTopY + 18, c: '#F4C9CE' },
          { x: oLeftX + 28, y: oLeftY - 4, c: '#DCEAF7' },
          { x: oBottomX - 54, y: oBottomY - 14, c: '#FFF4D4' },
          { x: oBottomX + 44, y: oBottomY - 16, c: '#F4C9CE' },
          { x: oRightX - 38, y: oRightY + 4, c: '#FFF4D4' },
        ].map((fl, i) => (
          <G key={`wf_${i}`}>
            <Circle cx={fl.x} cy={fl.y} r={2.6} fill={fl.c} />
            <Circle cx={fl.x} cy={fl.y} r={1} fill="#E2B154" />
          </G>
        ))}
      </G>

      {/* Lush hanging ivy vines with tiny leaves along front cliffs */}
      <G>
        {[
          { x: oLeftX + 58, y: oLeftY + 32, len: 28 },
          { x: oLeftX + 132, y: oLeftY + 70, len: 34 },
          { x: oLeftX + 215, y: oLeftY + 112, len: 24 },
          { x: oBottomX + 68, y: oBottomY - 26, len: 32 },
          { x: oBottomX + 154, y: oBottomY - 72, len: 28 },
        ].map((vine, idx) => (
          <G key={`vine_${idx}`}>
            <Path
              d={`M ${vine.x} ${vine.y} Q ${vine.x + 3} ${vine.y + vine.len * 0.55} ${vine.x - 2} ${vine.y + vine.len}`}
              fill="none"
              stroke={isNight ? '#35573D' : '#537D58'}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Ellipse cx={vine.x - 3} cy={vine.y + vine.len * 0.38} rx={3.5} ry={2} fill={isNight ? '#3F6948' : '#6C986E'} />
            <Ellipse cx={vine.x + 3.5} cy={vine.y + vine.len * 0.72} rx={3.2} ry={1.8} fill={isNight ? '#34583D' : '#5B875E'} />
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
                    ? 'rgba(54, 94, 68, 0.45)'
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
