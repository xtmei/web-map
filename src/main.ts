import './style.css';
import { Camera } from './engine/camera';
import { InputController } from './engine/input';
import { axialToPixel, type Axial } from './engine/hex/coords';
import { createHexDisc, hexKey } from './engine/hex/grid';
import { drawHexGrid, drawPathOverlay, drawReachableOverlay, drawUnits, getUnitTokenRadius } from './engine/hex/render';
import { CanvasSurface } from './engine/render/canvas';
import { applyScenarioToState, createInitialState, getAvailableFormations, getSelectedUnit } from './game/state';
import { getScenarioOptions, loadScenario } from './game/scenarios/loader';
import { UIStore } from './state/store';
import { createTopbar } from './ui/topbar';
import { createPanels } from './ui/panels';
import { createActionDock } from './ui/actions';

const HEX_SIZE = 28;
const FALLBACK_GRID_RADIUS = 21;

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');
const topbarRoot = document.querySelector<HTMLElement>('#topbar-root');
const panelRoot = document.querySelector<HTMLElement>('#panel-root');
const actionRoot = document.querySelector<HTMLElement>('#action-root');
const toastEl = document.querySelector<HTMLElement>('#toast');
if (!canvas || !topbarRoot || !panelRoot || !actionRoot || !toastEl) throw new Error('Missing app roots');

const canvasEl = canvas;
const topbarRootEl = topbarRoot;
const panelRootEl = panelRoot;
const actionRootEl = actionRoot;
const toastNode = toastEl;

const surface = new CanvasSurface(canvasEl);
const camera = new Camera();
const gameState = createInitialState();
const store = new UIStore(gameState);
const scenarioOptions = getScenarioOptions();
let hexes = createHexDisc(FALLBACK_GRID_RADIUS);

camera.x = canvasEl.clientWidth / 2;
camera.y = canvasEl.clientHeight / 2;

function showToast(text: string): void {
  if (!text) return;
  toastNode.textContent = text;
  toastNode.classList.add('is-open');
  window.setTimeout(() => toastNode.classList.remove('is-open'), 1300);
}

function centerOn(hex: Axial): void {
  const pixel = axialToPixel(hex, HEX_SIZE);
  camera.x = canvasEl.clientWidth / 2 - pixel.x * camera.zoom;
  camera.y = canvasEl.clientHeight / 2 - pixel.y * camera.zoom;
}

async function switchScenario(scenarioId: string): Promise<void> {
  try {
    const scenario = await loadScenario(scenarioId);
    applyScenarioToState(gameState, scenario);
    hexes = createHexDisc(scenario.meta.mapRadius);
    store.syncFromGame();
    store.pushLog(`载入场景：${scenario.meta.name}`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error));
  }
  renderUi();
}

function renderRangeRings(ctx: CanvasRenderingContext2D): void {
  const selected = store.selectedUnit;
  if (!selected) return;
  const center = axialToPixel(selected.pos, HEX_SIZE);
  if (store.showAttackRange) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, HEX_SIZE * 3.6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 109, 109, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.restore();
  }
  if (store.showLosRange) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, HEX_SIZE * 5.4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(131, 204, 255, 0.78)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }
}

function renderUi(): void {
  topbar.render();
  panels.render();
  actionDock.render();
}

