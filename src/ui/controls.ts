import type { Side } from '../game/units/model';
import type { FormationOption } from '../game/state';

interface ControlsState {
  selectedSide: Side;
  selectedFormationId: string;
  formations: FormationOption[];
}

interface ControlsHandlers {
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

  const axisButton = root.querySelector<HTMLButtonElement>('button[data-side="Axis"]');
  const sovietButton = root.querySelector<HTMLButtonElement>('button[data-side="Soviet"]');
  const formationSelect = root.querySelector<HTMLSelectElement>('#formation-select');
  const clearButton = root.querySelector<HTMLButtonElement>('#clear-selection');

  if (!axisButton || !sovietButton || !formationSelect || !clearButton) {
    throw new Error('Failed to create controls UI');
  }

  axisButton.addEventListener('click', () => handlers.onSideChange('Axis'));
  sovietButton.addEventListener('click', () => handlers.onSideChange('Soviet'));
  formationSelect.addEventListener('change', () => handlers.onFormationChange(formationSelect.value));
  clearButton.addEventListener('click', () => handlers.onClearSelection());

  return {
    render(state) {
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
