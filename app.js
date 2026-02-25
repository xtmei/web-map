let W, H;
let hexSize = 18;
let originX = 16;
let originY = 18;

const MIN_ZOOM = 0.24;
const MAX_ZOOM = 2.35;
const CAMERA_MARGIN = 18;
const TAP_DRAG_THRESHOLD = 8;

const FALLBACK_MAP_CONFIG = {
  id: 'fallback_map',
  name: '临时战区',
  tier: '基础图层',
  cols: 40,
  rows: 28,
  river: {
    baseRatio: 0.66,
    width: 2,
    primaryAmp: 1.6,
    primaryFreq: 0.36,
    secondaryAmp: 0.8,
    secondaryFreq: 0.13,
    phase: 0.8
  },
  cityCore: { qRatio: 0.43, rRatio: 0.5, coreRadius: 4, innerRadius: 8, suburbRadius: 12 },
  bridgeRows: [6, 10, 13, 17, 21],
  railRows: [9, 14],
  roadColumns: [10, 16, 22],
  eastPortInterval: 6,
  eastPortOffset: 1,
  northRidgeBand: { rMax: 6, qMinOffset: -7, qMaxOffset: 8 },
  southRidgeBand: { rMinFromBottom: 6, qMinOffset: -6, qMaxOffset: 7 },
  mamayev: { q: 14, r: 12, radius: 2 },
  gridLabelStepQ: 5,
  gridLabelStepR: 4,
  overlays: []
};

const FALLBACK_SCENARIO_CONFIG = {
  id: 'fallback_scenario',
  name: '默认战役',
  mapId: 'fallback_map',
  briefing: '默认战役数据已载入。',
  maxTurn: 18,
  supportBase: {
    GER: { arty: 1, air: 1, supply: 1 },
    SOV: { arty: 1, air: 0, supply: 1 }
  },
  objectives: [
    { id: 'OBJ_1', q: 14, r: 12, vp: 3, name: '马马耶夫岗', owner: null },
    { id: 'OBJ_2', q: 20, r: 11, vp: 2, name: '工厂群', owner: null }
  ],
  units: [
    { side: 'GER', name: '德军先遣群', q: 4, r: 12, atk: 7, def: 6, mp: 5, hp: 6, morale: 7, army: '6集团军' },
    { side: 'SOV', name: '苏军守备营', q: 30, r: 14, atk: 7, def: 7, mp: 5, hp: 6, morale: 7, army: '62集团军' }
  ]
};

const MAP_LIBRARY = window.BATTLE_MAP_LIBRARY || {};
const SCENARIO_LIBRARY = window.BATTLE_SCENARIO_LIBRARY || {};
const DEFAULT_SCENARIO = window.DEFAULT_SCENARIO_ID;

let mapCols = 40;
let mapRows = 28;
let mapTier = '基础图层';
let mapLabel = '战区';

const camera = { x: 0, y: 0, zoom: 1 };
const gesture = {
  isPanning: false,
  isPinch: false,
  moved: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  pinchStartDist: 0,
  pinchStartZoom: 1
};

const panelState = {
  left: false,
  right: false,
  desktopLeft: true,
  desktopRight: true
};

const uiFlags = {
  compact: true,
  mapFocus: false
};

let suppressMouseUntil = 0;
let uiDirty = true;
let reachableCache = { key: '', tiles: [] };

const TERRAIN = {
  STEPPE: { name: '草原', cost: 1, def: 0, color: [92, 106, 71] },
  SUBURB: { name: '城郊', cost: 1, def: 1, color: [111, 102, 83] },
  CITY: { name: '城区', cost: 2, def: 2, color: [114, 111, 101] },
  RUINS: { name: '废墟', cost: 2, def: 3, color: [126, 105, 88] },
  INDUSTRY: { name: '工业带', cost: 2, def: 3, color: [129, 100, 77] },
  HILL: { name: '高地', cost: 2, def: 2, color: [98, 108, 86] },
  RIDGE: { name: '棱线', cost: 3, def: 3, color: [86, 92, 75] },
  ROAD: { name: '公路', cost: 1, def: 0, color: [135, 119, 86] },
  RAIL: { name: '铁路', cost: 1, def: 1, color: [122, 116, 102] },
  RIVER: { name: '伏尔加河', cost: 99, def: 0, color: [59, 86, 124] },
  BRIDGE: { name: '桥梁', cost: 1, def: 0, color: [168, 137, 90] },
  PORT: { name: '渡口', cost: 1, def: 1, color: [99, 111, 121] },
  EAST: { name: '东岸', cost: 1, def: 1, color: [88, 100, 89] },
  WOODS: { name: '林地', cost: 2, def: 2, color: [84, 101, 73] },
  MARSH: { name: '湿地', cost: 3, def: 1, color: [92, 103, 91] },
  TRENCH: { name: '堑壕', cost: 2, def: 2, color: [102, 96, 82] },
  BUNKER: { name: '掩体', cost: 2, def: 4, color: [112, 100, 90] }
};

let objectives = [];
const mapData = new Map();
const units = [];
let selected = null;
let mode = 'MOVE';

const MODE_NAMES = {
  MOVE: '机动',
  ATTACK: '突击',
  BOMBARD: '火力',
  FORTIFY: '筑垒'
};

let logs = [];
let gameOver = false;
let currentScenarioId = '';
let currentScenario = null;
let currentMapConfig = null;
let supportBase = {
  GER: { arty: 1, air: 1, supply: 1 },
  SOV: { arty: 1, air: 0, supply: 1 }
};

let state = {
  turn: 1,
  active: 'GER',
  playerSide: 'GER',
  aiSide: 'SOV',
  difficulty: 'normal',
  maxTurn: 18,
  vp: { GER: 0, SOV: 0 },
  support: { GER: { arty: 1, air: 1, supply: 1 }, SOV: { arty: 1, air: 0, supply: 1 } }
};

function setup() {
  W = windowWidth;
  H = windowHeight;
  createCanvas(W, H);
  pixelDensity(1);
  frameRate(40);
  angleMode(RADIANS);
  textFont('monospace');

  bindUI();
  hydrateScenarioSelectors();
  loadScenarioConfig(DEFAULT_SCENARIO || firstScenarioId());
  recalcScale();
  initMap();
  resetGame();
  fitCameraToBattlefield();
  applyUiFlags();
}

function windowResized() {
  W = windowWidth;
  H = windowHeight;
  resizeCanvas(W, H);
  recalcScale();
  updateMobilePanelClass();
  fitCameraToBattlefield();
  markUIDirty();
}

function scenarioEntries() {
  return Object.values(SCENARIO_LIBRARY);
}

function firstScenarioId() {
  const first = scenarioEntries()[0];
  return first ? first.id : FALLBACK_SCENARIO_CONFIG.id;
}

function mapEntries() {
  return Object.values(MAP_LIBRARY);
}

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function getScenarioById(id) {
  if (id && SCENARIO_LIBRARY[id]) return SCENARIO_LIBRARY[id];
  const first = scenarioEntries()[0];
  return first || FALLBACK_SCENARIO_CONFIG;
}

function getMapById(id) {
  if (id === FALLBACK_MAP_CONFIG.id) return FALLBACK_MAP_CONFIG;
  if (id && MAP_LIBRARY[id]) return MAP_LIBRARY[id];
  const first = mapEntries()[0];
  return first || FALLBACK_MAP_CONFIG;
}

function hydrateScenarioSelectors() {
  const scenarios = scenarioEntries();
  const useFallback = scenarios.length === 0;
  const items = useFallback ? [FALLBACK_SCENARIO_CONFIG] : scenarios;
  const html = items.map(item => `<option value="${item.id}">${item.name}</option>`).join('');

  const pick = document.getElementById('pickScenario');
  const quick = document.getElementById('scenarioQuick');
  if (pick) pick.innerHTML = html;
  if (quick) quick.innerHTML = html;

  const initial = DEFAULT_SCENARIO || items[0].id;
  if (pick) pick.value = initial;
  if (quick) quick.value = initial;

  updateScenarioBriefing();
}

