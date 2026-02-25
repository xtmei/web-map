import type { Axial } from './coords';

export type HexDirection = 'E' | 'NE' | 'NW' | 'W' | 'SW' | 'SE';

const DIRECTION_VECTORS: Record<HexDirection, Axial> = {
  E: { q: 1, r: 0 },
  NE: { q: 1, r: -1 },
  NW: { q: 0, r: -1 },
  W: { q: -1, r: 0 },
  SW: { q: -1, r: 1 },
  SE: { q: 0, r: 1 }
};

const OPPOSITE_DIRECTIONS: Record<HexDirection, HexDirection> = {
  E: 'W',
  NE: 'SW',
  NW: 'SE',
  W: 'E',
  SW: 'NE',
  SE: 'NW'
};

export function hexKey(hex: Axial): string {
  return `${hex.q},${hex.r}`;
}

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

export function neighbors(hex: Axial): Axial[] {
  return Object.values(DIRECTION_VECTORS).map((vector) => ({
    q: hex.q + vector.q,
    r: hex.r + vector.r
  }));
}

export function directionFromTo(from: Axial, to: Axial): HexDirection | null {
  const dq = to.q - from.q;
  const dr = to.r - from.r;

  for (const [direction, vector] of Object.entries(DIRECTION_VECTORS)) {
    if (vector.q === dq && vector.r === dr) {
      return direction as HexDirection;
    }
  }

  return null;
}

export function getOppositeDirection(direction: HexDirection): HexDirection {
  return OPPOSITE_DIRECTIONS[direction];
}
