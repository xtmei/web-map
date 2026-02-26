import type { Scenario, Squad, GameState } from '../data/types';
import { idx } from './grid';

const CELL = 24;

export function createRenderer(canvas: HTMLCanvasElement, scenario: Scenario) {
  const ctx = canvas.getContext('2d')!;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let tapHandler: ((cell: { x: number; y: number }) => void) | null = null;

  function resize(): void {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }
  resize();
  window.addEventListener('resize', resize);

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.max(0.7, Math.min(2.5, scale * delta));
  }, { passive: false });

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    ox += e.clientX - lastX;
    oy += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', (e) => {
    const moved = Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 4;
    dragging = false;
    if (moved) return;
    const cell = screenToCell(e.clientX, e.clientY);
    if (cell && tapHandler) tapHandler(cell);
  });

  function screenToCell(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - ox) / scale;
    const y = (clientY - rect.top - oy) / scale;
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    if (gx < 0 || gy < 0 || gx >= scenario.grid.width || gy >= scenario.grid.height) return null;
    return { x: gx, y: gy };
  }

  function centerOn(unit: Squad): void {
    ox = canvas.clientWidth / 2 - (unit.x + 0.5) * CELL * scale;
    oy = canvas.clientHeight / 2 - (unit.y + 0.5) * CELL * scale;
  }

  function render(args: { state: GameState; selected?: Squad; reachable: Map<string, number>; shootable: string[]; centerOnSelection: boolean }): void {
    const { state, selected, reachable, shootable, centerOnSelection } = args;
    if (selected && centerOnSelection) centerOn(selected);
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    for (let y = 0; y < scenario.grid.height; y += 1) {
      for (let x = 0; x < scenario.grid.width; x += 1) {
        const cell = scenario.grid.cells[idx(scenario.grid.width, x, y)];
        const key = `${x},${y}`;
        const isReach = reachable.has(key);
        const color = {
          open: '#62706a', road: '#3f3f45', building: '#4d3d36', rubble: '#70624c', wall: '#565656'
        }[cell.terrain];
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
        if (isReach) {
          ctx.fillStyle = 'rgba(90,180,255,0.35)';
          ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
        }
      }
    }

    ctx.fillStyle = '#ffd24d';
    ctx.fillRect(state.scenario.objective.x * CELL + 4, state.scenario.objective.y * CELL + 4, CELL - 8, CELL - 8);

    for (const unit of state.units) {
      if (!unit.alive) continue;
      const selectedMark = selected?.id === unit.id;
      ctx.fillStyle = unit.side === 'Player' ? '#3fa2ff' : '#ff6666';
      ctx.beginPath();
      ctx.arc(unit.x * CELL + CELL / 2, unit.y * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2);
      ctx.fill();
      if (selectedMark) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (shootable.includes(unit.id)) {
        ctx.strokeStyle = '#ffdb6e';
        ctx.strokeRect(unit.x * CELL + 2, unit.y * CELL + 2, CELL - 4, CELL - 4);
      }
    }
    ctx.restore();
  }

  return {
    render,
    onCellTap(handler: (cell: { x: number; y: number }) => void) {
      tapHandler = handler;
    }
  };
}