function syncScenarioSelectors(id) {
  const pick = document.getElementById('pickScenario');
  const quick = document.getElementById('scenarioQuick');
  if (pick) pick.value = id;
  if (quick) quick.value = id;
}

function updateScenarioBriefing() {
  const briefing = document.getElementById('scenarioBriefing');
  if (!briefing) return;
  const pick = document.getElementById('pickScenario');
  const scenario = getScenarioById(pick ? pick.value : currentScenarioId);
  briefing.textContent = scenario.briefing || '战役简报缺失，请在数据文件中补充。';
}

function syncTopDockLabels() {
  const titleEl = document.getElementById('scenarioTitle');
  const metaEl = document.getElementById('scenarioMeta');
  if (titleEl) titleEl.textContent = currentScenario ? currentScenario.name : '未载入战役';
  if (metaEl) metaEl.textContent = `${mapLabel} · ${mapCols}x${mapRows} · ${mapTier}`;
}

function loadScenarioConfig(id) {
  const sourceScenario = getScenarioById(id);
  const sourceMap = getMapById(sourceScenario.mapId);
  currentScenario = deepClone(sourceScenario);
  currentMapConfig = deepClone(sourceMap);
  currentScenarioId = currentScenario.id;
  mapCols = currentMapConfig.cols || FALLBACK_MAP_CONFIG.cols;
  mapRows = currentMapConfig.rows || FALLBACK_MAP_CONFIG.rows;
  mapTier = currentMapConfig.tier || FALLBACK_MAP_CONFIG.tier;
  mapLabel = currentMapConfig.name || '战区';
  objectives = (currentScenario.objectives || []).map(o => ({ ...o, owner: null }));
  supportBase = deepClone(currentScenario.supportBase || FALLBACK_SCENARIO_CONFIG.supportBase);
  syncScenarioSelectors(currentScenarioId);
  syncTopDockLabels();
  updateScenarioBriefing();
  recalcScale();
  markUIDirty();
}

function applyScenarioFromQuick() {
  const quick = document.getElementById('scenarioQuick');
  if (!quick) return;
  loadScenarioConfig(quick.value);
  initMap();
  resetGame();
  fitCameraToBattlefield();
  document.getElementById('startOverlay').style.display = 'none';
  log(`已切换战役：${currentScenario.name}`);
  markUIDirty();
}

function startGame() {
  const side = document.getElementById('pickSide').value;
  const diff = document.getElementById('pickDiff').value;
  const scenarioId = document.getElementById('pickScenario').value;
  loadScenarioConfig(scenarioId);
  initMap();
  state.playerSide = side;
  state.aiSide = side === 'GER' ? 'SOV' : 'GER';
  state.difficulty = diff;
  resetGame();
  document.getElementById('startOverlay').style.display = 'none';
  fitCameraToBattlefield();
}

function resetGame() {
  if (!currentScenario) loadScenarioConfig(firstScenarioId());

  units.length = 0;
  selected = null;
  mode = 'MOVE';
  logs = [];
  gameOver = false;
  state.turn = 1;
  state.active = 'GER';
  state.maxTurn = currentScenario.maxTurn || 18;
  state.vp = { GER: 0, SOV: 0 };
  state.support = {
    GER: deepClone(supportBase.GER || { arty: 1, air: 1, supply: 1 }),
    SOV: deepClone(supportBase.SOV || { arty: 1, air: 0, supply: 1 })
  };
  objectives = (currentScenario.objectives || []).map(o => ({ ...o, owner: null }));

  closeMobilePanels();
  setMode('MOVE');
  invalidateReachableCache();

  (currentScenario.units || []).forEach(u => addUnit(u));

  refreshSide();
  log(`战役开始：${currentScenario.name}。`);
  log(`战役目标：${currentScenario.briefing}`);
  syncTopDockLabels();
  markUIDirty();
}

function recalcScale() {
  const base = min(W, playableHeight());
  const portrait = isPortraitPhone();
  const mapFactor = max(mapCols / 42, mapRows / 30);
  const densityBase = isMobileLayout() ? (portrait ? 52 : 48) : 44;
  const density = densityBase * Math.sqrt(mapFactor);
  const maxHex = isMobileLayout() ? (portrait ? 16 : 19) : 21;
  hexSize = floor(constrain(base / density, 7, maxHex));
  originX = isMobileLayout() ? 11 : 14;
  originY = isMobileLayout() ? 13 : 16;
  invalidateReachableCache();
}

function markUIDirty() {
  uiDirty = true;
}

function invalidateReachableCache() {
  reachableCache.key = '';
  reachableCache.tiles = [];
}

function getReachableCached(u) {
  const cacheKey = `${u.id}|${u.q},${u.r}|${u.mpLeft}|${u.acted}|${state.active}|${state.turn}`;
  if (reachableCache.key === cacheKey) return reachableCache.tiles;
  const tiles = reachable(u);
  reachableCache.key = cacheKey;
  reachableCache.tiles = tiles;
  return tiles;
}

function calculateRiverCenter(cfg, r) {
  const river = cfg.river || FALLBACK_MAP_CONFIG.river;
  return floor(
    mapCols * (river.baseRatio ?? 0.66)
    + sin(r * (river.primaryFreq ?? 0.36)) * (river.primaryAmp ?? 1.6)
    + sin(r * (river.secondaryFreq ?? 0.13) + (river.phase ?? 0.8)) * (river.secondaryAmp ?? 0.9)
  );
}

function overlayMatches(overlay, q, r) {
  if (!overlay || !overlay.type) return false;
  if (overlay.type === 'rect') {
    const qMin = min(overlay.q1, overlay.q2);
    const qMax = max(overlay.q1, overlay.q2);
    const rMin = min(overlay.r1, overlay.r2);
    const rMax = max(overlay.r1, overlay.r2);
    return q >= qMin && q <= qMax && r >= rMin && r <= rMax;
  }
  if (overlay.type === 'circle') {
    return hexDist(q, r, overlay.q, overlay.r) <= (overlay.radius ?? 1);
  }
  if (overlay.type === 'line') {
    return nearPolyline(q, r, overlay.points || [], overlay.thickness ?? 0);
  }
  return false;
}

function pointToQR(point) {
  if (Array.isArray(point)) return { q: point[0], r: point[1] };
  return point;
}

function nearPolyline(q, r, points, thickness) {
  if (!Array.isArray(points) || points.length < 2) return false;
  for (let i = 1; i < points.length; i++) {
    const a = pointToQR(points[i - 1]);
    const b = pointToQR(points[i]);
    if (!a || !b) continue;
    const steps = max(1, hexDist(a.q, a.r, b.q, b.r));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const sampleQ = Math.round(a.q + (b.q - a.q) * t);
      const sampleR = Math.round(a.r + (b.r - a.r) * t);
      if (hexDist(q, r, sampleQ, sampleR) <= thickness) return true;
    }
  }
  return false;
}

function applyTerrainOverlays(overlays, q, r, context) {
  let terrain = context.terrain;
  let district = context.district;
  let elevationBias = context.elevationBias || 0;

  for (const overlay of overlays) {
    if (!overlay.allowRiver && context.isRiver) continue;
    if (overlay.requireWestBank && context.isEast) continue;
    if (overlay.requireEastBank && !context.isEast) continue;
    if (!overlayMatches(overlay, q, r)) continue;

    if (overlay.terrain && TERRAIN[overlay.terrain]) terrain = TERRAIN[overlay.terrain];
    if (overlay.district) district = overlay.district;
    if (typeof overlay.elevationBias === 'number') elevationBias += overlay.elevationBias;
  }

  return { terrain, district, elevationBias };
}

