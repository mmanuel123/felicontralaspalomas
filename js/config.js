// ============================================================
// config.js — Valores de balance del juego
// Toda variable de balance vive acá para poder ajustarla
// sin tocar la lógica principal.
// ============================================================
const CONFIG = {
  // Resolución virtual del juego (se escala para llenar la pantalla)
  VW: 640,
  VH: 360,

  // Jugador
  PLAYER_MAX_HP: 100,
  PLAYER_START_HP: 100,
  PLAYER_BASE_SPEED: 130,        // px por segundo (el mundo avanza)
  PLAYER_MAX_SPEED: 260,
  PLAYER_ACCEL: 6,               // aceleración del run automático
  PLAYER_JUMP_SPEED: -370,       // velocidad inicial del salto (negativa = hacia arriba)
  PLAYER_GRAVITY: 980,
  JUMP_BOUNCE: 0.65,             // rebote tras matar paloma con patada

  // Daño
  POTHOLE_DAMAGE: 10,
  PIGEON_DAMAGE: 15,
  PIGEON_POOP_DAMAGE: 15,
  CAR_DAMAGE: 50,
  CAR_KNOCKBACK: 320,

  // Recuperación
  CUBANITO_HEAL: 50,

  // Monedas
  PIGEON_COIN_REWARD: 1,
  COIN_VALUE: 1,
  CUBANITO_PRICE: 3,

  // Palomas
  PIGEON_BASE_SPEED: 60,
  PIGEON_MAX_SPEED: 150,
  PIGEON_POOP_COOLDOWN: 1.6,     // segundos entre defecadas
  PIGEON_POOP_SPEED: 260,

  // Autos
  CAR_BASE_SPEED: 160,
  CAR_MAX_SPEED: 340,

  // Peatones
  PEDESTRIAN_SPEED: 40,

  // Nivel 1 — ALSINA
  LEVEL_NAME: "ALSINA",
  LEVEL_LENGTH: 14000,           // distancia en px hasta completar
  LEVEL_START_DIFFICULTY: 0,
  LEVEL_MAX_DIFFICULTY: 10,

  // Lanes (posiciones Y de los pies del personaje)
  LANES: [
    { name: 'vereda_superior', feetY: 152, type: 'sidewalk' },
    { name: 'calle',          feetY: 228, type: 'street'   },
    { name: 'vereda_inferior',feetY: 312, type: 'sidewalk' },
  ],
  PLAYER_START_LANE: 1,

  // Visual
  TILE: 8,                       // tamaño del pixel base
};
