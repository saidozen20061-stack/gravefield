  // ================= render =================
  const cv = document.getElementById('cv'), gameCtx = cv.getContext('2d');
  let ctx = gameCtx; // swapped to the menu canvas while the menu scene draws, so the same sprite/weapon code paints both
  const shCv = mkCanvas(1, 1), shx = shCv.getContext('2d');
  // HUD layout from the editor, per device: { pieceId: { h: 'l'|'r', x, v: 't'|'b', y } } as fractions of the field from the nearest edges
  const HUD_KEY = 'gravefield-hud';
  let HUD = {};
  try { HUD = JSON.parse(localStorage.getItem(HUD_KEY)) || {}; } catch (e) {}
  function sizeMmBox(w) {
    const mw = w < 520 ? 110 : 150, box = document.getElementById('mmBox'); // runs from resize(), before $ exists
    box.style.width = mw + 8 + 'px'; box.style.height = Math.round(mw * WORLD.h / WORLD.w) + 8 + 'px';
  }
  function resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    G.dpr = dpr;
    sizeMmBox(r.width);
    if (w === cv.width && h === cv.height) return false;
    cv.width = w; cv.height = h;
    shCv.width = w; shCv.height = h;
    calcZoom();
    return true;
  }
  // zoom follows the field's height only, so sliding the shop (which changes the width) never rescales the view;
  // the player's Zoom setting nudges it in whole steps to keep the pixels crisp
  const ZOOM_MIN = -2, ZOOM_MAX = 3;
  function calcZoom() {
    G.zoom = Math.max(1, Math.max(2, Math.round(cv.height / 300)) + ((S && S.zoomAdj) || 0));
  }
  // resizing wipes the canvas after this frame was drawn, so redraw straight away;
  // otherwise the shop sliding (which resizes the field every frame) flashes black
  new ResizeObserver(() => { if (resize() && S && !G.menu) render(); }).observe(cv);
  resize();

  function drawSprite(spr, x, y, scale, flip, white, alpha = 1, sx = 1, sy = 1) {
    const w = spr.w * scale, h = spr.h * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(flip ? -sx : sx, sy);
    ctx.drawImage(white ? spr.white : spr.c, -w / 2, -h, w, h);
    ctx.restore();
  }
  // a flattened, skewed silhouette on the ground: it uses the current frame, so it walks, flaps and bobs with its owner
  function castShadow(spr, x, y, scale, flip, alpha = 1, sx = 1, sy = 1) {
    const w = spr.w * scale, h = spr.h * scale;
    shx.save();
    shx.globalAlpha = alpha;
    shx.translate(Math.round(x), Math.round(y));
    shx.transform(1, 0, -0.55, 0.42, 0, 0);
    shx.scale(flip ? -sx : sx, sy);
    shx.drawImage(spr.dark, -w / 2, -h, w, h);
    shx.restore();
    shx.globalAlpha = alpha;
    shx.fillStyle = '#000';
    shx.beginPath(); shx.ellipse(x, y - 0.5, w * 0.3, w * 0.1 + 0.8, 0, 0, Math.PI * 2); shx.fill();
    shx.globalAlpha = 1;
  }

  // ghostly green and icy blue overlays, cached per sprite frame
  const tintCache = new Map();
  function tintOf(spr, col) {
    const key = col, m = tintCache.get(spr) || {};
    if (!m[key]) { const c = tinted(spr.c, col); m[key] = { c, white: c, dark: spr.dark, w: spr.w, h: spr.h }; tintCache.set(spr, m); }
    return m[key];
  }
  const greenOf = spr => tintOf(spr, '#6ee07a');
  function monsterPose(m) {
    let bob = 0, alpha = m.d.alpha || 1, sx = 1, sy = 1, lift = 0, jx = 0;
    if (m.sub) alpha *= 0.18; // a bog lurker gliding under the mud
    if (m.rise > 0) { alpha *= 1 - m.rise / 0.45; bob = m.rise * 18; }
    else if (m.jump) { const k = m.jump.t / m.jump.dur; lift = Math.sin(Math.PI * Math.min(1, k)) * m.jump.h; bob = -lift; sy = 1.15; sx = 0.88; }
    else if (m.crouch > 0) { sy = 0.72; sx = 1.2; jx = (Math.random() - 0.5) * 0.8; }
    else if (m.tele > 0) { jx = (Math.random() - 0.5) * 2; sx = 1.08; sy = 0.92; }
    else if (m.dash) { sx = 1.2; sy = 0.88; }
    else if (m.type === 'bat') { lift = 7 + Math.sin(m.t * 14) * 2; bob = -lift; }
    else if (m.type === 'ghost') { lift = 4 + Math.sin(m.t * 3) * 2; bob = -lift; }
    else if (m.type === 'slime') { const k = Math.sin(m.t * 8); sy = 1 + k * 0.14; sx = 1 - k * 0.1; bob = k > 0.6 ? -(k - 0.6) * 6 : 0; if (m.wind > 0) { sy = 0.78; sx = 1.18; } }
    else if (m.d.crawler || m.d.grinner) {
      // the Backrooms' things don't walk so much as lurch, and every so often the whole body spasms
      bob = Math.floor(m.ph) % 2 ? -1 : 0;
      const slot = Math.floor(m.t * 5), r = Math.abs(Math.sin(slot * 12.9898 + (m.d.grinner ? 0.3 : m.d.crawler === 'hollow' ? 1.7 : 4.1)) * 43758.5453) % 1;
      if (r < 0.13) { jx = Math.sin(m.t * 95) * 1.6; sx = 1.05; sy = 0.93; bob += Math.round(Math.sin(m.t * 70)); }
      if (m.wind > 0) { sy = 1.06; sx = 0.95; jx = -m.face; }
      else if (m.atkT > 0) { jx = m.face * 1.5; sx = 1.05; }
    }
    else {
      // walkers rise a pixel on passing frames; a wind-up leans back, the hit lunges forward
      bob = Math.floor(m.ph) % 2 ? -Math.max(1, Math.round(m.scale)) : 0;
      if (m.wind > 0) { sy = 1.06; sx = 0.95; jx = -m.face; }
      else if (m.atkT > 0) { jx = m.face * 1.5; sx = 1.05; }
    }
    return { bob, alpha, sx, sy, lift, jx };
  }

  // where each hand grips the weapon, in weapon space: [rear hand, front hand]; null = one-handed
  const GRIP = {
    pebble: k => [{ x: 3.5 - 3.5 * k, y: 0 }, { x: 4.6, y: 0 }],
    arrow: k => [{ x: 4 - 4.5 * k, y: 0 }, { x: 5.3, y: 0 }],
    bolt: () => [{ x: 0.5, y: 1.4 }, { x: 4.6, y: 1.2 }],
    ball: () => [{ x: 0, y: 1.4 }, { x: 3.6, y: 0.8 }],
    fire: () => [{ x: 1, y: 0.4 }, null],
    spark: () => [{ x: -1, y: 0.3 }, { x: 5, y: 0.3 }],
    cannon: () => [{ x: 1.5, y: 3 }, { x: 6.5, y: 2.4 }],
    club: () => [{ x: -0.5, y: 0 }, { x: 2, y: 0 }],
    sword: () => [{ x: -0.8, y: 0 }, { x: 1, y: 0 }],
    axe: () => [{ x: 0, y: 0 }, { x: 3, y: 0 }],
    hammer: () => [{ x: 0, y: 0 }, { x: 3.5, y: 0 }],
    wand: () => [{ x: 1, y: 0.4 }, null],
    staff: () => [{ x: -1, y: 0.3 }, { x: 5, y: 0.3 }],
    knife: () => [{ x: 0, y: 0.3 }, null],
    starw: () => [{ x: 1.5, y: 0.4 }, null],
    dart: () => [{ x: 1, y: 0.3 }, null],
    lantern: () => [{ x: 1.5, y: 0.2 }, null],
    tome: () => [{ x: 1, y: 2.6 }, { x: 5, y: 2.6 }],
    flamer: () => [{ x: 0.5, y: 1.6 }, { x: 6, y: 0.2 }],
    stormgun: () => [{ x: 1.5, y: 1 }, { x: 7, y: 1.2 }],
  };
  function pixLine(a, b, s, col) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
    ctx.fillStyle = col;
    for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(a.x + (b.x - a.x) * i / n - s / 2), Math.round(a.y + (b.y - a.y) * i / n - s / 2), s, s);
  }
  function drawPlayerWeapon() {
    let a = P.aim;
    const art = heldArt(), swapped = art !== ST.art;
    if (G.whirlT > 0 && !swapped) a = G.t * 22; // whirlwind spins the blade all the way round
    else if (ST.melee && !swapped) {
      // a swing sweeps the blade across the arc; at rest it sits at the end of the last swing
      const arc = Math.min(2.4, ST.arc), p = 1 - P.swing, e = 1 - (1 - p) * (1 - p);
      a += -P.swingDir * (-arc / 2 + arc * e);
    }
    const h = handPos(a), back = ST.melee && !swapped ? 0 : P.recoil * 2, ca = Math.cos(a), sa = Math.sin(a), fy = ca < 0 ? -1 : 1;
    const ox = h.x - ca * back, oy = h.y - sa * back;
    const toW = p => ({ x: ox + ca * p.x - sa * p.y * fy, y: oy + sa * p.x + ca * p.y * fy });
    // shoulders, matched to the hero sprite's torso
    const bx = Math.round(P.x), by = Math.round(P.y) - 8 + bodyLift();
    let fore, rear;
    if (P.dir === 'side') { const s = P.flip ? -1 : 1; fore = { x: bx + s, y: by }; rear = { x: bx, y: by }; }
    else { fore = { x: bx + 5 * P.hs, y: by }; rear = { x: bx - 5 * P.hs, y: by }; }
    const fam = (ART[art] || { fam: art }).fam, [gr, gf] = (GRIP[fam] || GRIP.wand)(P.draw);
    let arms;
    if (gf) arms = [[rear, toW(gr)], [fore, toW(gf)]];
    else {
      const sw = P.moving ? [1, 0, -1, 0][Math.floor(P.walkT) % 4] : 0;
      arms = [[fore, toW(gr)], [rear, { x: rear.x + sw * 0.6, y: rear.y + 4 }]];
    }
    const ac = A(S.armor).c;
    // outline + sleeve per arm (rear first), so two arms side by side still read as two arms
    for (const [s, hnd] of arms) { pixLine(s, hnd, 4, OUTLINE); pixLine(s, hnd, 2, ac[0]); pixLine({ x: s.x, y: s.y + 0.6 }, { x: hnd.x, y: hnd.y + 0.6 }, 1, ac[1]); }
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(a);
    if (fy < 0) ctx.scale(1, -1);
    drawWeapon(ctx, art, P.draw);
    if (G.flashT > 0 && (!ST.melee || swapped)) {
      const k = G.flashT / 0.07, tip = tipOf(art), fc = FLASH[ST.shot] || FLASH.arrow;
      ctx.globalAlpha = 0.35 * k; ctx.fillStyle = fc[0];
      ctx.beginPath(); ctx.arc(tip + 2, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = fc[0];
      ctx.fillRect(tip, -2, 4 + 3 * k, 4); ctx.fillRect(tip + 1, -4, 2, 8);
      ctx.fillStyle = fc[1]; ctx.fillRect(tip, -1, 3 + 2 * k, 2);
    }
    ctx.restore();
    // hands last, so they wrap over the grip
    for (const [, hnd] of arms) {
      const x = Math.round(hnd.x - 1), y = Math.round(hnd.y - 1);
      ctx.fillStyle = OUTLINE; ctx.fillRect(x - 1, y - 1, 4, 4);
      ctx.fillStyle = HC.skin; ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = HC.skinD; ctx.fillRect(x, y + 1, 2, 1);
    }
  }

  function heroSprite() {
    const armor = A(S.armor);
    if (G.dead > 0) return hero(armor, 'down', 'i0', true);
    if (P.moving) return hero(armor, P.dir, Math.floor(P.walkT) % 4, false, false);
    const blink = (G.t % 3.4) < 0.12;
    return hero(armor, P.dir, Math.floor(G.t / 0.7) % 2 ? 'i1' : 'i0', blink, false);
  }

  function render() {
    const z = G.zoom, vw = cv.width / z, vh = cv.height / z;
    const tx = clamp(P.x - vw / 2, 0, Math.max(0, WORLD.w - vw));
    const ty = clamp(P.y - 10 - vh / 2, 0, Math.max(0, WORLD.h - vh));
    G.cam.x += (tx - G.cam.x) * 0.15; G.cam.y += (ty - G.cam.y) * 0.15;
    G.cam.ox = Math.round(G.cam.x * z) / z; G.cam.oy = Math.round(G.cam.y * z) / z;
    const sh = G.shake > 0 && S.shakeOn && !G.paused && !G.choosing ? G.shake * 6 : 0;
    const ox = Math.round((G.cam.x + rand(-sh, sh)) * z) / z, oy = Math.round((G.cam.y + rand(-sh, sh)) * z) / z;
    const vx0 = ox - 40, vx1 = ox + vw + 40, vy0 = oy - 20, vy1 = oy + vh + 60;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d2b12'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(z, 0, 0, z, -ox * z, -oy * z);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(groundView, 0, 0);

    // ---- shadow pass (one layer so overlapping shadows don't stack) ----
    shx.setTransform(1, 0, 0, 1, 0, 0);
    shx.clearRect(0, 0, shCv.width, shCv.height);
    shx.setTransform(z, 0, 0, z, -ox * z, -oy * z);
    shx.imageSmoothingEnabled = false;
    const visStructs = structures.filter(s => s.x > vx0 - 30 && s.x < vx1 + 30 && s.y > vy0 && s.y < vy1 + 40);
    for (const s of visStructs) castShadow(s.spr, s.x, s.y, 1, false, 1);
    for (const m of G.monsters) {
      if (m.rise > 0 || m.x < vx0 || m.x > vx1 || m.y < vy0 || m.y > vy1) continue;
      const p = monsterPose(m);
      castShadow(monSpr(m), m.x, m.y, m.scale * Math.max(0.35, 1 - p.lift * 0.03), m.face < 0, m.d.fly ? 0.6 : 1, p.sx, p.sy);
    }
    for (const e of G.eshots) { shx.fillStyle = '#000'; shx.beginPath(); shx.ellipse(e.x, e.y + 8, 2, 1, 0, 0, Math.PI * 2); shx.fill(); }
    const chestSpr = c => c.open ? (c.golden ? CHEST.gOpen : CHEST.open) : (c.golden ? CHEST.gClosed : CHEST.closed);
    for (const c of G.chests) if (c.x > vx0 && c.x < vx1 && c.y > vy0 && c.y < vy1) castShadow(chestSpr(c), c.x, c.y, 1, false, c.open ? Math.max(0, 1 - c.ot / 4) : 1);
    const minionSpr = mn => { const d = mn.kind === 'golem' ? MON.cyclops : MON.skeleton; return mn.atk > 0 ? d.atk : d.walk[Math.floor(mn.ph) % d.walk.length]; };
    for (const mn of G.minions) castShadow(minionSpr(mn), mn.x, mn.y, mn.kind === 'golem' ? 1.3 : 1, mn.face < 0, 0.8);
    const hs = heroSprite();
    if (G.dead <= 0) castShadow(hs, P.x, P.y + 1, 1, P.dir === 'side' && P.flip, 1);
    if (S.pet && PET_BY[S.pet] && !PET_BY[S.pet].fly) castShadow(PET_BY[S.pet].spr, G.pet.x, G.pet.y, 1, G.pet.face < 0, 0.8);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.26; ctx.drawImage(shCv, 0, 0); ctx.restore();

    // ---- ground warnings + elite auras ----
    const blink = 0.5 + 0.5 * Math.sin(G.t * 18);
    for (const b of G.bombs) {
      const k = 1 - b.t / (b.t0 || 0.7);
      ctx.globalAlpha = 0.18 + 0.25 * k + 0.15 * blink; ctx.fillStyle = b.warn ? '#e5202a' : '#ff5a1a';
      ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      if (b.warn) {
        // boss slam marker: an outline plus a ring closing in until it lands
        ctx.globalAlpha = 0.85; ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * k, b.r * 0.55 * k, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // fire imp footprints, and the pet trotting behind you
    for (const h of G.hazards) {
      const k = h.t / h.t0, fl = Math.floor(G.t * 10 + h.x) % 2;
      ctx.globalAlpha = 0.8 * k; ctx.fillStyle = '#a8262b'; ctx.fillRect(h.x - 3, h.y - 1, 6, 2);
      ctx.fillStyle = '#ff6a1a'; ctx.fillRect(h.x - 2, h.y - 2 - fl, 4, 2);
      ctx.fillStyle = '#ffe08a'; ctx.fillRect(h.x - 1, h.y - 3 - fl, 2, 1);
    }
    ctx.globalAlpha = 1;
    drawPet();
    // weapon ground effects
    for (const z of G.zones) {
      const life = Math.min(1, z.t / 0.4, (z.t0 - z.t) / 0.15 + 0.2), T = G.t;
      if (z.kind === 'fire') {
        ctx.globalAlpha = 0.3 * life; ctx.fillStyle = '#ff5a1a'; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.9 * life;
        for (let i = 0; i < 9; i++) {
          const a = i * 2.39, d = (i % 3 + 1) / 3.4 * z.r, x = Math.round(z.x + Math.cos(a) * d), y = Math.round(z.y + Math.sin(a) * d * 0.55), h = 2 + Math.round((Math.sin(T * 14 + i * 1.7) + 1) * 1.5);
          ctx.fillStyle = '#ff6a1a'; ctx.fillRect(x - 1, y - h, 2, h); ctx.fillStyle = '#ffd25a'; ctx.fillRect(x, y - h + 1, 1, h - 1);
        }
      } else if (z.kind === 'toxic') {
        for (let i = 0; i < 5; i++) {
          const a = i * 1.26 + T * 0.6, x = z.x + Math.cos(a) * z.r * 0.45, y = z.y - 3 + Math.sin(a) * z.r * 0.25;
          ctx.globalAlpha = 0.22 * life; ctx.fillStyle = i % 2 ? '#6ee07a' : '#3f8a33'; ctx.beginPath(); ctx.ellipse(x, y, z.r * 0.6, z.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 0.8 * life; ctx.fillStyle = '#b6f5a0';
        for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(z.x + Math.sin(T * 2 + i * 2) * z.r * 0.6), Math.round(z.y - 4 - ((T * 10 + i * 5) % 12)), 1, 1);
      } else if (z.kind === 'vortex') {
        ctx.globalAlpha = 0.25 * life; ctx.fillStyle = '#3a1a5a'; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.8 * life; ctx.strokeStyle = z.big ? '#c78cff' : '#a06ad0'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
          const rr = z.r * (0.35 + i * 0.25), a0 = T * (4 - i) + i * 2;
          ctx.beginPath(); ctx.ellipse(z.x, z.y, rr, rr * 0.55, 0, a0, a0 + 2.2); ctx.stroke();
        }
        ctx.fillStyle = '#0e0616'; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * 0.18, z.r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      } else if (z.kind === 'frost') {
        // blizzard: an icy disc, swirling wind and pixel snow driving sideways
        ctx.globalAlpha = 0.28 * life; ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.7 * life; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) { const a0 = T * (3 + i) + i * 3; ctx.beginPath(); ctx.ellipse(z.x, z.y - 4, z.r * (0.5 + i * 0.3), z.r * (0.25 + i * 0.15), 0, a0, a0 + 1.8); ctx.stroke(); }
        ctx.globalAlpha = 0.95 * life; ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 18; i++) {
          const x = z.x - z.r + ((i * 37 + T * 70) % (z.r * 2)), y = z.y - 30 + ((i * 53 + T * 40) % 34);
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      } else if (z.kind === 'vines') {
        ctx.globalAlpha = 0.9 * life;
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2, x = Math.round(z.x + Math.cos(a) * z.r * 0.8), y = Math.round(z.y + Math.sin(a) * z.r * 0.45), h = 3 + (i % 3);
          ctx.fillStyle = '#2f6a28'; ctx.fillRect(x, y - h, 1, h); ctx.fillStyle = '#6ee07a'; ctx.fillRect(x + (i % 2 ? 1 : -1), y - h + 1, 1, 1);
        }
      }
    }
    for (const k of G.strikes) {
      if (k.hit) continue;
      ctx.globalAlpha = 0.25 + 0.3 * (1 - k.t / k.t0); ctx.strokeStyle = k.kind === 'fire' ? '#ff3a2a' : (STRIKE_COL[k.kind] || STRIKE_COL.star)[0]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r, k.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const m of G.monsters) {
      if (m.x < vx0 || m.x > vx1 || m.y < vy0 || m.y > vy1 || m.rise > 0) continue;
      if (m.crouch > 0 || m.jump) {
        const tx = m.jump ? m.jump.x1 : m.tx, ty = m.jump ? m.jump.y1 : m.ty, rr = 12 + m.r;
        ctx.globalAlpha = 0.25 + 0.2 * blink; ctx.strokeStyle = '#ff3a2a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(tx, ty, rr, rr * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha *= 0.5; ctx.fillStyle = '#ff3a2a'; ctx.fill();
      }
      if (m.tele > 0) {
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.teleA);
        ctx.globalAlpha = 0.2 + 0.25 * blink; ctx.fillStyle = '#ff9a2a';
        const len = Math.max(170, m.spd * 5) * 0.42;
        ctx.fillRect(0, -m.r * 0.6, len, m.r * 1.2);
        ctx.restore();
      }
      if (m.affs.length) {
        ctx.globalAlpha = 0.45 + 0.2 * Math.sin(G.t * 5 + m.t); ctx.strokeStyle = m.affs[0].col; ctx.lineWidth = 1;
        const rx = m.r + 3;
        ctx.beginPath(); ctx.ellipse(Math.round(m.x), Math.round(m.y), rx, rx * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
        if (m.affs[1]) { ctx.strokeStyle = m.affs[1].col; ctx.beginPath(); ctx.ellipse(Math.round(m.x), Math.round(m.y), rx + 2, rx * 0.4 + 1, 0, 0, Math.PI * 2); ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;

    for (const d of G.drops) {
      if (d.x < vx0 || d.x > vx1 || d.y < vy0 || d.y > vy1) continue;
      const bob = Math.sin(d.t * 6 + d.x) * 1;
      if (d.kind === 'gold') {
        ctx.fillStyle = '#b8862a'; ctx.fillRect(d.x - 2, d.y - 2 + bob, 4, 4);
        ctx.fillStyle = '#f2c14e'; ctx.fillRect(d.x - 2, d.y - 2 + bob, 3, 3);
        ctx.fillStyle = '#fff3c4'; ctx.fillRect(d.x - 1, d.y - 1 + bob, 1, 1);
      } else {
        ctx.fillStyle = '#2c8fbf'; ctx.fillRect(d.x - 1, d.y - 3 + bob, 3, 6); ctx.fillRect(d.x - 2, d.y - 1 + bob, 5, 2);
        ctx.fillStyle = '#66d4ff'; ctx.fillRect(d.x - 1, d.y - 3 + bob, 2, 5);
        ctx.fillStyle = '#e6fbff'; ctx.fillRect(d.x - 1, d.y - 2 + bob, 1, 1);
      }
    }

    // ---- depth-sorted bodies ----
    const ents = [];
    for (const s of visStructs) ents.push({ y: s.y, s });
    for (const m of G.monsters) if (m.x > vx0 && m.x < vx1 && m.y > vy0 && m.y < vy1) ents.push({ y: m.y, m });
    ents.push({ y: P.y, player: true });
    for (const c of G.chests) if (c.x > vx0 && c.x < vx1 && c.y > vy0 && c.y < vy1) ents.push({ y: c.y, chest: c });
    for (const b of G.books) if (b.x > vx0 && b.x < vx1 && b.y > vy0 && b.y < vy1 + 10) ents.push({ y: b.y, book: b });
    for (const mn of G.minions) ents.push({ y: mn.y, minion: mn });
    ents.sort((a, b) => a.y - b.y);

    // ability ground markers: arrow rain zones and incoming meteors
    for (const rn of G.rains) {
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(G.t * 10); ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.ellipse(rn.x, rn.y, 50, 35, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }

    for (const e of ents) {
      if (e.minion) {
        const mn = e.minion, golem = mn.kind === 'golem', spr = minionSpr(mn), k = golem ? 1.3 : 1;
        const fade = mn.rise > 0 ? 1 - mn.rise / 0.5 : Math.min(1, mn.t / 0.6);
        const bob = mn.rise > 0 ? mn.rise * 20 : (Math.floor(mn.ph) % 2 ? -1 : 0);
        ctx.globalAlpha = 0.5 * fade; ctx.strokeStyle = '#6ee07a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(mn.x, mn.y, golem ? 14 : 7, golem ? 5 : 3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        drawSprite(spr, mn.x, mn.y + bob, k, mn.face < 0, false, fade * 0.95);
        drawSprite(greenOf(spr), mn.x, mn.y + bob, k, mn.face < 0, false, fade * (0.35 + 0.1 * Math.sin(G.t * 6)));
        continue;
      }
      if (e.book) {
        // a floating spellbook over a glowing rune circle
        const b = e.book, K = BOOK_BY[b.kind], bob = Math.sin(G.t * 2.4 + b.ph) * 2, pulse = 0.5 + 0.5 * Math.sin(G.t * 3 + b.ph);
        const fade = Math.min(1, b.t / 0.6);
        ctx.globalAlpha = (0.25 + 0.2 * pulse) * fade; ctx.strokeStyle = K.col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(b.x, b.y, 9 + pulse * 2, 3.5 + pulse, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.18 * fade; ctx.fillStyle = K.col; ctx.beginPath(); ctx.ellipse(b.x, b.y, 7, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        drawSprite(K.spr, b.x, b.y - 6 + bob, 1, false, false, fade);
        continue;
      }
      if (e.chest) {
        // closed chests give a little hop every couple of seconds; open ones fade away
        const c = e.chest, hop = !c.open && (c.t % 2.2) < 0.3 ? Math.sin((c.t % 2.2) / 0.3 * Math.PI) : 0;
        drawSprite(chestSpr(c), c.x, c.y - hop * 3, 1, false, false, c.open ? Math.max(0, 1 - Math.max(0, c.ot - 2) / 2) : 1, 1 + hop * 0.08, 1 - hop * 0.06);
        if (c.open && c.ot < 1.2) {
          ctx.globalAlpha = Math.max(0, 0.5 - c.ot * 0.4); ctx.fillStyle = '#fff2a0';
          ctx.fillRect(c.x - 5, c.y - 60, 10, 52); ctx.fillRect(c.x - 2, c.y - 70, 4, 62);
          ctx.globalAlpha = 1;
        }
        continue;
      }
      if (e.s) {
        const s = e.s;
        let alpha = 1;
        if ((s.tree || s.fade) && P.y < s.y - 2 && P.y > s.y - s.spr.h + 4 && Math.abs(P.x - s.x) < s.spr.w / 2) alpha = 0.45;
        drawSprite(s.spr, s.x, s.y, 1, false, false, alpha);
      } else if (e.player) {
        if (G.dead > 0) {
          ctx.save(); ctx.translate(P.x, P.y - 3); ctx.rotate(Math.PI / 2); ctx.globalAlpha = 0.85;
          ctx.drawImage(hs.c, -hs.w / 2, -hs.h / 2); ctx.restore();
        } else {
          const behind = P.dir === 'up' || Math.sin(P.aim) < -0.5, ghost = G.invisT > 0 ? 0.3 + 0.08 * Math.sin(G.t * 8) : 1;
          ctx.globalAlpha = ghost;
          if (behind) drawPlayerWeapon();
          drawSprite(hs, P.x, P.y + 1, 1, P.dir === 'side' && P.flip, P.hurt > 0.08, ghost);
          if (G.buffs.immortal > 0) drawSprite(hs, P.x, P.y + 1, 1, P.dir === 'side' && P.flip, true, 0.25 + 0.2 * Math.sin(G.t * 14));
          if (G.buffs.frenzy > 0) drawSprite(tintOf(hs, '#ff3a2a'), P.x, P.y + 1, 1, P.dir === 'side' && P.flip, false, 0.16 + 0.1 * Math.sin(G.t * 12));
          ctx.globalAlpha = ghost;
          if (!behind) drawPlayerWeapon();
          ctx.globalAlpha = 1;
        }
      } else {
        const m = e.m, p = monsterPose(m), spr = monSpr(m);
        m.trail.forEach((t, i) => drawSprite(spr, t.x, t.y + p.bob, m.scale, m.face < 0, false, p.alpha * (0.3 - i * 0.08), p.sx, p.sy));
        drawSprite(spr, m.x + p.jx, m.y + p.bob, m.scale, m.face < 0, m.flash > 0, p.alpha, p.sx, p.sy);
        if (m.iceT > 0 || m.slowT > 0) drawSprite(tintOf(spr, '#9fe0ff'), m.x + p.jx, m.y + p.bob, m.scale, m.face < 0, false, m.iceT > 0 ? 0.55 : 0.25, p.sx, p.sy);
        else if (m.stunT > 0) for (let i = 0; i < 3; i++) { const a = G.t * 6 + i * 2.1; ctx.fillStyle = '#ffe04a'; ctx.fillRect(m.x + Math.cos(a) * 6 - 0.5, m.y + p.bob - m.hh * 2 - 2 + Math.sin(a) * 2, 1.5, 1.5); }
        if (m.boss) drawSprite(CROWN, m.x, m.y + p.bob - spr.h * m.scale * p.sy + 1, m.scale * 0.8, false, false);
        let top = m.y + p.bob - m.hh * 2 - 4;
        if (!m.boss && m.hp < m.max) {
          const w = 12 * Math.min(1.4, m.scale);
          ctx.fillStyle = '#2a1406'; ctx.fillRect(m.x - w / 2 - 0.5, top - 0.5, w + 1, 3);
          ctx.fillStyle = '#d8402a'; ctx.fillRect(m.x - w / 2, top, w * Math.max(0, m.hp / m.max), 2);
        }
        if (m.affs.length && !m.boss) {
          // ability names over the head, each in its own color
          ctx.font = '700 5px "Pixelify Sans", monospace'; ctx.textAlign = 'left'; ctx.lineWidth = 1.6; ctx.strokeStyle = '#2a1406';
          const parts = m.affs.map(f => f.name), ws = parts.map(s => ctx.measureText(s).width), tot = ws.reduce((a, b) => a + b, 0) + (parts.length - 1) * 2;
          let x = m.x - tot / 2; top -= 2;
          parts.forEach((s, i) => { ctx.strokeText(s, x, top); ctx.fillStyle = m.affs[i].col; ctx.fillText(s, x, top); x += ws[i] + 2; });
        }
      }
    }

    for (const s of G.shots) drawShot(ctx, s.look || s.type, s.x, s.y, Math.atan2(s.vy, s.vx), s.type === 'flame' ? 1 + (0.38 - s.life) * 7 : s.type === 'wave' ? 1 + (0.5 - s.life) * 1.6 : (s.k || 1));
    // floating over the hero: a magnet for Magnet Orb, a crackling cloud for Lightning Storm
    if (G.dead <= 0 && (G.buffs.magnet > 0 || G.buffs.storm > 0)) {
      const top = Math.round(P.y - 30 + Math.sin(G.t * 3) * 1.5), both = G.buffs.magnet > 0 && G.buffs.storm > 0;
      if (G.buffs.storm > 0) {
        const cx = Math.round(P.x - (both ? 6 : 0));
        drawSprite(CLOUD_SPR, cx, top, 1, false, false, 0.95);
        if (Math.sin(G.t * 23) > 0.6) { ctx.fillStyle = '#ffe04a'; ctx.fillRect(cx, top, 1, 3); ctx.fillRect(cx - 1, top + 3, 1, 2); ctx.fillRect(cx, top + 5, 1, 2); }
      }
      if (G.buffs.magnet > 0) {
        const mx = Math.round(P.x + (both ? 10 : 0)), my = top + (both ? 2 : 0);
        ctx.globalAlpha = 0.3 + 0.15 * Math.sin(G.t * 8); ctx.fillStyle = '#ff6a5a';
        ctx.beginPath(); ctx.arc(mx, my - 4, 7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        drawSprite(MAGNET_SPR, mx, my, 1, false, false, 1);
      }
    }
    // spinning blades power-up
    if (G.buffs.blades > 0 && G.dead <= 0) {
      for (let i = 0; i < 3; i++) {
        const a = G.t * 5 + i * Math.PI * 2 / 3;
        ctx.save(); ctx.translate(P.x + Math.cos(a) * 26, P.y - 6 + Math.sin(a) * 18); ctx.rotate(G.t * 14);
        ctx.fillStyle = OUTLINE; ctx.fillRect(-5, -2, 10, 4); ctx.fillRect(-2, -5, 4, 10);
        ctx.fillStyle = '#e8eef2'; ctx.fillRect(-4, -1, 8, 2); ctx.fillRect(-1, -4, 2, 8);
        ctx.fillStyle = '#9aa2aa'; ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
      }
    }
    // enemy projectiles: spinning bones from skeletons, goo from slimes, cursed orbs from the rest
    for (const e of G.eshots) {
      ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y));
      if (e.kind === 'skeleton') {
        ctx.rotate(e.t * 14); ctx.fillStyle = '#2a1406'; ctx.fillRect(-3.5, -1.5, 7, 3);
        ctx.fillStyle = '#e9e4d4'; ctx.fillRect(-3, -0.5, 6, 1); ctx.fillRect(-3, -1, 1, 2); ctx.fillRect(2, -1, 1, 2);
      } else {
        const c = e.kind === 'slime' ? ['#3a9a4c', '#9cf0a8'] : e.kind === 'zombie' ? ['#5a7a3a', '#c6e88a'] : e.kind === 'wraith' ? ['#4f97c9', '#e8f6ff'] : ['#7a3fb0', '#e4c8ff'];
        ctx.fillStyle = '#2a1406'; ctx.fillRect(-2.5, -2.5, 5, 5);
        ctx.fillStyle = c[0]; ctx.fillRect(-2, -2, 4, 4); ctx.fillStyle = c[1]; ctx.fillRect(-1, -1, 1.5, 1.5);
        ctx.globalAlpha = 0.35; ctx.fillStyle = c[0]; ctx.fillRect(-e.vx * 0.06 - 1.5, -e.vy * 0.06 - 1.5, 3, 3);
      }
      ctx.restore();
    }

    // falling meteors (drawn above everything on the ground)
    // falling stars and swords, holy rays, erupting tentacles and bone spikes
    for (const k of G.strikes) {
      if (k.kind === 'sword') {
        // a giant pixel sword plunging point-first, then left standing in the ground
        const q = k.hit ? 0 : k.t / k.t0, spr = PIX_WEAPONS.gsword.spr;
        ctx.save(); ctx.globalAlpha = k.hit ? Math.min(1, k.after / 0.25) : 1;
        ctx.translate(Math.round(k.x), Math.round(k.y - 4 - q * 150)); ctx.rotate(Math.PI / 2); ctx.scale(1.3, 1.3);
        ctx.drawImage(spr.c, -spr.w + 2, -spr.h / 2); ctx.restore();
        continue;
      }
      if (k.kind === 'holy') {
        if (!k.hit) {
          ctx.globalAlpha = 0.2 + 0.4 * (1 - k.t / k.t0); ctx.fillStyle = '#fff2a0';
          ctx.fillRect(Math.round(k.x), k.y - 260, 1, 260); ctx.globalAlpha = 1;
        } else {
          // the ray itself: a wide pillar of light, white at the core
          const a = Math.min(1, k.after / 0.3), w = Math.round(6 + 6 * a);
          ctx.globalAlpha = 0.45 * a; ctx.fillStyle = '#ffd84d'; ctx.fillRect(Math.round(k.x - w), k.y - 260, w * 2, 262);
          ctx.globalAlpha = 0.9 * a; ctx.fillStyle = '#fff6d0'; ctx.fillRect(Math.round(k.x - w / 3), k.y - 260, Math.round(w * 2 / 3), 262);
          ctx.globalAlpha = 0.6 * a; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(k.x, k.y, w * 1.8, w * 0.7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        continue;
      }
      if (k.kind === 'bone' && k.hit) {
        // a straight spike of bone shooting up out of the ground
        const q = k.after / 0.4, h = Math.round(22 * Math.sin(Math.PI * Math.min(1, (1 - q) * 1.6)));
        ctx.fillStyle = 'rgba(90,70,40,0.5)'; ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r * 0.6, k.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < h; i++) {
          const w = Math.max(1, Math.round(4 * (1 - i / 24)));
          ctx.fillStyle = OUTLINE; ctx.fillRect(Math.round(k.x) - w - 1, k.y - i, w * 2 + 2, 1);
          ctx.fillStyle = i % 5 === 0 ? '#a8a088' : '#e9e4d4'; ctx.fillRect(Math.round(k.x) - w, k.y - i, w * 2, 1);
        }
        continue;
      }
      if (k.kind === 'star' && !k.hit) {
        const q = k.t / k.t0, x = k.x + q * 40, y = k.y - q * 130;
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff2a0'; ctx.fillRect(x + 2, y - 8, 2, 8); ctx.fillRect(x + 4, y - 14, 2, 6); ctx.globalAlpha = 1;
        ctx.fillStyle = OUTLINE; ctx.fillRect(x - 2.5, y - 2.5, 5, 5); ctx.fillStyle = '#ffe04a'; ctx.fillRect(x - 2, y - 1, 4, 2); ctx.fillRect(x - 1, y - 2, 2, 4); ctx.fillStyle = '#fff'; ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
      if (k.kind === 'tentacle') {
        if (!k.hit) { ctx.fillStyle = 'rgba(42,20,64,0.6)'; ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r * (1 - k.t / k.t0), k.r * 0.5 * (1 - k.t / k.t0), 0, 0, Math.PI * 2); ctx.fill(); continue; }
        // a pixel tentacle rising out of the ground, swaying, then sinking back
        const q = k.after / 0.4, h = Math.round(30 * Math.sin(Math.PI * Math.min(1, (1 - q) * 1.6)));
        ctx.fillStyle = 'rgba(42,20,64,0.7)'; ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r * 0.7, k.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < h; i++) {
          const w = Math.max(1, Math.round(5 * (1 - i / 34))), sx = Math.round(k.x + Math.sin(i * 0.18 + G.t * 9) * (i / 10));
          ctx.fillStyle = OUTLINE; ctx.fillRect(sx - w - 1, k.y - i, w * 2 + 2, 1);
          ctx.fillStyle = i % 6 < 2 ? '#4fd8a0' : '#5a2a7a'; ctx.fillRect(sx - w, k.y - i, w * 2, 1);
        }
      }
    }
    for (const f of G.fx) {
      if (f.zap) {
        // jagged arc between two points (chain lightning, ricochets)
        const r = mulberry(f.seed * 1000 | 0), n = 6;
        ctx.globalAlpha = Math.min(1, f.t / 0.08);
        for (const [lw, c] of [[3, 'rgba(255,255,255,0.35)'], [1.2, f.c]]) {
          ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(f.x1, f.y1);
          for (let i = 1; i < n; i++) ctx.lineTo(f.x1 + (f.x2 - f.x1) * i / n + (r() - 0.5) * 8, f.y1 + (f.y2 - f.y1) * i / n + (r() - 0.5) * 8);
          ctx.lineTo(f.x2, f.y2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        continue;
      }
      if (f.xslash) {
        // two crossing shadow cuts
        const k = f.t / 0.22, L = 11 * (1.4 - k * 0.4);
        ctx.globalAlpha = Math.min(1, k * 1.5); ctx.lineCap = 'round';
        for (const [lw, c] of [[4, f.c], [1.2, '#ffffff']]) {
          ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
          ctx.moveTo(f.x - L, f.y - L * 0.7); ctx.lineTo(f.x + L, f.y + L * 0.7); ctx.moveTo(f.x + L, f.y - L * 0.7); ctx.lineTo(f.x - L, f.y + L * 0.7); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.lineCap = 'butt';
        continue;
      }
      if (f.slash) {
        // a crescent that sweeps across the swing: the blade's edge races ahead, a tapering trail follows it and fades
        const T = f.T || 0.16, p = 1 - f.t / T, ease = 1 - Math.pow(1 - Math.min(1, p * 1.6), 3);
        const dir = f.dir || 1, s0 = f.a - dir * f.arc / 2, head = ease, tail = Math.max(0, head - 0.8), life = Math.min(1, (f.t / T) * 2.2);
        const L = SLASH_LOOK[f.style] || SLASH_LOOK.steel;
        const R = f.r * 0.98, W = Math.max(4, f.r * 0.32 * L.w), N = 22;
        const ang = u => s0 + dir * f.arc * u;
        const band = (a0, a1, r0, r1) => { ctx.beginPath(); ctx.arc(f.x, f.y, r0, a0, a1, dir < 0); ctx.arc(f.x, f.y, r1, a1, a0, dir > 0); ctx.closePath(); ctx.fill(); };
        for (let i = 0; i < N; i++) {
          const u0 = tail + (head - tail) * i / N, u1 = tail + (head - tail) * (i + 1) / N, um = (u0 + u1) / 2;
          const w = W * Math.sin(Math.PI * Math.min(1, um)) * (0.35 + 0.65 * (i + 1) / N), al = life * (0.15 + 0.85 * (i + 1) / N);
          if (w < 0.5) continue;
          const a0 = ang(u0), a1 = ang(u1);
          // a soft glow behind magic and fire blades
          if (L.glow) {
            ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * 0.35; ctx.fillStyle = `rgb(${L.glow})`;
            band(a0, a1, R + 3, Math.max(1, R - w * L.gw)); ctx.globalCompositeOperation = 'source-over';
          }
          // coloured body of the crescent
          ctx.globalAlpha = al * L.body; ctx.fillStyle = f.c; band(a0, a1, R, R - w);
          // the cutting edge along the outside (blunt weapons have none)
          if (L.edge) { ctx.globalAlpha = al; ctx.fillStyle = L.edge; band(a0, a1, R + 0.5, R - Math.max(1, w * 0.3)); }
        }
        // a glint at the tip of the blade, and a few speed lines off the arc
        if (p < 0.75) {
          const ha = ang(head), hx = f.x + Math.cos(ha) * R, hy = f.y + Math.sin(ha) * R;
          ctx.globalAlpha = life; ctx.fillStyle = '#ffffff';
          ctx.fillRect(hx - 2.5, hy - 0.5, 5, 1); ctx.fillRect(hx - 0.5, hy - 2.5, 1, 5);
          ctx.globalAlpha = life * 0.5; ctx.strokeStyle = f.c; ctx.lineWidth = 1;
          for (let k = 1; k <= 3; k++) {
            const la = ang(Math.max(0, head - k * 0.12)), r1 = R + 3 + k * 1.5;
            ctx.beginPath(); ctx.moveTo(f.x + Math.cos(la) * r1, f.y + Math.sin(la) * r1);
            ctx.lineTo(f.x + Math.cos(la - dir * 0.18) * (r1 + 2), f.y + Math.sin(la - dir * 0.18) * (r1 + 2)); ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        continue;
      }
      if (f.ghost) { drawSprite(f.tint ? tintOf(f.spr, f.tint) : f.spr, f.x, f.y + 1, 1, f.flip, false, Math.min(f.tint ? 0.35 : 0.5, f.t * 1.6)); continue; }
      if (f.rainArrow) {
        const k = f.t / 0.18, y = f.y - k * 46;
        ctx.fillStyle = OUTLINE; ctx.fillRect(f.x - 1, y - 9, 2, 10);
        ctx.fillStyle = '#a8763f'; ctx.fillRect(f.x - 0.5, y - 9, 1, 8); ctx.fillStyle = '#c9ced2'; ctx.fillRect(f.x - 1, y - 1, 2, 2);
        if (k < 0.2) { ctx.fillStyle = 'rgba(214,180,130,0.8)'; ctx.fillRect(f.x - 3, f.y - 1, 6, 2); }
        continue;
      }
      if (f.bolt) {
        // a jagged lightning strike from above
        const r = mulberry(f.seed * 1000 | 0);
        ctx.globalAlpha = Math.min(1, f.t / 0.1);
        for (const [lw, c] of [[3, 'rgba(255,240,140,0.5)'], [1.3, '#ffffff']]) {
          ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(f.x + 10, f.y - 130);
          for (let i = 1; i <= 7; i++) ctx.lineTo(f.x + (i === 7 ? 0 : (r() - 0.5) * 16), f.y - 130 + i * 130 / 7);
          ctx.stroke();
        }
        ctx.fillStyle = '#fff6a0'; ctx.fillRect(f.x - 3, f.y - 3, 6, 6);
        ctx.globalAlpha = 1;
        continue;
      }
      if (f.ring) {
        ctx.strokeStyle = f.c; ctx.globalAlpha = f.t / 0.3; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.max * (1 - f.t / 0.3 * 0.6), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        if (f.smoke) ctx.globalAlpha = Math.min(1, f.t * 2.5);
        ctx.fillStyle = f.c; ctx.fillRect(f.x - f.s / 2, f.y - f.s / 2, f.s, f.s);
        ctx.globalAlpha = 1;
      }
    }

    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const t of G.texts) {
      if (!S.nums && !t.hurt) continue;
      ctx.globalAlpha = Math.min(1, t.t * 3);
      ctx.font = `700 ${t.crit ? 9 : 7}px "Pixelify Sans", monospace`;
      ctx.lineWidth = 2.2; ctx.strokeStyle = '#2a1406';
      ctx.strokeText(t.s, t.x, t.y);
      ctx.fillStyle = t.hurt ? '#ff6b5a' : t.crit ? '#ffb347' : t.steel ? '#b8c4cc' : '#ffffff';
      ctx.fillText(t.s, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    if (G.aim.has && G.dead <= 0) {
      const a = aimWorld(), x = Math.round(a.x), y = Math.round(a.y), k = G.aim.down ? 1 : 0;
      ctx.fillStyle = '#2a1406';
      ctx.fillRect(x - 5 - k, y - 1, 4, 3); ctx.fillRect(x + 2 + k, y - 1, 4, 3); ctx.fillRect(x - 1, y - 5 - k, 3, 4); ctx.fillRect(x - 1, y + 2 + k, 3, 4);
      ctx.fillStyle = G.aim.down ? '#ffc93c' : '#fff2cf';
      ctx.fillRect(x - 4 - k, y, 2, 1); ctx.fillRect(x + 3 + k, y, 2, 1); ctx.fillRect(x, y - 4 - k, 1, 2); ctx.fillRect(x, y + 3 + k, 1, 2);
    }

    // ---- screen space: power-up tints, chest pointers, touch stick, minimap ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const d = G.dpr;
    drawWeather(d);
    // taking a hit: the screen flushes red, strongest at the edges, and fades out
    if (G.hurtT > 0) {
      const a = Math.min(1, G.hurtT / 0.4), Wd = cv.width, Ht = cv.height;
      const gr = ctx.createRadialGradient(Wd / 2, Ht / 2, Math.min(Wd, Ht) * 0.25, Wd / 2, Ht / 2, Math.max(Wd, Ht) * 0.75);
      gr.addColorStop(0, `rgba(200,20,20,${0.1 * a})`); gr.addColorStop(1, `rgba(170,0,0,${0.45 * a})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, Wd, Ht);
    }
    if (G.buffs.freeze > 0) {
      ctx.fillStyle = `rgba(140,200,255,${0.16 + 0.04 * Math.sin(G.t * 3)})`; ctx.fillRect(0, 0, cv.width, cv.height);
    }
    if (G.darkT > 0) { ctx.fillStyle = `rgba(20,8,40,${Math.min(0.6, G.darkT)})`; ctx.fillRect(0, 0, cv.width, cv.height); }
    if (G.whiteT > 0) { ctx.fillStyle = `rgba(255,250,230,${Math.min(0.85, G.whiteT * 1.8)})`; ctx.fillRect(0, 0, cv.width, cv.height); }
    // gold arrows on the screen edge pointing at chests you can't see
    for (const c of G.chests) {
      if (c.open) continue;
      const sx = (c.x - ox) * z, sy = (c.y - 6 - oy) * z, m = 26 * d;
      if (sx > 0 && sx < cv.width && sy > 0 && sy < cv.height) continue;
      const cx = cv.width / 2, cy = cv.height / 2, a = Math.atan2(sy - cy, sx - cx);
      const t = Math.min((cv.width / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (cv.height / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
      // pixel arrow: snapped to 8 directions and only ever turned in right angles, so the pixels stay square
      const oct = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8, diag = oct % 2 === 1, turn = Math.floor(oct / 2);
      const spr = (c.golden ? ARROW_G : ARROW)[diag ? 1 : 0], k = Math.max(2, Math.round(G.zoom * 0.8));
      const push = Math.round(Math.sin(G.t * 7) * 1.5) * k;
      const px_ = Math.round(cx + Math.cos(a) * (t + push)), py_ = Math.round(cy + Math.sin(a) * (t + push));
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(px_, py_); ctx.rotate(turn * Math.PI / 2);
      ctx.drawImage(spr.c, Math.round(-spr.w * k / 2), Math.round(-spr.h * k / 2), spr.w * k, spr.h * k);
      ctx.restore();
    }
    if (G.joy) {
      ctx.fillStyle = 'rgba(255,224,163,0.18)'; ctx.strokeStyle = 'rgba(74,34,7,0.6)'; ctx.lineWidth = 3 * d;
      ctx.beginPath(); ctx.arc(G.joy.bx * d, G.joy.by * d, 44 * d, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,224,163,0.7)';
      ctx.beginPath(); ctx.arc((G.joy.bx + G.joy.vx * 44) * d, (G.joy.by + G.joy.vy * 44) * d, 18 * d, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (MAPS[curMap] && MAPS[curMap].id === 'backrooms') return; // no HUD in the Backrooms, minimap included
    const mw = Math.round((cv.width / d < 520 ? 110 : 150) * d), mh = Math.round(mw * WORLD.h / WORLD.w), k = mw / WORLD.w;
    let mx = cv.width - mw - 10 * d, my = cv.height - mh - 10 * d;
    const ML = HUD.mmBox;
    if (ML) { // moved in the HUD editor: same anchoring maths as the DOM pieces, the 4px frame included
      const W = cv.width / d, H = cv.height / d, bw = mw / d + 8, bh = mh / d + 8;
      mx = Math.round((Math.max(0, Math.min(W - bw, ML.h === 'l' ? ML.x * W : W - ML.x * W - bw)) + 4) * d);
      my = Math.round((Math.max(0, Math.min(H - bh, ML.v === 't' ? ML.y * H : H - ML.y * H - bh)) + 4) * d);
    }
    ctx.fillStyle = '#4a2207'; ctx.fillRect(mx - 4 * d, my - 4 * d, mw + 8 * d, mh + 8 * d);
    ctx.fillStyle = '#d7863a'; ctx.fillRect(mx - 2 * d, my - 2 * d, mw + 4 * d, mh + 4 * d);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(minimap, mx, my, mw, mh);
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = 'rgba(255,242,207,0.8)'; ctx.lineWidth = d;
    ctx.strokeRect(mx + ox * k, my + oy * k, vw * k, vh * k);
    ctx.fillStyle = '#d8402a';
    // in the dark Backrooms the minimap doesn't give the monsters away (only a boss shows)
    const blind = MAPS[curMap] && MAPS[curMap].id === 'backrooms' && !(adminOn && G.seeAll);
    for (const m of G.monsters) { if (blind && !m.boss) continue; const s = m.boss ? 4 : 2; ctx.fillRect(mx + m.x * k - s / 2 * d, my + m.y * k - s / 2 * d, s * d, s * d); }
    for (const b of G.books) {
      ctx.fillStyle = OUTLINE; ctx.fillRect(mx + b.x * k - 2.5 * d, my + b.y * k - 2.5 * d, 5 * d, 5 * d);
      ctx.fillStyle = BOOK_BY[b.kind].col; ctx.fillRect(mx + b.x * k - 1.5 * d, my + b.y * k - 1.5 * d, 3 * d, 3 * d);
    }
    for (const c of G.chests) {
      if (c.open) continue;
      ctx.fillStyle = OUTLINE; ctx.fillRect(mx + c.x * k - 3 * d, my + c.y * k - 3 * d, 6 * d, 6 * d);
      ctx.fillStyle = c.golden ? '#fff2a0' : '#ffc93c'; ctx.fillRect(mx + c.x * k - 2 * d, my + c.y * k - 2 * d, 4 * d, 4 * d);
    }
    ctx.fillStyle = '#fff2cf'; ctx.fillRect(mx + P.x * k - 2 * d, my + P.y * k - 2 * d, 4 * d, 4 * d);
    ctx.strokeStyle = '#2a1406'; ctx.strokeRect(mx + P.x * k - 2 * d, my + P.y * k - 2 * d, 4 * d, 4 * d);
  }

