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
// PERSONAJE — generado a partir de las imágenes del usuario
// (Imagenes/personaje principal corriendo.png, saltando.png,
//  Personaje principa game over.png) con gen_sprite.js
// Paleta unificada para las 3 poses.
// ============================================================
const P_BOY = {
  A: '#0d0f16',   // contorno
  B: '#6b3a14',   // pelo castaño
  C: '#e3a41c',   // pelo rubio
  D: '#f2b785',   // piel
  E: '#d88e5e',   // piel sombra
  F: '#2a63c2',   // remera azul
  G: '#173f85',   // azul oscuro / anteojos
  H: '#e2582a',   // naranja (detalle)
  I: '#5f7a3e',   // pantalón verde
  J: '#43562b',   // verde oscuro
  K: '#e8eef2',   // blanco
  L: '#24407c',   // denim
};

// Corriendo (23x34) — pose de carrera, vista frontal.
// Regenerado a mayor resolución (34 filas, escala 2 => 46x72px).
const PLAYER_RUN = [
  '........B.BBBBBBHHBB...',
  '....BBBBHHCCCHCCCCBB...',
  '....BHHHCCCCCCCCCBBBB..',
  '..DEEBCCCCCCCCCCCCCCHB.',
  '..EBHCCCCCCCCCCCCCCBBB.',
  '..EBHCCCCCCCCCCCCCCCHB.',
  '...BHCCCCCCCCCCCCCCCCHB',
  '..IBCCCCCCCCCCCCBHCHBHB',
  '..BCCCCCCCCCCBHCHHHHBJB',
  '..BAHCCCCCCCHHHBIIHBBJ.',
  '...AHCCCHHCCHDDIJJIAAJ.',
  '...BHHBJJABBBIIFLAFA...',
  '...ABHBEEEBBIIIGLAGA...',
  '...ABHBEDEDEDDIGFLGAA..',
  '...KAHBBDEDDDDDGGGLDA..',
  '....ABBBBAEDDDDDDDDBI..',
  '.....AAABBHEDDDDEEEA...',
  '....AJJAAAABBHEEEIBA...',
  '...AJIIJGGLIJLAAAAI....',
  '..KAIIJGFFFIIFFGAAAK...',
  '..KAIJBLFFGJIFFGBBEAI..',
  '..KAJJHDEAJJLFFIBEEIE..',
  '..KAJJEDDBJLFFFLBHEBI..',
  '...AAJBDDDJFFFFAABBA...',
  '....AAAEDDIGGGLAAA.....',
  '..JJJJJAHBAAALGGLAA....',
  '.IJBBAAAAALGGGGGLIAABBA',
  '.AEHHIAALAAAAALLEDHBHHA',
  '.AHHHDLGGAAAAAAJEHHHHIJ',
  '.AEHHDIAAAAE.DAAEHHHEJE',
  '.AJHHEAAAAK...AABHHIJA.',
  '..JDHBA.........AIEJI..',
  'LJJIEAAAAAAAAAAAAAAAALL',
  'AAAAAAAAAAAAAAAAAAAAAAJ',
];

// Saltando (24x28) — piernas abiertas en el aire (sin sombra flotante)
const PLAYER_JUMP = [
  '........BBBHCHBHBB......',
  '.....BCCCCCCCCCCHBBB....',
  '.....AHCCCCCCCCCCCCB....',
  '...BHCCCCCCCCCCCCCBB....',
  '...BHCCCCCCCCCCCCCCHB...',
  'AJIJBCCCCCCCCCCHCCHBB...',
  'BDDEBCCCCCCHBCHHHCCBAJJ.',
  'IDEDBCCCCHBEEBEDEBBBIEEB',
  'BEEEBHCCCHIJIEDEJIBAEEDI',
  'JBEDIHBBBLILLFILLILBEEHB',
  '.AIDDBEEJLEALLIGAELEDHB.',
  '..BEDEEHEEFFFEELGFIDEJ..',
  '..IBDDIIHDEEIEEEEIDEJK..',
  '...JBEFGAEDDBBBDELBB....',
  '....AGFFLJBEEHEILGA.....',
  '.....AGFGILLBBAJGAA.....',
  '....JJJLJIFFFFGJAJ......',
  '....AIJAJJFFFFFAA.......',
  '....AIJJAGFFFFFAAAA.....',
  '....JJJAGFFFFFGALGLAABBJ',
  '.....AAAAGGGGGLGGGGJBHIJ',
  '...JJJAAAGGGGLGLAGLEHEIJ',
  '...JBBAAGGGGAAAAAAIHHEIA',
  '...JHHLLGGGAAA...AABEIA.',
  '..JBHILGGGAA......ABIJJ.',
  '..AHHIAALAA........AAE..',
  '..AHHBAAAA..............',
  '...JJA..................',
];

