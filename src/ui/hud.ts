import { getSelectedUnit, type GameState } from '../game/state';

export function renderHud(container: HTMLElement, state: GameState): void {
  const selectedHex = state.selectedHex
    ? `Selected hex: q=${state.selectedHex.q}, r=${state.selectedHex.r}`
    : 'Selected hex: none';

  const selectedUnit = getSelectedUnit(state.units, state.selectedUnitId);
  const unitText = selectedUnit
    ? `${selectedUnit.name} (${selectedUnit.side}) • ${selectedUnit.echelon} • ${selectedUnit.formationName} • MP ${selectedUnit.mpRemaining}/${selectedUnit.mpMax}`
    : '(none)';

  const previewText = state.movePreview
    ? `Move preview: cost ${state.movePreview.cost} → q=${state.movePreview.dest.q}, r=${state.movePreview.dest.r}`
    : 'Move preview: none';

  const errorHtml = state.errorMessage
    ? `<div class="hud__error" role="alert">Scenario load error: ${state.errorMessage}</div>`
    : '';

  container.innerHTML = `
    <div class="hud__title">Stalingrad Hex Playground (PR4)</div>
    <div>Scenario: ${state.scenarioName || 'none loaded'}</div>
    <div>Controlling: ${state.selectedSide} • ${state.selectedFormationId || 'none'}</div>
    <div>${selectedHex}</div>
    <div>Selected unit: ${unitText}</div>
    <div>${previewText}</div>
    <div class="hud__small">Drag: pan • Wheel/pinch: zoom • Tap/click: select controllable unit or hex</div>
    ${errorHtml}
  `;
}