function calcElevation(q, r, terrain, elevationBias) {
  const elevNoise = floor(
    2.2
    + 1.9 * sin((q + r * 0.58) * 0.39)
    + 1.3 * cos((q * 0.71 - r * 0.92) * 0.27)
    + 0.7 * sin((q - r) * 0.18)
  );

  const terrainDelta =
    (terrain === TERRAIN.HILL ? 3 : 0)
    + (terrain === TERRAIN.RIDGE ? 2 : 0)
    + (terrain === TERRAIN.BUNKER ? 2 : 0)
    - (terrain === TERRAIN.RIVER ? 3 : 0)
    - (terrain === TERRAIN.MARSH ? 2 : 0)
    - (terrain === TERRAIN.TRENCH ? 1 : 0);

  return constrain(elevNoise + terrainDelta + elevationBias, 0, 9);
}

function initMap() {
  mapData.clear();
  const cfg = currentMapConfig || FALLBACK_MAP_CONFIG;
  const cityCore = cfg.cityCore || FALLBACK_MAP_CONFIG.cityCore;
  const cityCenterQ = floor(mapCols * (cityCore.qRatio ?? 0.43));
  const cityCenterR = floor(mapRows * (cityCore.rRatio ?? 0.5));
  const bridgeRows = cfg.bridgeRows || [];
  const railRows = cfg.railRows || [];
  const roadColumns = cfg.roadColumns || [];
  const northRidge = cfg.northRidgeBand || FALLBACK_MAP_CONFIG.northRidgeBand;
  const southRidge = cfg.southRidgeBand || FALLBACK_MAP_CONFIG.southRidgeBand;
  const mamayev = cfg.mamayev || FALLBACK_MAP_CONFIG.mamayev;
  const overlays = [...(cfg.overlays || [])].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  for (let r = 0; r < mapRows; r++) {
    const riverCenter = calculateRiverCenter(cfg, r);
    for (let q = 0; q < mapCols; q++) {
      const riverWidth = cfg.river?.width ?? 2;
      const isRiver = q >= riverCenter && q < riverCenter + riverWidth;
      const eastBankStart = riverCenter + riverWidth;
      const isEast = q >= eastBankStart;
      const nearRiver = q >= riverCenter - 1 && q <= eastBankStart + 1;
      const northBandMatch = r <= (northRidge.rMax ?? 6)
        && q >= cityCenterQ + (northRidge.qMinOffset ?? -7)
        && q <= cityCenterQ + (northRidge.qMaxOffset ?? 8);
      const southBandMatch = r >= mapRows - (southRidge.rMinFromBottom ?? 6)
        && q >= cityCenterQ + (southRidge.qMinOffset ?? -6)
        && q <= cityCenterQ + (southRidge.qMaxOffset ?? 7);

      let terrain = TERRAIN.STEPPE;
      let district = '外围草原';
      let elevationBias = 0;
      const urbanDist = hexDist(q, r, cityCenterQ, cityCenterR);

      if (isRiver) {
        terrain = TERRAIN.RIVER;
        district = '伏尔加主河道';
      } else if (isEast) {
        terrain = TERRAIN.EAST;
        district = '东岸滩头';
        const portInterval = cfg.eastPortInterval ?? 6;
        const portOffset = cfg.eastPortOffset ?? 0;
        if (abs(q - eastBankStart) <= 1 && (r + portOffset) % portInterval === 0) {
          terrain = TERRAIN.PORT;
          district = '东岸渡口';
        }
      } else if (urbanDist <= (cityCore.coreRadius ?? 4)) {
        terrain = (q + r) % 2 === 0 ? TERRAIN.INDUSTRY : TERRAIN.RUINS;
        district = '核心工业区';
      } else if (urbanDist <= (cityCore.innerRadius ?? 8)) {
        terrain = (q * 3 + r * 5) % 4 === 0 ? TERRAIN.RUINS : TERRAIN.CITY;
        district = '中心城区';
      } else if (urbanDist <= (cityCore.suburbRadius ?? 12)) {
        terrain = TERRAIN.SUBURB;
        district = '外围城区';
      } else if (nearRiver) {
        terrain = TERRAIN.SUBURB;
        district = '西岸堤区';
      }

      if (!isRiver && !isEast && (northBandMatch || southBandMatch) && urbanDist >= (cityCore.innerRadius ?? 8) - 1) {
        terrain = TERRAIN.RIDGE;
        district = northBandMatch ? '北部棱线' : '南部棱线';
      }

      if (!isRiver && !isEast && urbanDist >= (cityCore.suburbRadius ?? 12) - 1 && abs(q - (cityCenterQ - 11 + floor(r / 3))) <= 1 && r % 4 !== 0) {
        terrain = TERRAIN.ROAD;
        district = '西侧公路网';
      }

      if (!isRiver && !isEast && railRows.includes(r) && q >= 2 && q <= riverCenter - 2) {
        terrain = TERRAIN.RAIL;
        district = '横向铁路走廊';
      }

      if (!isRiver && !isEast && roadColumns.some(c => abs(c - q) <= 1) && r >= 4 && r <= mapRows - 4) {
        terrain = TERRAIN.ROAD;
        if (district === '外围草原') district = '南北公路线';
      }

      if (!isRiver && !isEast && hexDist(q, r, mamayev.q, mamayev.r) <= (mamayev.radius ?? 2)) {
        terrain = TERRAIN.HILL;
        district = '马马耶夫制高点';
      }

      const overlayResult = applyTerrainOverlays(overlays, q, r, {
        terrain,
        district,
        elevationBias,
        isRiver,
        isEast
      });
      terrain = overlayResult.terrain;
      district = overlayResult.district;
      elevationBias = overlayResult.elevationBias;

      if (bridgeRows.includes(r) && q >= riverCenter && q < riverCenter + riverWidth) {
        terrain = TERRAIN.BRIDGE;
        district = '桥梁要冲';
      }

      const elevation = calcElevation(q, r, terrain, elevationBias);
      mapData.set(tileKey(q, r), { q, r, terrain, district, elevation, riverCenter });
    }
  }
}

function addUnit(u) {
  units.push({
    ...u,
    id: `${u.side}_${Math.random().toString(36).slice(2, 9)}`,
    mpLeft: u.mp,
    acted: false,
    supplied: true,
    entrenched: 0,
    ammo: 2,
    alive: true
  });
}

function draw() {
  clear();
  background(20, 17, 12);

  push();
  translate(camera.x, camera.y);
  scale(camera.zoom);
  drawHexes();
  drawTerrainDetails();
  drawObjectiveOverlay();
  drawMapFrame();
  drawUnits();
  drawSelectionOverlay();
  pop();

  if (uiDirty || frameCount % 20 === 0) updatePanels();

  if (!gameOver && state.active === state.aiSide && !isStartOverlayVisible()) {
    runAI();
  }
}

function drawHexes() {
  for (let r = 0; r < mapRows; r++) {
    for (let q = 0; q < mapCols; q++) {
      const c = mapData.get(tileKey(q, r));
      if (!c) continue;
      const p = hexToPixel(q, r);
      const [tr, tg, tb] = c.terrain.color;
      const shade = c.elevation * 4;
      stroke(74, 62, 41, 172);
      strokeWeight(max(0.72, hexSize * 0.07));
      fill(
        constrain(tr + shade, 0, 255),
        constrain(tg + shade * 0.8, 0, 255),
        constrain(tb + shade * 0.6, 0, 255)
      );
      hexShape(p.x, p.y);
      if (c.terrain === TERRAIN.RIVER) {
        stroke(142, 177, 213, 120);
        strokeWeight(max(0.6, hexSize * 0.06));
        line(p.x - hexSize * 0.34, p.y + hexSize * 0.11, p.x + hexSize * 0.33, p.y - hexSize * 0.1);
      }
      if (hexSize >= 13 && q % 11 === 0 && r % 9 === 0) {
        noStroke();
        fill(248, 229, 180, 70);
        textSize(8);
        textAlign(CENTER, CENTER);
        text(`${q}:${r}`, p.x, p.y + 1);
      }
    }
  }
  textAlign(LEFT, BASELINE);
}

