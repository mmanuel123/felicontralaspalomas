// ============================================================
// render.js — Dibujo de la escena urbana (estilo 16-bit / Sega)
// ============================================================

// Paletas por momento del día: día (ALSINA), tardecita (BELGRANO), noche (LAS HERAS)
const THEMES = {
  day: {
    sky: [
      [0, '#4aa5e8'], [40, '#5fb2ec'], [80, '#7cc3f2'],
      [120, '#a0d6f7'], [170, '#c4e8fb'], [225, '#e2f4fd'], [300, '#eef8fc'],
    ],
    stars: 0,
    sun: { x: 516, y: 20, glow: false },
    moon: null,
    clouds: true, cloudAlpha: 0.9,
    windowLitPct: 75, windowLit: '#ffd76e',
    buildings: [
      ['#dcb98c', '#c9a474'], ['#a8bcd0', '#8fa6bd'], ['#cf9a82', '#bd8570'],
      ['#bcc39e', '#a7ae86'], ['#ddcca4', '#c9b88e'], ['#9dbab2', '#88a59d'],
    ],
    street: '#46464e', cordon: '#94949c', centerLine: '#e8d23c',
    crosswalk: 'rgba(255,255,255,0.85)',
    sidewalk: ['#bdb6ab', '#a9a297', '#b0a99e', '#9c958a'],
    ambient: null, lampGlow: false,
  },
  dusk: {
    sky: [
      [0, '#58467a'], [45, '#8a5278'], [90, '#c96a5a'], [140, '#f08a4a'],
      [200, '#ffb060'], [260, '#ffd090'], [310, '#ffe3b0'],
    ],
    stars: 0,
    sun: { x: 452, y: 112, glow: true },
    moon: null,
    clouds: true, cloudAlpha: 0.35,
    windowLitPct: 85, windowLit: '#ffe9a0',
    buildings: [
      ['#6b5878', '#5a4a68'], ['#7a6a7f', '#685a6e'], ['#8a6a5a', '#775a4c'],
      ['#6a6a7a', '#5a5a6a'], ['#7d6a7d', '#6a5a6a'], ['#6a7a8a', '#5a6a7a'],
    ],
    street: '#3c3c46', cordon: '#8a8a92', centerLine: '#c8b03a',
    crosswalk: 'rgba(255,230,200,0.70)',
    sidewalk: ['#8a8378', '#7a7368', '#7f786d', '#6f685d'],
    ambient: 'rgba(255,110,40,0.05)', lampGlow: false,
  },
  night: {
    sky: [
      [0, '#05070f'], [55, '#0b1328'], [120, '#12203f'], [200, '#1a2c55'],
      [270, '#203362'], [315, '#263a6e'],
    ],
    stars: 90,
    sun: null,
    moon: { x: 500, y: 26 },
    clouds: false, cloudAlpha: 0,
    windowLitPct: 95, windowLit: '#ffe08a',
    buildings: [
      ['#141a30', '#101528'], ['#1a2038', '#141a2e'], ['#161c34', '#121830'],
      ['#12182c', '#0e1426'], ['#182038', '#141c30'], ['#101628', '#0c1222'],
    ],
    street: '#1e1e26', cordon: '#5a5a62', centerLine: '#7a6a20',
    crosswalk: 'rgba(255,255,255,0.5)',
    sidewalk: ['#3a3a42', '#33333a', '#35353c', '#2e2e35'],
    ambient: 'rgba(10,20,55,0.20)', lampGlow: true,
  },
};

