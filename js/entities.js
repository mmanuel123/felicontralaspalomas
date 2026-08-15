// ============================================================
// entities.js — Enemigos, obstáculos y objetos del mundo
// Todas las posiciones están en coordenadas del mundo (px),
// el eje X es distancia acumulada hacia la derecha.
// ============================================================

function screenX(wx) { return wx - Game.cameraX; }

// ---------------- PALOMA ----------------
class Pigeon {
  constructor(worldX, y, screenSpeed) {
    this.worldX = worldX;
    this.y = y;                 // parte superior del sprite
    this.screenSpeed = screenSpeed; // velocidad en pantalla (hacia la izquierda)
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobAmp = 12;
    this.flap = Math.random() * 10;
    this.state = 'fly';         // fly | squat (va a atacar)
    this.attackTimer = 0;
    this.dead = false;
    this.deadTimer = 0;
    this.vy = 0;
  }

  get vxWorld() { return Game.player.speed - this.screenSpeed; }

  update(dt) {
    this.worldX += this.vxWorld * dt;
    this.flap += dt * 10;
    this.deadTimer += dt;

    if (this.dead) {
      this.y += this.vy * dt;
      this.vy += 600 * dt;
    }

    if (!this.dead) {
      // vuelo ondulante
      this.bobPhase += dt * 2.5;
      this.y += Math.sin(this.bobPhase) * this.bobAmp * dt;

      // ataque: cuando pasa sobre el jugador, defeca
      const px = screenX(this.worldX) + 13;
      if (px < Game.player.x + 60 && px > Game.player.x - 60 && this.attackTimer <= 0) {
        this.attackTimer = CONFIG.PIGEON_POOP_COOLDOWN;
        const poop = new Poop(this.worldX, this.y + 20);
        Game.poops.push(poop);
        this.state = 'squat';
        AudioSys.poop();
      }
      this.attackTimer -= dt;
      if (this.state === 'squat' && this.attackTimer < CONFIG.PIGEON_POOP_COOLDOWN - 0.3) this.state = 'fly';
    }
  }

  hitbox() {
    return { x: screenX(this.worldX) + 4, y: this.y + 2, w: 18, h: 10 };
  }

  die(reward) {
    if (this.dead) return;
    this.dead = true;
    this.deadTimer = 0;
    this.vy = -160;
    if (reward) Game.player.coins += CONFIG.PIGEON_COIN_REWARD;
    AudioSys.pigeonHit();
  }

  draw(ctx) {
    let spr;
    if (this.dead) spr = SPR.pigeon[3];
    else spr = SPR.pigeon[this.state === 'squat' ? 2 : (Math.floor(this.flap) % 2)];
    drawSprite(ctx, spr, screenX(this.worldX), this.y, { scale: 2 });
  }
}

// ---------------- CACA (ataque de paloma) ----------------
class Poop {
  constructor(worldX, y) {
    this.worldX = worldX;
    this.y = y;
    this.vy = CONFIG.PIGEON_POOP_SPEED;
  }
  update(dt) {
    this.worldX += (Game.player.speed - 40) * dt;
    this.y += this.vy * dt;
  }
  hitbox() {
    return { x: screenX(this.worldX) + 8, y: this.y, w: 16, h: 16 };
  }
  draw(ctx) {
    drawSprite(ctx, SPR.poop, screenX(this.worldX), this.y, { scale: 4 });
  }
}

// ---------------- AUTO ----------------
class Car {
  constructor(worldX, speed, dir, type) {
    this.worldX = worldX;
    this.speed = speed;          // velocidad en pantalla (px/s) hacia su dirección
    this.dir = dir;              // -1 izquierda, +1 derecha
    this.type = type || 'amarok';// 'falcon' | 'amarok'
  }
  update(dt) {
    this.worldX += this.dir * this.speed * dt;
  }
  hitbox() {
    // Amarok: 50x19 a escala 4 => 200x76px | Falcon: 52x18 => 208x72px
    const spec = this.type === 'falcon' ? { w: 200, h: 64 } : { w: 200, h: 68 };
    return { x: screenX(this.worldX) + 4, y: 228 - spec.h, w: spec.w, h: spec.h };
  }
  draw(ctx) {
    const key = (this.dir === -1 ? 'Left' : 'Right') + (this.type === 'falcon' ? 'Falcon' : 'Amarok');
    drawSprite(ctx, SPR['car' + key], screenX(this.worldX), 226, { scale: 4, pivot: 'bottom' });
  }
}

// ---------------- PEATÓN ----------------
class Pedestrian {
  constructor(worldX, lane, speed) {
    this.worldX = worldX;
    this.lane = lane;            // 0 vereda sup, 2 vereda inf
    this.speed = speed;          // en pantalla (se mueve hacia la izquierda)
    this.anim = Math.random() * 10;
    this.variant = Math.floor(Math.random() * (SPR.pedestrians.length / 2));
  }
  update(dt) {
    this.worldX += (Game.player.speed - this.speed) * dt;
    this.anim += dt * 6;
  }
  hitbox() {
    const feetY = CONFIG.LANES[this.lane].feetY;
    return { x: screenX(this.worldX) - 12, y: feetY - 48, w: 48, h: 48 };
  }
  draw(ctx) {
    const spr = SPR.pedestrians[this.variant * 2 + (Math.floor(this.anim) % 2)];
    const feetY = CONFIG.LANES[this.lane].feetY;
    drawSprite(ctx, spr, screenX(this.worldX), feetY, { scale: 3, pivot: 'bottom' });
  }
}

// ---------------- POZO ----------------
class Pothole {
  constructor(worldX, lane) {
    this.worldX = worldX;
    this.lane = lane;            // 0 sup, 2 inf
    this.hit = false;
  }
  draw(ctx) {
    const feetY = CONFIG.LANES[this.lane].feetY;
    drawSprite(ctx, SPR.pothole, screenX(this.worldX), feetY, { scale: 4, pivot: 'bottom' });
  }
}

// ---------------- MONEDA ----------------
class Coin {
  constructor(worldX, y) {
    this.worldX = worldX;
    this.y = y;
    this.t = Math.random() * 10;
    this.taken = false;
  }
  update(dt) { this.t += dt * 8; }
  draw(ctx) {
    if (this.taken) return;
    const frame = Math.floor(this.t) % 3;
    drawSprite(ctx, SPR.coins[frame], screenX(this.worldX), this.y, { scale: 4 });
  }
}

// ---------------- PUESTO DE CUBANITOS ----------------
class CubanitoStand {
  constructor(worldX, lane) {
    this.worldX = worldX;
    this.lane = lane;            // 0 sup, 2 inf
    this.bought = false;
  }
  zone() {
    // zona de interacción (screen coords)
    return { x: screenX(this.worldX) - 10, w: 84 };
  }
  draw(ctx) {
    const feetY = CONFIG.LANES[this.lane].feetY;
    drawSprite(ctx, SPR.stand, screenX(this.worldX), feetY, { scale: 4, pivot: 'bottom' });
    // cartel de precio
    ctx.font = '9px monospace';
    ctx.fillStyle = '#ffe';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const tx = screenX(this.worldX) + 20;
    const ty = feetY - 70;
    ctx.strokeText('CUBANITO ' + CONFIG.CUBANITO_PRICE + ' MONEDAS', tx, ty);
    ctx.fillText('CUBANITO ' + CONFIG.CUBANITO_PRICE + ' MONEDAS', tx, ty);
    if (this.bought) {
      ctx.fillStyle = '#8f8';
      ctx.fillText('AGOTADO', tx, ty + 12);
    }
  }
}
