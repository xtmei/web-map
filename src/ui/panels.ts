import type { Unit } from '../game/units/model';
import type { UIStore, UnitFilter } from '../state/store';

export interface PanelHandlers {
  onSelectUnit: (unitId: string) => void;
  onToggleFilter: (filter: UnitFilter) => void;
  onSearch: (text: string) => void;
  onToggleUnitPanel: () => void;
  onToggleSituationPanel: () => void;
}

export interface PanelsView {
  render: () => void;
}

function buildHierarchy(units: Unit[]): Map<string, Map<string, Map<string, Map<string, Unit[]>>>> {
  const tree = new Map<string, Map<string, Map<string, Map<string, Unit[]>>>>();
  for (const unit of units) {
    const army = unit.formationName;
    const corps = `${unit.formationName}-军群`;
    const division = unit.echelon;
    const regiment = `${unit.name}-团`;
    if (!tree.has(army)) tree.set(army, new Map());
    const corpsMap = tree.get(army)!;
    if (!corpsMap.has(corps)) corpsMap.set(corps, new Map());
    const divMap = corpsMap.get(corps)!;
    if (!divMap.has(division)) divMap.set(division, new Map());
    const regMap = divMap.get(division)!;
    if (!regMap.has(regiment)) regMap.set(regiment, []);
    regMap.get(regiment)!.push(unit);
  }
  return tree;
}

