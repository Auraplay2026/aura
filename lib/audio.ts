"use client";

import { useTradingStore } from "./store";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn("Web Audio API is not supported or blocked by browser policies.", err);
    return null;
  }
}

// Automatically resume/initialize on user interaction anywhere on page
if (typeof window !== "undefined") {
  const initAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        // Remove listener once active
        window.removeEventListener("click", initAudio);
        window.removeEventListener("keydown", initAudio);
      });
    }
  };
  window.addEventListener("click", initAudio);
  window.addEventListener("keydown", initAudio);
}

// Get sfx volume scale multiplier
function getSfxMultiplier(): number {
  try {
    const store = useTradingStore.getState();
    if (store.soundEnabled === false) return 0;
    return (store.sfxVolume ?? 50) / 100;
  } catch (e) {
    return 0.5; // SSR fallback
  }
}

// 1. Click sound: crisp, fast beep
export function playClick() {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

  gain.gain.setValueAtTime(0.06 * mult, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

// 2. Ticker sound: fast, mechanical wooden block click for reel stops and tickers
export function playTick() {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.04);

  gain.gain.setValueAtTime(0.12 * mult, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}

// 3. Spin sound: upward frequency pitch sweep
export function playSpinSound(duration = 0.6) {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.linearRampToValueAtTime(320, now + duration);

  gain.gain.setValueAtTime(0.04 * mult, now);
  gain.gain.linearRampToValueAtTime(0.06 * mult, now + duration * 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

// 4. Win sound: uplifting C-major arpeggio + repeating coin clinks
export function playWinSound(isPremium = false) {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // C-Major Chord arpeggio (C5 -> E5 -> G5 -> C6)
  const notes = isPremium 
    ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00] 
    : [523.25, 659.25, 783.99, 1046.50];
  const stagger = 0.075;

  notes.forEach((freq, index) => {
    const noteTime = now + index * stagger;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, noteTime);

    // Subtle vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 14;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.1 * mult, noteTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(noteTime);
    osc.start(noteTime);

    lfo.stop(noteTime + 0.25);
    osc.stop(noteTime + 0.25);
  });

  // Coin drops
  const coinCount = isPremium ? 12 : 5;
  for (let i = 0; i < coinCount; i++) {
    const coinTime = now + i * 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(950 + Math.random() * 250, coinTime);
    osc.frequency.exponentialRampToValueAtTime(650, coinTime + 0.08);

    gain.gain.setValueAtTime(0.03 * mult, coinTime);
    gain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(coinTime);
    osc.stop(coinTime + 0.08);
  }
}

// 5. Lose sound: retro detuned sawtooth descending buzzer
export function playLoseSound() {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(220, now);
  osc1.frequency.linearRampToValueAtTime(130, now + 0.4);

  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(224, now);
  osc2.frequency.linearRampToValueAtTime(132, now + 0.4);

  gain.gain.setValueAtTime(0.06 * mult, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);

  osc1.stop(now + 0.4);
  osc2.stop(now + 0.4);
}

// 6. Jackpot sound: massive fanfare arpeggio + fast coin shower
export function playJackpotSound() {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  playWinSound(true);

  // Play double-tempo fanfare melody
  const melody = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1318.51, 1567.98];
  melody.forEach((freq, idx) => {
    const noteTime = now + 0.35 + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.04 * mult, noteTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.15);
  });
}

// 7. Hover tick: super short, quiet, high-frequency pop
export function playHover() {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.setValueAtTime(2200, now + 0.004);

  gain.gain.setValueAtTime(0.006 * mult, now); // Extremely quiet!
  gain.gain.setValueAtTime(0, now + 0.01);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.01);
}

// ================= Generative Background Ambiance =================
let ambientInterval: NodeJS.Timeout | null = null;
let ambientOscs: OscillatorNode[] = [];
let ambientGains: GainNode[] = [];

