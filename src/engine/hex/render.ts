import type { Unit } from '../../game/units/model';
import type { Axial } from './coords';
import { axialToPixel } from './coords';

export interface HexStyle {
  fill: string;
  stroke: string;
  lineWidth: number;
}

const UNIT_TOKEN_SIZE_FACTOR = 0.52;

export function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  hexes: Axial[],
  size: number,
  style: HexStyle,
  selected: Axial | null
): void {
  for (const hex of hexes) {
    const center = axialToPixel(hex, size);
    const isSelected = selected?.q === hex.q && selected.r === hex.r;

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

    ctx.fillStyle = isSelected ? '#5d3628' : style.fill;
    ctx.strokeStyle = isSelected ? '#ffd38f' : style.stroke;
    ctx.lineWidth = isSelected ? style.lineWidth * 1.75 : style.lineWidth;
    ctx.fill();
    ctx.stroke();
  }
}

export function getUnitTokenRadius(hexSize: number): number {
  return hexSize * UNIT_TOKEN_SIZE_FACTOR;
}

export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: Unit[],
  hexSize: number,
  selectedUnitId: string | null
): void {
  const tokenRadius = getUnitTokenRadius(hexSize);

  for (const unit of units) {
    const center = axialToPixel(unit.pos, hexSize);
    const isSelected = selectedUnitId === unit.id;

    ctx.save();

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
