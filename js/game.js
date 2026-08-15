// ============================================================
// game.js — Bucle principal, colisiones y estados del juego
// ============================================================
const Game = {
  canvas: null,
  ctx: null,
  state: 'title',        // title | banner | playing | gameover | complete
  player: null,
  cameraX: 0,
  time: 0,
  difficulty: 0,
  lastTs: 0,
  buyZone: null,
  buyMsg: '',
  buyMsgTime: 0,
  shakeTime: 0,
  levelIndex: 0,               // 0=ALSINA, 1=BELGRANO, 2=LAS HERAS
  lives: 0,                    // vidas de la partida (3 iniciales, máx 5)
  coinsEarned: 0,              // monedas ganadas de por vida (nunca baja al gastar)
  pigeons: [],
  poops: [],
  cars: [],
  pedestrians: [],
  potholes: [],
  coins: [],
  stands: [],
  deco: [],
  garrapinadas: [],            // proyectiles lanzados
  garrapinadaBag: null,        // bolsita sin agarrar
  garrapinadaSpawned: false,   // 1 bolsita por nivel como máximo
  garrapinadaCooldown: 0,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.VW;
    this.canvas.height = CONFIG.VH;
    initSprites();
    AudioSys.init();
    Input.init();

    document.getElementById('btn-jump').addEventListener('click', () => {
      if (Game.state === 'playing') Game.player.tryJump();
    });

    this.levelIndex = 0;
    this.resetWorld(false);
    UI.showTitle();
    requestAnimationFrame((t) => this.loop(t));
  },

  // Nivel actual (objeto de CONFIG.LEVELS)
  currentLevel() {
    return CONFIG.LEVELS[this.levelIndex] || CONFIG.LEVELS[0];
  },

  // Reinicia el mundo de juego manteniendo (o no) las monedas.
  resetWorld(carryCoins) {
    const coins = carryCoins ? this.player.coins : 0;
    this.player = new Player();
    if (carryCoins) this.player.coins = coins;
    this.cameraX = 0;
    this.time = 0;
    this.difficulty = 0;
    this.pigeons = [];
    this.poops = [];
    this.cars = [];
    this.pedestrians = [];
    this.potholes = [];
    this.coins = [];
    this.stands = [];
    this.deco = [];
    this.buyZone = null;
    this.buyMsg = '';
    this.buyMsgTime = 0;
    this.shakeTime = 0;
    this.levelComplete = false;
    this.standSpawned = false;   // 1 puesto de cubanitos como máximo por nivel
    this.garrapinadas = [];
    this.garrapinadaBag = null;
    this.garrapinadaSpawned = false;
    this.garrapinadaCooldown = 0;
    UI.hideThrowButton();
    this.state = 'title';
    LevelGen.init(12345 + this.levelIndex * 7777);
  },

  resetAll() {
    this.levelIndex = 0;
    this.lives = CONFIG.PLAYER_START_LIVES;
    this.coinsEarned = 0;
    this.resetWorld(false);
  },

  start() {
    AudioSys.resume();
    this.resetAll();
    this.state = 'banner';
    UI.showLevelBanner();
    setTimeout(() => {
      this.state = 'playing';
      UI.hide();
      AudioSys.startMusic();
    }, 1800);
  },

  restart() {
    AudioSys.resume();
    this.resetAll();             // volver a jugar: vidas y monedas en cero
    this.state = 'banner';
    UI.showLevelBanner();
    setTimeout(() => {
      this.state = 'playing';
      UI.hide();
      AudioSys.startMusic();
    }, 1200);
  },

  // Suma monedas y otorga una vida cada 100 ganadas (máx MAX_LIVES).
  addCoins(n) {
    const before = Math.floor(this.coinsEarned / CONFIG.COINS_PER_LIFE);
    this.coinsEarned += n;
    this.player.coins += n;
    const after = Math.floor(this.coinsEarned / CONFIG.COINS_PER_LIFE);
    for (let i = before + 1; i <= after; i++) {
      if (this.lives < CONFIG.MAX_LIVES) {
        this.lives++;
        this.buyMsg = '¡+1 VIDA! (' + this.lives + '/' + CONFIG.MAX_LIVES + ')';
        this.buyMsgTime = 1.6;
        AudioSys.lifeUp();
      }
    }
  },

  completeLevel() {
    // avanzar al siguiente nivel o terminar el juego
    if (this.levelIndex < CONFIG.LEVELS.length - 1) {
      this.levelIndex++;
      this.resetWorld(true);            // conserva las monedas
      this.state = 'banner';
      UI.showLevelBanner();
      setTimeout(() => {
        this.state = 'playing';
        UI.hide();
        AudioSys.startMusic();
      }, 1800);
    } else {
      this.levelComplete = true;
      this.state = 'complete';
      AudioSys.stopMusic();
      AudioSys.levelUp();
      UI.showLevelComplete();
    }
  },

  loop(t) {
    const dt = Math.min(0.033, (t - this.lastTs) / 1000 || 0.016);
    this.lastTs = t;
    this.update(dt);
    Input.clearPressed();
    this.render();
    requestAnimationFrame((tt) => this.loop(tt));
  },

  update(dt) {
    this.time += dt;
    if (this.buyMsgTime > 0) this.buyMsgTime -= dt;
    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.state !== 'playing') return;

    const p = this.player;
    p.update(dt);

    this.difficulty = Math.min(CONFIG.LEVEL_MAX_DIFFICULTY,
      Math.floor(p.distance / 1400));
    this.cameraX = p.distance;

    LevelGen.update(dt);

    for (const e of this.pigeons) e.update(dt);
    for (const e of this.poops) e.update(dt);
    for (const e of this.cars) e.update(dt);
    for (const e of this.pedestrians) e.update(dt);
    for (const e of this.coins) e.update(dt);
    this.garrapinadaCooldown = Math.max(0, this.garrapinadaCooldown - dt);
    for (const g of this.garrapinadas) g.update(dt);

    this.handleCollisions();

    // Puesto de cubanitos dinámico: aparece una sola vez por nivel, sólo
    // cuando la vida baja del 30%, unos metros más adelante sobre la vereda.
    if (!this.standSpawned && p.alive && p.hp < p.maxHp * 0.30) {
      this.standSpawned = true;
      const lane = p.lane === 1 ? 0 : p.lane; // siempre sobre una vereda
      this.stands.push(new CubanitoStand(p.distance + 900, lane));
      this.buyMsg = 'CUBANITO ADELANTE';
      this.buyMsgTime = 1.4;
    }

    // Bolsita de garrapiñadas: aparece una vez por nivel, sin costo,
    // unos metros más adelante sobre la calle.
    if (!this.garrapinadaSpawned && p.alive && p.distance >= CONFIG.GARRAPIÑADA_SPAWN_X) {
      this.garrapinadaSpawned = true;
      this.garrapinadaBag = new GarrapinadaBag(p.distance + 600, 1);
    }

    // lanzar garrapiñadas (tecla X o botón LANZAR)
    if (Input.throwPressed && p.alive && p.hasGarrapinadas && p.garrapinadas > 0 &&
        this.garrapinadaCooldown <= 0) {
      p.garrapinadas--;
      this.garrapinadaCooldown = CONFIG.GARRAPIÑADA_THROW_COOLDOWN;
      this.garrapinadas.push(new Garrapinada(p.distance + 24, p.feetY - 46, -130));
      AudioSys.throw();
      if (p.garrapinadas <= 0) {
        p.hasGarrapinadas = false;
        this.buyMsg = '¡SIN GARRAPIÑADAS!';
        this.buyMsgTime = 1.0;
        UI.hideThrowButton();
      }
    }

    // limpiar entidades fuera de pantalla
    const cut = this.cameraX - 140;
    this.pigeons = this.pigeons.filter(e => screenX(e.worldX) > -80 && !(e.dead && e.deadTimer > 0.7));
    this.poops = this.poops.filter(e => screenX(e.worldX) > -80 && e.y < 400);
    this.cars = this.cars.filter(e => screenX(e.worldX) > -100 && screenX(e.worldX) < CONFIG.VW + 200);
    this.pedestrians = this.pedestrians.filter(e => screenX(e.worldX) > -60);
    this.potholes = this.potholes.filter(e => e.worldX > cut);
    this.coins = this.coins.filter(e => e.worldX > cut);
    this.stands = this.stands.filter(e => e.worldX > cut);
    this.deco = this.deco.filter(e => e.worldX > cut);
    this.garrapinadas = this.garrapinadas.filter(g =>
      !g.dead && screenX(g.worldX) > -60 && screenX(g.worldX) < CONFIG.VW + 60 && g.y < 420);

    if (!p.alive) {
      this.lives--;
      if (this.lives > 0) {
        // perder una vida: se reinicia el nivel desde el principio,
        // conservando monedas, vidas y el progreso de +1 vida.
        this.resetWorld(true);
        this.state = 'banner';
        UI.showLevelBanner('¡PERDISTE UNA VIDA! Te quedan ' + this.lives);
        AudioSys.resume();
        setTimeout(() => {
          this.state = 'playing';
          UI.hide();
          AudioSys.startMusic();
        }, 1200);
      } else {
        this.state = 'gameover';
        setTimeout(() => UI.showGameOver(), 900);
      }
    }
  },

  handleCollisions() {
    const p = this.player;
    const hb = p.hitbox();

    // ---- Palomas ----
    for (const pigeon of this.pigeons) {
      if (pigeon.dead) continue;
      const ph = pigeon.hitbox();
      // Patada aérea: cualquier contacto en el aire mata a la paloma
      if (p.airborne) {
        if (rectOverlap(p.hitbox(), ph)) {
          pigeon.die(true);
          // rebote
          p.vy = -Math.abs(p.vy || 0) * 0.5 - 120;
          p.state = 'kick';
          p.kickActive = true;
          p.stateTime = 0;
        }
        continue;
      }
      // colisión cuerpo a cuerpo (en el suelo): lastima pero NO mata.
      // Las palomas sólo mueren si el personaje salta sobre ellas.
      if (p.invincible <= 0 && rectOverlap(hb, ph)) {
        p.takeDamage(CONFIG.PIGEON_DAMAGE);
      }
    }

    // ---- Cacas ----
    for (const poop of this.poops) {
      if (p.invincible > 0) continue;
      if (rectOverlap(hb, poop.hitbox())) {
        p.takeDamage(CONFIG.PIGEON_POOP_DAMAGE);
        poop.y = 9999; // eliminar
      }
    }

    // ---- Autos ----
    for (const car of this.cars) {
      if (p.invincible > 0) break;
      if (rectOverlap(hb, car.hitbox())) {
        p.takeDamage(CONFIG.CAR_DAMAGE);
        this.shakeTime = 0.4;
        AudioSys.car();
        p.dangerCooldown = 0.8;
        break;
      }
    }

    // ---- Pozos ----
    for (const hole of this.potholes) {
      if (hole.hit) continue;
      const laneY = CONFIG.LANES[hole.lane].feetY;
      if (p.lane === hole.lane && !p.airborne && Math.abs(p.targetFeetY - laneY) < 10) {
        const hw = screenX(hole.worldX);
        const potholeRect = hole.round
          ? { x: hw + 10, y: laneY - 28, w: 28, h: 28 }
          : { x: hw, y: laneY - 24, w: 48, h: 24 };
        if (rectOverlap(hb, potholeRect)) {
          hole.hit = true;
          p.takeDamage(CONFIG.POTHOLE_DAMAGE);
          AudioSys.land();
        }
      }
    }

    // ---- Monedas ----
    for (const coin of this.coins) {
      if (coin.taken) continue;
      const cr = { x: screenX(coin.worldX), y: coin.y, w: 40, h: 24 };
      if (rectOverlap(hb, cr)) {
        coin.taken = true;
        Game.addCoins(CONFIG.COIN_VALUE);
        AudioSys.coin();
      }
    }

    // ---- Bolsita de garrapiñadas (recojo automático al pasar) ----
    if (this.garrapinadaBag && !this.garrapinadaBag.taken) {
      const z = this.garrapinadaBag.zone();
      if (p.x > z.x - 12 && p.x < z.x + z.w + 12) {
        this.garrapinadaBag.taken = true;
        p.hasGarrapinadas = true;
        p.garrapinadas = CONFIG.GARRAPIÑADA_BAG_COUNT;
        this.buyMsg = '¡GARRAPIÑADAS! LANZALAS CON X (x' + p.garrapinadas + ')';
        this.buyMsgTime = 1.8;
        AudioSys.pickup();
        UI.showThrowButton();
      }
    }

    // ---- Garrapiñadas lanzadas: matan palomas al impactar ----
    for (const g of this.garrapinadas) {
      if (g.dead) continue;
      for (const pigeon of this.pigeons) {
        if (pigeon.dead) continue;
        if (rectOverlap(g.hitbox(), pigeon.hitbox())) {
          g.dead = true;
          pigeon.die(true);
          break;
        }
      }
    }

    // ---- Puesto de cubanitos (compra automática al pasar) ----
    this.buyZone = null;
    for (const s of this.stands) {
      if (s.bought) continue;
      const z = s.zone();
      if (p.x > z.x - 12 && p.x < z.x + z.w + 12) {
        this.buyZone = s;
        if (p.coins >= CONFIG.CUBANITO_PRICE) {
          if (p.hp >= p.maxHp) {
            this.buyMsg = '¡VIDA LLENA! NO NECESITAS CUBANITO';
            this.buyMsgTime = 1.0;
          } else {
            p.coins -= CONFIG.CUBANITO_PRICE;
            p.heal(CONFIG.CUBANITO_HEAL);
            s.bought = true;
            this.buyZone = null;
            p.state = 'eat';
            p.stateTime = 0;
            AudioSys.buy();
            setTimeout(() => AudioSys.eat(), 250);
            this.buyMsg = '+' + CONFIG.CUBANITO_HEAL + ' HP';
            this.buyMsgTime = 1.6;
          }
        } else {
          this.buyMsg = 'TE FALTAN MONEDAS (' + CONFIG.CUBANITO_PRICE + ')';
          this.buyMsgTime = 0.9;
        }
      }
    }
  },

  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (this.shakeTime > 0) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
    }

    Render.drawScene(ctx);

    // pozos (debajo de todo en el piso)
    for (const e of this.potholes) e.draw(ctx);
    for (const e of this.stands) e.draw(ctx);
    if (this.garrapinadaBag && !this.garrapinadaBag.taken) this.garrapinadaBag.draw(ctx);
    for (const e of this.coins) e.draw(ctx);

    // peatones (bloquean carriles: todos visibles y con colisión)
    for (const e of this.pedestrians) e.draw(ctx);

    // cacas y palomas
    for (const e of this.poops) e.draw(ctx);
    for (const e of this.pigeons) e.draw(ctx);

    // autos
    for (const e of this.cars) e.draw(ctx);

    // jugador
    this.player.draw(ctx);

    // garrapiñadas lanzadas (por encima de todo)
    for (const g of this.garrapinadas) g.draw(ctx);

    ctx.restore();

    // HUD
    if (this.state === 'playing' || this.state === 'complete' || this.state === 'gameover') {
      UI.drawHUD(ctx);
    }

    // mensaje de compra
    if (this.buyMsgTime > 0) {
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#ffd23c';
      const y = CONFIG.VH / 2 - 40;
      ctx.strokeText(this.buyMsg, CONFIG.VW / 2, y);
      ctx.fillText(this.buyMsg, CONFIG.VW / 2, y);
      ctx.textAlign = 'left';
    }

    // máscara de damage (flash rojo)
    if (this.player.invincible > 0 && this.player.hp > 0 && this.state === 'playing') {
      ctx.fillStyle = 'rgba(255,40,40,0.10)';
      ctx.fillRect(0, 0, CONFIG.VW, CONFIG.VH);
    }
  },
};

function rectOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

window.addEventListener('load', () => Game.init());
