import type { Unit } from '../units/model';

export const demoUnits: Unit[] = [
  {
    id: 'axis-6a',
    name: '6A',
    side: 'Axis',
    echelon: 'Army',
    strength: 88,
    morale: 76,
    pos: { q: -4, r: -2 }
  },
  {
    id: 'axis-14pz',
    name: '14Pz',
    side: 'Axis',
    echelon: 'Division',
    strength: 58,
    morale: 69,
    pos: { q: -2, r: -4 }
  },
  {
    id: 'axis-24pz',
    name: '24Pz',
    side: 'Axis',
    echelon: 'Division',
    strength: 52,
    morale: 64,
    pos: { q: -1, r: 1 }
  },
  {
    id: 'axis-71inf',
    name: '71Inf',
    side: 'Axis',
    echelon: 'Division',
    strength: 46,
    morale: 61,
    pos: { q: 0, r: -3 }
  },
  {
    id: 'soviet-62a',
    name: '62A',
    side: 'Soviet',
    echelon: 'Army',
    strength: 80,
    morale: 83,
    pos: { q: 3, r: -1 }
  },
  {
    id: 'soviet-13g',
    name: '13G',
    side: 'Soviet',
    echelon: 'Division',
    strength: 49,
    morale: 78,
    pos: { q: 4, r: -3 }
  },
  {
    id: 'soviet-39g',
    name: '39G',
    side: 'Soviet',
    echelon: 'Division',
    strength: 45,
    morale: 74,
    pos: { q: 1, r: 3 }
  },
  {
    id: 'soviet-95r',
    name: '95R',
    side: 'Soviet',
    echelon: 'Regiment',
    strength: 28,
    morale: 71,
    pos: { q: 5, r: -1 }
  }
];
