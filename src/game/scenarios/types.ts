import type { Side, Unit } from '../units/model';
import type { HexDirection } from '../../engine/hex/grid';

export type TerrainType =
  | 'clear'
  | 'steppe'
  | 'urban'
  | 'river'
  | 'factory'
  | 'hill'
  | 'swamp'
  | 'mud';

export interface ScenarioMeta {
  id: string;
  name: string;
  description: string;
  mapRadius: number;
  defaultSide: Side;
}

export interface TerrainHex {
  q: number;
  r: number;
  type: TerrainType;
  road?: boolean;
  riverEdge?: HexDirection[];
}

export interface ScenarioMap {
  terrain: TerrainHex[];
}

export interface ScenarioDefinition {
  meta: ScenarioMeta;
  map: ScenarioMap;
  units: Unit[];
}

export interface ScenarioOption {
  id: string;
  name: string;
  basePath: string;
}
