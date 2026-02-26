import type { UnitRecord } from '../data-loader/types';
import type { GameStore } from '../store/state';

declare const L: any;

const NATO_SYMBOL: Record<string, string> = {
  Army: 'XXXX',
  Corps: 'XXX',
  Division: 'XX',
  Regiment: 'X',
  Battalion: 'II'
};

function unitIcon(unit: UnitRecord): any {
  const sideClass = unit.side === 'Axis' ? 'unit-icon--axis' : 'unit-icon--soviet';
  const symbol = NATO_SYMBOL[unit.echelon] ?? '•';
  return L.divIcon({
    className: '',
    html: `<div class="unit-icon ${sideClass}"><span>${symbol}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

export class MapView {
  private readonly map: any;
  private readonly unitLayer = L.layerGroup();
  private readonly objectiveLayer = L.geoJSON();
  private frontlineLayer: any = L.geoJSON();

  constructor(private readonly store: GameStore, mapId: string) {
    this.map = L.map(mapId, {
      zoomControl: false,
      attributionControl: true
    }).setView([48.7, 44.6], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('zoomend', () => {
      this.store.setZoom(this.map.getZoom());
      this.render();
    });

    this.map.on('click', () => {
      this.store.setSelectedUnit(null, false);
    });

    this.unitLayer.addTo(this.map);
    this.objectiveLayer.addTo(this.map);
    this.frontlineLayer.addTo(this.map);
    this.renderObjectives();
  }

  centerOnSelected(): void {
    const selected = this.store.getDerived().selectedUnit;
    if (!selected) return;
    this.map.flyTo([selected.lat, selected.lon], Math.max(this.map.getZoom(), 8), { duration: 0.6 });
  }

  centerDefault(): void {
    this.map.flyTo([48.7, 44.6], 7, { duration: 0.6 });
  }

  render(): void {
    const derived = this.store.getDerived();
    const zoom = this.map.getZoom();
    const selectedId = derived.selectedUnit?.id;

    this.unitLayer.clearLayers();

    derived.units
      .filter((unit) => {
        if (zoom < 8) return unit.echelon === 'Army' || unit.echelon === 'Corps';
        if (zoom < 9.5) return unit.echelon !== 'Battalion';
        return true;
      })
      .forEach((unit) => {
        const marker = L.marker([unit.lat, unit.lon], { icon: unitIcon(unit) });
        marker.on('click', () => {
          this.store.setSelectedUnit(unit.id, true);
          this.map.flyTo([unit.lat, unit.lon], Math.max(this.map.getZoom(), 8), { duration: 0.45 });
        });
        marker.bindTooltip(`${unit.name} (${unit.echelon})`);
        marker.addTo(this.unitLayer);

        if (unit.id === selectedId) {
          const halo = L.circleMarker([unit.lat, unit.lon], {
            radius: 18,
            color: '#f5d76e',
            weight: 2,
            fillOpacity: 0
          });
          halo.addTo(this.unitLayer);
        }
      });

    this.map.removeLayer(this.frontlineLayer);
    this.frontlineLayer = L.geoJSON(derived.frontline, {
      style: (feature: any) => {
        const side = String(feature.properties?.side ?? 'Neutral');
        return {
          color: side === 'Axis' ? '#d04b4b' : '#4a7ad8',
          weight: 3,
          fillOpacity: 0.15
        };
      }
    }).addTo(this.map);
  }

  private renderObjectives(): void {
    this.objectiveLayer.clearLayers();
    L.geoJSON(this.store.objectives, {
      pointToLayer: (_feature: any, latlng: any) =>
        L.circleMarker(latlng, { radius: 6, color: '#ffe07a', fillColor: '#ffd34d', fillOpacity: 0.9, weight: 1 }),
      onEachFeature: (feature: any, layer: any) => {
        layer.bindPopup(`${feature.properties?.name ?? 'Objective'} · VP ${feature.properties?.vp ?? 0}`);
      }
    }).addTo(this.objectiveLayer);
  }
}
