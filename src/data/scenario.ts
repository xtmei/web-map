import type { GridCell, Scenario, Squad, Terrain } from './types';

interface FeatureRect {
  x: number;
  y: number;
  w: number;
  h: number;
  terrain: Terrain;
  cover: 0 | 1 | 2;
  height: number;
  blocked: boolean;
}

interface GridTemplate {
  width: number;
  height: number;
  base: Omit<GridCell, 'terrain'> & { terrain: Terrain };
  features: FeatureRect[];
}

interface ScenarioFile {
  id: string;
  name: string;
  objective: { x: number; y: number };
  gridTemplate: GridTemplate;
  units: Squad[];
}

function buildCells(template: GridTemplate): GridCell[] {
  const cells = Array.from({ length: template.width * template.height }, () => ({ ...template.base }));
  for (const f of template.features) {
    for (let y = f.y; y < f.y + f.h; y += 1) {
      for (let x = f.x; x < f.x + f.w; x += 1) {
        if (x < 0 || y < 0 || x >= template.width || y >= template.height) continue;
        cells[y * template.width + x] = {
          terrain: f.terrain,
          cover: f.cover,
          height: f.height,
          blocked: f.blocked
        };
      }
    }
  }
  return cells;
}

export async function loadScenario(name: string): Promise<Scenario> {
  const res = await fetch(`/scenarios/${name}/grid.json`);
  const raw = (await res.json()) as ScenarioFile;
  return {
    id: raw.id,
    name: raw.name,
    objective: raw.objective,
    units: raw.units,
    grid: {
      width: raw.gridTemplate.width,
      height: raw.gridTemplate.height,
      cells: buildCells(raw.gridTemplate)
    }
  };
}