export function startAmbientMusic(preset: 'default' | 'tension' | 'cyber' = 'default') {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Stop current scheduling loop
  stopAmbientMusic();

  const getStoreState = () => {
    try {
      return useTradingStore.getState();
    } catch (e) {
      return { soundEnabled: true, ambientEnabled: true };
    }
  };

  const scaleDefault = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
  const scaleTensionBass = [65.41, 73.42, 87.31]; // C2, D2, F2
  const scaleTensionChime = [1046.50, 1244.51, 1567.98, 1864.66]; // C6, Eb6, G6, Bb6

  if (preset === 'default') {
    const playNextNote = () => {
      const store = getStoreState();
      if (store.soundEnabled === false || store.ambientEnabled === false) {
        stopAmbientMusic();
        return;
      }
      const currentCtx = getAudioContext();
      if (!currentCtx) return;
      const freq = scaleDefault[Math.floor(Math.random() * scaleDefault.length)];
      const now = currentCtx.currentTime;
      const osc = currentCtx.createOscillator();
      const gain = currentCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.004, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
      osc.connect(gain);
      gain.connect(currentCtx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
      ambientOscs.push(osc);
      ambientGains.push(gain);
      if (ambientOscs.length > 25) {
        ambientOscs = ambientOscs.slice(-10);
        ambientGains = ambientGains.slice(-10);
      }
    };
    ambientInterval = setInterval(playNextNote, 3500) as any;
    playNextNote();
  } else if (preset === 'tension') {
    const playTension = () => {
      const store = getStoreState();
      if (store.soundEnabled === false || store.ambientEnabled === false) {
        stopAmbientMusic();
        return;
      }
      const currentCtx = getAudioContext();
      if (!currentCtx) return;
      const now = currentCtx.currentTime;

      // Play low bass drone
      const bassFreq = scaleTensionBass[Math.floor(Math.random() * scaleTensionBass.length)];
      const oscBass = currentCtx.createOscillator();
      const gainBass = currentCtx.createGain();
      oscBass.type = "sine";
      oscBass.frequency.setValueAtTime(bassFreq, now);
      gainBass.gain.setValueAtTime(0, now);
      gainBass.gain.linearRampToValueAtTime(0.008, now + 1.0);
      gainBass.gain.linearRampToValueAtTime(0.008, now + 3.0);
      gainBass.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      oscBass.connect(gainBass);
      gainBass.connect(currentCtx.destination);
      oscBass.start(now);
      oscBass.stop(now + 4.5);
      ambientOscs.push(oscBass);
      ambientGains.push(gainBass);

      // Infrequent high-tension chime
      if (Math.random() > 0.4) {
        const chimeFreq = scaleTensionChime[Math.floor(Math.random() * scaleTensionChime.length)];
        const oscChime = currentCtx.createOscillator();
        const gainChime = currentCtx.createGain();
        oscChime.type = "sine";
        oscChime.frequency.setValueAtTime(chimeFreq, now + 1.0 + Math.random());
        gainChime.gain.setValueAtTime(0, now + 1.0);
        gainChime.gain.linearRampToValueAtTime(0.003, now + 1.2);
        gainChime.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
        oscChime.connect(gainChime);
        gainChime.connect(currentCtx.destination);
        oscChime.start(now + 1.0);
        oscChime.stop(now + 3.5);
        ambientOscs.push(oscChime);
        ambientGains.push(gainChime);
      }

      if (ambientOscs.length > 25) {
        ambientOscs = ambientOscs.slice(-10);
        ambientGains = ambientGains.slice(-10);
      }
    };
    ambientInterval = setInterval(playTension, 4000) as any;
    playTension();
  } else if (preset === 'cyber') {
    let step = 0;
    const cyberSequence = [130.81, 164.81, 196.00, 220.00, 261.63, 329.63, 392.00, 440.00]; // C3, E3, G3, A3, C4, E4, G4, A4
    const playCyber = () => {
      const store = getStoreState();
      if (store.soundEnabled === false || store.ambientEnabled === false) {
        stopAmbientMusic();
        return;
      }
      const currentCtx = getAudioContext();
      if (!currentCtx) return;
      const now = currentCtx.currentTime;
      const freq = cyberSequence[step % cyberSequence.length];
      step++;

      const osc = currentCtx.createOscillator();
      const gain = currentCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.003, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(currentCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      ambientOscs.push(osc);
      ambientGains.push(gain);

      if (ambientOscs.length > 25) {
        ambientOscs = ambientOscs.slice(-10);
        ambientGains = ambientGains.slice(-10);
      }
    };
    ambientInterval = setInterval(playCyber, 300) as any;
    playCyber();
  }
}

export function stopAmbientMusic() {
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
  ambientOscs.forEach(o => { try { o.stop(); o.disconnect(); } catch (e) {} });
  ambientGains.forEach(g => { try { g.disconnect(); } catch (e) {} });
  ambientOscs = [];
  ambientGains = [];
}

// ================= Continuous Rocket Synthesis (Crash) =================
let crashOsc: OscillatorNode | null = null;
let crashGain: GainNode | null = null;

export function startCrashAudio() {
  const mult = getSfxMultiplier();
  if (mult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  stopCrashAudio(false);

  crashOsc = ctx.createOscillator();
  crashGain = ctx.createGain();

  crashOsc.type = "sine";
  // Low rumble
  crashOsc.frequency.setValueAtTime(75, ctx.currentTime);

  crashGain.gain.setValueAtTime(0, ctx.currentTime);
  crashGain.gain.linearRampToValueAtTime(0.03 * mult, ctx.currentTime + 0.15);

  crashOsc.connect(crashGain);
  crashGain.connect(ctx.destination);

  crashOsc.start();
}

export function updateCrashPitch(multiplier: number) {
  const mult = getSfxMultiplier();
  if (mult <= 0) {
    stopCrashAudio(false);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx || !crashOsc) return;

  // Frequency rises with multiplier (75Hz -> 1000Hz)
  const freq = Math.min(1000, 75 + multiplier * 45);
  crashOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);

  if (crashGain) {
    const vol = Math.min(0.06 * mult, 0.03 * mult + (multiplier / 25) * 0.03 * mult);
    crashGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
  }
}

export function stopCrashAudio(isBust = false) {
  if (crashOsc) {
    try {
      crashOsc.stop();
      crashOsc.disconnect();
    } catch (e) {}
    crashOsc = null;
  }
  if (crashGain) {
    try {
      crashGain.disconnect();
    } catch (e) {}
    crashGain = null;
  }

  if (isBust) {
    // Explosion sound
    const mult = getSfxMultiplier();
    if (mult <= 0) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(25, now + 0.65);

    gain.gain.setValueAtTime(0.12 * mult, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }
}

// Central dispatcher
export function playGameSound(type: "click" | "spin" | "tick" | "win" | "lose" | "jackpot" | "hover") {
  let soundEnabled = true;
  try {
    soundEnabled = useTradingStore.getState().soundEnabled !== false;
  } catch (e) {}

  if (!soundEnabled) return;

  switch (type) {
    case "click":
      playClick();
      break;
    case "spin":
      playSpinSound();
      break;
    case "tick":
      playTick();
      break;
    case "win":
      playWinSound();
      break;
    case "lose":
      playLoseSound();
      break;
    case "jackpot":
      playJackpotSound();
      break;
    case "hover":
      playHover();
      break;
  }
}
