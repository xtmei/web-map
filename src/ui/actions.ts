import type { ActionType, UIStore } from '../state/store';

export interface ActionHandlers {
  onActionTap: (action: ActionType) => void;
  onActionInfo: (message: string) => void;
  onConfirmPlanned: () => void;
  onCancelPlanned: () => void;
  onEndTurn: () => void;
  onResetTheatre: () => void;
}

export interface ActionsView {
  render: () => void;
}

export function createActionDock(root: HTMLElement, store: UIStore, handlers: ActionHandlers): ActionsView {
  root.innerHTML = `
    <div class="action-dock card">
      <div class="action-dock__actions" data-role="actions"></div>
      <div class="action-dock__meta">
        <button class="btn" data-role="end-turn" type="button">回合结束</button>
        <button class="btn btn--danger" data-role="reset" type="button">重置战区</button>
      </div>
    </div>
    <div class="confirm-strip card" data-role="confirm" hidden>
      <span data-role="confirm-text">目标确认</span>
      <button class="btn btn--active" data-role="confirm-yes" type="button">确认</button>
      <button class="btn" data-role="confirm-no" type="button">取消</button>
    </div>
  `;

  const actionsEl = root.querySelector<HTMLElement>('[data-role="actions"]');
  const endTurn = root.querySelector<HTMLButtonElement>('[data-role="end-turn"]');
  const reset = root.querySelector<HTMLButtonElement>('[data-role="reset"]');
  const confirmStrip = root.querySelector<HTMLElement>('[data-role="confirm"]');
  const confirmText = root.querySelector<HTMLElement>('[data-role="confirm-text"]');
  const confirmYes = root.querySelector<HTMLButtonElement>('[data-role="confirm-yes"]');
  const confirmNo = root.querySelector<HTMLButtonElement>('[data-role="confirm-no"]');
  if (!actionsEl || !endTurn || !reset || !confirmStrip || !confirmText || !confirmYes || !confirmNo) {
    throw new Error('Action dock creation failed');
  }

  endTurn.addEventListener('click', handlers.onEndTurn);
  reset.addEventListener('click', handlers.onResetTheatre);
  confirmYes.addEventListener('click', handlers.onConfirmPlanned);
  confirmNo.addEventListener('click', handlers.onCancelPlanned);

  return {
    render() {
      const entries = store.getActionAvailability();
      actionsEl.innerHTML = entries
        .map(
          (entry) => `
          <button type="button" class="action-btn ${entry.available ? '' : 'is-disabled'}" data-action="${entry.type}">
            <span>${entry.label}</span>
            <small>AP-${entry.apCost}</small>
          </button>
        `
        )
        .join('');

      actionsEl.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
        const action = button.dataset.action as ActionType;
        const detail = entries.find((entry) => entry.type === action);
        if (!detail) return;
        const showReason = () => {
          if (!detail.available) handlers.onActionInfo(detail.reason);
        };
        button.addEventListener('click', () => {
          if (!detail.available) {
            showReason();
            return;
          }
          handlers.onActionTap(action);
        });
        button.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          showReason();
        });
        button.addEventListener('pointerdown', () => {
          const timer = window.setTimeout(showReason, 450);
          const clear = () => clearTimeout(timer);
          button.addEventListener('pointerup', clear, { once: true });
          button.addEventListener('pointerleave', clear, { once: true });
        });
      });

      if (store.plannedAction) {
        confirmStrip.removeAttribute('hidden');
        confirmText.textContent = `${store.plannedAction.type} → ${store.plannedAction.reason}`;
      } else {
        confirmStrip.setAttribute('hidden', 'true');
      }
    }
  };
}
