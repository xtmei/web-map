import type { Unit } from '../../game/units/model';
import type { TerrainType } from '../../game/scenarios/types';
import type { Axial } from './coords';
import { axialToPixel } from './coords';
import type { HexDirection } from './grid';

export interface HexStyle {
  fill: string;
  stroke: string;
  lineWidth: number;
}

const UNIT_TOKEN_SIZE_FACTOR = 0.52;

const TERRAIN_STYLES: Record<TerrainType, { fill: string; stroke: string; accent: string }> = {
  clear: {
    fill: 'rgba(76, 74, 71, 0.72)',
    stroke: 'rgba(186, 180, 172, 0.42)',
    accent: 'rgba(120, 112, 102, 0.22)'
  },
  steppe: {
    fill: 'rgba(116, 128, 84, 0.78)',
    stroke: 'rgba(193, 205, 146, 0.52)',
    accent: 'rgba(184, 176, 109, 0.2)'
  },
  urban: {
    fill: 'rgba(101, 89, 81, 0.84)',
    stroke: 'rgba(208, 184, 161, 0.58)',
    accent: 'rgba(191, 131, 92, 0.26)'
  },
  river: {
    fill: 'rgba(53, 89, 128, 0.86)',
    stroke: 'rgba(132, 186, 240, 0.64)',
    accent: 'rgba(168, 216, 255, 0.25)'
  },
  factory: {
    fill: 'rgba(96, 82, 82, 0.86)',
    stroke: 'rgba(189, 155, 155, 0.6)',
    accent: 'rgba(201, 128, 128, 0.24)'
  },
  hill: {
    fill: 'rgba(121, 110, 82, 0.8)',
    stroke: 'rgba(211, 194, 146, 0.56)',
    accent: 'rgba(221, 188, 110, 0.22)'
  },
  swamp: {
    fill: 'rgba(72, 104, 92, 0.84)',
    stroke: 'rgba(136, 186, 167, 0.56)',
    accent: 'rgba(126, 175, 146, 0.26)'
  },
  mud: {
    fill: 'rgba(99, 79, 59, 0.82)',
    stroke: 'rgba(189, 158, 121, 0.54)',
    accent: 'rgba(172, 116, 81, 0.24)'
  }
};

