export type Side = 'Axis' | 'Soviet';

export interface PhaseMeta {
  id: number;
  label: string;
  title: string;
  description: string;
  range: string;
}

export interface UnitRecord {
  id: string;
  name: string;
  side: Side;
  echelon: string;
  lat: number;
  lon: number;
  strength: number;
  equipment: string[];
  parentId: string;
  ap: number;
  supply: 'Good' | 'Stretched' | 'Low';
}

export interface ObjectiveProperties {
  name: string;
  type: string;
  vp: number;
}

export interface DataBundle {
  phases: PhaseMeta[];
  unitsByPhase: Map<number, UnitRecord[]>;
  frontlineByPhase: Map<number, any>;
  objectives: any;
}
