import type { Side, Unit } from '../units/model';

export type TerrainType = 'clear' | 'steppe' | 'urban' | 'river';

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
