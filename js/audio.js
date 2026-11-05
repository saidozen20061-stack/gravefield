  // ================= sound =================
  let AC = null;
  const lastSfx = {};
  function tone(name, f, dur, type, vol, slide, gap = 0.045) {
    if (!S.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const now = AC.currentTime;
      if (lastSfx[name] && now - lastSfx[name] < gap) return;
      lastSfx[name] = now;
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.setValueAtTime(f, now);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), now + dur);
      vol *= S.vol / 80;
      if (vol <= 0) return;
      g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(AC.destination); o.start(now); o.stop(now + dur + 0.02);
    } catch (e) {}
  }
  const SHOT_SFX = { pebble: [520, 'square', -200], arrow: [700, 'triangle', -350], bolt: [420, 'square', -220], ball: [180, 'sawtooth', -120], fire: [300, 'sawtooth', 200], spark: [1400, 'square', -900], cannon: [110, 'sawtooth', -70],
    magic: [620, 'triangle', -250], frost: [1100, 'sine', -600], arcane: [260, 'sine', 240], knife: [950, 'triangle', -500], star: [1250, 'square', -700],
    dart: [820, 'triangle', -420], soul: [420, 'sine', 320], slash: [240, 'sawtooth', -160] };
  const sfx = {
    shoot: t => { const s = SHOT_SFX[t]; tone('shoot', s[0], t === 'cannon' ? 0.2 : 0.07, s[1], t === 'cannon' || t === 'ball' ? 0.05 : 0.025, s[2], 0.05); },
    hit: () => tone('hit', 200, 0.05, 'triangle', 0.05, -80, 0.04),
    kill: () => tone('kill', 150, 0.14, 'sawtooth', 0.035, -90, 0.05),
    coin: () => tone('coin', 1320, 0.06, 'square', 0.02, 300, 0.05),
    gem: () => tone('gem', 900, 0.07, 'sine', 0.05, 500, 0.05),
    hurt: () => tone('hurt', 160, 0.14, 'sawtooth', 0.05, -60, 0.12),
    step: () => tone('step', 90, 0.04, 'triangle', 0.025, -20, 0.1),
    buy: () => { tone('buy1', 660, 0.08, 'square', 0.03, 0, 0); setTimeout(() => tone('buy2', 990, 0.12, 'square', 0.03, 0, 0), 70); },
    boss: () => tone('boss', 90, 0.8, 'sawtooth', 0.06, -30, 0.5),
    leap: () => tone('leap', 220, 0.18, 'triangle', 0.035, 260, 0.1),
    thud: () => tone('thud', 70, 0.16, 'sawtooth', 0.05, -30, 0.08),
    charge: () => tone('charge', 140, 0.3, 'sawtooth', 0.035, 180, 0.15),
    spit: () => tone('spit', 380, 0.09, 'square', 0.025, -200, 0.08),
    boom: () => tone('boom', 80, 0.35, 'sawtooth', 0.07, -50, 0.1),
    chest: () => [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone('ch' + i, f, 0.1, 'square', 0.03, 0, 0), i * 55)),
    power: () => [392, 587, 784, 1175].forEach((f, i) => setTimeout(() => tone('pw' + i, f, 0.14, 'triangle', 0.05, 200, 0), i * 60)),
    relic: () => [523, 784, 1046, 784, 1318, 1568].forEach((f, i) => setTimeout(() => tone('rl' + i, f, 0.18, 'triangle', 0.05, 0, 0), i * 90)),
    zap: () => tone('zap', 1800, 0.12, 'square', 0.03, -1500, 0.08),
    flame: () => tone('flame', 160, 0.08, 'sawtooth', 0.018, 120, 0.07),
    clear: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone('clr' + i, f, 0.16, 'square', 0.03, 0, 0), i * 90)),
    level: () => [392, 523, 659, 784].forEach((f, i) => setTimeout(() => tone('lv' + i, f, 0.12, 'triangle', 0.05, 0, 0), i * 70)),
  };

  // ================= music: a small chiptune sequencer, one loop per biome plus a boss theme =================
  // notes are MIDI numbers (0 = rest); lead steps are eighth notes, each bass note lasts two
  const TRACKS = {
    meadow: { bpm: 112, lw: 'square', bw: 'triangle',
      lead: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 79, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0, 74, 0, 0, 0],
      bass: [48, 0, 55, 0, 53, 0, 55, 0, 48, 0, 55, 0, 50, 0, 55, 0] },
    swamp: { bpm: 84, lw: 'triangle', bw: 'triangle',
      lead: [62, 0, 0, 65, 0, 0, 69, 0, 67, 0, 0, 65, 0, 0, 62, 0, 60, 0, 0, 62, 0, 0, 65, 0, 64, 0, 62, 0, 0, 0, 0, 0],
      bass: [38, 0, 0, 0, 45, 0, 0, 0, 36, 0, 0, 0, 43, 0, 0, 0] },
    frozen: { bpm: 96, lw: 'sine', bw: 'triangle',
      lead: [81, 0, 76, 0, 72, 0, 76, 0, 79, 0, 76, 0, 71, 0, 0, 0, 81, 0, 84, 0, 83, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0],
      bass: [45, 0, 0, 0, 40, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0] },
    ember: { bpm: 128, lw: 'sawtooth', bw: 'square', hat: true,
      lead: [64, 0, 65, 64, 0, 0, 71, 0, 69, 0, 67, 0, 65, 64, 0, 0, 64, 0, 65, 67, 0, 0, 72, 71, 69, 0, 65, 0, 64, 0, 0, 0],
      bass: [40, 40, 0, 40, 41, 0, 40, 0, 40, 40, 0, 40, 43, 0, 41, 0] },
    desert: { bpm: 108, lw: 'square', bw: 'triangle',
      lead: [69, 0, 70, 0, 73, 0, 74, 0, 76, 0, 74, 73, 0, 70, 69, 0, 69, 0, 70, 0, 73, 0, 76, 77, 76, 0, 74, 0, 73, 0, 0, 0],
      bass: [45, 0, 45, 0, 52, 0, 45, 0, 46, 0, 46, 0, 52, 0, 45, 0] },
    // map themes (the Chapel Field keeps the biome tunes above)
    cemetery: { bpm: 92, lw: 'triangle', bw: 'triangle', // a slow minor waltz among the graves
      lead: [69, 0, 72, 0, 76, 0, 75, 0, 76, 0, 72, 0, 69, 0, 0, 0, 67, 0, 71, 0, 74, 0, 72, 0, 71, 0, 67, 0, 64, 0, 0, 0],
      bass: [45, 0, 52, 0, 45, 0, 52, 0, 43, 0, 50, 0, 40, 0, 47, 0] },
    castle: { bpm: 104, lw: 'square', bw: 'sawtooth', hat: true, // a grim royal march
      lead: [62, 0, 62, 65, 69, 0, 67, 65, 64, 0, 64, 67, 70, 0, 69, 67, 65, 0, 69, 0, 74, 0, 72, 70, 69, 0, 67, 0, 65, 0, 0, 0],
      bass: [38, 0, 45, 0, 38, 0, 45, 0, 43, 0, 50, 0, 45, 0, 40, 0] },
    library: { bpm: 80, lw: 'sine', bw: 'triangle', echo: true, // a hushed music box that echoes down the stacks
      lead: [76, 0, 0, 79, 0, 0, 83, 0, 81, 0, 0, 79, 0, 0, 76, 0, 74, 0, 0, 77, 0, 0, 81, 0, 79, 0, 77, 0, 76, 0, 0, 0],
      bass: [40, 0, 0, 0, 45, 0, 0, 0, 38, 0, 0, 0, 43, 0, 0, 0] },
    backrooms: { bpm: 60, lw: 'sine', bw: 'triangle', echo: true, // almost nothing: a lonely note now and then over a low drone
      lead: [0, 0, 0, 0, 0, 0, 0, 0, 71, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0, 0, 0],
      bass: [35, 0, 0, 0, 0, 0, 0, 0, 34, 0, 0, 0, 0, 0, 0, 0] },
    ascend: { bpm: 58, lw: 'sine', bw: 'triangle', echo: true,
      lead: [81, 0, 0, 0, 0, 0, 80, 0, 0, 0, 0, 0, 76, 0, 0, 0, 81, 0, 0, 0, 0, 0, 84, 0, 83, 0, 0, 0, 0, 0, 0, 0],
      bass: [33, 0, 0, 0, 32, 0, 0, 0, 29, 0, 0, 0, 28, 0, 0, 0] },
    boss: { bpm: 150, lw: 'square', bw: 'sawtooth', hat: true,
      lead: [72, 0, 75, 0, 79, 0, 78, 0, 77, 0, 75, 0, 74, 0, 71, 0, 72, 0, 75, 0, 79, 0, 84, 0, 83, 0, 79, 0, 78, 0, 77, 0],
      bass: [36, 36, 48, 36, 36, 48, 36, 36, 35, 35, 47, 35, 35, 47, 39, 38] },
  };
  const MUSIC_KEY = 'gravefield-music';
  const MUSIC = { on: true, track: null, step: 0, next: 0, out: null, noise: null };
  try { MUSIC.on = localStorage.getItem(MUSIC_KEY) !== '0'; } catch (e) {}
  const midiHz = n => 440 * Math.pow(2, (n - 69) / 12);
  function musicNote(f, t, len, wave, vol, echo) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = wave; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(MUSIC.out); o.start(t); o.stop(t + len + 0.02);
    if (echo) {
      // a long feedback delay, so every note keeps ringing back from the dark
      if (!MUSIC.echo) {
        const d = AC.createDelay(2), fb = AC.createGain(), lp = AC.createBiquadFilter();
        d.delayTime.value = 0.62; fb.gain.value = 0.55; lp.type = 'lowpass'; lp.frequency.value = 1800;
        d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(MUSIC.out); MUSIC.echo = d;
      }
      g.connect(MUSIC.echo);
    }
  }
  function musicHat(t) {
    if (!MUSIC.noise) {
      const b = AC.createBuffer(1, AC.sampleRate * 0.05, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      MUSIC.noise = b;
    }
    const s = AC.createBufferSource(), g = AC.createGain(), hp = AC.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 6000; g.gain.value = 0.18;
    s.buffer = MUSIC.noise; s.connect(hp); hp.connect(g); g.connect(MUSIC.out); s.start(t);
  }
  // called every frame: picks the track for where you are and schedules the next notes slightly ahead
  function musicTick() {
    if (!AC) return;
    if (!MUSIC.out) { MUSIC.out = AC.createGain(); MUSIC.out.gain.value = 0; MUSIC.out.connect(AC.destination); }
    // silent on the title screen and menus: the music only starts once you are in a game
    // every map has its own theme; the Chapel Field plays the tune of the biome you're in.
    // The Dead Mart has no music at all, only its broken-PA ambience (bosses and hordes included)
    const mapId = MAPS[curMap] ? MAPS[curMap].id : 'field', noMusic = mapId === 'market' && !G.ascend;
    const quiet = G.paused || G.options || G.choosing || G.intro, vol = MUSIC.on && S.sound && !G.menu && !noMusic ? 0.35 * (S.vol / 100) * (quiet ? 0.35 : 1) : 0;
    MUSIC.out.gain.setTargetAtTime(vol, AC.currentTime, 0.25);
    ambienceTick(mapId, quiet);
    if (!vol) return;
    const want = G.ascend ? 'ascend' : G.menu ? 'meadow' : G.boss || G.horde ? 'boss' : TRACKS[mapId] ? mapId : BIOMES[curBiome].id;
    if (want !== MUSIC.track) { MUSIC.track = want; MUSIC.step = 0; MUSIC.next = AC.currentTime + 0.1; }
    if (MUSIC.next < AC.currentTime - 0.2) MUSIC.next = AC.currentTime + 0.05; // the tab was asleep: don't burst the backlog
    const T = TRACKS[want], dur = 60 / T.bpm / 2;
    while (MUSIC.next < AC.currentTime + 0.3) {
      const i = MUSIC.step, t = MUSIC.next, n = T.lead[i % T.lead.length];
      if (n) musicNote(midiHz(n), t, T.echo ? dur * 3 : dur * 0.9, T.lw, T.lw === 'sawtooth' ? 0.05 : 0.08, T.echo);
      if (i % 2 === 0) { const b = T.bass[(i / 2) % T.bass.length]; if (b) musicNote(midiHz(b), t, T.echo ? dur * 7 : dur * 1.8, T.bw, 0.12); }
      if (T.hat && i % 2 === 1) musicHat(t);
      MUSIC.step++; MUSIC.next += dur;
    }
  }
  // ---- map ambience: background sound effects that play with sound on, even when the music is switched off ----
  // Dead Mart: a broken PA (buzzing hum, crackles, a long rasping "hgggg" through the mic, feedback squeals)
  // Backrooms: fluorescent lights buzzing, the odd flicker, and something heavy far away
  const AMB = { out: null, map: null, loop: [], next: 0, nextBig: 0 };
  function ambLoop(type, f, filt, ff, q, vol) {
    const o = AC.createOscillator(), bq = AC.createBiquadFilter(), g = AC.createGain();
    o.type = type; o.frequency.value = f; bq.type = filt; bq.frequency.value = ff; bq.Q.value = q; g.gain.value = vol;
    o.connect(bq); bq.connect(g); g.connect(AMB.out); o.start();
    AMB.loop.push(o);
  }
  function ambienceTick(mapId, quiet) {
    if (!AMB.out) { AMB.out = AC.createGain(); AMB.out.gain.value = 0; AMB.out.connect(AC.destination); }
    const on = S.sound && !G.menu && (mapId === 'market' || mapId === 'backrooms');
    AMB.out.gain.setTargetAtTime(on ? 1.6 * (S.vol / 100) * (quiet ? 0.4 : 1) : 0, AC.currentTime, 0.3);
    const want = on ? mapId : null, now = AC.currentTime;
    if (want !== AMB.map) {
      for (const o of AMB.loop) o.stop(now + 0.4);
      AMB.loop = []; AMB.map = want; AMB.next = now + 0.5; AMB.nextBig = now + 2;
      if (want === 'market') {
        ambLoop('sawtooth', 120, 'lowpass', 500, 1, 0.05);     // a bad speaker's mains hum, audible on small speakers
        ambLoop('square', 60, 'bandpass', 180, 2, 0.03);       // and its low growl underneath
      } else if (want === 'backrooms') {
        ambLoop('sawtooth', 120, 'bandpass', 1900, 6, 0.035);  // the fluorescent tubes' thin buzz
        ambLoop('sawtooth', 120, 'lowpass', 300, 1, 0.04);     // and their drone
      }
    }
    if (want === 'backrooms') grinnerSound(now, quiet); else stopGrinnerSound();
    if (!want || quiet) return;
    if (now > AMB.next) {
      if (want === 'market') { micGrit(now + 0.02, rand(0.08, 0.3), 0.2, false, AMB.out); AMB.next = now + rand(0.5, 2); }
      else { micGrit(now + 0.02, rand(0.04, 0.12), 0.06, false, AMB.out); AMB.next = now + rand(2, 6); } // a light tube flickers
    }
    if (now > AMB.nextBig) {
      if (want === 'market') { micGrit(now + 0.05, rand(1.2, 2.2), 0.3, true, AMB.out); AMB.nextBig = now + rand(5, 10); }
      else { ambThud(now + 0.05); AMB.nextBig = now + rand(12, 25); }
    }
  }
  // the Grinner's presence: ragged breathing over a low drone, rising from nothing as it closes in; the breaths quicken,
  // and once it's near you hear its teeth clicking
  function hissBuffer() {
    if (!MUSIC.hiss) {
      const b = AC.createBuffer(1, AC.sampleRate, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      MUSIC.hiss = b;
    }
    return MUSIC.hiss;
  }
  function grinnerSound(now, quiet) {
    const g = G.monsters.find(m => m.d.grinner && !m.dead && m.rise <= 0);
    const k = g && !quiet ? Math.max(0, 1 - Math.hypot(g.x - P.x, g.y - P.y) / 480) : 0; // 0 far away .. 1 right on you
    if (!AMB.grin && k > 0) {
      const master = AC.createGain(); master.gain.value = 0; master.connect(AMB.out);
      const src = AC.createBufferSource(); src.buffer = hissBuffer(); src.loop = true;
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 1.6;
      const breath = AC.createGain(); breath.gain.value = 0.25;
      const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.7; lg.gain.value = 0.25; // in, out, in, out
      lfo.connect(lg); lg.connect(breath.gain);
      src.connect(bp); bp.connect(breath); breath.connect(master);
      const osc = AC.createOscillator(), lp = AC.createBiquadFilter(), dg = AC.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = 46; lp.type = 'lowpass'; lp.frequency.value = 220; dg.gain.value = 0.35;
      osc.connect(lp); lp.connect(dg); dg.connect(master);
      src.start(); lfo.start(); osc.start();
      AMB.grin = { master, lfo, nodes: [src, lfo, osc] }; AMB.click = now;
    }
    if (!AMB.grin) return;
    // louder the closer it gets (squared, so it swells sharply at the end), breathing faster
    AMB.grin.master.gain.setTargetAtTime(k * k * 0.8, now, 0.12);
    AMB.grin.lfo.frequency.setTargetAtTime(0.6 + k * 2.6, now, 0.3);
    if (k > 0.55 && now > AMB.click) {
      const s = AC.createBufferSource(), hp = AC.createBiquadFilter(), cg = AC.createGain(), t = now + 0.01;
      s.buffer = hissBuffer(); hp.type = 'highpass'; hp.frequency.value = 2800;
      cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime(0.25 * k, t + 0.005); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      s.connect(hp); hp.connect(cg); cg.connect(AMB.out); s.start(t, Math.random() * 0.5); s.stop(t + 0.04);
      AMB.click = now + rand(0.05, 0.22) / k;
    }
  }
  // when it strikes: a distorted shriek that tears downward, a burst of rasping static and a heavy hit underneath
  function grinnerScream() {
    if (!AC || !S.sound) return;
    const t = AC.currentTime + 0.01, vol = 0.55 * (S.vol / 100), out = AC.createGain();
    out.gain.value = vol; out.connect(AC.destination);
    const shaper = AC.createWaveShaper(), curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 6); } // hard clipping, like a voice through a blown speaker
    shaper.curve = curve; shaper.connect(out);
    // two detuned shrieks sliding down, with a fast wobble
    for (const det of [0, 37]) {
      const o = AC.createOscillator(), g = AC.createGain(), vib = AC.createOscillator(), vg = AC.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(1100 + det * 3, t); o.frequency.exponentialRampToValueAtTime(180 + det, t + 0.7);
      vib.frequency.value = 23; vg.gain.value = 60; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(g); g.connect(shaper); o.start(t); o.stop(t + 0.85); vib.start(t); vib.stop(t + 0.85);
    }
    // the rasp
    const s = AC.createBufferSource(), bp = AC.createBiquadFilter(), ng = AC.createGain();
    s.buffer = hissBuffer(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(500, t + 0.6); bp.Q.value = 2;
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.5, t + 0.02); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    s.connect(bp); bp.connect(ng); ng.connect(shaper); s.start(t, Math.random() * 0.3); s.stop(t + 0.7);
    // the impact
    const k = AC.createOscillator(), kg = AC.createGain();
    k.type = 'sine'; k.frequency.setValueAtTime(90, t); k.frequency.exponentialRampToValueAtTime(30, t + 0.35);
    kg.gain.setValueAtTime(0.0001, t); kg.gain.exponentialRampToValueAtTime(0.6, t + 0.01); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    k.connect(kg); kg.connect(out); k.start(t); k.stop(t + 0.45);
  }
  // a Crawler spots you: a wet, rising screech that cracks into a stutter of clicks, loud when it's close
  function crawlerShriek(m) {
    if (!AC || !S.sound) return;
    const k = Math.max(0.35, 1 - Math.hypot(m.x - P.x, m.y - P.y) / 500);
    const t = AC.currentTime + 0.01, out = AC.createGain(), stalker = m.d.crawler === 'stalker';
    out.gain.value = 0.5 * k * (S.vol / 100); out.connect(AC.destination);
    const shaper = AC.createWaveShaper(), curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 8); }
    shaper.curve = curve; shaper.connect(out);
    // the screech: climbs instead of falling, the stalker's lower and longer
    const f0 = stalker ? 160 : 260, f1 = stalker ? 900 : 1700, len = stalker ? 1.2 : 0.8;
    for (const det of [0, 23, 51]) {
      const o = AC.createOscillator(), g = AC.createGain(), vib = AC.createOscillator(), vg = AC.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 + det, t); o.frequency.exponentialRampToValueAtTime(f1 + det * 4, t + len * 0.7);
      vib.type = 'square'; vib.frequency.value = stalker ? 11 : 31; vg.gain.value = stalker ? 90 : 140; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.05); g.gain.setValueAtTime(0.16, t + len * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(shaper); o.start(t); o.stop(t + len + 0.05); vib.start(t); vib.stop(t + len + 0.05);
    }
    // the clicks: a dry rattle of joints as it drops and runs
    for (let i = 0; i < 14; i++) {
      const s = AC.createBufferSource(), hp = AC.createBiquadFilter(), cg = AC.createGain(), tt = t + len * 0.4 + i * rand(0.03, 0.06);
      s.buffer = hissBuffer(); hp.type = 'highpass'; hp.frequency.value = 2400;
      cg.gain.setValueAtTime(0.0001, tt); cg.gain.exponentialRampToValueAtTime(0.4, tt + 0.004); cg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.03);
      s.connect(hp); hp.connect(cg); cg.connect(out); s.start(tt, Math.random() * 0.5); s.stop(tt + 0.04);
    }
  }
  // caught in the light: a sharp, pained hiss as it recoils
  function crawlerHiss(m) {
    if (!AC || !S.sound) return;
    const k = Math.max(0.3, 1 - Math.hypot(m.x - P.x, m.y - P.y) / 400), t = AC.currentTime + 0.01;
    const s = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = hissBuffer(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(3200, t); bp.frequency.exponentialRampToValueAtTime(900, t + 0.5); bp.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6 * k * (S.vol / 100), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    s.connect(bp); bp.connect(g); g.connect(AC.destination); s.start(t, Math.random() * 0.3); s.stop(t + 0.6);
  }
  function stopGrinnerSound() {
    if (!AMB.grin) return;
    AMB.grin.master.gain.setTargetAtTime(0, AC.currentTime, 0.1);
    for (const n of AMB.grin.nodes) n.stop(AC.currentTime + 0.5);
    AMB.grin = null;
  }
  // a heavy, far-off thud: something moving behind the walls
  function ambThud(t) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(AMB.out); o.start(t); o.stop(t + 1);
  }
  // static through a dying microphone: band-passed noise chopped by a fast square wave gives the gritty rasp;
  // a long one sometimes ends in a thin squeal of feedback
  function micGrit(t, len, vol, long, dest = MUSIC.out) {
    if (!MUSIC.hiss) {
      const b = AC.createBuffer(1, AC.sampleRate, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      MUSIC.hiss = b;
    }
    const s = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
    s.buffer = MUSIC.hiss; s.loop = true;
    bp.type = 'bandpass'; bp.Q.value = long ? 3 : 1.2;
    bp.frequency.setValueAtTime(long ? 520 : rand(900, 2200), t);
    if (long) bp.frequency.linearRampToValueAtTime(380, t + len); // the voice-like rasp sinks as it drags on
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol, t + Math.max(0.05, len - 0.08)); g.gain.linearRampToValueAtTime(0.0001, t + len);
    lfo.type = 'square'; lfo.frequency.setValueAtTime(long ? rand(26, 34) : rand(40, 70), t); lg.gain.value = vol * 0.9;
    lfo.connect(lg); lg.connect(g.gain);
    s.connect(bp); bp.connect(g); g.connect(dest);
    s.start(t); s.stop(t + len + 0.05); lfo.start(t); lfo.stop(t + len + 0.05);
    if (long && Math.random() < 0.5) {
      const fb = AC.createOscillator(), fg = AC.createGain(), at = t + len * 0.6;
      fb.type = 'sine'; fb.frequency.setValueAtTime(2600, at); fb.frequency.linearRampToValueAtTime(3100, t + len);
      fg.gain.setValueAtTime(0.0001, at); fg.gain.linearRampToValueAtTime(0.03, at + 0.15); fg.gain.linearRampToValueAtTime(0.0001, t + len);
      fb.connect(fg); fg.connect(dest); fb.start(at); fb.stop(t + len + 0.05);
    }
  }
  // browsers only allow sound after a click or key press
  const wakeAudio = () => {
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {}
  };
  addEventListener('pointerdown', wakeAudio);
  addEventListener('keydown', wakeAudio);

