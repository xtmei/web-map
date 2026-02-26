import type { GridCell, Squad } from '../data/types';

export function idx(width: number, x: number, y: number): number {
  return y * width + x;
}

export function inBounds(width: number, height: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function neighbors(x: number, y: number): Array<{ x: number; y: number }> {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
}

export function manhattan(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getCell(grid: { width: number; cells: GridCell[] }, x: number, y: number): GridCell {
  return grid.cells[idx(grid.width, x, y)];
}

export function isOccupied(units: Squad[], x: number, y: number): boolean {
  return units.some((u) => u.alive && u.x === x && u.y === y);
}

export function computeReachable(
  grid: { width: number; height: number; cells: GridCell[] },
  unit: Squad,
  units: Squad[]
): Map<string, number> {
  const queue: Array<{ x: number; y: number; cost: number }> = [{ x: unit.x, y: unit.y, cost: 0 }];
  const costs = new Map<string, number>([[`${unit.x},${unit.y}`, 0]]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const n of neighbors(current.x, current.y)) {
      if (!inBounds(grid.width, grid.height, n.x, n.y)) continue;
      const cell = getCell(grid, n.x, n.y);
      if (cell.blocked) continue;
      if (isOccupied(units, n.x, n.y) && !(n.x === unit.x && n.y === unit.y)) continue;
      const step = cell.terrain === 'rubble' ? 2 : 1;
      const next = current.cost + step;
      if (next > unit.ap) continue;
      const key = `${n.x},${n.y}`;
      if (!costs.has(key) || next < (costs.get(key) ?? 999)) {
        costs.set(key, next);
        queue.push({ x: n.x, y: n.y, cost: next });
      }
    }
  }

  costs.delete(`${unit.x},${unit.y}`);
  return costs;
}

export function hasLineOfSight(
  grid: { width: number; height: number; cells: GridCell[] },
  from: { x: number; y: number },
  to: { x: number; y: number }
): boolean {
  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (!(x0 === x1 && y0 === y1)) {
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
    if (x0 === x1 && y0 === y1) break;
    if (!inBounds(grid.width, grid.height, x0, y0)) return false;
    if (getCell(grid, x0, y0).blocked) return false;
  }
  return true;
}

export function computeShootableTargets(
  grid: { width: number; height: number; cells: GridCell[] },
  unit: Squad,
  units: Squad[]
): string[] {
  return units
    .filter((u) => u.alive && u.side !== unit.side)
    .filter((u) => manhattan(unit, u) <= 8)
    .filter((u) => hasLineOfSight(grid, unit, u))
    .map((u) => u.id);
}
