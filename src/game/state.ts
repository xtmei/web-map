import type { Axial } from '../engine/hex/coords';

export interface GameState {
  selectedHex: Axial | null;
}

export const initialGameState: GameState = {
  selectedHex: null
};
