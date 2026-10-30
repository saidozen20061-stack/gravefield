
  function kill(m) {
    m.dead = true;
    if (m.d.grinner) {
      // it falls apart into the dark, and the Backrooms let you go: the stage is cleared
      G.grinnerT = 8;
      for (let i = 0; i < 40; i++) G.fx.push({ x: m.x + rand(-6, 6), y: m.y - rand(0, 40), vx: rand(-30, 30), vy: rand(-40, 10), t: rand(0.5, 1), c: i % 4 ? '#0b0b0e' : '#f2f2ea', s: 2, nograv: true, smoke: i % 4 !== 0 });
      setTimeout(() => { if (MAPS[curMap] && MAPS[curMap].id === 'backrooms' && !G.runOver) clearStage(); }, 600);
    }
    onKill(m);
    S.kills++; petKill(m);
    sfx.kill();
    const cols = { slime: '#59c96b', bat: '#5b4570', skeleton: '#e9e4d4', zombie: '#7fb069', ghost: '#dfe7ff', cyclops: '#c08a5a' };
    for (let i = 0; i < (m.boss ? 40 : 10); i++) G.fx.push({ x: m.x, y: m.y - m.hh, vx: rand(-60, 60), vy: rand(-70, 20), t: rand(0.3, 0.7), c: cols[m.type] || m.d.blood, s: m.boss ? 3 : 2 });
    if (m.ab.volatile) G.bombs.push({ x: m.x, y: m.y, t: 0.7, r: Math.min(42, 22 * m.scale), dmg: m.dmg * 1.5 });
    if (m.boss) {
      spawnChest(m.x, m.y, true); S.bosses = (S.bosses || 0) + 1;
      // the Slime King bursts into a ring of slimes
      if (m.type === 'slime') for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; spawnMonster(false, { type: 'slime', minion: true, at: { x: m.x + Math.cos(a) * 16, y: m.y + Math.sin(a) * 12 } }).rise = 0.15; }
    } else if (m.affs.length && Math.random() < 0.06) spawnChest(m.x, m.y, false);
    if (ST.fang > 0) P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * ST.fang);
    if (ST.leech > 0) P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * ST.leech);
    const bossK = (m.boss ? 15 : 1) * (1 + m.affs.length * 0.75) * (m.minion ? 0.4 : 1) * (dmod('giants') ? 2 : 1);
    const xp = m.d.xp * xpMulS(S.stage) * bossK * ST.xpMul, gold = m.d.gold * goldMulS(S.stage) * bossK * ST.goldMul;
    const pieces = m.boss ? 8 : 1;
    for (let i = 0; i < pieces; i++) { dropAt(m.x, m.y - 4, 'xp', xp / pieces); dropAt(m.x, m.y - 4, 'gold', gold / pieces); }
    if (m.boss) clearStage();
    else if (!G.boss && !G.horde && S.progress < need(S.stage)) {
      S.progress++;
    }
  }
  // the boss is down or the horde is beaten: on to the next, tougher stage
  function clearStage() {
    G.boss = null; G.horde = null; G.vacuum = 2; G.shake = 0.4;
    const cleared = S.stage, pts0 = ascPts();
    S.stage++; S.best = Math.max(S.best, S.stage); S.progress = 0; G.undyUsed = false;
    if (ascPts() > pts0) toast({ title: 'Ascension point', tip: 'Something stirs in the dark. Press Ascend to spend it.', col: '#111', letter: '◆' });
    const hpUp = Math.round((hpMul(S.stage) / hpMul(cleared) - 1) * 100), dmgUp = Math.round((dmgMul(S.stage) / dmgMul(cleared) - 1) * 100);
    banner(`Stage ${cleared} cleared`, `Stage ${S.stage}: monsters have +${hpUp}% health, +${dmgUp}% damage and grow bigger`);
    sfx.clear();
    save(); syncStage(); postScore();
  }

  // ================= hordes: sometimes, instead of a boss, the field is wiped and 5 waves pour in =================
  const HORDE_WAVES = 5, HORDE_CHANCE = 0.3;
  function startHorde() {
    for (const m of G.monsters) for (let i = 0; i < 6; i++) G.fx.push({ x: m.x + rand(-5, 5), y: m.y - m.hh, vx: rand(-25, 25), vy: rand(-35, -5), t: 0.6, c: 'rgba(60,40,70,0.75)', s: 3, nograv: true, smoke: true });
    G.monsters = []; G.eshots = []; G.bombs = [];
    G.horde = { wave: 0, left: 0, total: 1, gap: 0.12, spawnT: 0, pause: 2 };
    banner('Horde incoming!', `Every monster vanished... survive ${HORDE_WAVES} waves to clear stage ${S.stage}`, true);
    G.whiteT = 0.25; G.shake = Math.max(G.shake, 0.2); sfx.boss();
  }
  function updateHorde(dt) {
    const h = G.horde;
    if (!h || G.dead > 0) return;
    if (h.left > 0) {
      // each wave streams in quickly from every direction
      h.spawnT -= dt;
      while (h.spawnT <= 0 && h.left > 0) { h.spawnT += h.gap; h.left--; const m = spawnMonster(false, { horde: true }); m.rise = 0.35; }
      return;
    }
    if (G.monsters.length > 0) return;
    if (h.wave >= HORDE_WAVES) {
      // horde beaten: a boss-sized reward and a golden chest
      const d = MON[MON_KEYS.filter(k => MON[k].min <= S.stage && !MON[k].biome).pop()];
      for (let i = 0; i < 8; i++) { dropAt(P.x, P.y - 4, 'xp', d.xp * xpMulS(S.stage) * 15 * ST.xpMul / 8); dropAt(P.x, P.y - 4, 'gold', d.gold * goldMulS(S.stage) * 15 * ST.goldMul / 8); }
      spawnChest(P.x + 24, P.y + 6, true);
      S.hordes = (S.hordes || 0) + 1;
      if (!h.hit) G.flawless = true;
      clearStage();
      return;
    }
    h.pause -= dt;
    if (h.pause > 0) return;
    h.wave++;
    h.total = h.left = (10 + h.wave * 4 + Math.min(14, S.stage)) * 4; // four times the old wave size
    h.gap = 0.04; // and they pour in three times as fast, so a wave doesn't drag on
    h.spawnT = 0; h.pause = 2.2;
    banner(`Wave ${h.wave} / ${HORDE_WAVES}`, h.wave === HORDE_WAVES ? 'Final wave!' : `${h.total} monsters`, true);
    sfx.charge();
  }

  // ================= boss attacks: every king summons its own kind, plus two or three moves of its type =================
  const BOSS_MOVES = {
    slime: ['summon', 'slam'], bat: ['summon', 'ring', 'charge'], skeleton: ['summon', 'ring', 'slam'],
    zombie: ['summon', 'slam', 'charge'], ghost: ['summon', 'ring', 'blink'], cyclops: ['summon', 'slam', 'charge', 'ring'],
  };
  const BOSS_TIP = {
    slime: 'Summons slimes, slams the ground, splits when it dies', bat: 'Summons bats, fires bullet rings, charges',
    skeleton: 'Raises skeletons, fires bone rings, slams the ground', zombie: 'Raises zombies, slams the ground, charges',
    ghost: 'Summons ghosts, fires spirit rings, teleports', cyclops: 'Summons cyclopes, slams, charges and fires rings',
  };
  // returns true when the boss spent this frame starting a move
  function bossMove(m, dt, d, dx, dy) {
    if (!m.enraged && m.hp < m.max * 0.5) {
      m.enraged = true; m.spd *= 1.25;
      banner(`${m.d.name} King is enraged!`, 'It attacks faster below half health', true);
      G.shake = Math.max(G.shake, 0.25); sfx.boss();
    }
    const rage = m.enraged ? 1.6 : 1;
    for (const k in m.bcd) m.bcd[k] -= dt * rage;
    const smoke = (x, y) => { for (let i = 0; i < 10; i++) G.fx.push({ x: x + rand(-8, 8), y: y - rand(0, 14), vx: rand(-30, 30), vy: rand(-30, -5), t: 0.5, c: 'rgba(90,60,110,0.7)', s: 3, nograv: true, smoke: true }); };
    for (const mv of m.moves) {
      if (m.bcd[mv] > 0) continue;
      if (mv === 'summon') {
        if (G.monsters.filter(o => o.minion && !o.dead).length >= 10) { m.bcd.summon = 2; continue; }
        const n = 3 + Math.min(3, S.stage / 10 | 0);
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2 + rand(-0.2, 0.2);
          spawnMonster(false, { type: m.type, minion: true, at: { x: m.x + Math.cos(a) * (m.r + 16), y: m.y + Math.sin(a) * (m.r + 12) } }).rise = 0.5;
        }
        G.fx.push({ ring: true, x: m.x, y: m.y, t: 0.45, max: m.r + 34, c: '#c78cff' });
        m.atkT = 0.5; m.bcd.summon = rand(7, 9); sfx.charge();
        return true;
      }
      if (mv === 'slam') {
        // red marks on the ground: under you (leading your run) and around you; they burst a moment later
        const k = m.enraged ? 4 : 3;
        for (let i = 0; i < k; i++) {
          const x = P.x + (i ? rand(-46, 46) : P.vx * 0.45), y = P.y + (i ? rand(-34, 34) : P.vy * 0.45), t = 0.95 + i * 0.15;
          G.bombs.push({ x: clamp(x, WORLD.x0, WORLD.x1), y: clamp(y, WORLD.y0, WORLD.y1), t, t0: t, r: 22, dmg: m.dmg * 1.1, warn: true });
        }
        m.atkT = 0.4; m.bcd.slam = rand(4.5, 6); sfx.thud();
        return true;
      }
      if (mv === 'ring' && d < 260) {
        const n = m.enraged ? 18 : 12, off = Math.random() * 6;
        for (let i = 0; i < n; i++) {
          const a = off + i / n * Math.PI * 2;
          G.eshots.push({ x: m.x + Math.cos(a) * m.r, y: m.y - m.hh, vx: Math.cos(a) * 72, vy: Math.sin(a) * 72, dmg: m.dmg * 0.45, life: 4, kind: m.type, t: 0 });
        }
        m.atkT = 0.4; m.bcd.ring = rand(4, 5.5); sfx.spit();
        return true;
      }
      if (mv === 'charge' && d > 40 && d < 230) { m.tele = 0.75; m.teleA = Math.atan2(dy, dx); m.bcd.charge = rand(5, 7); sfx.charge(); return true; }
      if (mv === 'blink' && d > 60) {
        smoke(m.x, m.y);
        const a = Math.random() * Math.PI * 2;
        m.x = clamp(P.x + Math.cos(a) * 55, WORLD.x0 + 10, WORLD.x1 - 10); m.y = clamp(P.y + Math.sin(a) * 42, WORLD.y0 + 20, WORLD.y1 - 4);
        smoke(m.x, m.y); m.cd = 0.35; m.bcd.blink = rand(5, 7); sfx.zap();
        return true;
      }
    }
    return false;
  }

