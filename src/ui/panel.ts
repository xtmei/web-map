import type { Unit } from '../game/units/model';

interface UnitPanelView {
  render: (unit: Unit | null) => void;
}

function deriveStructure(unit: Unit): {
  companies: number;
  platoons: number;
  squads: number;
  vehicles: number;
  tanks: number;
} {
  const companies = Math.max(1, Math.round(unit.strength / 12));
  const platoons = companies * 3;
  const squads = platoons * 3;
  const vehicles = Math.round(unit.strength / 5);
  const tanks = unit.side === 'Axis' ? Math.round(unit.strength / 9) : Math.round(unit.strength / 10);

  return { companies, platoons, squads, vehicles, tanks };
}

export function createUnitPanel(root: HTMLElement, onClose: () => void): UnitPanelView {
  root.innerHTML = `
    <div class="unit-panel" aria-live="polite">
      <div class="unit-panel__handle" aria-hidden="true"></div>
      <div class="unit-panel__header">
        <h2 class="unit-panel__title">Unit details</h2>
        <button type="button" class="unit-panel__close" aria-label="Close unit details">✕</button>
      </div>
      <div class="unit-panel__content"></div>
    </div>
  `;

  const panel = root.querySelector<HTMLDivElement>('.unit-panel');
  const content = root.querySelector<HTMLDivElement>('.unit-panel__content');
  const closeButton = root.querySelector<HTMLButtonElement>('.unit-panel__close');

  if (!panel || !content || !closeButton) {
    throw new Error('Failed to create unit panel UI');
  }

  closeButton.addEventListener('click', onClose);

  return {
    render(unit) {
      if (!unit) {
        panel.classList.remove('is-open');
        content.innerHTML = '';
        return;
      }

      const structure = deriveStructure(unit);
      content.innerHTML = `
        <dl class="unit-panel__stats">
          <div><dt>Name</dt><dd>${unit.name}</dd></div>
          <div><dt>Side</dt><dd>${unit.side}</dd></div>
          <div><dt>Echelon</dt><dd>${unit.echelon}</dd></div>
          <div><dt>Formation</dt><dd>${unit.formationName}</dd></div>
          <div><dt>Strength</dt><dd>${unit.strength}</dd></div>
          <div><dt>Morale</dt><dd>${unit.morale}</dd></div>
          <div><dt>MP</dt><dd>${unit.mpRemaining}/${unit.mpMax}</dd></div>
          <div><dt>Position</dt><dd>q=${unit.pos.q}, r=${unit.pos.r}</dd></div>
        </dl>
        <h3 class="unit-panel__subhead">Tactical summary</h3>
        <div class="unit-panel__summary">
          <span>可移动: <strong>${unit.mpRemaining} MP</strong></span>
          <span>士气: <strong>${unit.morale >= 70 ? '稳定' : unit.morale >= 50 ? '一般' : '脆弱'}</strong></span>
          <span>战力: <strong>${unit.strength >= 60 ? '强' : unit.strength >= 40 ? '中' : '弱'}</strong></span>
        </div>
        <h3 class="unit-panel__subhead">Structure (placeholder)</h3>
        <ul class="unit-panel__list">
          <li>Companies: ${structure.companies}</li>
          <li>Platoons: ${structure.platoons}</li>
          <li>Squads: ${structure.squads}</li>
          <li>Vehicles: ${structure.vehicles}</li>
          <li>Tanks: ${structure.tanks}</li>
        </ul>
      `;
      panel.classList.add('is-open');
    }
  };
}
