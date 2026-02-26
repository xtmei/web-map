import type { GameStore } from '../store/state';
import type { MapView } from '../map/map-view';

interface ViewRefs {
  phaseLabel: HTMLElement;
  sideSelect: HTMLSelectElement;
  apLabel: HTMLElement;
  supplyLabel: HTMLElement;
  logButton: HTMLButtonElement;
  slider: HTMLInputElement;
  timelineLabel: HTMLElement;
  playButton: HTMLButtonElement;
  phaseTitle: HTMLElement;
  phaseDescription: HTMLElement;
  unitSummary: HTMLElement;
  unitDetails: HTMLElement;
  sheet: HTMLElement;
  centerFab: HTMLButtonElement;
  jumpList: HTMLElement;
  locateFab: HTMLButtonElement;
  endTurnFab: HTMLButtonElement;
}

export function createLayout(store: GameStore, mapView: MapView): void {
  const refs = queryRefs();
  refs.slider.max = String(store.phases.length - 1);
  refs.sideSelect.addEventListener('change', () => store.setSide(refs.sideSelect.value as 'Axis' | 'Soviet'));
  refs.slider.addEventListener('input', () => store.setPhaseByIndex(Number(refs.slider.value)));
  refs.playButton.addEventListener('click', () => store.togglePlay());
  refs.logButton.addEventListener('click', () => alert('日志（MVP mock）：暂无详细事件流。'));

  const toggleSheet = () => store.setSheetOpen(!store.state.sheetOpen);
  refs.unitSummary.addEventListener('click', toggleSheet);

  refs.locateFab.addEventListener('click', () => mapView.centerOnSelected());
  refs.endTurnFab.addEventListener('click', () => store.stepPhaseForward());
  refs.centerFab.addEventListener('click', () => mapView.centerDefault());

  let pressTimer: number | undefined;
  refs.centerFab.addEventListener('pointerdown', () => {
    pressTimer = window.setTimeout(() => refs.jumpList.classList.add('is-open'), 550);
  });
  const clearLongPress = () => {
    if (pressTimer) window.clearTimeout(pressTimer);
  };
  refs.centerFab.addEventListener('pointerup', clearLongPress);
  refs.centerFab.addEventListener('pointerleave', clearLongPress);

  refs.jumpList.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const item = target.closest<HTMLButtonElement>('button[data-phase]');
    if (!item) return;
    store.setPhaseByIndex(Number(item.dataset.phase));
    refs.jumpList.classList.remove('is-open');
  });

  let timer: number | undefined;

  const rerender = () => {
    const d = store.getDerived();
    refs.phaseLabel.textContent = `阶段 ${d.phase.id}/8`;
    refs.sideSelect.value = store.state.side;
    refs.apLabel.textContent = d.apSummary;
    refs.supplyLabel.textContent = d.supplySummary;
    refs.slider.value = String(store.state.phaseIndex);
    refs.timelineLabel.textContent = d.phase.label;
    refs.playButton.textContent = store.state.playing ? '暂停' : '播放';
    refs.phaseTitle.textContent = d.phase.title;
    refs.phaseDescription.textContent = d.phase.description;

    const unit = d.selectedUnit;
    refs.unitSummary.textContent = unit
      ? `${unit.name} · ${unit.echelon} · AP ${unit.ap}`
      : '未选中单位（点选地图单位）';

    refs.unitDetails.innerHTML = unit
      ? `<div>编制：${unit.echelon}</div><div>装备：${unit.equipment.join(' / ')}</div><div>状态：兵力 ${unit.strength} · 补给 ${unit.supply}</div><div>上级：${unit.parentId}</div><div>本回合AP：${unit.ap}</div>`
      : '<div>请在地图上选择单位。</div>';

    refs.sheet.classList.toggle('is-open', store.state.sheetOpen);
    mapView.render();
  };

  store.subscribe(rerender);

  store.subscribe(() => {
    if (timer) window.clearInterval(timer);
    if (store.state.playing) {
      timer = window.setInterval(() => store.stepPhaseForward(), 1600);
    }
  });

  rerender();
}

function queryRefs(): ViewRefs {
  const get = <T extends HTMLElement>(id: string): T => {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing #${id}`);
    return node as T;
  };

  return {
    phaseLabel: get('phase-label'),
    sideSelect: get('side-select'),
    apLabel: get('ap-label'),
    supplyLabel: get('supply-label'),
    logButton: get('log-button'),
    slider: get('time-slider'),
    timelineLabel: get('timeline-label'),
    playButton: get('play-button'),
    phaseTitle: get('phase-title'),
    phaseDescription: get('phase-description'),
    unitSummary: get('unit-summary'),
    unitDetails: get('unit-details'),
    sheet: get('bottom-sheet'),
    centerFab: get('fab-center'),
    jumpList: get('phase-jump-list'),
    locateFab: get('fab-locate'),
    endTurnFab: get('fab-endturn')
  };
}
