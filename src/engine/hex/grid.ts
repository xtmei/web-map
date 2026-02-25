import type { Axial } from './coords';

export function createHexDisc(radius: number): Axial[] {
  const hexes: Axial[] = [];

  for (let q = -radius; q <= radius; q += 1) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);

    for (let r = rMin; r <= rMax; r += 1) {
      hexes.push({ q, r });
    }
  }

  return hexes;
}
