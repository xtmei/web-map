import type { Side } from '../game/units/model';
import type { FormationOption } from '../game/state';
import type { ScenarioOption } from '../game/scenarios/types';

interface ControlsState {
  selectedSide: Side;
  selectedFormationId: string;
  selectedScenarioId: string;
  scenarios: ScenarioOption[];
  formations: FormationOption[];
  movementMode: boolean;
  canMove: boolean;
  canConfirmMove: boolean;
}

interface ControlsHandlers {
  onScenarioChange: (scenarioId: string) => void;
  onSideChange: (side: Side) => void;
  onFormationChange: (formationId: string) => void;
  onClearSelection: () => void;
  onToggleMoveMode: () => void;
  onConfirmMove: () => void;
  onCancelMove: () => void;
  onEndTurn: () => void;
}

export interface ControlsView {
  render: (state: ControlsState) => void;
}

export function createControls(root: HTMLElement, handlers: ControlsHandlers): ControlsView {
  root.innerHTML = `
    <div class="top-controls">
      <label class="formation-select-label">
        Scenario
        <select id="scenario-select" aria-label="Scenario"></select>
      </label>
      <div class="side-toggle" role="group" aria-label="Side selector">
        <button type="button" data-side="Axis">Axis</button>
        <button type="button" data-side="Soviet">Soviet</button>
      </div>
      <label class="formation-select-label">
        Formation
        <select id="formation-select" aria-label="Formation"></select>
      </label>
      <button type="button" id="clear-selection">Clear</button>
    </div>
    <div class="move-controls">
      <button type="button" id="toggle-move">Move</button>
      <button type="button" id="end-turn">End Turn</button>
    </div>
    <div class="move-confirm" aria-live="polite">
      <button type="button" id="confirm-move" class="move-confirm__confirm">Confirm Move</button>
      <button type="button" id="cancel-move" class="move-confirm__cancel">Cancel</button>
    </div>
  `;

  const scenarioSelect = root.querySelector<HTMLSelectElement>('#scenario-select');
  const axisButton = root.querySelector<HTMLButtonElement>('button[data-side="Axis"]');
  const sovietButton = root.querySelector<HTMLButtonElement>('button[data-side="Soviet"]');
  const formationSelect = root.querySelector<HTMLSelectElement>('#formation-select');
  const clearButton = root.querySelector<HTMLButtonElement>('#clear-selection');
  const moveButton = root.querySelector<HTMLButtonElement>('#toggle-move');
  const endTurnButton = root.querySelector<HTMLButtonElement>('#end-turn');
  const confirmMoveButton = root.querySelector<HTMLButtonElement>('#confirm-move');
  const cancelMoveButton = root.querySelector<HTMLButtonElement>('#cancel-move');
  const moveConfirm = root.querySelector<HTMLDivElement>('.move-confirm');

  if (
    !scenarioSelect ||
    !axisButton ||
    !sovietButton ||
    !formationSelect ||
    !clearButton ||
    !moveButton ||
    !endTurnButton ||
    !confirmMoveButton ||
    !cancelMoveButton ||
    !moveConfirm
  ) {
    throw new Error('Failed to create controls UI');
  }

  scenarioSelect.addEventListener('change', () => handlers.onScenarioChange(scenarioSelect.value));
  axisButton.addEventListener('click', () => handlers.onSideChange('Axis'));
  sovietButton.addEventListener('click', () => handlers.onSideChange('Soviet'));
  formationSelect.addEventListener('change', () => handlers.onFormationChange(formationSelect.value));
  clearButton.addEventListener('click', () => handlers.onClearSelection());
  moveButton.addEventListener('click', () => handlers.onToggleMoveMode());
  endTurnButton.addEventListener('click', () => handlers.onEndTurn());
  confirmMoveButton.addEventListener('click', () => handlers.onConfirmMove());
  cancelMoveButton.addEventListener('click', () => handlers.onCancelMove());

  return {
    render(state) {
      scenarioSelect.innerHTML = state.scenarios
        .map(
          (scenario) =>
            `<option value="${scenario.id}" ${scenario.id === state.selectedScenarioId ? 'selected' : ''}>${scenario.name}</option>`
        )
        .join('');

      axisButton.classList.toggle('is-active', state.selectedSide === 'Axis');
      sovietButton.classList.toggle('is-active', state.selectedSide === 'Soviet');

      formationSelect.innerHTML = state.formations
        .map(
          (formation) =>
            `<option value="${formation.id}" ${
              formation.id === state.selectedFormationId ? 'selected' : ''
            }>${formation.name}</option>`
        )
        .join('');

      moveButton.disabled = !state.canMove;
      moveButton.classList.toggle('is-active', state.movementMode);
      moveButton.textContent = state.movementMode ? 'Moving…' : 'Move';

      confirmMoveButton.disabled = !state.canConfirmMove;
      moveConfirm.classList.toggle('is-open', state.movementMode);
    }
  };
}
