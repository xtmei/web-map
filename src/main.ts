import './style.css';
import { Camera } from './engine/camera';
import { InputController } from './engine/input';
import { createHexDisc } from './engine/hex/grid';
import { drawHexGrid, drawUnits, getUnitTokenRadius } from './engine/hex/render';
import { CanvasSurface } from './engine/render/canvas';
import {
  applyScenarioToState,
  createInitialState,
  getAvailableFormations,
  getSelectedUnit,
  getUnitsForFormation
} from './game/state';
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

function setSide(side: Side): void {
  gameState.selectedSide = side;
  const formations = getAvailableFormations(gameState.units, side);
  gameState.selectedFormationId = formations[0]?.id ?? '';
  gameState.selectedUnitId = null;
}

function renderUi(): void {
  const formations = getAvailableFormations(gameState.units, gameState.selectedSide);
  controls.render({
    selectedScenarioId: gameState.scenarioId,
    scenarios: scenarioOptions,
    selectedSide: gameState.selectedSide,
    selectedFormationId: gameState.selectedFormationId,
    formations
  });

  const selectedUnit = getSelectedUnit(gameState.units, gameState.selectedUnitId);
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
    renderUi();
  },
  onClearSelection() {
    gameState.selectedUnitId = null;
    gameState.selectedHex = null;
    renderUi();
  }
});

const panel = createUnitPanel(panelRootEl, () => {
  gameState.selectedUnitId = null;
  renderUi();
});

new InputController(
  canvasEl,
  camera,
  HEX_SIZE,
  {
    onTap({ hex, unit }) {
      if (unit) {
        gameState.selectedUnitId = unit.id;
        gameState.selectedHex = unit.pos;
      } else {
        gameState.selectedUnitId = null;
        gameState.selectedHex = hex;
      }
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
