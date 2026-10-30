  // ================= biomes: every 10 stages the world is recoloured, with its own weather and monster trait =================
  const BIOMES = [
    { id: 'meadow', name: 'Graveyard Meadow', tip: 'Where the dead first rose.', col: '#5a9a3c' },
    { id: 'swamp', name: 'Murk Swamp', affix: 'regen', tip: 'Monsters here often regenerate.', col: '#4f6a3a', weather: 'fog',
      grass: ['#13241a', '#3f5a34'], water: ['#1e3418', '#6f8a2a'], dirt: ['#2e2418', '#5e5038'], tint: [40, 70, 50, 0.3] },
    { id: 'frozen', name: 'Frozen Crypt', affix: 'armored', tip: 'Monsters here are often ice-armored.', col: '#8fb4e0', weather: 'snow',
      grass: ['#8ea4c2', '#f4f8ff'], water: ['#5f9ccf', '#d8f0ff'], dirt: ['#6f7d8f', '#c3cfdd'], tint: [184, 212, 255, 0.3] },
    { id: 'ember', name: 'Ember Wastes', affix: 'volatile', tip: 'Monsters here often explode when they die.', col: '#d8402a', weather: 'embers',
      grass: ['#1a0e0c', '#45221a'], water: ['#b8300c', '#ffc24a'], dirt: ['#2e1a16', '#6a4436'], tint: [255, 80, 30, 0.2] },
    { id: 'desert', name: 'Bone Desert', affix: 'swift', tip: 'Monsters here are often swift.', col: '#e0b46a', weather: 'sand',
      grass: ['#c0904c', '#f2d49c'], water: ['#2f7a8f', '#8fd6d0'], dirt: ['#d9b277', '#fff0c8'], tint: [255, 217, 160, 0.2] },
  ];
  const biomeIdx = (s = S.stage) => Math.floor((s - 1) / 10) % BIOMES.length;
  const biome = () => BIOMES[biomeIdx()];
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  // greens become the biome's ground, blues its water (or lava), browns its dirt; everything else takes a light tint
  function recolor(src, B) {
    const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
    const pals = [B.grass, B.water, B.dirt].map(p => p.map(hexRgb)), [tr, tg, tb, ta] = B.tint;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const pal = gg > r + 6 && gg >= b ? pals[0] : b > r + 25 && b > gg - 20 ? pals[1] : r > b + 45 && r >= gg ? pals[2] : null;
      if (pal) {
        const t = Math.max(0, Math.min(1, ((r * 0.3 + gg * 0.59 + b * 0.11) / 255 - 0.2) / 0.55));
        for (let k = 0; k < 3; k++) d[i + k] = pal[0][k] + (pal[1][k] - pal[0][k]) * t;
      } else { d[i] = r + (tr - r) * ta; d[i + 1] = gg + (tg - gg) * ta; d[i + 2] = b + (tb - b) * ta; }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  let curBiome = 0, groundView = ground;
  const biomeGround = {}, biomeSpr = new Map();
  // the map follows the stage too: outdoor maps take the biome's colours and weather, indoor ones keep their own
  let mapBiome = -1;
  function applyBiome(announce) {
    const mi = mapIdx(), i = biomeIdx(), M = MAPS[mi], newMap = mi !== curMap;
    if (newMap) enterMap(mi, announce);
    const vis = M.indoor ? 0 : i, key = M.id + vis;
    if (!newMap && i === curBiome && vis === mapBiome) return;
    const newBiome = i !== curBiome;
    curBiome = i; mapBiome = vis;
    const B = BIOMES[vis];
    groundView = vis ? (biomeGround[key] = biomeGround[key] || recolor(ground, B)) : ground;
    for (const s of structures) {
      s.base = s.base || s.spr;
      if (!vis) { s.spr = s.base; continue; }
      const m = biomeSpr.get(s.base) || {};
      if (!m[vis]) { m[vis] = Object.assign({}, s.base, { c: recolor(s.base.c, B) }); biomeSpr.set(s.base, m); }
      s.spr = m[vis];
    }
    drawMinimap(groundView, vis ? B.grass[0] : M.indoor ? '#8f8f8f' : undefined);
    if (announce && newBiome && !newMap && !M.indoor) toast({ title: BIOMES[i].name, tip: BIOMES[i].tip, col: BIOMES[i].col, letter: BIOMES[i].name[0] });
  }
  // stepping into another map: clear the field, put you at its spawn point and say where you are
  function enterMap(mi, announce) {
    loadMap(mi);
    G.monsters = []; G.shots = []; G.eshots = []; G.bombs = []; G.hazards = []; G.zones = []; G.strikes = []; G.minions = []; G.rains = [];
    for (const d of G.drops) collect(d);
    G.drops = []; G.chests = []; G.boss = null; G.horde = null; G.spawnT = 1;
    P.x = SPAWN.x; P.y = SPAWN.y; P.vx = P.vy = 0;
    // the library starts with a few books already lying about
    G.books = []; G.bookT = BOOK_EVERY; G.grinnerT = 3; G.crawlT = null;
    if (MAPS[mi].id === 'library') for (let i = 0; i < 3; i++) spawnBook();
    resize(); // the minimap frame follows the new map's shape
    if (announce) {
      const M = MAPS[mi], B = BIOMES[biomeIdx()];
      G.whiteT = 0.35;
      banner(M.name, M.indoor ? M.tip : `${M.tip} ${B.name}.`);
      toast({ title: M.name, tip: S.mapPick ? M.tip : 'Auto: a new map every 5 stages.', col: M.col, letter: M.name[0] });
    }
  }
  // the Backrooms: near-total darkness, cut open only by your flashlight and the odd flickering tube overhead
  const darkCv = mkCanvas(1, 1), dctx = darkCv.getContext('2d');
  function drawFlashlight() {
    const Wd = cv.width, Ht = cv.height, z = G.zoom, ox = G.cam.ox, oy = G.cam.oy, g = dctx;
    if (darkCv.width !== Wd || darkCv.height !== Ht) { darkCv.width = Wd; darkCv.height = Ht; }
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, Wd, Ht);
    g.fillStyle = 'rgba(4,3,1,0.99)'; g.fillRect(0, 0, Wd, Ht);
    g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, R, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2); };
    const px = (P.x - ox) * z, py = (P.y - 9 - oy) * z, alive = G.dead <= 0;
    // each room's lamp leaves a small pool of light you can spot from afar (the odd one flickers)
    for (const [x, y, rad, , fl] of mapLights) {
      const sx = (x - ox) * z, sy = (y - oy) * z, R = rad * z;
      if (sx < -R || sy < -R || sx > Wd + R || sy > Ht + R) continue;
      const on = fl >= 2 ? (Math.sin(G.t * 23 + x) > 0.7 || Math.sin(G.t * 1.3 + y) > 0.85 ? 0.05 : 1) : 1;
      hole(sx, sy, R * 0.8, 0.35 * on);
    }
    // a small glow around you, then the beam: a cone toward where you aim, fading out with distance
    hole(px, py, 34 * z, alive ? 0.75 : 0.4);
    if (alive) {
      // one smooth beam toward where you aim, blurred so its sides melt into the dark instead of ending in an edge
      const a = P.aim, len = BEAM_LEN * z, half = BEAM_HALF, flick = Math.sin(G.t * 31) > 0.985 ? 0.6 : 1; // the battery stutters now and then
      const gr = g.createRadialGradient(px, py, 0, px, py, len);
      gr.addColorStop(0, `rgba(0,0,0,${0.95 * flick})`); gr.addColorStop(0.5, `rgba(0,0,0,${0.7 * flick})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.filter = `blur(${Math.round(16 * z)}px)`;
      g.fillStyle = gr; g.beginPath(); g.moveTo(px, py); g.arc(px, py, len, a - half, a + half); g.closePath(); g.fill();
      g.filter = 'none';
    }
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(darkCv, 0, 0);
    // a warm, faint tint inside the beam
    if (alive) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const len = BEAM_LEN * z, gr = ctx.createRadialGradient(px, py, 0, px, py, len);
      gr.addColorStop(0, 'rgba(255,235,170,0.1)'); gr.addColorStop(1, 'rgba(255,235,170,0)');
      ctx.fillStyle = gr; ctx.filter = `blur(${Math.round(16 * z)}px)`;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, len, P.aim - BEAM_HALF, P.aim + BEAM_HALF); ctx.closePath(); ctx.fill();
      ctx.filter = 'none';
      ctx.restore();
    }
  }
  // indoor maps: a dim room, warm pools of light around torches, candles and lamps
  function drawIndoorLight(d) {
    const M = MAPS[curMap];
    if (!M || !M.indoor) return;
    if (M.id === 'backrooms' && !(adminOn && G.seeAll)) { drawFlashlight(); return; }
    const Wd = cv.width, Ht = cv.height, z = G.zoom, ox = G.cam.ox, oy = G.cam.oy;
    ctx.save();
    ctx.fillStyle = `rgba(14,8,24,${M.dark})`; ctx.fillRect(0, 0, Wd, Ht);
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, rad, rgb, fl] of mapLights) {
      const sx = (x - ox) * z, sy = (y - oy) * z, R = rad * z;
      if (sx < -R || sy < -R || sx > Wd + R || sy > Ht + R) continue;
      // flames flicker softly; a fluorescent tube on the blink cuts out now and then
      const f = fl >= 2 ? (Math.sin(G.t * 23 + x) > 0.7 || Math.sin(G.t * 1.3 + y) > 0.85 ? 0.15 : 1) : 1 - fl * 0.12 * (0.5 + 0.5 * Math.sin(G.t * 9 + x * 0.1) * Math.sin(G.t * 5.3 + y));
      const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      gr.addColorStop(0, `rgba(${rgb},${0.28 * f})`); gr.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gr; ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
    }
    ctx.restore();
  }
  // falling snow, rising embers, blowing sand, drifting fog: drawn over the field in screen space
  function drawWeather(d) {
    if (MAPS[curMap] && MAPS[curMap].indoor) { drawIndoorLight(d); return; }
    const B = BIOMES[curBiome];
    if (!B.weather) return;
    const Wd = cv.width, Ht = cv.height, t = G.t, wrap = (v, m) => ((v % m) + m) % m;
    ctx.save();
    ctx.fillStyle = `rgba(${B.tint[0]},${B.tint[1]},${B.tint[2]},0.1)`; ctx.fillRect(0, 0, Wd, Ht);
    const n = B.weather === 'fog' ? 9 : 80;
    for (let i = 0; i < n; i++) {
      const s1 = (i * 9301 + 49297) % 233280 / 233280, s2 = (i * 7919 + 1237) % 10007 / 10007;
      if (B.weather === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        const x = wrap(s1 * Wd + Math.sin(t * 0.9 + i) * 14 * d + t * 10 * d, Wd), y = wrap(s2 * Ht + t * (26 + s1 * 26) * d, Ht), sz = (s2 < 0.3 ? 3 : 2) * d;
        ctx.fillRect(x, y, sz, sz);
      } else if (B.weather === 'embers') {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + i);
        ctx.fillStyle = i % 3 ? '#ff9a3c' : '#ffe08a';
        ctx.fillRect(wrap(s1 * Wd + Math.sin(t + i) * 12 * d, Wd), Ht - wrap(s2 * Ht + t * (18 + s1 * 30) * d, Ht), 2 * d, 2 * d);
      } else if (B.weather === 'sand') {
        ctx.fillStyle = 'rgba(244,214,156,0.45)';
        ctx.fillRect(wrap(s1 * Wd + t * (150 + s1 * 90) * d, Wd), wrap(s2 * Ht + Math.sin(t * 2 + i) * 6 * d, Ht), (6 + s2 * 8) * d, d);
      } else {
        const x = wrap(s1 * Wd + t * 9 * d, Wd + 400 * d) - 200 * d, y = s2 * Ht, gr = ctx.createRadialGradient(x, y, 0, x, y, 170 * d);
        gr.addColorStop(0, 'rgba(170,200,160,0.16)'); gr.addColorStop(1, 'rgba(170,200,160,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - 170 * d, y - 170 * d, 340 * d, 340 * d);
        // fireflies
        ctx.globalAlpha = Math.max(0, Math.sin(t * 2.5 + i * 1.7)); ctx.fillStyle = '#e8ff8a';
        ctx.fillRect(wrap(s2 * Wd + Math.sin(t * 0.7 + i) * 30 * d, Wd), wrap(s1 * Ht + Math.cos(t * 0.5 + i) * 20 * d, Ht), 2 * d, 2 * d);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
