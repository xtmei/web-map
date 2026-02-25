import type { Side } from '../game/units/model';
import type { FormationOption } from '../game/state';
import type { ScenarioOption } from '../game/scenarios/types';

interface ControlsState {
  selectedSide: Side;
  selectedFormationId: string;
  selectedScenarioId: string;
  scenarios: ScenarioOption[];
  formations: FormationOption[];
}

interface ControlsHandlers {
  onScenarioChange: (scenarioId: string) => void;
  onSideChange: (side: Side) => void;
  onFormationChange: (formationId: string) => void;
  onClearSelection: () => void;
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
  `;

  const scenarioSelect = root.querySelector<HTMLSelectElement>('#scenario-select');
  const axisButton = root.querySelector<HTMLButtonElement>('button[data-side="Axis"]');
  const sovietButton = root.querySelector<HTMLButtonElement>('button[data-side="Soviet"]');
  const formationSelect = root.querySelector<HTMLSelectElement>('#formation-select');
  const clearButton = root.querySelector<HTMLButtonElement>('#clear-selection');

  if (!scenarioSelect || !axisButton || !sovietButton || !formationSelect || !clearButton) {
    throw new Error('Failed to create controls UI');
  }

  scenarioSelect.addEventListener('change', () => handlers.onScenarioChange(scenarioSelect.value));
  axisButton.addEventListener('click', () => handlers.onSideChange('Axis'));
  sovietButton.addEventListener('click', () => handlers.onSideChange('Soviet'));
  formationSelect.addEventListener('change', () => handlers.onFormationChange(formationSelect.value));
  clearButton.addEventListener('click', () => handlers.onClearSelection());

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
    }
  };
}
