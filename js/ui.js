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

    // ---- Vidas (corazones) ----
    const hx = CONFIG.VW - 108, hy = 12;
    const filled = '♥'.repeat(Game.lives);
    const empty = '♡'.repeat(Math.max(0, CONFIG.MAX_LIVES - Game.lives));
    ctx.font = 'bold 14px monospace';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(filled, hx, hy + 14);
    ctx.fillStyle = '#e5484d';
    ctx.fillText(filled, hx, hy + 14);
    ctx.strokeText(empty, hx + filled.length * 9, hy + 14);
    ctx.fillStyle = '#6a6a72';
    ctx.fillText(empty, hx + filled.length * 9, hy + 14);

    // progreso hacia la próxima vida (cada 100 monedas)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(hx - 4, hy + 22, 104, 9);
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(hx - 2, hy + 24, 100, 5);
    const pc = Game.coinsEarned % CONFIG.COINS_PER_LIFE;
    ctx.fillStyle = '#ffd23c';
    ctx.fillRect(hx - 2, hy + 24, Math.max(0, 100 * (pc / CONFIG.COINS_PER_LIFE)), 5);
    ctx.font = 'bold 8px monospace';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const ptxt = Game.lives >= CONFIG.MAX_LIVES ? 'MÁXIMO' : pc + '/' + CONFIG.COINS_PER_LIFE;
    ctx.strokeText(ptxt, hx - 2, hy + 31);
    ctx.fillStyle = '#ffd23c';
    ctx.fillText(ptxt, hx - 2, hy + 31);

    // ---- Nivel y distancia ----
    const lv = Game.levelIndex + 1;
    const lvName = Game.currentLevel().name;
    ctx.font = 'bold 12px monospace';
    ctx.strokeText('NIVEL ' + lv + ' · ' + lvName, bx, 48);
    ctx.fillStyle = '#fff';
    ctx.fillText('NIVEL ' + lv + ' · ' + lvName, bx, 48);
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
      const msg = 'CUBANITO · ' + CONFIG.CUBANITO_PRICE + ' MONEDAS · ¡ACERCATE Y COMELO!';
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

  showLevelBanner(extra) {
    const lv = Game.levelIndex + 1;
    const sub = extra || '¡A correr! Esquiva pozos y autos, patea palomas y junta monedas.';
    this.show('', `
      <div class="overlay-box">
        <h1>NIVEL ${lv}</h1>
        <p class="subtitle" style="font-size:22px">${Game.currentLevel().name}</p>
        <p class="subtitle">${sub}</p>
      </div>
    `);
  },

  showGameOver() {
    AudioSys.death();
    const dist = Math.floor(Game.player.distance / 10);
    const lv = Game.levelIndex + 1;
    this.show('', `
      <div class="overlay-box">
        <h1 style="color:#e5484d">GAME OVER</h1>
        <p class="subtitle">Las palomas ganaron esta vez...</p>
        <div class="stats">
          🏃 Distancia: ${dist} m<br>
          🪙 Monedas: ${Game.player.coins}<br>
          ❤ Vidas: ${Game.lives}<br>
          🏁 Nivel: ${lv} · ${Game.currentLevel().name}
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
    const lv = Game.levelIndex + 1;
    const last = Game.levelIndex >= CONFIG.LEVELS.length - 1;
    const title = last ? '¡JUEGO COMPLETADO!' : '¡NIVEL COMPLETADO!';
    const sub = last ? '¡Recorriste toda la Bahía Blanca!' : 'Siguiente parada: ' + CONFIG.LEVELS[Math.min(Game.levelIndex + 1, CONFIG.LEVELS.length - 1)].name;
    this.show('', `
      <div class="overlay-box">
        <h1 style="color:#4ae04a">${title}</h1>
        <p class="subtitle">${sub}</p>
        <div class="stats">
          🏃 Distancia: ${dist} m<br>
          🪙 Monedas: ${Game.player.coins}<br>
          ❤ Vidas: ${Game.lives}<br>
          🏁 Nivel: ${lv} · ${Game.currentLevel().name}
        </div>
        <button class="btn" id="btn-retry">${last ? '↻ Jugar de nuevo' : '▶ Siguiente nivel'}</button>
        <button class="btn btn-secondary" id="btn-menu">Menú</button>
      </div>
    `);
    const retry = document.getElementById('btn-retry');
    const menu = document.getElementById('btn-menu');
    if (retry) retry.addEventListener('click', () => {
      if (last) { Game.resetAll(); }
      Game.start();
    });
    if (menu) menu.addEventListener('click', () => { Game.resetAll(); UI.showTitle(); });
  },
};
