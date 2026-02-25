import type { GameState } from '../game/state';

export function renderHud(container: HTMLElement, state: GameState): void {
  const selected = state.selectedHex
    ? `Selected hex: q=${state.selectedHex.q}, r=${state.selectedHex.r}`
    : 'Selected hex: none';

  container.innerHTML = `
    <div class="hud__title">Stalingrad Hex Playground (PR1)</div>
    <div>${selected}</div>
    <div class="hud__small">Drag: pan • Wheel/pinch: zoom • Tap/click: select hex</div>
  `;
}
