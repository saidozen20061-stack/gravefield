  // ================= more maps: a cemetery, a castle keep, a library and a supermarket =================
  // every map is within 20% of the field's 1600 x 1200; the indoor ones are walled rooms with lamplight
  const rnd = (r, a, b) => a + r() * (b - a);
  // a free/blocked grid for placing props without overlap (the same idea buildWorld uses inline)
  function placer(WW, WH) {
    const cols = Math.ceil(WW / 8), blocked = new Uint8Array(cols * Math.ceil(WH / 8 + 1));
    const block = (x, y, rad) => {
      for (let yy = (y - rad) >> 3; yy <= (y + rad) >> 3; yy++) for (let xx = (x - rad) >> 3; xx <= (x + rad) >> 3; xx++)
        if (xx >= 0 && yy >= 0 && xx < cols) blocked[yy * cols + xx] = 1;
    };
    const free = (x, y, rad) => {
      for (let yy = (y - rad) >> 3; yy <= (y + rad) >> 3; yy++) for (let xx = (x - rad) >> 3; xx <= (x + rad) >> 3; xx++)
        if (xx < 0 || yy < 0 || xx >= cols || blocked[yy * cols + xx]) return false;
      return true;
    };
    return { block, free };
  }
  // a row of collision circles along a prop's footprint (base at y, depth d)
  function solidRect(x, y, w, d) {
    const rad = Math.min(10, d / 2), n = Math.max(1, Math.round(w / rad));
    for (let i = 0; i <= n; i++) addObstacle(x - w / 2 + rad * 0.6 + (w - rad * 1.2) * i / n, y - d / 2, rad);
  }
  function bricks(g, x, y, w, h, base, line, bw = 16, bh = 8) {
    px(g, x, y, w, h, base);
    for (let yy = y, k = 0; yy < y + h; yy += bh, k++) { px(g, x, yy, w, 1, line); for (let xx = x + (k % 2 ? bw / 2 : 0); xx < x + w; xx += bw) px(g, xx, yy, 1, bh, line); }
  }
  // indoor rooms: the back wall seen face-on, and the tops of the side and front walls
  function shell(g, W, H, c) {
    bricks(g, 0, 0, W, 70, c.wall, c.wallD, c.bw || 18, 9);
    px(g, 0, 0, W, 8, c.top); px(g, 0, 8, W, 2, c.edge);
    px(g, 0, 62, W, 8, c.trim); px(g, 0, 62, W, 2, c.trimL); px(g, 0, 70, W, 5, 'rgba(0,0,0,0.25)');
    px(g, 0, 0, 30, H, c.top); px(g, W - 30, 0, 30, H, c.top); px(g, 0, H - 22, W, 22, c.top);
    px(g, 30, 8, 3, H - 30, c.edge); px(g, W - 33, 8, 3, H - 30, c.edge); px(g, 30, H - 22, W - 60, 3, c.edge);
    px(g, 33, 70, 4, H - 92, 'rgba(0,0,0,0.18)'); px(g, W - 37, 70, 4, H - 92, 'rgba(0,0,0,0.18)');
  }
  let mapLights = []; // [x, y, radius, rgb, flicker] lamps for the indoor lighting pass

  // ---------- cemetery props ----------
  function makeHeadstone(r, kind) {
    const s = '#8e969c', sL = '#a8b0b6', sD = '#6c7378', cut = '#5a6166', moss = '#5e8f3a';
    if (kind === 0) return paint(12, 15, g => { oval(g, 6, 4, 5, 3, s); px(g, 1, 4, 10, 10, s); px(g, 1, 4, 2, 10, sL); px(g, 9, 4, 2, 10, sD); px(g, 4, 6, 4, 1, cut); px(g, 4, 8, 4, 1, cut); px(g, 0, 13, 12, 2, moss); if (r() < 0.5) px(g, 2, 10, 2, 2, moss); });
    if (kind === 1) return paint(11, 17, g => { px(g, 4, 0, 3, 15, s); px(g, 0, 4, 11, 3, s); px(g, 4, 0, 1, 15, sL); px(g, 6, 1, 1, 14, sD); px(g, 0, 6, 11, 1, sD); px(g, 2, 15, 7, 2, sD); });
    return paint(10, 25, g => { for (let y = 0; y < 20; y++) { const hw = 1 + Math.floor(y / 20 * 3); px(g, 5 - hw, y, hw * 2, 1, '#9aa2a8'); px(g, 5, y, hw, 1, '#7d858b'); } px(g, 1, 19, 8, 6, '#7d858b'); px(g, 1, 19, 8, 1, sL); });
  }
  function makeMausoleum(r) {
    return paint(48, 52, g => {
      const st = '#a39883', stD = '#7d7462', stL = '#c4baa4';
      for (let y = 0; y < 15; y++) { const hw = Math.floor(y / 15 * 23) + 1; px(g, 24 - hw, 1 + y, hw * 2, 1, y % 4 === 3 ? stD : st); px(g, 24 - hw, 1 + y, 2, 1, stL); }
      px(g, 1, 16, 46, 3, stL); px(g, 3, 19, 42, 29, st);
      for (let y = 23; y < 48; y += 5) px(g, 3, y, 42, 1, stD);
      for (const x of [5, 13, 30, 38]) { px(g, x, 19, 5, 29, stL); px(g, x + 4, 19, 1, 29, stD); }
      px(g, 19, 26, 10, 22, '#1e1a22'); oval(g, 24, 26, 5, 3, '#1e1a22'); px(g, 20, 31, 8, 17, '#2e2a36'); px(g, 23, 31, 2, 17, '#1e1a22');
      disc(g, 24, 9, 2, '#1e1a22');
      px(g, 0, 47, 48, 5, stD); px(g, 0, 47, 48, 1, stL);
      for (let i = 0; i < 18; i++) px(g, 3 + r() * 42 | 0, 18 + r() * 30 | 0, 2, 1, r() < 0.6 ? '#5e8f3a' : '#77a84a');
    });
  }
  function makeDeadTree(r) {
    return paint(30, 38, g => {
      px(g, 13, 16, 4, 22, '#4a3428'); px(g, 13, 16, 1, 22, '#5e4434'); px(g, 10, 36, 10, 2, '#3b2a22');
      const branch = (x, y, dx, dy, n) => { for (let i = 0; i < n; i++) { px(g, x | 0, y | 0, 2, 2, '#4a3428'); x += dx; y += dy; } };
      branch(15, 17, -0.9, -1, 10 + (r() * 3 | 0)); branch(15, 15, 1, -1.1, 9 + (r() * 3 | 0)); branch(15, 12, 0.1, -1, 10);
      branch(8, 8, -0.8, -0.5, 5); branch(22, 6, 0.9, -0.6, 5); branch(15, 3, -0.6, -0.8, 3);
    });
  }
  function makeAngel() {
    return paint(30, 46, g => {
      const s = '#c4c8cc', sD = '#9aa0a6', sL = '#e0e4e8';
      px(g, 6, 35, 18, 11, '#8f8570'); px(g, 6, 35, 18, 2, '#b3a990'); px(g, 4, 43, 22, 3, '#7d7462');
      for (let i = 0; i < 9; i++) { px(g, 3 + i, 10 + i, 3, 12 - i, i % 2 ? sD : s); px(g, 24 - i, 10 + i, 3, 12 - i, i % 2 ? sD : s); }
      oval(g, 15, 25, 6, 10, s); px(g, 15, 16, 4, 19, sD); px(g, 11, 16, 2, 18, sL);
      disc(g, 15, 11, 3, s); px(g, 12, 11, 7, 3, sD); px(g, 13, 9, 2, 1, sL);
    });
  }
  function buildCemetery() {
    const g = ground.getContext('2d'), r = mulberry(23), WW = WORLD.w, WH = WORLD.h, cx = WW / 2, cy = WH / 2, { block, free } = placer(WW, WH);
    g.fillStyle = '#4f8b36'; g.fillRect(0, 0, WW, WH);
    const tones = ['#4a8233', '#56923b', '#447a2f', '#5c9a40'];
    for (let i = 0; i < 3600; i++) { g.fillStyle = tones[i % 4]; g.fillRect(r() * WW | 0, r() * WH | 0, 4 + r() * 14 | 0, 2 + r() * 6 | 0); }
    // a grid of gravel paths splits the yard into plots
    const paths = [];
    for (const py of [cy, cy - 330, cy + 330]) for (let x = 0; x < WW; x += 3) paths.push([x, py]);
    for (const pxx of [cx, cx - 480, cx + 480]) for (let y = 0; y < WH; y += 3) paths.push([pxx, y]);
    for (const [x, y] of paths) { px(g, x - 10, y - 10, 21, 21, '#8a6a42'); }
    for (const [x, y] of paths) { px(g, x - 8, y - 8, 17, 17, '#b79a6c'); block(x, y, 18); }
    for (let i = 0; i < 2600; i++) { const [x, y] = paths[r() * paths.length | 0]; px(g, x + rnd(r, -8, 8) | 0, y + rnd(r, -8, 8) | 0, 1, 1, r() < 0.5 ? '#9c8058' : '#d0b88a'); }
    // the plaza in the middle with the weeping angel
    oval(g, cx, cy, 120, 86, '#8f8570');
    for (let i = 0; i < 700; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * 114 | 0, y = cy + Math.sin(a) * d * 80 | 0; px(g, x, y, 5 + r() * 5 | 0, 3 + r() * 2 | 0, r() < 0.5 ? '#a39883' : '#b3a990'); }
    block(cx, cy, 140);
    structures.push({ spr: makeAngel(), x: cx, y: cy - 40, fade: true }); addObstacle(cx, cy - 46, 11);
    // plots of headstones in neat-ish rows, some with a fresh mound of earth
    const stones = [0, 0, 1, 2, 0, 1].map(k => makeHeadstone(r, k));
    for (let y = 120; y < WH - 60; y += 44) for (let x = 90; x < WW - 80; x += 36) {
      const sx = x + rnd(r, -3, 3) | 0, sy = y + rnd(r, -2, 2) | 0;
      if (!free(sx, sy, 12) || r() < 0.22) continue;
      if (r() < 0.25) { px(g, sx - 6, sy + 2, 13, 18, '#5e4028'); px(g, sx - 5, sy + 3, 11, 16, '#7a5530'); for (let i = 0; i < 6; i++) px(g, sx - 4 + r() * 9 | 0, sy + 4 + r() * 14 | 0, 1, 1, '#9c6f3e'); }
      else { px(g, sx - 5, sy + 2, 11, 3, 'rgba(0,0,0,0.18)'); }
      structures.push({ spr: stones[r() * stones.length | 0], x: sx, y: sy + 2 });
      addObstacle(sx, sy, 4); block(sx, sy, 10);
    }
    // mausoleums and dead trees
    const maus = [0, 1].map(() => makeMausoleum(r)), dead = [0, 1, 2].map(() => makeDeadTree(r));
    for (const [x, y] of [[cx - 240, cy - 180], [cx + 240, cy - 180], [cx - 240, cy + 200], [cx + 250, cy + 200], [cx - 700, cy - 160], [cx + 700, cy + 180]]) {
      structures.push({ spr: maus[(x + y) % 2 ? 0 : 1], x, y, fade: true, mm: '#7d7462' }); solidRect(x, y - 2, 44, 24); block(x, y - 20, 40);
    }
    for (let i = 0, tries = 0; i < 26 && tries < 900; tries++) {
      const x = 80 + r() * (WW - 160) | 0, y = 90 + r() * (WH - 150) | 0;
      if (!free(x, y, 16)) continue;
      structures.push({ spr: dead[r() * 3 | 0], x, y, tree: true }); addObstacle(x, y - 3, 4); block(x, y, 20); i++;
    }
    // fog-grey grass tufts
    for (let i = 0; i < 4000; i++) { const x = r() * WW | 0, y = r() * WH | 0; if (!free(x, y, 0)) continue; g.fillStyle = r() < 0.5 ? '#3d6e2a' : '#6aa64a'; g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y, 1, 2); }
    // a wrought-iron fence all round
    const fence = paint(24, 15, g2 => { px(g2, 0, 5, 24, 2, '#2b2b33'); px(g2, 0, 11, 24, 2, '#2b2b33'); for (let x = 1; x < 24; x += 5) { px(g2, x, 2, 2, 13, '#3a3a46'); px(g2, x, 0, 2, 2, '#6a6a7a'); } });
    for (let x = 12; x < WW; x += 24) { structures.push({ spr: fence, x, y: 44, edge: true }); structures.push({ spr: fence, x, y: WH - 6, edge: true }); }
    for (let y = 60; y < WH; y += 14) { structures.push({ spr: fence, x: 22, y, edge: true }); structures.push({ spr: fence, x: WW - 22, y, edge: true }); }
  }

  // ---------- castle props ----------
  function makeCastlePillar() {
    return paint(18, 58, g => {
      px(g, 1, 0, 16, 6, '#9aa0a8'); px(g, 0, 5, 18, 3, '#b8bec6'); px(g, 3, 8, 12, 42, '#a6acb4'); px(g, 3, 8, 3, 42, '#c4cad2'); px(g, 12, 8, 3, 42, '#868c94');
      for (let y = 14; y < 50; y += 9) px(g, 3, y, 12, 1, '#868c94');
      px(g, 0, 50, 18, 8, '#868c94'); px(g, 0, 50, 18, 2, '#b8bec6');
    });
  }
  function makeThrone() {
    return paint(42, 52, g => {
      px(g, 0, 40, 42, 12, '#6e5a8a'); px(g, 0, 40, 42, 2, '#9a86b6'); // dais
      px(g, 8, 2, 26, 34, '#c9a23a'); px(g, 10, 4, 22, 30, '#8a1a1a'); px(g, 12, 6, 18, 26, '#b02a2a'); px(g, 20, 6, 2, 26, '#8a1a1a');
      for (const x of [8, 20, 31]) { px(g, x, 0, 3, 4, '#ffd36a'); }
      px(g, 4, 24, 34, 14, '#c9a23a'); px(g, 7, 24, 28, 9, '#b02a2a'); px(g, 4, 24, 4, 14, '#e2c050'); px(g, 34, 24, 4, 14, '#a07a20');
      px(g, 6, 36, 4, 6, '#a07a20'); px(g, 32, 36, 4, 6, '#a07a20'); disc(g, 21, 3, 2, '#d9402a');
    });
  }
  function makeArmor() {
    return paint(16, 34, g => {
      px(g, 2, 28, 12, 6, '#5a4a3a'); px(g, 2, 28, 12, 1, '#7a6a5a');
      px(g, 4, 10, 8, 12, '#a6acb4'); px(g, 4, 10, 2, 12, '#c4cad2'); px(g, 2, 11, 2, 9, '#868c94'); px(g, 12, 11, 2, 9, '#868c94');
      px(g, 5, 22, 2, 6, '#868c94'); px(g, 9, 22, 2, 6, '#868c94'); px(g, 5, 2, 6, 8, '#b8bec6'); px(g, 6, 5, 4, 1, '#1e1a22'); px(g, 7, 0, 2, 3, '#d9402a');
      px(g, 13, 4, 1, 24, '#6a5040'); px(g, 12, 2, 3, 3, '#c4cad2');
    });
  }
  function makeTable(r) {
    return paint(86, 30, g => {
      px(g, 2, 4, 82, 16, '#7a4a24'); px(g, 2, 4, 82, 2, '#9c6436'); px(g, 2, 18, 82, 2, '#5a3418');
      for (const x of [6, 78]) px(g, x, 20, 4, 10, '#5a3418');
      for (let x = 10; x < 80; x += 14) { oval(g, x, 11, 4, 2, '#e8e4da'); oval(g, x, 11, 2, 1, '#c9a23a'); px(g, x + 5, 6, 2, 4, '#e2c050'); }
      px(g, 42, 1, 3, 8, '#f2ead8'); px(g, 43, 0, 1, 1, '#ffd36a');
    });
  }
  function makeBarrel() { return paint(13, 15, g => { px(g, 1, 1, 11, 14, '#8a5a2b'); px(g, 1, 1, 3, 14, '#a8763f'); px(g, 0, 3, 13, 2, '#4a4a52'); px(g, 0, 11, 13, 2, '#4a4a52'); oval(g, 6, 1, 5, 1, '#6b4423'); }); }
  function makeCrate() { return paint(15, 15, g => { px(g, 0, 0, 15, 15, '#a8763f'); px(g, 1, 1, 13, 13, '#c9945a'); px(g, 1, 7, 13, 1, '#8a5a2b'); for (let i = 1; i < 14; i++) px(g, i, i, 1, 1, '#8a5a2b'); }); }
  function buildCastle() {
    const g = ground.getContext('2d'), r = mulberry(37), WW = WORLD.w, WH = WORLD.h, cx = WW / 2, cy = WH / 2, { block, free } = placer(WW, WH);
    // flagstones
    for (let y = 0, k = 0; y < WH; y += 24, k++) for (let x = -(k % 2) * 16; x < WW; x += 32) {
      const t = r(); px(g, x, y, 32, 24, '#3e3a44'); px(g, x + 1, y + 1, 30, 22, t < 0.33 ? '#6a6672' : t < 0.66 ? '#75717e' : '#5f5b68');
      if (r() < 0.2) px(g, x + 4 + r() * 20 | 0, y + 4 + r() * 14 | 0, 4, 1, '#4a4652');
    }
    // the long red carpet from the doors to the throne, and the cross aisle
    const carpet = (x, y, w, h) => { px(g, x - 3, y - 3, w + 6, h + 6, '#c9a23a'); px(g, x, y, w, h, '#8a1a1a'); for (let i = 0; i < w * h / 60; i++) px(g, x + r() * w | 0, y + r() * h | 0, 2, 1, '#9e2424'); px(g, x + 6, y, 2, h, '#c9a23a'); px(g, x + w - 8, y, 2, h, '#c9a23a'); };
    carpet(cx - 44, 150, 88, WH - 172); carpet(80, cy - 36, WW - 160, 72);
    shell(g, WW, WH, { wall: '#5a5662', wallD: '#3e3a44', top: '#2a2630', edge: '#1a1820', trim: '#3e3a44', trimL: '#6a6672' });
    // banners and torches along the back wall
    for (let x = 90; x < WW - 60; x += 140) {
      px(g, x, 12, 26, 40, '#8a1a1a'); px(g, x, 12, 26, 3, '#c9a23a'); px(g, x, 52, 13, 6, '#8a1a1a'); px(g, x + 13, 52, 13, 4, '#8a1a1a');
      disc(g, x + 13, 30, 6, '#c9a23a'); disc(g, x + 13, 30, 3, '#8a1a1a');
      const tx = x + 70; px(g, tx - 2, 34, 5, 10, '#3a3540'); px(g, tx - 3, 30, 7, 4, '#5a5662'); px(g, tx - 2, 24, 5, 7, '#ff9a3c'); px(g, tx - 1, 22, 3, 6, '#ffe08a');
      mapLights.push([tx, 30, 120, '255,170,80', 1]);
    }
    // throne on its dais
    structures.push({ spr: makeThrone(), x: cx, y: 150, fade: true, mm: '#c9a23a' }); solidRect(cx, 148, 40, 18); block(cx, 120, 60);
    mapLights.push([cx - 40, 120, 90, '255,190,110', 1], [cx + 40, 120, 90, '255,190,110', 1]);
    // pillars along the carpets
    const pillar = makeCastlePillar();
    for (let y = 230; y < WH - 80; y += 150) for (const dx of [-110, 110, -330, 330]) {
      const x = cx + dx; if (Math.abs(y - cy) < 70) continue;
      structures.push({ spr: pillar, x, y, fade: true }); addObstacle(x, y - 4, 9); block(x, y, 30);
    }
    block(cx, cy, 120); block(cx, WH / 2, 70);
    for (let y = 150; y < WH; y += 6) block(cx, y, 50);
    for (let x = 80; x < WW - 80; x += 6) block(x, cy, 44);
    // banquet tables in the side halls, suits of armour by the walls, barrels and crates in the corners
    const table = makeTable(r);
    for (const [x, y] of [[cx - 470, cy - 200], [cx + 470, cy - 200], [cx - 470, cy + 210], [cx + 470, cy + 210], [cx - 470, cy - 340], [cx + 470, cy + 350]]) {
      if (!free(x, y - 10, 20)) continue;
      structures.push({ spr: table, x, y, mm: '#7a4a24' }); solidRect(x, y - 6, 82, 16); block(x, y - 10, 56);
      mapLights.push([x, y - 26, 60, '255,200,120', 1]);
    }
    const armor = makeArmor();
    for (let x = 100; x < WW - 80; x += 140) { if (Math.abs(x - cx) < 90) continue; structures.push({ spr: armor, x: x + 35, y: 96 }); addObstacle(x + 35, 92, 6); }
    const barrel = makeBarrel(), crate = makeCrate();
    for (let i = 0, tries = 0; i < 26 && tries < 600; tries++) {
      const x = 60 + r() * (WW - 120) | 0, y = 100 + r() * (WH - 150) | 0;
      if (!free(x, y, 14)) continue;
      structures.push({ spr: r() < 0.5 ? barrel : crate, x, y }); addObstacle(x, y - 4, 6); block(x, y, 18); i++;
    }
    // rubble and cracks
    for (let i = 0; i < 140; i++) { const x = r() * WW | 0, y = 80 + r() * (WH - 100) | 0; if (!free(x, y, 2)) continue; px(g, x, y, 2 + r() * 3 | 0, 2, '#4a4652'); }
  }

  // ---------- library props ----------
  const BOOKS = ['#8a1a1a', '#1f4a8a', '#2a6a3a', '#6a2a7a', '#a07a20', '#5a3418', '#1a5a5a', '#9e3a24', '#3a3a5a'];
  function bookRow(g, r, x, y, w, h) {
    let xx = x;
    while (xx < x + w - 2) {
      const bw = 2 + (r() * 3 | 0), bh = Math.max(4, h - (r() * 4 | 0)), col = BOOKS[r() * BOOKS.length | 0];
      if (xx + bw > x + w) break;
      if (r() < 0.06) { px(g, xx, y + h - 2, 7, 2, col); xx += 8; continue; }
      px(g, xx, y + h - bh, bw, bh, col); px(g, xx, y + h - bh, 1, bh, 'rgba(255,255,255,0.18)'); if (bh > 6) px(g, xx, y + h - bh + 2, bw, 1, 'rgba(255,220,120,0.5)');
      xx += bw + (r() < 0.1 ? 2 : 0);
    }
  }
  function makeBookshelf(r) {
    return paint(68, 46, g => {
      px(g, 0, 0, 68, 46, '#5a3418'); px(g, 0, 0, 68, 3, '#7a4a24'); px(g, 2, 3, 64, 40, '#2a1608');
      for (let s = 0; s < 3; s++) { const y0 = 4 + s * 13; bookRow(g, r, 3, y0, 62, 11); px(g, 2, y0 + 11, 64, 2, '#7a4a24'); }
      px(g, 0, 43, 68, 3, '#4a2a12'); px(g, 0, 0, 2, 46, '#7a4a24');
    });
  }
  function makeReadTable(r) {
    return paint(44, 26, g => {
      px(g, 1, 4, 42, 14, '#6b3f1c'); px(g, 1, 4, 42, 2, '#8a5a2b'); px(g, 1, 16, 42, 2, '#4a2a12');
      px(g, 4, 18, 3, 8, '#4a2a12'); px(g, 37, 18, 3, 8, '#4a2a12');
      px(g, 8, 7, 14, 8, '#f2ead8'); px(g, 15, 7, 1, 8, '#c9b48a'); for (let y = 9; y < 14; y += 2) { px(g, 10, y, 4, 1, '#8a8070'); px(g, 17, y, 4, 1, '#8a8070'); }
      px(g, 31, 2, 3, 9, '#f2ead8'); px(g, 32, 0, 1, 2, '#ffd36a'); px(g, 29, 10, 7, 2, '#c9a23a');
    });
  }
  function makeGlobe() { return paint(16, 24, g => { disc(g, 8, 7, 6, '#2a6fc9'); px(g, 4, 4, 4, 3, '#3c8f2a'); px(g, 9, 8, 3, 4, '#3c8f2a'); px(g, 3, 6, 2, 1, '#9fd2f0'); px(g, 1, 6, 1, 3, '#c9a23a'); px(g, 14, 6, 1, 3, '#c9a23a'); px(g, 7, 13, 2, 7, '#5a3418'); px(g, 3, 20, 10, 4, '#5a3418'); px(g, 3, 20, 10, 1, '#8a5a2b'); }); }
  function makeBookPile(r) { return paint(14, 12, g => { for (let i = 0; i < 4; i++) { const w = 10 + (r() * 3 | 0); px(g, 7 - w / 2 + (r() * 3 - 1 | 0), 9 - i * 3, w, 3, BOOKS[r() * BOOKS.length | 0]); px(g, 7 - w / 2 + 1, 10 - i * 3, w - 2, 1, '#e8e0c8'); } }); }
  function makeCandelabra() { return paint(14, 30, g => { px(g, 6, 8, 2, 20, '#c9a23a'); px(g, 3, 27, 8, 3, '#a07a20'); px(g, 1, 8, 12, 2, '#c9a23a'); for (const x of [1, 6, 11]) { px(g, x, 3, 2, 5, '#f2ead8'); px(g, x, 0, 2, 3, '#ffb347'); } }); }
  function buildLibrary() {
    const g = ground.getContext('2d'), r = mulberry(53), WW = WORLD.w, WH = WORLD.h, cx = WW / 2, cy = WH / 2, { block, free } = placer(WW, WH);
    // floorboards
    for (let y = 0; y < WH; y += 8) {
      let x = -(r() * 60 | 0);
      while (x < WW) { const w = 40 + (r() * 60 | 0), t = r(); px(g, x, y, w, 8, '#4a2a12'); px(g, x + 1, y, w - 1, 7, t < 0.33 ? '#8a5a2b' : t < 0.66 ? '#7a4f26' : '#94643a'); px(g, x + 1, y, w - 1, 1, 'rgba(255,220,160,0.12)'); x += w; }
    }
    // rugs: a big round one in the middle, long runners down the aisles
    oval(g, cx, cy, 150, 100, '#c9a23a'); oval(g, cx, cy, 146, 96, '#6a1a2a'); oval(g, cx, cy, 120, 78, '#8a2a3a'); oval(g, cx, cy, 116, 74, '#6a1a2a'); oval(g, cx, cy, 60, 38, '#c9a23a'); oval(g, cx, cy, 56, 34, '#1f3a6a');
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) px(g, cx + Math.cos(a) * 88 | 0, cy + Math.sin(a) * 57 | 0, 6, 4, '#c9a23a');
    for (const x of [cx - 380, cx + 380]) { px(g, x - 34, 110, 68, WH - 140, '#c9a23a'); px(g, x - 31, 110, 62, WH - 140, '#1f3a5a'); for (let y = 130; y < WH - 40; y += 40) px(g, x - 6, y, 12, 6, '#c9a23a'); }
    shell(g, WW, WH, { wall: '#5a3418', wallD: '#3a200e', top: '#2a1608', edge: '#1a0e04', trim: '#3a200e', trimL: '#7a4a24' });
    // the back wall is one long bookcase
    for (let x = 36; x < WW - 40; x += 70) { px(g, x, 10, 66, 52, '#2a1608'); for (let s = 0; s < 4; s++) { bookRow(g, r, x + 2, 11 + s * 13, 62, 11); px(g, x, 22 + s * 13, 66, 2, '#7a4a24'); } px(g, x + 66, 10, 4, 52, '#5a3418'); }
    block(cx, cy, 170);
    for (let y = 100; y < WH; y += 6) { block(cx - 380, y, 40); block(cx + 380, y, 40); }
    // stacks: rows of bookshelves either side of the reading room
    const shelves = [0, 1, 2, 3].map(() => makeBookshelf(r));
    for (const side of [-1, 1]) for (let y = 190; y < WH - 70; y += 105) for (const dx of [190, 560, 660]) {
      const x = cx + side * dx;
      if (x < 90 || x > WW - 90 || !free(x, y - 20, 26)) continue;
      structures.push({ spr: shelves[r() * 4 | 0], x, y, fade: true, mm: '#5a3418' }); solidRect(x, y - 4, 66, 14); block(x, y - 20, 44);
    }
    // reading tables with candles, globes, piles of books, candelabras
    const table = makeReadTable(r), globe = makeGlobe(), cand = makeCandelabra(), piles = [0, 1, 2].map(() => makeBookPile(r));
    for (const [dx, dy] of [[-90, -150], [90, -150], [-90, 160], [90, 160], [-250, 0], [250, 0]]) {
      const x = cx + dx, y = cy + dy;
      structures.push({ spr: table, x, y, mm: '#6b3f1c' }); solidRect(x, y - 6, 42, 14);
      mapLights.push([x + 10, y - 20, 70, '255,200,120', 1]);
    }
    for (const [x, y] of [[cx - 150, cy - 40], [cx + 150, cy + 40]]) { structures.push({ spr: globe, x, y }); addObstacle(x, y - 4, 7); }
    for (let x = 140; x < WW - 100; x += 230) { structures.push({ spr: cand, x, y: 100 }); addObstacle(x, 96, 5); mapLights.push([x, 82, 110, '255,190,100', 1]); }
    for (let i = 0, tries = 0; i < 40 && tries < 800; tries++) {
      const x = 60 + r() * (WW - 120) | 0, y = 100 + r() * (WH - 140) | 0;
      if (!free(x, y, 10)) continue;
      structures.push({ spr: piles[r() * 3 | 0], x, y }); block(x, y, 14); i++;
    }
    // loose pages on the floor
    for (let i = 0; i < 90; i++) { const x = r() * WW | 0, y = 90 + r() * (WH - 110) | 0; if (!free(x, y, 3)) continue; px(g, x, y, 5, 4, '#e8e0c8'); px(g, x + 1, y + 1, 3, 1, '#a89878'); }
  }

  // ---------- supermarket props ----------
  const GOODS = ['#e5484d', '#ffc93c', '#4fb6e8', '#6ee07a', '#ff9a3c', '#c78cff', '#f2f2f2', '#ff8fb1', '#2a6fc9', '#8a5a2b'];
  function makeGondola(r) {
    return paint(102, 36, g => {
      px(g, 0, 0, 102, 34, '#8a9098'); px(g, 0, 0, 102, 2, '#c4cad2'); px(g, 2, 2, 98, 30, '#5a6068');
      for (let s = 0; s < 3; s++) {
        const y0 = 3 + s * 10;
        let x = 3;
        while (x < 96) { const w = 4 + (r() * 5 | 0), h = 5 + (r() * 3 | 0), c = GOODS[r() * GOODS.length | 0]; if (x + w > 99) break; px(g, x, y0 + 8 - h, w, h, c); px(g, x, y0 + 8 - h, w, 1, 'rgba(255,255,255,0.4)'); if (r() < 0.3) px(g, x + 1, y0 + 9 - h, w - 2, 2, '#ffffff'); x += w + 1; }
        px(g, 2, y0 + 8, 98, 2, '#c4cad2'); for (let tx = 10; tx < 96; tx += 22) px(g, tx, y0 + 8, 5, 2, '#ffd84d');
      }
      px(g, 0, 32, 102, 4, '#4a5058');
    });
  }
  function makeCheckout() {
    return paint(58, 30, g => {
      px(g, 0, 8, 58, 18, '#c4cad2'); px(g, 0, 8, 58, 2, '#e8eef2'); px(g, 2, 11, 36, 6, '#2a2a30'); for (let x = 4; x < 36; x += 5) px(g, x, 12, 1, 4, '#4a4a52');
      px(g, 42, 0, 14, 12, '#4a5058'); px(g, 44, 2, 10, 6, '#6ee07a'); px(g, 45, 3, 4, 1, '#2a6a3a'); px(g, 40, 12, 18, 4, '#3a3a42');
      px(g, 0, 26, 58, 4, '#8a9098');
    });
  }
  function makeCart() { return paint(22, 18, g => { px(g, 2, 2, 16, 10, '#a6acb4'); for (let x = 3; x < 18; x += 3) px(g, x, 3, 1, 8, '#6a7078'); for (let y = 4; y < 12; y += 3) px(g, 3, y, 14, 1, '#6a7078'); px(g, 18, 0, 3, 3, '#d9402a'); px(g, 17, 2, 2, 10, '#a6acb4'); disc(g, 5, 15, 2, '#2a2a30'); disc(g, 16, 15, 2, '#2a2a30'); }); }
  function makeProduce(r) {
    return paint(38, 24, g => {
      px(g, 0, 6, 38, 18, '#8a5a2b'); px(g, 0, 6, 38, 2, '#a8763f'); for (let x = 6; x < 38; x += 8) px(g, x, 8, 1, 16, '#6b4423');
      const fr = [['#e5484d', '#ff8a7a'], ['#ff9a3c', '#ffc98a'], ['#6ee07a', '#b8f0a0'], ['#ffd84d', '#fff0a8']][r() * 4 | 0];
      for (let i = 0; i < 26; i++) { const x = 2 + r() * 33 | 0, y = 1 + r() * 8 | 0; disc(g, x, y + 2, 2, fr[0]); px(g, x - 1, y + 1, 1, 1, fr[1]); }
    });
  }
  function makeWetSign() { return paint(12, 16, g => { for (let y = 0; y < 14; y++) { const hw = 1 + Math.floor(y / 14 * 5); px(g, 6 - hw, y, hw * 2, 1, '#ffd84d'); } px(g, 5, 4, 2, 5, '#2a2a30'); px(g, 5, 10, 2, 2, '#2a2a30'); px(g, 1, 14, 10, 2, '#c9a23a'); }); }
  function buildMarket() {
    const g = ground.getContext('2d'), r = mulberry(71), WW = WORLD.w, WH = WORLD.h, cx = WW / 2, cy = WH / 2, { block, free } = placer(WW, WH);
    // checkerboard tiles, scuffed
    for (let y = 0; y < WH; y += 20) for (let x = 0; x < WW; x += 20) { px(g, x, y, 20, 20, ((x + y) / 20) % 2 ? '#d6d2c6' : '#e8e4da'); px(g, x, y, 20, 1, '#b8b4a8'); px(g, x, y, 1, 20, '#b8b4a8'); }
    for (let i = 0; i < 260; i++) px(g, r() * WW | 0, r() * WH | 0, 2 + r() * 6 | 0, 1 + r() * 3 | 0, 'rgba(90,80,60,0.18)');
    for (let i = 0; i < 14; i++) oval(g, r() * WW | 0, 100 + r() * (WH - 150) | 0, 10 + r() * 16 | 0, 5 + r() * 7 | 0, r() < 0.5 ? 'rgba(120,20,20,0.35)' : 'rgba(80,120,40,0.3)');
    shell(g, WW, WH, { wall: '#c4cad2', wallD: '#a6acb4', top: '#3a3e46', edge: '#22252a', trim: '#2a6fc9', trimL: '#4fb6e8', bw: 24 });
    // freezers line the back wall
    for (let x = 40; x < WW - 50; x += 64) {
      px(g, x, 12, 60, 50, '#e8eef2'); px(g, x + 3, 15, 54, 44, '#7fc4e8'); px(g, x + 30, 15, 1, 44, '#e8eef2');
      for (let s = 0; s < 3; s++) for (let k = 0; k < 7; k++) px(g, x + 5 + k * 7, 20 + s * 13, 5, 8, GOODS[r() * GOODS.length | 0]);
      px(g, x + 3, 15, 54, 4, 'rgba(255,255,255,0.45)'); px(g, x + 26, 34, 2, 6, '#8a9098'); px(g, x + 33, 34, 2, 6, '#8a9098');
    }
    // aisles: rows of shelf gondolas left and right of the main aisle
    const gond = [0, 1, 2, 3].map(() => makeGondola(r));
    for (const side of [-1, 1]) for (let y = 220; y < WH - 210; y += 120) for (const dx of [180, 390, 600]) {
      const x = cx + side * dx; if (x < 100 || x > WW - 100) continue;
      structures.push({ spr: gond[r() * 4 | 0], x, y, fade: true, mm: '#8a9098' }); solidRect(x, y - 6, 100, 14); block(x, y - 18, 60);
    }
    block(cx, cy, 120); for (let y = 90; y < WH; y += 6) block(cx, y, 80);
    // checkouts near the front doors
    const till = makeCheckout();
    for (let x = cx - 420; x <= cx + 420; x += 120) { if (Math.abs(x - cx) < 60) continue; const y = WH - 90; structures.push({ spr: till, x, y, mm: '#c4cad2' }); solidRect(x, y - 6, 56, 14); block(x, y - 14, 36); }
    px(g, cx - 70, WH - 22, 140, 22, '#7a8088'); px(g, cx - 66, WH - 22, 64, 20, '#9fd2f0'); px(g, cx + 2, WH - 22, 64, 20, '#9fd2f0');
    // produce stands in the middle aisle, carts and a wet floor sign
    const prod = [0, 1, 2, 3].map(() => makeProduce(r));
    for (const [dx, dy] of [[-60, -230], [60, -230], [-60, 240], [60, 240]]) { const x = cx + dx, y = cy + dy; structures.push({ spr: prod[r() * 4 | 0], x, y, mm: '#8a5a2b' }); solidRect(x, y - 4, 36, 12); }
    const cart = makeCart(), wet = makeWetSign();
    for (let i = 0, tries = 0; i < 16 && tries < 600; tries++) {
      const x = 80 + r() * (WW - 160) | 0, y = 110 + r() * (WH - 200) | 0;
      if (!free(x, y, 14)) continue;
      structures.push({ spr: i % 5 === 4 ? wet : cart, x, y }); addObstacle(x, y - 4, 6); block(x, y, 20); i++;
    }
    // spilled cans
    for (let i = 0; i < 60; i++) { const x = r() * WW | 0, y = 100 + r() * (WH - 140) | 0; if (!free(x, y, 3)) continue; px(g, x, y, 3, 4, GOODS[i % GOODS.length]); px(g, x, y, 3, 1, '#e8eef2'); }
    // humming ceiling lights, a few on the blink
    for (let y = 160; y < WH - 60; y += 200) for (let x = 160; x < WW - 100; x += 260) mapLights.push([x, y, 160, '220,240,255', r() < 0.25 ? 3 : 0.4]);
  }

  // ---------- the backrooms: endless yellow rooms, damp carpet, buzzing lights, and walls everywhere ----------
  const BACKROOM_WALLS = []; // [x, y, w, h] wall footprints: in the Backrooms, shots can't pass through these
  // is this point (a shot, which flies about 8 px above the ground) inside a Backrooms wall?
  const inBackroomWall = (x, y) => MAPS[curMap] && MAPS[curMap].id === 'backrooms' &&
    BACKROOM_WALLS.some(([wx, wy, ww, wh]) => x >= wx && x <= wx + ww && y + 8 >= wy && y + 8 <= wy + wh);
  // the wallpapered front face of a wall, w pixels wide (shared by both wall directions)
  function wallFace(g, r, x0, y0, w) {
    px(g, x0, y0, w, 30, '#c9b86a');
    for (let x = x0 + 2; x < x0 + w; x += 6) px(g, x, y0, 2, 26, '#bfae60');
    for (let y = y0 + 4; y < y0 + 25; y += 6) for (let x = x0 + 4; x < x0 + w; x += 6) px(g, x, y, 1, 1, '#a8975a');
    px(g, x0, y0 + 26, w, 4, '#8a7a44'); px(g, x0, y0 + 26, w, 1, '#a89858');
    for (let i = 0; i < w / 40; i++) if (r() < 0.5) px(g, x0 + (r() * (w - 6) | 0), y0 + 2 + (r() * 8 | 0), 4 + (r() * 6 | 0), 8 + (r() * 14 | 0), 'rgba(110,90,40,0.3)'); // damp stains
  }
  // an east-west wall: one long solid slab, a pale top over a single wallpapered face
  function makeHWall(r, w) {
    return paint(w, 40, g => {
      px(g, 0, 0, w, 10, '#d8c98a'); px(g, 0, 0, w, 1, '#efe2a8'); px(g, 0, 9, w, 1, '#a89858'); px(g, 0, 0, 1, 10, '#efe2a8'); px(g, w - 1, 0, 1, 10, '#a89858');
      wallFace(g, r, 0, 10, w);
    });
  }
  // a north-south wall: its long pale top runs away from you, and only its near end shows a face
  function makeVWall(r, len) {
    const W = 22;
    return paint(W, len + 30, g => {
      px(g, 0, 0, W, len, '#d8c98a'); px(g, 0, 0, W, 1, '#efe2a8'); px(g, 0, 0, 1, len, '#efe2a8'); px(g, W - 1, 0, 1, len, '#a89858');
      px(g, 0, len - 1, W, 1, '#a89858');
      wallFace(g, r, 0, len, W);
    });
  }
  function buildBackrooms() {
    const g = ground.getContext('2d'), r = mulberry(91), WW = WORLD.w, WH = WORLD.h, cx = WW / 2, cy = WH / 2;
    // damp, stained carpet
    g.fillStyle = '#b8a560'; g.fillRect(0, 0, WW, WH);
    for (let i = 0; i < 9000; i++) { g.fillStyle = ['#b09d58', '#c0ad68', '#a8954f', '#bcaa64'][i % 4]; g.fillRect(r() * WW | 0, r() * WH | 0, 2 + r() * 4 | 0, 1 + r() * 2 | 0); }
    for (let i = 0; i < 40; i++) oval(g, r() * WW | 0, r() * WH | 0, 14 + r() * 40 | 0, 8 + r() * 22 | 0, `rgba(${r() < 0.5 ? '90,80,40' : '70,60,30'},0.18)`);
    shell(g, WW, WH, { wall: '#c9b86a', wallD: '#b0a058', top: '#6a5e30', edge: '#4a4020', trim: '#8a7a44', trimL: '#a89858', bw: 24 });
    // the maze: walls along a grid of rooms, each stretch of wall either there or not, with a doorway left open.
    // Each unbroken run of wall is drawn as one solid slab; collision is a chain of circles along it.
    const CELL = 192, x0 = 46, y0 = 90, x1 = WW - 46, y1 = WH - 40;
    BACKROOM_WALLS.length = 0;
    const hRun = (xa, xb, y) => { // xa..xb along y (scraps too short to read as wall are left out)
      if (xb - xa < 40) return;
      structures.push({ spr: makeHWall(r, xb - xa), x: (xa + xb) / 2, y, fade: true, mm: '#c9b86a' });
      for (let x = xa + 8; x <= xb - 8; x += 12) addObstacle(x, y - 8, 11);
      BACKROOM_WALLS.push([xa, y - 20, xb - xa, 22]); // the footprint that stops shots
    };
    const vRun = (x, ya, yb) => { // ya..yb along x
      if (yb - ya < 40) return;
      structures.push({ spr: makeVWall(r, yb - ya), x, y: yb + 2, fade: true, mm: '#c9b86a' });
      for (let y = ya + 6; y <= yb; y += 10) addObstacle(x, y, 11);
      BACKROOM_WALLS.push([x - 11, ya - 6, 22, yb - ya + 16]);
    };
    // Each grid line is laid out first as a list of solid spans (one per room side that has a wall, minus its doorway
    // and the clear room you start in), then touching spans are merged, so a wall is one piece from end to end
    function mergeSpans(spans) {
      spans.sort((p, q) => p[0] - q[0]);
      const out = [];
      for (const s of spans) { const last = out[out.length - 1]; if (last && s[0] <= last[1] + 1) last[1] = Math.max(last[1], s[1]); else out.push(s.slice()); }
      return out;
    }
    function cutSpan(a, b, cuts) {
      const out = []; let s = a;
      for (const [c0, c1] of cuts.sort((p, q) => p[0] - q[0])) { if (c1 <= s || c0 >= b) continue; if (c0 > s) out.push([s, c0]); s = Math.max(s, c1); }
      if (b > s) out.push([s, b]);
      return out;
    }
    // the rooms: column i spans colX[i]..colX[i]+CELL, row j spans rowY[j]..rowY[j]+CELL (the last ones are cut short)
    const colX = [], rowY = [];
    for (let x = x0; x < x1 - CELL / 2; x += CELL) colX.push(x);
    for (let y = y0; y < y1 - CELL / 2; y += CELL) rowY.push(y);
    const nx = colX.length, ny = rowY.length;
    // every room side: undefined = no wall, { g0 } = wall (with a doorway starting at g0, or a solid one when g0 is null)
    // a doorway somewhere along a room side, clear of its corners (the last row and column are shorter)
    const doorAt = (at, end) => at + 24 + (r() * Math.max(1, Math.min(at + CELL, end) - at - 112) | 0);
    const hSide = [], vSide = []; // hSide[j][i]: top of room (i, j); vSide[i][j]: left of room (i, j)
    for (let j = 1; j < ny; j++) {
      hSide[j] = [];
      for (let i = 0; i < nx; i++) {
        if (r() > 0.8) continue;
        const g0 = doorAt(colX[i], x1);
        hSide[j][i] = { g0: r() < 0.4 ? g0 : null }; // some room sides get a 64-pixel doorway
      }
    }
    for (let i = 1; i < nx; i++) {
      vSide[i] = [];
      for (let j = 0; j < ny; j++) {
        if (r() > 0.8) continue;
        const g0 = doorAt(rowY[j], y1);
        vSide[i][j] = { g0: r() < 0.4 ? g0 : null };
      }
    }
    // the clear room you start in opens up any side it overlaps by a body's width
    const startCutH = (j, i) => Math.abs(rowY[j] - cy) <= 110 && Math.min(colX[i] + CELL, x1, cx + 150) - Math.max(colX[i], cx - 150) >= 40;
    const startCutV = (i, j) => Math.abs(colX[i] - cx) <= 150 && Math.min(rowY[j] + CELL, y1, cy + 110) - Math.max(rowY[j], cy - 110) >= 40;
    // make sure every room can be reached: join rooms through open sides, then knock a doorway into
    // solid walls (in random order) wherever they still separate two parts of the maze, until it's all one
    const root = Array.from({ length: nx * ny }, (_, k) => k);
    const find = k => { while (root[k] !== k) k = root[k] = root[root[k]]; return k; };
    const join = (a, b) => { a = find(a); b = find(b); if (a === b) return false; root[a] = b; return true; };
    const solid = [];
    for (let j = 1; j < ny; j++) for (let i = 0; i < nx; i++) {
      const s = hSide[j][i];
      if (!s || s.g0 != null || startCutH(j, i)) join(j * nx + i, (j - 1) * nx + i); else solid.push([s, j * nx + i, (j - 1) * nx + i, colX[i], x1]);
    }
    for (let i = 1; i < nx; i++) for (let j = 0; j < ny; j++) {
      const s = vSide[i][j];
      if (!s || s.g0 != null || startCutV(i, j)) join(j * nx + i, j * nx + i - 1); else solid.push([s, j * nx + i, j * nx + i - 1, rowY[j], y1]);
    }
    for (let k = solid.length - 1; k > 0; k--) { const m = r() * (k + 1) | 0; [solid[k], solid[m]] = [solid[m], solid[k]]; }
    for (const [s, a, b, at, end] of solid) if (join(a, b)) s.g0 = doorAt(at, end);
    for (let j = 1; j < ny; j++) {
      const y = rowY[j]; let spans = [];
      for (let i = 0; i < nx; i++) {
        const s = hSide[j][i]; if (!s) continue;
        const cuts = s.g0 != null ? [[s.g0, s.g0 + 64]] : [];
        if (Math.abs(y - cy) <= 110) cuts.push([cx - 150, cx + 150]);
        spans = spans.concat(cutSpan(colX[i], Math.min(colX[i] + CELL, x1), cuts));
      }
      for (const [a, b] of mergeSpans(spans)) hRun(a, b, y);
    }
    for (let i = 1; i < nx; i++) {
      const x = colX[i]; let spans = [];
      for (let j = 0; j < ny; j++) {
        const s = vSide[i][j]; if (!s) continue;
        const cuts = s.g0 != null ? [[s.g0, s.g0 + 64]] : []; // a little wider than it looks: the wall's base overhangs it
        if (Math.abs(x - cx) <= 150) cuts.push([cy - 110, cy + 110]);
        spans = spans.concat(cutSpan(rowY[j], Math.min(rowY[j] + CELL, y1), cuts));
      }
      for (const [a, b] of mergeSpans(spans)) vRun(x, Math.max(a, y0 + 6), b);
    }
    // only a few rooms still have a working lamp (about 1 in 5), and the odd one of those flickers
    for (let y = y0 + CELL / 2; y < y1; y += CELL) for (let x = x0 + CELL / 2; x < x1; x += CELL) if (r() < 0.2) mapLights.push([x, y, 38, '255,240,170', r() < 0.1 ? 3 : 0.3]);
  }

  // the maps, in the order they come round: a new one every 5 stages
  const MAPS = [
    { id: 'field', name: 'Chapel Field', tip: 'The old chapel in the meadow.', col: '#5a9a3c', w: 1600, h: 1200, build: buildWorld, spawnDy: 52 },
    { id: 'cemetery', name: 'Old Cemetery', tip: 'Row upon row of restless graves.', col: '#6c7378', w: 1800, h: 1300, build: buildCemetery, spawnDy: 30 },
    { id: 'castle', name: 'Castle Keep', tip: 'The dead hold court in the great hall.', col: '#8a1a1a', w: 1400, h: 1100, build: buildCastle, indoor: true, dark: 0.3 },
    { id: 'library', name: 'Forbidden Library', tip: 'Some books should stay shut.', col: '#6a2a7a', w: 1500, h: 1050, build: buildLibrary, indoor: true, dark: 0.34 },
    { id: 'market', name: 'Dead Mart', tip: 'Open all night. Nobody is shopping.', col: '#2a6fc9', w: 1700, h: 1150, build: buildMarket, indoor: true, dark: 0.18 },
    { id: 'backrooms', name: 'The Backrooms', tip: 'Yellow rooms forever. The lights never stop buzzing.', col: '#c9b86a', w: 1600, h: 1200, build: buildBackrooms, indoor: true, dark: 0.2,
      // what the map picker shows instead, so nobody knows what they're walking into
      cover: { name: 'The Door', tag: '???', tip: 'Nobody remembers putting it there.', col: '#7a5a3a' } },
  ];
  // the map you picked in the stage panel, or 'auto': a new one every 5 stages
  const mapIdx = (s = S.stage) => {
    const pick = S && S.mapPick && MAPS.findIndex(m => m.id === S.mapPick);
    return pick >= 0 ? pick : Math.floor((s - 1) / 5) % MAPS.length;
  };
  const mapData = {};
  let curMap = -1;
  function loadMap(i) {
    const M = MAPS[i];
    if (!mapData[M.id]) {
      Object.assign(WORLD, { w: M.w, h: M.h, x0: M.indoor ? 46 : 40, y0: M.indoor ? 82 : 50, x1: M.w - (M.indoor ? 46 : 40), y1: M.h - 30 });
      ground = mkCanvas(M.w, M.h); structures = []; obstacles = []; grid = new Map(); gcols = Math.ceil(M.w / GRID); mapLights = [];
      M.build();
      structures.sort((a, b) => a.y - b.y);
      mapData[M.id] = { ground, structures, obstacles, grid, gcols, lights: mapLights, world: Object.assign({}, WORLD), spawn: { x: M.w / 2, y: M.h / 2 + (M.spawnDy || 0) } };
    }
    const D = mapData[M.id];
    ({ ground, structures, obstacles, grid, gcols } = D); mapLights = D.lights;
    Object.assign(WORLD, D.world); Object.assign(SPAWN, D.spawn);
    curMap = i;
  }
  loadMap(0);