function drawTerrainDetails() {
  const detailGate = camera.zoom * hexSize;
  if (detailGate < 3.8) return;

  mapData.forEach(c => {
    const p = hexToPixel(c.q, c.r);
    if (c.terrain === TERRAIN.ROAD) {
      stroke(176, 152, 104, 180);
      strokeWeight(max(0.6, hexSize * 0.11));
      line(p.x - hexSize * 0.42, p.y + hexSize * 0.1, p.x + hexSize * 0.42, p.y - hexSize * 0.1);
    }
    if (c.terrain === TERRAIN.RAIL) {
      stroke(70, 65, 57, 220);
      strokeWeight(max(0.5, hexSize * 0.08));
      line(p.x - hexSize * 0.45, p.y - hexSize * 0.12, p.x + hexSize * 0.45, p.y - hexSize * 0.12);
      line(p.x - hexSize * 0.45, p.y + hexSize * 0.12, p.x + hexSize * 0.45, p.y + hexSize * 0.12);
      stroke(105, 92, 66, 180);
      strokeWeight(max(0.4, hexSize * 0.04));
      for (let i = -2; i <= 2; i++) {
        const x = p.x + i * hexSize * 0.16;
        line(x, p.y - hexSize * 0.18, x, p.y + hexSize * 0.18);
      }
    }
    if (c.terrain === TERRAIN.BRIDGE) {
      stroke(198, 161, 104, 210);
      strokeWeight(max(0.9, hexSize * 0.13));
      line(p.x - hexSize * 0.42, p.y, p.x + hexSize * 0.42, p.y);
      stroke(120, 93, 55, 180);
      strokeWeight(max(0.5, hexSize * 0.05));
      line(p.x - hexSize * 0.26, p.y - hexSize * 0.18, p.x - hexSize * 0.26, p.y + hexSize * 0.18);
      line(p.x + hexSize * 0.26, p.y - hexSize * 0.18, p.x + hexSize * 0.26, p.y + hexSize * 0.18);
    }
    if (c.terrain === TERRAIN.PORT) {
      noFill();
      stroke(155, 183, 207, 180);
      strokeWeight(max(0.6, hexSize * 0.07));
      arc(p.x, p.y, hexSize * 0.62, hexSize * 0.62, -PI * 0.08, PI + PI * 0.08);
      line(p.x, p.y - hexSize * 0.31, p.x, p.y + hexSize * 0.04);
    }
    if (c.terrain === TERRAIN.WOODS) {
      stroke(70, 93, 66, 180);
      strokeWeight(max(0.4, hexSize * 0.05));
      line(p.x - hexSize * 0.2, p.y + hexSize * 0.2, p.x - hexSize * 0.1, p.y - hexSize * 0.12);
      line(p.x, p.y + hexSize * 0.22, p.x + hexSize * 0.02, p.y - hexSize * 0.15);
      line(p.x + hexSize * 0.2, p.y + hexSize * 0.18, p.x + hexSize * 0.1, p.y - hexSize * 0.1);
    }
    if (c.terrain === TERRAIN.MARSH) {
      noFill();
      stroke(112, 132, 123, 155);
      strokeWeight(max(0.4, hexSize * 0.05));
      arc(p.x - hexSize * 0.12, p.y + hexSize * 0.1, hexSize * 0.32, hexSize * 0.22, PI * 0.1, PI * 0.95);
      arc(p.x + hexSize * 0.13, p.y - hexSize * 0.02, hexSize * 0.32, hexSize * 0.2, PI * 0.2, PI * 1.05);
    }
    if (c.terrain === TERRAIN.TRENCH) {
      stroke(88, 74, 55, 190);
      strokeWeight(max(0.45, hexSize * 0.06));
      line(p.x - hexSize * 0.32, p.y + hexSize * 0.1, p.x - hexSize * 0.14, p.y - hexSize * 0.05);
      line(p.x - hexSize * 0.14, p.y - hexSize * 0.05, p.x + hexSize * 0.08, p.y + hexSize * 0.12);
      line(p.x + hexSize * 0.08, p.y + hexSize * 0.12, p.x + hexSize * 0.3, p.y - hexSize * 0.05);
    }
    if (c.terrain === TERRAIN.BUNKER) {
      noFill();
      stroke(186, 163, 127, 210);
      strokeWeight(max(0.4, hexSize * 0.06));
      rectMode(CENTER);
      rect(p.x, p.y, hexSize * 0.36, hexSize * 0.24, 1);
      line(p.x - hexSize * 0.18, p.y, p.x + hexSize * 0.18, p.y);
      line(p.x, p.y - hexSize * 0.11, p.x, p.y + hexSize * 0.11);
      rectMode(CORNER);
    }
    if (detailGate > 6.4 && c.terrain === TERRAIN.INDUSTRY) {
      stroke(152, 129, 98, 145);
      strokeWeight(max(0.35, hexSize * 0.04));
      line(p.x - hexSize * 0.16, p.y + hexSize * 0.14, p.x - hexSize * 0.16, p.y - hexSize * 0.14);
      line(p.x + hexSize * 0.04, p.y + hexSize * 0.14, p.x + hexSize * 0.04, p.y - hexSize * 0.14);
      line(p.x + hexSize * 0.16, p.y + hexSize * 0.14, p.x + hexSize * 0.16, p.y - hexSize * 0.14);
    }
  });
  noStroke();
}

function drawMapFrame() {
  const b = mapBounds();
  noFill();
  stroke(163, 132, 83, 185);
  strokeWeight(1.8);
  rect(b.minX, b.minY, b.width, b.height, 2);

  noStroke();
  fill(220, 198, 151, 215);
  textAlign(LEFT, TOP);
  textSize(max(10, hexSize * 0.34));
  text(`${mapLabel} · ${mapCols}x${mapRows} · ${mapTier}`, b.minX + 8, b.minY + 7);

  if (hexSize >= 12) {
    const stepQ = currentMapConfig?.gridLabelStepQ || 6;
    const stepR = currentMapConfig?.gridLabelStepR || 4;
    textSize(max(8, hexSize * 0.25));
    fill(198, 177, 132, 180);
    for (let q = 0; q < mapCols; q += stepQ) {
      const t = hexToPixel(q, 0);
      const bt = hexToPixel(q, mapRows - 1);
      textAlign(CENTER, BOTTOM);
      text(q, t.x, b.minY - 4);
      textAlign(CENTER, TOP);
      text(q, bt.x, b.maxY + 4);
    }
    for (let r = 0; r < mapRows; r += stepR) {
      const l = hexToPixel(0, r);
      const rt = hexToPixel(mapCols - 1, r);
      textAlign(RIGHT, CENTER);
      text(r, b.minX - 4, l.y);
      textAlign(LEFT, CENTER);
      text(r, b.maxX + 4, rt.y);
    }
  }
  textAlign(LEFT, BASELINE);
}

function drawObjectiveOverlay() {
  objectives.forEach(o => {
    const p = hexToPixel(o.q, o.r);
    const ownerColor = o.owner === 'GER' ? color(218, 190, 110) : o.owner === 'SOV' ? color(207, 123, 108) : color(190, 182, 164);
    const ring = hexSize * 1.08;
    noFill();
    stroke(ownerColor);
    strokeWeight(max(1.2, hexSize * 0.1));
    circle(p.x, p.y, ring);
    stroke(241, 228, 189, 120);
    strokeWeight(max(0.4, hexSize * 0.04));
    line(p.x - ring * 0.22, p.y, p.x + ring * 0.22, p.y);
    line(p.x, p.y - ring * 0.22, p.x, p.y + ring * 0.22);

    noStroke();
    fill(245, 233, 200);
    textSize(max(8, hexSize * 0.3));
    textAlign(CENTER, CENTER);
    text(`${o.vp}`, p.x, p.y);
    if (hexSize >= 11) {
      fill(227, 209, 167, 180);
      textSize(max(7, hexSize * 0.22));
      text(o.name.slice(0, 4), p.x, p.y + hexSize * 0.52);
    }
  });
  textAlign(LEFT, BASELINE);
}

