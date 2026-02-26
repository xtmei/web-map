import type { Axial } from '../engine/hex/coords';
import { hexKey } from '../engine/hex/grid';
import { computeReachable } from '../game/movement/dijkstra';
import { reconstructPath } from '../game/movement/path';
import type { MovePreview, ReachableState } from '../game/state';
import { getSelectedUnit, type GameState } from '../game/state';
import type { Side, Unit } from '../game/units/model';

export type SupplyState = '通' | '断' | '危';
export type CommandMode = 'browse' | 'command';
export type ActionType = 'move' | 'assault' | 'fire' | 'fortify' | 'resupply';
export type UnitFilter = 'ready' | 'lowSupply' | 'damaged' | 'spent';

export interface UnitStatus {
  supply: SupplyState;
  damage: number;
  fatigue: number;
  morale: number;
  entrenchment: number;
  acted: boolean;
  tanks: number;
  artillery: number;
  vehicles: number;
  chain: string;
}

export interface ActionAvailability {
  type: ActionType;
  label: string;
  apCost: number;
  available: boolean;
  reason: string;
}

export interface PlannedAction {
  type: ActionType;
  target: Axial;
  reason: string;
}

export class UIStore {
  commandMode: CommandMode = 'browse';
  turn = 1;
  actionPoints = 12;
  actionPointsMax = 12;
  supplyStatus: SupplyState = '通';
  logEntries: string[] = [];
  recentToast = '';
  showAttackRange = false;
  showLosRange = false;
  panelView: 'situation' | 'unit' = 'situation';
  activeFilters = new Set<UnitFilter>(['ready']);
  searchText = '';
  pendingAction: ActionType | null = null;
  plannedAction: PlannedAction | null = null;
  quickJumpOpen = false;
  logOpen = false;
  settingsOpen = false;
  unitStatuses = new Map<string, UnitStatus>();
  reachable: ReachableState | null = null;
  movePreview: MovePreview | null = null;

  constructor(private readonly game: GameState) {}

  get scenarioId(): string {
    return this.game.scenarioId;
  }

  get selectedSide(): Side {
    return this.game.selectedSide;
  }

  get selectedUnit(): Unit | null {
    return getSelectedUnit(this.game.units, this.game.selectedUnitId);
  }

  get selectedStatus(): UnitStatus | null {
    const unit = this.selectedUnit;
    if (!unit) return null;
    return this.unitStatuses.get(unit.id) ?? null;
  }

  syncFromGame(): void {
    this.bootstrapUnitStatuses();
    this.supplyStatus = this.computeSupplyStatus();
    if (this.commandMode === 'command') this.recomputeReachable();
  }

  private bootstrapUnitStatuses(): void {
    for (const unit of this.game.units) {
      if (this.unitStatuses.has(unit.id)) continue;
      this.unitStatuses.set(unit.id, {
        supply: unit.mpRemaining <= 1 ? '危' : '通',
        damage: Math.max(0, 100 - unit.strength),
        fatigue: Math.max(0, 100 - unit.morale),
        morale: unit.morale,
        entrenchment: Math.floor(unit.morale / 20),
        acted: false,
        tanks: Math.max(0, Math.round(unit.strength / (unit.side === 'Axis' ? 9 : 10))),
        artillery: Math.max(1, Math.round(unit.strength / 14)),
        vehicles: Math.max(1, Math.round(unit.strength / 7)),
        chain: `${unit.formationName} > ${unit.name}`
      });
    }
  }

  private computeSupplyStatus(): SupplyState {
    const selected = this.selectedUnit;
    if (!selected) return '危';
    return this.unitStatuses.get(selected.id)?.supply ?? '通';
  }

  selectSide(side: Side): void {
    this.game.selectedSide = side;
    this.game.selectedUnitId = null;
    this.game.selectedHex = null;
    this.pendingAction = null;
    this.plannedAction = null;
    this.movePreview = null;
  }

  selectUnit(unitId: string | null): void {
    this.game.selectedUnitId = unitId;
    const unit = this.selectedUnit;
    this.game.selectedHex = unit ? unit.pos : null;
    this.pendingAction = null;
    this.plannedAction = null;
    this.movePreview = null;
    this.supplyStatus = this.computeSupplyStatus();
    this.recomputeReachable();
  }

  setMode(mode: CommandMode): void {
    this.commandMode = mode;
    this.pendingAction = null;
    this.plannedAction = null;
    this.movePreview = null;
    if (mode === 'command') this.recomputeReachable();
  }

  toggleFilter(filter: UnitFilter): void {
    if (this.activeFilters.has(filter)) this.activeFilters.delete(filter);
    else this.activeFilters.add(filter);
  }

  setSearch(text: string): void {
    this.searchText = text.toLowerCase().trim();
  }

  getFilteredUnits(): Unit[] {
    return this.game.units
      .filter((unit) => unit.side === this.game.selectedSide)
      .filter((unit) => (!this.searchText ? true : `${unit.name} ${unit.formationName}`.toLowerCase().includes(this.searchText)))
      .filter((unit) => {
        if (this.activeFilters.size === 0) return true;
        const status = this.unitStatuses.get(unit.id);
        if (!status) return true;
        for (const filter of this.activeFilters) {
          if (filter === 'ready' && unit.mpRemaining > 0 && !status.acted) return true;
          if (filter === 'lowSupply' && status.supply !== '通') return true;
          if (filter === 'damaged' && status.damage >= 20) return true;
          if (filter === 'spent' && (unit.mpRemaining <= 0 || status.acted)) return true;
        }
        return false;
      });
  }

