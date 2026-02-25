import { getSelectedUnit, type GameState } from '../game/state';

export function renderHud(container: HTMLElement, state: GameState): void {
  const selectedHex = state.selectedHex
    ? `Selected hex: q=${state.selectedHex.q}, r=${state.selectedHex.r}`
    : 'Selected hex: none';

  const selectedUnit = getSelectedUnit(state);
  const unitText = selectedUnit
    ? `${selectedUnit.name} (${selectedUnit.side}) • ${selectedUnit.echelon} • STR ${selectedUnit.strength} • MOR ${selectedUnit.morale} • q=${selectedUnit.pos.q}, r=${selectedUnit.pos.r}`
    : '(none)';

  container.innerHTML = `
    <div class="hud__title">Stalingrad Hex Playground (PR2)</div>
    <div>${selectedHex}</div>
    <div>Selected unit: ${unitText}</div>
    <div class="hud__small">Drag: pan • Wheel/pinch: zoom • Tap/click: select unit or hex</div>
  `;
}