function drawUnits() {
  units.filter(u => u.alive).forEach(u => {
    const p = hexToPixel(u.q, u.r);
    const base = u.side === 'GER' ? color(218, 188, 115) : color(194, 113, 103);
    const activeBoost = u.side === state.active ? 1 : 0.82;
    fill(red(base) * activeBoost, green(base) * activeBoost, blue(base) * activeBoost, 240);
    stroke(33, 27, 19, 175);
    strokeWeight(max(0.7, hexSize * 0.08));
    rectMode(CENTER);
    rect(p.x, p.y, hexSize * 1.58, hexSize * 0.92, 2);

    fill(35, 29, 22, 140);
    noStroke();
    rect(p.x, p.y - hexSize * 0.2, hexSize * 1.58, hexSize * 0.2, 1);

    if (selected && selected.id === u.id) {
      noFill();
      stroke(244, 229, 179, 230);
      strokeWeight(max(1, hexSize * 0.11));
      rect(p.x, p.y, hexSize * 1.82, hexSize * 1.12, 2);
    }

    noStroke();
    fill(21, 18, 13);
    textSize(max(7, hexSize * 0.28));
    textAlign(CENTER, CENTER);
    text(hexSize >= 13 ? `${u.hp}HP/${u.mpLeft}MP` : `${u.hp}/${u.mpLeft}`, p.x, p.y + 1);
    if (u.entrenched) {
      fill(216, 225, 205);
      text(`E${u.entrenched}`, p.x + hexSize * 0.44, p.y - hexSize * 0.34);
    }
    if (!u.supplied) {
      fill(171, 95, 87);
      triangle(
        p.x - hexSize * 0.54, p.y + hexSize * 0.34,
        p.x - hexSize * 0.42, p.y + hexSize * 0.12,
        p.x - hexSize * 0.3, p.y + hexSize * 0.34
      );
    }
  });
  rectMode(CORNER);
  textAlign(LEFT, BASELINE);
}

function drawSelectionOverlay() {
  if (!selected || gameOver) return;
  if (mode === 'MOVE' && selected.side === state.active) {
    getReachableCached(selected).forEach(t => {
      const p = hexToPixel(t.q, t.r);
      noFill();
      stroke(227, 206, 152, 145);
      strokeWeight(max(0.9, hexSize * 0.09));
      hexShape(p.x, p.y);
      noStroke();
      fill(244, 227, 180, 140);
      textSize(max(7, hexSize * 0.24));
      textAlign(CENTER, CENTER);
      text(t.mp, p.x, p.y);
    });
  }
  if (mode === 'ATTACK' && selected.side === state.active) {
    enemiesAdjacent(selected).forEach(e => {
      const p = hexToPixel(e.q, e.r);
      noFill();
      stroke(216, 109, 100, 175);
      strokeWeight(max(1, hexSize * 0.1));
      hexShape(p.x, p.y);
    });
  }
  textAlign(LEFT, BASELINE);
}

function mousePressed(event) {
  if (millis() < suppressMouseUntil) return false;
  if (event && isPointerOverUI(event.clientX, event.clientY)) return true;
  handleMapTap(mouseX, mouseY);
  return false;
}

