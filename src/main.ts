import './style.css';
import { Camera } from './engine/camera';
import { InputController } from './engine/input';
import { createHexDisc } from './engine/hex/grid';
import { drawHexGrid } from './engine/hex/render';
import { CanvasSurface } from './engine/render/canvas';
import { initialGameState } from './game/state';
import { renderHud } from './ui/hud';

const HEX_SIZE = 28;
const GRID_RADIUS = 21;

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');
const hud = document.querySelector<HTMLDivElement>('#hud');

if (!canvas || !hud) {
  throw new Error('Missing root UI elements');
}

const surface = new CanvasSurface(canvas);
const camera = new Camera();
const hexes = createHexDisc(GRID_RADIUS);
const gameState = structuredClone(initialGameState);

camera.x = canvas.clientWidth / 2;
camera.y = canvas.clientHeight / 2;

new InputController(canvas, camera, HEX_SIZE, {
  onSelectHex(hex) {
    gameState.selectedHex = hex;
    renderHud(hud, gameState);
  }
});

renderHud(hud, gameState);

function frame(): void {
  surface.clear();
  camera.apply(surface.ctx);

  drawHexGrid(surface.ctx, hexes, HEX_SIZE, {
    fill: 'rgba(70, 70, 70, 0.6)',
    stroke: 'rgba(170, 170, 170, 0.45)',
    lineWidth: 1.1
  }, gameState.selectedHex);

  requestAnimationFrame(frame);
}

frame();
