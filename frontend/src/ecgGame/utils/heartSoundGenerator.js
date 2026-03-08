// src/utils/heartSoundGenerator.js
// Sonido tipo corazón (S1/S2 "lub-dub") sincronizado con el pico R.

export class HeartSoundGenerator {
  constructor() {
    this.audioContext = null;
    this.master = null;
    this.compressor = null;

    this.isPlaying = false;
    this.rhythmType = 'normal';
    this.bpm = 75;

    this.volume = 1.0;

    // Modo de sonido: 'heart' (S1/S2) o 'beep' (monitor)
    this.soundStyle = 'heart';

    this.lastSoundTime = 0;
    this.minSoundIntervalSec = 0.06;

    // Perfil de sonido de corazón (simple pero convincente)
    this.heartProfile = {
      s1: { level: 0.95, toneFreq: 70, bpFreq: 85, q: 1.2, dur: 0.085, attack: 0.004, decay: 0.095, noiseMix: 0.35 },
      s2: { level: 0.70, toneFreq: 105, bpFreq: 130, q: 1.6, dur: 0.060, attack: 0.003, decay: 0.070, noiseMix: 0.28 },
      // "room" muy suave (un pelín de cola)
      tail: { level: 0.10, lpFreq: 260, dur: 0.12 }
    };

    // Perfil de beep (por si lo quieres recuperar)
    this.beepProfile = {
      tickLevel: 0.22,
      beepLevel: 0.90,
      beepDuration: 0.075,
      attack: 0.002,
      decay: 0.070,
      baseFreq: 930,
      freqSpan: 260
    };
  }

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Compresor suave: permite subir volumen sin clipear.
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(18, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.09, this.audioContext.currentTime);

      this.master = this.audioContext.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.compressor);
      this.compressor.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  _freqFromBpm(bpm) {
    const hr = Math.max(30, Math.min(220, bpm));
    const t = (hr - 30) / (220 - 30);
    return this.beepProfile.baseFreq + t * this.beepProfile.freqSpan;
  }

  _clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  _createNoiseBuffer(ctx, durSec) {
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * durSec));
    const buffer = ctx.createBuffer(1, len, sr);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // ligera ventana para evitar clics feos
      const x = i / (len - 1);
      const win = Math.sin(Math.PI * x);
      data[i] = (Math.random() * 2 - 1) * win;
    }
    return buffer;
  }

  _playHeartComponent(now, cfg) {
    const ctx = this.audioContext;
    if (!ctx || !this.master) return;

    const dur = cfg.dur;

    // Tono (muy grave) + ruido filtrado (valvular)
    const tone = ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(cfg.toneFreq, now);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(1.0 - cfg.noiseMix, now);

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this._createNoiseBuffer(ctx, Math.min(dur, 0.10));

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(cfg.bpFreq, now);
    bp.Q.setValueAtTime(cfg.q, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(cfg.noiseMix, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(cfg.level, now + cfg.attack);
    env.gain.exponentialRampToValueAtTime(0.0001, now + cfg.decay);

    // Cola suave (simula un poco de resonancia torácica)
    const tail = ctx.createBiquadFilter();
    tail.type = 'lowpass';
    tail.frequency.setValueAtTime(this.heartProfile.tail.lpFreq, now);

    const tailGain = ctx.createGain();
    tailGain.gain.setValueAtTime(this.heartProfile.tail.level, now);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, now + this.heartProfile.tail.dur);

    // Conexiones
    tone.connect(toneGain);
    toneGain.connect(env);

    noiseSrc.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(env);

    env.connect(this.master);
    env.connect(tail);
    tail.connect(tailGain);
    tailGain.connect(this.master);

    tone.start(now);
    noiseSrc.start(now);

    tone.stop(now + dur);
    noiseSrc.stop(now + dur);
  }

  _s2DelaySec() {
    // S1->S2: más corto con FC alta
    const hr = Math.max(30, Math.min(220, this.bpm));
    const delay = 0.32 - (hr - 60) * 0.0016; // ~0.32s @60bpm, ~0.22s @120bpm
    return this._clamp(delay, 0.16, 0.34);
  }

  _heartNow() {
    const ctx = this.audioContext;
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    if (now - this.lastSoundTime < this.minSoundIntervalSec) return;
    this.lastSoundTime = now;

    this._playHeartComponent(now, this.heartProfile.s1);
    this._playHeartComponent(now + this._s2DelaySec(), this.heartProfile.s2);
  }

  _playTick(now) {
    const ctx = this.audioContext;
    if (!ctx || !this.master) return;

    const sr = ctx.sampleRate;
    const dur = 0.010;
    const len = Math.floor(sr * dur);

    const buffer = ctx.createBuffer(1, len, sr);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const env = 1 - i / len;
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1400, now);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2200, now);
    bp.Q.setValueAtTime(3.5, now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(this.beepProfile.tickLevel, now + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(hp);
    hp.connect(bp);
    bp.connect(g);
    g.connect(this.master);

    src.start(now);
    src.stop(now + dur);
  }

  _playBeep(now) {
    const ctx = this.audioContext;
    if (!ctx || !this.master) return;

    const f0 = this._freqFromBpm(this.bpm);
    const dur = this.beepProfile.beepDuration;

    const oscSine = ctx.createOscillator();
    oscSine.type = 'sine';
    oscSine.frequency.setValueAtTime(f0, now);
    oscSine.frequency.exponentialRampToValueAtTime(f0 * 1.10, now + 0.018);

    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(f0, now);

    const mix = ctx.createGain();
    mix.gain.setValueAtTime(1.0, now);

    const triLevel = ctx.createGain();
    triLevel.gain.setValueAtTime(0.22, now);

    oscSine.connect(mix);
    oscTri.connect(triLevel);
    triLevel.connect(mix);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f0, now);
    bp.Q.setValueAtTime(7.0, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(this.beepProfile.beepLevel, now + this.beepProfile.attack);
    env.gain.exponentialRampToValueAtTime(0.0001, now + this.beepProfile.decay);

    mix.connect(bp);
    bp.connect(env);
    env.connect(this.master);

    oscSine.start(now);
    oscTri.start(now);
    oscSine.stop(now + dur);
    oscTri.stop(now + dur);
  }

  _beepNow() {
    const ctx = this.audioContext;
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    if (now - this.lastSoundTime < this.minSoundIntervalSec) return;
    this.lastSoundTime = now;

    if (this.enableTick) this._playTick(now);
    this._playBeep(now + 0.001);
  }

  start(rhythmType, bpm) {
    this.initialize();
    this.isPlaying = true;
    this.rhythmType = rhythmType;
    this.bpm = bpm;
  }

  triggerHeartBeat() {
    if (!this.audioContext || !this.isPlaying) return;

    if (this.rhythmType === 'asystole') return;

    if (this.soundStyle === 'beep') this._beepNow();
    else this._heartNow();
  }

  stop() {
    this.isPlaying = false;
  }

  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.master = null;
    }
  }
}