export function createPanels(root: HTMLElement, store: UIStore, handlers: PanelHandlers): PanelsView {
  root.innerHTML = `
    <aside class="unit-panel card" data-role="unit-panel">
      <div class="unit-panel__head">
        <strong>单位树</strong>
        <button class="btn" data-role="toggle-unit" type="button">收起</button>
      </div>
      <input class="input" data-role="search" placeholder="搜索单位" />
      <div class="chips" data-role="filters"></div>
      <div class="unit-tree" data-role="tree"></div>
    </aside>

    <section class="info-sheet card" data-role="situation-sheet">
      <div class="sheet-head">
        <strong>战况</strong>
        <button class="btn" data-role="toggle-situation" type="button">切换单位卡</button>
      </div>
      <div class="situation-cards" data-role="situation"></div>
    </section>

    <section class="info-sheet card" data-role="unit-sheet" hidden>
      <div class="sheet-head"><strong>单位卡</strong></div>
      <div data-role="unit-card"></div>
    </section>

    <section class="log-sheet card" data-role="log-sheet" hidden>
      <div class="sheet-head"><strong>回合日志</strong></div>
      <ul data-role="log-list"></ul>
    </section>
  `;

  const unitPanel = root.querySelector<HTMLElement>('[data-role="unit-panel"]');
  const treeEl = root.querySelector<HTMLElement>('[data-role="tree"]');
  const filtersEl = root.querySelector<HTMLElement>('[data-role="filters"]');
  const searchEl = root.querySelector<HTMLInputElement>('[data-role="search"]');
  const unitSheet = root.querySelector<HTMLElement>('[data-role="unit-sheet"]');
  const situationSheet = root.querySelector<HTMLElement>('[data-role="situation-sheet"]');
  const situationEl = root.querySelector<HTMLElement>('[data-role="situation"]');
  const unitCardEl = root.querySelector<HTMLElement>('[data-role="unit-card"]');
  const logSheet = root.querySelector<HTMLElement>('[data-role="log-sheet"]');
  const logList = root.querySelector<HTMLElement>('[data-role="log-list"]');
  const toggleUnit = root.querySelector<HTMLButtonElement>('[data-role="toggle-unit"]');
  const toggleSituation = root.querySelector<HTMLButtonElement>('[data-role="toggle-situation"]');

  if (!unitPanel || !treeEl || !filtersEl || !searchEl || !unitSheet || !situationSheet || !situationEl || !unitCardEl || !logSheet || !logList || !toggleUnit || !toggleSituation) {
    throw new Error('Panels creation failed');
  }

  toggleUnit.addEventListener('click', handlers.onToggleUnitPanel);
  toggleSituation.addEventListener('click', handlers.onToggleSituationPanel);
  searchEl.addEventListener('input', () => handlers.onSearch(searchEl.value));

  const filters: Array<{ key: UnitFilter; label: string }> = [
    { key: 'ready', label: '可行动' },
    { key: 'lowSupply', label: '缺补给' },
    { key: 'damaged', label: '受损' },
    { key: 'spent', label: '已行动' }
  ];

  return {
    render() {
      filtersEl.innerHTML = filters
        .map((filter) => `<button type="button" class="chip ${store.activeFilters.has(filter.key) ? 'chip--active' : ''}" data-filter="${filter.key}">${filter.label}</button>`)
        .join('');
      filtersEl.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((chip) => {
        chip.addEventListener('click', () => handlers.onToggleFilter(chip.dataset.filter as UnitFilter));
      });

      const filteredUnits = store.getFilteredUnits();
      if (filteredUnits.length === 0) {
        treeEl.innerHTML = '<div class="empty">无符合筛选单位</div>';
      } else {
        const tree = buildHierarchy(filteredUnits);
        treeEl.innerHTML = Array.from(tree.entries())
          .map(([army, corpsMap]) => {
            const corpsHtml = Array.from(corpsMap.entries())
              .map(([corps, divMap]) => {
                const divHtml = Array.from(divMap.entries())
                  .map(([division, regMap]) => {
                    const regHtml = Array.from(regMap.entries())
                      .map(([reg, units]) => {
                        const unitItems = units
                          .map(
                            (unit) => `<button type="button" class="unit-node ${store.selectedUnit?.id === unit.id ? 'unit-node--active' : ''}" data-unit="${unit.id}">${unit.name} (${unit.mpRemaining}/${unit.mpMax}MP)</button>`
                          )
                          .join('');
                        return `<details><summary>${reg}</summary><div class="unit-node-list">${unitItems}</div></details>`;
                      })
                      .join('');
                    return `<details><summary>${division}</summary>${regHtml}</details>`;
                  })
                  .join('');
                return `<details><summary>${corps}</summary>${divHtml}</details>`;
              })
              .join('');
            return `<details open><summary>${army}</summary>${corpsHtml}</details>`;
          })
          .join('');
      }

      treeEl.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach((button) => {
        button.addEventListener('click', () => handlers.onSelectUnit(button.dataset.unit ?? ''));
      });

      const selected = store.selectedUnit;
      const status = store.selectedStatus;
      unitCardEl.innerHTML = selected && status
        ? `
          <div class="unit-card-grid">
            <div><span>编制</span><strong>${Math.max(1, Math.round(selected.strength / 12))}连 / ${Math.max(3, Math.round(selected.strength / 6))}排 / ${Math.max(8, Math.round(selected.strength / 3))}班</strong></div>
            <div><span>装备</span><strong>坦克${status.tanks} / 火炮${status.artillery} / 车辆${status.vehicles}</strong></div>
            <div><span>状态</span><strong>士气${status.morale} 疲劳${status.fatigue} 补给${status.supply} 掩体${status.entrenchment} 受损${status.damage}%</strong></div>
            <div><span>指挥链</span><strong>${status.chain}</strong></div>
            <div><span>本回合AP</span><strong>${store.actionPointsMax - store.actionPoints} 已用 / ${store.actionPoints} 剩余</strong></div>
          </div>
        `
        : '<div class="empty">请选择单位查看单位卡</div>';

      situationEl.innerHTML = `
        <article class="s-card"><h4>VP</h4><p>占点 ${Math.round(store.getFilteredUnits().length / 2)} / 关键节点 3</p></article>
        <article class="s-card"><h4>补给线</h4><p>主补给线 ${store.supplyStatus} / 前沿节点 2 处承压</p></article>
        <article class="s-card"><h4>损失统计</h4><p>本回合 5 / 累计 23（mock）</p></article>
      `;

      logList.innerHTML = store.logEntries.length
        ? store.logEntries.map((entry) => `<li>${entry}</li>`).join('')
        : '<li class="empty">暂无日志</li>';

      unitSheet.toggleAttribute('hidden', store.panelView !== 'unit');
      situationSheet.toggleAttribute('hidden', store.panelView !== 'situation');

      if (window.matchMedia('(max-width: 900px)').matches) {
        unitPanel.classList.add('unit-panel--mobile');
      }

      logSheet.toggleAttribute('hidden', store.panelView !== 'situation');
    }
  };
}
