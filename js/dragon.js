  // ================= the Dragon: stage 100 is the end of every run. It can't be hit, and nothing saves you from it =================
  const DRAGON_STAGE = 100, DRAGON_ARRIVE = 3.5, DRAGON_END = 5.5;
  const DRAGON_SPR = [0, 1, 2].map(flap => {
    const c = mkCanvas(110, 72), g = c.getContext('2d');
    const dot = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const oval2 = (cx, cy, rx, ry, col) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) dot(cx + x, cy + y, col); };
    const tri = (a, b, d, col) => {
      for (let y = Math.min(a[1], b[1], d[1]); y <= Math.max(a[1], b[1], d[1]); y++) for (let x = Math.min(a[0], b[0], d[0]); x <= Math.max(a[0], b[0], d[0]); x++) {
        const s = (a[0] - d[0]) * (y - d[1]) - (a[1] - d[1]) * (x - d[0]), t = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]), u = (d[0] - b[0]) * (y - b[1]) - (d[1] - b[1]) * (x - b[0]);
        if ((s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0)) dot(x, y, col);
      }
    };
    const tipY = [2, 16, 34][flap], midY = [24, 32, 44][flap];
    for (const m of [1, -1]) { // both wings, mirrored about the middle
      const X = v => 55 + m * v;
      tri([X(10), 26], [X(53), tipY], [X(16), 44], '#5a1410');
      tri([X(14), 34], [X(53), tipY], [X(38), midY + 8], '#8a2016');
      tri([X(14), 38], [X(38), midY + 8], [X(22), midY + 16], '#74190f');
      for (let i = 0; i <= 40; i++) { const k = i / 40; dot(X(10 + 43 * k), Math.round(26 + (tipY - 26) * k), '#2c0a08'); dot(X(14 + 24 * k), Math.round(34 + (midY + 8 - 34) * k), '#2c0a08'); }
      tri([X(4), 54], [X(10), 54], [X(12), 69], '#7c1c12'); // legs and claws
      for (const dx of [8, 11, 14]) dot(X(dx), 70, '#e8dcc0');
      tri([X(3), 20], [X(7), 12], [X(5), 21], '#e8dcc0'); // horns
    }
    oval2(55, 42, 15, 19, '#a02a18');
    oval2(55, 46, 9, 14, '#e0a050');
    for (let y = 36; y < 60; y += 4) { g.fillStyle = '#b87830'; g.fillRect(47, y, 17, 1); }
    oval2(55, 24, 7, 9, '#a02a18');
    oval2(55, 15, 9, 7, '#b4301c');
    g.fillStyle = '#ffe04a'; g.fillRect(49, 12, 4, 3); g.fillRect(58, 12, 4, 3);
    g.fillStyle = '#200806'; g.fillRect(51, 13, 1, 2); g.fillRect(59, 13, 1, 2); g.fillRect(49, 18, 13, 4);
    g.fillStyle = '#ff9a3c'; g.fillRect(51, 20, 9, 2);
    g.fillStyle = '#ffffff'; for (const x of [49, 52, 55, 58, 61]) g.fillRect(x, 18, 1, 2);
    return finalize(c);
  });
  function updateDragon(dt) {
    if (!G.dragon) {
      if (S.stage < DRAGON_STAGE || S.daily || G.dead > 0) return;
      G.dragon = { t: 0, x: P.x, y: P.y - 260, time: S.time || 0 };
      S.dragonTime = S.dragonTime ? Math.min(S.dragonTime, G.dragon.time) : G.dragon.time;
      save();
      clearBanners();
      banner('The Dragon wakes', 'No one has ever gone further. It cannot be killed.', true);
      G.whiteT = 0.3; sfx.boss();
      tone('drg1', 58, 3, 'sawtooth', 0.14, -20, 0); tone('drg2', 92, 2.2, 'square', 0.05, -40, 0);
    }
    const D = G.dragon;
    D.t += dt;
    // nothing else dares stay on the field, and the stage can't move on
    G.monsters.length = 0; G.eshots.length = 0; G.bombs.length = 0; G.boss = null; G.horde = null; G.spawnT = 9; S.progress = 0;
    const k = 1 - Math.pow(0.02, dt);
    D.x += (P.x - D.x) * k; D.y += (P.y - 32 - D.y) * k;
    G.shake = Math.max(G.shake, D.t < DRAGON_ARRIVE ? 0.08 : 0.3);
    if (D.t >= DRAGON_ARRIVE && !D.fired) { D.fired = true; sfx.boom(); tone('drg3', 120, 2, 'sawtooth', 0.12, -70, 0); }
    if (D.t >= DRAGON_END) {
      const time = D.time;
      G.dragon = null;
      G.undyUsed = true; // Undying, shields and god mode don't count: this is the end
      die();
      $('diedSum').innerHTML = `The Dragon ended your run at <b>stage ${DRAGON_STAGE}</b> after <b>${fmtTime(time)}</b>. Your fastest: <b>${fmtTime(S.dragonTime)}</b>.` + $('diedSum').innerHTML.replace(/^.*?(<br>|<small>)/, '$1');
    }
  }
  // drawn in screen space, over the darkness, so it is the one thing the Backrooms can't hide
  function drawDragon(t) {
    const D = G.dragon;
    if (!D) return;
    const z = G.zoom * 1.4, spr = DRAGON_SPR[[0, 1, 2, 1][Math.floor(t * 7) % 4]], cx = (D.x - G.cam.ox) * G.zoom, cy = (D.y - G.cam.oy) * G.zoom + Math.sin(t * 3) * 6 * z;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, cy + spr.h * z * 0.62, spr.w * z * 0.32, spr.h * z * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    if (D.t >= DRAGON_ARRIVE) {
      // the breath: a stream of fire from the jaws to wherever you stand
      const mx = cx, my = cy - spr.h * z * 0.2, px = (P.x - G.cam.ox) * G.zoom, py = (P.y - 9 - G.cam.oy) * G.zoom;
      for (let i = 0; i < 90; i++) {
        const k = ((i / 90) + t * 1.5) % 1, wob = (1 + k * 10) * G.zoom, s = (2 + k * 4) * G.zoom;
        ctx.fillStyle = ['#fff2a0', '#ffd25a', '#ff9a3c', '#ff5a1a'][i % 4];
        ctx.fillRect(mx + (px - mx) * k + Math.sin(i * 12.9 + t * 20) * wob - s / 2, my + (py - my) * k + Math.cos(i * 7.3 + t * 17) * wob - s / 2, s, s);
      }
      ctx.fillStyle = `rgba(255,120,30,${0.12 + 0.3 * (D.t - DRAGON_ARRIVE) / (DRAGON_END - DRAGON_ARRIVE)})`;
      ctx.fillRect(0, 0, cv.width, cv.height);
    }
    ctx.drawImage(spr.c, cx - spr.w * z / 2, cy - spr.h * z / 2, spr.w * z, spr.h * z);
  }
