  // ================= boot =================
  function start(data) {
    S = loadSave();
    if (data && data.save) { S = migrate(Object.assign(freshSave(), data.save)); slot = data.slot || slot; }
    if (!S.bonus) S.bonus = {};
    if (!adminOn) S.god = false;
    ST = stats();
    P.hp = ST.maxHp;
    G.cam.x = P.x - 200; G.cam.y = P.y - 150;
    $('soundBtn').setAttribute('aria-pressed', String(S.sound));
    syncStage(); renderList(); syncAdmin(); calcZoom();
    showMenu('main');
    try { window.claude?.hot?.snapshot?.(() => ({ save: S, slot })); } catch (e) {}

    setInterval(save, 5000);
    initNet();
    setInterval(() => postScore(), 30000);    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
    let last = performance.now(), hudAcc = 0;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (G.menu) renderMenu(now / 1000);
      else if (!ASCV.dark) { update(dt); render(); } // fully inside the Ascension screen: the field behind it is not drawn
      musicTick();
      hudAcc += dt;
      if (hudAcc > 0.12) { hudAcc = 0; hudTick(); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (window.claude?.hot?.ready) window.claude.hot.ready(start);
  else start(window.claude?.hot?.data ?? {});