// Game over (39x16) — tirado en el suelo, compacto (escala 2 => 82x36px)
const PLAYER_LIE = [
  '.........................BBBJBA........',
  '......................JJBBCHBCBAAB.....',
  '......................ABCCCCCCCCCBBBA..',
  '.....................ABBCCCCCCCCCCCBJ..',
  '.....................BHCCCCCCCCCCCCBB..',
  '.....................BBBCCCCCCCCCCCCHB.',
  '...............AAJJJABEEBCCCCCCCCCCCBB.',
  '..............AJJIIJJJDEJBBCHBCCCCCCBJ.',
  '..............AJJJJJJJEEBLIIBHCCCCCCCB.',
  '............AAAAGAAAAJIDDEFFIHHBBCCCBBB',
  '...JAAI.AAJALGLGFFFFFGADDFJAILEEBCCCB..',
  '..AJHBAAAAAGGGAFFFGFFFAEDIGAFLFFBHHBHA.',
  '.AAHHHLGLAGGGGAFFFGLIGABDDELEIGILBBABA.',
  '.AHHHIAGGGGGGAAFFFAEDEAAEDIEELAAFJIEIA.',
  '.JHHIJAALGGLAAAGGFGEDDDDEIEBDELLLHEEEI.',
  'LJBBAAAAAAAAAAAAAAAJBBBBBAJJJJAJAABBBJL',
];

