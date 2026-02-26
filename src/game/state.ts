import type { Axial } from '../engine/hex/coords';
import type { HexDirection } from '../engine/hex/grid';
import type { CombatPreview } from './combat/resolve';
import type { ScenarioDefinition, TerrainType } from './scenarios/types';
import type { Side, Unit } from './units/model';

export interface FormationOption {
  id: string;
  name: string;
}

export interface MovePreview {
  dest: Axial;
  path: Axial[];
  cost: number;
}

export interface ReachableState {
  costSoFar: Map<string, number>;
  cameFrom: Map<string, string | null>;
}

export interface GameState {
  scenarioId: string;
  scenarioName: string;
  selectedSide: Side;
  selectedFormationId: string;
  selectedHex: Axial | null;
  selectedUnitId: string | null;
  units: Unit[];
  terrainByHex: Map<string, TerrainType>;
  roadByHex: Map<string, boolean>;
  riverEdgesByHex: Map<string, Set<HexDirection>>;
  movementMode: boolean;
  combatMode: boolean;
  movePreview: MovePreview | null;
  combatPreview: CombatPreview | null;
  reachable: ReachableState | null;
  errorMessage: string | null;
  combatMessage: string | null;
  combatLog: string[];
}

export function getAvailableFormations(units: Unit[], side: Side): FormationOption[] {
  const formations = new Map<string, string>();

  for (const unit of units) {
    if (unit.side === side && !formations.has(unit.formationId)) {
      formations.set(unit.formationId, unit.formationName);
    }
  }

  return Array.from(formations.entries()).map(([id, name]) => ({ id, name }));
}

export function getUnitsForFormation(units: Unit[], formationId: string): Unit[] {
  return units.filter((unit) => unit.formationId === formationId);
}

export function getSelectedUnit(units: Unit[], selectedUnitId: string | null): Unit | null {
  if (!selectedUnitId) {
    return null;
  }

  return units.find((unit) => unit.id === selectedUnitId) ?? null;
}

function toTerrainMap(definition: ScenarioDefinition): Map<string, TerrainType> {
  const result = new Map<string, TerrainType>();
  for (const hex of definition.map.terrain) {
    result.set(`${hex.q},${hex.r}`, hex.type);
  }
  return result;
}

function toRoadMap(definition: ScenarioDefinition): Map<string, boolean> {
  const result = new Map<string, boolean>();
  for (const hex of definition.map.terrain) {
    result.set(`${hex.q},${hex.r}`, hex.road === true);
  }
  return result;
}

function toRiverEdgeMap(definition: ScenarioDefinition): Map<string, Set<HexDirection>> {
  const result = new Map<string, Set<HexDirection>>();
  for (const hex of definition.map.terrain) {
    if (hex.riverEdge && hex.riverEdge.length > 0) {
      result.set(`${hex.q},${hex.r}`, new Set(hex.riverEdge));
    }
  }
  return result;
}

export function applyScenarioToState(state: GameState, definition: ScenarioDefinition): void {
  state.scenarioId = definition.meta.id;
  state.scenarioName = definition.meta.name;
  state.selectedSide = definition.meta.defaultSide;
  state.units = definition.units;
  state.selectedHex = null;
  state.selectedUnitId = null;
  state.terrainByHex = toTerrainMap(definition);
  state.roadByHex = toRoadMap(definition);
  state.riverEdgesByHex = toRiverEdgeMap(definition);
  state.movementMode = false;
  state.combatMode = false;
  state.movePreview = null;
  state.combatPreview = null;
  state.reachable = null;
  state.errorMessage = null;
  state.combatMessage = null;
  state.combatLog = [];

  const formations = getAvailableFormations(state.units, state.selectedSide);
  state.selectedFormationId = formations[0]?.id ?? '';
}

export function createInitialState(): GameState {
  return {
    scenarioId: '',
    scenarioName: '',
    selectedSide: 'Axis',
    selectedFormationId: '',
    selectedHex: null,
    selectedUnitId: null,
    units: [],
    terrainByHex: new Map(),
    roadByHex: new Map(),
    riverEdgesByHex: new Map(),
    movementMode: false,
    combatMode: false,
    movePreview: null,
    combatPreview: null,
    reachable: null,
    errorMessage: null,
    combatMessage: null,
    combatLog: []
  };
}
