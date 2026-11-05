  // ================= HUD + shop =================
  const $ = id => document.getElementById(id);
  const ui = { tab: 'weapons' };
  // announcements, one at a time from a queue:
  // warn = true is the compact red strip under the HUD (bosses, hordes, waves), 'gold' the same strip for good finds (pets, relics);
  // otherwise the big centre banner
  const bannerQ = [];
  let bannerBusy = false, bannerTimer = 0;
  function banner(title, sub, warn = false, icon = null) {
    if (bannerQ.some(q => q.title === title)) return;
    bannerQ.push({ title, sub, warn, icon });
    if (bannerQ.length > 4) bannerQ.splice(0, bannerQ.length - 4); // never let a backlog build up
    if (!bannerBusy) nextBanner();
  }
  function nextBanner() {
    const b = $('banner'), q = bannerQ.shift();
    if (!q) { bannerBusy = false; return; }
    bannerBusy = true;
    b.className = 'frame banner' + (q.warn ? ' warn' : '') + (typeof q.warn === 'string' ? ' ' + q.warn : '');
    b.innerHTML = '';
    if (q.icon) { const i = document.createElement('img'); i.src = q.icon; i.alt = ''; b.append(i); }
    const t = document.createElement('div'); t.append(q.title);
    if (q.sub) { const s = document.createElement('small'); s.textContent = q.sub; t.append(s); }
    b.append(t);
    b.hidden = false; void b.offsetWidth; b.classList.add('show');
    clearTimeout(bannerTimer);
    // shorter when more are waiting, so a queue never drags on
    const stay = (q.warn ? 2300 : 2600) * (bannerQ.length ? 0.7 : 1);
    bannerTimer = setTimeout(() => {
      b.classList.remove('show');
      bannerTimer = setTimeout(() => { b.hidden = true; nextBanner(); }, 400);
    }, stay);
  }
  function clearBanners() { bannerQ.length = 0; clearTimeout(bannerTimer); bannerBusy = false; $('banner').classList.remove('show'); $('banner').hidden = true; }

  // corner notifications: { title, tip, col, icon (image URL) or letter }
  // they queue up too: a new one slides in at most every 0.6 s, with no more than 3 on screen
  const toastQ = [];
  let toastAt = 0, toastWait = 0;
  function toast(f) { toastQ.push(f); pumpToasts(); }
  function pumpToasts() {
    if (!toastQ.length || toastWait) return;
    const box = $('toasts'), now = performance.now(), live = box.querySelectorAll('.toast:not(.out)').length;
    if (live >= 3 || now < toastAt) { toastWait = setTimeout(() => { toastWait = 0; pumpToasts(); }, Math.max(150, toastAt - now)); return; }
    toastAt = now + 600;
    const f = toastQ.shift(), el = document.createElement('div');
    el.className = 'frame toast';
    el.style.setProperty('--r', f.col);
    const ic = f.icon ? `<i class="ti img"><img src="${f.icon}" alt=""></i>` : `<i class="ti">${f.letter || f.title[0]}</i>`;
    el.innerHTML = `${ic}<div><b>${f.title}</b><small>${f.tip}</small></div>`;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 4200);
    setTimeout(() => { el.remove(); pumpToasts(); }, 4750);
    pumpToasts();
  }

  function syncStage() {
    applyBiome(!!G.played && !G.menu);
    $('stageTxt').textContent = 'Stage ' + S.stage;
    $('bestTxt').textContent = 'Best ' + S.best;
    $('stPrev').disabled = S.stage <= 1;
    $('stNext').disabled = S.stage >= S.best;
    $('autoChk').checked = S.auto;
    $('adminStage').textContent = `now ${S.stage}, best ${S.best}`;
    renderMapRow();
  }

  // ---- elite introductions: one card at a time, whenever nothing else has the screen ----
  let introAt = 0;
  function showEliteIntro() {
    const { f, spr } = eliteQ.shift();
    G.intro = true; G.aim.down = false; keys.clear(); introAt = performance.now();
    $('eliteCard').style.setProperty('--r', f.col);
    $('eliteName').textContent = f.name;
    $('eliteTip').textContent = `A ${f.name.toLowerCase()} monster ${f.tip}.`;
    $('eliteHow').textContent = f.how || '';
    const c = $('eliteCv'), g = c.getContext('2d'), k = Math.floor(80 / Math.max(spr.w, spr.h));
    g.clearRect(0, 0, 96, 96); g.imageSmoothingEnabled = false;
    g.drawImage(spr.c, Math.round(48 - spr.w * k / 2), Math.round(90 - spr.h * k), spr.w * k, spr.h * k);
    const card = $('eliteCard'); card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    $('eliteOv').hidden = false;
    tone('elite1', 220, 0.25, 'square', 0.04, 0, 0); setTimeout(() => tone('elite2', 330, 0.35, 'square', 0.04, 0, 0), 140);
    try { $('eliteOk').focus({ preventScroll: true }); } catch (e) {}
  }
  function closeEliteIntro() {
    if (!G.intro || performance.now() - introAt < 400) return; // a held key or a stray click can't skip it instantly
    G.intro = false; $('eliteOv').hidden = true; G.aim.down = false; save(); focusGame();
  }
  document.getElementById('eliteOk').addEventListener('click', closeEliteIntro);
  function hudTick() {
    if (eliteQ.length && !G.intro && !G.choosing && !G.menu && !G.ascend && !G.runOver && !G.options && !G.paused && !G.hudEdit && G.dead <= 0) showEliteIntro();
    $('hpFill').style.width = (P.hp / ST.maxHp * 100).toFixed(1) + '%';
    $('hpTxt').textContent = fmt(Math.ceil(P.hp)) + '/' + fmt(ST.maxHp);
    $('lvTxt').textContent = S.level;
    $('xpFill').style.width = Math.min(100, S.xp / xpNeed(S.level) * 100).toFixed(1) + '%';
    $('xpTxt').textContent = fmt(S.xp) + '/' + fmt(xpNeed(S.level));
    const bar = $('stageBar');
    $('timerTxt').textContent = S.daily ? 'Daily ' + fmtTime(Math.max(0, DAILY_TIME - (S.time || 0))) : fmtTime(S.time || 0);
    if (G.horde) {
      const h = G.horde, remaining = G.monsters.length + h.left;
      bar.classList.add('boss');
      $('sbLabel').textContent = h.wave ? `Horde · Wave ${h.wave}/${HORDE_WAVES}` : 'Horde incoming';
      $('sbCount').textContent = h.wave ? `${remaining} left` : '';
      $('progFill').style.width = (((Math.max(0, h.wave - 1)) + (h.wave ? 1 - remaining / h.total : 0)) / HORDE_WAVES * 100).toFixed(1) + '%';
    } else if (G.boss) {
      bar.classList.add('boss');
      $('sbLabel').textContent = G.boss.d.name + ' King';
      $('sbCount').textContent = fmt(Math.max(0, G.boss.hp)) + ' HP';
      $('progFill').style.width = (Math.max(0, G.boss.hp) / G.boss.max * 100).toFixed(1) + '%';
    } else {
      bar.classList.remove('boss');
      const n = need(S.stage), full = S.progress >= n;
      $('sbLabel').textContent = 'Stage ' + S.stage + (full && !S.auto ? ' · farming' : '');
      $('sbCount').textContent = full ? (S.auto ? 'Boss incoming' : 'Turn on Auto-advance for the boss') : `${S.progress} / ${n}`;
      $('progFill').style.width = Math.min(100, S.progress / n * 100) + '%';
    }
    $('goldTxt').textContent = fmt(S.gold);
    $('hudGold').textContent = fmt(S.gold);
    $('pill-relics').hidden = !(S.relicNew && ui.tab !== 'relics');
    $('insTag').hidden = !insane();
    $('app').classList.toggle('nohud', !!(MAPS[curMap] && MAPS[curMap].id === 'backrooms' && !G.menu));
    const aLeft = ascPts() - ascSpent(), ab = $('ascBtn');
    ab.hidden = !!S.daily || !!G.menu; ab.classList.toggle('ready', aLeft > 0);
    $('ascPts').textContent = aLeft; $('ascPts').classList.toggle('none', aLeft <= 0);
    // Q / E ability buttons: icon, lock, cooldown sweep
    for (const key of ['q', 'e']) {
      const el = $('ab' + key.toUpperCase()), ab = abilityOf(key), cd = ab ? G.cd[key] : 0;
      const item = key === 'q' ? A(S.armor) : W(S.weapon), sig = item.id + (ab ? ':' + ab.id : '');
      if (el.dataset.ab !== sig) {
        el.dataset.ab = sig;
        el.querySelector('img').src = key === 'q' ? armorIconURL(item) : weaponIconURL(item);
        el.style.setProperty('--r', RARITY[item.r].c);
        el.classList.toggle('locked', !ab);
      }
      el.title = ab ? `${key.toUpperCase()} · ${ab.name} (${ab.cd}s): ${ab.desc} (from your ${item.name})`
        : key === 'q' ? 'Q · No skill yet. Your third armor and every one after it has a Q armor skill.'
        : 'E · No skill yet. Every weapon above Common has an E weapon skill.';
      el.setAttribute('aria-label', el.title);
      el.querySelector('.cdov').style.height = ab && cd > 0 ? (cd / ab.cd * 100).toFixed(0) + '%' : '0';
      el.querySelector('.cdt').textContent = cd > 0 ? Math.ceil(cd) : '';
      if (el.dataset.cdWas > 0 && !(cd > 0)) { el.classList.remove('ready'); void el.offsetWidth; el.classList.add('ready'); }
      el.dataset.cdWas = cd;
    }
    // active power-ups with draining timers
    const ids = Object.keys(G.buffs).filter(k => G.buffs[k] > 0), box = $('buffs');
    if (box.dataset.ids !== ids.join()) {
      box.dataset.ids = ids.join();
      box.innerHTML = ids.map(id => { const p = POWERS.find(x => x.id === id); return `<div class="buff" data-id="${id}" style="--r:${p.col}" title="${p.name}"><img src="${iconURL('p:' + id)}" alt="${p.name}"><i></i></div>`; }).join('');
    }
    for (const el of box.children) {
      const id = el.dataset.id, left = G.buffs[id] || 0;
      el.querySelector('i').style.width = (left / (G.buffMax[id] || left || 1) * 100).toFixed(0) + '%';
      el.classList.toggle('ending', left < 2);
    }
    $('killsTxt').textContent = fmt(S.kills) + ' monsters slain';
    $('statsBox').innerHTML =
      `<div>DMG <b>${fmtD(ST.dmg)}</b></div><div>Rate <b>${ST.rate.toFixed(1)}/s</b></div><div>Shots <b>${ST.shots}</b></div>` +
      `<div>HP <b>${fmt(ST.maxHp)}</b></div><div>Armor <b>${fmt(ST.def)}</b></div><div>Crit <b>${Math.round(ST.crit * 100)}%</b></div>` +
      `<div>Crit dmg <b>${Math.round(ST.critMul * 100)}%</b></div><div>Pierce <b>${ST.pierce}</b></div><div>Speed <b>${Math.round(ST.speed / 70 * 100)}%</b></div>`;
    document.querySelectorAll('#list button.buy').forEach(b => { b.disabled = S.gold < +b.dataset.cost; });
    const CW = classItems(WEAPONS, S.cls), CA = classItems(ARMORS, S.cls), wn = nextIdx(CW, S.wOwn), an = nextIdx(CA, S.aOwn);
    $('pill-weapons').hidden = !CW.some((w, i) => S.wOwn[w.id] == null ? i === wn && S.gold >= w.cost : (w.id === S.weapon && S.wOwn[w.id] < MAX_ITEM_LV && S.gold >= itemUpCost(w, S.wOwn[w.id])));
    $('pill-armor').hidden = !CA.some((a, i) => S.aOwn[a.id] == null ? i === an && S.gold >= a.cost : (a.id === S.armor && S.aOwn[a.id] < MAX_ITEM_LV && S.gold >= itemUpCost(a, S.aOwn[a.id])));
  }

  const buyBtn = (id, act, itemId, cost, label) =>
    `<button class="pbtn buy" type="button" id="${id}" data-act="${act}" data-id="${itemId}" data-cost="${cost}"><i class="coin"></i>${fmt(cost)}${label ? ' ' + label : ''}</button>`;

  function itemRow(it, kind, owned, l, eq, statsHtml, iconHtml) {
    const R = RARITY[it.r], pre = kind;
    let act;
    if (!owned) act = buyBtn(`b-${pre}b-${it.id}`, pre + 'buy', it.id, it.cost, 'Buy');
    else {
      act = eq ? '<span class="tag">Equipped</span>' : `<button class="pbtn eq" type="button" id="b-${pre}e-${it.id}" data-act="${pre}equip" data-id="${it.id}">Equip</button>`;
      act += l >= MAX_ITEM_LV ? '<span class="maxed">MAX</span>' : buyBtn(`b-${pre}u-${it.id}`, pre + 'up', it.id, itemUpCost(it, l), 'Up');
    }
    return `<div class="item${eq ? ' equipped' : ''}" style="--r:${R.c}"><div class="ic">${iconHtml}</div><div class="txt">
      <div class="nm">${it.name} <span class="rar">${R.name}</span>${owned ? ` <span class="lv">Lv ${l}/${MAX_ITEM_LV}</span>` : ''}</div>
      <div class="ds">${it.desc}</div>
      <div class="fx">${statsHtml}</div></div>
      <div class="act">${act}</div></div>`;
  }

  // the shop reveals one item at a time: everything you own, plus the next one to buy
  const nextIdx = (items, own) => { const i = items.findIndex(it => own[it.id] == null); return i < 0 ? items.length : i; };
  const lockedRow = (left, noun, next) => left > 0
    ? `<div class="item locked"><div class="ic">?</div><div class="txt"><div class="nm">${left} more ${noun}${left > 1 ? 's' : ''}</div><div class="ds">Buy the ${next.name} to reveal the next one.</div></div></div>`
    : '';
  function relicText(r, n) {
    // undiscovered relics keep their secret: only the silhouette and a question mark
    if (!n) return `<span class="unknown">?</span><em style="color:var(--ink-soft);text-align:center">Find it in a chest to learn what it does</em>`;
    const tot = Math.round(r.per * n * 100) / 100;
    return `<b>${r.name}</b>+${r.per}${r.unit} each.<em>You have ${n}: +${tot}${r.unit}</em>`;
  }
  function renderRelics(list) {
    const total = RELICS.reduce((s, r) => s + ((S.relics || {})[r.id] || 0), 0), pets = S.pets || {}, nPets = PETS.filter(p => pets[p.id] != null).length;
    const petHtml = `<div class="rsum">Pets · ${nPets} / ${PETS.length} found</div><div class="pets">${PETS.map(p => {
      if (pets[p.id] == null) return '<div class="pet none"><i>?</i><small>Golden chests hide pets</small></div>';
      const lv = petLv(p.id), on = S.pet === p.id;
      return `<button class="pet${on ? ' on' : ''}" type="button" data-act="pet" data-id="${p.id}" style="--r:${p.col}"><img src="${p.spr.c.toDataURL()}" alt="">
        <b>${p.name} <span>Lv ${lv}${lv >= PET_MAX ? ' MAX' : ''}</span></b><small>${p.tip(lv)}</small><em>${on ? 'With you · click to send home' : 'Click to bring along'}</em></button>`;
    }).join('')}</div>`;
    list.innerHTML = petHtml + `<div class="rsum">${total} relic${total === 1 ? '' : 's'} found</div>
      <div class="relics">${RELICS.map(r => {
        const n = (S.relics || {})[r.id] || 0;
        return `<button class="relic ${n ? '' : 'none'}" type="button" data-relic="${r.id}" style="--r:${r.col}" aria-label="${n ? `${r.name}, ${n} found: +${r.per}${r.unit} each` : 'Undiscovered relic'}">
          <img src="${iconURL('r:' + r.id)}" alt="">${n ? `<span class="cnt">×${n}</span>` : ''}</button>`;
      }).join('')}</div>
      <p class="rnote">Relics are permanent and stack. Every chest has a 5% chance to hold one (20% for a boss's golden chest).</p>`;
  }
  // relic hover / focus card, positioned next to the square
  function showRelicTip(btn) {
    const r = RELICS.find(x => x.id === btn.dataset.relic), tip = $('rtip');
    tip.innerHTML = relicText(r, (S.relics || {})[r.id] || 0);
    tip.hidden = false;
    const b = btn.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, b.left + b.width / 2 - w / 2)) + 'px';
    tip.style.top = (b.top - h - 8 > 8 ? b.top - h - 8 : b.bottom + 8) + 'px';
  }
  $('list').addEventListener('pointerover', e => { const b = e.target.closest('.relic'); if (b) showRelicTip(b); });
  $('list').addEventListener('pointerout', e => { if (e.target.closest('.relic')) $('rtip').hidden = true; });
  $('list').addEventListener('focusin', e => { const b = e.target.closest('.relic'); if (b) showRelicTip(b); });
  $('list').addEventListener('focusout', () => { $('rtip').hidden = true; });
  $('list').addEventListener('scroll', () => { $('rtip').hidden = true; });

  // a new run: keeps relics, pets, Ascension and the all-time best; everything else, library books included, starts over
  function resetRun() {
    const w0 = classItems(WEAPONS, S.cls)[0], a0 = classItems(ARMORS, S.cls)[0];
    S.bestEver = bestOf(S);
    Object.assign(S, { gold: 0, xp: 0, level: 1, pending: 0, bonus: {}, stage: 1, best: 1, progress: 0, auto: true,
      weapon: w0.id, wOwn: { [w0.id]: 0 }, armor: a0.id, aOwn: { [a0.id]: 0 }, books: {} });
  }

  function renderList() {
    const list = $('list');
    let html = '';
    if (ui.tab !== 'weapons' && ui.tab !== 'armor' && ui.tab !== 'relics') ui.tab = 'weapons'; // old Talents/Souls tabs are gone
    if (ui.tab === 'relics') { renderRelics(list); hudTick(); return; }
    const C = CLASSES[S.cls];
    html += `<div class="clsbar" style="--r:${C.col}"><b>${C.name}</b><span>${C.role}</span></div>`;
    if (ui.tab === 'weapons') {
      const ws = classItems(WEAPONS, S.cls), ni = nextIdx(ws, S.wOwn);
      // everything you own, plus the next one to buy (older saves may own weapons above a new, cheaper one)
      for (const w of ws.filter((w, i) => S.wOwn[w.id] != null || i === ni)) {
        const owned = S.wOwn[w.id] != null, l = S.wOwn[w.id] || 0, v = weaponAt(w, l), nx = weaponAt(w, l + 1);
        const extra = [w.reach ? `reach ${w.reach}` : '', w.multi ? `${w.multi + 1} at once` : '', w.pierce ? `pierce ${w.pierce}` : '', w.splash ? 'splash' : '',
          w.chain ? `chains ${w.chain}` : '', w.crit ? `+${w.crit}% crit` : '', w.minions ? `${w.minions} minions` : ''].filter(Boolean).join(' · ');
        const st = `${fmtD(v.dmg)} dmg · ${v.rate.toFixed(1)}/s${extra ? ' · ' + extra : ''}${owned && l < MAX_ITEM_LV ? ` → <b>${fmtD(nx.dmg)} dmg</b>` : ''}`;
        const sk = w.skill ? `<div class="settag">E skill · <b>${w.skill.name}</b> (${w.skill.cd}s): ${w.skill.desc}</div>` : '<div class="settag">No E skill. Every weapon above Common has one.</div>';
        html += itemRow(w, 'w', owned, l, S.weapon === w.id, st + sk, `<canvas width="16" height="16" data-weapon="${w.art || w.shot}"></canvas>`);
      }
      html += lockedRow(ws.filter((w, i) => i > ni && S.wOwn[w.id] == null).length, 'weapon', ws[ni]);
    } else {
      const as = classItems(ARMORS, S.cls), ni = nextIdx(as, S.aOwn);
      const bonusTxt = b => Object.entries(b || {}).filter(([, v]) => v).map(([k, v]) => `+${v}% ${{ dmg: 'damage', rate: 'fire rate', crit: 'crit', speed: 'speed', minion: 'minion damage' }[k]}`).join(' · ');
      for (const a of as.slice(0, ni + 1)) {
        const owned = S.aOwn[a.id] != null, l = S.aOwn[a.id] || 0, v = armorAt(a, l), nx = armorAt(a, l + 1), bt = bonusTxt(a.bonus);
        const st = `${fmt(v.hp)} HP · ${fmt(v.def)} armor${bt ? ' · ' + bt : ''}${owned && l < MAX_ITEM_LV ? ` → <b>${fmt(nx.hp)} HP · ${fmt(nx.def)}</b>` : ''}`;
        const sk = a.skill ? `<div class="settag">Q skill · <b>${a.skill.name}</b> (${a.skill.cd}s): ${a.skill.desc}</div>` : '<div class="settag">No Q skill. Armor from the third one on has one.</div>';
        html += itemRow(a, 'a', owned, l, S.armor === a.id, st + sk, `<canvas width="21" height="21" data-armor="${a.id}"></canvas>`);
      }
      html += lockedRow(as.length - ni - 1, 'armor', as[ni]);
    }
    list.innerHTML = html;
    list.querySelectorAll('canvas[data-weapon]').forEach(c => {
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.save(); g.translate(3, 12); g.rotate(-Math.PI / 4); g.scale(0.8, 0.8); drawWeapon(g, c.dataset.weapon); g.restore();
    });
    list.querySelectorAll('canvas[data-armor]').forEach(c => { c.getContext('2d').drawImage(hero(A(c.dataset.armor), 'down', 'i0', false).c, 2, 0); });
    hudTick();
  }

  $('list').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    if (b.dataset.act === 'pet') {
      const hpWas = ST.maxHp;
      S.pet = b.dataset.id === S.pet ? null : b.dataset.id; G.pet.x = P.x; G.pet.y = P.y;
      sfx.buy(); ST = stats(); P.hp = Math.min(ST.maxHp, P.hp / hpWas * ST.maxHp);
      save(); renderList(); return;
    }
    const id = b.dataset.id, before = stats().maxHp;
    const pay = cost => { if (S.gold < cost) return false; S.gold -= cost; return true; };
    switch (b.dataset.act) {
      case 'wbuy': { const w = W(id); if (!pay(w.cost)) return; S.wOwn[id] = 0; S.weapon = id; break; }
      case 'wequip': S.weapon = id; break;
      case 'wup': { const w = W(id); if (!pay(itemUpCost(w, S.wOwn[id]))) return; S.wOwn[id]++; break; }
      case 'abuy': {
        const a = A(id); if (!pay(a.cost)) return; S.aOwn[id] = 0; S.armor = id;
        break;
      }
      case 'aequip': S.armor = id; break;
      case 'aup': { const a = A(id); if (!pay(itemUpCost(a, S.aOwn[id]))) return; S.aOwn[id]++; break; }
    }
    sfx.buy();
    ST = stats();
    if (G.dead <= 0) P.hp = Math.min(ST.maxHp, P.hp / before * ST.maxHp);
    save(); renderList();
  });

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    ui.tab = t.dataset.tab;
    if (ui.tab === 'relics' && S.relicNew) { S.relicNew = false; save(); }
    document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', String(x === t)));
    renderList();
  }));
  $('stPrev').addEventListener('click', () => changeStage(S.stage - 1));
  // map picker: Auto rotates every 5 stages, or stay on the map you choose
  const MAP_SHORT = { field: 'Field', cemetery: 'Cemetery', castle: 'Castle', library: 'Library', market: 'Mart', backrooms: 'Backrooms' };
  function renderMapRow() {
    const cur = S.mapPick || 'auto';
    $('mapRow').innerHTML = [{ id: 'auto', col: '#f2f2f2', name: 'Auto: a new map every 5 stages' }, ...MAPS].map(m =>
      `<button class="pbtn mapchip" type="button" role="radio" data-map="${m.id}" aria-checked="${cur === m.id}" title="${m.id === 'auto' ? m.name : m.name + '. ' + m.tip}" style="--m:${m.col}"><i></i><span>${m.id === 'auto' ? 'Auto' : MAP_SHORT[m.id]}</span></button>`).join('');
  }
  $('mapRow').addEventListener('click', e => {
    const b = e.target.closest('[data-map]');
    if (!b || G.runOver) return;
    const id = b.dataset.map === 'auto' ? undefined : b.dataset.map;
    if (id === S.mapPick) return;
    S.mapPick = id; S.progress = 0;
    save(); syncStage(); focusGame();
  });
  $('stNext').addEventListener('click', () => changeStage(S.stage + 1));
  $('autoChk').addEventListener('change', e => { S.auto = e.target.checked; save(); });

  function setPaused(p) {
    G.paused = p;
    G.aim.down = false;
    $('pauseBtn').textContent = p ? 'Resume' : 'Pause';
    $('pausedOv').hidden = !p;
  }
  $('pauseBtn').addEventListener('click', () => setPaused(!G.paused));
  $('soundBtn').addEventListener('click', () => { S.sound = !S.sound; syncSettings(); save(); });

  // ---- retractable shop: remembered per browser ----
  const SHOP_KEY = 'gravefield-shop-hidden';
  function setShop(open) {
    $('app').classList.toggle('collapsed', !open);
    $('shopTab').textContent = open ? 'Shop ▸' : '◂ Shop';
    $('shopTab').setAttribute('aria-expanded', String(open));
    try { localStorage.setItem(SHOP_KEY, open ? '0' : '1'); } catch (e) {}
    if (open) renderList();
    hudTick();
  }
  $('shopTab').addEventListener('click', () => setShop($('app').classList.contains('collapsed')));
  $('abQ').addEventListener('click', () => useAbility('q'));
  $('abE').addEventListener('click', () => useAbility('e'));
  $('hudMenu').addEventListener('click', () => showMenu('main'));
  try { if (localStorage.getItem(SHOP_KEY) === '1') $('app').classList.add('collapsed'); } catch (e) {}

  // ---- admin panel ----
  function parseAmount(s) {
    const m = String(s).trim().toLowerCase().replace(/,/g, '').match(/^(\d*\.?\d+)\s*([kmb])?$/);
    if (!m) return 0;
    return parseFloat(m[1]) * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1);
  }
  function syncAdmin() {
    $('godBtn').textContent = S.god ? 'On' : 'Off';
    $('godBtn').setAttribute('aria-pressed', String(!!S.god));
    document.body.classList.toggle('god', !!S.god);
    $('adminStage').textContent = `now ${S.stage}, best ${S.best}`;
  }
  // jump to any stage; going past your best unlocks it
  function adminStage(s) {
    s = Math.max(1, Math.min(9999, Math.round(s) || 1));
    S.best = Math.max(S.best, s);
    changeStage(s);
    banner(`Stage ${s}`, 'Jumped here from the admin panel');
    syncAdmin();
  }
  // admin tools are off until switched on in Settings; using them marks the save
  const ADMIN_KEY = 'gravefield-admin';
  let adminOn = false;
  try { adminOn = localStorage.getItem(ADMIN_KEY) === '1'; } catch (e) {}
  $('adminBtn').hidden = !adminOn;
  let adminArmed = false;
  $('setAdmin').addEventListener('click', () => {
    if (!adminOn && !adminArmed) {
      adminArmed = true; $('adminNote').hidden = false; $('setAdmin').textContent = 'Sure?';
      setTimeout(() => { adminArmed = false; $('adminNote').hidden = true; syncSettings(); }, 5000);
      return;
    }
    adminArmed = false; adminOn = !adminOn; $('adminNote').hidden = true;
    try { localStorage.setItem(ADMIN_KEY, adminOn ? '1' : '0'); } catch (e) {}
    if (!adminOn) { toggleAdmin(false); S.god = false; syncAdmin(); }
    syncSettings();
  });
  const BAL_NAMES = { hp: 'Monster health', dmg: 'Monster damage', boss: 'Boss health', spawn: 'Spawn rate', elite: 'Elite chance', gold: 'Gold gain', xp: 'XP gain' };
  function renderBal() {
    $('balList').innerHTML = Object.keys(BAL_DEF).map(k =>
      `<label>${BAL_NAMES[k]} <b data-bv="${k}">${BAL[k].toFixed(2)}×</b><input type="range" min="0.25" max="4" step="0.05" value="${BAL[k]}" data-bal="${k}" aria-label="${BAL_NAMES[k]}"></label>`).join('');
  }
  $('balList').addEventListener('input', e => {
    const k = e.target.dataset.bal;
    if (!k) return;
    BAL[k] = +e.target.value;
    $('balList').querySelector(`[data-bv="${k}"]`).textContent = BAL[k].toFixed(2) + '×';
    try { localStorage.setItem(BAL_KEY, JSON.stringify(BAL)); } catch (err) {}
  });
  $('balReset').addEventListener('click', () => { Object.assign(BAL, BAL_DEF); try { localStorage.removeItem(BAL_KEY); } catch (e) {} renderBal(); });
  renderBal();
  function toggleAdmin(open = $('adminPanel').hidden) {
    if (open && (!adminOn || S.daily)) return;
    if (open && !S.cheated) {
      S.cheated = true; save();
      toast({ title: 'Admin used', tip: 'This save is now marked: no online scores or achievements.', col: '#e5484d', letter: 'A' });
    }
    $('adminPanel').hidden = !open;
    $('adminBtn').setAttribute('aria-expanded', String(open));
    if (open) syncAdmin(); else focusGame();
  }
  function addGold(v) {
    if (!(v > 0)) return;
    S.gold += v; sfx.coin(); save(); renderList(); hudTick();
    G.texts.push({ x: P.x, y: P.y - 26, s: '+' + fmt(v) + ' gold', crit: true, t: 1 });
  }
  function addXp(v) {
    if (!(v > 0)) return;
    S.xp += v; sfx.gem();
    while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; S.pending++; }
    save(); hudTick();
    if (S.pending > 0 && !G.choosing && !G.menu) openLevelUp();
  }
  $('adminBtn').addEventListener('click', () => toggleAdmin());
  $('adminClose').addEventListener('click', () => toggleAdmin(false));
  $('godBtn').addEventListener('click', () => { S.god = !S.god; if (S.god) P.hp = ST.maxHp; syncAdmin(); save(); });
  // admin: switch the Backrooms' darkness off to see the whole map (not saved; only while admin tools are on)
  $('seeAllBtn').addEventListener('click', () => {
    G.seeAll = !G.seeAll;
    $('seeAllBtn').textContent = G.seeAll ? 'On' : 'Off'; $('seeAllBtn').setAttribute('aria-pressed', String(G.seeAll));
  });
  $('goldAdd').addEventListener('click', () => addGold(parseAmount($('goldAmt').value)));
  $('xpAdd').addEventListener('click', () => addXp(parseAmount($('xpAmt').value)));
  $('goldAmt').addEventListener('keydown', e => { if (e.key === 'Enter') addGold(parseAmount(e.target.value)); });
  $('xpAmt').addEventListener('keydown', e => { if (e.key === 'Enter') addXp(parseAmount(e.target.value)); });
  $('stageGo').addEventListener('click', () => adminStage(parseAmount($('stageAmt').value)));
  $('stageAmt').addEventListener('keydown', e => { if (e.key === 'Enter') adminStage(parseAmount(e.target.value)); });
  $('adminPanel').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.gold) addGold(+b.dataset.gold);
    if (b.dataset.st) adminStage(S.stage + +b.dataset.st);
    if (b.dataset.chest) spawnChest(P.x + (P.flip ? -28 : 28), P.y + 4, b.dataset.chest === '1');
    if (b.dataset.lv) {
      // exactly enough XP to go up that many levels
      let need = xpNeed(S.level) - S.xp;
      for (let i = 1; i < +b.dataset.lv; i++) need += xpNeed(S.level + i);
      addXp(Math.max(1, Math.ceil(need)));
    }
  });

  let resetArmed = 0;
  $('resetBtn').addEventListener('click', () => {
    const b = $('resetBtn');
    if (!resetArmed) {
      b.classList.add('armed'); b.textContent = 'Click again to erase everything';
      resetArmed = setTimeout(() => { resetArmed = 0; b.classList.remove('armed'); b.textContent = 'Reset progress'; }, 3500);
      return;
    }
    clearTimeout(resetArmed); resetArmed = 0;
    b.classList.remove('armed'); b.textContent = 'Reset progress';
    S = Object.assign(freshClassSave(S.cls), { sound: S.sound, vol: S.vol, shakeOn: S.shakeOn, nums: S.nums, zoomAdj: S.zoomAdj, autoShoot: S.autoShoot }); save();
    G.monsters = []; G.shots = []; G.eshots = []; G.bombs = []; G.drops = []; G.boss = null; G.choosing = false; $('lvlOv').hidden = true;
    ST = stats(); P.hp = ST.maxHp; P.x = SPAWN.x; P.y = SPAWN.y;
    syncStage(); renderList(); syncAdmin();
    banner('A fresh start', 'Everything has been reset');
  });

