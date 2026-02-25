import { getSelectedUnit, type GameState } from '../game/state';

export function renderHud(container: HTMLElement, state: GameState): void {
  const selectedHex = state.selectedHex
    ? `Selected hex: q=${state.selectedHex.q}, r=${state.selectedHex.r}`
    : 'Selected hex: none';

  const selectedUnit = getSelectedUnit(state.units, state.selectedUnitId);
  const unitText = selectedUnit
    ? `${selectedUnit.name} (${selectedUnit.side}) • ${selectedUnit.echelon} • ${selectedUnit.formationName}`
    : '(none)';

  container.innerHTML = `
    <div class="hud__title">Stalingrad Hex Playground (PR3)</div>
    <div>Controlling: ${state.selectedSide} • ${state.selectedFormationId || 'none'}</div>
    <div>${selectedHex}</div>
    <div>Selected unit: ${unitText}</div>
    <div class="hud__small">Drag: pan • Wheel/pinch: zoom • Tap/click: select controllable unit or hex</div>
  `;
}