const topbar = createTopbar(topbarRootEl, store, scenarioOptions, {
  onToggleMode(mode) {
    store.setMode(mode);
    showToast(mode === 'command' ? '已切换：指挥模式' : '已切换：浏览模式');
    renderUi();
  },
  onOpenLog() {
    store.logOpen = !store.logOpen;
    store.panelView = 'situation';
    showToast(store.logOpen ? '日志已展开' : '日志已收起');
    const logSheet = document.querySelector<HTMLElement>('[data-role="log-sheet"]');
    if (logSheet) logSheet.toggleAttribute('hidden', !store.logOpen);
  },
  onToggleSettings() {
    store.settingsOpen = !store.settingsOpen;
    renderUi();
  },
  onCenterShortPress() {
    const unit = store.selectedUnit;
    if (!unit) return;
    centerOn(unit.pos);
  },
  onCenterLongPress() {
    store.quickJumpOpen = !store.quickJumpOpen;
    renderUi();
  },
  onSideChange(side) {
    store.selectSide(side);
    const formations = getAvailableFormations(gameState.units, side);
    gameState.selectedFormationId = formations[0]?.id ?? '';
    store.syncFromGame();
    renderUi();
  },
  onScenarioChange(scenarioId) {
    void switchScenario(scenarioId);
  },
  onQuickJump(type) {
    const units = store.getFilteredUnits();
    if (units.length === 0) return;
    const target =
      type === 'nearest'
        ? units[0]
        : type === 'node'
          ? units[Math.floor(units.length / 2)]
          : units[units.length - 1];
    store.selectUnit(target.id);
    centerOn(target.pos);
    showToast(`快速跳转：${target.name}`);
    renderUi();
  }
});

const panels = createPanels(panelRootEl, store, {
  onSelectUnit(unitId) {
    store.selectUnit(unitId);
    renderUi();
  },
  onToggleFilter(filter) {
    store.toggleFilter(filter);
    renderUi();
  },
  onSearch(text) {
    store.setSearch(text);
    renderUi();
  },
  onToggleUnitPanel() {
    panelRootEl.classList.toggle('panel-collapsed');
  },
  onToggleSituationPanel() {
    store.panelView = store.panelView === 'situation' ? 'unit' : 'situation';
    renderUi();
  }
});

const actionDock = createActionDock(actionRootEl, store, {
  onActionTap(action) {
    if (store.beginAction(action)) renderUi();
    showToast(store.recentToast);
  },
  onActionInfo(message) {
    showToast(message);
  },
  onConfirmPlanned() {
    store.confirmPlannedAction();
    showToast(store.recentToast);
    renderUi();
  },
  onCancelPlanned() {
    store.cancelPlannedAction();
    renderUi();
  },
  onEndTurn() {
    store.endTurn();
    showToast('回合结束');
    renderUi();
  },
  onResetTheatre() {
    store.resetTheatre();
    showToast('战区已重置（mock）');
    renderUi();
  }
});

new InputController(
  canvasEl,
  camera,
  HEX_SIZE,
  {
    onTap({ hex, unit }) {
      if (store.pendingAction) {
        store.updateTarget(hex);
        renderUi();
        return;
      }

      if (unit) {
        store.selectUnit(unit.id);
        gameState.selectedHex = unit.pos;
      } else {
        gameState.selectedHex = hex;
      }
      renderUi();
    }
  },
  {
    getSelectableUnits: () => gameState.units.filter((unit) => unit.side === gameState.selectedSide),
    getUnitHitRadius: () => getUnitTokenRadius(HEX_SIZE)
  }
);

void switchScenario(scenarioOptions[0]?.id ?? '');

function frame(): void {
  surface.clear();
  camera.apply(surface.ctx);

  drawHexGrid(
    surface.ctx,
    hexes,
    HEX_SIZE,
    { fill: 'rgba(70, 70, 70, 0.6)', stroke: 'rgba(170, 170, 170, 0.45)', lineWidth: 1.1 },
    gameState.selectedHex,
    gameState.terrainByHex
  );

  if (store.reachable) {
    const selected = getSelectedUnit(gameState.units, gameState.selectedUnitId);
    const startKey = selected ? hexKey(selected.pos) : '';
    const reachableHexes = Array.from(store.reachable.costSoFar.keys())
      .filter((key) => key !== startKey)
      .map((key) => {
        const [q, r] = key.split(',').map(Number);
        return { q, r };
      });
    drawReachableOverlay(surface.ctx, reachableHexes, HEX_SIZE);
  }

  if (store.movePreview) drawPathOverlay(surface.ctx, store.movePreview.path, HEX_SIZE);

  renderRangeRings(surface.ctx);
  drawUnits(surface.ctx, gameState.units, HEX_SIZE, gameState.selectedUnitId, gameState.selectedFormationId);
  requestAnimationFrame(frame);
}

frame();
