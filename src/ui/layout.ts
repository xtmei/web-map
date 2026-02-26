import type { GameState, Squad } from '../data/types';

export function createUi() {
  const root = document.body;
  root.innerHTML = `
    <div class="app-shell">
      <header class="top-bar">
        <div id="top-main"></div>
        <label class="auto-center"><input id="auto-center" type="checkbox" checked />自动居中</label>
      </header>
      <main class="map-wrap"><canvas id="map-canvas"></canvas></main>
      <div id="status" class="status"></div>
      <nav id="action-bar" class="action-bar"></nav>
      <section id="sheet" class="sheet"></section>
      <button id="end-turn" class="end-turn">结束玩家回合</button>
    </div>`;

  const canvas = document.querySelector<HTMLCanvasElement>('#map-canvas')!;
  const topMain = document.querySelector<HTMLDivElement>('#top-main')!;
  const sheet = document.querySelector<HTMLElement>('#sheet')!;
  const actionBar = document.querySelector<HTMLElement>('#action-bar')!;
  const status = document.querySelector<HTMLElement>('#status')!;
  const endTurnBtn = document.querySelector<HTMLButtonElement>('#end-turn')!;
  const autoCenter = document.querySelector<HTMLInputElement>('#auto-center')!;

  return {
    canvas,
    state: { autoCenter: true },
    renderTopBar(game: GameState, selected?: Squad) {
      topMain.textContent = `Turn ${game.turn} | 阵营: ${game.currentSide} | ${selected?.name ?? '未选中'} | AP ${selected?.ap ?? '-'} | 压制 ${selected?.suppression ?? '-'}`;
      endTurnBtn.disabled = game.currentSide !== 'Player' || game.gameOver;
    },
    renderBottomSheet(selected?: Squad) {
      if (!selected) {
        sheet.innerHTML = '<h3>班详情</h3><p>选择一个班查看信息。</p>';
        return;
      }
      sheet.innerHTML = `
        <h3>${selected.name}</h3>
        <p>人数 ${selected.men} | 伤亡 ${selected.casualties}</p>
        <p>弹药 ${selected.ammo} | 手雷 ${selected.grenades}</p>
        <p>姿态 ${selected.posture} | AP ${selected.ap}/${selected.apMax}</p>
        <p>装备: 自动步枪/机枪(简化)</p>
      `;
    },
    renderActions(
      actions: Record<string, { enabled: boolean; reason: string }>,
      handlers: { onMove: () => void; onShoot: () => void; onCrouch: () => void; onGrenade: () => void; onEndAction: () => void }
    ) {
      const defs = [
        ['移动', actions.move, handlers.onMove],
        ['射击', actions.shoot, handlers.onShoot],
        ['蹲伏', actions.crouch, handlers.onCrouch],
        ['手雷', actions.grenade, handlers.onGrenade],
        ['结束行动', actions.end, handlers.onEndAction]
      ] as const;
      actionBar.innerHTML = '';
      for (const [label, rule, onClick] of defs) {
        const btn = document.createElement('button');
        btn.textContent = rule.enabled ? label : `${label}(${rule.reason})`;
        btn.disabled = !rule.enabled;
        btn.onclick = onClick;
        actionBar.appendChild(btn);
      }
    },
    renderStatus(message: string) {
      status.textContent = message;
    },
    onEndTurn(cb: () => void) {
      endTurnBtn.onclick = cb;
    },
    onToggleCenter(cb: (v: boolean) => void) {
      autoCenter.onchange = () => cb(autoCenter.checked);
    }
  };
}