function mouseWheel(event) {
  if (isPointerOverUI(mouseX, mouseY)) return true;
  const delta = event.deltaY || event.delta || 0;
  const factor = delta < 0 ? 1.08 : 0.92;
  const nextZoom = constrain(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  zoomTo(nextZoom, mouseX, mouseY);
  return false;
}

function touchStarted() {
  suppressMouseUntil = millis() + 450;
  if (!touches.length) return false;
  if (isPointerOverUI(touches[0].x, touches[0].y)) return true;
  if (touches.length >= 2) {
    startPinch(touches[0], touches[1]);
  } else {
    startPan(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
  suppressMouseUntil = millis() + 450;
  if (touches.length && isPointerOverUI(touches[0].x, touches[0].y)) return true;
  if (touches.length >= 2) {
    const a = touches[0];
    const b = touches[1];
    if (!gesture.isPinch) startPinch(a, b);
    const mid = midpoint(a, b);
    const pinchDist = max(10, dist2D(a.x, a.y, b.x, b.y));
    const nextZoom = constrain(gesture.pinchStartZoom * (pinchDist / gesture.pinchStartDist), MIN_ZOOM, MAX_ZOOM);
    zoomTo(nextZoom, mid.x, mid.y);
    gesture.moved = true;
    gesture.lastX = mid.x;
    gesture.lastY = mid.y;
    return false;
  }

  if (touches.length === 1) {
    const t = touches[0];
    if (!gesture.isPanning) startPan(t.x, t.y);
    const dx = t.x - gesture.lastX;
    const dy = t.y - gesture.lastY;
    if (abs(dx) > 0 || abs(dy) > 0) {
      gesture.moved = gesture.moved || dist2D(t.x, t.y, gesture.startX, gesture.startY) > TAP_DRAG_THRESHOLD;
      camera.x += dx;
      camera.y += dy;
      clampCamera();
      gesture.lastX = t.x;
      gesture.lastY = t.y;
    }
  }
  return false;
}

function touchEnded() {
  suppressMouseUntil = millis() + 450;
  if (touches.length && isPointerOverUI(touches[0].x, touches[0].y)) return true;
  if (touches.length >= 2) {
    startPinch(touches[0], touches[1]);
    return false;
  }
  if (touches.length === 1 && gesture.isPinch) {
    startPan(touches[0].x, touches[0].y);
    return false;
  }
  if (touches.length === 0) {
    const shouldTap = !gesture.moved && !gesture.isPinch;
    const tapX = gesture.lastX;
    const tapY = gesture.lastY;
    gesture.isPanning = false;
    gesture.isPinch = false;
    gesture.moved = false;
    if (shouldTap) handleMapTap(tapX, tapY);
  }
  return false;
}

function startPan(x, y) {
  gesture.isPanning = true;
  gesture.isPinch = false;
  gesture.moved = false;
  gesture.startX = x;
  gesture.startY = y;
  gesture.lastX = x;
  gesture.lastY = y;
}

function startPinch(a, b) {
  const mid = midpoint(a, b);
  gesture.isPinch = true;
  gesture.isPanning = false;
  gesture.moved = false;
  gesture.lastX = mid.x;
  gesture.lastY = mid.y;
  gesture.pinchStartDist = max(10, dist2D(a.x, a.y, b.x, b.y));
  gesture.pinchStartZoom = camera.zoom;
}

function midpoint(a, b) {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function dist2D(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function zoomTo(nextZoom, sx, sy) {
  const wx = (sx - camera.x) / camera.zoom;
  const wy = (sy - camera.y) / camera.zoom;
  camera.zoom = nextZoom;
  camera.x = sx - wx * camera.zoom;
  camera.y = sy - wy * camera.zoom;
  clampCamera();
}

function mapBounds() {
  const sqrt3 = Math.sqrt(3);
  const minX = originX - hexSize * 1.2;
  const maxX = originX + hexSize * (sqrt3 * (mapCols - 1) + (sqrt3 / 2) * (mapRows - 1)) + hexSize * 1.2;
  const minY = originY - hexSize * 1.2;
  const maxY = originY + hexSize * (1.5 * (mapRows - 1)) + hexSize * 1.2;
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

function playableHeight() {
  const bar = document.getElementById('bottomBar');
  if (!bar) return H;
  const rect = bar.getBoundingClientRect();
  if (!rect || rect.top <= 40 || rect.top > H) return H;
  return max(220, rect.top - 6);
}

function fitCameraToBattlefield() {
  const b = mapBounds();
  const viewW = W;
  const viewH = playableHeight();
  const fit = min((viewW - CAMERA_MARGIN * 2) / b.width, (viewH - CAMERA_MARGIN * 2) / b.height);
  camera.zoom = constrain(fit, MIN_ZOOM, MAX_ZOOM);
  camera.x = (viewW - b.width * camera.zoom) * 0.5 - b.minX * camera.zoom;
  camera.y = (viewH - b.height * camera.zoom) * 0.5 - b.minY * camera.zoom;
  clampCamera();
}

function clampCamera() {
  const b = mapBounds();
  const viewW = W;
  const viewH = playableHeight();
  const mapW = b.width * camera.zoom;
  const mapH = b.height * camera.zoom;

  if (mapW <= viewW - CAMERA_MARGIN * 2) {
    camera.x = (viewW - mapW) * 0.5 - b.minX * camera.zoom;
  } else {
    const minX = viewW - CAMERA_MARGIN - b.maxX * camera.zoom;
    const maxX = CAMERA_MARGIN - b.minX * camera.zoom;
    camera.x = constrain(camera.x, minX, maxX);
  }

  if (mapH <= viewH - CAMERA_MARGIN * 2) {
    camera.y = (viewH - mapH) * 0.5 - b.minY * camera.zoom;
  } else {
    const minY = viewH - CAMERA_MARGIN - b.maxY * camera.zoom;
    const maxY = CAMERA_MARGIN - b.minY * camera.zoom;
    camera.y = constrain(camera.y, minY, maxY);
  }
}

function centerOnUnit(u) {
  const p = hexToPixel(u.q, u.r);
  const targetY = playableHeight() * (isPortraitPhone() ? 0.4 : 0.45);
  camera.x = W * 0.5 - p.x * camera.zoom;
  camera.y = targetY - p.y * camera.zoom;
  clampCamera();
}

function isPointerOverUI(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return false;
  return !!el.closest('#ui') || !!el.closest('#mobileToggles') || !!el.closest('#startOverlay') || !!el.closest('#topDock');
}

function isStartOverlayVisible() {
  const overlay = document.getElementById('startOverlay');
  return overlay && overlay.style.display !== 'none';
}

function handleMapTap(px, py) {
  if (gameOver) return;
  if (py > playableHeight()) return;
  const h = pixelToHex(px, py);
  if (!inMap(h.q, h.r)) return;
  const targetUnit = unitAt(h.q, h.r);

  if (targetUnit) {
    if (targetUnit.side === state.active) {
      selected = targetUnit;
      invalidateReachableCache();
      if (isMobileLayout()) {
        panelState.right = true;
        panelState.left = false;
        updateMobilePanelClass();
      }
      markUIDirty();
      return;
    }
    if (selected && mode === 'ATTACK') {
      doAttack(selected, targetUnit);
      return;
    }
    if (selected && mode === 'BOMBARD') {
      doBombard(targetUnit);
    }
    return;
  }

  if (selected && mode === 'MOVE') doMove(selected, h.q, h.r);
}

function doMove(u, q, r) {
  if (u.side !== state.active || u.acted) return log('该单位本回合已行动。');
  const tile = getReachableCached(u).find(t => t.q === q && t.r === r);
  if (!tile) return log('无法到达该格。');
  u.q = q;
  u.r = r;
  u.mpLeft = tile.mp;
  if (enemyZOC(q, r, opposite(u.side))) u.mpLeft = max(0, u.mpLeft - 1);
  invalidateReachableCache();
  log(`${u.name} 机动至 (${q},${r})。`);
  updateObjectives();
  markUIDirty();
}

function doAttack(a, d) {
  if (a.side !== state.active || a.acted) return log('该单位无法继续攻击。');
  if (hexDist(a.q, a.r, d.q, d.r) !== 1) return log('必须邻接攻击。');
  const cell = mapData.get(tileKey(d.q, d.r));
  const defBonus = cell.terrain.def + d.entrenched;
  let atk = a.atk + floor(a.morale / 3) + (a.ammo > 0 ? 1 : 0);
  let def = d.def + defBonus + floor(d.morale / 3);
  if (!a.supplied) atk -= 2;
  const roll = floor(random(1, 7));
  const damage = max(0, floor((atk + roll - def) / 2));
  const counter = max(0, floor((def + 3 - atk) / 4));
  d.hp -= damage;
  a.hp -= counter;
  a.ammo = max(0, a.ammo - 1);
  a.acted = true;

  if (damage > 0) d.morale = max(3, d.morale - 1);
  if (counter > 0) a.morale = max(3, a.morale - 1);
  invalidateReachableCache();
  cleanupDead();
  log(`${a.name} 攻击 ${d.name}：造成 ${damage}，反损 ${counter}（d6=${roll}）`);
  updateObjectives();
  checkGameEnd();
  markUIDirty();
}

function doBombard(target) {
  const s = state.support[state.active];
  if (s.arty <= 0 && s.air <= 0) return log('无炮火/空袭支援。');
  const useAir = s.air > 0 && state.active === 'GER';
  if (useAir) s.air--; else s.arty--;
  const cover = mapData.get(tileKey(target.q, target.r)).terrain.def;
  const roll = floor(random(1, 7));
  const hit = roll + (useAir ? 1 : 0) - cover >= 4;
  if (hit) {
    target.hp -= 1;
    target.morale = max(3, target.morale - 1);
    log(`${useAir ? '空袭' : '炮击'}命中 ${target.name}。`);
  } else {
    log(`${useAir ? '空袭' : '炮击'}偏离目标。`);
  }
  invalidateReachableCache();
  cleanupDead();
  checkGameEnd();
  markUIDirty();
}

function doFortify() {
  if (!selected || selected.side !== state.active) return log('请选择己方单位。');
  if (selected.acted) return log('该单位已行动。');
  selected.entrenched = min(2, selected.entrenched + 1);
  selected.acted = true;
  invalidateReachableCache();
  log(`${selected.name} 构筑工事，工事等级 E${selected.entrenched}。`);
  markUIDirty();
}

function doSupply() {
  const s = state.support[state.active];
  if (s.supply <= 0) return log('补给行动次数不足。');
  if (!selected || selected.side !== state.active) return log('请选择己方单位进行补给。');
  s.supply--;
  selected.supplied = true;
  selected.ammo = min(2, selected.ammo + 1);
  selected.morale = min(9, selected.morale + 1);
  log(`${selected.name} 完成补给，弹药与士气恢复。`);
  markUIDirty();
}

function endTurn() {
  if (gameOver) return;
  updateObjectives();
  if (state.active === 'SOV') state.turn++;
  state.active = opposite(state.active);
  refreshSide();
  selected = null;
  invalidateReachableCache();
  checkGameEnd();
  markUIDirty();
}

function refreshSide() {
  const t = state.turn;
  units.forEach(u => {
    if (!u.alive || u.side !== state.active) return;
    u.mpLeft = u.mp - (state.active === 'GER' && t % 2 === 0 ? 1 : 0);
    u.acted = false;
    u.supplied = supplyConnected(u);
    if (!u.supplied) u.morale = max(3, u.morale - 1);
  });

  const base = supportBase[state.active] || { arty: 1, air: 0, supply: 1 };
  let arty = base.arty;
  let air = base.air;
  if (state.active === 'SOV' && t >= 4) arty += 1;
  if (state.active === 'GER' && t % 2 === 0) air = max(0, air - 1);
  state.support[state.active] = {
    arty,
    air,
    supply: base.supply
  };

  invalidateReachableCache();
  log(`--- ${state.active} 第 ${state.turn} 回合 ---`);
}

function runAI() {
  if (frameCount % 22 !== 0) return;
  const aiUnits = units.filter(u => u.alive && u.side === state.aiSide);
  for (const u of aiUnits) {
    if (u.acted) continue;
    const adj = enemiesAdjacent(u);
    if (adj.length) {
      doAttack(u, weakest(adj));
      return;
    }
    const obj = nearestUnfriendlyObjective(u.side, u.q, u.r);
    if (obj) {
      const options = reachable(u).filter(t => !unitAt(t.q, t.r));
      options.sort((a, b) => hexDist(a.q, a.r, obj.q, obj.r) - hexDist(b.q, b.r, obj.q, obj.r));
      if (options[0]) {
        doMove(u, options[0].q, options[0].r);
        if (state.difficulty === 'hard') u.entrenched = min(1, u.entrenched + 1);
        return;
      }
    }
    u.acted = true;
  }
  endTurn();
}

function updateObjectives() {
  objectives.forEach(o => {
    const g = units.find(u => u.alive && u.side === 'GER' && u.q === o.q && u.r === o.r);
    const s = units.find(u => u.alive && u.side === 'SOV' && u.q === o.q && u.r === o.r);
    if (g && !s) o.owner = 'GER';
    if (s && !g) o.owner = 'SOV';
  });
  state.vp = { GER: 0, SOV: 0 };
  objectives.forEach(o => {
    if (o.owner) state.vp[o.owner] += o.vp;
  });
  markUIDirty();
}

function checkGameEnd() {
  const gerAlive = units.some(u => u.alive && u.side === 'GER');
  const sovAlive = units.some(u => u.alive && u.side === 'SOV');
  if (!gerAlive || !sovAlive || state.turn > state.maxTurn) {
    gameOver = true;
    const scoreGER = state.vp.GER + units.filter(u => u.alive && u.side === 'GER').length;
    const scoreSOV = state.vp.SOV + units.filter(u => u.alive && u.side === 'SOV').length;
    const result = scoreGER === scoreSOV ? '平局' : scoreGER > scoreSOV ? '德军胜' : '苏军胜';
    log(`战役结束：${result}（GER ${scoreGER} : SOV ${scoreSOV}）`);
  }
  markUIDirty();
}

function cleanupDead() {
  units.forEach(u => {
    if (u.alive && u.hp <= 0) {
      u.alive = false;
      if (selected && selected.id === u.id) selected = null;
      log(`${u.name} 被击溃。`);
    }
  });
  markUIDirty();
}

function setMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === nextMode));
  markUIDirty();
}

function bindUI() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('pickScenario').addEventListener('change', () => {
    const pick = document.getElementById('pickScenario');
    const quick = document.getElementById('scenarioQuick');
    if (quick) quick.value = pick.value;
    updateScenarioBriefing();
  });
  document.getElementById('scenarioQuick').addEventListener('change', () => {
    const pick = document.getElementById('pickScenario');
    const quick = document.getElementById('scenarioQuick');
    if (pick) pick.value = quick.value;
    updateScenarioBriefing();
  });
  document.getElementById('btnScenarioApply').addEventListener('click', applyScenarioFromQuick);
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
      if (mode === 'FORTIFY') doFortify();
    });
  });
  document.getElementById('btnSupply').addEventListener('click', doSupply);
  document.getElementById('btnCenter').addEventListener('click', () => {
    const pick = selected && selected.alive && selected.side === state.active
      ? selected
      : units.find(u => u.alive && u.side === state.active);
    if (pick) {
      selected = pick;
      centerOnUnit(pick);
      if (isMobileLayout()) {
        panelState.right = true;
        panelState.left = false;
        updateMobilePanelClass();
      }
      markUIDirty();
    }
  });
  document.getElementById('btnEnd').addEventListener('click', endTurn);
  document.getElementById('btnRestart').addEventListener('click', () => {
    document.getElementById('startOverlay').style.display = 'flex';
    closeMobilePanels();
    markUIDirty();
  });

  document.getElementById('btnCompact').addEventListener('click', () => {
    uiFlags.compact = !uiFlags.compact;
    applyUiFlags();
    recalcScale();
    fitCameraToBattlefield();
    markUIDirty();
  });

  document.getElementById('btnFocusMap').addEventListener('click', () => {
    uiFlags.mapFocus = !uiFlags.mapFocus;
    applyUiFlags();
    recalcScale();
    fitCameraToBattlefield();
    markUIDirty();
  });

  document.getElementById('btnToggleWar').addEventListener('click', () => {
    panelState.desktopLeft = !panelState.desktopLeft;
    if (!panelState.desktopLeft && !panelState.desktopRight) uiFlags.mapFocus = true;
    else uiFlags.mapFocus = false;
    applyUiFlags();
    recalcScale();
    fitCameraToBattlefield();
    markUIDirty();
  });

  document.getElementById('btnToggleUnits').addEventListener('click', () => {
    panelState.desktopRight = !panelState.desktopRight;
    if (!panelState.desktopLeft && !panelState.desktopRight) uiFlags.mapFocus = true;
    else uiFlags.mapFocus = false;
    applyUiFlags();
    recalcScale();
    fitCameraToBattlefield();
    markUIDirty();
  });

  document.getElementById('btnPanelLeft').addEventListener('click', () => togglePanel('left'));
  document.getElementById('btnPanelRight').addEventListener('click', () => togglePanel('right'));
  document.getElementById('btnFit').addEventListener('click', () => {
    fitCameraToBattlefield();
    markUIDirty();
  });

  window.addEventListener('resize', updateMobilePanelClass);
}

