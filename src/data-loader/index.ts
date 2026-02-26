import type { DataBundle, PhaseMeta, UnitRecord } from './types';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function loadScenarioData(): Promise<DataBundle> {
  const phases = await fetchJson<PhaseMeta[]>('/data/phases.json');
  const unitsByPhase = new Map<number, UnitRecord[]>();
  const frontlineByPhase = new Map<number, any>();

  await Promise.all(
    phases.map(async (phase) => {
      const suffix = String(phase.id).padStart(2, '0');
      const [units, frontline] = await Promise.all([
        fetchJson<UnitRecord[]>(`/data/units_phase_${suffix}.json`),
        fetchJson<any>(`/data/frontline_phase_${suffix}.geojson`)
      ]);
      unitsByPhase.set(phase.id, units);
      frontlineByPhase.set(phase.id, frontline);
    })
  );

  const objectives = await fetchJson<any>(
    '/data/objectives.geojson'
  );

  return { phases, unitsByPhase, frontlineByPhase, objectives };
}
