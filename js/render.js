// ============================================================
// render.js — Dibujo de la escena urbana (estilo 16-bit / Sega)
// ============================================================

const Render = {
  skyPixels: null,

  buildSky() {
    // cielo con bandas de gradiente + dithering 2 px (look retro)
    const c = document.createElement('canvas');
    c.width = CONFIG.VW; c.height = CONFIG.VH;
    const ctx = c.getContext('2d');
    const stops = [
      [0, '#4aa5e8'], [40, '#5fb2ec'], [80, '#7cc3f2'],
      [120, '#a0d6f7'], [170, '#c4e8fb'], [225, '#e2f4fd'],
      [300, '#eef8fc'],
    ];
    for (let y = 0; y < CONFIG.VH; y++) {
      let col = stops[0][1];
      for (let i = 0; i < stops.length - 1; i++) {
        if (y >= stops[i][0] && y <= stops[i + 1][0]) {
          const t = (y - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
          col = mix(stops[i][1], stops[i + 1][1], t);
        }
      }
      ctx.fillStyle = col;
      ctx.fillRect(0, y, CONFIG.VW, 1);
    }
    // dithering horizontal en franjas (textura pixelada)
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = 0; y < CONFIG.VH; y += 8) {
      for (let x = (y / 8) % 2; x < CONFIG.VW; x += 4) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
    this.skyPixels = c;
  },

  // hash determinista
  hash(n) {
    let h = n * 374761393;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h >>> 0);
  },

  drawScene(ctx) {
    if (!this.skyPixels) this.buildSky();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.skyPixels, 0, 0);

    // sol con halo
    ctx.fillStyle = '#fff2b0';
    ctx.fillRect(516, 20, 28, 28);
    ctx.fillStyle = '#ffe9a0';
    ctx.fillRect(512, 24, 36, 18);
    // nubes (desplazamiento lento)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const nc = Math.floor((Game.cameraX * 0.3) % 360);
    for (let i = 0; i < 3; i++) {
      const bx = ((i * 220 - nc + 360) % 360) - 60;
      ctx.fillRect(bx, 30 + (i % 2) * 26, 48, 8);
      ctx.fillRect(bx + 8, 26 + (i % 2) * 26, 28, 6);
    }

    this.drawBuildings(ctx);
    this.drawCrosswalks(ctx);
    this.drawStreet(ctx);
    this.drawSidewalks(ctx);

    // árboles y farolas
    for (const d of Game.deco) {
      const feetY = CONFIG.LANES[d.lane].feetY;
      const spr = d.type === 'tree' ? SPR.tree : SPR.lamp;
      drawSprite(ctx, spr, screenX(d.x), feetY, { scale: 4, pivot: 'bottom' });
    }
  },

  drawBuildings(ctx) {
    const TILE = 130;
    const start = Math.floor(Game.cameraX / TILE) - 1;
    const end = start + Math.ceil(CONFIG.VW / TILE) + 2;
    const palettes = [
      ['#dcb98c', '#c9a474'], ['#a8bcd0', '#8fa6bd'], ['#cf9a82', '#bd8570'],
      ['#bcc39e', '#a7ae86'], ['#ddcca4', '#c9b88e'], ['#9dbab2', '#88a59d'],
    ];
    for (let i = start; i <= end; i++) {
      const h = this.hash(i);
      const p = palettes[h % palettes.length];
      const sx = i * TILE - Game.cameraX;
      const bw = TILE - 12;
      const bh = 94 + (h % 38); // altura variable del edificio

      // cuerpo del edificio
      ctx.fillStyle = p[0];
      ctx.fillRect(sx, 20, bw, 112);
      // costado en sombra
      ctx.fillStyle = p[1];
      ctx.fillRect(sx + bw - 12, 20, 12, 112);
      // base
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(sx, 122, bw, 10);

      // parapeto / cornisa (2 tonos)
      ctx.fillStyle = p[1];
      ctx.fillRect(sx - 3, 14, bw + 6, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(sx - 3, 20, bw + 6, 2);

      // textura de ladrillos (ruido determinista)
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let k = 0; k < 16; k++) {
        const n = this.hash(i * 97 + k);
        ctx.fillRect(sx + (n % (bw - 8)), 26 + ((k * 7) % 90), 3, 2);
      }

      // ventanas
      const lit = (h >> 5) % 4 !== 0;
      const winCol = lit ? '#ffd76e' : '#2c3a4e';
      for (let wy = 0; wy < 3; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          const wx0 = sx + 14 + wx * 52;
          const wy0 = 34 + wy * 28;
          ctx.fillStyle = '#6a5a48';
          ctx.fillRect(wx0 - 2, wy0 - 2, 24, 24);   // marco
          ctx.fillStyle = winCol;
          ctx.fillRect(wx0, wy0, 20, 20);           // vidrio
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(wx0 + 9, wy0, 2, 20);        // marco central
          ctx.fillRect(wx0, wy0 + 9, 20, 2);
          // repisa
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(wx0 - 2, wy0 + 22, 24, 2);
        }
      }

      // toldo a rayas sobre comercio
      if ((h >> 8) % 3 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(sx + 6, 86, bw - 12, 16);
        for (let s2 = 0; s2 < bw - 12; s2 += 8) {
          ctx.fillStyle = (s2 / 8) % 2 === 0 ? '#e5484d' : '#f5f5f0';
          ctx.fillRect(sx + 6 + s2, 86, 8, 16);
        }
        ctx.fillStyle = '#e5484d';
        ctx.fillRect(sx + 6, 102, bw - 12, 4);
      }

      // cartel de comercio
      if ((h >> 10) % 2 === 0) {
        const names = ['FARMACIA', 'KIOSKO', 'PANADERIA', 'LIBRERIA', 'GELATERIA', 'VERDULERIA', 'CARNICERIA', 'FOTOC BAHIA'];
        const name = names[(h >> 12) % names.length];
        ctx.fillStyle = '#e5484d';
        ctx.fillRect(sx + 8, 66, bw - 16, 16);
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(sx + 8, 80, bw - 16, 3);
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(name, sx + bw / 2, 78);
        ctx.textAlign = 'left';
      }

      // aire acondicionado
      if ((h >> 14) % 4 === 0) {
        ctx.fillStyle = '#9aa7b8';
        ctx.fillRect(sx + bw - 30, 44, 18, 12);
        ctx.fillStyle = '#76808f';
        ctx.fillRect(sx + bw - 30, 44, 18, 3);
      }
    }
  },

  drawCrosswalks(ctx) {
    const EVERY = 700;
    const start = Math.floor((Game.cameraX + 400) / EVERY);
    const end = Math.floor((Game.cameraX + CONFIG.VW + 400) / EVERY) + 1;
    for (let i = start; i <= end; i++) {
      const sx = i * EVERY - Game.cameraX - 400;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let s = 0; s < 5; s++) {
        ctx.fillRect(sx + 8 + s * 15, 164, 9, 52);
      }
    }
  },

  drawStreet(ctx) {
    // calle (asfalto)
    ctx.fillStyle = '#46464e';
    ctx.fillRect(0, 152, CONFIG.VW, 76);
    // textura de asfalto
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    const off = (Game.cameraX * 0.7) % 60;
    for (let x = -off; x < CONFIG.VW; x += 60) {
      ctx.fillRect(x + 10, 158 + ((x * 7) % 12), 22, 4);
      ctx.fillRect(x + 34, 170 + ((x * 5) % 14), 16, 3);
    }
    // cordones
    ctx.fillStyle = '#94949c';
    ctx.fillRect(0, 152, CONFIG.VW, 5);
    ctx.fillRect(0, 223, CONFIG.VW, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 157, CONFIG.VW, 2);
    ctx.fillRect(0, 228, CONFIG.VW, 2);
    // línea central
    ctx.fillStyle = '#e8d23c';
    const off2 = (Game.cameraX) % 44;
    for (let x = -off2; x < CONFIG.VW; x += 44) {
      ctx.fillRect(x, 186, 22, 4);
    }
  },

  drawSidewalks(ctx) {
    this.paintSidewalk(ctx, 130, 22, '#bdb6ab', '#a9a297');
    this.paintSidewalk(ctx, 228, 84, '#b0a99e', '#9c958a');
    // borde inferior
    ctx.fillStyle = '#46464e';
    ctx.fillRect(0, 312, CONFIG.VW, CONFIG.VH - 312);
    ctx.fillStyle = '#94949c';
    ctx.fillRect(0, 312, CONFIG.VW, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 317, CONFIG.VW, 2);
  },

  paintSidewalk(ctx, y, h, colA, colB) {
    // baldosas en damero (como las de Bahía Blanca)
    const tile = 16;
    const off = (Game.cameraX) % (tile * 2);
    for (let ty = 0; ty < h; ty += tile) {
      for (let tx = -off; tx < CONFIG.VW; tx += tile * 2) {
        const even = ((ty / tile) % 2 === 0);
        ctx.fillStyle = (tx + off) % (tile * 2) === 0 ? (even ? colA : colB) : (even ? colB : colA);
        ctx.fillRect(tx, y + ty, tile, Math.min(tile, h - ty));
      }
    }
    // juntas
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let ty = 0; ty < h; ty += tile) {
      ctx.fillRect(0, y + ty, CONFIG.VW, 2);
    }
    const off2 = (Game.cameraX) % tile;
    for (let tx = -off2; tx < CONFIG.VW; tx += tile) {
      ctx.fillRect(tx, y, 2, h);
    }
  },
};

// mezcla dos colores hex
function mix(c1, c2, t) {
  const rd = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const a = rd(c1), b = rd(c2);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
}
