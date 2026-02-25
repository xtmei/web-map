import { hexKey, neighbors } from '../../engine/hex/grid';
import type { Axial } from '../../engine/hex/coords';
import { getEnterHexCost, isRiverBlocked, type HexMovementData } from './cost';

export interface ReachableResult {
  costSoFar: Map<string, number>;
  cameFrom: Map<string, string | null>;
}

interface QueueNode {
  hex: Axial;
  cost: number;
}

export function computeReachable(start: Axial, maxCost: number, data: HexMovementData): ReachableResult {
  const frontier: QueueNode[] = [{ hex: start, cost: 0 }];
  const costSoFar = new Map<string, number>();
  const cameFrom = new Map<string, string | null>();
  const startKey = hexKey(start);

  costSoFar.set(startKey, 0);
  cameFrom.set(startKey, null);

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost);
    const current = frontier.shift();
    if (!current) {
      break;
    }

    const currentKey = hexKey(current.hex);
    const bestKnown = costSoFar.get(currentKey);
    if (bestKnown === undefined || current.cost > bestKnown) {
      continue;
    }

    for (const next of neighbors(current.hex)) {
      const nextKey = hexKey(next);

      if (
        isRiverBlocked(currentKey, nextKey, current.hex.q, current.hex.r, next.q, next.r, data)
      ) {
        continue;
      }

      const nextCost = current.cost + getEnterHexCost(nextKey, data);
      if (nextCost > maxCost) {
        continue;
      }

      const existingCost = costSoFar.get(nextKey);
      if (existingCost === undefined || nextCost < existingCost) {
        costSoFar.set(nextKey, nextCost);
        cameFrom.set(nextKey, currentKey);
        frontier.push({ hex: next, cost: nextCost });
      }
    }
  }

  return { costSoFar, cameFrom };
}
