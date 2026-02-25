import type { Unit } from '../../game/units/model';
import type { TerrainType } from '../../game/scenarios/types';
import type { Axial } from './coords';
import { axialToPixel } from './coords';

export interface HexStyle {
  fill: string;
  stroke: string;
  lineWidth: number;
}

const UNIT_TOKEN_SIZE_FACTOR = 0.52;

const TERRAIN_STYLES: Record<TerrainType, { fill: string; stroke: string }> = {
  clear: { fill: 'rgba(70, 70, 70, 0.6)', stroke: 'rgba(170, 170, 170, 0.45)' },
  steppe: { fill: 'rgba(102, 115, 74, 0.72)', stroke: 'rgba(176, 194, 129, 0.5)' },
  urban: { fill: 'rgba(98, 87, 79, 0.8)', stroke: 'rgba(196, 175, 149, 0.55)' },
  river: { fill: 'rgba(55, 88, 134, 0.82)', stroke: 'rgba(126, 173, 227, 0.65)' },
  factory: { fill: 'rgba(95, 83, 83, 0.82)', stroke: 'rgba(189, 161, 161, 0.58)' },
  hill: { fill: 'rgba(109, 100, 74, 0.78)', stroke: 'rgba(198, 180, 131, 0.58)' },
  swamp: { fill: 'rgba(67, 101, 90, 0.78)', stroke: 'rgba(132, 184, 166, 0.54)' },
  mud: { fill: 'rgba(94, 78, 58, 0.78)', stroke: 'rgba(181, 156, 124, 0.52)' }
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

export function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  hexes: Axial[],
  size: number,
  style: HexStyle,
  selected: Axial | null,
  terrainByHex: Map<string, TerrainType>
): void {
  for (const hex of hexes) {
    const isSelected = selected?.q === hex.q && selected.r === hex.r;
    const terrain = terrainByHex.get(`${hex.q},${hex.r}`) ?? 'clear';
    const terrainStyle = TERRAIN_STYLES[terrain];

    drawHexPath(ctx, hex, size);
    ctx.fillStyle = isSelected ? '#5d3628' : terrainStyle?.fill ?? style.fill;
    ctx.strokeStyle = isSelected ? '#ffd38f' : terrainStyle?.stroke ?? style.stroke;
    ctx.lineWidth = isSelected ? style.lineWidth * 1.75 : style.lineWidth;
    ctx.fill();
    ctx.stroke();
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
