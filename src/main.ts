import './style.css';
import { Camera } from './engine/camera';
import { InputController } from './engine/input';
import { createHexDisc, hexKey } from './engine/hex/grid';
import {
  drawHexGrid,
  drawPathOverlay,
  drawReachableOverlay,
  drawUnits,
  getUnitTokenRadius
} from './engine/hex/render';
import { CanvasSurface } from './engine/render/canvas';
import {
  applyScenarioToState,
  createInitialState,
  getAvailableFormations,
  getSelectedUnit,
  getUnitsForFormation
} from './game/state';
import { computeReachable } from './game/movement/dijkstra';
import { reconstructPath } from './game/movement/path';
import { getScenarioOptions, loadScenario } from './game/scenarios/loader';
import type { Side } from './game/units/model';
import { createControls } from './ui/controls';
import { renderHud } from './ui/hud';
import { createUnitPanel } from './ui/panel';

const HEX_SIZE = 28;
const FALLBACK_GRID_RADIUS = 21;

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');
const hud = document.querySelector<HTMLDivElement>('#hud');
const controlsRoot = document.querySelector<HTMLDivElement>('#controls-root');
const panelRoot = document.querySelector<HTMLDivElement>('#panel-root');

if (!canvas || !hud || !controlsRoot || !panelRoot) {
  throw new Error('Missing root UI elements');
}

const canvasEl = canvas;
const hudEl = hud;
const controlsRootEl = controlsRoot;
const panelRootEl = panelRoot;

const surface = new CanvasSurface(canvasEl);
const camera = new Camera();
const gameState = createInitialState();
const scenarioOptions = getScenarioOptions();
let hexes = createHexDisc(FALLBACK_GRID_RADIUS);

camera.x = canvasEl.clientWidth / 2;
camera.y = canvasEl.clientHeight / 2;

function clearMovementState(exitMode: boolean): void {
  gameState.movePreview = null;
  gameState.reachable = null;
  if (exitMode) {
    gameState.movementMode = false;
  }
}

function recomputeReachable(): void {
  if (!gameState.movementMode) {
    gameState.reachable = null;
    return;
  }

  const selectedUnit = getSelectedUnit(gameState.units, gameState.selectedUnitId);
  if (!selectedUnit || selectedUnit.formationId !== gameState.selectedFormationId || selectedUnit.mpRemaining <= 0) {
    gameState.reachable = null;
    return;
  }

  gameState.reachable = computeReachable(selectedUnit.pos, selectedUnit.mpRemaining, {
    terrainByHex: gameState.terrainByHex,
    roadByHex: gameState.roadByHex,
    riverEdgesByHex: gameState.riverEdgesByHex
  });
}

function setSide(side: Side): void {
  gameState.selectedSide = side;
  const formations = getAvailableFormations(gameState.units, side);
  gameState.selectedFormationId = formations[0]?.id ?? '';
  gameState.selectedUnitId = null;
  clearMovementState(true);
}

function renderUi(): void {
  const formations = getAvailableFormations(gameState.units, gameState.selectedSide);
  const selectedUnit = getSelectedUnit(gameState.units, gameState.selectedUnitId);

  controls.render({
    selectedScenarioId: gameState.scenarioId,
    scenarios: scenarioOptions,
    selectedSide: gameState.selectedSide,
    selectedFormationId: gameState.selectedFormationId,
    formations,
    movementMode: gameState.movementMode,
    canMove:
      !!selectedUnit && selectedUnit.formationId === gameState.selectedFormationId && selectedUnit.mpRemaining > 0,
    canConfirmMove: gameState.movePreview !== null
  });

  panel.render(selectedUnit);
  renderHud(hudEl, gameState);
}

async function switchScenario(scenarioId: string): Promise<void> {
  gameState.errorMessage = null;

  try {
    const scenario = await loadScenario(scenarioId);
    applyScenarioToState(gameState, scenario);
    hexes = createHexDisc(scenario.meta.mapRadius);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    gameState.errorMessage = reason;
  }

  renderUi();
}

function toggleMoveMode(): void {
  const selectedUnit = getSelectedUnit(gameState.units, gameState.selectedUnitId);
  if (!selectedUnit || selectedUnit.formationId !== gameState.selectedFormationId || selectedUnit.mpRemaining <= 0) {
    gameState.movementMode = false;
    clearMovementState(true);
    renderUi();
    return;
  }

  gameState.movementMode = !gameState.movementMode;
  gameState.movePreview = null;
  recomputeReachable();
  renderUi();
}

