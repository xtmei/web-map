const workbenchEl = document.getElementById('mapWorkbench');
const openBtn = document.getElementById('btnHiResMap');
const closeBtn = document.getElementById('btnCloseHiResMap');
const statusEl = document.getElementById('mapStatus');

let leafletMap;
let mapReady = false;

const vectorLayers = [
  { id: 'roads', color: '#d8c38f', weight: 2, fillOpacity: 0 },
  { id: 'railways', color: '#9f9f9f', weight: 2, dashArray: '6 4', fillOpacity: 0 },
  { id: 'river', color: '#4b83b7', weight: 3, fillOpacity: 0 },
  { id: 'industrial_zones', color: '#b9745a', weight: 1, fillColor: '#9b5a43', fillOpacity: 0.25 },
  { id: 'bridges', color: '#f0d28e', radius: 5 },
  { id: 'ferry_crossings', color: '#78bdd2', radius: 5 },
  { id: 'elevation_points', color: '#9ac06f', radius: 4 }
];

const mapPerfPane = {
  hexMaxZoom: 13,
  hexMinZoom: 10,
  vectorMinZoom: 9,
};

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function makeGeoJsonStyle(def) {
  return {
    color: def.color,
    weight: def.weight || 1,
    dashArray: def.dashArray,
    fillColor: def.fillColor || def.color,
    fillOpacity: def.fillOpacity ?? 0.2,
  };
}

async function loadGeoJsonLayer(def) {
  const res = await fetch(`./data/vector/${def.id}.geojson`);
  const json = await res.json();
  if (json.features?.[0]?.geometry?.type === 'Point') {
    return L.geoJSON(json, {
      pointToLayer: (_, latlng) => L.circleMarker(latlng, {
        radius: def.radius || 4,
        color: '#111',
        weight: 1,
        fillColor: def.color,
        fillOpacity: 0.9
      })
    });
  }
  return L.geoJSON(json, { style: makeGeoJsonStyle(def) });
}

function initLeafletBase() {
  if (mapReady) return;
  leafletMap = L.map('leafletMap', {
    preferCanvas: true,
    zoomControl: true,
    attributionControl: true,
    minZoom: 8,
    maxZoom: 17,
    maxBoundsViscosity: 0.8,
  }).setView([48.72, 44.53], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.35,
  }).addTo(leafletMap);

  const iiifUrl = 'https://tile.loc.gov/image-services/iiif/service:gmd:gmd7:g7064:g7064v:ct000790/full/full/0/default.jpg';
  if (L.tileLayer.iiif) {
    L.tileLayer.iiif(iiifUrl, {
      quality: 'default',
      setMaxBounds: false,
      fitBounds: false,
      updateWhenIdle: true,
      keepBuffer: 4,
      tileSize: 256,
      opacity: 0.88,
    }).addTo(leafletMap);
  } else {
    setStatus('Leaflet-IIIF 未加载，自动回退到 OSM。');
  }

  mapReady = true;
}

async function loadOperationalLayers() {
  setStatus('加载矢量层和 hex...');
  const group = L.layerGroup().addTo(leafletMap);

  const vectorLoads = vectorLayers.map(async (def) => {
    const layer = await loadGeoJsonLayer(def);
    layer.addTo(group);
    if (def.id !== 'industrial_zones') {
      layer.bindTooltip(def.id, { sticky: true });
    }
    return layer;
  });

  const hexRes = await fetch('./data/hex/stalingrad_hex_500m.geojson');
  const hexJson = await hexRes.json();
  const hexLayer = L.geoJSON(hexJson, {
    style: (f) => ({
      color: '#4e4636',
      weight: 0.35,
      fillColor: f.properties.terrain === 'RIVER' ? '#3f6e96' : f.properties.terrain === 'INDUSTRY' ? '#8e5f4e' : '#7f8566',
      fillOpacity: 0.18,
    }),
    onEachFeature: (f, layer) => {
      const p = f.properties;
      layer.bindPopup(`
        <b>${p.id}</b><br>
        terrain: ${p.terrain}<br>
        move_cost: ${p.move_cost}<br>
        cover: ${p.cover}<br>
        los_block: ${p.los_block}<br>
        supply: ${p.supply}
      `);
    }
  }).addTo(group);

  Promise.all(vectorLoads).then(() => setStatus('高清地图已就绪：IIIF + GeoJSON + Hex。'));

  function applyZoomCull() {
    const z = leafletMap.getZoom();
    const hexVisible = z >= mapPerfPane.hexMinZoom && z <= mapPerfPane.hexMaxZoom;
    if (hexVisible && !leafletMap.hasLayer(hexLayer)) hexLayer.addTo(group);
    if (!hexVisible && leafletMap.hasLayer(hexLayer)) group.removeLayer(hexLayer);
  }

  leafletMap.on('zoomend', applyZoomCull);
  applyZoomCull();
}

function openWorkbench() {
  if (!workbenchEl) return;
  workbenchEl.classList.add('open');
  initLeafletBase();
  if (!leafletMap.__opsLoaded) {
    loadOperationalLayers().catch((err) => {
      console.error(err);
      setStatus(`图层加载失败: ${err.message}`);
    });
    leafletMap.__opsLoaded = true;
  }
  setTimeout(() => leafletMap.invalidateSize(), 80);
}

function closeWorkbench() {
  if (!workbenchEl) return;
  workbenchEl.classList.remove('open');
}

openBtn?.addEventListener('click', openWorkbench);
closeBtn?.addEventListener('click', closeWorkbench);
