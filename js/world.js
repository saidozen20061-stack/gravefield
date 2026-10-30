  // ================= world: ground, structures, obstacles =================
  // each map has its own set of these; loadMap() swaps them in
  let ground = mkCanvas(WORLD.w, WORLD.h);
  const minimap = mkCanvas(160, 120);
  let structures = [];
  let obstacles = [];
  const GRID = 64;
  let gcols = Math.ceil(WORLD.w / GRID), grid = new Map();
  function addObstacle(x, y, r) {
    const o = { x, y, r };
    obstacles.push(o);
    const c0 = Math.floor((x - r) / GRID), c1 = Math.floor((x + r) / GRID), r0 = Math.floor((y - r) / GRID), r1 = Math.floor((y + r) / GRID);
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
      const k = cy * gcols + cx;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(o);
    }
  }
  function blockedAt(x, y) {
    const list = grid.get(Math.floor(y / GRID) * gcols + Math.floor(x / GRID));
    return !!list && list.some(o => (x - o.x) ** 2 + (y - o.y) ** 2 < o.r * o.r * 0.6);
  }
  function pushOut(e, r) {
    const list = grid.get(Math.floor(e.y / GRID) * gcols + Math.floor(e.x / GRID));
    if (!list) return;
    for (const o of list) {
      const dx = e.x - o.x, dy = e.y - o.y, min = o.r + r, d2 = dx * dx + dy * dy;
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 0.01, p = min - d;
        e.x += dx / d * p; e.y += dy / d * p;
      }
    }
  }

  // structure sprites, a few variants each
  function makeOak(r) {
    return paint(32, 36, g => {
      px(g, 13, 22, 6, 12, '#6b4423'); px(g, 13, 22, 2, 12, '#83592f'); px(g, 17, 22, 2, 12, '#55351a');
      px(g, 11, 33, 10, 2, '#6b4423'); px(g, 10, 34, 3, 1, '#55351a'); px(g, 19, 34, 3, 1, '#55351a');
      disc(g, 16, 14, 13, '#2f6a28'); disc(g, 8, 18, 7, '#2f6a28'); disc(g, 24, 18, 7, '#2f6a28');
      disc(g, 15, 12, 11, '#3f8a33'); disc(g, 9, 15, 5, '#3f8a33'); disc(g, 22, 14, 5, '#3f8a33');
      disc(g, 12, 9, 6, '#56a845'); disc(g, 10, 7, 2, '#7cc35a');
      for (let i = 0; i < 22; i++) {
        const a = r() * Math.PI * 2, d = r() * 11;
        px(g, 16 + Math.cos(a) * d | 0, 14 + Math.sin(a) * d | 0, 1, 1, r() < 0.5 ? '#26561f' : '#6bb550');
      }
      if (r() < 0.35) for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2, d = 4 + r() * 8; px(g, 16 + Math.cos(a) * d | 0, 14 + Math.sin(a) * d | 0, 2, 2, '#d9402a'); }
    });
  }
  function makePine(r) {
    return paint(24, 40, g => {
      px(g, 10, 32, 4, 8, '#5e3b1d'); px(g, 10, 32, 1, 8, '#7a4f28');
      for (let t = 0; t < 4; t++) {
        const top = 2 + t * 7, hgt = 12, wmax = 4 + t * 2.6;
        for (let row = 0; row < hgt; row++) {
          const hw = Math.floor((row / hgt) * wmax) + 1;
          px(g, 12 - hw, top + row, hw * 2, 1, '#28552b');
          px(g, 12 - hw, top + row, Math.max(1, hw - 1), 1, '#3a7a3b');
        }
      }
      for (let i = 0; i < 10; i++) px(g, 6 + r() * 12 | 0, 8 + r() * 26 | 0, 1, 1, r() < 0.5 ? '#1d4321' : '#55964e');
    });
  }
  function makeBoulder(r, big) {
    const w = big ? 24 : 11, h = big ? 17 : 8;
    return paint(w, h, g => {
      const cx = w / 2 | 0, cy = h / 2 | 0;
      oval(g, cx, cy + 1, cx - 1, cy - 1, '#5c6368');
      oval(g, cx, cy, cx - 1, cy - 1, '#7d848a');
      oval(g, cx - 1, cy - 1, Math.max(1, cx - 3), Math.max(1, cy - 2), '#a3aab0');
      if (big) {
        px(g, cx - 4, 2, 6, 2, '#5e8f3a'); px(g, cx - 2, 1, 3, 1, '#77a84a');
        px(g, cx + 3, cy, 1, 3, '#5c6368'); px(g, cx + 4, cy + 2, 1, 2, '#5c6368');
      } else if (r() < 0.5) px(g, cx - 2, 1, 3, 1, '#5e8f3a');
    });
  }
  function makeBush(r) {
    return paint(18, 13, g => {
      disc(g, 9, 7, 6, '#356f2b'); disc(g, 5, 8, 4, '#356f2b'); disc(g, 13, 8, 4, '#356f2b');
      disc(g, 8, 6, 4, '#4b8f39'); disc(g, 6, 5, 2, '#6bb04f');
      const col = r() < 0.5 ? '#d9402a' : (r() < 0.5 ? '#ffd84d' : '#ff8fb1');
      for (let i = 0; i < 6; i++) px(g, 3 + r() * 12 | 0, 3 + r() * 7 | 0, 1, 1, col);
    });
  }
  function makePillar(r) {
    return paint(10, 28, g => {
      const tops = [5, 3, 2, 4, 6, 3, 2, 5].map(v => v + (r() * 3 | 0));
      for (let x = 1; x < 9; x++) px(g, x, tops[x - 1], 1, 24 - tops[x - 1], x > 6 ? '#9a907a' : '#b9ae96');
      for (let y = 8; y < 24; y += 5) px(g, 1, y, 8, 1, '#8f8570');
      px(g, 0, 23, 10, 5, '#a39883'); px(g, 0, 27, 10, 1, '#8f8570');
      px(g, 2, tops[1], 3, 2, '#5e8f3a'); px(g, 3, 12, 1, 4, '#5e8f3a');
      px(g, 6, 15, 1, 3, '#7a7060');
    });
  }
  function makeWall(r) {
    return paint(36, 20, g => {
      for (let x = 0; x < 36; x++) {
        const top = 2 + Math.round(Math.abs(Math.sin(x * 0.35 + r() * 0.5)) * 6 + (x > 26 ? 4 : 0));
        px(g, x, top, 1, 20 - top, '#b9ae96');
      }
      for (let y = 4; y < 20; y += 4) {
        px(g, 0, y, 36, 1, '#8f8570');
        for (let x = (y / 4) % 2 ? 3 : 0; x < 36; x += 7) px(g, x, y - 3, 1, 3, '#8f8570');
      }
      px(g, 0, 18, 36, 2, '#8f8570');
      for (let i = 0; i < 5; i++) px(g, r() * 30 | 0, 6 + r() * 10 | 0, 2, 1, '#5e8f3a');
      px(g, 8, 6, 1, 8, '#4f8a35'); px(g, 9, 9, 1, 3, '#4f8a35');
    });
  }
  function makeColumn() {
    return paint(30, 11, g => {
      px(g, 2, 2, 26, 7, '#b9ae96'); px(g, 2, 2, 26, 1, '#d2c8b1'); px(g, 2, 8, 26, 1, '#8f8570');
      for (let x = 8; x < 28; x += 7) px(g, x, 2, 1, 7, '#9a907a');
      oval(g, 27, 5, 2, 4, '#a39883'); oval(g, 27, 5, 1, 2, '#8f8570');
      px(g, 0, 3, 3, 6, '#a39883');
    });
  }
  function makeStump() {
    return paint(14, 10, g => {
      px(g, 2, 3, 10, 6, '#6b4423'); px(g, 2, 3, 2, 6, '#83592f'); px(g, 1, 8, 12, 2, '#55351a');
      oval(g, 7, 3, 5, 2, '#c99a5e'); oval(g, 7, 3, 3, 1, '#9c6f3e'); px(g, 7, 3, 1, 1, '#c99a5e');
    });
  }
  function makeLog() {
    return paint(26, 9, g => {
      px(g, 2, 2, 20, 6, '#6b4423'); px(g, 2, 2, 20, 1, '#83592f'); px(g, 2, 7, 20, 1, '#55351a');
      for (let x = 5; x < 20; x += 5) px(g, x, 4, 3, 1, '#55351a');
      oval(g, 22, 4, 2, 3, '#c99a5e'); px(g, 22, 4, 1, 1, '#9c6f3e');
      px(g, 9, 1, 2, 1, '#5e8f3a');
    });
  }

  // the old chapel in the middle of the field: slate nave, bell tower with a spire, candlelit windows, a broken roof
  function makeChapel(r) {
    return paint(100, 118, g => {
      const st = '#b9ae96', stD = '#9a907a', stL = '#d2c8b1', mort = '#8f8570', sl = '#4a4f63', slL = '#5f6680', slD = '#363a4c';
      // nave roof, seen from above at an angle
      for (let y = 30; y < 60; y++) { const k = (y - 30) / 30, x0 = Math.round(16 - k * 6), x1 = Math.round(84 + k * 6); px(g, x0, y, x1 - x0, 1, (y - 30) % 5 === 0 ? slD : (y < 34 ? slL : sl)); }
      for (let y = 32; y < 60; y += 5) for (let x = 14 + (y % 2) * 3; x < 88; x += 6) px(g, x, y, 1, 4, slD);
      px(g, 16, 29, 68, 2, slL);
      // a hole in the roof with bare beams
      oval(g, 75, 42, 7, 4, '#2a1e1a'); px(g, 69, 41, 13, 1, '#7a4f28'); px(g, 71, 44, 9, 1, '#6b4423'); px(g, 74, 38, 1, 8, '#7a4f28');
      // front wall of the nave
      px(g, 10, 60, 80, 52, st);
      for (let y = 64; y < 112; y += 5) { px(g, 10, y, 80, 1, mort); for (let x = 10 + ((y / 5) % 2 ? 3 : 0); x < 90; x += 8) px(g, x, y - 4, 1, 4, mort); }
      px(g, 10, 60, 80, 2, stL);
      for (const bx of [10, 30, 66, 86]) { px(g, bx, 62, 4, 50, stD); px(g, bx, 62, 1, 50, stL); px(g, bx - 1, 104, 6, 8, stD); }
      // candlelit arched windows
      for (const wx of [18, 74]) {
        px(g, wx, 76, 8, 18, '#2a1e1a'); oval(g, wx + 4, 76, 4, 3, '#2a1e1a');
        px(g, wx + 1, 77, 6, 16, '#ff9a3c'); oval(g, wx + 4, 77, 3, 2, '#ffb347'); px(g, wx + 1, 85, 6, 1, '#2a1e1a'); px(g, wx + 4, 75, 1, 18, '#2a1e1a');
        px(g, wx + 2, 79, 1, 4, '#ffe08a');
        px(g, wx - 1, 94, 10, 2, stD);
      }
      // bell tower + spire
      px(g, 37, 38, 26, 74, stD); px(g, 38, 38, 24, 74, st); px(g, 38, 38, 2, 74, stL);
      for (let y = 44; y < 112; y += 6) px(g, 38, y, 24, 1, mort);
      for (let y = 0; y < 34; y++) { const hw = Math.floor(y / 34 * 15) + 1; px(g, 50 - hw, 4 + y, hw * 2, 1, (y % 6 === 5) ? slD : sl); px(g, 50 - hw, 4 + y, Math.max(1, hw - 2), 1, slL); }
      px(g, 35, 37, 30, 3, slD);
      px(g, 49, -1, 2, 7, '#3a3540'); px(g, 47, 1, 6, 2, '#3a3540');
      // belfry with the bell
      px(g, 43, 44, 14, 14, '#2a1e1a'); oval(g, 50, 44, 7, 4, '#2a1e1a');
      px(g, 46, 48, 8, 7, '#e2a63a'); px(g, 45, 54, 10, 2, '#c98a14'); px(g, 47, 48, 2, 6, '#ffd36a'); px(g, 49, 56, 2, 1, '#8a5a14');
      // rose window
      disc(g, 50, 70, 5, '#2a1e1a'); disc(g, 50, 70, 4, '#d9402a'); disc(g, 50, 70, 2, '#ffb347'); px(g, 50, 66, 1, 9, '#2a1e1a'); px(g, 46, 70, 9, 1, '#2a1e1a');
      // door
      px(g, 43, 86, 14, 26, '#2a1e1a'); oval(g, 50, 86, 7, 5, '#2a1e1a');
      px(g, 44, 87, 12, 25, '#6b4423'); oval(g, 50, 87, 6, 4, '#6b4423'); px(g, 49, 84, 2, 28, '#4a2d18');
      for (let x = 46; x < 56; x += 3) px(g, x, 87, 1, 25, '#55351a');
      px(g, 46, 98, 2, 2, '#c9a23a'); px(g, 52, 98, 2, 2, '#c9a23a');
      // base, steps, moss and ivy
      px(g, 8, 110, 84, 8, stD); px(g, 8, 110, 84, 1, stL);
      px(g, 40, 112, 20, 3, stL); px(g, 38, 115, 24, 3, st);
      for (let i = 0; i < 60; i++) { const x = 10 + r() * 80 | 0, y = 62 + r() * 48 | 0; if (x > 36 && x < 64) continue; px(g, x, y, 1 + (r() * 2 | 0), 1, r() < 0.6 ? '#5e8f3a' : '#77a84a'); }
      for (let i = 0; i < 28; i++) { const y = 66 + i * 1.6 | 0; px(g, 11 + Math.round(Math.sin(i * 0.7) * 2), y, 2, 2, i % 3 ? '#4f8a35' : '#6bb04f'); }
      for (let i = 0; i < 20; i++) { const y = 40 + i * 2.5 | 0; px(g, 60 + Math.round(Math.sin(i) * 1.5), y, 2, 2, i % 3 ? '#4f8a35' : '#6bb04f'); }
      for (let i = 0; i < 8; i++) px(g, 20 + r() * 60 | 0, 31 + r() * 26 | 0, 2, 1, '#5e8f3a');
      px(g, 23, 100, 1, 6, mort); px(g, 24, 105, 2, 1, mort); px(g, 79, 64, 1, 5, mort);
    });
  }

  function buildWorld() {
    const g = ground.getContext('2d'), r = mulberry(11), WW = WORLD.w, WH = WORLD.h, cx = WW / 2, cy = WH / 2;
    const cols = Math.ceil(WW / 8), blocked = new Uint8Array(cols * Math.ceil(WH / 8));
    const block = (x, y, rad) => {
      for (let yy = (y - rad) >> 3; yy <= (y + rad) >> 3; yy++) for (let xx = (x - rad) >> 3; xx <= (x + rad) >> 3; xx++)
        if (xx >= 0 && yy >= 0 && xx < cols) blocked[yy * cols + xx] = 1;
    };
    const free = (x, y, rad) => {
      for (let yy = (y - rad) >> 3; yy <= (y + rad) >> 3; yy++) for (let xx = (x - rad) >> 3; xx <= (x + rad) >> 3; xx++)
        if (xx < 0 || yy < 0 || xx >= cols || blocked[yy * cols + xx]) return false;
      return true;
    };

    g.fillStyle = '#5a9a3c'; g.fillRect(0, 0, WW, WH);
    const tones = ['#55933a', '#62a543', '#5d9f3f', '#4f8b36'];
    for (let i = 0; i < 3200; i++) { g.fillStyle = tones[i % 4]; g.fillRect(r() * WW | 0, r() * WH | 0, 4 + r() * 14 | 0, 2 + r() * 6 | 0); }

    // winding dirt paths + a ring around the central clearing
    const pathPts = [];
    for (let x = 0; x < WW; x += 2) pathPts.push([x, cy + Math.sin(x / 90) * 40 + Math.sin(x / 31) * 6]);
    for (let y = 0; y < WH; y += 2) pathPts.push([cx + Math.sin(y / 80) * 50 + Math.sin(y / 27) * 5, y]);
    for (let a = 0; a < Math.PI * 2; a += 0.01) pathPts.push([cx + Math.cos(a) * 110, cy + Math.sin(a) * 85]);
    for (const [x, y] of pathPts) disc(g, x | 0, y | 0, 8, '#a8763f');
    for (const [x, y] of pathPts) disc(g, x | 0, y | 0, 6, '#d29c5c');
    for (const [x, y] of pathPts) { block(x, y, 12); if (r() < 0.15) px(g, x + rand(-5, 5) | 0, y + rand(-5, 5) | 0, 1, 1, r() < 0.5 ? '#b98349' : '#e8b97a'); }
    block(cx, cy, 130);

    // chapel courtyard: cobbles over the crossroads, a few old graves either side of the door path
    oval(g, cx, cy + 4, 78, 50, '#8f8570');
    for (let i = 0; i < 520; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * 74 | 0, y = cy + 4 + Math.sin(a) * d * 46 | 0, w = 5 + r() * 5 | 0, h = 3 + r() * 2 | 0;
      px(g, x, y, w, h, r() < 0.5 ? '#a39883' : '#b3a990');
    }
    for (let i = 0; i < 40; i++) px(g, cx + rand(-70, 70) | 0, cy + rand(-40, 46) | 0, 2, 1, '#5e8f3a');
    for (const [gx, gy] of [[-44, 30], [-30, 40], [32, 32], [46, 40], [-56, 16], [58, 18]]) {
      const x = cx + gx, y = cy + gy;
      px(g, x - 4, y + 7, 10, 2, 'rgba(0,0,0,0.22)');
      px(g, x - 3, y, 8, 8, '#8e969c'); px(g, x - 2, y - 1, 6, 1, '#8e969c'); px(g, x - 1, y - 2, 4, 1, '#8e969c');
      px(g, x + 4, y, 1, 8, '#6c7378'); px(g, x, y + 2, 2, 1, '#5a6166'); px(g, x, y + 1, 1, 4, '#5a6166');
    }
    const chapelY = cy + 8;
    structures.push({ spr: makeChapel(r), x: cx, y: chapelY, fade: true, chapel: true });
    for (const row of [8, 22, 36]) for (let x = -44; x <= 44; x += 11) addObstacle(cx + x, chapelY - row, 8);

    // ponds
    const ponds = [[WW * 0.2, WH * 0.75, 80, 50], [WW * 0.78, WH * 0.25, 70, 46], [WW * 0.82, WH * 0.8, 60, 40], [WW * 0.25, WH * 0.2, 54, 34]];
    for (const [x, y, rx, ry] of ponds) {
      oval(g, x | 0, y | 0, rx + 6, ry + 5, '#c9b07a');
      oval(g, x | 0, y | 0, rx + 3, ry + 2, '#5d8f3f');
      oval(g, x | 0, y | 0, rx, ry, '#4f97c9');
      oval(g, x | 0, (y + 4) | 0, rx - 12, ry - 10, '#3f82b8');
      for (let i = 0; i < 10; i++) px(g, x + rand(-rx * 0.6, rx * 0.6) | 0, y + rand(-ry * 0.6, ry * 0.6) | 0, 5 + r() * 6 | 0, 1, '#9fd2f0');
      for (let i = 0; i < 6; i++) {
        const lx = x + rand(-rx * 0.6, rx * 0.6) | 0, ly = y + rand(-ry * 0.5, ry * 0.5) | 0;
        disc(g, lx, ly, 3, '#4f9a3a'); px(g, lx, ly - 3, 1, 3, '#4f97c9');
        if (r() < 0.5) px(g, lx - 1, ly - 1, 2, 2, '#ff9cc2');
      }
      for (let i = 0; i < 26; i++) {
        const a = r() * Math.PI * 2, ex = x + Math.cos(a) * (rx + 2) | 0, ey = y + Math.sin(a) * (ry + 1) | 0;
        px(g, ex, ey - 5, 1, 5, '#3f6e2a'); if (r() < 0.4) px(g, ex, ey - 7, 1, 2, '#7a4a24');
      }
      block(x, y, rx + 18);
      for (let i = -2; i <= 2; i++) {
        const k = i * 0.36, rr = ry * Math.sqrt(1 - k * k) * 0.95;
        addObstacle(x + k * rx * 1.1, y, rr);
      }
    }

    // ruins: paved floors with broken pillars and walls
    const ruinSpr = { pillar: [0, 1, 2].map(() => makePillar(r)), wall: [0, 1].map(() => makeWall(r)), column: makeColumn() };
    let ruins = 0;
    for (let tries = 0; tries < 200 && ruins < 6; tries++) {
      const x = 120 + r() * (WW - 240) | 0, y = 120 + r() * (WH - 240) | 0;
      if (Math.hypot(x - cx, y - cy) < 300 || !free(x, y, 60)) continue;
      ruins++;
      for (let i = 0; i < 46; i++) {
        const sx = x + rand(-55, 55) | 0, sy = y + rand(-40, 40) | 0, w = 6 + r() * 6 | 0, h = 4 + r() * 3 | 0;
        px(g, sx, sy, w, h, '#8f8570'); px(g, sx, sy, w - 1, h - 1, r() < 0.5 ? '#a39883' : '#b3a990');
      }
      for (let i = 0; i < 14; i++) px(g, x + rand(-55, 55) | 0, y + rand(-40, 40) | 0, 2, 1, '#5e8f3a');
      const n = 2 + (r() * 3 | 0);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r(), sx = x + Math.cos(a) * 40 | 0, sy = y + Math.sin(a) * 28 | 0;
        structures.push({ spr: ruinSpr.pillar[i % 3], x: sx, y: sy });
        addObstacle(sx, sy - 2, 5);
      }
      const wx = x + rand(-20, 20) | 0, wy = y - 30 | 0;
      structures.push({ spr: ruinSpr.wall[ruins % 2], x: wx, y: wy });
      for (let k = -1; k <= 1; k++) addObstacle(wx + k * 12, wy - 2, 6);
      if (r() < 0.7) {
        const fx = x + rand(-25, 25) | 0, fy = y + 22 | 0;
        structures.push({ spr: ruinSpr.column, x: fx, y: fy });
        addObstacle(fx - 7, fy - 3, 5); addObstacle(fx + 7, fy - 3, 5);
      }
      block(x, y, 70);
    }

    // gravestones (flat decor in the ground)
    for (let i = 0; i < 40; i++) {
      const x = 60 + r() * (WW - 120) | 0, y = 60 + r() * (WH - 120) | 0;
      if (!free(x, y, 8)) continue;
      px(g, x - 4, y + 7, 10, 2, 'rgba(0,0,0,0.22)');
      px(g, x - 3, y, 8, 8, '#8e969c'); px(g, x - 2, y - 1, 6, 1, '#8e969c'); px(g, x - 1, y - 2, 4, 1, '#8e969c');
      px(g, x + 4, y, 1, 8, '#6c7378'); px(g, x, y + 2, 2, 1, '#5a6166'); px(g, x, y + 1, 1, 4, '#5a6166');
      px(g, x - 3, y + 9, 8, 3, '#7a5530');
      block(x, y, 8);
    }

    // grass tufts and flowers
    for (let i = 0; i < 5200; i++) {
      const x = r() * WW | 0, y = r() * WH | 0;
      if (!free(x, y, 0) && r() < 0.8) continue;
      g.fillStyle = r() < 0.5 ? '#437d2e' : '#7cbd52';
      g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y, 1, 2); g.fillRect(x + 1, y + 1, 1, 2);
    }
    const fl = ['#ffffff', '#ffd84d', '#ff8fb1', '#ff9a3c'];
    for (let i = 0; i < 520; i++) {
      const x = r() * WW | 0, y = r() * WH | 0;
      if (!free(x, y, 2)) continue;
      g.fillStyle = fl[i % 4]; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
      g.fillStyle = '#f2c14e'; g.fillRect(x, y, 1, 1);
    }

    // scattered nature: trees, boulders, bushes, stumps, logs
    const oaks = [0, 1, 2, 3].map(() => makeOak(r)), pines = [0, 1, 2].map(() => makePine(r));
    const bigRocks = [0, 1, 2].map(() => makeBoulder(r, true)), smallRocks = [0, 1, 2].map(() => makeBoulder(r, false));
    const bushes = [0, 1, 2, 3].map(() => makeBush(r)), stump = makeStump(), log = makeLog();
    const scatter = (count, spacing, fn) => {
      let placed = 0;
      for (let tries = 0; tries < count * 30 && placed < count; tries++) {
        const x = 70 + r() * (WW - 140) | 0, y = 80 + r() * (WH - 120) | 0;
        if (!free(x, y, spacing)) continue;
        fn(x, y); block(x, y, spacing); placed++;
      }
    };
    scatter(70, 22, (x, y) => { const pine = r() < 0.4; structures.push({ spr: pine ? pines[r() * 3 | 0] : oaks[r() * 4 | 0], x, y, tree: true }); addObstacle(x, y - 3, pine ? 4 : 5); });
    scatter(22, 14, (x, y) => { structures.push({ spr: bigRocks[r() * 3 | 0], x, y }); addObstacle(x, y - 5, 9); });
    scatter(40, 8, (x, y) => structures.push({ spr: smallRocks[r() * 3 | 0], x, y }));
    scatter(45, 10, (x, y) => structures.push({ spr: bushes[r() * 4 | 0], x, y }));
    scatter(10, 10, (x, y) => { structures.push({ spr: stump, x, y }); addObstacle(x, y - 3, 5); });
    scatter(8, 16, (x, y) => { structures.push({ spr: log, x, y }); addObstacle(x - 6, y - 3, 4); addObstacle(x + 6, y - 3, 4); });

    // dense tree wall around the edge
    const edge = [];
    for (let x = 6; x < WW; x += 18) { edge.push([x + r() * 6, 30 + r() * 10]); edge.push([x + r() * 6, WH - 2 + r() * 6]); }
    for (let y = 50; y < WH; y += 20) { edge.push([16 + r() * 10, y + r() * 6]); edge.push([WW - 16 - r() * 10, y + r() * 6]); }
    for (const [x, y] of edge) structures.push({ spr: r() < 0.5 ? pines[r() * 3 | 0] : oaks[r() * 4 | 0], x: x | 0, y: y | 0, tree: true, edge: true });

    structures.sort((a, b) => a.y - b.y);
    drawMinimap(ground);
  }
  function drawMinimap(src, treeCol = '#2a5a22') {
    const mg = minimap.getContext('2d'), kx = 160 / WORLD.w, ky = 120 / WORLD.h;
    mg.imageSmoothingEnabled = true;
    mg.drawImage(src, 0, 0, 160, 120);
    for (const s of structures) {
      const x = s.x * kx, y = s.y * ky;
      if (s.chapel) { mg.fillStyle = '#4a4f63'; mg.fillRect(x - 5, y - 5, 10, 5); mg.fillStyle = '#b9ae96'; mg.fillRect(x - 1, y - 7, 2, 7); continue; }
      if (s.mm) { mg.fillStyle = s.mm; mg.fillRect(x - s.spr.w * kx / 2, y - 3, Math.max(2, s.spr.w * kx), 3); continue; }
      mg.fillStyle = s.tree ? treeCol : '#8f8f8f';
      mg.fillRect(x - 1, y - 1, s.tree ? 2 : 1, s.tree ? 2 : 1);
    }
  }

