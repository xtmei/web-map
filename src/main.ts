import './style.css';
import { loadScenarioData } from './data-loader';
import { MapView } from './map/map-view';
import { GameStore } from './store/state';
import { createLayout } from './ui/layout';

async function bootstrap(): Promise<void> {
  const data = await loadScenarioData();
  const store = new GameStore(data);
  const mapView = new MapView(store, 'map');
  createLayout(store, mapView);
}

bootstrap().catch((error) => {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div class="error">加载失败：${error instanceof Error ? error.message : String(error)}</div>`;
  }
});
