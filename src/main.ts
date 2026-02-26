import './style.css';
import { createUi } from './ui/layout';
import { createRenderer } from './map/renderer';
import { loadScenario } from './data/scenario';
import { createInitialGameState, endTurn, getSelectedUnit, performAiTurn, tryAttack, tryCrouch, tryEndUnitAction, tryGrenade, tryMove, getActionAvailability, applyVictoryCheck } from './sim/game';
import { computeReachable, computeShootableTargets } from './map/grid';

const scenarioName = 'city_block_mvp';

async function bootstrap(): Promise<void> {
  const scenario = await loadScenario(scenarioName);
  const state = createInitialGameState(scenario);
  const ui = createUi();
  const renderer = createRenderer(ui.canvas, scenario);

  function sync(): void {
    const selected = getSelectedUnit(state);
    const reachable = selected ? computeReachable(scenario.grid, selected, state.units) : new Map();
    const shootable = selected ? computeShootableTargets(scenario.grid, selected, state.units) : [];
    renderer.render({
      state,
      selected,
      reachable,
      shootable,
      centerOnSelection: ui.state.autoCenter
    });

    ui.renderTopBar(state, selected);
    ui.renderBottomSheet(selected);
    ui.renderActions(getActionAvailability(state, selected), {
      onMove: () => setMode('move'),
      onShoot: () => setMode('shoot'),
      onCrouch: () => {
        tryCrouch(state);
        sync();
      },
      onGrenade: () => setMode('grenade'),
      onEndAction: () => {
        tryEndUnitAction(state);
        sync();
      }
    });
    ui.renderStatus(state.message);
  }

  function setMode(mode: 'move' | 'shoot' | 'grenade' | null): void {
    state.actionMode = mode;
    sync();
  }

  ui.onEndTurn(() => {
    endTurn(state);
    const winner = applyVictoryCheck(state);
    if (winner) {
      state.message = `${winner} 获胜`;
      sync();
      return;
    }
    performAiTurn(state);
    const aiWinner = applyVictoryCheck(state);
    if (aiWinner) {
      state.message = `${aiWinner} 获胜`;
    }
    sync();
  });

  ui.onToggleCenter((value) => {
    ui.state.autoCenter = value;
  });

  renderer.onCellTap(({ x, y }) => {
    const unit = state.units.find((u) => u.x === x && u.y === y && u.alive);
    const selected = getSelectedUnit(state);

    if (state.actionMode === 'move' && selected) {
      const ok = tryMove(state, x, y);
      state.message = ok ? '移动完成' : '无法移动到该位置';
      if (ok) {
        state.actionMode = null;
      }
      sync();
      return;
    }

    if (state.actionMode === 'shoot' && selected) {
      if (unit && unit.side !== selected.side) {
        const ok = tryAttack(state, selected.id, unit.id);
        state.message = ok ? '射击完成' : '射击失败（距离/LOS/AP不足）';
      }
      state.actionMode = null;
      sync();
      return;
    }

    if (state.actionMode === 'grenade' && selected) {
      const ok = tryGrenade(state, selected.id, { x, y });
      state.message = ok ? '投掷完成' : '投掷失败（距离/AP不足）';
      state.actionMode = null;
      sync();
      return;
    }

    if (unit) {
      state.selectedUnitId = unit.id;
      sync();
      return;
    }

    state.selectedUnitId = null;
    sync();
  });

  sync();
}

void bootstrap();
