import type { GameState, Scenario, Side, Squad } from '../data/types';
import { computeReachable, getCell, hasLineOfSight, isOccupied, manhattan, neighbors, inBounds } from '../map/grid';

export function createInitialGameState(scenario: Scenario): GameState {
  return {
    turn: 1,
    currentSide: 'Player',
    selectedUnitId: scenario.units.find((u) => u.side === 'Player')?.id ?? null,
    units: structuredClone(scenario.units),
    scenario,
    actionMode: null,
    message: '玩家回合开始',
    gameOver: false
  };
}

export function getUnitById(state: GameState, id: string): Squad | undefined {
  return state.units.find((u) => u.id === id);
}

export function getSelectedUnit(state: GameState): Squad | undefined {
  if (!state.selectedUnitId) return undefined;
  return getUnitById(state, state.selectedUnitId);
}

function resetSideForTurn(state: GameState, side: Side): void {
  for (const u of state.units) {
    if (u.side !== side || !u.alive) continue;
    u.ap = Math.max(2, u.apMax - Math.floor(u.suppression / 2));
    u.suppression = Math.max(0, u.suppression - 1);
  }
}

export function endTurn(state: GameState): void {
  if (state.gameOver) return;
  state.currentSide = 'AI';
  state.selectedUnitId = null;
  state.actionMode = null;
  state.message = 'AI 回合';
  resetSideForTurn(state, 'AI');
}

function applyHit(target: Squad): void {
  target.suppression += 2;
  const loss = Math.random() < 0.6 ? 1 : 0;
  target.casualties += loss;
  if (target.casualties >= target.men) {
    target.alive = false;
    target.ap = 0;
  }
}

export function tryAttack(state: GameState, attackerId: string, targetId: string): boolean {
  const attacker = getUnitById(state, attackerId);
  const target = getUnitById(state, targetId);
  if (!attacker || !target || !attacker.alive || !target.alive) return false;
  if (attacker.ap < 2 || attacker.ammo <= 0) return false;
  if (!hasLineOfSight(state.scenario.grid, attacker, target) || manhattan(attacker, target) > 8) return false;

  const cover = getCell(state.scenario.grid, target.x, target.y).cover;
  const postureBonus = target.posture === 'crouched' ? 0.1 : 0;
  const chance = 0.65 - manhattan(attacker, target) * 0.06 - cover * 0.12 - postureBonus - attacker.suppression * 0.04;

  attacker.ap -= 2;
  attacker.ammo -= 1;
  target.suppression += 1;
  if (Math.random() < Math.max(0.1, chance)) {
    applyHit(target);
  }
  return true;
}

export function tryGrenade(state: GameState, attackerId: string, target: { x: number; y: number }): boolean {
  const attacker = getUnitById(state, attackerId);
  if (!attacker || attacker.ap < 3 || attacker.grenades <= 0) return false;
  if (manhattan(attacker, target) > 4) return false;

  attacker.ap -= 3;
  attacker.grenades -= 1;
  for (const u of state.units) {
    if (!u.alive || u.side === attacker.side) continue;
    if (manhattan(u, target) <= 1) {
      u.suppression += 2;
      if (Math.random() < 0.45) {
        applyHit(u);
      }
    }
  }
  return true;
}

export function tryCrouch(state: GameState): boolean {
  const unit = getSelectedUnit(state);
  if (!unit || unit.ap < 1) return false;
  unit.ap -= 1;
  unit.posture = unit.posture === 'standing' ? 'crouched' : 'standing';
  return true;
}

export function tryEndUnitAction(state: GameState): boolean {
  const unit = getSelectedUnit(state);
  if (!unit) return false;
  unit.ap = 0;
  return true;
}

export function tryMove(state: GameState, x: number, y: number): boolean {
  const unit = getSelectedUnit(state);
  if (!unit) return false;
  const reachable = computeReachable(state.scenario.grid, unit, state.units);
  const cost = reachable.get(`${x},${y}`);
  if (cost === undefined) return false;
  unit.ap -= cost;
  unit.x = x;
  unit.y = y;
  return true;
}

export function getActionAvailability(state: GameState, selected?: Squad): Record<string, { enabled: boolean; reason: string }> {
  if (!selected || selected.side !== 'Player' || !selected.alive || state.currentSide !== 'Player') {
    return {
      move: { enabled: false, reason: '请选择玩家单位' },
      shoot: { enabled: false, reason: '请选择玩家单位' },
      crouch: { enabled: false, reason: '请选择玩家单位' },
      grenade: { enabled: false, reason: '请选择玩家单位' },
      end: { enabled: false, reason: '请选择玩家单位' }
    };
  }

  return {
    move: { enabled: selected.ap > 0, reason: selected.ap > 0 ? '' : 'AP不足' },
    shoot: { enabled: selected.ap >= 2 && selected.ammo > 0, reason: selected.ammo > 0 ? '需要2AP' : '无弹药' },
    crouch: { enabled: selected.ap >= 1, reason: '需要1AP' },
    grenade: { enabled: selected.ap >= 3 && selected.grenades > 0, reason: selected.grenades > 0 ? '需要3AP' : '无手雷' },
    end: { enabled: true, reason: '' }
  };
}

function stepTowardObjective(state: GameState, unit: Squad): void {
  const objective = state.scenario.objective;
  const options = neighbors(unit.x, unit.y)
    .filter((n) => inBounds(state.scenario.grid.width, state.scenario.grid.height, n.x, n.y))
    .filter((n) => !getCell(state.scenario.grid, n.x, n.y).blocked)
    .filter((n) => !isOccupied(state.units, n.x, n.y));

  options.sort((a, b) => manhattan(a, objective) - manhattan(b, objective));
  const next = options[0];
  if (next && unit.ap > 0) {
    unit.x = next.x;
    unit.y = next.y;
    unit.ap -= 1;
  }
}

export function performAiTurn(state: GameState): void {
  const aiUnits = state.units.filter((u) => u.side === 'AI' && u.alive);
  for (const ai of aiUnits) {
    while (ai.ap > 0) {
      const targets = state.units.filter((u) => u.side === 'Player' && u.alive && manhattan(ai, u) <= 8 && hasLineOfSight(state.scenario.grid, ai, u));
      if (targets.length > 0 && ai.ap >= 2 && ai.ammo > 0) {
        tryAttack(state, ai.id, targets[0].id);
        break;
      }
      stepTowardObjective(state, ai);
      if (ai.ap <= 0) break;
    }
  }

  state.currentSide = 'Player';
  state.turn += 1;
  resetSideForTurn(state, 'Player');
  state.selectedUnitId = state.units.find((u) => u.side === 'Player' && u.alive)?.id ?? null;
  state.message = '玩家回合';
}

export function applyVictoryCheck(state: GameState): Side | null {
  const playerAlive = state.units.some((u) => u.side === 'Player' && u.alive);
  const aiAlive = state.units.some((u) => u.side === 'AI' && u.alive);
  if (!playerAlive) {
    state.gameOver = true;
    return 'AI';
  }
  if (!aiAlive) {
    state.gameOver = true;
    return 'Player';
  }

  const pControl = state.units.some((u) => u.side === 'Player' && u.alive && u.x === state.scenario.objective.x && u.y === state.scenario.objective.y);
  const aControl = state.units.some((u) => u.side === 'AI' && u.alive && u.x === state.scenario.objective.x && u.y === state.scenario.objective.y);
  if (pControl) {
    state.gameOver = true;
    return 'Player';
  }
  if (aControl) {
    state.gameOver = true;
    return 'AI';
  }
  return null;
}
