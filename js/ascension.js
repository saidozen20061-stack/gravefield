  // ================= the Ascension screen: the world fades to black and the constellation wakes up =================
  const ASC_FX_TXT = { dmg: '% damage', rate: '% attack rate', hp: '% max health', armor: '% armor', speed: '% move speed', crit: '% crit chance',
    critdmg: '% crit damage', range: '% range', cdr: '% faster Q and E', leech: '% max health healed per kill', minion: '% minion damage',
    gold: '% gold', xp: '% XP', magnet: '% pickup reach', regen: '% health regen per second', pierce: ' extra pierce' };
  const ascFxText = (fx, m) => Object.entries(fx).map(([k, v]) => k === 'undying' ? 'Once per stage, cheat death and rise again at half health' : `+${+(v * m).toFixed(2)}${ASC_FX_TXT[k]}`).join(', ');
  const ASCV = { dark: false, closing: false, t0: 0, last: 0, raf: 0, w: 0, h: 0, dpr: 1, cx: 0, cy: 0, ocx: 0, ocy: 0, u: 40, parts: [], waves: [], burst: [], hover: null, mx: -1, my: -1, unravel: 0 };
  // fixed per-node decoration: the dendrites that make each node look like a neuron
  const ascSeed = s => { let v = 7; for (const c of s) v = (v * 31 + c.charCodeAt(0)) | 0; return () => ((v = (v * 1103515245 + 12345) | 0) >>> 0) / 4294967296; };
  for (const n of ASC) {
    const r = ascSeed(n.id);
    n.den = Array.from({ length: n.core ? 9 : 3 + Math.floor(r() * 3) }, () => ({ a: r() * Math.PI * 2, l: 0.22 + r() * 0.35, b: (r() - 0.5) * 0.9 }));
    n.ph = r() * 4; n.shake = 0;
  }
  const ASC_EDGES = [];
  for (const n of ASC) for (const id of n.req) { const r = ascSeed(id + n.id); ASC_EDGES.push({ a: ASC_BY[id], b: n, bend: (r() - 0.5) * 0.45, ph: r() * 3 }); }
  const ascReveal = n => 1.5 + Math.hypot(n.x, n.y) * 0.22; // seconds after opening: the core first, then outward
  const ascR = n => Math.max(6, ASCV.u * (n.core ? 0.3 : n.key ? 0.22 : n.bridge ? 0.13 : 0.15));
  const ascXY = n => ({ x: ASCV.ocx + n.x * ASCV.u + Math.sin(performance.now() / 16) * 3 * n.shake, y: ASCV.ocy + n.y * ASCV.u });
  const ascPart = any => ({ x: Math.random() * ASCV.w, y: any ? Math.random() * ASCV.h : ASCV.h + 6, vy: -(3 + Math.random() * 12), sw: Math.random() * 6.28,
    r: Math.random() < 0.08 ? 1.4 + Math.random() * 1.6 : 0.5 + Math.random() * 0.9, a: 0.2 + Math.random() * 0.7, tw: 0.5 + Math.random() * 2.5, z: 0.3 + Math.random() });
  function ascResize() {
    const c = $('ascCv'), V = ASCV;
    V.w = innerWidth; V.h = innerHeight; V.dpr = Math.min(2, devicePixelRatio || 1);
    c.width = Math.round(V.w * V.dpr); c.height = Math.round(V.h * V.dpr);
    V.u = Math.max(16, Math.min(V.w - 40, V.h - 220) / 13); V.cx = V.w / 2; V.cy = V.h / 2 + 10;
    V.parts = []; for (let i = 0; i < Math.round(V.w * V.h / 6500); i++) V.parts.push(ascPart(true));
  }
  function ascSub() {
    const left = ascPts() - ascSpent(), next = (Math.floor(bestOf(S) / 5) + 1) * 5;
    $('ascSub').innerHTML = `<b>${left}</b> point${left === 1 ? '' : 's'} to spend · next point at stage ${next}`;
  }
  function ascShape(x, n, px, py, R) {
    if (n.key) { const k = R * 1.3; x.moveTo(px, py - k); x.lineTo(px + k, py); x.lineTo(px, py + k); x.lineTo(px - k, py); x.closePath(); }
    else x.arc(px, py, R, 0, Math.PI * 2);
  }
  function ascDraw(now) {
    const V = ASCV, c = $('ascCv'), x = c.getContext('2d'), t = (now - V.t0) / 1000, u = V.u, dt = Math.min(0.05, (now - V.last) / 1000);
    V.last = now; V.dark = !V.closing && t > 2.6;
    const fade = Math.min(1, t / 2.4);
    x.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); x.setLineDash([]); x.shadowBlur = 0; x.lineCap = 'round';
    x.fillStyle = '#000'; x.fillRect(0, 0, V.w, V.h);
    // the pointer tilts the whole constellation a little
    const pr = V.mx >= 0 ? (V.mx - V.w / 2) / V.w : 0, pq = V.my >= 0 ? (V.my - V.h / 2) / V.h : 0;
    const cx = V.ocx = V.cx - pr * 12, cy = V.ocy = V.cy - pq * 12;
    const glow = x.createRadialGradient(cx, cy, 0, cx, cy, u * 7);
    glow.addColorStop(0, `rgba(255,255,255,${(0.07 + 0.025 * Math.sin(t * 0.7)) * fade})`); glow.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = glow; x.fillRect(0, 0, V.w, V.h);
    // white dust drifting up through the dark
    for (const p of V.parts) {
      p.y += p.vy * p.z * dt; p.x += Math.sin(t * 0.4 + p.sw) * 5 * dt;
      if (p.y < -6) Object.assign(p, ascPart(false));
      const a = p.a * (0.5 + 0.5 * Math.sin(t * p.tw + p.sw)) * fade, px = p.x - pr * 30 * p.z, py = p.y - pq * 30 * p.z;
      x.fillStyle = `rgba(255,255,255,${a})`; x.beginPath(); x.arc(px, py, p.r, 0, Math.PI * 2); x.fill();
      if (p.r > 1.4) { x.fillStyle = `rgba(255,255,255,${a * 0.08})`; x.beginPath(); x.arc(px, py, p.r * 5, 0, Math.PI * 2); x.fill(); }
    }
    const ring = Math.min(1, Math.max(0, (t - 1.1) / 2));
    // slow turning rings, and a vast faint hexagram behind it all
    x.lineWidth = 1;
    [1.15, 2.2, 3.25, 4.3, 5.45].forEach((r, i) => {
      x.setLineDash([2, 9]); x.lineDashOffset = t * (i % 2 ? 5 : -5);
      x.strokeStyle = `rgba(255,255,255,${0.06 * ring})`; x.beginPath(); x.arc(cx, cy, r * u, 0, Math.PI * 2); x.stroke();
    });
    x.setLineDash([]);
    x.strokeStyle = `rgba(255,255,255,${0.04 * ring})`;
    for (let k = 0; k < 2; k++) {
      x.beginPath();
      for (let i = 0; i <= 3; i++) { const a = t * 0.015 + k * Math.PI / 3 + i * Math.PI * 2 / 3 - Math.PI / 2; x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * u * 6.2, cy + Math.sin(a) * u * 6.2); }
      x.stroke();
    }
    x.font = `400 ${Math.max(10, Math.round(u * 0.26))}px Cinzel, Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    try { x.letterSpacing = '5px'; } catch (e) {}
    for (const b of ASC_BRANCHES) {
      const p = ascPol(b.a, 6.35), lit = ascRank(b.id + 0) > 0;
      x.fillStyle = `rgba(255,255,255,${(lit ? 0.6 : 0.28) * ring})`; x.fillText(b.name.toUpperCase(), cx + p.x * u, cy + p.y * u);
    }
    try { x.letterSpacing = '0px'; } catch (e) {}
    // threads: dark until a side is lit, dashed and flowing when they can be followed, glowing with signals once both ends are awake
    for (const e of ASC_EDGES) {
      const ra = Math.min(1, Math.max(0, (t - ascReveal(e.b)) / 0.8));
      if (ra <= 0) continue;
      const A = ascXY(e.a), B = ascXY(e.b), la = ascRank(e.a.id) > 0, lb = ascRank(e.b.id) > 0;
      const mx = (A.x + B.x) / 2 - (B.y - A.y) * e.bend, my = (A.y + B.y) / 2 + (B.x - A.x) * e.bend;
      x.beginPath(); x.moveTo(A.x, A.y); x.quadraticCurveTo(mx, my, B.x, B.y);
      if (la && lb) { x.shadowColor = '#fff'; x.shadowBlur = 10; x.strokeStyle = `rgba(255,255,255,${0.62 * ra})`; x.lineWidth = 1.6; }
      else if (la) { x.strokeStyle = `rgba(255,255,255,${0.3 * ra})`; x.lineWidth = 1; x.setLineDash([3, 6]); x.lineDashOffset = -t * 16; }
      else { x.strokeStyle = `rgba(255,255,255,${0.08 * ra})`; x.lineWidth = 1; }
      x.stroke(); x.setLineDash([]); x.shadowBlur = 0;
      if (la && lb) {
        const p = (t * 0.45 + e.ph) % 1.7;
        if (p < 1) {
          const q = 1 - p, sx = q * q * A.x + 2 * q * p * mx + p * p * B.x, sy = q * q * A.y + 2 * q * p * my + p * p * B.y;
          x.shadowColor = '#fff'; x.shadowBlur = 14; x.fillStyle = '#fff'; x.beginPath(); x.arc(sx, sy, 2.2, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
        }
      }
    }
    // the nodes
    for (const n of ASC) {
      const ra = Math.min(1, Math.max(0, (t - ascReveal(n)) / 0.9));
      if (ra <= 0) continue;
      n.shake = Math.max(0, n.shake - dt);
      const P0 = ascXY(n), rk = ascRank(n.id), lit = rk > 0, open = ascOpen(n) && rk < n.max, R = ascR(n) * (V.hover === n ? 1.18 : 1) * (0.6 + 0.4 * ra);
      x.strokeStyle = `rgba(255,255,255,${(lit ? 0.38 : 0.09) * ra})`; x.lineWidth = 1;
      for (const d of n.den) {
        const l = d.l * u, c0 = Math.cos(d.a), s0 = Math.sin(d.a);
        x.beginPath(); x.moveTo(P0.x + c0 * R, P0.y + s0 * R);
        x.quadraticCurveTo(P0.x + Math.cos(d.a + d.b) * (R + l * 0.6), P0.y + Math.sin(d.a + d.b) * (R + l * 0.6), P0.x + c0 * (R + l), P0.y + s0 * (R + l)); x.stroke();
      }
      // echoes: an awake node keeps sending rings out into the dark
      if (lit) for (let k = 0; k < 2; k++) {
        const p = ((t + n.ph) * 0.32 + k * 0.5) % 1;
        x.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.35 * ra})`; x.beginPath(); x.arc(P0.x, P0.y, R + p * u * 0.9, 0, Math.PI * 2); x.stroke();
      } else if (open) {
        const b = 0.5 + 0.5 * Math.sin(t * 2.4 + n.ph);
        x.strokeStyle = `rgba(255,255,255,${(0.12 + 0.2 * b) * ra})`; x.beginPath(); x.arc(P0.x, P0.y, R + 3 + b * 3, 0, Math.PI * 2); x.stroke();
      }
      x.beginPath(); ascShape(x, n, P0.x, P0.y, R);
      if (lit) {
        x.shadowColor = '#fff'; x.shadowBlur = 22 + 6 * Math.sin(t * 2 + n.ph);
        x.fillStyle = `rgba(255,255,255,${(0.55 + 0.45 * rk / n.max) * ra})`; x.fill(); x.shadowBlur = 0;
        if (n.core) { x.fillStyle = '#000'; x.beginPath(); x.ellipse(P0.x, P0.y, R * 0.26, R * 0.66 * (0.12 + 0.88 * Math.pow(Math.abs(Math.sin(t * 0.25)), 0.15)), 0, 0, Math.PI * 2); x.fill(); }
      } else {
        x.fillStyle = '#000'; x.fill();
        x.strokeStyle = `rgba(255,255,255,${(open ? 0.8 : 0.22) * ra})`; x.lineWidth = open ? 1.5 : 1; x.stroke();
      }
      if (n.key || n.core) { x.strokeStyle = `rgba(255,255,255,${(lit ? 0.6 : 0.2) * ra})`; x.lineWidth = 1; x.beginPath(); x.arc(P0.x, P0.y, R * (n.key ? 1.3 : 1) + 6, 0, Math.PI * 2); x.stroke(); }
      if (n.max > 1) for (let i = 0; i < n.max; i++) {
        const seg = Math.PI * 2 / n.max, a0 = -Math.PI / 2 + i * seg + 0.18;
        x.strokeStyle = `rgba(255,255,255,${(i < rk ? 0.95 : 0.16) * ra})`; x.lineWidth = 2; x.beginPath(); x.arc(P0.x, P0.y, R + 6, a0, a0 + seg - 0.36); x.stroke();
      }
    }
    // shockwaves and sparks from a node waking
    for (const w of V.waves) {
      w.t += dt; const p = w.t / 1.5, P0 = ascXY(w.n);
      x.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.8})`; x.lineWidth = 2.5 * (1 - p) + 0.5; x.beginPath(); x.arc(P0.x, P0.y, p * u * (w.big ? 9 : 3.2), 0, Math.PI * 2); x.stroke();
    }
    V.waves = V.waves.filter(w => w.t < 1.5);
    for (const s of V.burst) {
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - dt * 2.2; s.vy *= 1 - dt * 2.2;
      x.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - s.t / s.life)})`; x.fillRect(s.x - 1, s.y - 1, 2, 2);
    }
    V.burst = V.burst.filter(s => s.t < s.life);
  }
  function ascLoop(now) { if (!G.ascend) return; ascDraw(now); ASCV.raf = requestAnimationFrame(ascLoop); }
  function ascSound(ok) {
    if (ok) { tone('as1', 110, 1.6, 'sine', 0.08, -10, 0); tone('as2', 164.8, 1.4, 'sine', 0.05, 0, 0); setTimeout(() => tone('as3', 1760, 0.9, 'sine', 0.02, -200, 0), 80); }
    else tone('asx', 70, 0.25, 'triangle', 0.05, -20, 0);
  }
  function ascWake(n, big) {
    const P0 = ascXY(n);
    ASCV.waves.push({ n, t: 0, big });
    for (let i = 0; i < (big ? 120 : 46); i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * (big ? 420 : 170);
      ASCV.burst.push({ x: P0.x, y: P0.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 0.7 + Math.random() * 1 });
    }
  }
  function ascBuy(n) {
    const rk = ascRank(n.id);
    if (rk >= n.max || !ascOpen(n) || ascPts() - ascSpent() < n.cost) { ascSound(false); n.shake = 0.35; return; }
    S.asc = Object.assign({}, S.asc, { [n.id]: rk + 1 });
    ascWake(n, n.key || n.core); ascSound(true);
    ST = stats(); save(); ascSub(); ascTip(n);
  }
  function ascTip(n) {
    const tip = $('ascTip');
    if (!n) { tip.hidden = true; return; }
    const rk = ascRank(n.id), left = ascPts() - ascSpent(), pts = c => `${c} point${c > 1 ? 's' : ''}`;
    const br = n.core ? 'The core' : n.bridge ? `${ASC_BRANCHES[n.br].name} · ${ASC_BRANCHES[(n.br + 1) % 6].name}` : ASC_BRANCHES[n.br].name;
    const st = rk >= n.max ? '<em>Fully awake</em>'
      : !ascOpen(n) ? '<em class="no">Wake a connected node first</em>'
      : left < n.cost ? `<em class="no">Needs ${pts(n.cost)}. You earn 1 for every 5 stages</em>`
      : `<em>Click to awaken · ${pts(n.cost)}</em>`;
    tip.innerHTML = `<b>${n.name}</b><small>${br}${n.key ? ' · keystone' : ''} · ${rk}/${n.max}</small>${ascFxText(n.fx, 1)}${n.max > 1 ? ' per rank' : ''}`
      + `${rk && n.max > 1 ? `<br>Now ${ascFxText(n.fx, rk)}` : ''}${st}`;
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(innerWidth - w - 8, Math.max(8, ASCV.mx + 18)) + 'px';
    tip.style.top = Math.min(innerHeight - h - 8, Math.max(8, ASCV.my + 18)) + 'px';
  }
  function ascHit(mx, my) {
    const t = (performance.now() - ASCV.t0) / 1000;
    let best = null, bd = Infinity;
    for (const n of ASC) {
      if (t < ascReveal(n)) continue;
      const p = ascXY(n), d = Math.hypot(p.x - mx, p.y - my);
      if (d < ascR(n) + 10 && d < bd) { best = n; bd = d; }
    }
    return best;
  }
  function openAscend() {
    if (G.ascend || G.menu || G.options || G.choosing || G.hudEdit || G.runOver || S.daily) return;
    G.ascend = true; G.aim.down = false; keys.clear();
    const ov = $('ascOv'), un = $('ascUnravel');
    ov.hidden = false; ov.classList.remove('closing');
    Object.assign(ASCV, { t0: performance.now(), last: performance.now(), dark: false, closing: false, hover: null, waves: [], burst: [], unravel: 0 });
    un.textContent = 'Unravel'; un.classList.remove('warn');
    ascResize(); ascSub();
    $('app').classList.add('ascending');
    void ov.offsetWidth; ov.classList.add('on');
    tone('asOpen', 55, 3, 'sine', 0.09, 25, 0);
    cancelAnimationFrame(ASCV.raf); ASCV.raf = requestAnimationFrame(ascLoop);
  }
  function closeAscend() {
    if (!G.ascend || ASCV.closing) return;
    const ov = $('ascOv');
    ASCV.closing = true; ASCV.dark = false; $('ascTip').hidden = true;
    ov.classList.add('closing'); ov.classList.remove('on'); $('app').classList.remove('ascending');
    setTimeout(() => {
      ov.hidden = true; ov.classList.remove('closing'); cancelAnimationFrame(ASCV.raf);
      ASCV.closing = false; G.ascend = false; G.aim.down = false; keys.clear(); hudTick(); focusGame();
    }, 1100);
  }
  $('ascBtn').addEventListener('click', openAscend);
  $('ascBack').addEventListener('click', closeAscend);
  $('ascUnravel').addEventListener('click', () => {
    const un = $('ascUnravel');
    if (!ascSpent()) return;
    if (performance.now() - ASCV.unravel > 3000) { ASCV.unravel = performance.now(); un.textContent = 'Click again to unravel all'; un.classList.add('warn'); return; }
    S.asc = {}; ASCV.unravel = 0; un.textContent = 'Unravel'; un.classList.remove('warn');
    ascWake(ASC_BY.core, true); ascSound(false); ST = stats(); save(); ascSub();
  });
  const ascCv = $('ascCv');
  ascCv.addEventListener('pointermove', e => {
    ASCV.mx = e.clientX; ASCV.my = e.clientY;
    const n = ascHit(e.clientX, e.clientY);
    if (n !== ASCV.hover) { ASCV.hover = n; ascCv.style.cursor = n ? 'pointer' : 'default'; }
    ascTip(n);
  });
  ascCv.addEventListener('pointerleave', () => { ASCV.hover = null; ascTip(null); });
  ascCv.addEventListener('click', e => {
    if (ASCV.closing) return;
    ASCV.mx = e.clientX; ASCV.my = e.clientY;
    const n = ascHit(e.clientX, e.clientY);
    ASCV.hover = n;
    if (n) ascBuy(n); else ascTip(null);
  });
  addEventListener('resize', () => { if (G.ascend) ascResize(); });

  function focusGame() { try { window.focus(); cv.focus({ preventScroll: true }); } catch (e) {} }
  cv.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') focusGame(); });
  document.addEventListener('pointerup', e => { if (!G.menu && !G.options && e.target.closest && !e.target.closest('input')) setTimeout(focusGame, 0); });

  const local = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width }; };
  cv.addEventListener('pointerdown', e => {
    const p = local(e);
    if (e.pointerType === 'touch' && !G.joy && p.x < p.w * 0.45) {
      G.joy = { id: e.pointerId, bx: p.x, by: p.y, vx: 0, vy: 0 };
    } else if (e.pointerType !== 'mouse' || e.button === 0) {
      G.aim = { has: true, sx: p.x, sy: p.y, down: !G.paused && !G.choosing, id: e.pointerId };
    }
    cv.setPointerCapture(e.pointerId);
    focusGame();
  });
  cv.addEventListener('pointermove', e => {
    const p = local(e);
    if (G.joy && e.pointerId === G.joy.id) {
      let dx = (p.x - G.joy.bx) / 44, dy = (p.y - G.joy.by) / 44;
      const l = Math.hypot(dx, dy);
      if (l > 1) { dx /= l; dy /= l; }
      G.joy.vx = dx; G.joy.vy = dy;
      return;
    }
    if (e.pointerType === 'mouse' || e.pointerId === G.aim.id) { G.aim.has = true; G.aim.sx = p.x; G.aim.sy = p.y; }
  });
  const endPtr = e => {
    if (G.joy && e.pointerId === G.joy.id) G.joy = null;
    if (e.pointerId === G.aim.id) { G.aim.down = false; if (e.pointerType === 'touch') G.aim.has = false; }
  };
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', endPtr);
  cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !G.aim.down) G.aim.has = false; });
  cv.addEventListener('contextmenu', e => e.preventDefault());