function drawHexPath(ctx: CanvasRenderingContext2D, hex: Axial, size: number): void {
  const center = axialToPixel(hex, size);
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    const x = center.x + size * Math.cos(angle);
    const y = center.y + size * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function drawTerrainTexture(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  size: number,
  accentColor: string,
  seed: number
): void {
  const ridges = 3 + (seed % 2);
  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = Math.max(0.7, size * 0.07);
  ctx.globalAlpha = 0.8;

  for (let i = 0; i < ridges; i += 1) {
    const angle = (((seed * 37 + i * 53) % 360) * Math.PI) / 180;
    const arc = size * (0.25 + i * 0.12);
    ctx.beginPath();
    ctx.ellipse(
      center.x + Math.cos(angle) * size * 0.08,
      center.y + Math.sin(angle) * size * 0.08,
      arc,
      arc * 0.45,
      angle,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawRoad(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, size: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center.x - size * 0.5, center.y + size * 0.18);
  ctx.quadraticCurveTo(center.x, center.y - size * 0.06, center.x + size * 0.52, center.y + size * 0.22);
  ctx.lineWidth = Math.max(1.5, size * 0.16);
  ctx.strokeStyle = 'rgba(67, 52, 38, 0.72)';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x - size * 0.49, center.y + size * 0.16);
  ctx.quadraticCurveTo(center.x, center.y - size * 0.08, center.x + size * 0.5, center.y + size * 0.2);
  ctx.lineWidth = Math.max(0.8, size * 0.07);
  ctx.strokeStyle = 'rgba(171, 147, 104, 0.65)';
  ctx.stroke();
  ctx.restore();
}

function directionToAngle(direction: HexDirection): number {
  const angleByDirection: Record<HexDirection, number> = {
    E: 0,
    NE: -60,
    NW: -120,
    W: 180,
    SW: 120,
    SE: 60
  };

  return (angleByDirection[direction] * Math.PI) / 180;
}

function drawRiverEdges(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  size: number,
  edges: Set<HexDirection>
): void {
  ctx.save();
  ctx.lineCap = 'round';

  for (const edge of edges) {
    const angle = directionToAngle(edge);
    const px = center.x + Math.cos(angle) * size * 0.9;
    const py = center.y + Math.sin(angle) * size * 0.9;

    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(angle) * size * 0.28, center.y + Math.sin(angle) * size * 0.28);
    ctx.lineTo(px, py);
    ctx.lineWidth = Math.max(1.9, size * 0.18);
    ctx.strokeStyle = 'rgba(70, 143, 214, 0.75)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(angle) * size * 0.31, center.y + Math.sin(angle) * size * 0.31);
    ctx.lineTo(px, py);
    ctx.lineWidth = Math.max(0.9, size * 0.07);
    ctx.strokeStyle = 'rgba(196, 231, 255, 0.75)';
    ctx.stroke();
  }

  ctx.restore();
}

export function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  hexes: Axial[],
  size: number,
  style: HexStyle,
  selected: Axial | null,
  terrainByHex: Map<string, TerrainType>,
  roadByHex: Map<string, boolean>,
  riverEdgesByHex: Map<string, Set<HexDirection>>
): void {
  for (const hex of hexes) {
    const key = `${hex.q},${hex.r}`;
    const center = axialToPixel(hex, size);
    const isSelected = selected?.q === hex.q && selected.r === hex.r;
    const terrain = terrainByHex.get(key) ?? 'clear';
    const terrainStyle = TERRAIN_STYLES[terrain];

    drawHexPath(ctx, hex, size);
    ctx.fillStyle = isSelected ? '#5d3628' : terrainStyle?.fill ?? style.fill;
    ctx.strokeStyle = isSelected ? '#ffd38f' : terrainStyle?.stroke ?? style.stroke;
    ctx.lineWidth = isSelected ? style.lineWidth * 1.75 : style.lineWidth;
    ctx.fill();
    ctx.stroke();

    ctx.save();
    drawHexPath(ctx, hex, size * 0.97);
    ctx.clip();

    const seed = Math.abs(hex.q * 92821 + hex.r * 68917);
    drawTerrainTexture(ctx, center, size, terrainStyle?.accent ?? 'rgba(255,255,255,0.12)', seed);

    if (roadByHex.get(key)) {
      drawRoad(ctx, center, size);
    }

    const riverEdges = riverEdgesByHex.get(key);
    if (riverEdges) {
      drawRiverEdges(ctx, center, size, riverEdges);
    }

    if (isSelected) {
      const glow = ctx.createRadialGradient(center.x, center.y, size * 0.16, center.x, center.y, size * 1.12);
      glow.addColorStop(0, 'rgba(255, 220, 156, 0.22)');
      glow.addColorStop(1, 'rgba(255, 220, 156, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(center.x - size * 1.2, center.y - size * 1.2, size * 2.4, size * 2.4);
    }

    ctx.restore();
  }
}

export function drawReachableOverlay(
  ctx: CanvasRenderingContext2D,
  hexes: Axial[],
  size: number
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(78, 183, 255, 0.2)';
  ctx.strokeStyle = 'rgba(78, 183, 255, 0.5)';
  ctx.lineWidth = Math.max(1.1, size * 0.05);

  for (const hex of hexes) {
    drawHexPath(ctx, hex, size);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPathOverlay(ctx: CanvasRenderingContext2D, path: Axial[], size: number): void {
  if (path.length === 0) {
    return;
  }

  ctx.save();

  for (const hex of path) {
    drawHexPath(ctx, hex, size);
    ctx.strokeStyle = 'rgba(255, 216, 110, 0.85)';
    ctx.lineWidth = Math.max(1.8, size * 0.1);
    ctx.stroke();
  }

  ctx.beginPath();
  path.forEach((hex, index) => {
    const center = axialToPixel(hex, size);
    if (index === 0) {
      ctx.moveTo(center.x, center.y);
    } else {
      ctx.lineTo(center.x, center.y);
    }
  });
  ctx.strokeStyle = 'rgba(255, 231, 164, 0.95)';
  ctx.lineWidth = Math.max(2.4, size * 0.16);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();
}

export function getUnitTokenRadius(hexSize: number): number {
  return hexSize * UNIT_TOKEN_SIZE_FACTOR;
}

export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: Unit[],
  hexSize: number,
  selectedUnitId: string | null,
  selectedFormationId: string
): void {
  const tokenRadius = getUnitTokenRadius(hexSize);

  for (const unit of units) {
    const center = axialToPixel(unit.pos, hexSize);
    const isSelected = selectedUnitId === unit.id;
    const isControllable = unit.formationId === selectedFormationId;

    ctx.save();
    if (!isControllable) {
      ctx.globalAlpha = 0.3;
    }

    if (isSelected) {
      const ringRadius = tokenRadius * 1.25;
      ctx.beginPath();
      ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1.5, hexSize * 0.08);
      ctx.strokeStyle = '#ffea8a';
      ctx.stroke();
    }

    if (unit.side === 'Axis') {
      const squareSize = tokenRadius * 1.75;
      const half = squareSize / 2;
      ctx.beginPath();
      ctx.rect(center.x - half, center.y - half, squareSize, squareSize);
      ctx.fillStyle = '#707782';
      ctx.strokeStyle = '#1e2328';
      ctx.lineWidth = Math.max(1.25, hexSize * 0.06);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(center.x, center.y, tokenRadius * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = '#9d5454';
      ctx.strokeStyle = '#2f1111';
      ctx.lineWidth = Math.max(1.25, hexSize * 0.06);
      ctx.fill();
      ctx.stroke();
    }

    const label = unit.name.slice(0, 4);
    ctx.fillStyle = '#f6f3e8';
    ctx.font = `${Math.max(10, hexSize * 0.42)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, center.x, center.y);

    ctx.restore();
  }
}
