// ============================================================
// sprites.js — Sprites pixel art (estilo retro/16-bit)
// Se definen con mapas de texto y paletas de colores.
// ============================================================

const SPR = {};

// Convierte mapa de texto en canvas (alinea todas las filas a la misma anchura).
// Si se pasa outlineColor, agrega un contorno de 1px alrededor de la silueta.
function makeSprite(rows, palette, scale, outlineColor) {
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const off = outlineColor ? 1 : 0;
  const c = document.createElement('canvas');
  c.width = w + off * 2; c.height = h + off * 2;
  const ctx = c.getContext('2d');

  const filled = new Array(h * w).fill(false);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || ch === undefined) continue;
      if (!palette[ch]) continue;
      filled[y * w + x] = true;
    }
  }

  if (outlineColor) {
    ctx.fillStyle = outlineColor;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!filled[y * w + x]) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !filled[ny * w + nx]) {
            ctx.fillRect(x + off + dx, y + off + dy, 1, 1);
          }
        }
      }
    }
  }

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || ch === undefined) continue;
      const col = palette[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x + off, y + off, 1, 1);
    }
  }
  return { canvas: c, w: w + off * 2, h: h + off * 2, scale };
}

function drawSprite(ctx, spr, x, y, opts) {
  opts = opts || {};
  const s = opts.scale !== undefined ? opts.scale : (spr.scale || 4);
  const flip = opts.flip || false;
  const dw = spr.w * s, dh = spr.h * s;
  const px = opts.pivot === 'center' ? x - dw / 2 : x;
  const py = opts.pivot === 'bottom' ? y - dh : y;
  if (flip) {
    ctx.save();
    ctx.translate(px + dw, py);
    ctx.scale(-1, 1);
    ctx.drawImage(spr.canvas, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(spr.canvas, px, py, dw, dh);
  }
  return { w: dw, h: dh, x: px, y: py };
}

function flipRows(rows) {
  return rows.map(r => r.split('').reverse().join(''));
}

// ============================================================
// PERSONAJE — niño rubio con anteojos de marco azul
// ============================================================
const P_PLAYER = {
  H: '#f5c542', h: '#d9a02c', // pelo rubio (claro/oscuro)
  S: '#ffd9b3', s: '#e6b98c', // piel
  B: '#3a6ff0', b: '#2a4fae', // marco anteojos azul
  W: '#eaf4ff',               // vidrio
  K: '#20242e',               // pupila / contorno
  T: '#e5484d', t: '#b5373b', // remera roja
  P: '#2f5fd0', p: '#22428f', // pantalón azul
  R: '#f0a030', r: '#c67a1e', // zapatillas
};

const HEAD = [
  '..HHHHHHHHHHH...',
  '.HHHHHHHHHHHHH..',
  '.HHHHHHHHHHHHH..',
  '.HHHHSSSSSSSHH..',
  '.HHHSSSSSSSSSH..',
  '.HHBBBBBBBBBBH..',
  '.HHBWKWB.BWKWBH.',
  '.HHBBBBBBBBBBH..',
  '.HHSSSSSSSSSSH..',
  '.HHHHSSSSSSSHH..',
];
const TORSO_F = [   // brazo adelante
  '.HHSSSSSSSSS....',
  '.TTTTTTTTTTSS...',
  'TTTTTTTTTTSS....',
  'TTTTTTTTTTSS....',
];
const TORSO_B = [   // brazo atrás
  '.HHSSSSSSSSS....',
  '.TTTTTTTTTTT....',
  'TTTTTTTTTT......',
  'TTTTTTTTTT......',
];
const LEGS_A = [
  '..PPPPPPPPPP....',
  '..PP.....PP.....',
  '..PP.....PP.....',
  '..PP......PP....',
  '..PP......PP....',
  '..RR......PP....',
  '..RR.......RR...',
  '..........RR....',
];
const LEGS_B = [
  '..PPPPPPPPPP....',
  '...PP....PP.....',
  '...PP....PP.....',
  '...PP....PP.....',
  '...PP....PP.....',
  '...RR....PP.....',
  '...RR....RR.....',
  '.........RR.....',
];
const LEGS_C = [
  '..PPPPPPPPPP....',
  '....PP....PP....',
  '....PP....PP....',
  '....PP.....PP...',
  '....PP.....PP...',
  '....PP.....RR...',
  '....PP.....RR...',
  '...RR...........',
];
const LEGS_JUMP = [
  '..PPPPPPPPPP....',
  '..PP....PP......',
  '..PP....PP......',
  '..PP....PP......',
  '.PP......PP.....',
  '.RR......RR.....',
  '.RR......RR.....',
  '................',
];
const LEGS_KICK = [
  '..PPPPPPPPPP....',
  '..PP....PP......',
  '..PP....PP......',
  '..PP.....PP.....',
  '.RR......PP.....',
  '.RR.......RR....',
  '...........RR...',
  '.............RR.',
];
const PLAYER_LIE = [
  '................',
  '..HHHHHHH.......',
  '.HHHHHHHHH......',
  '.HSSSSSSSSH.....',
  '.HSBBBBBBSS.....',
  '.HSBWWKBBSS.....',
  '.HHHHHSSSS......',
  '..TTTTTTTTTT....',
  '.TTTTTTTTTTTT...',
  '.TTTTTTTTTTTT...',
  '.SSSSSSSSSSSS...',
  '.PPPPPPPPPPPP...',
  '..PP....PP......',
  '..PP....PP......',
  '..RR....RR......',
];

function buildPlayer(scale) {
  const frames = [];
  const combos = [
    [TORSO_F, LEGS_A], [TORSO_B, LEGS_B], [TORSO_F, LEGS_C],
    [TORSO_B, LEGS_B], [TORSO_F, LEGS_A], [TORSO_B, LEGS_C],
  ];
  const OUTLINE = '#10131c';
  for (const [t, l] of combos) {
    frames.push(makeSprite(HEAD.concat(t, l), P_PLAYER, scale, OUTLINE));
  }
  SPR.player = {
    run: frames,
    jump: makeSprite(HEAD.concat(TORSO_B, LEGS_JUMP), P_PLAYER, scale, OUTLINE),
    fall: makeSprite(HEAD.concat(TORSO_B, LEGS_JUMP), P_PLAYER, scale, OUTLINE),
    kick: makeSprite(HEAD.concat(TORSO_F, LEGS_KICK), P_PLAYER, scale, OUTLINE),
    hurt: makeSprite(HEAD.concat(TORSO_B, LEGS_A), P_PLAYER, scale, OUTLINE),
    dead: makeSprite(PLAYER_LIE, P_PLAYER, scale, OUTLINE),
  };
}

// ============================================================
// PALOMA
// ============================================================
const P_PIGEON = {
  W: '#cfd6df', w: '#aab2bc', // cuerpo gris
  D: '#4e5a66', d: '#39434e', // ala
  O: '#ff9a3c',               // pico
  E: '#20242e',               // ojo
  R: '#b23a3a',               // patas
};
// Paloma (13x7, mirando hacia la izquierda): cabeza con pico y ojo,
// cuerpo redondeado, ala y cola. Escala 2 => 26x14px (más chica que la cabeza del personaje).
const PIGEON_A = [
  '....WWW......',
  '...WWWWWW....',
  '..OEWWWWWW...',
  '..WWDDDDDWW..',
  '.WWWWWWWWWWW.',
  '..RRW...WR...',
  '...W.....W...',
];
const PIGEON_B = [
  '...WWWWW.....',
  '..WWWWWWWW...',
  '.OEWWWWWWWW..',
  '.WWDDDDDDWW..',
  '..WWWWWWWW...',
  '..RRW...WR...',
  '...W.....W...',
];
const PIGEON_SQUAT = [
  '....WWW......',
  '...WWWWWW....',
  '..OEWWWWWWW..',
  '..WWWWWWWWW..',
  '.WWWWWWWWWWW.',
  '..RRWWWWWWR..',
  '.....WW......',
];
const PIGEON_DEAD = [
  '....WWWWW....',
  '..WWWWWWWWW..',
  '.WWWDDDDDWWW.',
  '.WWWWWWWWWWW.',
  '..WWWWWWWWW..',
  '...RRWWWWR...',
  '...W.....W...',
];

// ============================================================
// AUTOS — Ford Falcon (destruido) y VW Amarok
// ============================================================
const P_CAR = {
  B: '#e5484d', b: '#b5373b', // carrocería roja
  G: '#9aa7b8', g: '#76808f', // vidrio claro (techo)
  W: '#dfe8f2',               // ventanas
  R: '#a05030', r: '#7a3a20', // óxido (falcon destruido)
  K: '#20242e',               // ruedas
  D: '#5a5a66',               // bajos
  M: '#c9cdd4',               // metal/paragolpes
  Y: '#ffd23c',               // faro delantero
  T: '#d85040',               // luz trasera
};
const P_AMAROK = {
  B: '#9aa7b8', b: '#76808f', // carrocería plateada
  G: '#dfe8f2', g: '#c2ccd8', // vidrio
  W: '#dfe8f2',
  R: '#6e5a3a',               // carga
  K: '#20242e',
  D: '#4a4a56',
  M: '#c9cdd4',
  H: '#3a3a48',               // estacas de la caja
  Y: '#ffd23c',               // faro delantero
  T: '#d85040',               // luz trasera
};

// Falcon destruido — sedán clásico (28x9, mirando a la izquierda):
// capó largo, parabrisas en pendiente, cabina con luneta, baúl y paragolpes.
const FALCON = [
  '......WWWWWWWW..............',
  '.....WWWWWWWWWWWWW..........',
  '...WWWWWWWWWWWWWWWWWW.......',
  '.BBWWWWWW..........WWWWBB...',
  'YBBBBBBBBBBBBBBBBBBBBBBBBT.',
  'YBBBBBBBBBBBBBBBBBBBBBBBBT.',
  'MMBBBBBRRBBBBBBBBBRRBBBBBBM.',
  '..KKKKKKKKKKKKKKKKKKKKKKKK..',
  '..OO.............OO.........',
];
// Amarok — pick-up (26x9, mirando a la izquierda):
// cabina con vidrios adelante, caja abierta atrás con estacas y carga.
const AMAROK = [
  '.....GGGGGG...............',
  '..WWWWWWWWWWWW............',
  '.WWWWWWWWWWWWWW...........',
  '.BBWWWWWW......HH.HH.HH...',
  'YBBBBBBBBBBBBBBBBBBBBBBBB.',
  'BBBBBBBBBBBBCCCCCCBBBBBBR.',
  'BBBBBBBBBBBBWWWWWWBBBBBBB.',
  'KKKKKKKKKKKKKKKKKKKKKKKKK.',
  '.OO.............OO........',
];

function buildCars(scale) {
  const OUTLINE = '#10131c';
  const falconL = makeSprite(FALCON, P_CAR, scale, OUTLINE);
  const amarokL = makeSprite(AMAROK, P_AMAROK, scale, OUTLINE);
  SPR.carLeftFalcon = falconL;
  SPR.carLeftAmarok = amarokL;
  SPR.carRightFalcon = makeSprite(flipRows(FALCON), P_CAR, scale, OUTLINE);
  SPR.carRightAmarok = makeSprite(flipRows(AMAROK), P_AMAROK, scale, OUTLINE);
}

// ============================================================
// PEATÓN
// ============================================================
const P_PED1 = {
  S: '#e8b88c', H: '#4a3218', T: '#3fae5a', P: '#5a5a6e', R: '#3a3a4a',
};
const P_PED2 = {
  S: '#c98c5a', H: '#20242e', T: '#e9a23c', P: '#7a6a4a', R: '#3a3a4a',
};
const PEDESTRIAN_A = [
  '...HHHHH....',
  '..HHHHHHH...',
  '..HSSSSSH...',
  '..HSSSSSH...',
  '..HSSSSSH...',
  '...HSSSH....',
  '..TTTTTTT...',
  '..TTTTTTT...',
  '..SSSSSSS...',
  '..PP...PP...',
  '.RR.....RR..',
];
const PEDESTRIAN_B = [
  '...HHHHH....',
  '..HHHHHHH...',
  '..HSSSSSH...',
  '..HSSSSSH...',
  '..HSSSSSH...',
  '...HSSSH....',
  '..TTTTTTT...',
  '..TTTTTTT...',
  '..SSSSSSS...',
  '.PP.....PP..',
  '.RR.....RR..',
];

// ============================================================
// POZO / MONEDA / CACA / CUBANITOS / URBANO
// ============================================================
const P_POTHOLE = {
  D: '#33291f', d: '#554433', W: '#6e6e7a',
};
const POTHOLE = [
  '.WWWWWWWWWW.',
  'WDDDDDDDDDDW',
  'WDDddddddDDW',
  'WDDddddddDDW',
  'WDDddddddDDW',
  '.WWWWWWWWWW.',
];

const P_COIN = { Y: '#ffd23c', y: '#e0a51f', W: '#fff3c0' };
const COIN_F1 = [
  '...YYYY...',
  '..YYYYYY..',
  '.YYWWWWYY.',
  '.YYWWWWYY.',
  '..YYYYYY..',
  '...YYYY...',
];
const COIN_F2 = [
  '..YYYYY...',
  '..YYYYY...',
  '.YYWWWYY..',
  '.YYWWWYY..',
  '..YYYYY...',
  '..YYYYY...',
];
const COIN_F3 = [
  '....YY....',
  '...YYYY...',
  '...YWWY...',
  '...YWWY...',
  '...YYYY...',
  '....YY....',
];

const P_POOP = { W: '#e8e2d8', w: '#c9c2b5' };
const POOP = [
  '...W...',
  '..WWW..',
  '..WWW..',
  '..W.W..',
];

const P_STAND = {
  G: '#7a8a4a', g: '#5c6a36',
  W: '#efe6d0',
  C: '#c9922f', c: '#a8761f',
  R: '#8a5a2f',
  K: '#20242e',
  T: '#e5484d',
};
const STAND = [
  '..GGGGGGGGGGGGGG..',
  '.GGGGGGGGGGGGGGGG.',
  '.GGGGGGGGGGGGGGGG.',
  '.gggggggggggggggg.',
  '..WWWWWWWWWWWWWW..',
  '..WCCWCCWCCWCCW...',
  '..WCCWCCWCCWCCW...',
  '..WCCWCCWCCWCCW...',
  '.TTTTTTTTTTTTTT..',
  '.T....T.T....T...',
  '.R....R.R....R...',
  '.RR..RR.RR..RR...',
];

const P_TREE = {
  G: '#2f9e44', g: '#1f7a30', T: '#8a5a2f', t: '#6e4524',
};
const TREE = [
  '.....GGGG.....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '..GGGGGGGGGG..',
  '...GGggGGgg...',
  '..GGGGGGGGGG..',
  '.....T..T.....',
  '......TT......',
  '......TT......',
];
const P_LAMP = {
  L: '#ffd23c', G: '#3a3a4a', P: '#2a2a38',
};
const LAMP = [
  '......L.......',
  '.....LLL......',
  '......L.......',
  '......L.......',
  '......L.......',
  '......L.......',
  '......P.......',
  '......P.......',
  '......P.......',
];

// ============================================================
// Inicialización
// ============================================================
function initSprites() {
  buildPlayer(3);
  SPR.pigeon = [
    makeSprite(PIGEON_A, P_PIGEON, 2),
    makeSprite(PIGEON_B, P_PIGEON, 2),
    makeSprite(PIGEON_SQUAT, P_PIGEON, 2),
    makeSprite(PIGEON_DEAD, P_PIGEON, 2),
  ];
  buildCars(4);
  SPR.pedestrians = [
    makeSprite(PEDESTRIAN_A, P_PED1, 3),
    makeSprite(PEDESTRIAN_B, P_PED1, 3),
    makeSprite(PEDESTRIAN_A, P_PED2, 3),
    makeSprite(PEDESTRIAN_B, P_PED2, 3),
  ];
  SPR.pothole = makeSprite(POTHOLE, P_POTHOLE, 4);
  SPR.coins = [
    makeSprite(COIN_F1, P_COIN, 4),
    makeSprite(COIN_F2, P_COIN, 4),
    makeSprite(COIN_F3, P_COIN, 4),
  ];
  SPR.poop = makeSprite(POOP, P_POOP, 4);
  SPR.stand = makeSprite(STAND, P_STAND, 4);
  SPR.tree = makeSprite(TREE, P_TREE, 4);
  SPR.lamp = makeSprite(LAMP, P_LAMP, 4);
}