  recomputeReachable(): void {
    const unit = this.selectedUnit;
    if (!unit || this.commandMode !== 'command') {
      this.reachable = null;
      return;
    }
    this.reachable = computeReachable(unit.pos, unit.mpRemaining, {
      terrainByHex: this.game.terrainByHex,
      roadByHex: this.game.roadByHex,
      riverEdgesByHex: this.game.riverEdgesByHex
    });
  }

  getActionAvailability(): ActionAvailability[] {
    const selected = this.selectedUnit;
    const status = this.selectedStatus;
    const actions: Array<{ type: ActionType; label: string; apCost: number }> = [
      { type: 'move', label: '机动', apCost: 2 },
      { type: 'assault', label: '突击', apCost: 3 },
      { type: 'fire', label: '火力', apCost: 2 },
      { type: 'fortify', label: '筑垒', apCost: 2 },
      { type: 'resupply', label: '补给', apCost: 1 }
    ];

    return actions.map((action) => {
      if (!selected || !status) return { ...action, available: false, reason: '未选中单位' };
      if (this.commandMode !== 'command') return { ...action, available: false, reason: '请先切换到指挥模式' };
      if (this.actionPoints < action.apCost) return { ...action, available: false, reason: '缺AP' };
      if (action.type !== 'resupply' && status.supply === '断') return { ...action, available: false, reason: '无补给' };
      if (action.type === 'move' && selected.mpRemaining <= 0) return { ...action, available: false, reason: '距离不够' };
      if (action.type === 'assault' && status.fatigue > 65) return { ...action, available: false, reason: '疲劳过高' };
      if (action.type === 'fortify' && status.entrenchment >= 4) return { ...action, available: false, reason: '地形限制' };
      return { ...action, available: true, reason: '' };
    });
  }

  beginAction(action: ActionType): boolean {
    const found = this.getActionAvailability().find((entry) => entry.type === action);
    if (!found || !found.available) {
      this.recentToast = found?.reason ?? '动作不可用';
      return false;
    }
    this.pendingAction = action;
    this.plannedAction = null;
    this.recentToast = `规划 ${found.label}：请选择目标`;
    return true;
  }

  updateTarget(hex: Axial): void {
    const unit = this.selectedUnit;
    if (!unit || !this.pendingAction) return;

    if (this.pendingAction === 'move' && this.reachable) {
      const key = hexKey(hex);
      if (!this.reachable.costSoFar.has(key) || key === hexKey(unit.pos)) return;
      this.movePreview = {
        dest: hex,
        path: reconstructPath(this.reachable.cameFrom, key),
        cost: this.reachable.costSoFar.get(key) ?? 0
      };
    }

    this.plannedAction = { type: this.pendingAction, target: hex, reason: `目标 q=${hex.q}, r=${hex.r}` };
  }

  cancelPlannedAction(): void {
    this.pendingAction = null;
    this.plannedAction = null;
    this.movePreview = null;
  }

  confirmPlannedAction(): void {
    const unit = this.selectedUnit;
    const plan = this.plannedAction;
    if (!unit || !plan) return;
    const action = this.getActionAvailability().find((entry) => entry.type === plan.type);
    if (!action?.available) return;

    if (plan.type === 'move' && this.movePreview) {
      unit.pos = { ...this.movePreview.dest };
      unit.mpRemaining = Math.max(0, unit.mpRemaining - this.movePreview.cost);
    }

    const status = this.unitStatuses.get(unit.id);
    if (status) {
      status.acted = true;
      if (plan.type === 'resupply') status.supply = '通';
      if (plan.type === 'fortify') status.entrenchment = Math.min(4, status.entrenchment + 1);
      if (plan.type === 'assault') status.fatigue = Math.min(100, status.fatigue + 12);
    }

    this.actionPoints = Math.max(0, this.actionPoints - action.apCost);
    this.game.selectedHex = { ...unit.pos };
    this.pushLog(`${unit.name} 执行${action.label}，消耗 AP-${action.apCost}`);
    this.recentToast = `${action.label}已执行`;
    this.cancelPlannedAction();
    this.recomputeReachable();
  }

  endTurn(): void {
    this.turn += 1;
    this.actionPoints = this.actionPointsMax;
    for (const unit of this.game.units) {
      if (unit.side !== this.game.selectedSide) continue;
      unit.mpRemaining = unit.mpMax;
      const status = this.unitStatuses.get(unit.id);
      if (status) {
        status.acted = false;
        status.fatigue = Math.max(0, status.fatigue - 10);
        status.supply = status.fatigue > 70 ? '危' : '通';
      }
    }
    this.pushLog(`第 ${this.turn} 回合开始`);
  }

  resetTheatre(): void {
    this.pendingAction = null;
    this.plannedAction = null;
    this.movePreview = null;
    this.pushLog('战区重置（模拟）');
  }

  pushLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    this.logEntries.unshift(`[${timestamp}] ${message}`);
    this.logEntries = this.logEntries.slice(0, 40);
  }
}
