import type { HexDirection } from '../../engine/hex/grid';
import { directionFromTo, getOppositeDirection } from '../../engine/hex/grid';
import type { TerrainType } from '../scenarios/types';

const TERRAIN_COSTS: Record<string, number> = {
  clear: 1,
  urban: 2,
  factory: 2,
  hill: 2,
  swamp: 3,
  mud: 3
};

export interface HexMovementData {
  terrainByHex: Map<string, TerrainType>;
  roadByHex: Map<string, boolean>;
  riverEdgesByHex: Map<string, Set<HexDirection>>;
}

export function getTerrainCost(terrain: TerrainType): number {
  return TERRAIN_COSTS[terrain] ?? 1;
}

export function getEnterHexCost(hexKey: string, data: HexMovementData): number {
  const terrain = data.terrainByHex.get(hexKey) ?? 'clear';
  const terrainCost = getTerrainCost(terrain);
  const hasRoad = data.roadByHex.get(hexKey) ?? false;
  return hasRoad ? Math.min(1, terrainCost) : terrainCost;
}

export function isRiverBlocked(
  fromHexKey: string,
  toHexKey: string,
  fromQ: number,
  fromR: number,
  toQ: number,
  toR: number,
  data: HexMovementData
): boolean {
  const direction = directionFromTo({ q: fromQ, r: fromR }, { q: toQ, r: toR });
  if (!direction) {
    return true;
  }

  const opposite = getOppositeDirection(direction);
  const fromEdges = data.riverEdgesByHex.get(fromHexKey);
  const toEdges = data.riverEdgesByHex.get(toHexKey);

  return fromEdges?.has(direction) === true || toEdges?.has(opposite) === true;
}
