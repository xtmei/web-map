import type { Axial } from '../../engine/hex/coords';

function keyToAxial(value: string): Axial {
  const [q, r] = value.split(',').map(Number);
  return { q, r };
}

export function reconstructPath(cameFrom: Map<string, string | null>, destinationKey: string): Axial[] {
  if (!cameFrom.has(destinationKey)) {
    return [];
  }

  const path: Axial[] = [];
  let currentKey: string | null = destinationKey;

  while (currentKey) {
    path.push(keyToAxial(currentKey));
    currentKey = cameFrom.get(currentKey) ?? null;
  }

  return path.reverse();
}