const Render = {
  skyCache: {},

  // tema del nivel actual ('day' | 'dusk' | 'night')
  theme() {
    const lv = Game.currentLevel();
    return THEMES[(lv && lv.theme) || 'day'] || THEMES.day;
  },

  buildSky(key) {
    // cielo con bandas de gradiente + dithering 2 px (look retro)
    const theme = THEMES[key] || THEMES.day;
    const c = document.createElement('canvas');
    c.width = CONFIG.VW; c.height = CONFIG.VH;
    const ctx = c.getContext('2d');
    const stops = theme.sky;
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
    this.skyCache[key] = c;
  },

  // hash determinista
  hash(n) {
    let h = n * 374761393;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h >>> 0);
  },

  drawScene(ctx) {
    const theme = this.theme();
    const tkey = Game.currentLevel().theme || 'day';
    if (!this.skyCache[tkey]) this.buildSky(tkey);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.skyCache[tkey], 0, 0);

    // estrellas (noche)
    if (theme.stars > 0) this.drawStars(ctx, theme.stars);

    // sol (día/tardecita) o luna (noche)
    if (theme.sun) this.drawSun(ctx, theme.sun);
    if (theme.moon) this.drawMoon(ctx, theme.moon);

    // nubes (ninguna de noche)
    if (theme.clouds) this.drawClouds(ctx, theme.cloudAlpha);

    this.drawBuildings(ctx, theme);
    this.drawCrosswalks(ctx, theme);
    this.drawStreet(ctx, theme);
    this.drawSidewalks(ctx, theme);

    // árboles y farolas (con brillo nocturno)
    for (const d of Game.deco) {
      const feetY = CONFIG.LANES[d.lane].feetY;
      const sx = screenX(d.x);
      const spr = d.type === 'tree' ? SPR.tree : SPR.lamp;
      if (theme.lampGlow && d.type === 'lamp') this.drawLampGlow(ctx, sx, feetY);
      drawSprite(ctx, spr, sx, feetY, { scale: 4, pivot: 'bottom' });
    }

    // overlay ambiental de la hora del día (sobre la ciudad, bajo los actores)
    if (theme.ambient) {
      ctx.fillStyle = theme.ambient;
      ctx.fillRect(0, 0, CONFIG.VW, CONFIG.VH);
    }
  },

  drawSun(ctx, s) {
    if (s.glow) {
      ctx.fillStyle = 'rgba(255,170,90,0.25)';
      ctx.fillRect(s.x - 44, s.y - 26, 96, 64);
      ctx.fillStyle = 'rgba(255,190,110,0.35)';
      ctx.fillRect(s.x - 26, s.y - 14, 60, 42);
    }
    ctx.fillStyle = s.glow ? '#ffcc88' : '#fff2b0';
    ctx.fillRect(s.x, s.y, 28, 28);
    if (!s.glow) {
      ctx.fillStyle = '#ffe9a0';
      ctx.fillRect(s.x - 4, s.y + 4, 36, 18);
    }
  },

  drawMoon(ctx, m) {
    ctx.fillStyle = '#e8ecf8';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(170,180,205,0.8)';
    ctx.fillRect(m.x - 7, m.y - 4, 5, 4);
    ctx.fillRect(m.x + 4, m.y + 5, 4, 4);
    ctx.fillRect(m.x - 2, m.y + 8, 3, 3);
  },

  drawStars(ctx, count) {
    const off = (Game.cameraX * 0.05) % CONFIG.VW;
    for (let i = 0; i < count; i++) {
      const h = this.hash(i * 7919 + 7);
      const x = (h % CONFIG.VW + off) % CONFIG.VW;
      const y = (h >> 8) % 150;
      const s = (h >> 16) % 2 === 0 ? 1 : 2;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + ((h >> 20) % 5) * 0.12) + ')';
      ctx.fillRect(Math.floor(x), y, s, s);
    }
  },

  drawClouds(ctx, alpha) {
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    const nc = Math.floor((Game.cameraX * 0.3) % 360);
    for (let i = 0; i < 3; i++) {
      const bx = ((i * 220 - nc + 360) % 360) - 60;
      ctx.fillRect(bx, 30 + (i % 2) * 26, 48, 8);
      ctx.fillRect(bx + 8, 26 + (i % 2) * 26, 28, 6);
    }
  },

  drawLampGlow(ctx, x, feetY) {
    ctx.fillStyle = 'rgba(255,225,130,0.10)';
    ctx.fillRect(x - 26, feetY - 110, 52, 100);
    ctx.fillStyle = 'rgba(255,225,130,0.18)';
    ctx.fillRect(x - 14, feetY - 92, 28, 80);
  },

  drawBuildings(ctx, theme) {
    const TILE = 130;
    const start = Math.floor(Game.cameraX / TILE) - 1;
    const end = start + Math.ceil(CONFIG.VW / TILE) + 2;
    const palettes = theme.buildings;
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

      // ventanas: más iluminadas de noche/tardecita
      const lit = (h >> 5) % 100 < theme.windowLitPct;
      const winCol = lit ? theme.windowLit : '#2c3a4e';
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
        const stores = Game.currentLevel().stores;
        const name = stores[(h >> 12) % stores.length];
        this.drawStoreSign(ctx, sx, bw, name);
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

  // Cartel de comercio con el nombre de la calle/nivel.
  // Ajusta la fuente y usa dos líneas si el nombre es largo.
  drawStoreSign(ctx, sx, bw, name) {
    const w = bw - 16;
    ctx.fillStyle = '#e5484d';
    ctx.fillRect(sx + 8, 64, w, 24);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(sx + 8, 86, w, 3);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const avail = w - 10;
    let line1 = name, line2 = null;
    if (name.length > 14) {
      const sp = name.lastIndexOf(' ', 14);
      if (sp > 3) { line1 = name.slice(0, sp); line2 = name.slice(sp + 1); }
    }
    const fs = Math.max(6, Math.min(8, Math.floor((avail - 2) / Math.max(line1.length, line2 ? line2.length : 1))));
    ctx.font = fs + 'px monospace';
    if (line2) {
      ctx.fillText(line1, sx + bw / 2, 75);
      ctx.fillText(line2, sx + bw / 2, 84);
    } else {
      ctx.fillText(line1, sx + bw / 2, 80);
    }
    ctx.textAlign = 'left';
  },

  drawCrosswalks(ctx, theme) {
    const EVERY = 700;
    const start = Math.floor((Game.cameraX + 400) / EVERY);
    const end = Math.floor((Game.cameraX + CONFIG.VW + 400) / EVERY) + 1;
    for (let i = start; i <= end; i++) {
      const sx = i * EVERY - Game.cameraX - 400;
      ctx.fillStyle = theme.crosswalk;
      for (let s = 0; s < 5; s++) {
        ctx.fillRect(sx + 8 + s * 15, 164, 9, 52);
      }
    }
  },

  drawStreet(ctx, theme) {
    // calle (asfalto)
    ctx.fillStyle = theme.street;
    ctx.fillRect(0, 152, CONFIG.VW, 76);
    // textura de asfalto
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    const off = (Game.cameraX * 0.7) % 60;
    for (let x = -off; x < CONFIG.VW; x += 60) {
      ctx.fillRect(x + 10, 158 + ((x * 7) % 12), 22, 4);
      ctx.fillRect(x + 34, 170 + ((x * 5) % 14), 16, 3);
    }
    // cordones
    ctx.fillStyle = theme.cordon;
    ctx.fillRect(0, 152, CONFIG.VW, 5);
    ctx.fillRect(0, 223, CONFIG.VW, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 157, CONFIG.VW, 2);
    ctx.fillRect(0, 228, CONFIG.VW, 2);
    // línea central
    ctx.fillStyle = theme.centerLine;
    const off2 = (Game.cameraX) % 44;
    for (let x = -off2; x < CONFIG.VW; x += 44) {
      ctx.fillRect(x, 186, 22, 4);
    }
  },

  drawSidewalks(ctx, theme) {
    this.paintSidewalk(ctx, 130, 22, theme.sidewalk[0], theme.sidewalk[1]);
    this.paintSidewalk(ctx, 228, 84, theme.sidewalk[2], theme.sidewalk[3]);
    // borde inferior
    ctx.fillStyle = theme.street;
    ctx.fillRect(0, 312, CONFIG.VW, CONFIG.VH - 312);
    ctx.fillStyle = theme.cordon;
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