function buildPlayer(scale) {
  const OUTLINE = '#0d0f16';
  const run = makeSprite(PLAYER_RUN, P_BOY, scale, OUTLINE);
  const jump = makeSprite(PLAYER_JUMP, P_BOY, scale, OUTLINE);
  SPR.player = {
    run: [run, run, run, run, run, run],
    jump,
    fall: jump,
    kick: jump,
    hurt: run,
    dead: makeSprite(PLAYER_LIE, P_BOY, scale, OUTLINE),
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
// AUTOS — generados a partir de Imagenes/Amarok.png y Ford.png
// Colores reales de las fotos: Amarok amarilla (#f7c901),
// Ford Falcon gris oscuro con techo claro.
// ============================================================
// VW Amarok — pick-up amarilla (50x19, mirando a la izquierda).
// Diseño en píxeles más finos (escala 4 => 200x80px).
const P_AMAROK = {
  A: '#0d0f16',   // contorno / bajos
  B: '#1b1e26',   // borde de carga
  C: '#8a5a2f',   // carga en la caja
  D: '#2a2e36',   // bajos
  G: '#2f3a52',   // vidrio
  h: '#ffe05a',   // brillo del techo
  K: '#14161c',   // ruedas
  L: '#f2e9d0',   // faro delantero
  M: '#c9cdd4',   // paragolpes/metal
  T: '#d85040',   // luz trasera
  W: '#d6dcec',   // reflejo del vidrio
  Y: '#f7c901',   // carrocería amarilla
  y: '#a17f00',   // sombra amarilla
};
const AMAROK = [
  '..................................................',
  '..................................................',
  '..................................................',
  '....................YhhhhhhhhhY...................',
  '...................YGYYYYYYYYYYY..................',
  '..................YGGYYYYYYYYYYYG.................',
  '.............MM..YGGGGGGGGYGGGGGGG.....CCCCCCC....',
  '................YGGGYGGWWWYWWGGGGGG....CCCCCCC....',
  '...............YGGGYYGWWWWYGGGGGGGG....CCCCCCC....',
  '..............GGGGYYYGGGGGYGGGGGGGGG...CCCCCCC....',
  '.YYYYYYYYYYYYKYYYYYYyYYYYYYYYYYYYyYKYYBBBBBBBBBB..',
  '.YYYYYYYYYKKKKKKKYYYyYMMYYYYYMMYKKKKKKKyyyyyyyyY..',
  'MLLYYYYYYKKKKKKKKKYYyYMMYYYYYMMKKKKKKKKKyyyyyyyTT.',
  'MLLYYYYYYKKKKKKKKKYYyYYYYYYYYYYKKKKKKKKKyyyyyyyTTY',
  'MyyyyyyyyKKKMMMKKKyyyyyyyyyyyyyKKKMMMKKKyyyyyyyyyY',
  'MyyyyyyyKKKKMMMKKKKyyyyyyyyyyyKKKKMMMKKKKyyyyyyMMY',
  'MYYYYYYYYYKKMMMKKMMMMMMMMMMMMMMYKKMMMKKyyyyyyyyMMY',
  '......DDDDDKKKKKDDDDDDDDDDDDDDDDDKKKKKDDDDDDD.....',
  '............KKK...................KKK.............',
];

// Ford Falcon — sedán clásico gris con techo claro (52x18, mirando a la izquierda).
const P_FALCON = {
  C: '#8a5a2f',   // óxido
  c: '#592c19',   // óxido oscuro
  D: '#2e333d',   // carrocería gris oscuro
  d: '#20242c',   // sombra de la carrocería
  G: '#2f3a52',   // vidrio
  K: '#14161c',   // ruedas
  L: '#fdfefe',   // faro delantero
  M: '#c6ccd4',   // paragolpes/cromados
  r: '#8f887e',   // sombra del techo
  R: '#b3aba0',   // techo gris claro
  T: '#d85040',   // luz trasera
  W: '#d6dcec',   // reflejo del vidrio
  Z: '#9da6b3',   // reflejo de la carrocería
};
const FALCON = [
  '....................................................',
  '....................................................',
  '....................................................',
  '.....................RRRRRRRRRR.....................',
  '....................DRRRRRRRRRRD....................',
  '...................DGrrrrrrrrrrGD...................',
  '..................DGGGGGGDGGGGGGGDD.................',
  '...............MM.GGGDGWWDWWGGGGGGGD................',
  '.................DGGDDWWWDGGGGGGGGGGD...............',
  '................GGGDDDGGGDGGGGGGGGGGGZZZZZZZZZD.....',
  '..ZZZZZZZZZZZKZDDDDdDDDDDDDDDDDdDDDDKDDDDDDDDDDD....',
  '..DDDDDccDKKKKKKKDDdDDDDMMDDDDDdcKKKKKKKDDDDDDDDTTT.',
  'MDDDDDCccKKKKKKKKKDdDDDDMMDDDDCdKKKKKKKKKDDDDDDDTTT.',
  'MLDDDDCccKKKKKKKKKDdDDDDDDDDDDCdKKKKKKKKKDDDDDDDDDDD',
  'MLDDDDCCCKKKMMMKKKCdCCCCCDDDDDCdKKKMMMKKKDDDDDDMMMMM',
  'MDDdddddKKKKMMMKKKKCCCCCCCCCDDDKKKKMMMKKKKddddDMMMMM',
  'MDDDDDDDDDKKMMMKKDDDDDDDDDDDDDDDDKKMMMKKDDDDDDDMMMMM',
  '.....DDDDDDKKKKKDDDDDDDDDDDDDDDDDDKKKKKDDDDDDDDD....',
];

function buildCars(scale) {
  const OUTLINE = '#10131c';
  const falconL = makeSprite(FALCON, P_FALCON, scale, OUTLINE);
  const amarokL = makeSprite(AMAROK, P_AMAROK, scale, OUTLINE);
  SPR.carLeftFalcon = falconL;
  SPR.carLeftAmarok = amarokL;
  SPR.carRightFalcon = makeSprite(flipRows(FALCON), P_FALCON, scale, OUTLINE);
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
  buildPlayer(2);
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
