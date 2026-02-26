import { getSelectedUnit, type GameState } from '../game/state';

export function renderHud(container: HTMLElement, state: GameState): void {
  const selectedUnit = getSelectedUnit(state.units, state.selectedUnitId);

  const moveStatus = state.movementMode
    ? state.movePreview
      ? `移动预览：消耗 ${state.movePreview.cost} MP → q=${state.movePreview.dest.q}, r=${state.movePreview.dest.r}`
      : '移动模式开启：点击高亮格预览路径'
    : '普通模式';

  const errorHtml = state.errorMessage
    ? `<div class="hud__error" role="alert">Scenario load error: ${state.errorMessage}</div>`
    : '';

  container.innerHTML = `
    <div class="hud__title-row">
      <div class="hud__title">Stalingrad Hex Playground</div>
      <span class="hud__badge ${state.movementMode ? 'hud__badge--active' : ''}">${state.movementMode ? 'MOVE' : 'IDLE'}</span>
    </div>

    <section class="hud__section">
      <div><strong>Scenario:</strong> ${state.scenarioName || 'none loaded'}</div>
      <div><strong>Controlling:</strong> ${state.selectedSide} • ${state.selectedFormationId || 'none'}</div>
    </section>

    <section class="hud__section">
      <div><strong>Selected hex:</strong> ${state.selectedHex ? `q=${state.selectedHex.q}, r=${state.selectedHex.r}` : 'none'}</div>
      <div><strong>Selected unit:</strong> ${
        selectedUnit
          ? `${selectedUnit.name} (${selectedUnit.side}) • ${selectedUnit.echelon} • MP ${selectedUnit.mpRemaining}/${selectedUnit.mpMax}`
          : '(none)'
      }</div>
      <div><strong>Action:</strong> ${moveStatus}</div>
    </section>

    <details class="hud__help">
      <summary>操作提示</summary>
      <div class="hud__small">Drag: pan • Wheel/pinch: zoom • Tap/click: select controllable unit or hex</div>
    </details>
    ${errorHtml}
  `;
}
