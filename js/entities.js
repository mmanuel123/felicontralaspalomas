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
    if (reward) Game.addCoins(CONFIG.PIGEON_COIN_REWARD);
    AudioSys.pigeonHit();
  }

  draw(ctx) {
    let spr;
    if (this.dead) spr = SPR.pigeon[4];
    else spr = SPR.pigeon[this.state === 'squat' ? 3 : (Math.floor(this.flap) % 3)];
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
    // Falcon: 52x18 a escala 4 => 208x72 | Amarok realista: 112x50 a escala 2 => 224x100
    const spec = this.type === 'falcon' ? { w: 200, h: 64 } : { w: 205, h: 90 };
    return { x: screenX(this.worldX) + 4, y: 228 - spec.h, w: spec.w, h: spec.h };
  }
  draw(ctx) {
    const key = (this.dir === -1 ? 'Left' : 'Right') + (this.type === 'falcon' ? 'Falcon' : 'Amarok');
    const scale = this.type === 'amarok' ? 2 : 4;
    drawSprite(ctx, SPR['car' + key], screenX(this.worldX), 226, { scale, pivot: 'bottom' });
  }
}

// ---------------- PEATÓN ----------------
class Pedestrian {
  constructor(worldX, lane, speed) {
    this.worldX = worldX;
    this.lane = lane;            // 0 vereda sup, 2 vereda inf
    this.speed = speed;          // en pantalla (se mueve hacia la izquierda)
    this.anim = Math.random() * 10;
    this.variant = Math.floor(Math.random() * (SPR.pedestrians.length / 3));
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
    const spr = SPR.pedestrians[this.variant * 3 + (Math.floor(this.anim) % 3)];
    const feetY = CONFIG.LANES[this.lane].feetY;
    drawSprite(ctx, spr, screenX(this.worldX), feetY, { scale: 3, pivot: 'bottom' });
  }
}

// ---------------- POZO ----------------
class Pothole {
  constructor(worldX, lane) {
    this.worldX = worldX;
    this.lane = lane;            // 0 sup, 1 calle, 2 inf
    this.hit = false;
    this.round = lane === 1;     // los de la calle son redondos
    // semilla determinista por posición: cada pozo distinto pero estable
    const s = Math.sin(worldX * 12.9898) * 43758.5453;
    this.seed = ((s % 1) + 1) % 1;
  }
  draw(ctx) {
    const feetY = CONFIG.LANES[this.lane].feetY;
    if (this.round) {
      // pozo de calle: óvalo irregular (asimétrico), grieta y reflejo descentrado
      const cx = screenX(this.worldX) + 24, cy = feetY - 14;
      const s = this.seed;
      const rx = 12 + s * 4;              // óvalo: ancho y alto distintos
      const ry = 9 + (1 - s) * 3;
      const rot = (s - 0.5) * 0.45;       // rotación leve
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(rx / 12, ry / 12);
      const blob = (r, fill) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        const n = 18;
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2;
          // contorno suave y redondeado (bultos de baja frecuencia, sin puntas)
          const wob = 1 + 0.06 * Math.sin(i * 1.31 + s * 13) + 0.05 * Math.sin(i * 2.37 + s * 7);
          const rr = r * wob;
          const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      };
      blob(12.5, '#1c1c22');      // borde irregular suave
      blob(10, '#26262e');        // interior
      // grieta corta
      ctx.strokeStyle = '#14141a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, 1);
      ctx.lineTo(-1, 4);
      ctx.lineTo(2, 1);
      ctx.stroke();
      // reflejo descentrado (asimetría)
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.arc(-4 - s * 4, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    drawSprite(ctx, SPR.pothole, screenX(this.worldX), feetY, { scale: 4, pivot: 'bottom' });
  }
}

// ---------------- BOLSITA DE GARRAPIÑADAS ----------------
class GarrapinadaBag {
  constructor(worldX, lane) {
    this.worldX = worldX;
    this.lane = lane;            // 0 sup, 2 inf
    this.taken = false;
  }
  zone() {
    return { x: screenX(this.worldX) - 10, w: 84 };
  }
  draw(ctx) {
    const feetY = CONFIG.LANES[this.lane].feetY;
    drawSprite(ctx, SPR.garrapinada, screenX(this.worldX), feetY, { scale: 3, pivot: 'bottom' });
  }
}

// ---------------- GARRAPIÑADA LANZADA (proyectil) ----------------
class Garrapinada {
  constructor(worldX, y, vy) {
    this.worldX = worldX;
    this.y = y;
    this.vy = vy || -120;
    this.dead = false;
  }
  update(dt) {
    this.worldX += (Game.player.speed + CONFIG.GARRAPIÑADA_SPEED) * dt;
    this.vy += CONFIG.GARRAPIÑADA_GRAVITY * dt;
    this.y += this.vy * dt;
  }
  hitbox() {
    return { x: screenX(this.worldX) - 7, y: this.y - 7, w: 14, h: 14 };
  }
  draw(ctx) {
    drawSprite(ctx, SPR.garrapinadaPellet, screenX(this.worldX), this.y, { scale: 2 });
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
