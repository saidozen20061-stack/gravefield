  // ================= online leaderboard: one shared doc per player, scores/<their id> =================
  const NICK_KEY = 'gravefield-nick';
  const getNick = () => { try { return localStorage.getItem(NICK_KEY) || ''; } catch (e) { return ''; } };
  const NET = { status: 'wait', db: null, uid: null, rows: [], ro: false, busy: false };
  function netNote() {
    if (NET.status === 'file') return 'The online leaderboard works when you play from the claude.ai link.';
    if (NET.status === 'none') return 'Sign in to claude.ai to see the online leaderboard.';
    if (NET.status === 'wait') return '';
    if (!NET.uid) return 'Sign in to claude.ai to post your scores.';
    if (NET.ro) return "You can see the board, but can't post: ask the game's owner to invite you by email as an Editor.";
    if (S && S.cheated) return 'This save used the admin panel, so it does not post online.';
    return 'Your best run posts here automatically. Set your name above.';
  }
  async function initNet() {
    if (!window.claude || typeof window.claude.use !== 'function') { NET.status = 'file'; return; }
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db) { NET.status = 'none'; return; }
      NET.db = db; NET.uid = user ? await user.id() : null; NET.status = 'on';
      db.collection('scores').limit(500).onSnapshot(snap => {
        NET.rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
        if (G.menu && !$('mBoard').hidden) renderBoard();
      }, () => { NET.status = 'none'; });
      postScore();
    } catch (e) { NET.status = 'none'; }
    if (G.menu && !$('mBoard').hidden) renderBoard();
  }
  // writes only when something improved; one write at a time
  async function postScore(nickChanged) {
    if (NET.status !== 'on' || !NET.uid || NET.ro || NET.busy || !S || !slotLive) return;
    const me = NET.rows.find(r => r.id === NET.uid), body = Object.assign({}, me || {});
    delete body.id;
    let changed = false;
    const best = bestOf(S);
    if (!S.cheated && !S.daily && best > 1 && (!me || best > (me.best || 0) || (best === me.best && S.kills > (me.kills || 0) + 50))) {
      Object.assign(body, { best, level: S.level, kills: S.kills, cls: S.cls, armor: S.armor, time: Math.round(S.time || 0), rebirths: S.rebirths || 0 });
      changed = true;
    }
    if (!S.cheated && !S.daily && S.dragonTime && (!me || !me.dragon || S.dragonTime < me.dragon)) { body.dragon = Math.round(S.dragonTime); changed = true; }
    const p = G.dailyPost;
    if (p) {
      G.dailyPost = null;
      if (!me || me.dailyDate !== p.key || p.stage > (me.dailyStage || 0) || (p.stage === me.dailyStage && p.kills > (me.dailyKills || 0))) {
        Object.assign(body, { dailyDate: p.key, dailyStage: p.stage, dailyKills: p.kills, dailyCls: p.cls }); changed = true;
      }
    }
    if (me && nickChanged && me.nick !== getNick()) changed = true;
    if (!changed) return;
    body.nick = getNick() || 'Hunter'; body.at = Date.now();
    NET.busy = true;
    try { await NET.db.collection('scores').doc(NET.uid).set(body); }
    catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'not_granted')) NET.ro = true; }
    NET.busy = false;
    if (G.menu && !$('mBoard').hidden) renderBoard();
  }

  // ================= achievements: per device, never on a save that used the admin panel =================
  const ACH_KEY = 'gravefield-ach', CLS_KEY = 'gravefield-classes';
  const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const relicTotal = () => RELICS.reduce((s, r) => s + ((S.relics || {})[r.id] || 0), 0);
  const ACH = [
    { id: 'kill1', name: 'First Blood', tip: 'Slay your first monster', ok: () => S.kills >= 1 },
    { id: 'kill1k', name: 'Gravedigger', tip: 'Slay 1,000 monsters', ok: () => S.kills >= 1e3 },
    { id: 'kill10k', name: 'Undertaker', tip: 'Slay 10,000 monsters', ok: () => S.kills >= 1e4 },
    { id: 'kill100k', name: 'Reaper', tip: 'Slay 100,000 monsters', ok: () => S.kills >= 1e5 },
    { id: 'st11', name: 'Into the Murk', tip: 'Reach the Murk Swamp (stage 11)', ok: () => bestOf(S) >= 11 },
    { id: 'st21', name: 'Cold Feet', tip: 'Reach the Frozen Crypt (stage 21)', ok: () => bestOf(S) >= 21 },
    { id: 'st31', name: 'Trial by Fire', tip: 'Reach the Ember Wastes (stage 31)', ok: () => bestOf(S) >= 31 },
    { id: 'st41', name: 'Bone Dry', tip: 'Reach the Bone Desert (stage 41)', ok: () => bestOf(S) >= 41 },
    { id: 'st100', name: 'Centurion', tip: 'Reach stage 100', ok: () => bestOf(S) >= 100 },
    { id: 'boss1', name: 'Kingslayer', tip: 'Defeat a boss', ok: () => S.bosses >= 1 },
    { id: 'boss25', name: 'Regicide', tip: 'Defeat 25 bosses', ok: () => S.bosses >= 25 },
    { id: 'horde1', name: 'Hold the Line', tip: 'Survive a horde', ok: () => S.hordes >= 1 },
    { id: 'flawless', name: 'Untouchable', tip: 'Survive a horde without getting hit', ok: () => G.flawless },
    { id: 'chest10', name: 'Treasure Hunter', tip: 'Open 10 chests', ok: () => S.chestsOpened >= 10 },
    { id: 'chest100', name: 'Hoarder', tip: 'Open 100 chests', ok: () => S.chestsOpened >= 100 },
    { id: 'relic10', name: 'Collector', tip: 'Own 10 relics', ok: () => relicTotal() >= 10 },
    { id: 'relicall', name: 'Curator', tip: 'Find every kind of relic', ok: () => RELICS.every(r => (S.relics || {})[r.id]) },
    { id: 'lv25', name: 'Seasoned', tip: 'Reach level 25', ok: () => S.level >= 25 },
    { id: 'lv75', name: 'Veteran', tip: 'Reach level 75', ok: () => S.level >= 75 },
    { id: 'rich', name: 'Dragon Hoard', tip: 'Hold 1,000,000 gold at once', ok: () => S.gold >= 1e6 },
    { id: 'maxitem', name: 'Masterwork', tip: 'Upgrade a weapon or armor to max level', ok: () => [...Object.values(S.wOwn), ...Object.values(S.aOwn)].some(l => l >= MAX_ITEM_LV) },
    { id: 'reborn', name: 'Awakened', tip: 'Light your first Ascension node', ok: () => ascSpent() >= 1 },
    { id: 'reborn5', name: 'Eternal', tip: 'Spend 15 Ascension points', ok: () => ascSpent() >= 15 },
    { id: 'daily', name: 'Daily Grind', tip: 'Finish a daily challenge', ok: () => G.dailyDone },
    { id: 'classes', name: 'Jack of All Trades', tip: 'Play every class', ok: () => readJSON(CLS_KEY, []).length >= CLASS_ORDER.length },
  ];
  function checkAch() {
    if (!S || !slotLive || S.cheated || G.menu) return;
    const got = readJSON(ACH_KEY, {});
    let any = false;
    for (const a of ACH) {
      if (got[a.id] || !a.ok()) continue;
      got[a.id] = Date.now(); any = true;
      toast({ title: 'Achievement: ' + a.name, tip: a.tip, col: '#f2c14e', letter: '★' });
    }
    if (any) { try { localStorage.setItem(ACH_KEY, JSON.stringify(got)); } catch (e) {} sfx.relic(); }
  }
  function renderAch() {
    const got = readJSON(ACH_KEY, {}), n = ACH.filter(a => got[a.id]).length;
    $('achCount').textContent = `${n} / ${ACH.length} unlocked`;
    $('achGrid').innerHTML = ACH.map(a => `<div class="frame ach${got[a.id] ? ' got' : ''}"><i>${got[a.id] ? '★' : '?'}</i><div><b>${a.name}</b><small>${a.tip}</small></div></div>`).join('');
  }
  $('mAchBtn').addEventListener('click', () => showMenu('ach'));
  $('achBack').addEventListener('click', () => showMenu('main'));

  // ================= daily challenge: the same seeded class and modifiers for everyone, 10 minutes =================
  const DAILY_TIME = 600, DAILY_KEY = 'gravefield-daily';
  const DAILY_MODS = [
    { id: 'elites', name: 'Elite Night', tip: 'Every monster is an elite' },
    { id: 'glass', name: 'Glass Cannon', tip: '+60% damage, half health' },
    { id: 'swarm', name: 'Swarm', tip: 'Monsters spawn twice as fast' },
    { id: 'giants', name: 'Giants', tip: 'Bigger, tougher monsters that give double XP and gold' },
    { id: 'noregen', name: 'Bleeding', tip: 'No health regeneration' },
    { id: 'rich', name: 'Inheritance', tip: 'Start with 2,000 gold' },
    { id: 'hasty', name: 'Hasty', tip: 'You move 30% faster' },
  ];
  function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function dailyPlan(key = todayKey()) {
    let h = 7; for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761);
    const r = mulberry(h), cls = CLASS_ORDER[r() * CLASS_ORDER.length | 0], pool = DAILY_MODS.slice(), mods = [];
    while (mods.length < 2) mods.push(pool.splice(r() * pool.length | 0, 1)[0].id);
    return { key, cls, mods };
  }
  let dailyReturn = null;
  function renderDaily() {
    const p = dailyPlan(), C = CLASSES[p.cls], best = readJSON(DAILY_KEY, {})[p.key];
    $('dailyDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    $('dailyPlan').innerHTML = `<div class="dmod" style="--r:${C.col}"><b>${C.name}</b><small>Today's class</small></div>` +
      p.mods.map(id => { const m = DAILY_MODS.find(x => x.id === id); return `<div class="dmod"><b>${m.name}</b><small>${m.tip}</small></div>`; }).join('');
    $('dailyBest').textContent = best ? `Your best today: stage ${best.stage}, ${fmt(best.kills)} kills` : 'You have not played today yet.';
    const resume = S.daily === p.key && slotLive && S.time < DAILY_TIME;
    $('dailyGo').textContent = resume ? 'Resume' : best ? 'Try again' : 'Start';
  }
  function startDaily() {
    const p = dailyPlan();
    if (S.daily === p.key && slotLive && S.time < DAILY_TIME) { play(); return; }
    const d = freshClassSave(p.cls);
    Object.assign(d, { daily: p.key, dmods: p.mods, pid: 'daily-' + p.key, auto: true, gold: p.mods.includes('rich') ? 2000 : 0 });
    if (!S.daily && slotLive) dailyReturn = slot;
    switchSlot(0, d, !S.daily);
    play();
    banner('Daily Challenge', '10 minutes: ' + p.mods.map(id => DAILY_MODS.find(x => x.id === id).name).join(' + '));
  }
  function endDaily() {
    const res = { key: S.daily, stage: S.best, kills: S.kills, cls: S.cls };
    const all = readJSON(DAILY_KEY, {}), prev = all[res.key];
    const better = !prev || res.stage > prev.stage || (res.stage === prev.stage && res.kills > prev.kills);
    if (better) { all[res.key] = { stage: res.stage, kills: res.kills }; try { localStorage.setItem(DAILY_KEY, JSON.stringify(all)); } catch (e) {} }
    G.dailyDone = true; checkAch();
    G.dailyPost = res; postScore();
    // back to the save you were on before the challenge
    const n = dailyReturn || [1, 2, 3].find(k => readSlot(k));
    dailyReturn = null;
    if (n) switchSlot(n, readSlot(n), false);
    else { switchSlot(1, null, false); slotLive = false; }
    sfx.clear();
    showDialog({ title: "Time's up!", text: `You reached stage ${res.stage} with ${fmt(res.kills)} kills.${better ? ' That is your best today!' : ` Your best today is still stage ${prev.stage}.`}`,
      yes: { label: 'See the board', fn: () => { boardTab = 'daily'; showMenu('board'); } }, no: { label: 'Main menu', fn: () => showMenu('main') } });
  }
  $('mDailyBtn').addEventListener('click', () => showMenu('daily'));
  $('dailyGo').addEventListener('click', startDaily);
  $('dailyBack').addEventListener('click', () => showMenu('main'));
  // pixel icons for the square buttons: a gear for settings, three rising bars for the leaderboard
  const ICONS = {
    gear: ['....XXXX....', '.XX.XXXX.XX.', '.XXXXXXXXXX.', '..XXXXXXXX..', 'XXXXX..XXXXX', 'XXXX....XXXX',
      'XXXX....XXXX', 'XXXXX..XXXXX', '..XXXXXXXX..', '.XXXXXXXXXX.', '.XX.XXXX.XX.', '....XXXX....'],
    book: ['XXXXX..XXXXX', 'X...X..X...X', 'X.XXX..XXX.X', 'X...X..X...X', 'X.XXX..XXX.X', 'X...X..X...X',
      'X.XXX..XXX.X', 'X...X..X...X', 'X...X..X...X', 'XXXXXXXXXXXX', '.XXXXXXXXXX.', '.....XX.....'],
    trophy: ['.XXXXXXXXXX.', 'XXXXXXXXXXXX', 'X.XXXXXXXX.X', 'X.XXXXXXXX.X', '.X.XXXXXX.X.', '..XXXXXXXX..',
      '...XXXXXX...', '....XXXX....', '.....XX.....', '.....XX.....', '...XXXXXX...', '..XXXXXXXX..'],
  };
  function pixIcon(rows) {
    let px = '';
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') px += `M${x} ${y}h1v1h-1z`; }));
    // a darker copy one pixel down-right gives the same hard drop shadow as the button text
    return `<svg viewBox="0 0 13 13" aria-hidden="true"><path d="${px}" fill="#6e3510" transform="translate(1 1)"/><path d="${px}" fill="#fff2cf"/></svg>`;
  }
  document.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = pixIcon(ICONS[el.dataset.icon]); });
  $('mSettings').addEventListener('click', () => showMenu('set'));
  // how to play: written from your current key bindings
  function renderHow() {
    const K = a => `<kbd>${esc(keyName(BIND[a]))}</kbd>`;
    $('howBody').innerHTML = `
      <h3>Controls</h3><ul>
        <li>Move with ${K('up')} ${K('left')} ${K('down')} ${K('right')} or the arrow keys.</li>
        <li><b>Hold the mouse</b> to attack where you aim. Turn on Auto shoot in Settings to fire at the nearest monster for you.</li>
        <li>${K('q')} uses your <b>armor's skill</b>, ${K('e')} your <b>weapon's skill</b>. Your first two armors have none, and neither do Common weapons.</li>
        <li>${K('pause')} pauses, ${K('shop')} hides or shows the shop, Esc opens Options. You can change every key in Settings.</li>
        <li>On a touch screen: drag on the left side to move, hold on the right side to attack.</li></ul>
      <h3>Clearing stages</h3><ul>
        <li>Kill enough monsters to fill the stage bar, then beat the boss, or survive a horde, to move on.</li>
        <li>Each stage is tougher than the last. Untick Auto-advance to stay and farm a stage.</li></ul>
      <h3>Getting stronger</h3><ul>
        <li>Monsters drop <b>gold</b> and <b>XP gems</b>. Every level up lets you pick one of three skill cards; rarer cards are stronger.</li>
        <li>Spend gold in the shop on new weapons and armor, and on upgrading them.</li>
        <li>Chests hold power-ups, and sometimes a <b>relic</b> or a <b>pet</b>, which you keep for good.</li>
        <li>Every 5 stages you ever reach gives an <b>Ascension</b> point. Press Ascend to spend it on permanent upgrades.</li></ul>
      <h3>Elites and bosses</h3><ul>
        <li>Elites have extra powers written above their heads. The first time you meet a new kind, the game stops and explains it.</li>
        <li>Bosses wear a crown and have special attacks. Watch for the red marks on the ground.</li></ul>
      <h3>Maps</h3><ul>
        <li>Pick a map when you start a new save; it stays for that save. Auto moves you to a new map every 5 stages.</li>
        <li>In the Library, grab the glowing tomes for bonuses that last the whole run.</li></ul>
      <h3>Dying</h3><ul>
        <li>When you die, the run is over: gold, levels, gear and tomes are lost.</li>
        <li>Relics, pets and Ascension stay with you for the next run.</li></ul>`;
  }
  // ---- bestiary: every monster, boss, elite, weapon, armor, power-up, relic and pet, read straight from the game's own data ----
  let bestTab = 'mon', bestCls = 'warrior';
  const sprURL = spr => spr.url || (spr.url = spr.c.toDataURL());
  const bTag = (txt, col) => `<span style="--t:${col}">${txt}</span>`;
  const bCard = o => `<div class="frame bcard" style="--r:${o.col || 'var(--paper-d)'}">
      <div class="bpic"><img src="${o.img}" alt=""></div>
      <h4>${o.name}</h4>
      <div class="btags">${(o.tags || []).join('')}</div>
      <div class="bstats">${o.stats || ''}</div>
      ${o.desc ? `<p>${o.desc}</p>` : ''}${o.skill || ''}</div>`;
  const RARITY_TAG = r => bTag(RARITY[r].name, RARITY[r].c);
  // undiscovered entries are a dark silhouette and ??? (admin tools on reveals everything)
  const known = (kind, id) => kind === 'mode' || adminOn || SEEN.has(kind + ':' + id);
  const unknownCard = (img, hint) => `<div class="frame bcard unknown"><div class="bpic"><img src="${img}" alt=""></div><h4>???</h4><div class="btags"></div><div class="bstats"></div><p>${hint}</p></div>`;
  const BEST_HINT = { mon: 'Not met yet. Keep clearing stages.', boss: 'Not fought yet. Fill a stage bar to call a boss.', elite: 'Not met yet. Elites appear on later stages.',
    weapon: 'Not owned yet. Buy it in the shop to learn about it.', armor: 'Not owned yet. Buy it in the shop to learn about it.',
    power: 'Not found yet. Open chests.', relic: 'Not found yet. Relics hide in chests.', pet: 'Not found yet. Pets hide in chests.' };
  const BEST_KIND = { mon: 'mon', boss: 'boss', elite: 'elite', weapon: 'weapon', armor: 'armor', power: 'power', relic: 'relic', pet: 'pet' };
  const skillLine = (key, sk) => sk ? `<div class="bskill">${key} skill · <b>${sk.name}</b> (${sk.cd}s): ${sk.desc}</div>` : `<div class="bskill">No ${key} skill.</div>`;
  // each list: [id, picture, card()]; the card is only built for entries you know
  const BEST = {
    mon: () => Object.entries(MON).map(([id, d]) => [id, sprURL(d.spr), () => {
      const traits = [];
      if (d.fly) traits.push('Flies over walls and water.');
      for (const id of d.innate || []) { const f = AFFIX.find(a => a.id === id); if (f) traits.push(`Always <b>${f.name.toLowerCase()}</b>: ${f.tip}.`); }
      if (d.hitFx === 'slow') traits.push('Its hits <b>slow</b> you.');
      if (d.hitFx === 'poison') traits.push('Its sting <b>poisons</b> you.');
      if (d.lurk) traits.push('Sinks into the mud, nearly untouchable, and bursts up under you.');
      if (d.trail) traits.push('Leaves <b>burning footprints</b>.');
      const bio = d.where ? { name: d.where, col: '#c9b86a' } : d.biome && BIOMES.find(b => b.id === d.biome);
      if (d.grinner) traits.push('About 3.5 metres tall. No eyes, and far too many teeth. It always knows where you are and is always a little faster than you, but it hates the light: catch it in your flashlight and it runs from you for 5 seconds. Kill it to escape the stage.');
      if (d.crawler === 'hollow') traits.push('Walks on all fours, its back bent up into a hump and its knees and elbows jutting over it. No face. It wanders the halls at random; come into its sight and it shrieks and sprints at you twice as fast as you can run. Shine your flashlight on it and it flees, then turns up somewhere else.');
      if (d.crawler === 'stalker') traits.push('Longer and lower than the Hollow, and quieter. It creeps after you through the dark, stopping now and then to listen. Come into its sight and it shrieks and sprints at you twice as fast as you can run. Shine your flashlight on it and it flees, then turns up somewhere else.');
      return bCard({ name: d.name, img: sprURL(d.spr), col: d.blood || '#7d7268',
        tags: [bio ? bTag(bio.name, bio.col) : bTag(`From stage ${d.min}`, '#7d7268'), d.fly ? bTag('Flying', '#4fb6e8') : ''],
        stats: `${d.hp} HP · ${d.dmg} damage · speed ${d.spd}<br>${d.xp} XP · ${d.gold} gold`,
        desc: (bio ? `Only found in the ${bio.name}. ` : '') + (traits.join(' ') || 'No special tricks. Grows tougher every stage.') });
    }]),
    boss: () => Object.keys(BOSS_TIP).map(k => [k, sprURL(MON[k].spr), () => {
      const d = MON[k];
      return bCard({ name: `${d.name} King`, img: sprURL(d.spr), col: '#f2c14e', tags: [bTag('Boss', '#d8402a'), bTag('Crowned', '#c9a23a')],
        stats: `${d.hp * 14} HP · ${d.dmg * 2} damage at stage 1`,
        desc: `${BOSS_TIP[k]}. Below half health it becomes <b>enraged</b> and attacks faster. Guards the end of a stage; beat it to move on.` });
    }]),
    elite: () => AFFIX.map(f => [f.id, sprURL(MON.zombie.spr), () => bCard({ name: f.name, img: sprURL(MON.zombie.spr), col: f.col, tags: [bTag(`From stage ${f.min}`, f.col)],
      stats: `Name shown over its head in this colour.`,
      desc: `This elite ${f.tip}. <b>How to beat it:</b> ${f.how || ''}` })]),
    weapon: () => classItems(WEAPONS, bestCls).map(w => [w.id, weaponIconURL(w), () => bCard({ name: w.name, img: weaponIconURL(w), col: RARITY[w.r].c,
      tags: [RARITY_TAG(w.r), bTag(CLASSES[w.cls].name, CLASSES[w.cls].col), bTag(w.cost ? fmt(w.cost) + ' gold' : 'Starter', '#c98a14')],
      stats: `${fmtD(w.dmg)} damage · ${w.rate}/s` + (w.reach ? ` · reach ${w.reach}` : ` · range ${w.range}`)
        + [w.pierce ? ` · pierce ${w.pierce}` : '', w.splash ? ' · splash' : '', w.chain ? ` · chains ${w.chain}` : '', w.multi ? ` · ${w.multi + 1} at once` : '', w.crit ? ` · +${w.crit}% crit` : '', w.minions ? ` · ${w.minions} minions` : ''].join(''),
      desc: w.desc, skill: skillLine('E', w.skill) })]),
    armor: () => classItems(ARMORS, bestCls).map(a => [a.id, armorIconURL(a), () => {
      const bt = Object.entries(a.bonus || {}).filter(([, v]) => v).map(([k, v]) => `+${v}% ${{ dmg: 'damage', rate: 'fire rate', crit: 'crit', speed: 'speed', minion: 'minion damage' }[k]}`).join(' · ');
      return bCard({ name: a.name, img: armorIconURL(a), col: RARITY[a.r].c,
        tags: [RARITY_TAG(a.r), bTag(CLASSES[a.cls].name, CLASSES[a.cls].col), bTag(a.cost ? fmt(a.cost) + ' gold' : 'Starter', '#c98a14')],
        stats: `${fmt(a.hp)} HP · ${fmt(a.def)} armor${bt ? '<br>' + bt : ''}`, desc: a.desc, skill: skillLine('Q', a.skill) });
    }]),
    power: () => POWERS.map(p => [p.id, iconURL('p:' + p.id), () => bCard({ name: p.name, img: iconURL('p:' + p.id), col: p.col, tags: [bTag(p.dur ? `${p.dur} seconds` : 'Instant', p.col)],
      stats: 'From chests: a wooden one has a 25% chance, a golden one always has one.', desc: p.tip })]),
    relic: () => RELICS.map(r => [r.id, iconURL('r:' + r.id), () => bCard({ name: r.name, img: iconURL('r:' + r.id), col: r.col, tags: [bTag('Permanent', r.col), bTag('Stacks', '#7d7268')],
      stats: `+${r.per}${r.unit} each · you have ${(S.relics || {})[r.id] || 0}`, desc: 'Found in chests: 5% from a wooden one, 20% from a boss\'s golden chest. Kept when you die.' })]),
    pet: () => PETS.map(p => [p.id, sprURL(p.spr), () => bCard({ name: p.name, img: sprURL(p.spr), col: p.col, tags: [bTag((S.pets || {})[p.id] != null ? 'Found' : 'Not on this save', (S.pets || {})[p.id] != null ? '#3c8f2a' : '#7d7268'), p.fly ? bTag('Flying', '#4fb6e8') : ''],
      stats: `Level 1: ${p.tip(1)}<br>Level 20: ${p.tip(20)}`, desc: 'Levels up as you kill. Chests can hold a pet: 3% from a wooden one, 25% from a golden one.' })]),
  };
  // game modes are always known: they are rules, not things to find
  const SKULL = sprite(['..wwwwww..', '.wwwwwwww.', 'wwwwwwwwww', 'wkkwwwwkkw', 'wkkwwwwkkw', 'wwwwkkwwww', '.wwwwwwww.', '..wkwkwk..', '..wwwwww..'], { w: '#fff2cf', k: '#8a1a1a' });
  BEST.mode = () => [
    ['insane', sprURL(SKULL), () => bCard({ name: 'Insane Mode', img: sprURL(SKULL), col: '#c8261a',
      tags: [bTag(insaneOn ? 'On' : 'Off', insaneOn ? '#c8261a' : '#7d7268'), bTag('Main menu', '#7d7268')],
      stats: 'Level-up cards ×2 · % cards compound · XP ×2 · gold ×2',
      desc: 'Switch it with the <b>Insane Mode</b> button next to Play; it applies to every save on this device. Level-up cards give double, and the percentage ones '
        + '(damage, fire rate, crit damage, speed, health, pickup range, XP, gold, range) <b>compound</b>: +20% then +20% makes +44%. '
        + '<b>Armor and regeneration cards stay exactly as normal</b>, and so do every shield and immortality effect, so nothing becomes unkillable. Monsters, bosses and prices are unchanged. Never applies in the Daily Challenge.' })],
    ['daily', sprURL(CROWN), () => bCard({ name: 'Daily Challenge', img: sprURL(CROWN), col: '#8b3fc8', tags: [bTag('10 minutes', '#8b3fc8'), bTag('Main menu', '#7d7268')],
      stats: 'Same rules for everyone today · its own leaderboard',
      desc: 'A fresh character with today\'s class and twists. Reach the highest stage you can in 10 minutes. Ascension, relics and Insane Mode don\'t carry in.' })],
  ];
  BEST_KIND.mode = 'mode';
  // anything owned on any save on this device counts as discovered
  function discoverOwned() {
    const saves = [S, ...[1, 2, 3].map(n => readSlot(n))].filter(Boolean);
    for (const d of saves) {
      for (const id in d.wOwn || {}) discover('weapon:' + id);
      for (const id in d.aOwn || {}) discover('armor:' + id);
      for (const id in d.relics || {}) if (d.relics[id]) discover('relic:' + id);
      for (const id in d.pets || {}) discover('pet:' + id);
    }
  }
  function renderBestiary() {
    discoverOwned();
    document.querySelectorAll('[data-best]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.best === bestTab)));
    const byClass = bestTab === 'weapon' || bestTab === 'armor', cb = $('bestClass');
    cb.hidden = !byClass;
    if (byClass) cb.innerHTML = CLASS_ORDER.map(id => `<button class="pbtn" type="button" data-bcls="${id}" aria-pressed="${id === bestCls}">${CLASSES[id].name}</button>`).join('');
    const kind = BEST_KIND[bestTab], list = BEST[bestTab](), found = list.filter(([id]) => SEEN.has(kind + ':' + id)).length;
    $('bestNote').textContent = bestTab === 'mode' ? 'The ways to play, and exactly what each one changes.' : adminOn ? `Admin tools are on: everything is revealed (${found} of ${list.length} discovered for real).`
      : `Discovered ${found} of ${list.length}.`;
    $('bestGrid').innerHTML = list.map(([id, img, card]) => known(kind, id) ? card() : unknownCard(img, BEST_HINT[bestTab])).join('');
  }
  $('bestTabs').addEventListener('click', e => { const b = e.target.closest('[data-best]'); if (b) { bestTab = b.dataset.best; renderBestiary(); $('mBest').scrollTop = 0; } });
  $('bestClass').addEventListener('click', e => { const b = e.target.closest('[data-bcls]'); if (b) { bestCls = b.dataset.bcls; renderBestiary(); } });
  $('mBestBtn').addEventListener('click', () => { if (S && CLASSES[S.cls]) bestCls = S.cls; showMenu('best'); });
  $('bestBack').addEventListener('click', () => showMenu('main'));
  // insane mode toggle on the main menu
  function syncInsane() {
    const b = $('mInsane');
    b.innerHTML = `INSANE MODE<small>${insaneOn ? 'ON' : 'OFF'}</small>`; b.setAttribute('aria-pressed', String(insaneOn));
  }
  $('mInsane').addEventListener('click', () => {
    insaneOn = !insaneOn;
    try { localStorage.setItem(INSANE_KEY, insaneOn ? '1' : '0'); } catch (e) {}
    syncInsane(); ST = stats(); sfx[insaneOn ? 'boss' : 'buy']();
  });
  syncInsane();
  $('mHowBtn').addEventListener('click', () => showMenu('how'));
  $('howBack').addEventListener('click', () => showMenu('main'));
  $('mLogout').addEventListener('click', () => { save(); showMenu('out'); });
  $('mLogin').addEventListener('click', () => showMenu('main'));
  $('setBack').addEventListener('click', () => { if (G.options) closeOptions(); else showMenu('main'); });
  $('setMain').addEventListener('click', () => { closeOptions(); showMenu('main'); });
  $('setAutoShoot').addEventListener('click', () => { S.autoShoot = !S.autoShoot; syncSettings(); save(); });
  // in-game options: the settings sheet over the frozen field (Esc, or the Options buttons)
  function openOptions() {
    if (G.menu || G.choosing || G.options) return;
    G.options = true; G.aim.down = false; keys.clear();
    $('menu').classList.add('ingame'); $('menu').hidden = false;
    for (const id of ['mMain', 'mOut', 'mSlots', 'mClass', 'mMapSel', 'mHow', 'mBest', 'mKeys', 'mBoard', 'mDialog', 'mAch', 'mDaily']) $(id).hidden = true;
    $('mSet').hidden = false; $('setTitle').textContent = 'Options'; $('setBack').textContent = 'Resume';
    syncSettings();
    try { $('setBack').focus({ preventScroll: true }); } catch (e) {}
  }
  function closeOptions() {
    G.options = false; rebind = null;
    $('menu').classList.remove('ingame'); $('menu').hidden = true; $('mKeys').hidden = true;
    $('setTitle').textContent = 'Settings'; $('setBack').textContent = 'Back';
    focusGame();
  }
  // Esc peels things off one at a time: admin panel, then the shop bar, then pause; only with nothing left open does it open Options
  function escapeLayer() {
    $('rtip').hidden = true;
    if (!$('adminPanel').hidden) { toggleAdmin(false); return; }
    if (!$('app').classList.contains('collapsed')) { setShop(false); return; }
    if (G.paused) { setPaused(false); return; }
    openOptions();
  }
  $('optBtn').addEventListener('click', openOptions);
  $('hudOpt').addEventListener('click', openOptions);
  $('setSound').addEventListener('click', () => { S.sound = !S.sound; syncSettings(); save(); });
  $('setMusic').addEventListener('click', () => {
    MUSIC.on = !MUSIC.on;
    try { localStorage.setItem(MUSIC_KEY, MUSIC.on ? '1' : '0'); } catch (e) {}
    syncSettings();
  });
  $('setShake').addEventListener('click', () => { S.shakeOn = !S.shakeOn; syncSettings(); save(); });
  $('setNums').addEventListener('click', () => { S.nums = !S.nums; syncSettings(); save(); });
  $('setVol').addEventListener('input', e => { S.vol = +e.target.value; save(); });
  function setZoom(d) {
    S.zoomAdj = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (S.zoomAdj || 0) + d));
    calcZoom(); syncSettings(); save();
  }
  $('zoomIn').addEventListener('click', () => setZoom(1));
  $('zoomOut').addEventListener('click', () => setZoom(-1));
  $('setVol').addEventListener('change', () => sfx.coin());
  $('menuBtn').addEventListener('click', () => showMenu('main'));

  // ---- save slots ----
  function timeAgo(t) {
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${s / 60 | 0} min ago`;
    if (s < 86400) return `${s / 3600 | 0} h ago`;
    return `${s / 86400 | 0} days ago`;
  }
  function renderSlots() {
    save(); // so the current slot shows up to date
    const list = $('slotList');
    list.innerHTML = '';
    for (let n = 1; n <= SLOTS; n++) {
      const cur = n === slot && slotLive, d = cur ? S : readSlot(n);
      const row = document.createElement('div');
      row.className = 'frame slot' + (cur ? ' active' : '');
      if (d) {
        const w = W(d.weapon) || WEAPONS[0], a = A(d.armor) || ARMORS[0];
        const item = (it, l) => `<b class="r" style="--r:${RARITY[it.r].c}">${it.name} · Lv ${l || 0}</b>`;
        row.innerHTML = `<div class="snum"><small>SLOT</small><b>${n}</b></div>
          <div class="sport"><canvas width="16" height="21"></canvas></div>
          <div class="sinfo">
            <div class="stitle">Level ${d.level} ${(CLASSES[d.cls] || CLASSES.ranger).name} ${cur ? '<span class="cur">Current</span>' : ''}<span class="when">${d.saved ? 'Saved ' + timeAgo(d.saved) : ''}</span></div>
            <div class="sgrid">
              <div>Gold<b>${fmt(d.gold)}</b></div>
              <div>XP<b>${fmt(d.xp)} / ${fmt(xpNeed(d.level))}</b></div>
              <div>Stage<b>${d.stage} <small>(best ${d.best})</small></b></div>
              <div>Monsters slain<b>${fmt(d.kills)}</b></div>
              <div class="wide">Weapon${item(w, (d.wOwn || {})[w.id])}</div>
              <div class="wide">Armor${item(a, (d.aOwn || {})[a.id])}</div>
            </div>
          </div>
          <div class="sacts">
            <button class="pbtn go" type="button" data-load="${n}">${cur ? 'Continue' : 'Load'}</button>
            <button class="pbtn del" type="button" data-del="${n}">Delete</button>
          </div>`;
        row.querySelector('canvas').getContext('2d').drawImage(hero(a, 'down', 'i0', false, true, d.cls).c, 0, 0);
      } else {
        row.innerHTML = `<div class="snum"><small>SLOT</small><b>${n}</b></div>
          <div class="sport empty">+</div>
          <div class="sinfo"><div class="stitle">Empty slot</div><div class="sempty">Start a fresh hunter here. Your other saves stay exactly as they are.</div></div>
          <div class="sacts"><button class="pbtn go" type="button" data-new="${n}">New game</button></div>`;
      }
      list.appendChild(row);
    }
  }
  function switchSlot(n, data, saveCurrent = true) {
    if (saveCurrent) save();
    const keep = { sound: S.sound, vol: S.vol, shakeOn: S.shakeOn, nums: S.nums, zoomAdj: S.zoomAdj, autoShoot: S.autoShoot }; // settings follow you between saves
    slot = n;
    S = Object.assign(data || freshSave(), keep);
    G.monsters = []; G.shots = []; G.eshots = []; G.bombs = []; G.drops = []; G.fx = []; G.texts = []; G.chests = []; G.buffs = {}; G.chestT = 12;
    G.minions = []; G.rains = []; G.invisT = 0; G.whirlT = 0; G.cd = { q: 0, e: 0 }; P.ambush = false; G.zones = []; G.strikes = []; G.bursts = []; G.darkT = 0; G.horde = null;
    G.boss = null; G.choosing = false; G.dead = 0; G.seen = new Set(); $('lvlOv').hidden = true;
    G.hazards = []; P.poison = null; P.slowT = 0;
    if (G.paused) setPaused(false);
    ST = stats(); P.hp = ST.maxHp; P.x = SPAWN.x; P.y = SPAWN.y; P.vx = P.vy = 0;
    slotLive = true;
    syncStage(); renderList(); syncSettings(); syncAdmin(); save();
  }
  let delArmed = null;
  $('slotList').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.load) { const n = +b.dataset.load; if (n !== slot) switchSlot(n, readSlot(n)); play(); }
    else if (b.dataset.new) startNewGame(+b.dataset.new);
    else if (b.dataset.del) {
      const n = +b.dataset.del;
      if (delArmed !== b) {
        delArmed = b; b.classList.add('armed'); b.textContent = 'Sure? Click again';
        setTimeout(() => { if (delArmed === b) { delArmed = null; b.classList.remove('armed'); b.textContent = 'Delete'; } }, 3000);
        return;
      }
      delArmed = null;
      try { localStorage.removeItem(slotKey(n)); } catch (e) {}
      if (n === slot) {
        // the save you were playing is gone: move to another save if there is one,
        // otherwise this slot stays empty until you press Play or New game
        const other = [1, 2, 3].find(k => k !== n && readSlot(k));
        if (other) switchSlot(other, readSlot(other), false);
        else { slotLive = false; switchSlot(n, null, false); slotLive = false; try { localStorage.removeItem(slotKey(n)); } catch (e) {} }
      }
      renderSlots();
      sfx.hurt();
    }
  });
  $('mLoad').addEventListener('click', () => showMenu('slots'));
  $('slotBack').addEventListener('click', () => showMenu('main'));

