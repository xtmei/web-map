import type { Side } from '../game/units/model';
import type { UIStore } from '../state/store';

export interface TopbarHandlers {
  onToggleMode: (mode: 'browse' | 'command') => void;
  onOpenLog: () => void;
  onToggleSettings: () => void;
  onCenterShortPress: () => void;
  onCenterLongPress: () => void;
  onSideChange: (side: Side) => void;
  onScenarioChange: (scenarioId: string) => void;
  onQuickJump: (type: 'nearest' | 'node' | 'supply') => void;
}

export interface TopbarView {
  render: () => void;
}

interface ScenarioOption {
  id: string;
  name: string;
}

export function createTopbar(
  root: HTMLElement,
  store: UIStore,
  scenarios: ScenarioOption[],
  handlers: TopbarHandlers
): TopbarView {
  root.innerHTML = `
    <header class="top-bar card">
      <div class="top-bar__primary">
        <div class="metric"><span>回合</span><strong data-role="turn"></strong></div>
        <div class="metric"><span>阵营</span><strong data-role="side"></strong></div>
        <div class="metric"><span>AP</span><strong data-role="ap"></strong></div>
        <div class="metric"><span>补给</span><strong data-role="supply" class="status-pill"></strong></div>
      </div>
      <div class="top-bar__actions">
        <button type="button" data-action="mode" class="btn"></button>
        <button type="button" data-action="center" class="btn">居中</button>
        <button type="button" data-action="log" class="btn">日志</button>
        <button type="button" data-action="settings" class="btn">设置</button>
      </div>
      <div class="top-bar__settings" data-role="settings" hidden>
        <label>场景<select data-role="scenario"></select></label>
        <label>阵营
          <select data-role="side-select">
            <option value="Axis">Axis</option>
            <option value="Soviet">Soviet</option>
          </select>
        </label>
      </div>
    </header>
    <div class="quick-jump card" data-role="quick-jump" hidden>
      <strong>快速跳转</strong>
      <button type="button" data-jump="nearest" class="btn">最近单位</button>
      <button type="button" data-jump="node" class="btn">关键节点</button>
      <button type="button" data-jump="supply" class="btn">补给点</button>
    </div>
  `;

  const modeButton = root.querySelector<HTMLButtonElement>('[data-action="mode"]');
  const centerButton = root.querySelector<HTMLButtonElement>('[data-action="center"]');
  const logButton = root.querySelector<HTMLButtonElement>('[data-action="log"]');
  const settingsButton = root.querySelector<HTMLButtonElement>('[data-action="settings"]');
  const settingsPanel = root.querySelector<HTMLElement>('[data-role="settings"]');
  const turnEl = root.querySelector<HTMLElement>('[data-role="turn"]');
  const sideEl = root.querySelector<HTMLElement>('[data-role="side"]');
  const apEl = root.querySelector<HTMLElement>('[data-role="ap"]');
  const supplyEl = root.querySelector<HTMLElement>('[data-role="supply"]');
  const scenarioSelect = root.querySelector<HTMLSelectElement>('[data-role="scenario"]');
  const sideSelect = root.querySelector<HTMLSelectElement>('[data-role="side-select"]');
  const quickJump = root.querySelector<HTMLElement>('[data-role="quick-jump"]');

  if (!modeButton || !centerButton || !logButton || !settingsButton || !settingsPanel || !turnEl || !sideEl || !apEl || !supplyEl || !scenarioSelect || !sideSelect || !quickJump) {
    throw new Error('Topbar creation failed');
  }

  scenarioSelect.innerHTML = scenarios.map((scenario) => `<option value="${scenario.id}">${scenario.name}</option>`).join('');
  scenarioSelect.addEventListener('change', () => handlers.onScenarioChange(scenarioSelect.value));
  sideSelect.addEventListener('change', () => handlers.onSideChange(sideSelect.value as Side));

  root.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((button) => {
    button.addEventListener('click', () => handlers.onQuickJump(button.dataset.jump as 'nearest' | 'node' | 'supply'));
  });

  let centerTimer: number | null = null;
  centerButton.addEventListener('pointerdown', () => {
    centerTimer = window.setTimeout(() => {
      handlers.onCenterLongPress();
      centerTimer = null;
    }, 500);
  });
  centerButton.addEventListener('pointerup', () => {
    if (centerTimer) {
      clearTimeout(centerTimer);
      centerTimer = null;
      handlers.onCenterShortPress();
    }
  });

  modeButton.addEventListener('click', () => handlers.onToggleMode(store.commandMode === 'browse' ? 'command' : 'browse'));
  logButton.addEventListener('click', handlers.onOpenLog);
  settingsButton.addEventListener('click', handlers.onToggleSettings);

  return {
    render() {
      turnEl.textContent = `${store.turn}`;
      sideEl.textContent = store.selectedUnit?.side ?? store.selectedSide;
      apEl.textContent = `${store.actionPoints}/${store.actionPointsMax}`;
      supplyEl.textContent = store.supplyStatus;
      supplyEl.className = `status-pill status-pill--${store.supplyStatus}`;
      modeButton.textContent = store.commandMode === 'browse' ? '浏览模式' : '指挥模式';
      modeButton.classList.toggle('btn--active', store.commandMode === 'command');
      scenarioSelect.value = store.scenarioId;
      sideSelect.value = store.selectedSide;
      settingsPanel.toggleAttribute('hidden', !store.settingsOpen);
      quickJump.toggleAttribute('hidden', !store.quickJumpOpen);
    }
  };
}
