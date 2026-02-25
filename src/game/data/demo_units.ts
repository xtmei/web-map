import type { Unit } from '../units/model';

export const demoUnits: Unit[] = [
  {
    id: 'axis-6a',
    name: '6A HQ',
    side: 'Axis',
    formationId: '6A',
    formationName: '6th Army',
    echelon: 'Army',
    strength: 88,
    morale: 76,
    pos: { q: -5, r: -2 }
  },
  {
    id: 'axis-71inf',
    name: '71Inf',
    side: 'Axis',
    formationId: '6A',
    formationName: '6th Army',
    echelon: 'Division',
    strength: 46,
    morale: 61,
    pos: { q: -3, r: -1 }
  },
  {
    id: 'axis-295inf',
    name: '295Inf',
    side: 'Axis',
    formationId: '6A',
    formationName: '6th Army',
    echelon: 'Division',
    strength: 48,
    morale: 62,
    pos: { q: -2, r: 1 }
  },
  {
    id: 'axis-4pa',
    name: '4PA HQ',
    side: 'Axis',
    formationId: '4PA',
    formationName: '4th Panzer Army',
    echelon: 'Army',
    strength: 84,
    morale: 74,
    pos: { q: -1, r: -4 }
  },
  {
    id: 'axis-14pz',
    name: '14Pz',
    side: 'Axis',
    formationId: '4PA',
    formationName: '4th Panzer Army',
    echelon: 'Division',
    strength: 58,
    morale: 69,
    pos: { q: 0, r: -2 }
  },
  {
    id: 'soviet-62a',
    name: '62A HQ',
    side: 'Soviet',
    formationId: '62A',
    formationName: '62nd Army',
    echelon: 'Army',
    strength: 80,
    morale: 83,
    pos: { q: 3, r: -1 }
  },
  {
    id: 'soviet-13g',
    name: '13G',
    side: 'Soviet',
    formationId: '62A',
    formationName: '62nd Army',
    echelon: 'Division',
    strength: 49,
    morale: 78,
    pos: { q: 4, r: -3 }
  },
  {
    id: 'soviet-39g',
    name: '39G',
    side: 'Soviet',
    formationId: '62A',
    formationName: '62nd Army',
    echelon: 'Division',
    strength: 45,
    morale: 74,
    pos: { q: 2, r: 2 }
  },
  {
    id: 'soviet-64a',
    name: '64A HQ',
    side: 'Soviet',
    formationId: '64A',
    formationName: '64th Army',
    echelon: 'Army',
    strength: 82,
    morale: 79,
    pos: { q: 5, r: 0 }
  },
  {
    id: 'soviet-204r',
    name: '204R',
    side: 'Soviet',
    formationId: '64A',
    formationName: '64th Army',
    echelon: 'Regiment',
    strength: 31,
    morale: 70,
    pos: { q: 1, r: 4 }
  }
];
