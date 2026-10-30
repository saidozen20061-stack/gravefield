
  function dropAt(x, y, kind, v) {
    const a = Math.random() * Math.PI * 2, sp = rand(20, 55);
    G.drops.push({ x, y, kind, v, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, pull: 0 });
    if (G.drops.length > 260) collect(G.drops.shift());
  }
  function collect(d) {
    if (d.kind === 'gold') { S.gold += d.v; sfx.coin(); return; }
    S.xp += d.v; sfx.gem();
    while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; S.pending++; }
    if (S.pending > 0 && !G.choosing) openLevelUp();
  }

  function hurtPlayer(dmg, from, kb = 90) {
    if (P.iframes > 0) return;
    if (S.god || G.buffs.immortal > 0) { G.texts.push({ x: P.x + rand(-3, 3), y: P.y - 22, s: '0', t: 0.4 }); return; }
    const v = dmg * 100 / (100 + ST.def);
    if (G.horde) G.horde.hit = true;
    P.hp -= v; P.hurt = 0.15; G.shake = Math.max(G.shake, 0.12); G.hurtT = 0.4;
    if (from) { const dx = P.x - from.x, dy = P.y - from.y, d = Math.hypot(dx, dy) || 1; P.vx += dx / d * kb; P.vy += dy / d * kb; }
    G.texts.push({ x: P.x + rand(-3, 3), y: P.y - 22, s: '-' + fmt(Math.max(1, v)), hurt: true, t: 0.7 });
    sfx.hurt();
    if (P.hp <= 0) die();
  }

  // what some biome natives leave on you: frost slows, scorpion venom ticks
  function playerFx(m) {
    if (S.god || G.buffs.immortal > 0 || G.dead > 0) return;
    if (m.d.hitFx === 'slow') P.slowT = 1.6;
    if (m.d.hitFx === 'poison') P.poison = { t: 3, dps: m.dmg * 0.25, acc: 0 };
  }
  function updatePlayerFx(dt) {
    P.slowT = Math.max(0, (P.slowT || 0) - dt);
    if (P.slowT > 0 && Math.random() < dt * 10) G.fx.push({ x: P.x + rand(-5, 5), y: P.y - rand(2, 16), vx: 0, vy: 6, t: 0.5, c: '#bfe4ff', s: 1.5, nograv: true });
    const po = P.poison;
    if (po) {
      po.t -= dt; po.acc += dt;
      if (po.acc >= 0.5) { po.acc -= 0.5; poisonTick(po.dps * 0.5); }
      if (Math.random() < dt * 8) G.fx.push({ x: P.x + rand(-4, 4), y: P.y - rand(4, 18), vx: 0, vy: -14, t: 0.45, c: '#6ee07a', s: 1.5, nograv: true });
      if (po.t <= 0) P.poison = null;
    }
    // burning imp footprints
    for (const h of G.hazards) {
      h.t -= dt;
      if (Math.hypot(P.x - h.x, P.y - h.y) < h.r && (G.hazT || 0) <= G.t) { G.hazT = G.t + 0.5; poisonTick(h.dmg, true); }
    }
    G.hazards = G.hazards.filter(h => h.t > 0);
  }
  // damage over time skips the knockback and screen shake of a real hit
  function poisonTick(dmg, fire) {
    if (S.god || G.buffs.immortal > 0) return;
    const v = dmg * 100 / (100 + ST.def);
    P.hp -= v; if (G.horde) G.horde.hit = true; G.hurtT = Math.max(G.hurtT || 0, 0.2);
    G.texts.push({ x: P.x + rand(-3, 3), y: P.y - 22, s: '-' + fmt(Math.max(1, v)), hurt: true, t: 0.5 });
    if (fire) for (let i = 0; i < 3; i++) G.fx.push({ x: P.x + rand(-3, 3), y: P.y - 2, vx: rand(-8, 8), vy: rand(-30, -12), t: 0.35, c: '#ff9a3c', s: 1.5, nograv: true });
    if (P.hp <= 0) die();
  }

  function die() {
    if (G.runOver) return; // already down: lingering poison or fire can't kill you twice
    // Undying (Ascension keystone): once per stage, rise again at half health
    if (ST.undying && !G.undyUsed) {
      G.undyUsed = true; P.hp = ST.maxHp * 0.5; P.iframes = 2; G.whiteT = 0.3; G.shake = Math.max(G.shake, 0.3);
      for (let i = 0; i < 30; i++) { const a = rand(0, Math.PI * 2), s = rand(30, 90); G.fx.push({ x: P.x, y: P.y - 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.8, c: '#ffffff', s: 2, nograv: true }); }
      G.texts.push({ x: P.x, y: P.y - 30, s: 'UNDYING', t: 1.2 });
      sfx.relic(); return;
    }
    // death ends the run: the body stays down until you rise into a fresh one
    P.hp = 0; G.dead = Infinity; G.undyUsed = false; G.runOver = true; G.aim.down = false; keys.clear();
    G.boss = null; G.horde = null; G.choosing = false; $('lvlOv').hidden = true;
    const pts0 = ascPts() - ascSpent();
    const fell = { at: S.stage, stage: S.best, level: S.level, daily: !!S.daily };
    G.slain = fell; G.slainAt = performance.now();
    // the run is reset and saved right away, so closing the tab can't undo a death
    if (!fell.daily) { S.deaths = (S.deaths || 0) + 1; resetRun(); save(); postScore(); }
    $('diedSum').innerHTML = fell.daily
      ? `Your Daily Challenge ends at <b>stage ${fell.stage}</b>.`
      : `You fell on stage ${fell.at}. This run reached <b>stage ${fell.stage}</b> at level ${fell.level}.${pts0 > 0 ? `<br>You have <b>${pts0} Ascension point${pts0 === 1 ? '' : 's'}</b> waiting. Press Ascend.` : ''}`
        + `<small>Gold, levels, gear and library books are lost. Relics, pets and Ascension stay with you.</small>`;
    $('diedBtn').textContent = fell.daily ? 'See results' : 'Rise again';
    $('game').classList.add('slain'); clearBanners();
    const ov = $('diedOv'); ov.hidden = true; void ov.offsetWidth; ov.hidden = false; // restart the fade-in
    tone('died1', 98, 2.6, 'sawtooth', 0.06, -50, 0); setTimeout(() => tone('died2', 65, 3.2, 'sine', 0.1, -20, 0), 900);
  }
  function rise() {
    if (!G.runOver || performance.now() - G.slainAt < 6800) return; // wait until the Rise button has faded in
    const fell = G.slain;
    G.runOver = false; G.dead = 0; G.slain = null;
    $('diedOv').hidden = true; $('game').classList.remove('slain');
    if (fell.daily) { endDaily(); respawn(); return; }
    G.drops = []; G.chests = [];
    ST = stats(); respawn(); P.hp = ST.maxHp;
    syncStage(); renderList();
    banner('A new run begins', 'Every 5 stages you have ever reached gives an Ascension point.');
    focusGame();
  }
  document.getElementById('diedBtn').addEventListener('click', rise); // this runs before $ exists  // ================= chests, power-ups, relics =================
  function spawnChest(x, y, golden) {
    G.chests.push({ x: clamp(x, WORLD.x0 + 10, WORLD.x1 - 10), y: clamp(y, WORLD.y0 + 16, WORLD.y1 - 4), golden, open: false, t: 0, ot: 0 });
    for (let i = 0; i < 10; i++) G.fx.push({ x: x + rand(-6, 6), y: y - 4, vx: rand(-30, 30), vy: rand(-60, -20), t: 0.6, c: golden ? '#fff2a0' : '#ffd84d', s: 2 });
  }
  function spawnChestNear() {
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, d = rand(110, 240);
      const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d * 0.8;
      if (x < WORLD.x0 + 30 || x > WORLD.x1 - 30 || y < WORLD.y0 + 30 || y > WORLD.y1 - 10) continue;
      if (blockedAt(x, y) || blockedAt(x, y - 6) || blockedAt(x + 8, y) || blockedAt(x - 8, y)) continue;
      spawnChest(x, y, false);
      toast({ title: 'A chest appeared', tip: 'Follow the gold arrow at the edge of the screen.', col: '#d9a441', icon: CHEST.closed.c.toDataURL() });
      return;
    }
  }
  function openChest(c) {
    c.open = true; c.ot = 0; sfx.chest(); S.chestsOpened = (S.chestsOpened || 0) + 1;
    const s = S.stage, k = c.golden ? 5 : 1;
    const gold = 30 * goldMulS(s) * ST.goldMul * rand(0.8, 1.3) * k, xp = 25 * xpMulS(s) * ST.xpMul * rand(0.8, 1.3) * k;
    for (let i = 0; i < 8; i++) dropAt(c.x, c.y - 6, 'gold', gold / 8);
    for (let i = 0; i < 6; i++) dropAt(c.x, c.y - 6, 'xp', xp / 6);
    for (let i = 0; i < 24; i++) G.fx.push({ x: c.x + rand(-5, 5), y: c.y - 8, vx: rand(-50, 50), vy: rand(-110, -30), t: rand(0.4, 0.9), c: i % 3 ? '#ffd84d' : '#fff2cf', s: 2 });
    G.fx.push({ ring: true, x: c.x, y: c.y - 4, t: 0.3, max: 26, c: '#ffd84d' });
    G.texts.push({ x: c.x, y: c.y - 22, s: `+${fmt(gold)} gold  +${fmt(xp)} XP`, crit: true, t: 1.3 });
    const lk = 1 + (ST.luck || 0) / 100; // Tomes of Fortune raise every chance below
    if (c.golden || Math.random() < 0.25 * lk) setTimeout(() => grantPower(POWERS[Math.random() * POWERS.length | 0]), 250);
    if (Math.random() < (c.golden ? 0.2 : 0.05) * lk) setTimeout(() => grantRelic(RELICS[Math.random() * RELICS.length | 0]), 600);
    if (Math.random() < (c.golden ? 0.25 : 0.03) * lk) setTimeout(grantPet, 950);
  }
  // ================= pets: a companion that follows you and grows with every kill =================
  const PETS = [
    { id: 'pup', name: 'Loyal Pup', col: '#c08a5a', tip: lv => `Pulls coins and gems in from ${50 + lv * 10}% further away, +${2 * lv}% gold`, spr: sprite([
      '.b....b.', '.bb..bb.', '.bbbbbb.', '.bkbbkb.', '.bbnnbb.', '..bbbb..', '.bbbbbbt', '.b.bb.b.',
    ], { b: '#c08a5a', k: '#2a1406', n: '#4a2207', t: '#a8763f' }) },
    { id: 'owl', name: 'Night Owl', col: '#8a5a2b', fly: true, tip: lv => `Shoots a bolt every 1.2s for ${30 + 5 * lv}% of your damage`, spr: sprite([
      '.o....o.', '.oooooo.', 'oyyooyyo', 'oykooyko', 'oooaaooo', '.ooccoo.', '.oocco..', '..y..y..',
    ], { o: '#8a5a2b', y: '#ffe04a', k: '#2a1406', a: '#f2a03a', c: '#c8a070' }) },
    { id: 'slimey', name: 'Baby Slime', col: '#59c96b', tip: lv => `Heals ${(0.2 + 0.05 * lv).toFixed(2)}% of your max health every second`, spr: sprite([
      '..llll..', '.llllll.', 'lwkllwkl', 'llllllll', '.LLLLLL.',
    ], { l: '#59c96b', L: '#3a9a4c', w: '#ffffff', k: '#1b2a1e' }) },
    { id: 'impy', name: 'Ember Imp', col: '#e5484d', tip: lv => `Burns monsters next to it for ${20 + 3 * lv}% of your damage twice a second`, spr: sprite([
      'r......r', 'rrrrrrrr', 'rykrrykr', 'rrrrrrrr', '.rrkkrr.', '..rrrr..', '.r.rr.r.',
    ], { r: '#e5484d', y: '#ffe04a', k: '#2a0a06' }) },
    { id: 'wisp', name: 'Wisp', col: '#7fd1ff', fly: true, tip: lv => `+${5 + 2 * lv}% XP`, spr: sprite([
      '...cc...', '..cwwc..', '.ckwwkc.', '.cwwwwc.', '..cwwc..', '...cc...', '..c..c..',
    ], { c: '#7fd1ff', w: '#e8f6ff', k: '#1a2a4a' }) },
  ];
  const PET_BY = Object.fromEntries(PETS.map(p => [p.id, p]));
  const PET_MAX = 20;
  const petLv = id => Math.min(PET_MAX, 1 + Math.floor(Math.sqrt(((S.pets || {})[id] || 0) / 8)));
  function grantPet() {
    S.pets = S.pets || {};
    const fresh = PETS.filter(p => S.pets[p.id] == null);
    if (!fresh.length) {
      // every pet found: a treat for the one at your side instead
      if (S.pet) { S.pets[S.pet] += 60; toast({ title: 'Pet treat!', tip: `${PET_BY[S.pet].name} gains a lot of experience.`, col: PET_BY[S.pet].col, icon: PET_BY[S.pet].spr.c.toDataURL() }); }
      return;
    }
    const p = fresh[Math.random() * fresh.length | 0];
    S.pets[p.id] = 0;
    if (!S.pet) { S.pet = p.id; G.pet.x = P.x; G.pet.y = P.y; }
    banner(`A pet joined you: ${p.name}!`, `${p.tip(1)}. Manage pets in the Relics tab.`, 'gold', p.spr.c.toDataURL());
    sfx.relic(); save(); renderList();
  }
  function petKill(m) {
    if (!S.pet || !S.pets) return;
    const lv = petLv(S.pet);
    S.pets[S.pet] = (S.pets[S.pet] || 0) + (m.boss ? 25 : 1);
    if (petLv(S.pet) > lv) toast({ title: `${PET_BY[S.pet].name} reached level ${petLv(S.pet)}`, tip: PET_BY[S.pet].tip(petLv(S.pet)), col: PET_BY[S.pet].col, icon: PET_BY[S.pet].spr.c.toDataURL() });
  }
  function updatePet(dt) {
    const p = S.pet && PET_BY[S.pet], g = G.pet;
    if (!p) return;
    const tx = P.x - (P.hs || 1) * 14, ty = P.y + 3, dx = tx - g.x, dy = ty - g.y, dd = Math.hypot(dx, dy);
    if (dd > 220) { g.x = tx; g.y = ty; }
    else if (dd > 3) { const sp = Math.min(dd * 4, ST.speed * 1.8); g.x += dx / dd * sp * dt; g.y += dy / dd * sp * dt; }
    g.moving = dd > 4;
    if (Math.abs(dx) > 1) g.face = dx > 0 ? 1 : -1;
    g.t += dt; g.cd -= dt;
    const lv = petLv(p.id);
    if (p.id === 'owl' && g.cd <= 0) {
      const t = nearest(g.x, g.y - 10, 150);
      if (t) {
        g.cd = 1.2;
        const a = Math.atan2((t.y - t.hh) - (g.y - 10), t.x - g.x);
        G.shots.push({ x: g.x, y: g.y - 10, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, dmg: ST.dmg * (0.3 + 0.05 * lv), pierce: 0, chain: 0, splash: 0, type: 'magic', life: 1, hit: new Set() });
      }
    }
    if (p.id === 'impy' && g.cd <= 0) {
      g.cd = 0.5;
      for (const m of G.monsters) {
        if (m.dead || m.rise > 0 || Math.hypot(m.x - g.x, m.y - g.y) > 26 + m.r) continue;
        damage(m, ST.dmg * (0.2 + 0.03 * lv), 0, 0);
        G.fx.push({ x: m.x + rand(-3, 3), y: m.y - m.hh, vx: 0, vy: -20, t: 0.35, c: '#ff9a3c', s: 2, nograv: true });
      }
    }
    if (p.id === 'wisp' && Math.random() < dt * 6) G.fx.push({ x: g.x + rand(-3, 3), y: g.y - 10 + rand(-3, 3), vx: 0, vy: -8, t: 0.5, c: '#bff4ff', s: 1, nograv: true });
  }
  function drawPet() {
    const p = S.pet && PET_BY[S.pet], g = G.pet;
    if (!p || G.dead > 0) return;
    const bob = p.fly ? -10 + Math.sin(g.t * 4) * 2 : g.moving ? -Math.abs(Math.sin(g.t * 12)) * 1.5 : 0;
    if (p.id === 'wisp') { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(g.t * 5); ctx.fillStyle = '#7fd1ff'; ctx.beginPath(); ctx.arc(g.x, g.y + bob - 4, 7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    drawSprite(p.spr, g.x, g.y + bob, 1, g.face < 0, false, 1);
  }
  function grantPower(p) {
    discover('power:' + p.id);
    if (p.id === 'nuke') {
      G.whiteT = 0.5; G.shake = Math.max(G.shake, 0.4); sfx.boom();
      for (const m of G.monsters.slice()) if (!m.dead && m.rise <= 0 && Math.hypot(m.x - P.x, m.y - P.y) < 320) damage(m, m.boss ? m.max * 0.2 : m.max * 3, 0, 0);
    } else if (p.id === 'heal') {
      P.hp = ST.maxHp;
      for (let i = 0; i < 18; i++) G.fx.push({ x: P.x + rand(-8, 8), y: P.y - rand(0, 16), vx: rand(-10, 10), vy: rand(-40, -15), t: rand(0.5, 0.9), c: '#6ee07a', s: 2, nograv: true });
    } else {
      G.buffs[p.id] = Math.max(0, G.buffs[p.id] || 0) + p.dur;
      G.buffMax[p.id] = G.buffs[p.id];
      if (p.id === 'magnet') G.vacuum = Math.max(G.vacuum, p.dur);
    }
    G.fx.push({ ring: true, x: P.x, y: P.y - 8, t: 0.3, max: 30, c: p.col });
    toast({ title: p.name + (p.dur ? ` · ${p.dur}s` : ''), tip: p.tip, col: p.col, icon: iconURL('p:' + p.id) });
    sfx.power();
  }
  function grantRelic(r) {
    const before = ST.maxHp;
    S.relics[r.id] = (S.relics[r.id] || 0) + 1;
    S.relicNew = true;
    ST = stats();
    P.hp = Math.min(ST.maxHp, P.hp * ST.maxHp / before);
    save();
    banner(`Relic found: ${r.name}!`, `+${r.per}${r.unit}. Permanent, and it stacks (you have ${S.relics[r.id]}).`, 'gold', iconURL('r:' + r.id));
    sfx.relic();
    renderList();
  }
  // the Flamethrower's flames always reach about this far, whatever weapon you hold
  const FLAME_REACH = 95;
  function fireFlame(a) {
    const h = handPos(a), tip = tipOf('flamer') + 2, sx = h.x + Math.cos(a) * tip, sy = h.y + Math.sin(a) * tip;
    const b = a + rand(-0.3, 0.3), sp = rand(150, 215);
    G.shots.push({ x: sx, y: sy, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, dmg: ST.dmg * 0.45, pierce: 99, chain: 0, splash: 0, type: 'flame', life: 0.38, hit: new Set() });
    P.recoil = Math.max(P.recoil, 0.3); P.draw = 0.6;
    sfx.flame();
  }

  // ================= skills: Q comes from your armor, E from your weapon (starter gear has none) =================
  const abilityOf = key => key === 'q' ? A(S.armor).skill : W(S.weapon).skill;
  function useAbility(key) {
    if (G.dead > 0 || G.paused || G.choosing || G.menu || G.options || G.hudEdit || G.ascend || G.intro) return;
    const ab = abilityOf(key);
    if (!ab || G.cd[key] > 0) return;
    G.cd[key] = ab.cd * (1 - (ST.cdr || 0));
    if (key === 'e') { runSkill(ab); return; }
    if (ab.kind === 'class') classAbility(ab.cid);
    else if (ab.kind !== 'guard') runSkill(ab);
    // defensive extras: power-up buffs and a burst of healing, with a ring of light
    if (ab.buffs) for (const k in ab.buffs) { G.buffs[k] = Math.max(G.buffs[k] || 0, ab.buffs[k]); G.buffMax[k] = G.buffs[k]; }
    if (ab.heal) {
      P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * ab.heal);
      for (let i = 0; i < 16; i++) G.fx.push({ x: P.x + rand(-8, 8), y: P.y - rand(0, 16), vx: rand(-10, 10), vy: rand(-40, -15), t: rand(0.5, 0.9), c: '#6ee07a', s: 2, nograv: true });
    }
    if (ab.kind === 'guard') { G.fx.push({ ring: true, x: P.x, y: P.y - 8, t: 0.35, max: 40, c: '#fff2a0' }); sfx.power(); }
  }
  // the old class abilities, now carried by each class's third armor
  function classAbility(cid) {
    const aw = aimWorld(), D = ST.dmg;
    switch (cid) {
      case 'whirl': G.whirlT = 3; G.whirlTick = 0; sfx.charge(); break;
      case 'rain': G.rains.push({ x: aw.x, y: aw.y, t: 3, acc: 0 }); sfx.shoot('arrow'); break;
      case 'nova':
        G.fx.push({ ring: true, x: P.x, y: P.y - 6, t: 0.3, max: 85, c: '#9fe0ff' }); G.fx.push({ ring: true, x: P.x, y: P.y - 6, t: 0.3, max: 55, c: '#ffffff' });
        for (let i = 0; i < 30; i++) { const a = Math.random() * Math.PI * 2; G.fx.push({ x: P.x, y: P.y - 6, vx: Math.cos(a) * rand(70, 160), vy: Math.sin(a) * rand(70, 160), t: rand(0.3, 0.6), c: i % 2 ? '#bfe8ff' : '#ffffff', s: 2, nograv: true }); }
        for (const m of G.monsters) {
          if (m.dead || m.rise > 0 || Math.hypot(m.x - P.x, m.y - P.y) > 85 + m.r) continue;
          damage(m, D * 2, 0, 0);
          m.stunT = Math.max(m.stunT || 0, m.boss ? 1 : 3); m.iceT = m.stunT;
        }
        sfx.shoot('frost'); G.shake = Math.max(G.shake, 0.08); break;
      case 'vanish':
        G.invisT = 4; P.ambush = true;
        for (let i = 0; i < 18; i++) G.fx.push({ x: P.x + rand(-6, 6), y: P.y - rand(0, 16), vx: rand(-20, 20), vy: rand(-30, -5), t: rand(0.4, 0.8), c: 'rgba(90,74,122,0.8)', s: 3, nograv: true, smoke: true });
        sfx.spit(); break;
      case 'raise': {
        G.minions = G.minions.filter(mn => mn.kind !== 'skel' || mn.lich || mn.extra);
        for (let i = 0; i < Math.max(2, ST.minions); i++) {
          const a = i / ST.minions * Math.PI * 2, x = P.x + Math.cos(a) * 18, y = P.y + Math.sin(a) * 12;
          G.minions.push({ kind: 'skel', x, y, t: 15, cd: 0.4, face: 1, ph: Math.random() * 4, i, rise: 0.4 });
          for (let k = 0; k < 8; k++) G.fx.push({ x: x + rand(-5, 5), y, vx: rand(-15, 15), vy: rand(-40, -10), t: 0.5, c: '#6ee07a', s: 2, nograv: true });
        }
        sfx.boss(); break;
      }
    }
  }
  function updateAbilities(dt) {
    G.cd.q = Math.max(0, G.cd.q - dt); G.cd.e = Math.max(0, G.cd.e - dt);
    G.invisT = Math.max(0, G.invisT - dt);
    G.darkT = Math.max(0, G.darkT - dt);
    // barrage skills: a quick stream of shots along your current aim
    for (const b of G.bursts) {
      b.t -= dt;
      while (b.t <= 0 && b.n > 0) { b.t += b.sk.gap; b.n--; skillShot(b.sk, P.aim + rand(-0.1, 0.1)); P.recoil = 1; G.flashT = 0.05; sfx.shoot(ST.shot); }
    }
    G.bursts = G.bursts.filter(b => b.n > 0);
    if (G.whirlT > 0) {
      G.whirlT -= dt; G.whirlTick -= dt;
      if (G.whirlTick <= 0) {
        G.whirlTick = 0.15;
        const r = (ST.reach || 34) + 8;
        for (const m of G.monsters) {
          if (m.dead || m.rise > 0) continue;
          const dx = m.x - P.x, dy = (m.y - m.hh) - (P.y - 8), d = Math.hypot(dx, dy) || 1;
          if (d < r + m.r) damage(m, ST.dmg * 0.7, dx / d * 120, dy / d * 120);
        }
        G.fx.push({ slash: true, x: P.x, y: P.y - 8, a: G.t * 22, r, arc: Math.PI * 1.6, t: 0.16, c: ST.slashCol || '#ffffff', dir: 1, style: ST.slashStyle });
        sfx.shoot('slash');
      }
    }
    for (const rn of G.rains) {
      rn.t -= dt; rn.acc += dt;
      while (rn.acc > 0.07) {
        rn.acc -= 0.07;
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 48, x = rn.x + Math.cos(a) * d, y = rn.y + Math.sin(a) * d * 0.7;
        G.fx.push({ rainArrow: true, x, y, t: 0.18 });
        for (const m of G.monsters) if (!m.dead && m.rise <= 0 && Math.hypot(m.x - x, (m.y - m.hh * 0.5) - y) < 9 + m.r) damage(m, ST.dmg * 1.2, 0, 40);
      }
    }
    G.rains = G.rains.filter(rn => rn.t > 0);
    // minions: chase the nearest monster near you, hit it, otherwise trot along beside you
    for (const mn of G.minions) {
      mn.t -= dt; mn.cd -= dt; if (mn.rise > 0) { mn.rise -= dt; continue; }
      const golem = mn.kind === 'golem', reach = golem ? 20 : 9, spd = golem ? 55 : 80;
      if (!mn.tgt || mn.tgt.dead || Math.hypot(mn.tgt.x - P.x, mn.tgt.y - P.y) > 230) mn.tgt = nearest(mn.x, mn.y - 6, 200);
      let tx, ty;
      if (mn.tgt) { tx = mn.tgt.x; ty = mn.tgt.y; }
      else { const a = mn.i * 2.1 + G.t * 0.3; tx = P.x + Math.cos(a) * 22; ty = P.y + Math.sin(a) * 14; }
      const dx = tx - mn.x, dy = ty - mn.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 1) mn.face = dx > 0 ? 1 : -1;
      if (mn.tgt && d < reach + mn.tgt.r) {
        if (mn.cd <= 0) {
          mn.cd = golem ? 1 : 0.6; mn.atk = 0.2;
          if (golem) {
            for (const m of G.monsters) if (!m.dead && m.rise <= 0 && Math.hypot(m.x - mn.x, m.y - mn.y) < 30 + m.r) damage(m, ST.dmg * 4 * ST.minionMul, m.x - mn.x, m.y - mn.y);
            G.fx.push({ ring: true, x: mn.x, y: mn.y, t: 0.3, max: 30, c: '#6ee07a' }); G.shake = Math.max(G.shake, 0.08); sfx.thud();
          } else damage(mn.tgt, ST.dmg * 1.1 * ST.minionMul, dx * 4, dy * 4);
        }
      } else if (d > 2) {
        const s = Math.min(spd * (mn.tgt ? 1 : Math.min(1.6, d / 20)), d / dt);
        mn.x += dx / d * s * dt; mn.y += dy / d * s * dt; mn.ph += dt * s / 7;
        pushOut(mn, 4);
      }
      mn.atk = Math.max(0, (mn.atk || 0) - dt);
    }
    G.minions = G.minions.filter(mn => {
      if (mn.t > 0) return true;
      for (let k = 0; k < 8; k++) G.fx.push({ x: mn.x + rand(-5, 5), y: mn.y - rand(0, 12), vx: rand(-10, 10), vy: rand(-30, -10), t: 0.5, c: '#6ee07a', s: 2, nograv: true, smoke: true });
      return false;
    });
  }

  function respawn() {
    G.monsters = []; G.shots = []; G.eshots = []; G.bombs = []; G.buffs = {}; G.minions = []; G.rains = []; G.invisT = 0; G.whirlT = 0; G.zones = []; G.strikes = []; G.bursts = []; G.darkT = 0; G.horde = null;
    P.x = SPAWN.x; P.y = SPAWN.y; P.vx = P.vy = 0; P.hp = ST.maxHp; G.spawnT = 1;
    G.hazards = []; P.poison = null; P.slowT = 0;
  }
  function changeStage(s) {
    S.stage = clamp(s, 1, S.best); S.progress = 0; G.boss = null; G.horde = null; G.hazards = [];
    G.monsters = []; G.shots = []; G.eshots = []; G.bombs = []; G.spawnT = 0.6;
    save(); syncStage();
  }

  // ================= level-up choices =================
  let offer = [];
  // luck from Tomes of Fortune makes the rarer cards more likely: each step up the ladder is weighted by (1 + luck%)
  function rollRarity() {
    const lk = 1 + ((ST && ST.luck) || 0) / 100, ws = RARITY.map((x, i) => x.w * Math.pow(lk, i));
    let r = Math.random() * ws.reduce((s, w) => s + w, 0);
    for (let i = 0; i < RARITY.length; i++) { if ((r -= ws[i]) < 0) return i; }
    return 0;
  }

  // ================= library books: grab one off the floor for a bonus that lasts until you die =================
  const BOOK_KINDS = [
    { id: 'luck', name: 'Tome of Fortune', col: '#6ee07a', dk: '#2a7a3a', v: 10, txt: v => `+${v} luck: rarer level-up cards and better chest loot` },
    { id: 'dmg', name: 'Tome of Fury', col: '#e5484d', dk: '#8a1a1a', v: 5, txt: v => `+${v}% damage` },
    { id: 'rate', name: 'Tome of Haste', col: '#ffc93c', dk: '#a07a20', v: 5, txt: v => `+${v}% fire rate` },
    { id: 'hp', name: 'Tome of Vigor', col: '#4fb6e8', dk: '#1f4a8a', v: 8, txt: v => `+${v}% max health` },
  ];
  const BOOK_BY = {};
  for (const K of BOOK_KINDS) {
    K.spr = paint(12, 14, g => {
      px(g, 1, 1, 10, 12, K.dk); px(g, 2, 1, 9, 11, K.col); px(g, 2, 1, 9, 1, '#ffffff');
      px(g, 2, 11, 9, 2, '#f2ead8'); px(g, 2, 12, 9, 1, '#c9b48a'); px(g, 1, 1, 1, 12, '#4a2a12');
      px(g, 5, 4, 3, 4, '#ffe08a'); px(g, 6, 3, 1, 6, '#ffe08a'); px(g, 4, 5, 5, 1, '#ffe08a');
      px(g, 10, 1, 1, 2, '#ffe08a'); px(g, 10, 10, 1, 2, '#ffe08a');
    });
    BOOK_BY[K.id] = K;
  }
  const BOOK_MAX = 5, BOOK_EVERY = 14;
  function spawnBook() {
    for (let i = 0; i < 40; i++) {
      const x = rand(WORLD.x0 + 30, WORLD.x1 - 30), y = rand(WORLD.y0 + 30, WORLD.y1 - 20);
      if (blockedAt(x, y) || blockedAt(x, y - 6) || Math.hypot(x - P.x, y - P.y) < 90 || G.books.some(b => Math.hypot(b.x - x, b.y - y) < 120)) continue;
      G.books.push({ x, y, kind: BOOK_KINDS[Math.random() * BOOK_KINDS.length | 0].id, t: 0, ph: Math.random() * 6 });
      return;
    }
  }
  function updateBooks(dt) {
    if (!MAPS[curMap] || MAPS[curMap].id !== 'library') { G.books.length = 0; return; }
    if (G.dead > 0) return;
    G.bookT = (G.bookT || 0) - dt;
    if (G.bookT <= 0 && G.books.length < BOOK_MAX) { G.bookT = BOOK_EVERY; spawnBook(); }
    for (const b of G.books) {
      b.t += dt;
      if (Math.random() < dt * 4) G.fx.push({ x: b.x + rand(-5, 5), y: b.y - rand(4, 16), vx: 0, vy: -12, t: 0.6, c: BOOK_BY[b.kind].col, s: 1, nograv: true });
      if (Math.hypot(P.x - b.x, P.y - b.y) < 11) readBook(b);
    }
    G.books = G.books.filter(b => !b.read);
  }
  function readBook(b) {
    const K = BOOK_BY[b.kind], hpWas = ST.maxHp;
    b.read = true;
    S.books = Object.assign({}, S.books, { [K.id]: ((S.books || {})[K.id] || 0) + K.v });
    ST = stats(); P.hp = Math.min(ST.maxHp, P.hp + Math.max(0, ST.maxHp - hpWas));
    for (let i = 0; i < 24; i++) { const a = Math.random() * Math.PI * 2, s = rand(20, 70); G.fx.push({ x: b.x, y: b.y - 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.7, c: i % 3 ? K.col : '#fff2cf', s: 1.5, nograv: true }); }
    G.texts.push({ x: P.x, y: P.y - 26, s: K.name.toUpperCase(), t: 1.2 });
    toast({ title: K.name, tip: `${K.txt(K.v)} until you die. This run: ${K.txt(S.books[K.id])}.`, col: K.col, letter: '✦' });
    sfx.power(); save();
  }
  const capped = c => c.cap && bonus(c.id) >= c.cap;
  function rollOffer() {
    const picks = [];
    while (picks.length < 3) {
      const r = rollRarity();
      const pool = CARDS.filter(c => !picks.some(p => p.card === c) && !capped(c) && (c.minR || 0) <= r);
      if (!pool.length) break;
      const card = pool[Math.random() * pool.length | 0];
      picks.push({ card, r, v: cardValue(card, r) });
    }
    return picks;
  }
  function openLevelUp() {
    G.choosing = true;
    G.aim.down = false;
    keys.clear();
    offer = rollOffer();
    const h2 = $('lvlTitle');
    h2.textContent = `Level ${S.level - S.pending + 1}!`;
    h2.style.animation = 'none'; void h2.offsetWidth; h2.style.animation = ''; // pop again for back-to-back level-ups
    // cards slide up one after another; a legendary waits a beat, then lands with a flash
    const LEG = RARITY.length - 1;
    let legAt = 0;
    $('cards').classList.remove('picked');
    $('cards').innerHTML = offer.map((o, i) => {
      const R = RARITY[o.r], leg = o.r === LEG, d = 0.08 + i * 0.12 + (leg ? 0.45 : 0);
      if (leg) legAt = Math.max(legAt, d + 0.55);
      const sparks = leg ? Array.from({ length: 14 }, () => `<b class="spk" style="--x:${rand(5, 95).toFixed(0)}%;--dl:${rand(0, 1.6).toFixed(2)}s;--s:${rand(1.3, 2.2).toFixed(2)}s;--dx:${rand(-30, 30).toFixed(0)}px"></b>`).join('') : '';
      return `<div class="cslot${leg ? ' leg' : o.r === LEG - 1 ? ' epic' : ''}" style="--d:${d.toFixed(2)}s;--rot:${((i - 1) * 6).toFixed(0)}deg">${leg ? '<i class="rays"></i><i class="ring"></i>' : ''}
        <button class="frame card ${R.name.toLowerCase()}" type="button" id="card-${i}" data-i="${i}" style="--r:${R.c}">
        <div class="band"><span>${R.name}</span><kbd>${i + 1}</kbd></div>
        <div class="body"><div class="ic">${o.card.icon}</div><div class="cn">${o.card.name(o.v)}</div><div class="cv">${o.card.text(o.v)}</div><div class="cd">${o.card.desc}${insane() ? (COMPOUND.has(o.card.id) ? ' <b>Insane: doubled, and it compounds.</b>' : INSANE_SAME.has(o.card.id) ? ' <b>Insane: normal value.</b>' : ' <b>Insane: doubled.</b>') : ''}</div></div>
      </button>${sparks}</div>`;
    }).join('');
    const ov = $('lvlOv');
    ov.classList.toggle('legend', legAt > 0); ov.style.setProperty('--ld', legAt + 's');
    ov.hidden = false;
    sfx.level();
    clearTimeout(legendTimer);
    if (legAt) legendTimer = setTimeout(() => { if (G.choosing) sfx.relic(); }, legAt * 1000);
    pickLock = performance.now() + 450; // no accidental pick while the cards are still flying in
  }
  let legendTimer = 0, pickLock = 0, picking = false;
  function choose(i) {
    const o = offer[i];
    if (!o || !G.choosing || picking || performance.now() < pickLock) return;
    const before = stats().maxHp;
    // insane mode compounds: +10% on top of +10% is +21%, not +20%
    const b0 = bonus(o.card.id);
    S.bonus[o.card.id] = insane() && COMPOUND.has(o.card.id) ? Math.round(((1 + b0 / 100) * (1 + o.v / 100) - 1) * 1000) / 10 : Math.round((b0 + o.v) * 10) / 10;
    if (o.card.cap) S.bonus[o.card.id] = Math.min(o.card.cap, S.bonus[o.card.id]);
    S.pending--;
    ST = stats();
    P.hp = Math.min(ST.maxHp, P.hp / before * ST.maxHp);
    if (o.r === RARITY.length - 1) sfx.power(); else sfx.buy();
    save();
    // the picked card swells, flashes and lifts away while the others drop back down
    picking = true; clearTimeout(legendTimer);
    $('cards').classList.add('picked');
    const slot = $('card-' + i).parentNode; slot.classList.add('chosen');
    setTimeout(() => {
      picking = false;
      if (!G.choosing) return; // something else closed the cards meanwhile
      if (S.pending > 0) openLevelUp();
      else { G.choosing = false; $('lvlOv').hidden = true; focusGame(); }
    }, 520);
  }
  document.getElementById('cards').addEventListener('click', e => {
    const b = e.target.closest('.card');
    if (b) choose(+b.dataset.i);
  });

