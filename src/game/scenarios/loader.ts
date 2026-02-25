import type { Side, Unit } from '../units/model';
import type { ScenarioDefinition, ScenarioMap, ScenarioMeta, ScenarioOption, TerrainType } from './types';

const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: 'stalingrad_42_demo',
    name: 'Stalingrad 1942 Demo',
    basePath: '/scenarios/stalingrad_42_demo'
  }
];

const VALID_ECHELONS = new Set(['Army', 'Corps', 'Division', 'Regiment', 'Battalion']);
const VALID_SIDES = new Set(['Axis', 'Soviet']);
const VALID_TERRAIN = new Set(['clear', 'steppe', 'urban', 'river']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status} ${response.statusText})`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`Invalid JSON in ${url}`);
  }
}

function parseMeta(value: unknown): ScenarioMeta {
  if (!isRecord(value)) {
    throw new Error('meta.json must be an object');
  }

  const { id, name, description, mapRadius, defaultSide } = value;

  if (typeof id !== 'string' || !id) throw new Error('meta.json: "id" must be a non-empty string');
  if (typeof name !== 'string' || !name) throw new Error('meta.json: "name" must be a non-empty string');
  if (typeof description !== 'string') throw new Error('meta.json: "description" must be a string');
  if (typeof mapRadius !== 'number' || mapRadius < 1) throw new Error('meta.json: "mapRadius" must be a positive number');
  if (typeof defaultSide !== 'string' || !VALID_SIDES.has(defaultSide)) {
    throw new Error('meta.json: "defaultSide" must be "Axis" or "Soviet"');
  }

  return { id, name, description, mapRadius, defaultSide: defaultSide as Side };
}

function parseMap(value: unknown): ScenarioMap {
  if (!isRecord(value) || !Array.isArray(value.terrain)) {
    throw new Error('map.json: "terrain" must be an array');
  }

  const terrain = value.terrain.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`map.json: terrain[${index}] must be an object`);
    }

    const { q, r, type } = entry;
    if (typeof q !== 'number' || typeof r !== 'number') {
      throw new Error(`map.json: terrain[${index}] q/r must be numbers`);
    }
    if (typeof type !== 'string' || !VALID_TERRAIN.has(type)) {
      throw new Error(`map.json: terrain[${index}] type must be one of ${Array.from(VALID_TERRAIN).join(', ')}`);
    }

    return { q, r, type: type as TerrainType };
  });

  return { terrain };
}

function parseUnits(value: unknown): Unit[] {
  if (!Array.isArray(value)) {
    throw new Error('units.json must be an array');
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`units.json[${index}] must be an object`);
    }

    const { id, name, side, formationId, formationName, parentId, echelon, strength, morale, pos } = entry;

    if (typeof id !== 'string' || !id) throw new Error(`units.json[${index}].id must be non-empty string`);
    if (typeof name !== 'string' || !name) throw new Error(`units.json[${index}].name must be non-empty string`);
    if (typeof side !== 'string' || !VALID_SIDES.has(side)) throw new Error(`units.json[${index}].side must be Axis or Soviet`);
    if (typeof formationId !== 'string' || !formationId) throw new Error(`units.json[${index}].formationId must be non-empty string`);
    if (typeof formationName !== 'string' || !formationName) throw new Error(`units.json[${index}].formationName must be non-empty string`);
    if (typeof echelon !== 'string' || !VALID_ECHELONS.has(echelon)) throw new Error(`units.json[${index}].echelon is invalid`);
    if (typeof strength !== 'number') throw new Error(`units.json[${index}].strength must be a number`);
    if (typeof morale !== 'number') throw new Error(`units.json[${index}].morale must be a number`);
    if (!isRecord(pos) || typeof pos.q !== 'number' || typeof pos.r !== 'number') {
      throw new Error(`units.json[${index}].pos must include numeric q/r`);
    }

    return {
      id,
      name,
      side: side as Side,
      formationId,
      formationName,
      parentId: typeof parentId === 'string' ? parentId : undefined,
      echelon: echelon as Unit['echelon'],
      strength,
      morale,
      pos: { q: pos.q, r: pos.r }
    };
  });
}

export function getScenarioOptions(): ScenarioOption[] {
  return SCENARIO_OPTIONS;
}

export async function loadScenario(optionId: string): Promise<ScenarioDefinition> {
  const option = SCENARIO_OPTIONS.find((entry) => entry.id === optionId);
  if (!option) {
    throw new Error(`Unknown scenario: ${optionId}`);
  }

  const [rawMeta, rawMap, rawUnits] = await Promise.all([
    fetchJson(`${option.basePath}/meta.json`),
    fetchJson(`${option.basePath}/map.json`),
    fetchJson(`${option.basePath}/units.json`)
  ]);

  const meta = parseMeta(rawMeta);
  const map = parseMap(rawMap);
  const units = parseUnits(rawUnits);

  return { meta, map, units };
}