function setMovePreviewForHex(q: number, r: number): void {
  const selectedUnit = getSelectedUnit(gameState.units, gameState.selectedUnitId);
  if (!selectedUnit || !gameState.reachable) {
    return;
  }

  const destinationKey = `${q},${r}`;
  if (!gameState.reachable.costSoFar.has(destinationKey) || destinationKey === hexKey(selectedUnit.pos)) {
    return;
  }

  const cost = gameState.reachable.costSoFar.get(destinationKey) ?? 0;
  const path = reconstructPath(gameState.reachable.cameFrom, destinationKey);

  gameState.movePreview = {
    dest: { q, r },
    path,
    cost
  };
}

function confirmMove(): void {
  if (!gameState.movePreview) {
    return;
  }

  const selectedUnit = getSelectedUnit(gameState.units, gameState.selectedUnitId);
  if (!selectedUnit) {
    return;
  }

  selectedUnit.pos = { ...gameState.movePreview.dest };
  selectedUnit.mpRemaining = Math.max(0, selectedUnit.mpRemaining - gameState.movePreview.cost);
  gameState.selectedHex = selectedUnit.pos;
  clearMovementState(true);
  renderUi();
}

function cancelMove(): void {
  gameState.movePreview = null;
  gameState.movementMode = false;
  gameState.reachable = null;
  renderUi();
}

function endTurn(): void {
  for (const unit of gameState.units) {
    if (unit.side === gameState.selectedSide) {
      unit.mpRemaining = unit.mpMax;
    }
  }

  clearMovementState(true);
  renderUi();
}

const controls = createControls(controlsRootEl, {
  onScenarioChange(scenarioId) {
    void switchScenario(scenarioId);
  },
  onSideChange(side) {
    setSide(side);
    renderUi();
  },
  onFormationChange(formationId) {
    gameState.selectedFormationId = formationId;
    gameState.selectedUnitId = null;
    clearMovementState(true);
    renderUi();
  },
  onClearSelection() {
    gameState.selectedUnitId = null;
    gameState.selectedHex = null;
    clearMovementState(true);
    renderUi();
  },
  onToggleMoveMode() {
    toggleMoveMode();
  },
  onConfirmMove() {
    confirmMove();
  },
  onCancelMove() {
    cancelMove();
  },
  onEndTurn() {
    endTurn();
  }
});

const panel = createUnitPanel(panelRootEl, () => {
  gameState.selectedUnitId = null;
  clearMovementState(true);
  renderUi();
});

new InputController(
  canvasEl,
  camera,
  HEX_SIZE,
  {
    onTap({ hex, unit }) {
      if (gameState.movementMode && gameState.reachable) {
        if (gameState.reachable.costSoFar.has(`${hex.q},${hex.r}`)) {
          setMovePreviewForHex(hex.q, hex.r);
        }
        gameState.selectedHex = hex;
        renderUi();
        return;
      }

      if (unit) {
        gameState.selectedUnitId = unit.id;
        gameState.selectedHex = unit.pos;
      } else {
        gameState.selectedUnitId = null;
        gameState.selectedHex = hex;
      }

      clearMovementState(true);
      renderUi();
    }
  },
  {
    getSelectableUnits: () => getUnitsForFormation(gameState.units, gameState.selectedFormationId),
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
    {
      fill: 'rgba(70, 70, 70, 0.6)',
      stroke: 'rgba(170, 170, 170, 0.45)',
      lineWidth: 1.1
    },
    gameState.selectedHex,
    gameState.terrainByHex
  );

  if (gameState.movementMode && gameState.reachable) {
    const selectedUnit = getSelectedUnit(gameState.units, gameState.selectedUnitId);
    const startKey = selectedUnit ? hexKey(selectedUnit.pos) : '';
    const reachableHexes = Array.from(gameState.reachable.costSoFar.keys())
      .filter((key) => key !== startKey)
      .map((key) => {
        const [q, r] = key.split(',').map(Number);
        return { q, r };
      });
    drawReachableOverlay(surface.ctx, reachableHexes, HEX_SIZE);
  }

  if (gameState.movePreview) {
    drawPathOverlay(surface.ctx, gameState.movePreview.path, HEX_SIZE);
  }

  drawUnits(
    surface.ctx,
    gameState.units,
    HEX_SIZE,
    gameState.selectedUnitId,
    gameState.selectedFormationId
  );

  requestAnimationFrame(frame);
}

frame();
