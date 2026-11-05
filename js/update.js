  // ================= update =================
  function aimWorld() {
    if (!G.aim.has) return { x: P.x + (P.flip ? -20 : 20), y: P.y - 9 };
    return { x: G.cam.ox + G.aim.sx * G.dpr / G.zoom, y: G.cam.oy + G.aim.sy * G.dpr / G.zoom };
  }
  function faceFrom(a) {
    const c = Math.cos(a), s = Math.sin(a);
    if (Math.abs(c) > 0.62) { P.dir = 'side'; P.flip = c < 0; }
    else { P.dir = s > 0 ? 'down' : 'up'; }
  }

  function update(dt) {
    ST = stats();
    if (G.paused || G.choosing || G.options || G.hudEdit || G.ascend || G.intro) return;
    G.t += dt;
    G.shake = Math.max(0, G.shake - dt);
    G.flashT = Math.max(0, G.flashT - dt);
    P.recoil = Math.max(0, P.recoil - dt * 9);
    P.swing = Math.max(0, P.swing - dt * 7);
    P.iframes = Math.max(0, P.iframes - dt);
    updateAbilities(dt);

    if (G.dead > 0) {
      G.dead -= dt;
      if (G.dead <= 0) respawn();
    } else {
      let mx = 0, my = 0;
      if (keys.has('a') || keys.has('arrowleft')) mx--;
      if (keys.has('d') || keys.has('arrowright')) mx++;
      if (keys.has('w') || keys.has('arrowup')) my--;
      if (keys.has('s') || keys.has('arrowdown')) my++;
      if (G.joy) { mx = G.joy.vx; my = G.joy.vy; }
      const len = Math.hypot(mx, my), k = len > 0 ? Math.min(1, len) / len : 0;
      // eased acceleration gives the hero some weight
      const acc = 1 - Math.pow(0.0004, dt), spdNow = ST.speed * (P.slowT > 0 ? 0.55 : 1);
      P.vx += (mx * k * spdNow - P.vx) * acc;
      P.vy += (my * k * spdNow - P.vy) * acc;
      P.x += P.vx * dt; P.y += P.vy * dt;
      pushOut(P, 4);
      P.x = clamp(P.x, WORLD.x0, WORLD.x1); P.y = clamp(P.y, WORLD.y0, WORLD.y1);
      const spd = Math.hypot(P.vx, P.vy);
      P.moving = spd > 10;
      if (P.moving) {
        P.walkT += dt * 8 * Math.max(0.6, spd / 70);
        const f = Math.floor(P.walkT) % 4;
        if (f !== P.step) {
          P.step = f;
          if (f === 0 || f === 2) {
            G.fx.push({ x: P.x + rand(-2, 2), y: P.y, vx: -P.vx * 0.15 + rand(-8, 8), vy: rand(-8, -2), t: 0.35, c: 'rgba(214,180,130,0.7)', s: 2, nograv: true, smoke: true });
            sfx.step();
          }
        }
      } else { P.walkT = 0; P.step = -1; }

      const aw = aimWorld();
      P.aim = Math.atan2(aw.y - (P.y - 9), aw.x - P.x);
      // auto shoot: when the mouse isn't held, lock onto the nearest monster in range and fire at it
      let firing = G.aim.down;
      if (!firing && S.autoShoot && G.invisT <= 0) {
        // the Flamethrower and the stormgun aim by their own reach, never by your class weapon's
        const reach = G.buffs.flame > 0 ? FLAME_REACH : ST.melee ? ST.reach + 14 : Math.min(G.buffs.volley > 0 ? stormRange() : ST.range, 200), t = nearest(P.x, P.y - 8, reach);
        if (t) { P.aim = Math.atan2((t.y - t.hh) - (P.y - 9), t.x - P.x); firing = true; }
      }
      if (firing) faceFrom(P.aim);
      else if (P.moving) faceFrom(Math.atan2(P.vy, P.vx));
      // hold fire to pull the string / cock the weapon; let go and it eases back to a loose nock
      if (firing) P.draw = Math.min(1, P.draw + dt * ST.rate * 1.3);
      else P.draw += (0.35 - P.draw) * Math.min(1, dt * 6);
      const ca = Math.cos(P.aim);
      if (ca > 0.15) P.hs = 1; else if (ca < -0.15) P.hs = -1;

      P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * ST.regen * dt);
      P.hurt = Math.max(0, P.hurt - dt);
      if (!G.buffs.freeze) updatePlayerFx(dt);
      updatePet(dt);
      G.fireT = Math.max(0, G.fireT - dt);
      if (firing && G.buffs.flame > 0) {
        G.flameT -= dt;
        while (G.flameT <= 0) { G.flameT += 0.035; fireFlame(P.aim); }
      } else if (firing && G.fireT <= 0 && !(G.whirlT > 0)) { fire(P.aim); G.fireT = 1 / ST.rate; }
    }

    // ---- power-up timers, chests, and the active power-ups' effects ----
    for (const k in G.buffs) { G.buffs[k] -= dt; if (G.buffs[k] <= 0) delete G.buffs[k]; }
    const frozen = G.buffs.freeze > 0;
    G.whiteT = Math.max(0, G.whiteT - dt);
    G.hurtT = Math.max(0, (G.hurtT || 0) - dt);
    G.chestT -= dt;
    if (G.chestT <= 0) {
      G.chestT = rand(30, 50);
      if (G.dead <= 0 && G.chests.filter(c => !c.open).length < 3) spawnChestNear();
    }
    for (const c of G.chests) {
      c.t += dt;
      if (c.open) c.ot += dt;
      else if (G.dead <= 0 && Math.abs(P.x - c.x) < 12 && Math.abs(P.y - c.y) < 10) openChest(c);
      if (!c.open && Math.random() < dt * 3) G.fx.push({ x: c.x + rand(-7, 7), y: c.y - rand(4, 14), vx: 0, vy: -10, t: 0.5, c: c.golden ? '#fff2a0' : '#ffe08a', s: 1, nograv: true });
    }
    G.chests = G.chests.filter(c => !c.open || c.ot < 4);
    updateBooks(dt);
    if (G.buffs.blades > 0 && G.dead <= 0) {
      for (let i = 0; i < 3; i++) {
        const a = G.t * 5 + i * Math.PI * 2 / 3, bx = P.x + Math.cos(a) * 26, by = P.y - 6 + Math.sin(a) * 18;
        for (const m of G.monsters) {
          if (m.dead || m.rise > 0 || (m.bladeT || 0) > G.t) continue;
          if (Math.hypot(m.x - bx, (m.y - m.hh) - by) < m.r + 7) { m.bladeT = G.t + 0.3; damage(m, ST.dmg * 1.2, Math.cos(a) * 90, Math.sin(a) * 90); }
        }
      }
    }
    // little tells on the hero for the passive power-ups
    if (G.dead <= 0) {
      if (G.buffs.haste > 0 && P.moving && (G.hasteT = (G.hasteT || 0) - dt) <= 0) {
        G.hasteT = 0.06;
        G.fx.push({ ghost: true, spr: heroSprite(), flip: P.dir === 'side' && P.flip, x: P.x, y: P.y, t: 0.22, tint: '#6ee07a' });
      }
      const sparkle = (col, rate) => { if (Math.random() < dt * rate) G.fx.push({ x: P.x + rand(-8, 8), y: P.y - rand(2, 20), vx: rand(-6, 6), vy: rand(-28, -12), t: rand(0.4, 0.7), c: col, s: 1.5, nograv: true }); };
      if (G.buffs.frenzy > 0) sparkle('#ff5a3a', 14);
      if (G.buffs.goldrush > 0) sparkle('#ffd84d', 10);
      if (G.buffs.wisdom > 0) sparkle('#66d4ff', 10);
      if (G.buffs.flame > 0) sparkle('#ff9a3c', 5);
      // weapon aura: sparks, embers, leaves or shadows coming off the weapon in your hand
      const wf = ST.wfx;
      if (wf && wf.aura && heldArt() === ST.art && Math.random() < dt * wf.arate) {
        const h = handPos(P.aim), k = rand(0.35, 1) * ST.tip, x = h.x + Math.cos(P.aim) * k, y = h.y + Math.sin(P.aim) * k;
        const c = wf.aura[Math.random() * wf.aura.length | 0];
        if (wf.inward) { const a = Math.random() * Math.PI * 2; G.fx.push({ x: x + Math.cos(a) * 9, y: y + Math.sin(a) * 9, vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 30, t: 0.3, c, s: 1.5, nograv: true }); }
        else G.fx.push({ x: x + rand(-1.5, 1.5), y: y + rand(-1.5, 1.5), vx: rand(-8, 8), vy: rand(-26, -8), t: rand(0.25, 0.5), c, s: rand(1, 2), nograv: true });
      }
      // top-tier armor glows
      if (ST.aura && Math.random() < dt * 7)
        G.fx.push({ x: P.x + rand(-5, 5), y: P.y - rand(3, 13), vx: rand(-4, 4), vy: rand(-18, -8), t: rand(0.4, 0.7), c: ST.aura, s: 1.5, nograv: true });
    }
    if (G.buffs.storm > 0 && G.dead <= 0 && (G.stormT -= dt) <= 0) {
      G.stormT = 0.35;
      const near = G.monsters.filter(m => !m.dead && m.rise <= 0 && Math.hypot(m.x - P.x, m.y - P.y) < 200);
      if (near.length) {
        const m = near[Math.random() * near.length | 0];
        G.fx.push({ bolt: true, x: m.x, y: m.y - m.hh, t: 0.18, seed: Math.random() * 99 });
        damage(m, ST.dmg * 3, 0, 0);
        G.shake = Math.max(G.shake, 0.05); sfx.zap();
      }
    }

    // monsters come twice as fast as they used to, and more of them can be out at once
    const swarm = dmod('swarm'), cap = Math.min(15 + S.stage * 3, 68) * (swarm ? 1.5 : 1);
    G.spawnT -= frozen ? 0 : dt;
    const inBackrooms = MAPS[curMap] && MAPS[curMap].id === 'backrooms';
    if (inBackrooms) { if (!frozen) { grinnerSpawn(dt); crawlerSpawn(dt); } } // nothing else lives here: no waves, no hordes, no bosses
    else {
      if (!frozen) updateHorde(dt);
      if (G.dead <= 0 && G.spawnT <= 0 && !G.horde) {
        G.spawnT = Math.max(0.14, 0.55 - S.stage * 0.015) * (swarm ? 0.5 : 1) / bal('spawn');
        if (G.monsters.length < cap) spawnMonster(false);
      }
    }
    if (!inBackrooms && G.dead <= 0 && S.auto && !G.boss && !G.horde && S.progress >= need(S.stage)) {
      if (S.stage >= 2 && Math.random() < HORDE_CHANCE) startHorde(); else spawnMonster(true);
    }
    if (G.dead <= 0) S.time = (S.time || 0) + dt; // run timer (frozen while paused, choosing or in menus)
    if (S.daily && S.time >= DAILY_TIME) { endDaily(); return; }
    if ((G.achT = (G.achT || 0) - dt) <= 0) { G.achT = 1; checkAch(); }

    // "seen" is false while the rogue is invisible: monsters wander and can't attack
    const alive = G.dead <= 0, hidden = G.invisT > 0, seen = alive && !hidden;
    for (const m of G.monsters) {
      m.flash = Math.max(0, m.flash - dt);
      if (frozen) continue; // time freeze: no movement, no attacks, no animation
      m.t += dt; m.cd -= dt; m.atkT = Math.max(0, m.atkT - dt); m.hitT += dt;
      if (m.rise > 0) { m.rise -= dt; continue; }
      // status effects from class weapons and abilities: poison/burn ticks, stun/ice, slow
      if (m.poison) {
        const po = m.poison;
        po.t -= dt; po.acc += dt;
        if (po.acc >= 0.5) {
          po.acc -= 0.5; damage(m, po.dps * 0.5, 0, 0);
          G.fx.push({ x: m.x + rand(-4, 4), y: m.y - m.hh * rand(0.6, 1.6), vx: 0, vy: -16, t: 0.45, c: po.fire ? '#ff9a3c' : '#6ee07a', s: 1.5, nograv: true });
        }
        if (po.t <= 0) m.poison = null;
        if (m.dead) continue;
      }
      m.iceT = Math.max(0, (m.iceT || 0) - dt);
      m.slowT = Math.max(0, (m.slowT || 0) - dt);
      if (m.stunT > 0) {
        m.stunT -= dt; m.t -= dt;
        m.x += m.kx * dt; m.y += m.ky * dt; m.kx *= Math.pow(0.0005, dt); m.ky *= Math.pow(0.0005, dt);
        if (!m.d.fly) pushOut(m, m.r * 0.6);
        continue;
      }
      if (m.d.grinner) { grinnerMove(m, dt, alive); continue; }
      if (m.d.crawler) { crawlerMove(m, dt, alive); continue; }
      if (hidden && (m.wx == null || Math.hypot(m.wx - m.x, m.wy - m.y) < 8)) { m.wx = m.x + rand(-70, 70); m.wy = m.y + rand(-50, 50); }
      const dx = (hidden ? m.wx : P.x) - m.x, dy = (hidden ? m.wy : P.y) - m.y, d = Math.hypot(dx, dy) || 1, ab = m.ab;
      if (Math.abs(dx) > 2 && !m.dash && !m.jump) m.face = dx > 0 ? 1 : -1;
      for (const k in m.abCd) m.abCd[k] -= dt;
      if (ab.regen && m.hitT > 1.5 && m.hp < m.max) {
        m.hp = Math.min(m.max, m.hp + m.max * 0.06 * dt);
        if (Math.random() < dt * 5) G.fx.push({ x: m.x + rand(-5, 5), y: m.y - m.hh * rand(0.5, 1.6), vx: 0, vy: -14, t: 0.5, c: '#6ee07a', s: 1.5, nograv: true });
      }
      if (ab.swift && (m.trailT -= dt) <= 0) { m.trailT = 0.05; m.trail.unshift({ x: m.x, y: m.y }); m.trail.length = Math.min(m.trail.length, 3); }

      // ---- leap: crouch (target marked on the ground), arc through the air, slam ----
      if (m.jump) {
        const j = m.jump; j.t += dt;
        const k = Math.min(1, j.t / j.dur);
        m.x = j.x0 + (j.x1 - j.x0) * k; m.y = j.y0 + (j.y1 - j.y0) * k;
        if (k >= 1) {
          m.jump = null; m.atkT = 0.2;
          pushOut(m, m.r * 0.6);
          G.fx.push({ ring: true, x: m.x, y: m.y, t: 0.3, max: 16 + m.r, c: '#d6b482' });
          for (let i = 0; i < 10; i++) G.fx.push({ x: m.x + rand(-6, 6), y: m.y, vx: rand(-60, 60), vy: rand(-30, -5), t: 0.4, c: 'rgba(214,180,130,0.8)', s: 2, nograv: true, smoke: true });
          G.shake = Math.max(G.shake, 0.07); sfx.thud();
          if (alive && Math.hypot(P.x - m.x, P.y - m.y) < 12 + m.r) { hurtPlayer(m.dmg * 1.25, m, 150); m.cd = 0.9; }
        }
        continue;
      }
      if (m.crouch > 0) {
        m.crouch -= dt;
        if (m.crouch <= 0) { m.jump = { t: 0, dur: 0.5, x0: m.x, y0: m.y, x1: m.tx, y1: m.ty, h: 16 + 5 * m.scale }; sfx.leap(); }
        continue;
      }
      // ---- charge: shake and aim, then rush in a straight line ----
      if (m.dash) {
        const c = m.dash; c.t -= dt;
        m.x += c.vx * dt; m.y += c.vy * dt;
        if (!m.d.fly) pushOut(m, m.r * 0.6);
        m.x = clamp(m.x, WORLD.x0 - 10, WORLD.x1 + 10); m.y = clamp(m.y, WORLD.y0, WORLD.y1 + 6);
        if (Math.random() < dt * 30) G.fx.push({ x: m.x, y: m.y, vx: -c.vx * 0.1, vy: rand(-10, -2), t: 0.3, c: 'rgba(214,180,130,0.7)', s: 2, nograv: true, smoke: true });
        if (alive && !c.hit && Math.hypot(P.x - m.x, P.y - m.y) < m.r + 7) { c.hit = true; hurtPlayer(m.dmg * 1.3, m, 170); m.cd = 0.9; }
        if (c.t <= 0) m.dash = null;
        continue;
      }
      if (m.tele > 0) {
        m.tele -= dt;
        if (m.tele <= 0) { const sp = Math.max(170, m.spd * 5); m.dash = { t: 0.42, vx: Math.cos(m.teleA) * sp, vy: Math.sin(m.teleA) * sp, hit: false }; m.face = Math.cos(m.teleA) > 0 ? 1 : -1; }
        continue;
      }
      if (m.boss && m.moves && seen && m.wind <= 0 && bossMove(m, dt, d, dx, dy)) continue;
      // bog lurker: sinks into the mud, glides fast and nearly untouchable, then bursts up under you
      if (m.d.lurk && seen) {
        m.lurkT = (m.lurkT == null ? rand(1, 2.5) : m.lurkT) - dt;
        const surface = () => {
          m.sub = false; m.lurkT = 3.5; m.atkT = 0.3;
          G.fx.push({ ring: true, x: m.x, y: m.y, t: 0.3, max: 20 + m.r, c: '#6f8a2a' });
          for (let i = 0; i < 12; i++) G.fx.push({ x: m.x + rand(-6, 6), y: m.y, vx: rand(-60, 60), vy: rand(-70, -20), t: 0.45, c: i % 2 ? '#5e5038' : '#3f5a34', s: 2 });
          sfx.thud();
          if (Math.hypot(P.x - m.x, P.y - m.y) < 18 + m.r) { hurtPlayer(m.dmg * 1.3, m, 140); m.cd = 1; }
        };
        if (m.lurkT <= 0) { if (m.sub) surface(); else { m.sub = true; m.lurkT = 4; } }
        else if (m.sub && d < 16) surface();
        if (m.sub && Math.random() < dt * 14) G.fx.push({ x: m.x + rand(-5, 5), y: m.y - 1, vx: 0, vy: -8, t: 0.4, c: 'rgba(140,160,90,0.8)', s: 1.5, nograv: true });
      }
      // fire imp: leaves burning footprints that hurt you if you stand in them
      if (m.d.trail && (m.fireT = (m.fireT || 0) - dt) <= 0) {
        m.fireT = 0.14;
        G.hazards.push({ x: m.x + rand(-2, 2), y: m.y, t: 2.4, t0: 2.4, r: 6, dmg: m.dmg * 0.35 });
        if (G.hazards.length > 160) G.hazards.shift();
      }
      if (seen && m.wind <= 0) {
        if (ab.leap && m.abCd.leap <= 0 && d > 35 && d < 150) {
          const lead = 0.35, tx = P.x + P.vx * lead, ty = P.y + P.vy * lead, td = Math.hypot(tx - m.x, ty - m.y), mx = Math.min(td, 150) / (td || 1);
          m.tx = m.x + (tx - m.x) * mx; m.ty = m.y + (ty - m.y) * mx;
          m.crouch = 0.4; m.abCd.leap = rand(3, 5);
          continue;
        }
        if (ab.dash && m.abCd.dash <= 0 && d > 30 && d < 160) {
          m.tele = 0.6; m.teleA = Math.atan2(dy, dx); m.abCd.dash = rand(3.5, 5.5); sfx.charge();
          continue;
        }
        if (ab.spit && m.abCd.spit <= 0 && d < 190) {
          const a = Math.atan2(P.y - 8 - (m.y - m.hh), dx), sp = 95;
          G.eshots.push({ x: m.x + Math.cos(a) * 4, y: m.y - m.hh, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: m.dmg * 0.7, life: 2.4, kind: m.type, t: 0 });
          m.atkT = 0.3; m.abCd.spit = rand(2.2, 3.4); sfx.spit();
        }
      }

      // ---- melee: a short wind-up (attack frame), then the hit lands if still in reach ----
      let slow = (hidden ? 0.45 : 1) * (m.slowT > 0 ? 0.45 : 1) * (m.sub ? 2.2 : 1);
      if (m.wind > 0) {
        m.wind -= dt; slow *= 0.2;
        if (m.wind <= 0) { m.atkT = 0.2; m.cd = 0.9; if (seen && d < m.r + 11) { hurtPlayer(m.dmg, m, ab.mighty ? 190 : 90); playerFx(m); } }
      } else if (m.atkT > 0) slow *= 0.5;
      let vx = dx / d * m.spd * slow, vy = dy / d * m.spd * slow;
      if (m.type === 'bat') { vx += -dy / d * Math.sin(m.t * 3) * 30; vy += dx / d * Math.sin(m.t * 3) * 30; }
      if (!alive) { vx *= -0.3; vy *= -0.3; }
      m.vx = vx + m.kx; m.vy = vy + m.ky;
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.kx *= Math.pow(0.0005, dt); m.ky *= Math.pow(0.0005, dt);
      if (!m.d.fly) pushOut(m, m.r * 0.6);
      m.x = clamp(m.x, WORLD.x0 - 10, WORLD.x1 + 10); m.y = clamp(m.y, WORLD.y0, WORLD.y1 + 6);
      // walk cycle speed follows how fast it's actually moving
      const rate = m.type === 'bat' ? 12 : m.type === 'ghost' ? 3 : m.type === 'slime' ? 0 : Math.hypot(vx, vy) / 6.5;
      m.ph += dt * rate;
      if (seen && d < m.r + 6 && m.cd <= 0 && m.wind <= 0 && !m.sub) m.wind = 0.2;
    }

    for (const e of G.eshots) {
      if (frozen) break;
      e.x += e.vx * dt; e.y += e.vy * dt; e.life -= dt; e.t += dt;
      if (alive && Math.hypot(P.x - e.x, P.y - 8 - e.y) < 6) { e.life = 0; hurtPlayer(e.dmg, e, 60); if (MON[e.kind]) playerFx({ d: MON[e.kind], dmg: e.dmg }); }
      if (blockedAt(e.x, e.y + 8) || inBackroomWall(e.x, e.y)) e.life = 0;
    }
    G.eshots = G.eshots.filter(e => e.life > 0);
    for (const b of G.bombs) {
      if (frozen) break;
      b.t -= dt;
      if (b.t <= 0) {
        G.fx.push({ ring: true, x: b.x, y: b.y, t: 0.3, max: b.r, c: '#ff8a3a' });
        for (let i = 0; i < 18; i++) G.fx.push({ x: b.x, y: b.y - 4, vx: rand(-90, 90), vy: rand(-90, 30), t: rand(0.3, 0.6), c: i % 2 ? '#ffcf5a' : '#ff6a1a', s: 2 });
        for (let i = 0; i < 5; i++) G.fx.push({ x: b.x + rand(-6, 6), y: b.y - 4, vx: rand(-15, 15), vy: rand(-25, -8), t: 0.7, c: 'rgba(80,60,50,0.6)', s: 4, nograv: true, smoke: true });
        G.shake = Math.max(G.shake, 0.15); sfx.boom();
        if (alive && Math.hypot(P.x - b.x, P.y - b.y) < b.r) hurtPlayer(b.dmg, b, 160);
      }
    }
    G.bombs = G.bombs.filter(b => b.t > 0);
    if (!frozen) updateEffects(dt);
    const ms = G.monsters;
    for (let i = 0; i < ms.length; i++) {
      const a = ms[i];
      for (let j = i + 1; j < ms.length; j++) {
        const b = ms[j], dx = b.x - a.x, dy = b.y - a.y, r = (a.r + b.r) * 0.75, d2 = dx * dx + dy * dy;
        if (d2 < r * r && d2 > 0.01) {
          const d = Math.sqrt(d2), p = (r - d) / 2, nx = dx / d, ny = dy / d, wa = a.boss ? 0.1 : 1, wb = b.boss ? 0.1 : 1;
          a.x -= nx * p * wa; a.y -= ny * p * wa; b.x += nx * p * wb; b.y += ny * p * wb;
        }
      }
    }

    for (const s of G.shots) {
      if (s.home) {
        // summoner souls curve toward the nearest monster
        if (!s.tgt || s.tgt.dead) s.tgt = nearest(s.x, s.y, 170, s.hit);
        if (s.tgt) {
          const ta = Math.atan2((s.tgt.y - s.tgt.hh) - s.y, s.tgt.x - s.x), ca = Math.atan2(s.vy, s.vx), sp = Math.hypot(s.vx, s.vy);
          let da = ta - ca; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
          const na = ca + clamp(da, -7 * dt, 7 * dt);
          s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
        }
      }
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (s.life <= 0) continue;
      // Backrooms walls stop shots dead, with a little puff of plaster
      if (inBackroomWall(s.x, s.y)) {
        s.life = 0;
        for (let k = 0; k < 4; k++) G.fx.push({ x: s.x, y: s.y, vx: -s.vx * 0.1 + rand(-20, 20), vy: -s.vy * 0.1 + rand(-20, 20), t: 0.25, c: '#d8c98a', s: 1.5, nograv: true });
        continue;
      }
      if (s.trail && Math.random() < dt * 45) G.fx.push({ x: s.x + rand(-1.5, 1.5), y: s.y + rand(-1.5, 1.5), vx: -s.vx * 0.05 + rand(-6, 6), vy: -s.vy * 0.05 + rand(-6, 6), t: rand(0.18, 0.32), c: s.trail, s: 1.5, nograv: true });
      for (const m of G.monsters) {
        if (m.dead || m.rise > 0 || s.hit.has(m)) continue;
        const dx = m.x - s.x, dy = (m.y - m.hh) - s.y;
        const hr = m.r + (s.type === 'wave' ? 10 : 3);
        if (dx * dx + dy * dy > hr * hr) continue;
        s.hit.add(m);
        const crit = damage(m, s.dmg, s.vx, s.vy);
        if (s.type === 'frost') m.slowT = 2.5;
        if (s.type === 'dart') m.poison = { dps: s.dmg * 0.6, t: 3, acc: 0 };
        onHit(s, m, crit);
        if (ST.boom > 0 && s.type !== 'flame' && Math.random() < ST.boom) {
          // Blast Powder relic: this shot bursts
          for (const o of G.monsters) if (o !== m && !o.dead && Math.hypot(o.x - s.x, (o.y - o.hh) - s.y) < 24) damage(o, s.dmg * 0.6, s.vx * 0.4, s.vy * 0.4);
          G.fx.push({ ring: true, x: s.x, y: s.y, t: 0.3, max: 24, c: '#ff9a3c' });
          for (let i = 0; i < 8; i++) G.fx.push({ x: s.x, y: s.y, vx: rand(-60, 60), vy: rand(-60, 40), t: 0.35, c: i % 2 ? '#ffd25a' : '#ff6a1a', s: 2 });
          sfx.boom();
        }
        if (s.splash) {
          for (const o of G.monsters) if (o !== m && !o.dead && Math.hypot(o.x - s.x, (o.y - o.hh) - s.y) < s.splash) damage(o, s.dmg * 0.6, s.vx * 0.5, s.vy * 0.5);
          G.fx.push({ ring: true, x: s.x, y: s.y, t: 0.3, max: s.splash, c: s.type === 'fire' ? '#ff8a3a' : '#ffb04a' });
          for (let i = 0; i < 8; i++) G.fx.push({ x: s.x, y: s.y, vx: rand(-50, 50), vy: rand(-50, 50), t: 0.35, c: '#ffcf5a', s: 2 });
          onExplode(s);
        }
        if (s.chain > 0) {
          const nxt = nearest(s.x, s.y, 110, s.hit);
          if (nxt) {
            G.fx.push({ zap: true, x1: s.x, y1: s.y, x2: nxt.x, y2: nxt.y - nxt.hh, t: 0.16, c: s.type === 'spark' ? '#bff4ff' : (s.trail || '#ffffff'), seed: Math.random() * 99 });
            const a = Math.atan2((nxt.y - nxt.hh) - s.y, nxt.x - s.x), sp = Math.hypot(s.vx, s.vy);
            s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp; s.chain--; s.life = 0.6;
            break;
          }
        }
        if (s.pierce > 0) s.pierce--; else s.life = 0;
        break;
      }
    }
    G.shots = G.shots.filter(s => s.life > 0);
    G.monsters = G.monsters.filter(m => !m.dead);

    G.vacuum = Math.max(0, G.vacuum - dt);
    for (const d of G.drops) {
      d.t += dt;
      const dx = P.x - d.x, dy = (P.y - 6) - d.y, dist = Math.hypot(dx, dy) || 1;
      if ((dist < ST.magnet || G.vacuum > 0 || d.t > 25) && G.dead <= 0) d.pull = Math.min(d.pull + dt * 4, 6);
      if (d.pull > 0) { const sp = 60 + d.pull * 70; d.vx = dx / dist * sp; d.vy = dy / dist * sp; }
      else { d.vx *= Math.pow(0.02, dt); d.vy *= Math.pow(0.02, dt); }
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (dist < 7 && G.dead <= 0) { d.done = true; collect(d); if (G.choosing) break; }
    }
    G.drops = G.drops.filter(d => !d.done);

    const trail = [];
    for (const f of G.fx) {
      f.t -= dt;
      if (f.slash && f.style && f.t > 0) slashTrail(f, dt, trail);
      if (f.ring || f.bolt || f.slash || f.ghost || f.rainArrow || f.zap || f.xslash) continue;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (!f.nograv) f.vy += 120 * dt;
      if (f.smoke) f.s += dt * 6;
    }
    G.fx = G.fx.filter(f => f.t > 0);
    for (const p of trail) G.fx.push(p); // added after the loop so new particles start moving next frame
    for (const t of G.texts) { t.t -= dt; t.y -= 18 * dt; }
    G.texts = G.texts.filter(t => t.t > 0);
  }
  // what each blade leaves behind as it sweeps: particles spawned at the blade's tip and along the trail behind it
  function slashTrail(f, dt, out) {
    const T = f.T || 0.16, p = 1 - f.t / T, head = 1 - Math.pow(1 - Math.min(1, p * 1.6), 3);
    if (p > 0.85) return;
    const dir = f.dir || 1, s0 = f.a - dir * f.arc / 2, R = f.r * 0.9;
    const at = u => { const a = s0 + dir * f.arc * u; return { x: f.x + Math.cos(a) * R, y: f.y + Math.sin(a) * R, a }; };
    const n = Math.max(1, Math.round(dt * 90)); // about 90 particles a second, spread behind the tip
    for (let i = 0; i < n; i++) {
      const q = at(Math.max(0, head - Math.random() * 0.45)), tan = q.a + dir * Math.PI / 2;
      switch (f.style) {
        case 'fire': // flames that lick up behind the blade, with a little smoke
          out.push({ x: q.x + rand(-2, 2), y: q.y + rand(-2, 2), vx: rand(-12, 12), vy: rand(-55, -25), t: rand(0.25, 0.5), c: ['#ff6a1a', '#ffd25a', '#ff9a3c'][Math.random() * 3 | 0], s: rand(1.5, 3), nograv: true });
          if (Math.random() < 0.15) out.push({ x: q.x, y: q.y, vx: rand(-8, 8), vy: rand(-25, -10), t: 0.6, c: 'rgba(70,40,30,0.45)', s: 2, nograv: true, smoke: true });
          break;
        case 'royal': // golden sparkles that drift down like falling glitter
          out.push({ x: q.x, y: q.y, vx: Math.cos(tan) * rand(10, 30), vy: rand(-10, 10), t: rand(0.35, 0.6), c: Math.random() < 0.4 ? '#ffffff' : '#ffd84d', s: 1.5, nograv: false });
          break;
        case 'radiant': // motes of light thrown outward
          out.push({ x: q.x, y: q.y, vx: Math.cos(q.a) * rand(20, 50), vy: Math.sin(q.a) * rand(20, 50), t: rand(0.2, 0.4), c: Math.random() < 0.5 ? '#ffffff' : '#bfe4ff', s: 1.5, nograv: true });
          break;
        case 'frost': // snowflakes and ice glitter drifting off the blade
          out.push({ x: q.x + rand(-2, 2), y: q.y, vx: rand(-15, 15), vy: rand(-10, 15), t: rand(0.35, 0.6), c: Math.random() < 0.5 ? '#ffffff' : '#bfe4ff', s: Math.random() < 0.3 ? 2 : 1, nograv: true });
          break;
        case 'storm': // crackling sparks of lightning jumping off the arc
          if (Math.random() < 0.6) out.push({ x: q.x, y: q.y, vx: Math.cos(q.a) * rand(40, 90) + rand(-30, 30), vy: Math.sin(q.a) * rand(40, 90) + rand(-30, 30), t: rand(0.1, 0.22), c: Math.random() < 0.5 ? '#ffffff' : (Math.random() < 0.5 ? '#7fe8ff' : '#ffe04a'), s: 1.5, nograv: true });
          break;
        case 'heavy': // steel sparks flying off the edge
          if (Math.random() < 0.5) out.push({ x: q.x, y: q.y, vx: Math.cos(tan) * rand(40, 90), vy: rand(-60, -20), t: rand(0.2, 0.35), c: Math.random() < 0.5 ? '#ffffff' : '#ffe08a', s: 1 });
          break;
        case 'blunt': case 'quake': // dust kicked up by a heavy, dull swing
          if (Math.random() < 0.35) out.push({ x: q.x, y: q.y + 4, vx: rand(-10, 10), vy: rand(-14, -4), t: 0.5, c: 'rgba(170,140,100,0.45)', s: 2, nograv: true, smoke: true });
          break;
        default: // steel: a few bright glints
          if (Math.random() < 0.25) out.push({ x: q.x, y: q.y, vx: Math.cos(tan) * 20, vy: Math.sin(tan) * 20, t: 0.18, c: '#ffffff', s: 1, nograv: true });
      }
    }
  }

