  // ================= input =================
  // ---- keybinds: every action maps to a physical key (e.code), saved per device; arrows always move as a backup ----
  const KEYS_KEY = 'gravefield-keys';
  const BIND_DEF = { up: 'KeyW', left: 'KeyA', down: 'KeyS', right: 'KeyD', q: 'KeyQ', e: 'KeyE', shop: 'KeyB', pause: 'KeyP', admin: 'Backquote', zoomIn: 'Equal', zoomOut: 'Minus' };
  const BIND_NAMES = { up: 'Move up', left: 'Move left', down: 'Move down', right: 'Move right', q: 'Class ability', e: 'Weapon skill', shop: 'Show / hide shop',
    pause: 'Pause', admin: 'Admin panel', zoomIn: 'Zoom in', zoomOut: 'Zoom out' };
  const BIND = Object.assign({}, BIND_DEF);
  try { Object.assign(BIND, JSON.parse(localStorage.getItem(KEYS_KEY)) || {}); } catch (e) {}
  const MOVE_OF = { up: 'w', left: 'a', down: 's', right: 'd' };
  const ARROWS = { ArrowUp: 'arrowup', ArrowDown: 'arrowdown', ArrowLeft: 'arrowleft', ArrowRight: 'arrowright' };
  const KEY_LABELS = { Backquote: '`', Equal: '=', Minus: '-', Space: 'Space', ShiftLeft: 'L Shift', ShiftRight: 'R Shift', ControlLeft: 'L Ctrl', ControlRight: 'R Ctrl',
    AltLeft: 'L Alt', AltRight: 'R Alt', Tab: 'Tab', CapsLock: 'Caps', Enter: 'Enter', Backspace: 'Bksp', BracketLeft: '[', BracketRight: ']', Semicolon: ';',
    Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
  function keyName(code) {
    if (!code) return '—';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    return KEY_LABELS[code] || code;
  }
  function actionOf(code) { for (const a in BIND) if (BIND[a] === code) return a; return null; }
  function syncKeyLabels() {
    $('abQ').querySelector('kbd').textContent = keyName(BIND.q);
    $('abE').querySelector('kbd').textContent = keyName(BIND.e);
    $('shopTab').title = `Hide or show the shop (${keyName(BIND.shop)})`;
  }
  let rebind = null; // the action waiting for its new key
  function renderKeys() {
    $('keyList').innerHTML = Object.keys(BIND_DEF).map(a =>
      `<div class="krow"><span>${BIND_NAMES[a]}</span><button class="pbtn${rebind === a ? ' listen' : ''}" type="button" data-bind="${a}">${rebind === a ? 'Press a key…' : keyName(BIND[a])}</button></div>`).join('');
  }
  function keyNote(text, warn) { $('keyNote').textContent = text; $('keyNote').classList.toggle('warn', !!warn); }
  function finishRebind(code) {
    const a = rebind; rebind = null;
    if (code === 'Escape') keyNote('Cancelled. Click a key, then press the new one.');
    else {
      const other = actionOf(code);
      if (other && other !== a) { BIND[other] = BIND[a]; keyNote(`${keyName(code)} was used by ${BIND_NAMES[other]}, so they swapped: ${BIND_NAMES[other]} is now ${keyName(BIND[other])}.`, true); }
      else keyNote(`${BIND_NAMES[a]} is now ${keyName(code)}.`);
      BIND[a] = code;
      try { localStorage.setItem(KEYS_KEY, JSON.stringify(BIND)); } catch (e) {}
    }
    keys.clear(); renderKeys(); syncKeyLabels();
    const b = $('keyList').querySelector(`[data-bind="${a}"]`);
    try { b.focus({ preventScroll: true }); } catch (e) {}
  }
  function showKeys(on) {
    rebind = null;
    $('mSet').hidden = on; $('mKeys').hidden = !on;
    if (on) { keyNote('Click a key, then press the new one. Esc cancels.'); renderKeys(); try { $('keyBack').focus({ preventScroll: true }); } catch (e) {} }
    else { syncSettings(); try { $('setKeys').focus({ preventScroll: true }); } catch (e) {} }
  }
  $('setKeys').addEventListener('click', () => showKeys(true));
  $('keyBack').addEventListener('click', () => showKeys(false));
  $('keyList').addEventListener('click', e => {
    const b = e.target.closest('button[data-bind]');
    if (!b) return;
    rebind = rebind === b.dataset.bind ? null : b.dataset.bind;
    keyNote(rebind ? `Press the new key for ${BIND_NAMES[rebind]}. Esc cancels.` : 'Click a key, then press the new one. Esc cancels.');
    renderKeys();
  });
  $('keyReset').addEventListener('click', () => {
    rebind = null; Object.assign(BIND, BIND_DEF);
    try { localStorage.removeItem(KEYS_KEY); } catch (e) {}
    keyNote('All keys are back to the defaults.'); renderKeys(); syncKeyLabels();
  });
  syncKeyLabels();

  addEventListener('keydown', e => {
    if (rebind) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) finishRebind(e.code); return; }
    if (e.target.closest && e.target.closest('input') && e.key !== 'Escape') return;
    const k = e.key.toLowerCase();
    if (G.hudEdit) { if (k === 'escape' && !e.repeat) closeHudEditor(); return; }
    if (G.ascend) { if (k === 'escape' && !e.repeat) closeAscend(); return; }
    if (G.intro) { if ((k === ' ' || k === 'enter' || k === 'escape') && !e.repeat) { e.preventDefault(); closeEliteIntro(); } return; }
    if (G.runOver && !G.options) { if ((k === 'enter' || k === ' ') && !e.repeat) { e.preventDefault(); rise(); } return; }
    if (G.options) { if (k === 'escape' && !e.repeat) { if (!$('mKeys').hidden) showKeys(false); else closeOptions(); } return; }
    if (G.menu) { if (k === 'escape') { if (!$('mKeys').hidden) showKeys(false); else if ($('mMain').hidden) showMenu('main'); } return; }
    if (G.choosing && ['1', '2', '3'].includes(k)) { choose(+k - 1); return; }
    const act = actionOf(e.code);
    if (act === 'admin') { if (!e.repeat) toggleAdmin(); return; }
    if (act === 'shop') { if (!e.repeat) setShop($('app').classList.contains('collapsed')); return; }
    if (act === 'q' || act === 'e') { if (!e.repeat) useAbility(act); return; }
    if (act === 'zoomIn' || e.code === 'NumpadAdd') { setZoom(1); return; }
    if (act === 'zoomOut' || e.code === 'NumpadSubtract') { setZoom(-1); return; }
    if (G.choosing) return;
    if (MOVE_OF[act]) { keys.add(MOVE_OF[act]); if (e.code === 'Space' || ARROWS[e.code]) e.preventDefault(); }
    else if (ARROWS[e.code]) { keys.add(ARROWS[e.code]); e.preventDefault(); }
    if (act === 'pause' && !e.repeat) setPaused(!G.paused);
    if (k === 'escape' && !e.repeat) escapeLayer();
  });
  addEventListener('keyup', e => {
    const act = actionOf(e.code);
    if (MOVE_OF[act]) keys.delete(MOVE_OF[act]);
    if (ARROWS[e.code]) keys.delete(ARROWS[e.code]);
  });

  // ---- HUD editor: drag any outlined piece; it pins to the nearest edges so it stays put when the window resizes ----
  const HUD_IDS = ['vitals', 'stageBar', 'hudGoldBox', 'buffs', 'toasts', 'abil', 'mmBox'];
  const TOP_BAR = ['vitals', 'stageBar', 'hudGoldBox'];
  function placeEl(el, L) {
    const st = el.style;
    if (!L) { el.classList.remove('hfree'); st.left = st.right = st.top = st.bottom = ''; return; }
    if (el.parentNode !== $('game')) $('game').appendChild(el);
    el.classList.add('hfree');
    st.left = L.h === 'l' ? L.x * 100 + '%' : 'auto'; st.right = L.h === 'r' ? L.x * 100 + '%' : 'auto';
    st.top = L.v === 't' ? L.y * 100 + '%' : 'auto'; st.bottom = L.v === 'b' ? L.y * 100 + '%' : 'auto';
  }
  function applyHud() {
    for (const id of HUD_IDS) placeEl($(id), HUD[id]);
    // top-bar pieces that were never moved go back into the bar, in their usual order
    const bar = document.querySelector('.hud');
    for (const id of TOP_BAR) if (!HUD[id]) bar.appendChild($(id));
  }
  function saveHud() { try { localStorage.setItem(HUD_KEY, JSON.stringify(HUD)); } catch (e) {} }
  function openHudEditor() {
    closeOptions();
    G.hudEdit = true; G.aim.down = false; keys.clear();
    $('rtip').hidden = true;
    $('app').classList.add('hudedit'); $('hudBar').hidden = false;
  }
  function closeHudEditor() {
    G.hudEdit = false; G.aim.down = false; hdrag = null;
    $('app').classList.remove('hudedit'); $('hudBar').hidden = true;
    focusGame();
  }
  $('setHud').addEventListener('click', openHudEditor);
  $('hudDone').addEventListener('click', closeHudEditor);
  $('hudReset').addEventListener('click', () => { HUD = {}; saveHud(); applyHud(); });
  let hdrag = null;
  $('game').addEventListener('pointerdown', e => {
    if (!G.hudEdit) return;
    const el = e.target.closest('.hudel');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    const r0 = el.getBoundingClientRect(), gr = $('game').getBoundingClientRect();
    // lift it out of the top bar where it is now, so it follows the pointer from the same spot
    if (el.parentNode !== $('game')) $('game').appendChild(el);
    el.classList.add('hfree', 'drag');
    el.style.left = r0.left - gr.left + 'px'; el.style.top = r0.top - gr.top + 'px'; el.style.right = el.style.bottom = 'auto';
    hdrag = { el, dx: e.clientX - r0.left, dy: e.clientY - r0.top, id: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  }, true);
  addEventListener('pointermove', e => {
    if (!hdrag || e.pointerId !== hdrag.id) return;
    const gr = $('game').getBoundingClientRect(), r = hdrag.el.getBoundingClientRect();
    hdrag.el.style.left = Math.max(0, Math.min(gr.width - r.width, e.clientX - gr.left - hdrag.dx)) + 'px';
    hdrag.el.style.top = Math.max(0, Math.min(gr.height - r.height, e.clientY - gr.top - hdrag.dy)) + 'px';
  });
  function endDrag(e) {
    if (!hdrag || e.pointerId !== hdrag.id) return;
    const el = hdrag.el, gr = $('game').getBoundingClientRect(), r = el.getBoundingClientRect();
    const x = r.left - gr.left, y = r.top - gr.top, W = gr.width, H = gr.height;
    const h = x + r.width / 2 < W / 2 ? 'l' : 'r', v = y + r.height / 2 < H / 2 ? 't' : 'b';
    HUD[el.id] = { h, x: (h === 'l' ? x : W - x - r.width) / W, v, y: (v === 't' ? y : H - y - r.height) / H };
    el.classList.remove('drag'); hdrag = null;
    placeEl(el, HUD[el.id]); saveHud();
  }
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  applyHud();
  addEventListener('blur', () => { keys.clear(); G.aim.down = false; });

  // the game sits in a frame: it must hold keyboard focus for WASD to arrive
