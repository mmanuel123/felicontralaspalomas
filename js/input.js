// ============================================================
// input.js — Teclado + controles táctiles
// upPressed/downPressed son transiciones (una pulsación = un cambio)
// ============================================================
const Input = {
  up: false,
  down: false,
  jump: false,
  upPressed: false,
  downPressed: false,
  jumpPressed: false,
  interactPressed: false,

  init() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.repeat) return;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.up = true; this.upPressed = true; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { this.down = true; this.downPressed = true; }
      if (e.code === 'Space') { this.jump = true; this.jumpPressed = true; }
      if (e.code === 'Enter' || e.code === 'KeyE') this.interactPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.down = false;
      if (e.code === 'Space') this.jump = false;
    });

    // Botones táctiles
    this._bindTouch('btn-up', 'up');
    this._bindTouch('btn-down', 'down');
    this._bindTouch('btn-jump', 'jump');
  },

  _bindTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    const press = (e) => {
      e.preventDefault();
      el.classList.add('active');
      if (key === 'jump') { this.jump = true; this.jumpPressed = true; }
      else { this[key] = true; this[key + 'Pressed'] = true; }
    };
    const release = (e) => {
      e.preventDefault();
      el.classList.remove('active');
      if (key === 'jump') this.jump = false;
      else this[key] = false;
    };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);
  },

  // Se llama al inicio de cada frame
  clearPressed() {
    this.jumpPressed = false;
    this.interactPressed = false;
    this.upPressed = false;
    this.downPressed = false;
  },
};
