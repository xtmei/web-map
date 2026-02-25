import type { Axial } from '../engine/hex/coords';
import { demoUnits } from './data/demo_units';
import type { Side, Unit } from './units/model';

export interface FormationOption {
  id: string;
  name: string;
}

export interface GameState {
  selectedSide: Side;
  selectedFormationId: string;
  selectedHex: Axial | null;
  selectedUnitId: string | null;
  units: Unit[];
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

const initialSide: Side = 'Axis';
const initialFormation = getAvailableFormations(demoUnits, initialSide)[0]?.id ?? '';

export const initialGameState: GameState = {
  selectedSide: initialSide,
  selectedFormationId: initialFormation,
  selectedHex: null,
  selectedUnitId: null,
  units: demoUnits
};
