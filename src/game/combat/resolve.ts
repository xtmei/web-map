import { neighbors } from '../../engine/hex/grid';
import type { Unit } from '../units/model';

export type CombatResultType = 'DE' | 'DR' | 'EX' | 'AR';

export interface CombatPreview {
  attackerId: string;
  defenderId: string;
  attackerStrength: number;
  defenderStrength: number;
  oddsLabel: string;
  roll: number;
  result: CombatResultType;
}

export interface CombatResult {
  preview: CombatPreview;
  summary: string;
}

const CRT: Record<string, CombatResultType[]> = {
  '1:2': ['AR', 'AR', 'AR', 'EX', 'EX', 'DR'],
  '1:1': ['AR', 'AR', 'EX', 'EX', 'DR', 'DR'],
  '2:1': ['AR', 'EX', 'EX', 'DR', 'DR', 'DE'],
  '3:1': ['EX', 'EX', 'DR', 'DR', 'DE', 'DE']
};

function normalizeOdds(attackerStrength: number, defenderStrength: number): string {
  if (defenderStrength <= 0) {
    return '3:1';
  }

  const ratio = attackerStrength / defenderStrength;
  if (ratio < 1) {
    return '1:2';
  }
  if (ratio < 2) {
    return '1:1';
  }
  if (ratio < 3) {
    return '2:1';
  }

  return '3:1';
}

function formatResult(result: CombatResultType): string {
  if (result === 'DE') return 'Defender Eliminated';
  if (result === 'DR') return 'Defender Retreat';
  if (result === 'EX') return 'Exchange';
  return 'Attacker Retreat';
}

export function canAttack(attacker: Unit, defender: Unit): boolean {
  if (attacker.side === defender.side) {
    return false;
  }

  return neighbors(attacker.pos).some((hex) => hex.q === defender.pos.q && hex.r === defender.pos.r);
}

export function buildCombatPreview(attacker: Unit, defender: Unit): CombatPreview {
  const attackerStrength = Math.max(1, Math.round(attacker.strength * (0.5 + attacker.morale / 200)));
  const defenderStrength = Math.max(1, Math.round(defender.strength * (0.5 + defender.morale / 200)));
  const oddsLabel = normalizeOdds(attackerStrength, defenderStrength);
  const roll = Math.floor(Math.random() * 6) + 1;
  const result = CRT[oddsLabel][roll - 1] ?? 'AR';

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    attackerStrength,
    defenderStrength,
    oddsLabel,
    roll,
    result
  };
}

export function applyCombatPreview(units: Unit[], preview: CombatPreview): CombatResult {
  const attacker = units.find((unit) => unit.id === preview.attackerId);
  const defender = units.find((unit) => unit.id === preview.defenderId);

  if (!attacker || !defender) {
    return { preview, summary: 'Combat cancelled: attacker or defender missing.' };
  }

  if (preview.result === 'DE') {
    const index = units.findIndex((unit) => unit.id === defender.id);
    if (index >= 0) {
      units.splice(index, 1);
    }
  }

  if (preview.result === 'DR') {
    defender.morale = Math.max(0, defender.morale - 12);
    defender.strength = Math.max(1, defender.strength - 1);
  }

  if (preview.result === 'EX') {
    attacker.strength = Math.max(1, attacker.strength - 2);
    defender.strength = Math.max(1, defender.strength - 2);
    attacker.morale = Math.max(0, attacker.morale - 6);
    defender.morale = Math.max(0, defender.morale - 6);
  }

  if (preview.result === 'AR') {
    attacker.morale = Math.max(0, attacker.morale - 10);
    attacker.strength = Math.max(1, attacker.strength - 1);
  }

  return {
    preview,
    summary: `Combat ${preview.oddsLabel}, d6=${preview.roll}: ${formatResult(preview.result)}.`
  };
}

