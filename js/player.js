// ============================================================
// player.js — Entidad del jugador
// ============================================================
class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.hp = CONFIG.PLAYER_START_HP;
    this.maxHp = CONFIG.PLAYER_MAX_HP;
    this.coins = 0;
    this.lane = CONFIG.PLAYER_START_LANE;
    this.x = 90;                       // posición fija en pantalla (px)
    this.feetY = CONFIG.LANES[this.lane].feetY;
    this.targetFeetY = this.feetY;
    this.vy = 0;
    this.airborne = false;
    this.jumpHeld = false;
    this.state = 'run';                // run | jump | fall | kick | hurt | dead | eat
    this.stateTime = 0;
    this.animTime = 0;
    this.invincible = 0;
    this.facing = 1;
    this.speed = CONFIG.PLAYER_BASE_SPEED;
    this.running = true;
    this.distance = 0;
    this.dangerCooldown = 0.6;         // pausa el scroll tras recibir daño de auto
    this.kickActive = false;
    this.alive = true;
  }

  get laneInfo() { return CONFIG.LANES[this.lane]; }
  get isOnSidewalk() { return this.laneInfo.type === 'sidewalk'; }

  // hitbox aproximada del personaje (sprite ~64px de alto con contorno)
  hitbox() {
    const h = 50, w = 20;
    return { x: this.x - 10, y: this.feetY - h, w, h };
  }

  takeDamage(dmg, source) {
    if (this.invincible > 0 || !this.alive) return;
    this.hp -= dmg;
    this.invincible = 1.2;
    this.state = 'hurt';
    this.stateTime = 0;
    AudioSys.hurt();
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  die() {
    this.alive = false;
    this.state = 'dead';
    this.stateTime = 0;
    this.airborne = false;
    AudioSys.death();
    AudioSys.stopMusic();
  }

  changeLane(dir) {
    if (!this.alive || this.airborne || this.state === 'hurt') return;
    const next = this.lane + dir;
    if (next < 0 || next >= CONFIG.LANES.length) return;
    this.lane = next;
    this.targetFeetY = CONFIG.LANES[next].feetY;
  }

  tryJump() {
    if (!this.alive || this.state === 'hurt' || this.state === 'eat') return;
    if (!this.airborne) {
      this.airborne = true;
      this.vy = CONFIG.PLAYER_JUMP_SPEED;
      this.state = 'jump';
      this.kickActive = false;
      this.jumpHeld = true;
      AudioSys.jump();
      return true;
    }
    return false;
  }

  startKick() {
    // Patada aérea: se activa al presionar saltar en el aire
    if (this.airborne && this.alive && this.state !== 'kick') {
      this.state = 'kick';
      this.stateTime = 0;
      this.kickActive = true;
      AudioSys.kick();
    }
  }

  update(dt) {
    if (!this.alive) {
      this.stateTime += dt;
      return;
    }
    this.stateTime += dt;
    this.animTime += dt;

    // velocidad progresiva (escala con el nivel: más rápido cada calle)
    const lvlSpeed = (Game.currentLevel().speed || 1);
    const base = CONFIG.PLAYER_BASE_SPEED * lvlSpeed;
    const targetSpeed = base + Math.min(CONFIG.LEVEL_MAX_DIFFICULTY, Game.difficulty) * 12;
    this.speed = Math.min(CONFIG.PLAYER_MAX_SPEED * lvlSpeed,
      this.speed + (targetSpeed - this.speed) * Math.min(1, dt * CONFIG.PLAYER_ACCEL));
    if (this.dangerCooldown > 0) {
      this.dangerCooldown -= dt;
      if (this.dangerCooldown <= 0) this.speed = base;
    }
    if (this.running) this.distance += this.speed * dt;

    // invencibilidad
    if (this.invincible > 0) this.invincible -= dt;

    // estado 'eat' (consumir cubanito) congela movimiento brevemente
    if (this.state === 'eat') {
      if (this.stateTime >= 0.7) this.state = 'run';
      return;
    }

    // movimiento vertical (entre lanes) — solo con pulsaciones nuevas
    if (Input.upPressed && !this.airborne) this.changeLane(-1);
    if (Input.downPressed && !this.airborne) this.changeLane(1);

    // suavizado del cambio de vereda
    const diff = this.targetFeetY - this.feetY;
    if (Math.abs(diff) > 1) this.feetY += diff * Math.min(1, dt * 10);
    else this.feetY = this.targetFeetY;

    // salto / gravedad
    if (Input.jumpPressed) {
      if (!this.airborne) this.tryJump();
      else this.startKick();
    }
    if (Input.jump === false) this.jumpHeld = false;
    if (Input.jump === false) this.jumpHeld = false;

    // patada aérea: en el aire, al detectar una paloma cerca el personaje entra en pose de patada
    if (this.airborne && !this.kickActive && Game.pigeons.some(pg =>
      !pg.dead && Math.abs(screenX(pg.worldX) - this.x) < 56 &&
      Math.abs(pg.y + 16 - (this.feetY - 40)) < 70)) {
      this.state = 'kick';
      this.kickActive = true;
      AudioSys.kick();
    }

    if (this.airborne) {
      let g = CONFIG.PLAYER_GRAVITY;
      if (this.jumpHeld && this.vy < 0) g *= 0.55; // salto más alto si mantiene
      this.vy += g * dt;
      this.feetY += this.vy * dt;

      const floorY = this.targetFeetY;
      if (this.feetY >= floorY && this.vy > 0) {
        this.feetY = floorY;
        this.airborne = false;
        this.vy = 0;
        this.kickActive = false;
        this.state = 'run';
        AudioSys.land();
      }
      if (this.state !== 'kick' && this.vy > 60) this.state = 'fall';
    } else if (this.state === 'kick') {
      this.state = 'run';
      this.kickActive = false;
    }

    // estado hurt vuelve a correr
    if (this.state === 'hurt' && this.stateTime > 0.35) this.state = 'run';

    // animación de correr
    if (this.state === 'run') {
      this.stateTime = 0;
    }
  }

  // Hitbox de la patada (delante del personaje, sólo en el aire con kick)
  kickHitbox() {
    const hb = this.hitbox();
    return {
      x: this.x + 4, y: this.feetY - 40, w: 24, h: 28,
    };
  }

  // dibujo
  draw(ctx) {
    if (this.state === 'dead') {
      const spr = SPR.player.dead;
      drawSprite(ctx, spr, this.x - (spr.w * 2) / 2, this.feetY, { scale: 2, pivot: 'bottom' });
      return;
    }

    let spr;
    if (this.state === 'kick') spr = SPR.player.kick;
    else if (this.state === 'jump') spr = SPR.player.jump;
    else if (this.state === 'fall') spr = SPR.player.fall;
    else if (this.state === 'hurt') spr = SPR.player.hurt;
    else if (this.state === 'eat') spr = SPR.player.jump;
    else spr = SPR.player.run[Math.floor(this.animTime * 10) % 6];

    // parpadeo al ser invencible
    if (this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 0) return;

    const s = spr.scale;
    const bob = (this.state === 'run') ? Math.sin(this.animTime * 16) * 2 : 0;
    const dw = spr.w * s, dh = spr.h * s;
    drawSprite(ctx, spr, this.x - dw / 2, this.feetY + bob, { scale: s, pivot: 'bottom' });
  }
}
