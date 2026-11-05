  // ================= main menu =================
  const mcv = $('menuCv'), mctx = mcv.getContext('2d');
  // a ring of monsters closing in on the hero, in the chapel courtyard
  const MENU_MOBS = ['skeleton', 'zombie', 'slime', 'ghost', 'cyclops', 'bat', 'skeleton', 'zombie', 'slime', 'bat', 'ghost', 'skeleton', 'zombie', 'cyclops']
    .map((type, i, arr) => ({ type, a: (i / arr.length) * Math.PI * 2 + 0.2, far: type === 'cyclops' ? 1.3 : type === 'bat' ? 0.85 : 1, ph: i * 1.7 }));
  // menu key art: the pixel scene, then dusk grading, candlelight, fog, god rays, fireflies, falling leaves, bats and lightning on top
  const MS = { last: 0, loop: -1, arrows: [], parts: [], flash: MENU_MOBS.map(() => 0), bolt: 0, nextBolt: 5 };
  const mr = mulberry(7);
  const FIREFLIES = Array.from({ length: 36 }, () => ({ x: mr(), y: 0.25 + mr() * 0.7, s: 0.4 + mr() * 0.8, p: mr() * 6.28 }));
  const LEAVES = Array.from({ length: 22 }, () => ({ x: mr(), y: mr(), s: 0.5 + mr(), p: mr() * 6.28, c: ['#d9702a', '#b8462a', '#e8a33a', '#8a5a2b'][mr() * 4 | 0] }));
  const FOG = Array.from({ length: 7 }, (_, i) => ({ x: mr(), y: 0.3 + mr() * 0.6, s: 0.6 + mr() * 0.8, r: 0.25 + mr() * 0.2, i }));
  const EYES = { skeleton: '255,70,40', zombie: '255,60,60', cyclops: '255,210,80', ghost: '140,190,255', bat: '255,60,60' };
  // the menu scene always plays out on the grass of Chapel Field, whichever map the save is on
  function renderMenu(t) {
    const back = curMap;
    if (back !== 0) loadMap(0);
    drawMenuScene(t);
    if (back !== 0) loadMap(back);
  }
  function drawMenuScene(t) {
    const dt = MS.last ? Math.min(0.05, Math.max(0, t - MS.last)) : 0; MS.last = t;
    const r = mcv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (mcv.width !== W || mcv.height !== H) { mcv.width = W; mcv.height = H; }
    const z = Math.max(2, Math.round(Math.min(r.width / 380, r.height / 300) * dpr)), vw = W / z, vh = H / z;
    const hx = SPAWN.x, hy = SPAWN.y, rx = 62, ry = 40;
    // a slow cinematic drift
    const camX = hx + Math.sin(t * 0.13) * 8, camY = hy - 10 + Math.sin(t * 0.09) * 4;
    const ox = Math.round((camX - vw / 2) * z) / z, oy = Math.round((camY - vh * 0.4) * z) / z;
    const toS = (x, y) => [(x - ox) * z, (y - oy) * z];
    mctx.globalCompositeOperation = 'source-over'; mctx.globalAlpha = 1;
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.fillStyle = '#1d2b12'; mctx.fillRect(0, 0, W, H);
    mctx.setTransform(z, 0, 0, z, -ox * z, -oy * z); mctx.imageSmoothingEnabled = false;
    mctx.drawImage(ground, 0, 0);

    // the ring of monsters
    const n = MENU_MOBS.length;
    const mobs = MENU_MOBS.map((mb, i) => {
      const d = MON[mb.type], push = 1 + 0.07 * Math.sin(t * 1.4 + mb.ph), fl = MS.flash[i] = Math.max(0, MS.flash[i] - dt);
      const kb = fl > 0 ? 1 + fl * 0.4 : 1;
      const x = hx + Math.cos(mb.a) * rx * mb.far * push * kb, y = hy + Math.sin(mb.a) * ry * mb.far * push * kb;
      const lunge = Math.sin(t * 1.1 + mb.ph * 2.3) > 0.94;
      let spr = lunge ? d.atk : d.walk[Math.floor(t * (mb.type === 'bat' ? 12 : mb.type === 'ghost' ? 3 : 5) + mb.ph) % d.walk.length];
      if (!lunge && d.blink && ((t + mb.ph) % 3.3) < 0.13) spr = d.blink;
      let lift = 0, sx = 1, sy = 1;
      if (mb.type === 'bat') lift = 9 + Math.sin(t * 7 + mb.ph) * 2;
      else if (mb.type === 'ghost') lift = 4 + Math.sin(t * 2.5 + mb.ph) * 2;
      else if (mb.type === 'slime') { const k = Math.sin(t * 7 + mb.ph); sy = 1 + k * 0.14; sx = 1 - k * 0.1; lift = k > 0.6 ? (k - 0.6) * 6 : 0; }
      else lift = Math.floor(t * 5 + mb.ph) % 2;
      return { type: mb.type, spr, x, y, lift, sx, sy, flash: fl > 0.05, flip: x > hx, scale: mb.type === 'cyclops' ? 1.15 : 1, alpha: d.alpha || 1 };
    });
    const mid = m => ({ x: m.x, y: m.y - m.lift - m.spr.h * m.scale * 0.5 });

    // the hero tracks one attacker, looses an arrow, turns to the next
    const u = t / 1.8, loop = Math.floor(u), f = u - loop, sm = f < 0.75 ? 0 : (k => k * k * (3 - 2 * k))((f - 0.75) / 0.25);
    const ti = (loop * 3) % n, ang = m => { const c = mid(m); return Math.atan2(c.y - (hy - 8), c.x - hx); };
    const a0 = ang(mobs[ti]), a1 = ang(mobs[((loop + 1) * 3) % n]);
    const aim = a0 + ((((a1 - a0) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI) * sm;
    if (f >= 0.75 && MS.loop !== loop) {
      if (MS.loop !== -1) MS.arrows.push({ x: hx + Math.cos(aim) * 9, y: hy - 8 + Math.sin(aim) * 9, a: aim, i: ti, t: 0 });
      MS.loop = loop;
    }
    for (const ar of MS.arrows) {
      ar.t += dt; ar.x += Math.cos(ar.a) * 260 * dt; ar.y += Math.sin(ar.a) * 260 * dt;
      const c = mid(mobs[ar.i]);
      if (Math.hypot(c.x - ar.x, c.y - ar.y) < 6 || ar.t > 0.6) {
        ar.done = true; MS.flash[ar.i] = 0.25;
        for (let k = 0; k < 9; k++) MS.parts.push({ x: c.x, y: c.y, vx: Math.cos(ar.a) * 30 + rand(-40, 40), vy: rand(-60, -10), t: rand(0.3, 0.6), c: k % 3 ? '#fff2cf' : '#ffb347' });
      }
    }
    MS.arrows = MS.arrows.filter(a => !a.done);
    for (const p of MS.parts) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; }
    MS.parts = MS.parts.filter(p => p.t > 0);

    const ents = structures.filter(s => s.x > ox - 60 && s.x < ox + vw + 60 && s.y > oy - 10 && s.y < oy + vh + 130).map(s => ({ y: s.y, s }));
    for (const m of mobs) ents.push({ y: m.y, mob: m });
    ents.push({ y: hy, hero: true });
    ents.sort((a, b) => a.y - b.y);

    mctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (const e of ents) {
      if (e.s) continue;
      const x = e.hero ? hx : e.mob.x, w = e.hero ? 5 : e.mob.spr.w * e.mob.scale * 0.3 * (1 - e.mob.lift * 0.03);
      mctx.beginPath(); mctx.ellipse(x, e.y, w, w * 0.4 + 0.5, 0, 0, Math.PI * 2); mctx.fill();
    }

    const saved = { x: P.x, y: P.y, aim: P.aim, dir: P.dir, flip: P.flip, draw: P.draw, hs: P.hs, moving: P.moving, recoil: P.recoil, flashT: G.flashT };
    P.x = hx; P.y = hy; P.moving = false; P.aim = aim;
    faceFrom(aim); P.hs = Math.cos(aim) >= 0 ? 1 : -1;
    P.draw = f < 0.75 ? Math.min(1, f / 0.6) : 0;
    P.recoil = f >= 0.75 ? Math.max(0, 1 - (f - 0.75) * 10) : 0;
    G.flashT = f >= 0.75 && f < 0.78 ? 0.05 : 0;
    ctx = mctx;
    for (const e of ents) {
      if (e.s) drawSprite(e.s.spr, e.s.x, e.s.y, 1, false, false, 1);
      else if (e.mob) { const m = e.mob; drawSprite(m.spr, m.x, m.y - m.lift, m.scale, m.flip, m.flash, m.alpha, m.sx, m.sy); }
      else {
        const hs = hero(A(S.armor), P.dir, Math.floor(t / 0.7) % 2 ? 'i1' : 'i0', (t % 3.4) < 0.12, false);
        const behind = P.dir === 'up' || Math.sin(P.aim) < -0.5;
        if (behind) drawPlayerWeapon();
        drawSprite(hs, hx, hy + 1, 1, P.dir === 'side' && P.flip, false);
        if (!behind) drawPlayerWeapon();
      }
    }
    for (const ar of MS.arrows) drawShot(mctx, 'arrow', ar.x, ar.y, ar.a);
    for (const p of MS.parts) { mctx.fillStyle = p.c; mctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1); }
    ctx = gameCtx;
    Object.assign(P, saved); G.flashT = saved.flashT;

    // ---- atmosphere, in screen pixels ----
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    const S1 = dpr;
    mctx.globalCompositeOperation = 'multiply';
    mctx.fillStyle = '#8f80b4'; mctx.fillRect(0, 0, W, H);
    const sky = mctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#6d5a9a'); sky.addColorStop(0.5, '#ffffff'); sky.addColorStop(1, '#a08ab0');
    mctx.fillStyle = sky; mctx.fillRect(0, 0, W, H);

    mctx.globalCompositeOperation = 'lighter';
    const glowAt = (sx, sy, rad, rgb, a) => {
      if (a <= 0) return;
      const g = mctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.4, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
      mctx.fillStyle = g; mctx.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
    };
    const glow = (x, y, rad, rgb, a) => { const [sx, sy] = toS(x, y); glowAt(sx, sy, rad * z, rgb, a); };
    const flick = 0.8 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 31 + 1);
    const cx = WORLD.w / 2, cy = WORLD.h / 2;
    glow(cx - 28, cy - 26, 34, '255,150,60', 0.42 * flick);
    glow(cx + 28, cy - 26, 34, '255,150,60', 0.42 * (1.6 - flick));
    glow(cx, cy - 41, 20, '255,90,60', 0.3 * flick);
    glow(cx, cy - 61, 12, '255,210,110', 0.25);
    glow(cx, cy - 12, 22, '255,140,60', 0.18 * flick);
    glow(hx, hy - 8, 70, '255,190,120', 0.2);
    for (const m of mobs) {
      const rgb = EYES[m.type];
      if (!rgb) continue;
      glow(m.x + (m.flip ? -1 : 1), m.y - m.lift - m.spr.h * m.scale * 0.78, 2.6, rgb, 0.5 + 0.2 * Math.sin(t * 4 + m.x));
    }
    for (const ar of MS.arrows) glow(ar.x, ar.y, 6, '255,230,170', 0.35);

    // god rays from the moon, top left
    for (let i = 0; i < 5; i++) {
      mctx.save();
      mctx.translate(W * 0.08, -H * 0.15);
      mctx.rotate(0.55 + i * 0.13 + Math.sin(t * 0.15 + i * 1.7) * 0.04);
      const len = H * 1.7, wid = W * (0.05 + (i % 3) * 0.025);
      const g = mctx.createLinearGradient(0, 0, 0, len);
      const a = 0.06 + 0.035 * Math.sin(t * 0.4 + i * 2.1);
      g.addColorStop(0, `rgba(200,200,255,${a})`); g.addColorStop(0.6, `rgba(255,220,170,${a * 0.4})`); g.addColorStop(1, 'rgba(255,220,170,0)');
      mctx.fillStyle = g;
      mctx.beginPath(); mctx.moveTo(-wid * 0.2, 0); mctx.lineTo(wid * 0.2, 0); mctx.lineTo(wid, len); mctx.lineTo(-wid, len); mctx.fill();
      mctx.restore();
    }

    // drifting ground fog
    mctx.globalCompositeOperation = 'screen';
    for (const fg of FOG) {
      const x = ((fg.x + t * 0.01 * fg.s) % 1.4 - 0.2) * W, y = fg.y * H + Math.sin(t * 0.2 + fg.i) * 10 * S1, rad = fg.r * W;
      mctx.save(); mctx.translate(x, y); mctx.scale(1, 0.35);
      const g = mctx.createRadialGradient(0, 0, 0, 0, 0, rad);
      g.addColorStop(0, 'rgba(190,190,230,0.16)'); g.addColorStop(1, 'rgba(190,190,230,0)');
      mctx.fillStyle = g; mctx.fillRect(-rad, -rad, rad * 2, rad * 2);
      mctx.restore();
    }

    // fireflies
    mctx.globalCompositeOperation = 'lighter';
    for (const ff of FIREFLIES) {
      const x = ff.x * W + Math.sin(t * 0.5 * ff.s + ff.p) * 50 * S1, y = ff.y * H + Math.cos(t * 0.37 * ff.s + ff.p * 1.3) * 35 * S1;
      const b = Math.max(0, Math.sin(t * 1.8 * ff.s + ff.p * 3));
      glowAt(x, y, 9 * S1, '255,230,120', 0.55 * b);
      mctx.fillStyle = `rgba(255,250,200,${b})`; mctx.fillRect(x - S1, y - S1, 2 * S1, 2 * S1);
    }

    // falling leaves
    mctx.globalCompositeOperation = 'source-over';
    for (const lf of LEAVES) {
      const x = ((lf.x * W + t * 26 * lf.s * S1 + Math.sin(t * 1.3 + lf.p) * 18 * S1) % (W + 20)) - 10;
      const y = ((lf.y * H + t * 34 * lf.s * S1) % (H + 20)) - 10, k = Math.round(2 * S1 * (0.8 + lf.s * 0.5));
      mctx.fillStyle = lf.c;
      if (Math.sin(t * 4 + lf.p) > 0) mctx.fillRect(Math.round(x), Math.round(y), k * 2, k); else mctx.fillRect(Math.round(x), Math.round(y), k, k * 2);
    }

    // a flock of bats crossing the sky now and then
    const fp = (t % 11) / 4.5;
    if (fp < 1) {
      const b = MON.bat, k = z * 1.6;
      for (let i = 0; i < 4; i++) {
        const spr = b.walk[Math.floor(t * 12 + i * 2) % b.walk.length];
        const x = -spr.w * k + (fp - i * 0.05) * (W + spr.w * k * 3), y = H * (0.1 + i * 0.045) + Math.sin(fp * 9 + i) * 12 * S1;
        mctx.globalAlpha = 0.8; mctx.drawImage(spr.dark, Math.round(x), Math.round(y), spr.w * k * (1 - i * 0.12), spr.h * k * (1 - i * 0.12));
      }
      mctx.globalAlpha = 1;
    }

    // lightning: a double flicker every so often
    if (t > MS.nextBolt) { MS.bolt = 0.5; MS.nextBolt = t + 9 + Math.random() * 7; }
    if (MS.bolt > 0) {
      MS.bolt -= dt;
      const a = MS.bolt > 0.42 ? 0.45 : MS.bolt > 0.34 ? 0.05 : MS.bolt > 0.26 ? 0.3 : Math.max(0, MS.bolt) * 0.3;
      mctx.fillStyle = `rgba(225,230,255,${a})`; mctx.fillRect(0, 0, W, H);
    }
    mctx.globalCompositeOperation = 'source-over';
  }

  function showMenu(view = 'main') {
    if (G.runOver) { G.slainAt = 0; rise(); } // leaving while dead: the new run is already saved, so just stand up
    G.menu = true; G.aim.down = false; keys.clear();
    $('menu').hidden = false;
    $('mMain').hidden = view !== 'main'; $('mSet').hidden = view !== 'set'; $('mOut').hidden = view !== 'out'; $('mSlots').hidden = view !== 'slots'; $('mClass').hidden = view !== 'class';
    $('mDialog').hidden = view !== 'dialog'; $('mBoard').hidden = view !== 'board'; $('mKeys').hidden = true; rebind = null;
    $('mAch').hidden = view !== 'ach'; $('mDaily').hidden = view !== 'daily'; $('mMapSel').hidden = view !== 'mapsel'; $('mHow').hidden = view !== 'how'; $('mBest').hidden = view !== 'best';
    if (view === 'best') { renderBestiary(); try { $('bestBack').focus({ preventScroll: true }); } catch (e) {} return; }
    if (view === 'how') { renderHow(); try { $('howBack').focus({ preventScroll: true }); } catch (e) {} return; }
    if (view === 'mapsel') { renderMapPicker(); try { $('mapSelBack').focus({ preventScroll: true }); } catch (e) {} return; }
    if (view === 'board') { renderBoard(); postScore(); try { $('boardBack').focus({ preventScroll: true }); } catch (e) {} return; }
    if (view === 'ach') { renderAch(); try { $('achBack').focus({ preventScroll: true }); } catch (e) {} return; }
    if (view === 'daily') { renderDaily(); try { $('dailyGo').focus({ preventScroll: true }); } catch (e) {} return; }
    if (view === 'dialog') { try { $('dlgYes').focus({ preventScroll: true }); } catch (e) {} return; }
    if (view === 'set') syncSettings();
    if (view === 'slots') renderSlots();
    if (view === 'class') renderClassPicker();
    const f = view === 'main' ? $('mPlay') : view === 'set' ? $('setBack') : view === 'slots' ? $('slotBack') : view === 'class' ? $('classBack') : $('mLogin');
    try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  // ---- class picker: shown before any brand-new save starts ----
  let newSlot = null;
  function startNewGame(n) { newSlot = n; showMenu('class'); }
  function renderClassPicker() {
    const grid = $('classGrid');
    grid.innerHTML = CLASS_ORDER.map(id => {
      const C = CLASSES[id], w0 = classItems(WEAPONS, id)[0], a2 = classItems(ARMORS, id)[2], w2 = classItems(WEAPONS, id).find(w => w.skill);
      return `<div class="frame ccard" style="--r:${C.col}">
        <div class="por"><canvas width="16" height="21" data-cls="${id}"></canvas></div>
        <h3>${C.name}<span>${C.role}</span></h3>
        <p>${C.blurb}</p>
        <p>Starts with the <b>${w0.name}</b>.</p>
        <div class="abl"><img src="${armorIconURL(a2)}" alt=""><div><b>Q · Armor skill</b>From your third armor on. The ${a2.name} brings ${a2.skill.name}: ${a2.skill.desc.charAt(0).toLowerCase() + a2.skill.desc.slice(1)}</div></div>
        <div class="abl"><img src="${weaponIconURL(w2)}" alt=""><div><b>E · Weapon skill</b>Every weapon above Common has one. The ${w2.name} brings ${w2.skill.name}: ${w2.skill.desc.charAt(0).toLowerCase() + w2.skill.desc.slice(1)}</div></div>
        <button class="pbtn" type="button" data-pick="${id}">Choose ${C.name}</button>
      </div>`;
    }).join('');
    grid.querySelectorAll('canvas[data-cls]').forEach(c => {
      const id = c.dataset.cls, a0 = classItems(ARMORS, id)[0];
      c.getContext('2d').drawImage(hero(a0, 'down', 'i0', false, true, id).c, 0, 0);
    });
  }
  $('classGrid').addEventListener('click', e => {
    const b = e.target.closest('button[data-pick]');
    if (!b) return;
    newCls = b.dataset.pick;
    showMenu('mapsel');
  });
  $('classBack').addEventListener('click', () => { newSlot = null; showMenu('main'); });

  // ---- map picker: the step after the class; each card shows a peek at the map around its spawn point ----
  let newCls = null;
  const mapPrevCache = {};
  function mapPreview(i) {
    const M = MAPS[i];
    if (mapPrevCache[M.id]) return mapPrevCache[M.id];
    if (M.cover) return (mapPrevCache[M.id] = doorPreview());
    const back = curMap;
    loadMap(i); // builds it on first use; we switch straight back below
    const W = 300, H = 180, k = 1.5, ox = SPAWN.x - W * k / 2, oy = SPAWN.y - H * k / 2 - 20;
    const c = mkCanvas(W, H), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(ground, ox, oy, W * k, H * k, 0, 0, W, H);
    for (const s of structures) {
      const spr = s.base || s.spr, x = (s.x - ox) / k, y = (s.y - oy) / k;
      if (x < -60 || x > W + 60 || y < -10 || y > H + 80) continue;
      g.drawImage(spr.c, Math.round(x - spr.w / k / 2), Math.round(y - spr.h / k), Math.round(spr.w / k), Math.round(spr.h / k));
    }
    if (M.indoor) { g.fillStyle = `rgba(14,8,24,${M.dark * 0.7})`; g.fillRect(0, 0, W, H); }
    loadMap(back);
    return (mapPrevCache[M.id] = c.toDataURL());
  }
  // the Backrooms' disguise: a lone wooden door in a dark stone wall, a thin line of light under it
  function doorPreview() {
    const W = 150, H = 90, c = mkCanvas(W, H), g = c.getContext('2d'), px = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    px('#1c1712', 0, 0, W, H);
    for (let y = 0; y < 72; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < W; x += 16) { // stone blocks
      px((x * 7 + y * 3) % 5 ? '#2a231c' : '#30281f', x + 1, y + 1, 14, 6);
    }
    px('#0f0c09', 0, 72, W, H - 72); // floor
    px('#3a2a1a', 55, 16, 40, 58); // frame
    px('#5c3f22', 59, 20, 32, 52); // door
    for (let x = 62; x < 90; x += 7) px('#4d3419', x, 20, 1, 52); // planks
    px('#3a2a14', 59, 30, 32, 2); px('#3a2a14', 59, 58, 32, 2); // iron bands
    px('#c9a24a', 84, 46, 3, 3); // knob
    px('#e8d98a', 59, 72, 32, 1); // the light under the door
    const gr = g.createLinearGradient(0, 73, 0, 80); gr.addColorStop(0, 'rgba(232,217,138,0.35)'); gr.addColorStop(1, 'rgba(232,217,138,0)');
    g.fillStyle = gr; g.fillRect(52, 73, 46, 7);
    return c.toDataURL();
  }
  function renderMapPicker() {
    const prev = MAPS.map((m, i) => mapPreview(i));
    const cards = [{ id: 'auto', name: 'Auto', col: '#7d7268', tip: 'Start in the Chapel Field and move to a new map every 5 stages.', tag: 'Rotating' }, ...MAPS.map(m => m.cover ? { ...m, ...m.cover, w: 0 } : m)];
    $('mapGrid').innerHTML = cards.map((m, i) => {
      const bg = m.id === 'auto' ? prev.map((u, k) => `url(${u}) ${k * 25}% 50% / 20% 100% no-repeat`).join(',') : `url(${prev[i - 1]}) center / cover no-repeat`;
      return `<div class="frame ccard" style="--r:${m.col}">
        <div class="mprev" style="background:${bg}"></div>
        <h3>${m.name}<span>${m.tag || (m.indoor ? 'Indoor' : 'Outdoor')}</span></h3>
        <p>${m.tip}</p>
        ${m.w ? `<span class="msize">${m.w} x ${m.h}${m.indoor ? ' · dim, lamplit' : ' · takes the biome weather'}</span>` : ''}
        <button class="pbtn" type="button" data-mpick="${m.id}">Play here</button>
      </div>`;
    }).join('');
  }
  $('mapGrid').addEventListener('click', e => {
    const b = e.target.closest('button[data-mpick]');
    if (!b || !newCls) return;
    const d = freshClassSave(newCls);
    if (b.dataset.mpick !== 'auto') d.mapPick = b.dataset.mpick;
    switchSlot(newSlot || slot, d, slotLive);
    newSlot = null; newCls = null;
    syncStage();
    play();
    banner(CLASSES[S.cls].name, 'Hold the mouse to attack. Better armor and weapons unlock Q and E skills.');
  });
  $('mapSelBack').addEventListener('click', () => showMenu('class'));

  function play() {
    if (!slotLive) { startNewGame(slot); return; }
    G.menu = false; $('menu').hidden = true; slotLive = true; save();
    const played = readJSON(CLS_KEY, []);
    if (!played.includes(S.cls)) { played.push(S.cls); try { localStorage.setItem(CLS_KEY, JSON.stringify(played)); } catch (e) {} }
    if (!G.played) { G.played = true; banner('Gravefield', 'Monsters rise from the graves. Hold the mouse to shoot.'); }
    if (S.pending > 0 && !G.choosing) openLevelUp();
    sfx.buy(); focusGame();
  }
  function syncSettings() {
    const tg = (id, on) => { $(id).textContent = on ? 'On' : 'Off'; $(id).setAttribute('aria-pressed', String(on)); };
    tg('setSound', S.sound); tg('setShake', S.shakeOn); tg('setNums', S.nums); tg('setAutoShoot', !!S.autoShoot); $('setVol').value = S.vol;
    const z = S.zoomAdj || 0;
    $('zoomTxt').textContent = z === 0 ? 'Normal' : (z > 0 ? 'Closer +' : 'Farther ') + Math.abs(z);
    $('zoomOut').disabled = z <= ZOOM_MIN; $('zoomIn').disabled = z >= ZOOM_MAX;
    $('soundBtn').setAttribute('aria-pressed', String(S.sound));
    $('hudRow').hidden = !G.options; // the HUD can only be arranged over a running game
    if (!adminArmed) tg('setAdmin', adminOn);
    tg('setMusic', MUSIC.on);
    $('adminBtn').hidden = !adminOn;
  }
  // a small yes/no card over the menu
  let dlg = null;
  function showDialog(d) {
    dlg = d;
    $('dlgTitle').textContent = d.title; $('dlgText').textContent = d.text;
    $('dlgYes').textContent = d.yes.label; $('dlgNo').textContent = d.no.label;
    $('mDialog').classList.toggle('warn', !!d.warn);
    showMenu('dialog');
  }
  $('dlgYes').addEventListener('click', () => dlg && dlg.yes.fn());
  $('dlgNo').addEventListener('click', () => dlg && dlg.no.fn());
  // PLAY always starts a new profile; continuing a run is done from Load Save
  function playButton() {
    const used = [1, 2, 3].filter(n => readSlot(n)), free = [1, 2, 3].find(n => !readSlot(n));
    if (!used.length) { startNewGame(free || slot); return; }
    if (!free) {
      showDialog({ warn: true, title: 'No space for a new run', text: 'All 3 save slots are full. Delete a save in Load Save to make room for a new profile.',
        yes: { label: 'Load Save', fn: () => showMenu('slots') }, no: { label: 'Back', fn: () => showMenu('main') } });
      return;
    }
    showDialog({ title: 'Start a new profile?', text: `This will create a new profile in Slot ${free}. Your other saves stay safe, and you can continue them from Load Save.`,
      yes: { label: 'Yes, new profile', fn: () => startNewGame(free) }, no: { label: 'Cancel', fn: () => showMenu('main') } });
  }
  $('mPlay').addEventListener('click', playButton);
  // ---- leaderboard screen: ranked by best stage, then level, then kills ----
  // three boards: this device's profiles, everyone online, and today's daily challenge
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let boardTab = 'local';
  function boardRows(rows, head, cell) {
    const list = $('boardList');
    list.innerHTML = `<div class="brow bhead">${head.map(h => `<span>${h}</span>`).join('')}</div>` + rows.map((r, i) => {
      const c = cell(r), C = CLASSES[r.cls] || CLASSES.ranger;
      return `<div class="frame brow${c.cur ? ' cur' : ''}${i < 3 ? ' top' + (i + 1) : ''}">
        <span class="rank">${i + 1}</span><span class="bpor"><canvas width="16" height="21" data-cls="${esc(C.id || r.cls)}" data-armor="${esc(r.armor || '')}"></canvas></span>
        <span class="who"><b>${esc(c.name)}</b><small>${esc(c.sub)}</small></span>${c.cols.map(v => `<span>${v}</span>`).join('')}</div>`;
    }).join('');
    list.querySelectorAll('canvas[data-cls]').forEach(cv2 => {
      const cls = CLASSES[cv2.dataset.cls] ? cv2.dataset.cls : 'ranger', ar = ARMORS.find(a => a.id === cv2.dataset.armor) || classItems(ARMORS, cls)[0];
      cv2.getContext('2d').drawImage(hero(ar, 'down', 'i0', false, true, cls).c, 0, 0);
    });
  }
  function boardNote(text) { $('boardNote').hidden = !text; $('boardNote').textContent = text || ''; }
  function renderBoard() {
    if (slotLive) recordRun();
    document.querySelectorAll('[data-board]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.board === boardTab)));
    $('nickIn').value = getNick();
    const list = $('boardList'), empty = t => { list.innerHTML = `<div class="frame bempty">${t}</div>`; };
    if (boardTab === 'local') {
      boardNote('Every profile played on this device, ranked by best stage. Runs marked "admin" used the admin panel.');
      const live = new Map([1, 2, 3].map(n => [readSlot(n), n]).filter(([d]) => d).map(([d, n]) => [d.pid, n]));
      const rows = Object.entries(readBoard()).map(([pid, r]) => Object.assign({ pid }, r))
        .sort((a, b) => b.best - a.best || b.level - a.level || b.kills - a.kills).slice(0, 10);
      if (!rows.length) return empty('No runs yet. Press PLAY to start your first hunt!');
      return boardRows(rows, ['#', '', 'Hunter', 'Best stage', 'Level', 'Kills', 'Time'], r => {
        const n = live.get(r.pid), cur = r.pid === S.pid && slotLive;
        return { cur, name: (CLASSES[r.cls] || CLASSES.ranger).name, sub: (n ? `Slot ${n}${cur ? ' · playing' : ''}` : 'Retired run') + (r.cheated ? ' · admin' : '') + (r.rebirths ? ` · ${r.rebirths}✦` : ''),
          cols: [`<b>${r.best}</b>`, r.level, fmt(r.kills), fmtTime(r.time || 0)] };
      });
    }
    boardNote(netNote());
    const today = todayKey();
    if (NET.status !== 'on') {
      const mine = readJSON(DAILY_KEY, {})[today];
      if (boardTab === 'daily' && mine) return empty(`Your best today: stage ${mine.stage}, ${fmt(mine.kills)} kills.`);
      return empty(NET.status === 'wait' ? 'Connecting…' : 'The online board is not available here.');
    }
    if (boardTab === 'online') {
      const rows = NET.rows.filter(r => r.best > 0).sort((a, b) => b.best - a.best || (b.kills || 0) - (a.kills || 0)).slice(0, 50);
      if (!rows.length) return empty('No online scores yet. Clear a stage to post yours!');
      return boardRows(rows, ['#', '', 'Hunter', 'Best stage', 'Level', 'Kills', 'Time'], r => ({
        cur: r.id === NET.uid, name: r.nick || 'Hunter', sub: (CLASSES[r.cls] || CLASSES.ranger).name + (r.id === NET.uid ? ' · you' : '') + (r.rebirths ? ` · ${r.rebirths}✦` : ''),
        cols: [`<b>${r.best}</b>`, r.level || 1, fmt(r.kills || 0), fmtTime(r.time || 0)] }));
    }
    const rows = NET.rows.filter(r => r.dailyDate === today).sort((a, b) => b.dailyStage - a.dailyStage || b.dailyKills - a.dailyKills);
    if (!rows.length) return empty("Nobody has finished today's daily yet. Be the first!");
    return boardRows(rows.map(r => Object.assign({}, r, { cls: r.dailyCls, armor: '' })), ['#', '', 'Hunter', 'Stage', 'Class', 'Kills', ''], r => ({
      cur: r.id === NET.uid, name: r.nick || 'Hunter', sub: r.id === NET.uid ? 'you' : '',
      cols: [`<b>${r.dailyStage}</b>`, (CLASSES[r.cls] || CLASSES.ranger).name, fmt(r.dailyKills || 0), ''] }));
  }
  document.querySelectorAll('[data-board]').forEach(b => b.addEventListener('click', () => { boardTab = b.dataset.board; renderBoard(); }));
  $('nickIn').addEventListener('change', e => {
    const v = e.target.value.replace(/\s+/g, ' ').trim().slice(0, 16);
    try { localStorage.setItem(NICK_KEY, v); } catch (err) {}
    e.target.value = v; postScore(true);
  });
  $('mBoardBtn').addEventListener('click', () => showMenu('board'));
  $('boardBack').addEventListener('click', () => showMenu('main'));

