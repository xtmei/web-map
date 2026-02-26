export type Side = 'Player' | 'AI';
export type Terrain = 'road' | 'building' | 'rubble' | 'open' | 'wall';

export interface GridCell {
  terrain: Terrain;
  cover: 0 | 1 | 2;
  height: number;
  blocked: boolean;
}

export interface Squad {
  id: string;
  name: string;
  side: Side;
  x: number;
  y: number;
  men: number;
  casualties: number;
  ammo: number;
  grenades: number;
  posture: 'standing' | 'crouched';
  apMax: number;
  ap: number;
  suppression: number;
  alive: boolean;
}

export interface Objective {
  x: number;
  y: number;
}

export interface Scenario {
  id: string;
  name: string;
  grid: {
    width: number;
    height: number;
    cells: GridCell[];
  };
  units: Squad[];
  objective: Objective;
}

export interface GameState {
  turn: number;
  currentSide: Side;
  selectedUnitId: string | null;
  units: Squad[];
  scenario: Scenario;
  actionMode: 'move' | 'shoot' | 'grenade' | null;
  message: string;
  gameOver: boolean;
}
