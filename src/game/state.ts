import type { Axial } from '../engine/hex/coords';
import { demoUnits } from './data/demo_units';
import type { Unit } from './units/model';

export interface GameState {
  selectedHex: Axial | null;
  selectedUnitId: string | null;
  units: Unit[];
}

export const initialGameState: GameState = {
  selectedHex: null,
  selectedUnitId: null,
  units: demoUnits
};

export function getSelectedUnit(state: GameState): Unit | null {
  if (!state.selectedUnitId) {
    return null;
  }

  return state.units.find((unit) => unit.id === state.selectedUnitId) ?? null;
}
