  // ================= state =================
  const freshSave = () => ({
    gold: 0, xp: 0, level: 1, pending: 0, bonus: {}, stage: 1, best: 1, progress: 0, auto: true, kills: 0, sound: true, vol: 80, shakeOn: true, nums: true, zoomAdj: 0, autoShoot: false, relics: {}, relicNew: false, time: 0,
    cls: 'ranger', weapon: 'sling', wOwn: { sling: 0 }, armor: 'cloth', aOwn: { cloth: 0 },
    souls: 0, soul: {}, rebirths: 0, bestEver: 1, bosses: 0, hordes: 0, chestsOpened: 0, pets: {}, pet: null, talents: {}, asc: {}, books: {},
  });
  // best stage this profile ever reached, across rebirths
  const bestOf = d => Math.max(d.best || 1, d.bestEver || 1);
  // three save slots; one is active and autosaves
  let slot = 1;
  function readSlot(n) {
    try { const raw = localStorage.getItem(slotKey(n)); if (raw) return migrate(Object.assign(freshSave(), JSON.parse(raw))); } catch (e) {}
    return null;
  }
  // saves from before classes existed become Rangers; make sure the equipped gear belongs to the class
  function migrate(d) {
    if (!CLASSES[d.cls]) d.cls = 'ranger';
    if (!d.pid) d.pid = newPid();
    const ws = classItems(WEAPONS, d.cls), as = classItems(ARMORS, d.cls);
    if (!ws.some(w => w.id === d.weapon)) {
      const owned = ws.filter(w => d.wOwn[w.id] != null);
      d.weapon = (owned[owned.length - 1] || ws[0]).id;
      if (d.wOwn[d.weapon] == null) d.wOwn[d.weapon] = 0;
    }
    if (!as.some(a => a.id === d.armor)) {
      const owned = as.filter(a => d.aOwn[a.id] != null);
      d.armor = (owned[owned.length - 1] || as[0]).id;
      if (d.aOwn[d.armor] == null) d.aOwn[d.armor] = 0;
    }
    return d;
  }
  // a brand-new save for the chosen class, holding that class's starter weapon and armor
  function freshClassSave(cls) {
    const d = freshSave(), w0 = classItems(WEAPONS, cls)[0], a0 = classItems(ARMORS, cls)[0];
    d.cls = cls; d.weapon = w0.id; d.wOwn = { [w0.id]: 0 }; d.armor = a0.id; d.aOwn = { [a0.id]: 0 }; d.pid = newPid();
    return d;
  }
  // ---- local leaderboard: every profile's best result, kept even after its save is deleted ----
  const BOARD_KEY = 'gravefield-board';
  const newPid = () => Math.random().toString(36).slice(2, 10);
  function readBoard() { try { return JSON.parse(localStorage.getItem(BOARD_KEY)) || {}; } catch (e) { return {}; } }
  function recordRun() {
    if (!S || !S.pid || S.daily) return;
    const b = readBoard();
    b[S.pid] = { cls: S.cls, armor: S.armor, level: S.level, best: bestOf(S), kills: S.kills, time: S.time || 0, dragon: S.dragonTime || 0, slot, at: Date.now(), cheated: !!S.cheated, rebirths: S.rebirths || 0 };
    try { localStorage.setItem(BOARD_KEY, JSON.stringify(b)); } catch (e) {}
  }
  function loadSave() {
    try {
      if (![1, 2, 3].some(n => localStorage.getItem(slotKey(n)))) {
        const old = localStorage.getItem(SAVE_KEY);
        if (old) localStorage.setItem(slotKey(1), old);
      }
      slot = Math.min(SLOTS, Math.max(1, +localStorage.getItem(ACTIVE_KEY) || 1));
    } catch (e) {}
    const d = readSlot(slot);
    if (!d) slotLive = false; // nothing saved here yet: the slot stays empty until you play
    return d || freshSave();
  }
  let S;
  let slotLive = true; // false after deleting the save you were on: the slot stays empty until you play in it
  const save = () => {
    if (!slotLive || S.daily) return; // daily runs live in memory only
    try { S.saved = Date.now(); localStorage.setItem(slotKey(slot), JSON.stringify(S)); localStorage.setItem(ACTIVE_KEY, String(slot)); } catch (e) {}
    recordRun();
  };

  const G = { t: 0, echoes: [], monsters: [], shots: [], eshots: [], bombs: [], seen: new Set(), drops: [],
    chests: [], chestT: 12, hazards: [], books: [], bookT: 0, pet: { x: 0, y: 0, t: 0, cd: 0 }, buffs: {}, buffMax: {}, flameT: 0, stormT: 0, whiteT: 0,
    cd: { q: 0, e: 0 }, invisT: 0, whirlT: 0, whirlTick: 0, rains: [], minions: [], zones: [], strikes: [], swings: 0, fired: 0, bursts: [], darkT: 0, fx: [], texts: [], spawnT: 0, fireT: 0, boss: null, dead: 0, paused: false, choosing: false,
    vacuum: 0, shake: 0, zoom: 3, dpr: 1, joy: null, aim: { has: false, sx: 0, sy: 0, down: false, id: null }, flashT: 0, cam: { x: 0, y: 0, ox: 0, oy: 0 } };
  const SPAWN = { x: WORLD.w / 2, y: WORLD.h / 2 + 52 }; // in the chapel courtyard, just below the door
  const P = { x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, hp: 50, walkT: 0, step: -1, moving: false, hurt: 0, aim: 0, recoil: 0, dir: 'down', flip: false, draw: 0.35, hs: 1, swing: 0, swingDir: 1, ambush: false, iframes: 0 };
  const keys = new Set();

  const W = id => WEAPONS.find(w => w.id === id) || WEAPONS[0];
  const A = id => ARMORS.find(a => a.id === id) || ARMORS[0];
  const bonus = id => (S.bonus && S.bonus[id]) || 0;

  function baseStats() {
    const w = W(S.weapon), wl = S.wOwn[S.weapon] || 0, a = A(S.armor), al = S.aOwn[S.armor] || 0;
    const wv = weaponAt(w, wl), av = armorAt(a, al), R = relicPct, on = id => G.buffs[id] > 0, ab = a.bonus || {};
    const rng = 1 + bonus('range') / 100; // the Long Reach level-up card
    return {
      dmg: wv.dmg * (1 + bonus('dmg') / 100) * (1 + R('str')) * (1 + (ab.dmg || 0) / 100),
      rate: wv.rate * (1 + bonus('rate') / 100) * (1 + R('quick')) * (on('frenzy') ? 2 : 1) * (1 + (ab.rate || 0) / 100),
      shots: 1 + bonus('multi') + (on('volley') ? 4 : 0) + (w.multi || 0),
      pierce: (w.pierce || 0) + bonus('pierce'),
      chain: w.chain || 0, splash: w.splash || 0, shot: w.shot, spd: w.spd || 0, range: (w.range || 0) * rng,
      art: w.art || w.shot, tip: tipOf(w.art || w.shot), melee: !!w.reach, wfx: w.fxd || null, aura: a.aura || null, reach: (w.reach || 0) * rng, arc: w.arc || 0, slashCol: w.slash, slashStyle: w.slashStyle || 'steel', stun: w.stun || 0, burn: !!w.burn, chill: !!w.chill,
      minions: w.minions || 0, minionMul: 1 + (ab.minion || 0) / 100,
      crit: Math.min(0.85, 0.05 + bonus('crit') / 100 + R('crit') + (w.crit || 0) / 100 + (ab.crit || 0) / 100), critMul: 1.5 + bonus('critdmg') / 100,
      speed: 70 * (1 + Math.min(80, bonus('speed')) / 100) * (1 + R('swift')) * (on('haste') ? 1.6 : 1) * (1 + (ab.speed || 0) / 100),
      maxHp: av.hp * (1 + bonus('vit') / 100) * (1 + R('vit')), def: av.def * (1 + bonus('armor') / 100) * (1 + R('skin')),
      regen: 0.004 + bonus('regen') / 100 + R('regen'),
      magnet: 30 * (1 + bonus('magnet') / 100) * (1 + R('reach')),
      xpMul: (1 + bonus('xp') / 100) * (1 + R('learn')) * (on('wisdom') ? 2 : 1),
      goldMul: (1 + bonus('greed') / 100) * (1 + R('greed')) * (on('goldrush') ? 3 : 1),
      boom: R('boom'), fang: R('fang'),
    };
  }
  // the daily challenge's modifiers, the Ascension constellation and this run's library books, on top of everything else
  function stats() {
    const o = baseStats();
    o.dmg *= dmod('glass') ? 1.6 : 1;
    o.maxHp *= dmod('glass') ? 0.5 : 1;
    o.speed *= dmod('hasty') ? 1.3 : 1;
    const tf = ascFx(), pc = k => 1 + (tf[k] || 0) / 100;
    const rb = (S && S.books) || {};
    for (const k in rb) if (k !== 'luck') tf[k] = (tf[k] || 0) + rb[k];
    o.luck = rb.luck || 0;
    o.goldMul *= pc('gold'); o.xpMul *= pc('xp'); o.magnet *= pc('magnet');
    o.regen += (tf.regen || 0) / 100; o.pierce += tf.pierce || 0; o.undying = !!tf.undying;
    o.dmg *= pc('dmg') * (tf.berserk && ST && P.hp < ST.maxHp * 0.5 ? 1.4 : 1);
    o.rate *= pc('rate'); o.maxHp *= pc('hp'); o.def *= pc('armor'); o.speed *= pc('speed');
    o.crit = Math.min(0.85, o.crit + (tf.crit || 0) / 100); o.critMul += (tf.critdmg || 0) / 100;
    o.reach *= pc('reach'); o.arc *= pc('reach'); o.range *= pc('range'); o.spd *= pc('range');
    if (o.melee) { const k = 1 + 0.15 * o.pierce; o.reach *= k; o.arc *= k; } // Titan's Edge
    o.shots += tf.multi || 0; o.chain += tf.chain || 0; o.minions += tf.minions || 0; o.minionMul *= pc('minion');
    o.cdr = Math.min(0.5, (tf.cdr || 0) / 100); o.leech = (tf.leech || 0) / 100; o.ambush = tf.ambush || 0;
    // the pet at your side
    const pid = S.pet, pl = pid ? petLv(pid) : 0;
    if (pid === 'pup') { o.magnet *= 1.5 + 0.1 * pl; o.goldMul *= 1 + 0.02 * pl; }
    if (pid === 'wisp') o.xpMul *= 1.05 + 0.02 * pl;
    if (pid === 'slimey') o.regen += (0.2 + 0.05 * pl) / 100;
    if (dmod('noregen')) o.regen = 0;
    o.goldMul *= bal('gold'); o.xpMul *= bal('xp');
    if (insane()) { o.goldMul *= 2; o.xpMul *= 2; }
    return o;
  }