function applyUiFlags() {
  document.body.classList.toggle('compact-ui', uiFlags.compact);
  document.body.classList.toggle('map-focus', uiFlags.mapFocus);
  document.body.classList.toggle('hide-left-panel', !panelState.desktopLeft);
  document.body.classList.toggle('hide-right-panel', !panelState.desktopRight);
  document.getElementById('btnCompact').classList.toggle('active', uiFlags.compact);
  document.getElementById('btnFocusMap').classList.toggle('active', uiFlags.mapFocus);
  document.getElementById('btnToggleWar').classList.toggle('active', panelState.desktopLeft);
  document.getElementById('btnToggleUnits').classList.toggle('active', panelState.desktopRight);
}

function isMobileLayout() {
  return window.matchMedia('(max-width: 1100px)').matches;
}

function isPortraitPhone() {
  return window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches;
}

function togglePanel(which) {
  if (!isMobileLayout()) return;
  if (which === 'left') {
    panelState.left = !panelState.left;
    if (panelState.left) panelState.right = false;
  } else {
    panelState.right = !panelState.right;
    if (panelState.right) panelState.left = false;
  }
  updateMobilePanelClass();
}

function closeMobilePanels() {
  panelState.left = false;
  panelState.right = false;
  updateMobilePanelClass();
}

function updateMobilePanelClass() {
  if (!isMobileLayout()) {
    document.body.classList.remove('mobile-show-left');
    document.body.classList.remove('mobile-show-right');
    return;
  }
  document.body.classList.toggle('mobile-show-left', panelState.left);
  document.body.classList.toggle('mobile-show-right', panelState.right);
}

