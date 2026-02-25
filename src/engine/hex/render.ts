import type { Axial } from './coords';
import { axialToPixel } from './coords';

export interface HexStyle {
  fill: string;
  stroke: string;
  lineWidth: number;
}

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
