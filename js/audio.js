// ============================================================
// audio.js — Efectos de sonido y música 8-bit (Web Audio API)
// ============================================================
const AudioSys = {
  ctx: null,
  master: null,
  musicGain: null,
  muted: false,
  musicTimer: null,
  _stepIdx: 0,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
  },

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.6;
  },

  tone(freq, dur, type, vol, delay, slide) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(vol || 0.15, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },

  noise(dur, vol, delay, lpFreq) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lpFreq || 800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  },

  step() {
    this.noise(0.03, 0.05, 0, 400);
    this.tone(90, 0.04, 'triangle', 0.06);
  },
  jump() { this.tone(220, 0.25, 'square', 0.12, 0, 520); },
  land() { this.noise(0.06, 0.1, 0, 300); },
  kick() { this.tone(400, 0.1, 'square', 0.14, 0, 150); },
  pigeonHit() { this.tone(800, 0.12, 'sawtooth', 0.12, 0, 200); this.noise(0.1, 0.12, 0.02, 1500); },
  coin() { this.tone(880, 0.07, 'square', 0.12); this.tone(1320, 0.12, 'square', 0.12, 0.06); },
  hurt() { this.tone(200, 0.2, 'sawtooth', 0.16, 0, 80); this.noise(0.15, 0.12, 0, 500); },
  car() { this.tone(140, 0.3, 'sawtooth', 0.18, 0, 70); this.noise(0.25, 0.2, 0, 400); },
  bump() { this.tone(170, 0.1, 'square', 0.1, 0, 120); },
  poop() { this.noise(0.2, 0.15, 0, 500); this.tone(150, 0.2, 'triangle', 0.1, 0, 60); },
  buy() { this.tone(660, 0.1, 'square', 0.13); this.tone(990, 0.15, 'square', 0.13, 0.09); },
  eat() { this.tone(330, 0.08, 'triangle', 0.14); this.tone(440, 0.08, 'triangle', 0.14, 0.08); this.tone(550, 0.12, 'triangle', 0.14, 0.16); },
  death() { this.tone(400, 0.6, 'sawtooth', 0.18, 0, 40); this.tone(200, 0.8, 'square', 0.15, 0.2, 30); },
  levelUp() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, 'square', 0.13, i * 0.12)); },

  // ---- Música retro simple (secuencia looping) ----
  startMusic() {
    this.init();
    if (!this.ctx) return;
    this._stepIdx = 0;
    const seq = [
      220, 220, 262, 220, 330, 330, 294, 262,
      220, 220, 262, 220, 196, 196, 294, 220,
      440, 440, 392, 330, 294, 294, 262, 330,
      392, 392, 330, 294, 330, 262, 220, 196,
    ];
    const bass = [55, 55, 65, 49, 55, 55, 65, 49, 44, 44, 52, 44, 55, 49, 55, 65];
    const step = 0.16;
    const that = this;
    const tick = () => {
      if (that.muted) return;
      if (!that.ctx) return;
      const i = that._stepIdx % seq.length;
      const beat = Math.floor(that._stepIdx / 2) % bass.length;
      const t = that.ctx.currentTime;
      const o = that.ctx.createOscillator();
      const g = that.ctx.createGain();
      o.type = 'square';
      o.frequency.value = seq[i];
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(that.musicGain);
      o.start(t); o.stop(t + 0.16);
      if (that._stepIdx % 2 === 0) {
        const o2 = that.ctx.createOscillator();
        const g2 = that.ctx.createGain();
        o2.type = 'triangle';
        o2.frequency.value = bass[beat];
        g2.gain.setValueAtTime(0.1, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o2.connect(g2); g2.connect(that.musicGain);
        o2.start(t); o2.stop(t + 0.31);
      }
      if (that._stepIdx % 8 === 4) {
        that.tone(seq[i] * 2, 0.05, 'square', 0.04, 0);
      }
      that._stepIdx++;
    };
    tick();
    this.musicTimer = setInterval(tick, step * 1000);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },
};