function updatePanels() {
  const left = document.getElementById('leftPanel');
  const right = document.getElementById('rightPanel');
  syncTopDockLabels();
  const activeTitleClass = `titleSide-${state.active}`;
  const mobileHint = isPortraitPhone()
    ? '竖屏操作：上方切换面板，底部双列命令，单指拖图/双指缩放。'
    : isMobileLayout()
      ? '移动端操作：单指拖拽、双指缩放、点击单位后在底栏执行命令。'
      : '桌面操作：滚轮缩放地图；可用顶部按钮隐藏侧栏以免遮挡棋子。';
  const aliveGER = units.filter(u => u.alive && u.side === 'GER').length;
  const aliveSOV = units.filter(u => u.alive && u.side === 'SOV').length;
  const activeSupport = state.support[state.active];

  left.innerHTML = `
    <h2 class="${activeTitleClass}">第 ${state.turn} 回合 · ${state.active === 'GER' ? '德军行动' : '苏军行动'}</h2>
    <div class="stat"><span>战役</span><span>${currentScenario ? currentScenario.name : '未载入'}</span></div>
    <div class="stat"><span>模式</span><span class="tag">${MODE_NAMES[mode] || mode}</span></div>
    <div class="stat"><span>胜利点</span><span>GER ${state.vp.GER} : ${state.vp.SOV} SOV</span></div>
    <div class="stat"><span>战区网格</span><span>${mapCols} × ${mapRows}</span></div>
    <div class="stat"><span>地图精度</span><span>${mapTier}</span></div>
    <div class="stat"><span>地图库</span><span>${mapLabel}</span></div>
    <div class="stat"><span>回合上限</span><span>${state.maxTurn}</span></div>
    <div class="stat"><span>当前支援</span><span>空袭 ${activeSupport.air} / 炮击 ${activeSupport.arty}</span></div>
    <div class="stat"><span>补给动作</span><span>${activeSupport.supply}</span></div>
    <div class="stat"><span>玩家阵营</span><span>${state.playerSide}</span></div>
    <div class="stat"><span>存活兵力</span><span>GER ${aliveGER} · SOV ${aliveSOV}</span></div>
    <div class="stat"><span>镜头缩放</span><span>x${camera.zoom.toFixed(2)}</span></div>
    <div class="stat"><span>UI模式</span><span>${uiFlags.compact ? '紧凑' : '标准'} / ${uiFlags.mapFocus ? '地图聚焦' : '综合视图'}</span></div>
    <p class="muted">${mobileHint}</p>
    <h3>目标点控制</h3>
    ${objectives.map(o => `<div class="stat"><span>${o.name} (+${o.vp})</span><span>${o.owner || '中立'}</span></div>`).join('')}
  `;

  if (!selected) {
    right.innerHTML = `
      <h2>单位详情</h2>
      <p class="muted">点击战区单位查看编制、补给与所在地形分区。你也可以在顶部切换战役并快速重开一局。</p>
      <h3>战报</h3>
      <div class="log">${logs.slice(-12).map(l => `<div>${l}</div>`).join('')}</div>
    `;
    uiDirty = false;
    return;
  }

  const t = mapData.get(tileKey(selected.q, selected.r));
  right.innerHTML = `
    <h2>${selected.name}</h2>
    <div class="stat"><span>阵营 / 集团军</span><span>${selected.side} · ${selected.army}</span></div>
    <div class="stat"><span>HP / 士气</span><span>${selected.hp} / ${selected.morale}</span></div>
    <div class="stat"><span>ATK / DEF</span><span>${selected.atk} / ${selected.def}</span></div>
    <div class="stat"><span>MP</span><span>${selected.mpLeft}/${selected.mp}</span></div>
    <div class="stat"><span>补给 / 弹药</span><span>${selected.supplied ? '正常' : '中断'} / ${selected.ammo}</span></div>
    <div class="stat"><span>工事</span><span>E${selected.entrenched}</span></div>
    <div class="stat"><span>地形</span><span>${t.terrain.name} DEF+${t.terrain.def}</span></div>
    <div class="stat"><span>地形分区</span><span>${t.district || '未标定'} · 海拔${t.elevation}</span></div>
    <div class="stat"><span>坐标</span><span>(${selected.q}, ${selected.r})</span></div>
    <h3>战报</h3>
    <div class="log">${logs.slice(-12).map(l => `<div>${l}</div>`).join('')}</div>
  `;
  uiDirty = false;
}

function reachable(u) {
  const best = new Map([[tileKey(u.q, u.r), u.mpLeft]]);
  const queue = [{ q: u.q, r: u.r, mp: u.mpLeft }];
  const out = [];
  while (queue.length) {
    const cur = queue.shift();
    out.push(cur);
    for (const n of neighbors(cur.q, cur.r)) {
      if (!inMap(n.q, n.r)) continue;
      if (unitAt(n.q, n.r) && !(n.q === u.q && n.r === u.r)) continue;
      const t = mapData.get(tileKey(n.q, n.r)).terrain;
      if (t.cost >= 90) continue;
      const cost = t.cost + (enemyZOC(n.q, n.r, opposite(u.side)) ? 1 : 0);
      const left = cur.mp - cost;
      if (left < 0) continue;
      const k = tileKey(n.q, n.r);
      if (!best.has(k) || left > best.get(k)) {
        best.set(k, left);
        queue.push({ q: n.q, r: n.r, mp: left });
      }
    }
  }
  return out;
}

function supplyConnected(u) {
  const sourceQ = u.side === 'GER' ? 1 : mapCols - 2;
  const visited = new Set([tileKey(u.q, u.r)]);
  const queue = [{ q: u.q, r: u.r }];
  while (queue.length) {
    const c = queue.shift();
    if (Math.abs(c.q - sourceQ) <= 1) return true;
    for (const n of neighbors(c.q, c.r)) {
      if (!inMap(n.q, n.r)) continue;
      const t = mapData.get(tileKey(n.q, n.r)).terrain;
      if (t.cost >= 90) continue;
      const enemy = unitAt(n.q, n.r);
      if (enemy && enemy.side !== u.side) continue;
      const k = tileKey(n.q, n.r);
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push(n);
    }
  }
  return false;
}

function enemyZOC(q, r, enemySide) {
  return units.some(u => u.alive && u.side === enemySide && hexDist(u.q, u.r, q, r) === 1);
}

function enemiesAdjacent(u) {
  return neighbors(u.q, u.r)
    .map(n => unitAt(n.q, n.r))
    .filter(v => v && v.side !== u.side && v.alive);
}

function weakest(arr) {
  return [...arr].sort((a, b) => a.hp - b.hp)[0];
}

function nearestUnfriendlyObjective(side, q, r) {
  return [...objectives]
    .filter(o => o.owner !== side)
    .sort((a, b) => hexDist(q, r, a.q, a.r) - hexDist(q, r, b.q, b.r))[0];
}

function unitAt(q, r) {
  return units.find(u => u.alive && u.q === q && u.r === r);
}

function inMap(q, r) {
  return q >= 0 && q < mapCols && r >= 0 && r < mapRows && mapData.has(tileKey(q, r));
}

function tileKey(q, r) {
  return `${q},${r}`;
}

function opposite(s) {
  return s === 'GER' ? 'SOV' : 'GER';
}

function neighbors(q, r) {
  return [{ q: q + 1, r }, { q: q + 1, r: r - 1 }, { q, r: r - 1 }, { q: q - 1, r }, { q: q - 1, r: r + 1 }, { q, r: r + 1 }];
}

function hexToPixel(q, r) {
  return {
    x: originX + hexSize * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
    y: originY + hexSize * (1.5 * r)
  };
}

function pixelToHex(px, py) {
  const worldX = (px - camera.x) / camera.zoom;
  const worldY = (py - camera.y) / camera.zoom;
  const x = (worldX - originX) / hexSize;
  const y = (worldY - originY) / hexSize;
  const q = (Math.sqrt(3) / 3) * x - (1 / 3) * y;
  const r = (2 / 3) * y;
  return cubeRound(q, r);
}

function cubeRound(q, r) {
  let x = q;
  let z = r;
  let y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

function hexShape(cx, cy) {
  beginShape();
  for (let i = 0; i < 6; i++) {
    const a = TWO_PI * (i + 0.5) / 6;
    vertex(cx + hexSize * cos(a), cy + hexSize * sin(a));
  }
  endShape(CLOSE);
}

function hexDist(q1, r1, q2, r2) {
  const x1 = q1;
  const z1 = r1;
  const y1 = -x1 - z1;
  const x2 = q2;
  const z2 = r2;
  const y2 = -x2 - z2;
  return max(abs(x1 - x2), abs(y1 - y2), abs(z1 - z2));
}

function log(t) {
  logs.push(t);
  if (logs.length > 140) logs.shift();
  markUIDirty();
}
