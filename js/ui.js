// ============================================================
// ui.js — HUD y pantallas (título, banner de nivel, game over)
// ============================================================
const UI = {
  drawHUD(ctx) {
    // ---- Barra de vida ----
    const bx = 12, by = 12, bw = 160, bh = 18;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(bx, by, bw, bh);
    const pct = Math.max(0, Game.player.hp / Game.player.maxHp);
    const col = pct > 0.5 ? '#4ae04a' : pct > 0.25 ? '#e8c23c' : '#e5484d';
    ctx.fillStyle = col;
    ctx.fillRect(bx, by, bw * pct, bh);
    ctx.fillStyle = '#20242e';
    for (let i = 1; i < 10; i++) ctx.fillRect(bx + (bw / 10) * i, by, 2, bh);
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'left';
    ctx.strokeText('VIDA ' + Game.player.hp, bx + 4, by + 14);
    ctx.fillText('VIDA ' + Game.player.hp, bx + 4, by + 14);

    // ---- Monedas ----
    const cx = bx + bw + 24, cy = by + 9;
    drawSprite(ctx, SPR.coins[Math.floor(Game.time * 4) % 3], cx, cy, { scale: 2, pivot: 'bottom' });
    ctx.font = 'bold 14px monospace';
    ctx.strokeText('x' + Game.player.coins, cx + 12, cy - 2);
    ctx.fillStyle = '#ffd23c';
    ctx.fillText('x' + Game.player.coins, cx + 12, cy - 2);

    // ---- Nivel y distancia ----
    ctx.font = 'bold 12px monospace';
    ctx.strokeText('NIVEL 1 · ' + CONFIG.LEVEL_NAME, bx, 48);
    ctx.fillStyle = '#fff';
    ctx.fillText('NIVEL 1 · ' + CONFIG.LEVEL_NAME, bx, 48);
    const dist = Math.floor(Game.player.distance / 10) + 'm';
    ctx.strokeText(dist, bx, 64);
    ctx.fillText(dist, bx, 64);

    // ---- Cubanisho ----
    if (Game.buyZone) {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#8f8';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      const msg = '¡PRESIONA SALTAR PARA COMPRAR CUBANITO!';
      ctx.strokeText(msg, CONFIG.VW / 2, CONFIG.VH - 40);
      ctx.fillText(msg, CONFIG.VW / 2, CONFIG.VH - 40);
      ctx.textAlign = 'left';
    }
  },

  // ---- Pantallas HTML ----
  show(el, html) {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = html;
    overlay.style.pointerEvents = 'auto';
  },
  hide() {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = '';
    overlay.style.pointerEvents = 'none';
  },

  showTitle() {
    this.show('', `
      <div class="overlay-box">
        <h1>FELI contra las PALOMAS</h1>
        <p class="subtitle">Runner · Bahía Blanca<br>
        ↑/W subir · ↓/S bajar · ESPACIO saltar y patear<br>
        En el celular: usa los botones táctiles</p>
        <button class="btn" id="btn-start">▶ Jugar</button>
      </div>
    `);
    const b = document.getElementById('btn-start');
    if (b) b.addEventListener('click', () => Game.start());
  },

  showLevelBanner() {
    this.show('', `
      <div class="overlay-box">
        <h1>NIVEL 1</h1>
        <p class="subtitle" style="font-size:22px">ALSINA</p>
        <p class="subtitle">¡A correr! Esquiva pozos y autos, patea palomas y junta monedas.</p>
      </div>
    `);
  },

  showGameOver() {
    AudioSys.death();
    const dist = Math.floor(Game.player.distance / 10);
    this.show('', `
      <div class="overlay-box">
        <h1 style="color:#e5484d">GAME OVER</h1>
        <p class="subtitle">Las palomas ganaron esta vez...</p>
        <div class="stats">
          🏃 Distancia: ${dist} m<br>
          🪙 Monedas: ${Game.player.coins}<br>
          🏁 Nivel: 1 · ${CONFIG.LEVEL_NAME}
        </div>
        <button class="btn" id="btn-retry">↻ Volver a jugar</button>
        <button class="btn btn-secondary" id="btn-menu">Menú</button>
      </div>
    `);
    const retry = document.getElementById('btn-retry');
    const menu = document.getElementById('btn-menu');
    if (retry) retry.addEventListener('click', () => Game.restart());
    if (menu) menu.addEventListener('click', () => { Game.resetAll(); UI.showTitle(); });
  },

  showLevelComplete() {
    const dist = Math.floor(Game.player.distance / 10);
    this.show('', `
      <div class="overlay-box">
        <h1 style="color:#4ae04a">¡NIVEL COMPLETADO!</h1>
        <div class="stats">
          🏃 Distancia: ${dist} m<br>
          🪙 Monedas: ${Game.player.coins}<br>
          🏁 Nivel: 1 · ${CONFIG.LEVEL_NAME}
        </div>
        <button class="btn" id="btn-retry">↻ Jugar de nuevo</button>
        <button class="btn btn-secondary" id="btn-menu">Menú</button>
      </div>
    `);
    const retry = document.getElementById('btn-retry');
    const menu = document.getElementById('btn-menu');
    if (retry) retry.addEventListener('click', () => Game.restart());
    if (menu) menu.addEventListener('click', () => { Game.resetAll(); UI.showTitle(); });
  },
};
