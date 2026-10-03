// Sons de interface gerados via WebAudio — nada de arquivos externos.
// DESATIVADO por padrão; ativado nas Configurações.

class SoundService {
  constructor() {
    this.enabled = false;
    this._ctx = null;
  }

  _ensure() {
    if (!this.enabled) return null;
    if (!this._ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this._ctx = new AC();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
    return this._ctx;
  }

  _tone({ freq = 660, end = null, dur = 0.12, type = 'sine', gain = 0.05, delay = 0 }) {
    const ctx = this._ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (end) osc.frequency.exponentialRampToValueAtTime(end, t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  click() {
    this._tone({ freq: 2300, dur: 0.035, type: 'sine', gain: 0.028 });
  }

  open() {
    this._tone({ freq: 520, end: 680, dur: 0.09, type: 'sine', gain: 0.04 });
  }

  success() {
    this._tone({ freq: 660, dur: 0.1, type: 'sine', gain: 0.05 });
    this._tone({ freq: 990, dur: 0.14, type: 'sine', gain: 0.045, delay: 0.07 });
  }

  expense() {
    this._tone({ freq: 340, end: 230, dur: 0.16, type: 'triangle', gain: 0.05 });
  }

  warn() {
    this._tone({ freq: 480, dur: 0.09, type: 'sine', gain: 0.05 });
    this._tone({ freq: 400, dur: 0.12, type: 'sine', gain: 0.05, delay: 0.1 });
  }
}

export const sound = new SoundService();
