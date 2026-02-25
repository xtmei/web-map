export type Side = 'Axis' | 'Soviet';

export type Unit = {
  id: string;
  name: string;
  side: Side;
  echelon: 'Army' | 'Corps' | 'Division' | 'Regiment' | 'Battalion';
  strength: number;
  morale: number;
  pos: { q: number; r: number };
};
