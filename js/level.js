// ============================================================
// level.js — Generación del Nivel 1: ALSINA
// Genera el mundo por delante de la cámara con dificultad
// progresiva, usando un RNG con semilla para que el recorrido
// sea siempre el mismo.
// ============================================================

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LevelGen = {
  rng: null,
  nextSpawnX: 0,
  HORIZON: 1000,       // cuántos px por delante generamos
  lastStandX: 0,
  sections: 0,

  init(seed) {
    this.rng = mulberry32(seed || 12345);
    this.nextSpawnX = 200;
    this.lastStandX = 0;
    this.sections = 0;
    Game.pigeons.length = 0;
    Game.cars.length = 0;
    Game.pedestrians.length = 0;
    Game.potholes.length = 0;
    Game.coins.length = 0;
    Game.poops.length = 0;
    Game.stands.length = 0;
    // peatones iniciales
    for (let i = 0; i < 6; i++) {
      Game.pedestrians.push(new Pedestrian(300 + i * 220, i % 2 === 0 ? 0 : 2, 20 + this.rng() * 25));
    }
    // puesto de cubanitos de introducción
    this.spawnStand(1500);
  },

  get difficulty() { return Game.difficulty; },

  spawnStand(x) {
    const lane = this.rng() < 0.5 ? 0 : 2;
    const s = new CubanitoStand(x, lane);
    Game.stands.push(s);
    Game.coins.push(new Coin(x + 40, CONFIG.LANES[lane].feetY - 46));
    this.lastStandX = x;
  },

  spawnPotholes(x, difficulty) {
    const lane = this.rng() < 0.5 ? 0 : 2;
    const count = 1 + Math.floor(this.rng() * Math.min(3, 1 + difficulty / 3));
    for (let i = 0; i < count; i++) {
      Game.potholes.push(new Pothole(x + i * 40 + this.rng() * 20, lane));
    }
  },

  spawnPigeons(x, difficulty) {
    const count = 1 + Math.floor(this.rng() * Math.min(3, 1 + difficulty / 2));
    for (let i = 0; i < count; i++) {
      const y = 100 + this.rng() * 190;
      const speed = CONFIG.PIGEON_BASE_SPEED + this.rng() * (CONFIG.PIGEON_MAX_SPEED - CONFIG.PIGEON_BASE_SPEED) * (0.3 + difficulty / 12);
      Game.pigeons.push(new Pigeon(x + i * 90 + this.rng() * 40, y, speed));
    }
  },

  spawnCar(x) {
    // 70% Amarok, 30% Falcon destruido
    const type = this.rng() < 0.7 ? 'amarok' : 'falcon';
    const speed = CONFIG.CAR_BASE_SPEED + this.rng() * (CONFIG.CAR_MAX_SPEED - CONFIG.CAR_BASE_SPEED);
    const dir = this.rng() < 0.75 ? -1 : 1;
    Game.cars.push(new Car(x, speed, dir, type));
  },

  spawnCoins(x, lane) {
    const n = 3 + Math.floor(this.rng() * 3);
    const baseY = CONFIG.LANES[lane].feetY - 46;
    for (let i = 0; i < n; i++) {
      Game.coins.push(new Coin(x + i * 26, baseY - Math.sin(i * 1.2) * 14));
    }
  },

  update(dt) {
    if (Game.player.distance >= CONFIG.LEVEL_LENGTH) {
      if (!Game.levelComplete) Game.completeLevel();
      return;
    }
    const cam = Game.cameraX;
    // mantener el mundo generado por delante de la cámara
    while (this.nextSpawnX < cam + this.HORIZON) {
      const x = this.nextSpawnX;
      const d = Game.difficulty;
      const r = this.rng();

      // puestos de cubanitos cada ~2400 px
      if (x - this.lastStandX > 2200 + this.rng() * 600) {
        this.spawnStand(x);
        this.nextSpawnX += 90;
        continue;
      }

      if (r < 0.28 + d * 0.02) {
        this.spawnPotholes(x, d);
        this.nextSpawnX += 90;
      } else if (r < 0.56 + d * 0.02) {
        this.spawnPigeons(x, d);
        this.nextSpawnX += 110;
      } else if (r < 0.70 + d * 0.01) {
        // tráfico: 1-2 autos (muchas Amarok)
        this.spawnCar(x);
        if (d > 2 && this.rng() < 0.5) this.spawnCar(x + 70 + this.rng() * 60);
        this.nextSpawnX += 70;
      } else if (r < 0.78) {
        this.spawnCoins(x, this.rng() < 0.5 ? 0 : 2);
        this.nextSpawnX += 70;
      } else if (r < 0.86) {
        // peatón caminando por la vereda
        const lane = this.rng() < 0.5 ? 0 : 2;
        const ped = new Pedestrian(x, lane, 15 + this.rng() * 25);
        ped.isDeco = true;
        Game.pedestrians.push(ped);
        this.nextSpawnX += 120;
      } else {
        // decoración urbana: árbol o farola en una vereda
        const lane = this.rng() < 0.5 ? 0 : 2;
        const type = this.rng() < 0.6 ? 'tree' : 'lamp';
        Game.deco.push({ x, lane, type });
        this.nextSpawnX += 140;
      }

      this.nextSpawnX += 40 + this.rng() * 140;
    }
  },
};
