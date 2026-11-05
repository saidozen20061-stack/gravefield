  // ================= weapons + projectiles =================
  // weapon art: each weapon names an art key; keys share a drawing family with its own colours and sizes
  const ART = {
    pebble: { fam: 'pebble', tip: 7 }, arrow: { fam: 'arrow', tip: 7 }, bolt: { fam: 'bolt', tip: 8 }, ball: { fam: 'ball', tip: 9 },
    fire: { fam: 'fire', tip: 10 }, spark: { fam: 'spark', tip: 12 }, cannon: { fam: 'cannon', tip: 11 },
    longbow: { fam: 'arrow', tip: 9, big: 1.25, wood: '#5a8a3a' }, starbow: { fam: 'arrow', tip: 10, big: 1.35, wood: '#e0c050' },
    club: { fam: 'club', tip: 10 }, sword: { fam: 'sword', tip: 14, len: 13, col: '#c9ced2' }, axe: { fam: 'axe', tip: 11 }, hammer: { fam: 'hammer', tip: 12 },
    gsword: { fam: 'sword', tip: 17, len: 16, col: '#e8eef2', wide: 1.3 }, fsword: { fam: 'sword', tip: 17, len: 16, col: '#ff9a3c', wide: 1.3, glow: '#ffd25a' },
    ksword: { fam: 'sword', tip: 19, len: 18, col: '#fff2a0', wide: 1.5, glow: '#ffffff' },
    appr: { fam: 'wand', tip: 9, gem: '#c78cff' }, frost: { fam: 'staff', tip: 12, gem: '#9fe0ff' }, arcane: { fam: 'staff', tip: 12, gem: '#c78cff', orb: 1 },
    stars: { fam: 'staff', tip: 12, gem: '#ffe04a', orb: 1 }, void: { fam: 'staff', tip: 12, gem: '#3a1a5a', orb: 1, glow: '#c78cff' },
    knife: { fam: 'knife', tip: 6, col: '#c9ced2' }, kunai: { fam: 'knife', tip: 6, col: '#7d868e' }, fang: { fam: 'knife', tip: 7, col: '#a06ad0' }, night: { fam: 'knife', tip: 7, col: '#3a3a4a', glow: '#c78cff' },
    star: { fam: 'starw', tip: 6, col: '#c9ced2' }, reaper: { fam: 'starw', tip: 6, col: '#d8402a' }, dart: { fam: 'dart', tip: 6 },
    bone: { fam: 'wand', tip: 9, gem: '#e9e4d4', shaft: '#e9e4d4' }, rod: { fam: 'staff', tip: 12, gem: '#6ee07a' }, skull: { fam: 'staff', tip: 12, gem: '#6ee07a', skull: 1 },
    lich: { fam: 'staff', tip: 12, gem: '#4fd8a0', skull: 1, shaft: '#3a3540' }, crown: { fam: 'staff', tip: 12, gem: '#ffd84d', skull: 1, shaft: '#c9a23a' },
    lantern: { fam: 'lantern', tip: 9 }, tome: { fam: 'tome', tip: 7 },
    // power-up weapons that replace what you're holding while they last
    flamer: { fam: 'flamer', tip: 13 }, stormgun: { fam: 'stormgun', tip: 12 },
    // second armoury: mostly recoloured families
    hunter: { fam: 'arrow', tip: 8, big: 1.1, wood: '#8a5a2b' }, frostbow: { fam: 'arrow', tip: 9, big: 1.3, wood: '#9fe0ff' },
    thunderbow: { fam: 'arrow', tip: 9, big: 1.3, wood: '#ffe04a' }, sunbow: { fam: 'arrow', tip: 10, big: 1.45, wood: '#fff2a0' },
    mace: { fam: 'hammer', tip: 12 }, scimitar: { fam: 'sword', tip: 14, len: 13 }, halberd: { fam: 'axe', tip: 15 },
    frostblade: { fam: 'sword', tip: 17, len: 16, glow: '#bfe4ff' }, stormblade: { fam: 'sword', tip: 17, len: 16, glow: '#7fe8ff' },
    dragonslayer: { fam: 'sword', tip: 20, len: 19, glow: '#ff6a1a' },
    oak: { fam: 'staff', tip: 12, gem: '#6ee07a', shaft: '#6b4423' }, ember: { fam: 'wand', tip: 9, gem: '#ff6a1a', shaft: '#3a2a2a' },
    crystal: { fam: 'staff', tip: 12, gem: '#bfe4ff', orb: 1 }, tempest: { fam: 'staff', tip: 12, gem: '#7fe8ff', orb: 1, glow: '#bff4ff' },
    solar: { fam: 'staff', tip: 12, gem: '#ffd84d', orb: 1, glow: '#fff2a0', shaft: '#c9a23a' }, eternity: { fam: 'staff', tip: 12, gem: '#ffffff', orb: 1, glow: '#c78cff', shaft: '#2a2a3a' },
    dagger: { fam: 'knife', tip: 6, col: '#e9e4d4' }, chakram: { fam: 'starw', tip: 6, col: '#ffd84d' }, ghostblade: { fam: 'knife', tip: 7, col: '#dfe7ff', glow: '#bfe4ff' },
    bloodstar: { fam: 'starw', tip: 6, col: '#8a1a1a' }, oblivion: { fam: 'knife', tip: 8, col: '#1a1a2a', glow: '#ff6ad0' },
    charm: { fam: 'wand', tip: 9, gem: '#4fd8a0', shaft: '#5a4a3a' }, censer: { fam: 'staff', tip: 12, gem: '#bfe4ff', orb: 1, shaft: '#8a8a8a' },
    ossuary: { fam: 'staff', tip: 12, gem: '#e9e4d4', skull: 1, shaft: '#e9e4d4' }, wraithstaff: { fam: 'staff', tip: 12, gem: '#9fe0ff', skull: 1, shaft: '#3a3540' },
    deathscep: { fam: 'staff', tip: 12, gem: '#d8402a', skull: 1, shaft: '#1a1a1a' },
  };
  // melee weapons are real pixel sprites (drawn with nearest-neighbour, so they stay blocky when they swing);
  // ox/oy is the grip pixel that sits in the hero's hand
  const PIX_WEAPONS = {
    club: { ox: 1, oy: 2, rows: ['.....cccc...', 'hhhhcccccc..', 'hhhhCCkCCCC.', '.....CCCCC..'],
      pal: { c: '#c98a48', C: '#a0642a', k: '#6b3f1d', h: '#7a4a1e' } },
    sword: { ox: 2, oy: 2, rows: ['....g...........', '....gssssssssss.', 'phhhglllllllllll', '....gdddddddddd.', '....g...........'],
      pal: { p: '#c9a23a', h: '#6b3f1d', g: '#c9a23a', s: '#e8eef2', l: '#ffffff', d: '#9aa2aa' } },
    axe: { ox: 1, oy: 5, rows: ['..........aa..', '.........aaaa.', '........aaaaA.', '........aaaaA.', '.......aaaaAA.', 'hhhhhhhhhhhhh.',
      '.......aaaaAA.', '........aaaaA.', '........aaaaA.', '.........aaaa.', '..........aa..'],
      pal: { a: '#c9ced2', A: '#ffffff', h: '#7a4a1e' } },
    hammer: { ox: 1, oy: 4, rows: ['.........LLLL', '.........mmmm', '.........mmmm', '.........mmmm', 'wwwwwwwwwbbbb', '.........mmmm', '.........mmmm', '.........mmmm', '.........dddd'],
      pal: { L: '#c9d1d8', m: '#8a949c', b: '#c9a23a', d: '#5a6066', w: '#7a4a1e' } },
    gsword: { ox: 3, oy: 3, rows: ['.....g..............', '.....gsssssssssss...', '.....gssssssssssss..', 'phhhhgllllllllllllll', '.....gdddddddddddd..', '.....gddddddddddd...', '.....g..............'],
      pal: { p: '#c9a23a', h: '#4a2d18', g: '#c9a23a', s: '#e8eef2', l: '#ffffff', d: '#9aa6b0' } },
    fsword: { ox: 3, oy: 3, rows: ['.....g..............', '.....gsssssssssss...', '.....gssssssssssss..', 'phhhhgllllllllllllll', '.....gdddddddddddd..', '.....gddddddddddd...', '.....g..............'],
      pal: { p: '#3a3f45', h: '#2a1406', g: '#3a3f45', s: '#ffb347', l: '#fff2a0', d: '#d9402a' } },
    ksword: { ox: 3, oy: 3, rows: ['.....g................', '.....gsssssssssssss...', '.....gssssssssssssss..', 'phhhhrllllllllllllllll', '.....gdddddddddddddd..', '.....gddddddddddddd...', '.....g................'],
      pal: { p: '#ffd84d', h: '#6b2a14', g: '#ffd84d', r: '#d8402a', s: '#fff2a0', l: '#ffffff', d: '#e2c050' } },
  };
  // the new melee weapons reuse these pixel shapes in new metals
  const PIXW = PIX_WEAPONS;
  Object.assign(PIX_WEAPONS, {
    mace: { ox: PIXW.hammer.ox, oy: PIXW.hammer.oy, rows: PIXW.hammer.rows, pal: { L: '#e8eef2', m: '#6a7078', b: '#3a3f45', d: '#3a3f45', w: '#4a2d18' } },
    scimitar: { ox: PIXW.sword.ox, oy: PIXW.sword.oy, rows: PIXW.sword.rows, pal: { p: '#ffd84d', h: '#8a1a1a', g: '#ffd84d', s: '#fff2cf', l: '#ffffff', d: '#c9b48a' } },
    halberd: { ox: PIXW.axe.ox, oy: PIXW.axe.oy, rows: PIXW.axe.rows.map((r, i) => (i === PIXW.axe.oy ? 'hhh' : '...') + r) /* a longer pole */, pal: { a: '#8a949c', A: '#e8eef2', h: '#4a2d18' } },
    frostblade: { ox: PIXW.gsword.ox, oy: PIXW.gsword.oy, rows: PIXW.gsword.rows, pal: { p: '#9fe0ff', h: '#2a3a5a', g: '#9fe0ff', s: '#bfe4ff', l: '#ffffff', d: '#7fb4e0' } },
    stormblade: { ox: PIXW.gsword.ox, oy: PIXW.gsword.oy, rows: PIXW.gsword.rows, pal: { p: '#ffe04a', h: '#1a2a4a', g: '#ffe04a', s: '#7fe8ff', l: '#ffffff', d: '#3a8ac4' } },
    dragonslayer: { ox: PIXW.ksword.ox, oy: PIXW.ksword.oy, rows: PIXW.ksword.rows.map(r => r + '..'), pal: { p: '#8a1a1a', h: '#1a0a06', g: '#8a1a1a', r: '#ff6a1a', s: '#3a3f45', l: '#ff9a3c', d: '#1a1a1e' } },
  });
  for (const k in PIX_WEAPONS) PIX_WEAPONS[k].spr = sprite(PIX_WEAPONS[k].rows, PIX_WEAPONS[k].pal);
  // what's in the hero's hands right now: power-up weapons take over from the class weapon
  const heldArt = () => G.buffs.flame > 0 ? 'flamer' : (G.buffs.volley > 0 && !ST.melee ? 'stormgun' : ST.art);
  const tipOf = art => (ART[art] || {}).tip || 8;
  const FLASH = { pebble: ['#f3e2b0', '#ffffff'], arrow: ['#f3e2b0', '#ffffff'], bolt: ['#f3e2b0', '#ffffff'], ball: ['#ff9a2a', '#fff2a0'],
    fire: ['#ff5a1a', '#ffd25a'], spark: ['#5ad8ff', '#ffffff'], cannon: ['#ff6a1a', '#fff2a0'],
    magic: ['#c78cff', '#ffffff'], frost: ['#9fe0ff', '#ffffff'], arcane: ['#c78cff', '#ffe0ff'], knife: ['#e8eef2', '#ffffff'],
    star: ['#e8eef2', '#ffffff'], dart: ['#6ee07a', '#ffffff'], soul: ['#6ee07a', '#e0ffe8'] };
  function seg(g, pts, w, col) {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.stroke();
  }
  // same, with the dark pixel outline the sprites use
  function segO(g, pts, w, col) { seg(g, pts, w + 1.4, OUTLINE); seg(g, pts, w, col); }
  // k = how far the weapon is drawn/cocked (0 = just fired, 1 = fully drawn)
  function drawWeapon(g, type, k = 0.35) {
    const a = ART[type] || { fam: type };
    const pw = PIX_WEAPONS[type];
    if (pw) {
      // pixel sprite, grip pixel on the origin; a soft glow behind for the enchanted blades
      if (a.glow) { g.globalAlpha = 0.3 + 0.1 * Math.sin(performance.now() / 120); g.fillStyle = a.glow; g.fillRect(2, -3, a.len + 1, 6); g.globalAlpha = 1; }
      const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
      g.drawImage(pw.spr.c, -(pw.ox + 1), -(pw.oy + 1));
      g.imageSmoothingEnabled = sm;
      weaponFlair(g, type);
      return;
    }
    if (a.big) { g.save(); g.scale(a.big, a.big); drawWeapon(g, a.fam, k); g.restore(); if (a.wood) { g.save(); g.scale(a.big, a.big); g.globalAlpha = 0.5; seg(g, [3, -6, 5.6, -2.5, 5.2, 0, 5.6, 2.5, 3, 6], 1, a.wood); g.restore(); } weaponFlair(g, type); return; }
    switch (a.fam) {
      case 'club':
        segO(g, [-1, 0, 4, 0], 1.6, '#7a4a1e'); segO(g, [4, 0, 10, 0], 3, '#a0642a');
        g.fillStyle = '#c98a48'; g.fillRect(5, -1.4, 4, 0.8); g.fillStyle = '#6b3f1d'; g.fillRect(7, 0.2, 1, 1); break;
      case 'sword': {
        const L = a.len, w = a.wide || 1;
        if (a.glow) { g.globalAlpha = 0.35; seg(g, [3, 0, L + 2, 0], 4.5 * w, a.glow); g.globalAlpha = 1; }
        segO(g, [-1.5, 0, 1.5, 0], 1.4, '#6b3f1d');
        segO(g, [1.5, -2.6 * w, 1.5, 2.6 * w], 1.2, '#c9a23a');
        g.fillStyle = OUTLINE; g.beginPath(); g.moveTo(2, -1.4 * w); g.lineTo(L, -1.2 * w); g.lineTo(L + 2.2, 0); g.lineTo(L, 1.2 * w); g.lineTo(2, 1.4 * w); g.closePath(); g.fill();
        g.fillStyle = a.col; g.beginPath(); g.moveTo(2.4, -0.9 * w); g.lineTo(L, -0.7 * w); g.lineTo(L + 1.4, 0); g.lineTo(L, 0.7 * w); g.lineTo(2.4, 0.9 * w); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(3, -0.5 * w, L - 3, 0.4);
        break;
      }
      case 'axe':
        segO(g, [-1, 0, 10, 0], 1.4, '#7a4a1e');
        g.fillStyle = OUTLINE; g.beginPath(); g.moveTo(6, -1); g.quadraticCurveTo(9, -6, 12.5, -5.5); g.quadraticCurveTo(11, 0, 12.5, 5.5); g.quadraticCurveTo(9, 6, 6, 1); g.closePath(); g.fill();
        g.fillStyle = '#c9ced2'; g.beginPath(); g.moveTo(6.8, -0.8); g.quadraticCurveTo(9.2, -5, 11.8, -4.6); g.quadraticCurveTo(10.4, 0, 11.8, 4.6); g.quadraticCurveTo(9.2, 5, 6.8, 0.8); g.closePath(); g.fill();
        g.fillStyle = '#ffffff'; g.fillRect(10.6, -3.5, 0.6, 7); break;
      case 'hammer':
        segO(g, [-1, 0, 9, 0], 1.4, '#7a4a1e');
        g.fillStyle = OUTLINE; g.fillRect(7.3, -4.7, 5.4, 9.4);
        g.fillStyle = '#8a949c'; g.fillRect(8, -4, 4, 8); g.fillStyle = '#c9d1d8'; g.fillRect(8, -4, 4, 1.2); g.fillStyle = '#c9a23a'; g.fillRect(8, -0.5, 4, 1); break;
      case 'wand':
        segO(g, [0, 0, 8, 0], 1.2, a.shaft || '#6b2a14');
        g.fillStyle = '#c9a23a'; g.fillRect(6.5, -1, 1, 2.2);
        g.fillStyle = OUTLINE; g.fillRect(7.6, -2, 3.6, 4); g.fillStyle = a.gem; g.fillRect(8, -1.6, 2.8, 3.2); g.fillStyle = '#ffffff'; g.fillRect(8.4, -1.2, 1, 1); break;
      case 'staff':
        segO(g, [-3, 0, 9.5, 0], 1.3, a.shaft || '#7a4a1e');
        if (a.skull) { g.fillStyle = OUTLINE; g.fillRect(8.5, -3, 5, 6); g.fillStyle = '#e9e4d4'; g.fillRect(9, -2.5, 4, 5); g.fillStyle = OUTLINE; g.fillRect(11, -1.6, 1, 1); g.fillRect(11, 0.6, 1, 1); g.fillStyle = a.gem; g.fillRect(11, -1.6, 1, 1); g.fillRect(11, 0.6, 1, 1); break; }
        if (a.glow) { g.globalAlpha = 0.4; g.fillStyle = a.glow; g.beginPath(); g.arc(11, 0, 4.5, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
        g.fillStyle = '#c9a23a'; g.fillRect(8, -2.2, 1, 4.4);
        if (a.orb) { g.fillStyle = OUTLINE; g.beginPath(); g.arc(11, 0, 2.8, 0, Math.PI * 2); g.fill(); g.fillStyle = a.gem; g.beginPath(); g.arc(11, 0, 2.1, 0, Math.PI * 2); g.fill(); }
        else { g.fillStyle = OUTLINE; g.fillRect(8.8, -2.2, 4.2, 4.4); g.fillStyle = a.gem; g.fillRect(9.2, -1.8, 3.4, 3.6); }
        g.fillStyle = '#ffffff'; g.fillRect(10, -1.2, 1, 1); break;
      case 'knife':
        if (a.glow) { g.globalAlpha = 0.4; seg(g, [1, 0, 7, 0], 3, a.glow); g.globalAlpha = 1; }
        segO(g, [-1, 0, 1.5, 0], 1.2, '#3a2a1a');
        g.fillStyle = OUTLINE; g.beginPath(); g.moveTo(1.4, -1.4); g.lineTo(6.8, -0.4); g.lineTo(7.6, 0); g.lineTo(6.8, 0.6); g.lineTo(1.4, 1.2); g.closePath(); g.fill();
        g.fillStyle = a.col; g.beginPath(); g.moveTo(1.8, -0.8); g.lineTo(6.6, -0.1); g.lineTo(6.6, 0.3); g.lineTo(1.8, 0.7); g.closePath(); g.fill(); break;
      case 'starw':
        g.save(); g.translate(4, 0); g.rotate(Math.PI / 4);
        g.fillStyle = OUTLINE; g.fillRect(-3.2, -1.2, 6.4, 2.4); g.fillRect(-1.2, -3.2, 2.4, 6.4);
        g.fillStyle = a.col; g.fillRect(-2.6, -0.6, 5.2, 1.2); g.fillRect(-0.6, -2.6, 1.2, 5.2);
        g.fillStyle = '#5a6066'; g.fillRect(-0.5, -0.5, 1, 1); g.restore(); break;
      case 'dart':
        segO(g, [0, 0, 5, 0], 0.9, '#8a5a2b');
        g.fillStyle = '#6ee07a'; g.fillRect(5, -0.8, 2, 1.6); g.fillStyle = '#c9ced2'; g.fillRect(6.8, -0.5, 1.2, 1);
        g.fillStyle = '#e5484d'; g.fillRect(-0.5, -1.4, 1.5, 0.8); g.fillRect(-0.5, 0.6, 1.5, 0.8); break;
      case 'lantern':
        segO(g, [0, 0, 4, 0], 1, '#3a3540');
        g.fillStyle = OUTLINE; g.fillRect(3.6, -3, 5, 6); g.fillStyle = '#3a3540'; g.fillRect(4, -2.6, 4.2, 5.2);
        g.fillStyle = '#6ee07a'; g.fillRect(4.6, -1.8, 3, 3.6); g.fillStyle = '#e0ffe8'; g.fillRect(5.4, -0.8, 1.4, 1.6); break;
      case 'tome':
        g.fillStyle = OUTLINE; g.fillRect(0, -3.5, 7, 7); g.fillStyle = '#3d2a5a'; g.fillRect(0.5, -3, 6, 6);
        g.fillStyle = '#fff2cf'; g.fillRect(5.5, -2.6, 1, 5.2); g.fillStyle = '#4fd8a0'; g.fillRect(2, -1, 2.4, 2); break;
      case 'flamer': {
        // fuel tank, hose, long nozzle and a flickering pilot flame
        g.fillStyle = OUTLINE; g.fillRect(-2.5, 0, 6, 4.4); g.fillStyle = '#c0392b'; g.fillRect(-2, 0.5, 5, 3.4); g.fillStyle = '#e5484d'; g.fillRect(-2, 0.5, 5, 1);
        g.fillStyle = '#c9a23a'; g.fillRect(0, 0.5, 0.8, 3.4);
        g.fillStyle = OUTLINE; g.fillRect(-1, -2.2, 13, 3); g.fillStyle = '#5a6066'; g.fillRect(-0.5, -1.7, 12, 2); g.fillStyle = '#8a949c'; g.fillRect(-0.5, -1.7, 12, 0.6);
        g.fillStyle = OUTLINE; g.fillRect(10.5, -2.8, 2.6, 4.2); g.fillStyle = '#d9700f'; g.fillRect(11, -2.3, 1.6, 3.2);
        g.fillStyle = '#3a3f45'; g.fillRect(4, 0.8, 1.2, 2.4);
        const f = Math.sin(performance.now() / 40) * 0.6;
        g.fillStyle = 'rgba(255,140,40,0.85)'; g.fillRect(13, -1.6 + f * 0.3, 2 + f, 1.8); g.fillStyle = '#fff2a0'; g.fillRect(13, -1, 1, 0.8);
        break;
      }
      case 'stormgun': {
        // three spinning barrels and a drum of ammo
        const spin = Math.floor(performance.now() / 50) % 3;
        g.fillStyle = OUTLINE; g.fillRect(-1, -2.6, 6, 5.6); g.fillStyle = '#6b3f1d'; g.fillRect(-0.5, -2.1, 5, 4.6);
        g.fillStyle = OUTLINE; g.fillRect(4, -3, 9.5, 6);
        for (let i = 0; i < 3; i++) { g.fillStyle = i === spin ? '#c9d1d8' : '#7b8794'; g.fillRect(4.5, -2.5 + i * 1.8, 8.5, 1.4); }
        g.fillStyle = '#c9a23a'; g.fillRect(8, -3, 1, 6);
        g.fillStyle = OUTLINE; g.beginPath(); g.arc(3, 3.5, 2.8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c9a23a'; g.beginPath(); g.arc(3, 3.5, 2, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#8a5a14'; g.fillRect(2.5, 3, 1, 1);
        break;
      }
    }
    switch (a.fam) {
      case 'pebble': {
        const pz = 3.5 - 3.5 * k;
        segO(g, [4, 0, 5.2, 0, 6.6, -2.4], 1.3, '#a0642a'); segO(g, [5.2, 0, 6.6, 2.4], 1.3, '#a0642a');
        seg(g, [6.6, -2.4, pz, 0, 6.6, 2.4], 0.6, '#c9b07a');
        g.fillStyle = '#5a3a1a'; g.fillRect(pz - 0.8, -1, 1.6, 2);
        if (k > 0.15) { g.fillStyle = '#9ea4a8'; g.fillRect(pz - 0.3, -0.8, 1.6, 1.6); }
        break;
      }
      case 'arrow': {
        const pull = 1 + 4.5 * k, bend = 1 + 1.6 * k;
        segO(g, [5 - bend, -6.5, 5 - bend * 0.35, -5, 5.6, -2.5, 5.2, 0, 5.6, 2.5, 5 - bend * 0.35, 5, 5 - bend, 6.5], 1.4, '#b8783a');
        seg(g, [5 - bend, -6.5, 5 - bend * 0.35, -5], 1.4, '#6b4220'); seg(g, [5 - bend, 6.5, 5 - bend * 0.35, 5], 1.4, '#6b4220');
        seg(g, [5 - bend, -6.5, 5 - pull, 0, 5 - bend, 6.5], 0.6, '#fff6e0');
        g.fillStyle = '#d9a441'; g.fillRect(4.6, -1, 1.4, 2);
        if (k > 0.12) {
          const n = 5 - pull;
          seg(g, [n, 0, n + 9, 0], 0.8, '#a8763f');
          g.fillStyle = '#c9ced2'; g.fillRect(n + 8.6, -1, 1.8, 2);
          g.fillStyle = '#f5ecd6'; g.fillRect(n + 0.3, -1.3, 1.6, 0.8); g.fillRect(n + 0.3, 0.5, 1.6, 0.8);
        }
        break;
      }
      case 'bolt': {
        const sx = 5.4 - 3.4 * Math.min(1, k * 1.7);
        g.fillStyle = '#6b3f1d'; g.fillRect(-1, -1, 8, 2); g.fillStyle = '#8a5a2b'; g.fillRect(-1, -1, 8, 0.6);
        segO(g, [4.6, -4.6, 5.4, -3, 6.2, 0, 5.4, 3, 4.6, 4.6], 1.2, '#b4bcc4');
        seg(g, [4.6, -4.6, sx, 0, 4.6, 4.6], 0.5, '#f5ecd6');
        g.fillStyle = '#3b2a1a'; g.fillRect(1, 1, 1.2, 2);
        if (k > 0.55) { g.fillStyle = '#4b3a2a'; g.fillRect(sx, -0.5, 6, 1); g.fillStyle = '#d8dde0'; g.fillRect(sx + 5.5, -0.9, 1.6, 1.8); g.fillStyle = '#c0392b'; g.fillRect(sx, -0.9, 1, 1.8); }
        break;
      }
      case 'ball':
        g.fillStyle = '#6b3f1d'; g.fillRect(-1, -0.5, 3, 3); g.fillStyle = '#3a3f45'; g.fillRect(1, -1.2, 8, 2); g.fillStyle = '#8c949c'; g.fillRect(2, -1.2, 6, 0.6);
        g.fillStyle = '#c9a23a'; g.fillRect(1, -1.5, 1, 2.6); break;
      case 'fire':
        g.fillStyle = '#6b2a14'; g.fillRect(0, -0.6, 8, 1.4); g.fillStyle = '#c9a23a'; g.fillRect(6.5, -1, 1, 2.2);
        g.fillStyle = '#ff8a3a'; g.fillRect(7.5, -1.5, 3, 3); g.fillStyle = '#ffd25a'; g.fillRect(8.3, -0.7, 1.4, 1.4); break;
      case 'spark':
        g.fillStyle = '#7a4a1e'; g.fillRect(-3, -0.6, 12, 1.4); g.fillStyle = '#c9a23a'; g.fillRect(8, -2, 1, 4);
        g.fillStyle = '#7fe8ff'; g.fillRect(8.8, -2, 3.4, 3.6); g.fillStyle = '#ffffff'; g.fillRect(9.6, -1.2, 1.2, 1.2); break;
      case 'cannon':
        g.fillStyle = '#2f3338'; g.fillRect(-1, -2, 11, 4); g.fillStyle = '#4a5058'; g.fillRect(-1, -2, 11, 1);
        g.fillStyle = '#d9700f'; g.fillRect(2, -2, 1.5, 4); g.fillRect(8, -2.6, 2.4, 5.2); g.fillStyle = '#6b3f1d'; g.fillRect(0, 2, 3, 2); break;
    }
    weaponFlair(g, type);
  }
  // living details on the better weapons: flames, crackles, shines, runes (time-animated)
  function weaponFlair(g, art) {
    const t = performance.now() / 1000, A_ = ART[art] || {};
    switch (art) {
      // (sword flair works on the pixel grid of the sprites: blade from x=3 to x=len, whole-pixel rects only)
      case 'fsword': {
        // the blade burns: blocky tongues of flame flicker up along its length
        for (let i = 0; i < 6; i++) {
          const x = 3 + Math.round(i * 2.4), h = 1 + Math.round((Math.sin(t * 22 + i * 1.9) + 1) * 1.3);
          g.fillStyle = '#ff6a1a'; g.fillRect(x, -3 - h, 1, h + 1);
          g.fillStyle = '#ffd25a'; g.fillRect(x, -3 - h, 1, 1);
          if ((i + Math.floor(t * 12)) % 3 === 0) { g.fillStyle = '#ff9a3c'; g.fillRect(x + 1, 3, 1, 1 + (i % 2)); }
        }
        if (Math.sin(t * 30) > 0) { g.fillStyle = '#fff2a0'; g.fillRect(4 + (Math.floor(t * 20) % 12), 0, 1, 1); }
        break;
      }
      case 'gsword': {
        // a one-pixel gleam sweeps down the steel
        const x = 3 + Math.floor((t * 12) % 22);
        if (x < 17) { g.fillStyle = '#ffffff'; g.fillRect(x, -2, 1, 5); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x - 1, -1, 1, 3); }
        break;
      }
      case 'ksword': {
        for (let i = 0; i < 3; i++) {
          if (Math.sin(t * 17 + i * 3) < 0.3) continue;
          const x = 4 + Math.floor(((t * 5 + i * 0.33) % 1) * 14);
          g.fillStyle = '#ffffff'; g.fillRect(x, -2, 1, 1); g.fillRect(x - 1, -1, 3, 1); g.fillRect(x, 0, 1, 1);
        }
        if (Math.sin(t * 4) > 0.5) { g.fillStyle = '#ff6a5a'; g.fillRect(2, 0, 1, 1); }
        break;
      }
      case 'hammer': {
        // glowing runes in the hammer head
        const p = 0.5 + 0.5 * Math.sin(t * 5);
        g.fillStyle = `rgba(255,179,71,${0.4 + p * 0.6})`; g.fillRect(9, -2, 2, 1); g.fillRect(9, 2, 2, 1); g.fillRect(8, -3, 1, 1); g.fillRect(11, 3, 1, 1);
        break;
      }
      case 'spark': {
        // electric crackles around the orb
        const s = Math.floor(t * 18);
        g.strokeStyle = '#bff4ff'; g.lineWidth = 0.5; g.beginPath();
        for (let i = 0; i < 3; i++) { const a = (s * 2.3 + i * 2.1) % 6.28; g.moveTo(10.5, 0); g.lineTo(10.5 + Math.cos(a) * 3, Math.sin(a) * 3); g.lineTo(10.5 + Math.cos(a + 0.4) * 5, Math.sin(a + 0.4) * 5); }
        g.stroke();
        break;
      }
      case 'arcane': {
        const r = 3 + ((t * 4) % 1) * 3;
        g.strokeStyle = `rgba(199,140,255,${1 - ((t * 4) % 1)})`; g.lineWidth = 0.6; g.beginPath(); g.arc(11, 0, r, 0, Math.PI * 2); g.stroke();
        break;
      }
      case 'stars': {
        for (let i = 0; i < 2; i++) { const a = t * 4 + i * Math.PI; g.fillStyle = i ? '#ffffff' : '#ffe04a'; g.fillRect(11 + Math.cos(a) * 4.5 - 0.5, Math.sin(a) * 4.5 - 0.5, 1.2, 1.2); }
        break;
      }
      case 'void': {
        g.strokeStyle = 'rgba(199,140,255,0.8)'; g.lineWidth = 0.6;
        for (let i = 0; i < 3; i++) { const a = -t * 5 + i * 2.1; g.beginPath(); g.arc(11, 0, 4 + i * 0.6, a, a + 1.2); g.stroke(); }
        break;
      }
      case 'longbow': {
        g.save(); g.scale(A_.big, A_.big);
        const s = Math.sin(t * 3);
        g.fillStyle = '#6ee07a'; g.fillRect(4.6, -4 + s * 0.3, 1.4, 1); g.fillRect(4.6, 3 - s * 0.3, 1.4, 1); g.fillStyle = '#b6f5a0'; g.fillRect(5.2, -4.4, 0.6, 0.6);
        g.restore();
        break;
      }
      case 'starbow': {
        g.save(); g.scale(A_.big, A_.big);
        for (let i = 0; i < 2; i++) if (Math.sin(t * 9 + i * 2) > 0.2) { g.fillStyle = '#ffffff'; const y = i ? 6 : -6; g.fillRect(3.5, y - 0.3, 1.6, 0.6); g.fillRect(4, y - 0.8, 0.6, 1.6); }
        g.restore();
        break;
      }
      case 'cannon': {
        if (Math.sin(t * 7) > 0) { g.fillStyle = 'rgba(255,140,40,0.8)'; g.fillRect(10.4, -1, 1, 2); }
        g.fillStyle = '#2a1406'; g.fillRect(9, -1.6, 1, 1); g.fillStyle = '#ff6a1a'; g.fillRect(9.2, -1.4, 0.6, 0.6); // the dragon's eye
        break;
      }
      case 'dart': {
        const y = ((t * 3) % 1) * 3;
        g.fillStyle = '#6ee07a'; g.fillRect(6.4, 0.8 + y, 0.6, 0.8);
        break;
      }
      case 'fang': case 'night': {
        g.fillStyle = `rgba(199,140,255,${0.25 + 0.25 * Math.sin(t * 7)})`; g.fillRect(1.5, -1.6, 6.5, 3.2);
        break;
      }
      case 'reaper': {
        if (Math.sin(t * 6) > 0.6) { g.fillStyle = '#ffffff'; g.fillRect(3.6, -2.4, 0.8, 0.8); }
        break;
      }
      case 'lich': case 'crown': {
        const p = 0.5 + 0.5 * Math.sin(t * 6);
        g.fillStyle = art === 'lich' ? `rgba(127,232,255,${0.5 + p * 0.5})` : `rgba(79,216,160,${0.5 + p * 0.5})`;
        g.fillRect(11, -1.6, 1, 1); g.fillRect(11, 0.6, 1, 1);
        if (art === 'crown') { g.fillStyle = '#ffd84d'; g.fillRect(8.5, -3.6, 5, 1); g.fillRect(8.5, -4.4, 1, 0.8); g.fillRect(10.5, -4.4, 1, 0.8); g.fillRect(12.5, -4.4, 1, 0.8); }
        break;
      }
      case 'lantern': {
        const p = 0.6 + 0.4 * Math.sin(t * 9) * Math.sin(t * 4.3);
        g.fillStyle = `rgba(224,255,138,${0.25 * p})`; g.beginPath(); g.arc(6, 0, 5.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = `rgba(224,255,180,${p})`; g.fillRect(5.4, -0.8, 1.4, 1.6);
        break;
      }
      case 'tome': {
        // runes flicker on the cover and a page lifts
        if (Math.sin(t * 8) > 0) { g.fillStyle = '#a06ad0'; g.fillRect(1.5, -2, 1, 1); g.fillRect(3.5, 1.4, 1, 1); }
        const lift = Math.max(0, Math.sin(t * 3)) * 1.5;
        g.fillStyle = '#fff2cf'; g.fillRect(6.3, -2.6 - lift, 0.8, 3);
        break;
      }
    }
  }
  function drawShot(g, type, x, y, ang, k = 1) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, k);
    switch (type) {
      case 'pebble': g.fillStyle = '#9ea4a8'; g.fillRect(-1.5, -1.5, 3, 3); g.fillStyle = '#d6dadc'; g.fillRect(-1.5, -1.5, 1, 1); break;
      case 'arrow': g.fillStyle = '#8a5a2b'; g.fillRect(-5, -0.5, 9, 1); g.fillStyle = '#c9ced2'; g.fillRect(3, -1.5, 2, 3); g.fillStyle = '#fff'; g.fillRect(-6, -1.5, 2, 1); g.fillRect(-6, 0.5, 2, 1); break;
      case 'bolt': g.fillStyle = '#4b3a2a'; g.fillRect(-4, -1, 8, 2); g.fillStyle = '#d8dde0'; g.fillRect(3, -1.5, 3, 3); g.fillStyle = '#c0392b'; g.fillRect(-5, -1.5, 2, 3); break;
      case 'ball': g.fillStyle = 'rgba(255,220,150,0.5)'; g.fillRect(-6, -0.5, 5, 1); g.fillStyle = '#3c4146'; g.fillRect(-1.5, -1.5, 3, 3); g.fillStyle = '#9aa1a8'; g.fillRect(-1, -1, 1, 1); break;
      case 'fire': g.fillStyle = 'rgba(255,120,40,0.35)'; g.fillRect(-7, -3, 7, 6); g.fillStyle = '#ff6a2a'; g.fillRect(-3, -3, 6, 6); g.fillStyle = '#ffd25a'; g.fillRect(-1, -1.5, 3, 3); break;
      case 'spark':
        g.strokeStyle = '#bff4ff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-7, 0); g.lineTo(-4, -2); g.lineTo(-1, 1.5); g.lineTo(2, -1.5); g.lineTo(5, 0.5); g.stroke();
        g.fillStyle = '#ffffff'; g.fillRect(4, -1, 2, 2); break;
      // sword waves: a crescent of light, fire or gold
      case 'wavefire': case 'wavelight': case 'wavegold': {
        const c = type === 'wavefire' ? ['rgba(255,90,20,0.45)', '#ff9a3c', '#fff2a0'] : type === 'wavegold' ? ['rgba(255,200,60,0.45)', '#ffd84d', '#ffffff'] : ['rgba(170,210,255,0.45)', '#cfe9ff', '#ffffff'];
        const fl = type === 'wavefire' ? Math.sin(performance.now() / 30) * 0.8 : 0;
        g.lineCap = 'round';
        g.strokeStyle = c[0]; g.lineWidth = 5; g.beginPath(); g.arc(-5, 0, 8 + fl, -1.15, 1.15); g.stroke();
        g.strokeStyle = c[1]; g.lineWidth = 2.6; g.beginPath(); g.arc(-5, 0, 8, -1.05, 1.05); g.stroke();
        g.strokeStyle = c[2]; g.lineWidth = 1; g.beginPath(); g.arc(-5, 0, 8.6, -0.8, 0.8); g.stroke();
        if (type === 'wavefire') { g.fillStyle = '#ffd25a'; for (let i = -2; i <= 2; i++) g.fillRect(2 + Math.abs(i) * -1.2, i * 2.6 - 0.6, 1.4 + Math.random(), 1.2); }
        g.lineCap = 'butt';
        break;
      }
      case 'leafarrow':
        g.fillStyle = '#5a8a3a'; g.fillRect(-5, -0.5, 9, 1); g.fillStyle = '#b6f5a0'; g.fillRect(3, -1.5, 2.5, 3); g.fillStyle = '#6ee07a'; g.fillRect(-6.5, -2, 2.5, 1.5); g.fillRect(-6.5, 0.5, 2.5, 1.5);
        g.fillStyle = '#3f8a33'; g.fillRect(-1, -2, 1.5, 1.2); break;
      case 'stararrow': {
        const tw = (Math.sin(performance.now() / 50) + 1) / 2;
        g.fillStyle = '#c9a23a'; g.fillRect(-5, -0.5, 9, 1); g.fillStyle = '#fff'; g.fillRect(-6, -1.5, 2, 1); g.fillRect(-6, 0.5, 2, 1);
        g.fillStyle = `rgba(255,240,150,${0.4 + tw * 0.4})`; g.fillRect(2, -3, 5, 6); g.fillRect(0.5, -1, 8, 2);
        g.fillStyle = '#fff2a0'; g.fillRect(3.5, -1.5, 2, 3); g.fillStyle = '#ffffff'; g.fillRect(4, -0.5, 1, 1); break;
      }
      case 'shadowknife':
        g.fillStyle = 'rgba(160,106,208,0.45)'; g.fillRect(-7, -2, 12, 4);
        g.fillStyle = OUTLINE; g.fillRect(-4, -1.2, 9, 2.4); g.fillStyle = '#a06ad0'; g.fillRect(-1, -0.6, 5.5, 1.2); g.fillStyle = '#e4c8ff'; g.fillRect(2, -0.6, 2, 0.6); g.fillStyle = '#2a1e34'; g.fillRect(-3.5, -0.6, 2.5, 1.2); break;
      case 'nightknife':
        g.fillStyle = 'rgba(122,63,176,0.5)'; g.fillRect(-9, -1, 10, 2);
        g.fillStyle = OUTLINE; g.fillRect(-4, -1.4, 10, 2.8); g.fillStyle = '#3a3a4a'; g.fillRect(-1, -0.7, 6.5, 1.4); g.fillStyle = '#c78cff'; g.fillRect(-1, -0.7, 6.5, 0.5); g.fillRect(5, -0.4, 1, 0.8); break;
      case 'redstar':
        g.rotate(performance.now() / 35);
        g.fillStyle = 'rgba(216,64,42,0.4)'; g.fillRect(-4.5, -4.5, 9, 9);
        g.fillStyle = OUTLINE; g.fillRect(-3.6, -1.2, 7.2, 2.4); g.fillRect(-1.2, -3.6, 2.4, 7.2);
        g.fillStyle = '#d8402a'; g.fillRect(-3, -0.6, 6, 1.2); g.fillRect(-0.6, -3, 1.2, 6); g.fillStyle = '#ffb0a0'; g.fillRect(-0.5, -0.5, 1, 1); break;
      case 'starorb': {
        g.rotate(performance.now() / 120);
        g.fillStyle = 'rgba(255,224,74,0.35)'; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = OUTLINE; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2 : 4.6, a = i / 10 * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
        g.fillStyle = '#ffe04a'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.4 : 3.6, a = i / 10 * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
        g.fillStyle = '#fff'; g.fillRect(-0.6, -0.6, 1.2, 1.2); break;
      }
      case 'voidorb': {
        const t = performance.now() / 100;
        g.fillStyle = 'rgba(122,63,176,0.35)'; g.beginPath(); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#c78cff'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 4.8, t, t + 4); g.stroke();
        g.fillStyle = '#0e0616'; g.beginPath(); g.arc(0, 0, 3.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e4c8ff'; g.fillRect(Math.cos(-t * 1.5) * 5.5 - 0.5, Math.sin(-t * 1.5) * 5.5 - 0.5, 1, 1); break;
      }
      case 'lichsoul': case 'lanternsoul': case 'crownsoul': case 'abysssoul': {
        const c = { lichsoul: ['#7fe8ff', '#e8fbff'], lanternsoul: ['#e0ff8a', '#ffffe0'], crownsoul: ['#ffd84d', '#fff6c0'], abysssoul: ['#a06ad0', '#4fd8a0'] }[type], t = performance.now() / 90;
        g.globalAlpha = 0.4; g.fillStyle = c[0]; g.fillRect(-9, -1.5 + Math.sin(t) * 0.8, 7, 3); g.globalAlpha = 1;
        g.fillStyle = c[0]; g.beginPath(); g.arc(0, 0, 3.2, 0, Math.PI * 2); g.fill();
        g.fillStyle = c[1]; g.beginPath(); g.arc(0.6, -0.4, 1.6, 0, Math.PI * 2); g.fill();
        g.fillStyle = OUTLINE; g.fillRect(0.6, -1, 0.8, 0.8); g.fillRect(0.6, 0.4, 0.8, 0.8);
        if (type === 'crownsoul') { g.fillStyle = '#ffd84d'; g.fillRect(-1.5, -5, 3, 1.2); g.fillRect(-1.5, -6, 0.8, 1); g.fillRect(0.7, -6, 0.8, 1); }
        if (type === 'lanternsoul') { g.fillStyle = 'rgba(224,255,138,0.25)'; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill(); }
        break;
      }
      case 'magic': g.fillStyle = 'rgba(199,140,255,0.4)'; g.fillRect(-6, -1.5, 5, 3); g.fillStyle = '#c78cff'; g.fillRect(-2, -2, 4, 4); g.fillStyle = '#fff'; g.fillRect(-0.5, -0.5, 1.5, 1.5); break;
      case 'frost':
        g.fillStyle = 'rgba(160,220,255,0.4)'; g.fillRect(-8, -1, 6, 2);
        g.fillStyle = OUTLINE; g.beginPath(); g.moveTo(5, 0); g.lineTo(-1, -2.4); g.lineTo(-4, 0); g.lineTo(-1, 2.4); g.closePath(); g.fill();
        g.fillStyle = '#bfe8ff'; g.beginPath(); g.moveTo(4, 0); g.lineTo(-1, -1.6); g.lineTo(-3, 0); g.lineTo(-1, 1.6); g.closePath(); g.fill();
        g.fillStyle = '#fff'; g.fillRect(0, -0.5, 2, 1); break;
      case 'arcane': {
        const t = performance.now() / 120;
        g.fillStyle = 'rgba(160,90,230,0.35)'; g.beginPath(); g.arc(0, 0, 5.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#7a3fb0'; g.beginPath(); g.arc(0, 0, 3.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e4c8ff'; g.beginPath(); g.arc(0, 0, 1.8, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.fillRect(Math.cos(t) * 4.5 - 0.6, Math.sin(t) * 4.5 - 0.6, 1.2, 1.2); g.fillRect(-Math.cos(t) * 4.5 - 0.6, -Math.sin(t) * 4.5 - 0.6, 1.2, 1.2);
        break;
      }
      case 'knife':
        g.fillStyle = OUTLINE; g.fillRect(-4, -1.2, 9, 2.4); g.fillStyle = '#e8eef2'; g.fillRect(-1, -0.6, 5.5, 1.2); g.fillStyle = '#3a2a1a'; g.fillRect(-3.5, -0.6, 2.5, 1.2); break;
      case 'star':
        g.rotate(performance.now() / 40);
        g.fillStyle = OUTLINE; g.fillRect(-3.4, -1.2, 6.8, 2.4); g.fillRect(-1.2, -3.4, 2.4, 6.8);
        g.fillStyle = '#e8eef2'; g.fillRect(-2.8, -0.6, 5.6, 1.2); g.fillRect(-0.6, -2.8, 1.2, 5.6); break;
      case 'dart': g.fillStyle = '#8a5a2b'; g.fillRect(-4, -0.4, 6, 0.8); g.fillStyle = '#6ee07a'; g.fillRect(2, -0.8, 2, 1.6); g.fillStyle = '#e5484d'; g.fillRect(-5, -1.2, 1.5, 2.4); break;
      case 'soul': {
        const t = performance.now() / 90;
        g.fillStyle = 'rgba(110,224,122,0.3)'; g.fillRect(-9, -1.5 + Math.sin(t) * 0.8, 7, 3);
        g.fillStyle = '#6ee07a'; g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e0ffe8'; g.beginPath(); g.arc(0.6, -0.4, 1.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = OUTLINE; g.fillRect(0.6, -1, 0.8, 0.8); g.fillRect(0.6, 0.4, 0.8, 0.8);
        break;
      }
      case 'flame':
        g.globalAlpha = Math.max(0, Math.min(1, 1.5 - k * 0.45));
        g.fillStyle = 'rgba(220,60,20,0.6)'; g.fillRect(-3.5, -3.5, 7, 7);
        g.fillStyle = '#ff9a3c'; g.fillRect(-2.5, -2.5, 5, 5);
        g.fillStyle = '#fff2a0'; g.fillRect(-1, -1, 2, 2);
        g.globalAlpha = 1; break;
      case 'cannon': g.fillStyle = 'rgba(255,140,40,0.45)'; g.fillRect(-10, -2.5, 8, 5); g.fillStyle = '#26292d'; g.fillRect(-3.5, -3.5, 7, 7); g.fillStyle = '#ff7a2a'; g.fillRect(-1, -1, 2, 2); g.fillStyle = '#5a6066'; g.fillRect(-2.5, -2.5, 2, 1); break;
    }
    g.restore();
  }

  // ================= game logic =================
  function nearest(x, y, range, skip) {
    let best = null, bd = range * range;
    for (const m of G.monsters) {
      if (m.dead || m.rise > 0 || (skip && skip.has(m))) continue;
      const dx = m.x - x, dy = (m.y - m.hh) - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  function spawnMonster(boss, opts = {}) {
    const pool = MON_KEYS.filter(k => MON[k].min <= S.stage && !MON[k].biome);
    const natives = MON_KEYS.filter(k => MON[k].biome === biome().id);
    let type;
    if (opts.type) type = opts.type;
    else if (boss) type = pool[pool.length - 1];
    else if (natives.length && Math.random() < 0.35) type = natives[Math.random() * natives.length | 0];
    else {
      let tot = 0; const ws = pool.map((k, i) => (tot += (i + 1) * MON[k].w));
      const r = Math.random() * tot; type = pool[ws.findIndex(v => r < v)];
    }
    const d = MON[type], s = S.stage;
    // elites: from stage 2 a few monsters roll abilities; a little more often as stages climb (never during a horde)
    const avail = AFFIX.filter(f => f.min <= s && !(f.ground && d.fly));
    let n = 0;
    if (boss) n = s >= 10 ? 3 : s >= 5 ? 2 : s >= 2 ? 1 : 0;
    else if (!opts.horde && s >= 2 && Math.random() < Math.min(0.2, 0.03 + 0.012 * (s - 2)) * bal('elite')) n = 1 + (s >= 5 && Math.random() < 0.15 ? 1 : 0) + (s >= 10 && Math.random() < 0.1 ? 1 : 0);
    if (opts.minion || d.grinner || d.crawler) n = 0; // the Backrooms' things never roll elite powers
    else if (!boss && !opts.horde && dmod('elites')) n = Math.max(n, 1);
    const affs = [];
    while (affs.length < n && affs.length < avail.length) { const f = avail[Math.random() * avail.length | 0]; if (!affs.includes(f)) affs.push(f); }
    // each biome lends a quarter of its monsters its own trait
    const bio = biome();
    if (bio.affix && !boss && !opts.minion && !d.grinner && !d.crawler && Math.random() < 0.25 && !affs.some(f => f.id === bio.affix)) affs.push(AFFIX.find(f => f.id === bio.affix));
    const ab = {}; affs.forEach(f => (ab[f.id] = true));
    for (const id of d.innate || []) ab[id] = true;
    const giant = dmod('giants') ? 1.3 : 1;
    const scale = sizeMul(s) * (boss ? 1.9 : 1) * (ab.mighty ? 1.18 : 1) * (n && !boss ? 1.06 : 1) * (opts.minion ? 0.85 : 1) * giant;
    const a = Math.random() * Math.PI * 2, dist = boss ? 150 : rand(170, 250);
    const ax = opts.at ? opts.at.x : P.x + Math.cos(a) * dist, ay = opts.at ? opts.at.y : P.y + Math.sin(a) * dist;
    const x = clamp(ax, WORLD.x0 + 10, WORLD.x1 - 10), y = clamp(ay, WORLD.y0 + 20, WORLD.y1 - 4);
    const hp = d.hp * hpMul(s) * (boss ? 14 : 1) * (ab.mighty ? 1.6 : 1) * (1 + n * 0.25) * (opts.minion ? 0.6 : 1) * (giant > 1 ? 1.6 : 1) * bal('hp') * (boss ? bal('boss') : 1);
    const m = {
      type, d, x, y, hp, max: hp, dmg: d.dmg * dmgMul(s) * (boss ? 2 : 1) * (ab.mighty ? 1.7 : 1) * bal('dmg'),
      spd: d.spd * spdMul(s) * (boss ? 0.85 : rand(0.9, 1.1)) * (ab.swift ? 1.6 : 1),
      scale, boss, r: d.spr.w * 0.34 * scale, hh: d.spr.h * scale / 2, flash: 0, cd: 0.6, t: Math.random() * 10, kx: 0, ky: 0, face: 1, rise: 0.45,
      ph: Math.random() * 4, wind: 0, atkT: 0, crouch: 0, tele: 0, jump: null, dash: null, hitT: 9, trail: [], trailT: 0,
      affs, ab, abCd: { leap: rand(1.5, 3), dash: rand(2, 4), spit: rand(1, 2.5) }, minion: !!opts.minion,
    };
    if (boss) { m.moves = BOSS_MOVES[type]; m.bcd = { summon: 3, slam: 2, ring: 3.5, charge: 5, blink: 4 }; }
    if (!d.fly) for (let i = 0; i < 3; i++) pushOut(m, m.r * 0.6);
    G.monsters.push(m);
    discover((boss ? 'boss:' : 'mon:') + type); for (const f of affs) discover('elite:' + f.id);
    // the first time a profile meets each kind of elite, the game stops and introduces it
    if (!boss) for (const f of affs) {
      S.seenElites = S.seenElites || [];
      if (S.seenElites.includes(f.id) || eliteQ.some(q => q.f === f)) continue;
      S.seenElites.push(f.id); eliteQ.push({ f, spr: d.spr });
    }
    for (let i = 0; i < 6; i++) G.fx.push({ x: m.x + rand(-6, 6), y: m.y - 1, vx: rand(-15, 15), vy: rand(-20, -5), t: 0.5, c: '#7a5c3a', s: 2 });
    if (boss) {
      G.boss = m;
      banner(`${d.name} King`, BOSS_TIP[type] + (affs.length ? ` · ${affs.map(f => f.name).join(', ')}` : ''), true);
      sfx.boss();
    }
    return m;
  }

  // body rises a pixel on the passing frames of the walk, and the shoulders/weapon go with it
  function bodyLift() { return P.moving && G.dead <= 0 && Math.floor(P.walkT) % 2 === 1 ? -1 : 0; }
  function handPos(a) { return { x: Math.round(P.x) + Math.cos(a) * 2, y: Math.round(P.y) - 8 + bodyLift() + Math.sin(a) * 1.5 }; }

  // melee: one swing hits everything inside an arc in front of you; extra "projectiles" widen the arc
  function slash(a, mult = 1) {
    const reach = ST.reach, arc = Math.min(Math.PI * 1.9, ST.arc * (1 + 0.25 * (ST.shots - 1))), hx = P.x, hy = P.y - 8;
    let hits = 0;
    for (const m of G.monsters) {
      if (m.dead || m.rise > 0) continue;
      const dx = m.x - hx, dy = (m.y - m.hh) - hy, d = Math.hypot(dx, dy);
      if (d > reach + m.r) continue;
      let da = Math.abs(Math.atan2(dy, dx) - a) % (Math.PI * 2); if (da > Math.PI) da = Math.PI * 2 - da;
      if (da > arc / 2 && d > m.r + 6) continue;
      damage(m, ST.dmg * mult, Math.cos(a) * 160, Math.sin(a) * 160);
      if (ST.stun && !m.boss) m.stunT = Math.max(m.stunT || 0, ST.stun);
      if (ST.burn) m.poison = { dps: ST.dmg * 0.3, t: 3, acc: 0, fire: true };
      if (ST.chill) m.slowT = Math.max(m.slowT || 0, 2);
      const mh = FX_MELEE[curFx()]; if (mh) mh(m, a);
      // impact: a spray of sparks flung along the swing, in the blade's colour
      const ix = m.x, iy = m.y - m.hh, tan = a + P.swingDir * Math.PI / 2;
      for (let k = 0; k < 7; k++) {
        const sa = tan + rand(-0.6, 0.6), sp = rand(40, 110);
        G.fx.push({ x: ix, y: iy, vx: Math.cos(sa) * sp, vy: Math.sin(sa) * sp, t: rand(0.15, 0.3), c: k % 2 ? '#ffffff' : (ST.slashCol || '#ffffff'), s: 1.5, nograv: true });
      }
      hits++;
    }
    G.fx.push({ slash: true, x: hx, y: hy, a, r: reach, arc, t: 0.2, T: 0.2, c: ST.slashCol || '#ffffff', dir: P.swingDir, style: ST.slashStyle });
    // a hammer's swing ends in a shockwave and flying grit where it lands
    if (ST.slashStyle === 'quake') {
      const qx = hx + Math.cos(a) * reach * 0.8, qy = hy + 8 + Math.sin(a) * reach * 0.6;
      G.fx.push({ ring: true, x: qx, y: qy, t: 0.35, max: 30, c: '#d6b482' });
      for (let i = 0; i < 12; i++) G.fx.push({ x: qx + rand(-6, 6), y: qy, vx: rand(-60, 60), vy: rand(-90, -30), t: rand(0.3, 0.6), c: i % 3 ? '#8a6a4a' : '#d6b482', s: 2 });
    }
    P.swing = 1; P.swingDir = -P.swingDir;
    onSwing(a);
    if (hits) G.shake = Math.max(G.shake, 0.04);
    sfx.shoot('slash');
  }
  // the Bullet Storm power-up's gun (only the Long Reach card stretches it)
  const STORM = { spd: 260, range: 190 };
  const stormRange = () => STORM.range * (1 + bonus('range') / 100);
  function fire(a) {
    const mult = P.ambush ? 3 + (ST.ambush || 0) : 1;
    if (P.ambush) { P.ambush = false; G.texts.push({ x: P.x, y: P.y - 26, s: 'Ambush!', crit: true, t: 0.8 }); }
    if (ST.melee) { slash(a, mult); return; }
    const tip = tipOf(heldArt()), h = handPos(a), sx = h.x + Math.cos(a) * tip, sy = h.y + Math.sin(a) * tip;
    // Bullet Storm's stormgun is its own gun: the same range and bullet speed whatever your class weapon is
    const storm = G.buffs.volley > 0, spd = storm ? STORM.spd : ST.spd, range = storm ? stormRange() : ST.range, type = storm ? 'ball' : ST.shot;
    const n = ST.shots, spread = type === 'knife' || type === 'star' || type === 'dart' ? 0.2 : 0.14;
    for (let i = 0; i < n; i++) {
      const b = a + (i - (n - 1) / 2) * spread;
      G.shots.push({ x: sx, y: sy, vx: Math.cos(b) * spd, vy: Math.sin(b) * spd, dmg: ST.dmg * mult, pierce: ST.pierce, chain: ST.chain, splash: ST.splash,
        type, look: storm ? 'ball' : (ST.wfx && ST.wfx.look) || null, life: range * 1.5 / spd, hit: new Set(), home: !storm && ST.shot === 'soul',
        wfx: storm ? null : ST.wfx, trail: !storm && ST.wfx && ST.wfx.trail });
    }
    onFire(a, sx, sy);
    P.recoil = 1; G.flashT = 0.07; P.draw = 0;
    P.vx -= Math.cos(a) * (ST.shot === 'cannon' ? 40 : 8); P.vy -= Math.sin(a) * (ST.shot === 'cannon' ? 40 : 8);
    const fc = FLASH[ST.shot] || FLASH.arrow;
    for (let i = 0; i < 4; i++) {
      const sa = a + rand(-0.5, 0.5), sp = rand(30, 80);
      G.fx.push({ x: sx, y: sy, vx: Math.cos(sa) * sp, vy: Math.sin(sa) * sp, t: rand(0.1, 0.22), c: i % 2 ? fc[0] : fc[1], s: 1.5, nograv: true });
    }
    G.fx.push({ x: sx, y: sy, vx: Math.cos(a) * 10, vy: -12, t: 0.45, c: 'rgba(230,220,200,0.55)', s: 3, nograv: true, smoke: true });
    if (ST.shot === 'ball' || ST.shot === 'cannon') G.shake = Math.max(G.shake, ST.shot === 'cannon' ? 0.12 : 0.05);
    sfx.shoot(ST.shot);
  }

  // ================= weapon special effects =================
  const curFx = () => (ST.wfx ? ST.wfx.fx : null);
  // damage everything around a point (used by quakes, falling stars, tentacles, slashes...)
  function aoe(x, y, r, dmg, o = {}) {
    for (const m of G.monsters) {
      if (m.dead || m.rise > 0) continue;
      const dx = m.x - x, dy = (m.y - m.hh * 0.5) - y, d = Math.hypot(dx, dy) || 1;
      if (d > r + m.r) continue;
      damage(m, dmg, dx / d * (o.kb || 60), dy / d * (o.kb || 60));
      if (o.stun && !m.boss) m.stunT = Math.max(m.stunT || 0, o.stun);
      if (o.burn) m.poison = { dps: dmg * 0.4, t: 2.5, acc: 0, fire: true };
    }
  }
  // lingering ground effects: burning ground, poison clouds, vortexes, vines
  function addZone(z) { G.zones.push(Object.assign({ t0: z.t, acc: 0 }, z)); if (G.zones.length > 40) G.zones.shift(); }
  // delayed hits from above or below: falling stars, abyssal tentacles
  function addStrike(k) { G.strikes.push(Object.assign({ t0: k.t, after: 0.4 }, k)); }
  function launchWave(a, look, dmg, burn) {
    const h = handPos(a);
    G.shots.push({ x: h.x + Math.cos(a) * 8, y: h.y + Math.sin(a) * 8, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, dmg, pierce: 99, chain: 0, splash: 0,
      type: 'wave', look, life: 0.5, hit: new Set(), burn, trail: look === 'wavefire' ? '#ff9a3c' : look === 'wavegold' ? '#ffd84d' : '#cfe9ff' });
  }
  function xslash(x, y, c) { G.fx.push({ xslash: true, x, y, t: 0.22, c }); }
  // ---- the one-of-a-kind weapon effects, looked up by the weapon's fx id ----
  const fxHit = (m, d) => { if (!m.dead && m.rise <= 0) damage(m, d, 0, 0); };
  const fxStun = (m, t) => { if (!m.boss) m.stunT = Math.max(m.stunT || 0, t); };
  const fxSlow = (m, t) => { m.slowT = Math.max(m.slowT || 0, t); };
  const fxBleed = (m, dps, t = 3) => { m.poison = { dps, t, acc: 0 }; };
  const fxHeal = k => { P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * k); };
  const fxRing = (x, y, max, c) => G.fx.push({ ring: true, x, y, t: 0.3, max, c });
  const fxBolt = m => G.fx.push({ bolt: true, x: m.x, y: m.y - m.hh, t: 0.2, seed: Math.random() * 99 });
  const fxAround = (x, y, r, fn) => { for (const m of G.monsters) if (!m.dead && m.rise <= 0 && Math.hypot(m.x - x, m.y - y) < r + m.r) fn(m); };
  const fxShards = (x, y, n, dmg, trail, hit) => {
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random();
      G.shots.push({ x, y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, dmg, pierce: 0, chain: 0, splash: 0, type: 'shard', look: 'starorb', k: 0.5, life: 0.35, hit: new Set(hit), trail });
    }
  };
  const FX_SWING = {
    riposte: (a, D) => { if (G.swings % 5 === 0) { aoe(P.x, P.y - 8, ST.reach, D, { kb: 120 }); fxRing(P.x, P.y - 8, ST.reach + 8, '#ffffff'); } },
    backcut: (a, D) => { const x = P.x - Math.cos(a) * ST.reach * 0.6, y = P.y - 8 - Math.sin(a) * ST.reach * 0.6; aoe(x, y, ST.reach * 0.6, D * 0.6, {}); xslash(x, y, '#ffffff'); },
    dance: a => { P.vx += Math.cos(a) * 70; P.vy += Math.sin(a) * 70; },
    thrust: (a, D) => { const x = P.x + Math.cos(a) * ST.reach * 1.5, y = P.y - 8 + Math.sin(a) * ST.reach * 1.5; aoe(x, y, 12, D * 0.8, {}); xslash(x, y, '#c9ced2'); },
    icering: (a, D) => { if (G.swings % 3 === 0) { aoe(P.x, P.y - 8, 45, D * 0.5, {}); fxAround(P.x, P.y, 45, m => fxSlow(m, 2.5)); fxRing(P.x, P.y - 8, 50, '#9fe0ff'); } },
    scorch: (a, D) => addZone({ kind: 'fire', x: P.x + Math.cos(a) * ST.reach, y: P.y + Math.sin(a) * ST.reach * 0.7, r: 24, t: 2, dps: D * 0.3 }),
  };
  const FX_MELEE = {
    bonk: m => { if (Math.random() < 0.2) fxStun(m, 0.5); },
    gash: m => fxBleed(m, ST.dmg * 0.25),
    arc: m => {
      if (Math.random() > 0.25) return;
      const t = nearest(m.x, m.y - m.hh, 90, new Set([m]));
      if (t) { fxBolt(t); fxHit(t, ST.dmg * 0.8); sfx.zap(); }
    },
  };
  const fxExtraShot = (a, sx, sy, D) => G.shots.push({ x: sx, y: sy, vx: Math.cos(a) * ST.spd, vy: Math.sin(a) * ST.spd, dmg: D, pierce: ST.pierce, chain: 0, splash: 0, type: ST.shot, look: null, life: ST.range * 1.5 / ST.spd, hit: new Set(), wfx: null });
  const FX_FIRE = {
    overdrive: (a, sx, sy, D) => { if (G.fired % 6 === 0) for (const da of [-0.12, 0.12]) fxExtraShot(a + da, sx, sy, D); },
    tempest: (a, sx, sy, D) => {
      if (G.fired % 4) return;
      const near = G.monsters.filter(m => !m.dead && m.rise <= 0 && Math.hypot(m.x - P.x, m.y - P.y) < 170).sort(() => Math.random() - 0.5).slice(0, 5);
      for (const m of near) { fxBolt(m); fxHit(m, D); }
      if (near.length) sfx.zap();
    },
  };
  const FX_HIT = {
    sting: (s, m) => { if (Math.random() < 0.12) fxStun(m, 0.4); },
    pin: (s, m) => fxSlow(m, 1.2),
    mark: (s, m, c, D) => { if (m.marked) { m.marked = false; xslash(m.x, m.y - m.hh, '#ffb347'); fxHit(m, D * 0.8); } else m.marked = true; },
    bleed: (s, m, c, D) => fxBleed(m, D * 0.3),
    blowback: (s, m) => { if (!m.boss && !m.ab.mighty) { const d = Math.hypot(s.vx, s.vy) || 1; m.kx = s.vx / d * 260; m.ky = s.vy / d * 260; } },
    shatter: (s, m, c, D) => { fxSlow(m, 2); fxShards(s.x, s.y, 3, D * 0.35, '#bfe4ff', s.hit); },
    skybolt: (s, m, c, D) => { if (Math.random() < 0.2) { fxBolt(m); aoe(m.x, m.y - m.hh * 0.5, 24, D, { stun: 0.6 }); sfx.zap(); } },
    echo: (s, m, c, D) => { if (Math.random() < 0.25) fxHit(m, D * 0.6); },
    cinder: (s, m, c, D) => { m.poison = { dps: D * 0.3, t: 2.5, acc: 0, fire: true }; },
    deepfreeze: (s, m) => { m.chillN = (m.chillN || 0) + 1; if (m.chillN >= 3) { m.chillN = 0; fxStun(m, 1.5); fxRing(m.x, m.y - m.hh, 18, '#9fe0ff'); } },
    prism: s => { s.dmg *= 1.25; },
    nick: (s, m, crit, D) => { if (crit) fxBleed(m, D * 0.4); },
    tether: (s, m) => { if (!m.boss && !m.ab.mighty) { const dx = P.x - m.x, dy = P.y - m.y, d = Math.hypot(dx, dy) || 1; m.kx = dx / d * 130; m.ky = dy / d * 130; } },
    siphon: (s, m, crit) => { if (crit) fxHeal(0.01); },
    boomerang: s => { if (!s.turned) { s.turned = true; s.vx = -s.vx; s.vy = -s.vy; s.life = Math.max(s.life, 0.5); } },
    seeker: (s, m) => {
      const t = nearest(s.x, s.y, 120, s.hit);
      if (!t) return;
      const sp = Math.hypot(s.vx, s.vy), a = Math.atan2((t.y - t.hh) - s.y, t.x - s.x);
      s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp;
    },
    neurotoxin: (s, m, c, D) => { fxSlow(m, 2); fxBleed(m, D * 0.3); },
    haunt: (s, m, c, D) => { if (Math.random() < 0.2) addStrike({ x: m.x, y: m.y, t: 0.3, r: 14, dmg: D * 1.5, kind: 'sword' }); },
    bloodpact: (s, m, c, D) => fxHit(m, D * (1 - P.hp / ST.maxHp)),
    erase: (s, m) => { if (!m.dead && !m.boss && !m.d.grinner && !m.d.crawler && m.hp < m.max * 0.15) { xslash(m.x, m.y - m.hh, '#ff6ad0'); fxHit(m, m.hp + 1); } },
    spike: (s, m, c, D) => { if (Math.random() < 0.15) addStrike({ x: m.x, y: m.y, t: 0.25, r: 12, dmg: D * 1.5, kind: 'bone' }); },
    wail: (s, m) => { if (Math.random() < 0.12) { fxAround(m.x, m.y, 30, o => fxStun(o, 0.6)); fxRing(m.x, m.y - m.hh, 34, '#dfe7ff'); } },
    snare: (s, m, c, D) => { if (Math.random() < 0.2) addZone({ kind: 'vortex', x: m.x, y: m.y, r: 24, t: 0.8, dps: D * 0.1, pull: 1.4 }); },
    wraithchill: (s, m) => { fxAround(m.x, m.y, 26, o => fxSlow(o, 1.5)); },
    curse: (s, m) => { m.cursed = true; },
  };
  const FX_BLAST = {
    embers: s => fxShards(s.x, s.y, 3, s.dmg * 0.4, '#ff9a3c', s.hit),
    sunburst: s => { aoe(s.x, s.y, 55, s.dmg * 0.4, { burn: true }); fxRing(s.x, s.y, 60, '#ffd84d'); },
    timeslow: s => { fxAround(s.x, s.y, 90, m => fxSlow(m, 3)); fxRing(s.x, s.y, 95, '#ffffff'); },
  };
  const FX_KILL = {
    sunfire: (m, D) => { aoe(m.x, m.y - m.hh * 0.5, 28, D * 0.6, { burn: true }); fxRing(m.x, m.y - m.hh, 32, '#ffd84d'); },
    regrowth: () => fxHeal(0.02),
    lucky: m => { if (Math.random() < 0.25) dropAt(m.x, m.y - 4, 'gold', m.d.gold * goldMulS(S.stage) * ST.goldMul * 2); },
    rot: (m, D) => { fxAround(m.x, m.y, 32, o => fxBleed(o, D * 0.3)); fxRing(m.x, m.y - m.hh, 34, '#6ee07a'); },
    bonecage: (m, D) => fxShards(m.x, m.y - m.hh, 6, D * 0.4, '#e9e4d4', [m]),
    curse: (m, D) => { if (m.cursed) { aoe(m.x, m.y - m.hh * 0.5, 30, D, {}); fxRing(m.x, m.y - m.hh, 34, '#a06ad0'); } },
    harvest: () => { G.cd.q = Math.max(0, G.cd.q - 0.4); G.cd.e = Math.max(0, G.cd.e - 0.4); },
  };
  function onSwing(a) {
    const fx = curFx(), D = ST.dmg;
    if (!fx) return;
    G.swings++;
    if (FX_SWING[fx]) FX_SWING[fx](a, D);
    if (fx === 'quake') {
      const x = P.x + Math.cos(a) * ST.reach * 0.8, y = P.y - 2 + Math.sin(a) * ST.reach * 0.6;
      aoe(x, y, 22, D * 0.6, { stun: 0.6, kb: 140 });
      G.fx.push({ ring: true, x, y, t: 0.3, max: 24, c: '#d6b482' });
      for (let i = 0; i < 12; i++) G.fx.push({ x: x + rand(-8, 8), y, vx: rand(-60, 60), vy: rand(-50, -10), t: rand(0.3, 0.5), c: i % 3 ? 'rgba(214,180,130,0.85)' : '#8a5a2b', s: 2.5, nograv: true, smoke: true });
      G.shake = Math.max(G.shake, 0.08);
    }
    if (fx === 'beam' && G.swings % 2 === 0) launchWave(a, 'wavelight', D * 0.8);
    if (fx === 'flamewave') launchWave(a, 'wavefire', D * 0.7, true);
    if (fx === 'royal') {
      launchWave(a, 'wavegold', D * 0.9);
      if (G.swings % 4 === 0) {
        const near = G.monsters.filter(m => !m.dead && m.rise <= 0 && Math.hypot(m.x - P.x, m.y - P.y) < 150).sort((p, q) => Math.hypot(p.x - P.x, p.y - P.y) - Math.hypot(q.x - P.x, q.y - P.y)).slice(0, 3);
        for (const m of near) { G.fx.push({ bolt: true, x: m.x, y: m.y - m.hh, t: 0.2, seed: Math.random() * 99 }); damage(m, D * 2, 0, 0); }
        if (near.length) { sfx.zap(); G.shake = Math.max(G.shake, 0.08); }
      }
    }
  }
  function onFire(a, sx, sy) {
    const fx = curFx();
    if (!fx) return;
    G.fired++;
    if (FX_FIRE[fx]) FX_FIRE[fx](a, sx, sy, ST.dmg);
    if (fx === 'ricochet' || fx === 'dragonfire')
      for (let i = 0; i < 3; i++) G.fx.push({ x: sx, y: sy, vx: Math.cos(a) * rand(8, 20) + rand(-6, 6), vy: rand(-20, -6), t: 0.7, c: 'rgba(220,210,190,0.6)', s: 3, nograv: true, smoke: true });
    if (fx === 'abyss' && G.fired % 4 === 0) {
      const t = nearest(P.x, P.y - 8, 170);
      if (t) addStrike({ x: t.x, y: t.y, t: 0.45, r: 24, dmg: ST.dmg * 3, stun: 1, kind: 'tentacle' });
    }
  }
  function onHit(s, m, crit) {
    if (s.burn) m.poison = { dps: s.dmg * 0.4, t: 2.5, acc: 0, fire: true };
    const f = s.wfx;
    if (!f) return;
    const D = s.dmg;
    if (FX_HIT[f.fx]) FX_HIT[f.fx](s, m, crit, D);
    switch (f.fx) {
      case 'vines': if (!m.boss) m.stunT = Math.max(m.stunT || 0, 0.8); addZone({ kind: 'vines', x: m.x, y: m.y, r: 16, t: 1.6, dps: D * 0.2 }); break;
      case 'starfall':
        if (Math.random() < 0.3) for (let i = 0; i < 3; i++) addStrike({ x: m.x + rand(-16, 16), y: m.y + rand(-10, 10), t: 0.3 + i * 0.12, r: 12, dmg: D, kind: 'star' });
        break;
      case 'thunder': if (Math.random() < 0.15 && !m.boss) m.stunT = Math.max(m.stunT || 0, 0.45); break;
      case 'toxic': addZone({ kind: 'toxic', x: m.x, y: m.y, r: 18, t: 2.5, dps: D * 0.4 }); break;
      case 'shadow': if (crit) { aoe(m.x, m.y - m.hh * 0.5, 16, D, {}); xslash(m.x, m.y - m.hh, '#a06ad0'); } break;
      case 'reaper': P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * 0.002); break;
      case 'night': if (Math.random() < 0.25) { aoe(m.x, m.y - m.hh * 0.5, 18, D * 1.5, {}); xslash(m.x, m.y - m.hh, '#c78cff'); } break;
      case 'crown':
        if (!s.split) {
          s.split = true;
          const a = Math.atan2(s.vy, s.vx);
          for (const da of [-0.9, 0.9]) G.shots.push({ x: s.x, y: s.y, vx: Math.cos(a + da) * 180, vy: Math.sin(a + da) * 180, dmg: D * 0.5, pierce: 0, chain: 0, splash: 0,
            type: 'soul', look: 'crownsoul', k: 0.7, life: 0.8, hit: new Set(s.hit), home: true, split: true, wfx: f, trail: f.trail });
        }
        break;
    }
  }
  function onExplode(s) {
    const f = s.wfx;
    if (!f) return;
    if (FX_BLAST[f.fx]) FX_BLAST[f.fx](s);
    if (f.fx === 'dragonfire') addZone({ kind: 'fire', x: s.x, y: s.y + 4, r: 24, t: 2.5, dps: s.dmg * 0.5 });
    if (f.fx === 'arcane') addZone({ kind: 'vortex', x: s.x, y: s.y + 4, r: 30, t: 1, dps: s.dmg * 0.3, pull: 1.6 });
    if (f.fx === 'void') addZone({ kind: 'vortex', x: s.x, y: s.y + 4, r: 44, t: 1.8, dps: s.dmg * 0.5, pull: 3, implode: s.dmg * 2, big: true });
    if (f.fx === 'supernova')
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 + Math.random();
        G.shots.push({ x: s.x, y: s.y, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, dmg: s.dmg * 0.4, pierce: 1, chain: 0, splash: 0, type: 'shard', look: 'starorb', k: 0.6, life: 0.32, hit: new Set(s.hit), trail: '#ffe04a' });
      }
  }
  function onKill(m) {
    const fx = curFx();
    if (FX_KILL[fx]) FX_KILL[fx](m, ST.dmg);
    if (fx === 'lich' && Math.random() < 0.35 && G.minions.filter(x => x.lich).length < 3) {
      G.minions.push({ kind: 'skel', lich: true, x: m.x, y: m.y, t: 8, cd: 0.3, face: 1, ph: 0, i: G.minions.length, rise: 0.4 });
      for (let k = 0; k < 10; k++) G.fx.push({ x: m.x + rand(-5, 5), y: m.y, vx: rand(-15, 15), vy: rand(-45, -10), t: 0.6, c: k % 2 ? '#7fe8ff' : '#6ee07a', s: 2, nograv: true });
    }
    if (fx === 'lantern') {
      const t = nearest(m.x, m.y - m.hh, 180, new Set([m]));
      if (t) {
        const a = Math.atan2((t.y - t.hh) - (m.y - m.hh), t.x - m.x);
        G.shots.push({ x: m.x, y: m.y - m.hh, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, dmg: ST.dmg * 0.6, pierce: 0, chain: 0, splash: 0,
          type: 'soul', look: 'lanternsoul', life: 1.4, hit: new Set(), home: true, wfx: null, trail: '#e0ff8a' });
      }
    }
  }
  // impact colours per strike kind: [ring, sparks]
  const STRIKE_COL = { star: ['#ffe04a', '#fff2a0'], tentacle: ['#a06ad0', '#4fd8a0'], sword: ['#ffffff', '#cfe9ff'], bone: ['#e9e4d4', '#a8a088'],
    holy: ['#fff2a0', '#ffffff'], fire: ['#ff6a1a', '#ffd25a'] };
  // ================= weapon E skills =================
  function skillShot(sk, a) {
    const h = handPos(a), sp = sk.wave ? 230 : (ST.spd || 230);
    G.shots.push({ x: h.x + Math.cos(a) * 6, y: h.y + Math.sin(a) * 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: ST.dmg * (sk.mult || 1),
      pierce: sk.pierce != null ? sk.pierce : (sk.wave ? 99 : ST.pierce), chain: sk.wave ? 0 : ST.chain, splash: sk.wave ? 0 : ST.splash,
      type: sk.wave ? 'wave' : ST.shot, look: sk.look || (ST.wfx && ST.wfx.look) || null, burn: sk.burn,
      life: sk.life || (sk.wave ? 0.55 : (ST.range ? ST.range * 1.5 / sp : 0.6)), hit: new Set(), home: sk.home || ST.shot === 'soul',
      wfx: ST.wfx, trail: (ST.wfx && ST.wfx.trail) || (sk.wave ? (sk.burn ? '#ff9a3c' : '#cfe9ff') : null) });
  }
  function skillTargets(n, range) {
    return G.monsters.filter(m => !m.dead && m.rise <= 0 && Math.hypot(m.x - P.x, m.y - P.y) < range)
      .sort((p, q) => Math.hypot(p.x - P.x, p.y - P.y) - Math.hypot(q.x - P.x, q.y - P.y)).slice(0, n);
  }
  function runSkill(sk) {
    const D = ST.dmg * (sk.mult || 1), aim = P.aim, aw = aimWorld();
    switch (sk.kind) {
      case 'fan':
        for (let i = 0; i < sk.n; i++) skillShot(sk, sk.ring ? aim + i / sk.n * TAU : aim + (sk.n > 1 ? (i / (sk.n - 1) - 0.5) * sk.spread : 0));
        P.recoil = 1; G.flashT = 0.07; sfx.shoot(sk.wave ? 'slash' : ST.shot);
        break;
      case 'barrage': G.bursts.push({ sk, n: sk.n, t: 0 }); break;
      case 'quake': {
        const x = sk.front ? P.x + Math.cos(aim) * 22 : P.x, y = sk.front ? P.y - 4 + Math.sin(aim) * 16 : P.y;
        aoe(x, y, sk.r, D, { stun: sk.stun, kb: 220 });
        G.fx.push({ ring: true, x, y, t: 0.3, max: sk.r, c: '#d6b482' }); G.fx.push({ ring: true, x, y, t: 0.3, max: sk.r * 0.6, c: '#ffffff' });
        for (let i = 0; i < 24; i++) { const a = Math.random() * TAU; G.fx.push({ x: x + Math.cos(a) * 8, y, vx: Math.cos(a) * rand(50, 150), vy: Math.sin(a) * rand(25, 70) - 15, t: rand(0.3, 0.6), c: 'rgba(214,180,130,0.85)', s: 3, nograv: true, smoke: true }); }
        G.shake = Math.max(G.shake, sk.r > 50 ? 0.3 : 0.12); sfx.thud();
        if (sk.front) { P.swing = 1; P.swingDir = -P.swingDir; }
        break;
      }
      case 'whirl': G.whirlT = sk.t; G.whirlTick = 0; sfx.charge(); break;
      case 'zone': {
        addZone({ kind: sk.zkind, x: aw.x, y: aw.y, r: sk.r, t: sk.t, dps: D, pull: sk.pull, implode: sk.implode ? ST.dmg * sk.implode : 0, big: sk.big });
        if (sk.root) for (const m of G.monsters) if (!m.dead && !m.boss && Math.hypot(m.x - aw.x, (m.y - aw.y) * 1.4) < sk.r + m.r) m.stunT = Math.max(m.stunT || 0, sk.t);
        G.fx.push({ ring: true, x: aw.x, y: aw.y, t: 0.3, max: sk.r, c: { vines: '#6ee07a', frost: '#9fe0ff', vortex: '#c78cff' }[sk.zkind] || '#ffffff' });
        sfx.charge();
        break;
      }
      case 'strikes': {
        let pts = [];
        if (sk.mode === 'line') for (let i = 0; i < sk.n; i++) pts.push({ x: P.x + Math.cos(aim) * (28 + i * 26), y: P.y + Math.sin(aim) * (28 + i * 26) * 0.8 });
        else if (sk.mode === 'enemies') pts = skillTargets(sk.n, 230).map(m => ({ x: m.x, y: m.y }));
        while (pts.length < sk.n) { const a = Math.random() * TAU, d = Math.random() * 40; pts.push({ x: aw.x + Math.cos(a) * d, y: aw.y + Math.sin(a) * d * 0.7 }); }
        pts.forEach((p, i) => addStrike({ x: p.x, y: p.y, t: 0.3 + i * (sk.mode === 'line' ? 0.12 : 0.08), r: sk.r, dmg: D, stun: sk.stun, kind: sk.skind }));
        break;
      }
      case 'fireball': {
        const h = handPos(aim);
        G.shots.push({ x: h.x, y: h.y, vx: Math.cos(aim) * 170, vy: Math.sin(aim) * 170, dmg: D, pierce: 0, chain: 0, splash: 52, type: 'fire', k: 2.4,
          life: 1.2, hit: new Set(), wfx: { fx: 'dragonfire' }, trail: '#ff9a3c' });
        P.recoil = 1; sfx.shoot('fire'); break;
      }
      case 'chain': {
        let cx = P.x, cy = P.y - 8; const hit = new Set();
        for (let i = 0; i < sk.n; i++) {
          const m = nearest(cx, cy, i ? 140 : 190, hit);
          if (!m) break;
          G.fx.push({ zap: true, x1: cx, y1: cy, x2: m.x, y2: m.y - m.hh, t: 0.3, c: '#bff4ff', seed: Math.random() * 99 });
          hit.add(m); damage(m, D, 0, 0); if (!m.boss) m.stunT = Math.max(m.stunT || 0, 0.4);
          cx = m.x; cy = m.y - m.hh;
        }
        sfx.zap(); G.shake = Math.max(G.shake, 0.06); break;
      }
      case 'clouds':
        for (let i = 0; i < sk.n; i++) { const a = i / sk.n * TAU; addZone({ kind: 'toxic', x: P.x + Math.cos(a) * 38, y: P.y + Math.sin(a) * 26, r: 22, t: 3.5, dps: D }); }
        sfx.spit(); break;
      case 'clones':
        for (const m of skillTargets(sk.n, 170)) {
          G.fx.push({ ghost: true, spr: heroSprite(), flip: m.x < P.x, x: m.x + (m.x < P.x ? 8 : -8), y: m.y, t: 0.35, tint: sk.col });
          xslash(m.x, m.y - m.hh, sk.col); damage(m, D, 0, 0);
        }
        sfx.shoot('knife'); break;
      case 'eclipse':
        G.darkT = 0.7; G.invisT = Math.max(G.invisT, 2);
        for (const m of skillTargets(99, sk.r)) { xslash(m.x, m.y - m.hh, '#c78cff'); damage(m, D, 0, 0); }
        sfx.boom(); break;
      case 'summon':
        for (let i = 0; i < sk.skel; i++) {
          const a = i / sk.skel * TAU, x = P.x + Math.cos(a) * 20, y = P.y + Math.sin(a) * 14;
          G.minions.push({ kind: 'skel', extra: true, x, y, t: sk.t, cd: 0.4, face: 1, ph: Math.random() * 4, i: G.minions.length, rise: 0.4 });
          for (let k = 0; k < 8; k++) G.fx.push({ x: x + rand(-5, 5), y, vx: rand(-15, 15), vy: rand(-40, -10), t: 0.5, c: '#6ee07a', s: 2, nograv: true });
        }
        if (sk.golem) G.minions.push({ kind: 'golem', x: P.x + Math.cos(aim) * 24, y: P.y + Math.sin(aim) * 16, t: sk.t, cd: 0.8, face: 1, ph: 0, i: 0, rise: 0.5 });
        sfx.boss(); break;
      case 'nova':
        G.fx.push({ ring: true, x: P.x, y: P.y - 6, t: 0.3, max: sk.r, c: '#7fe8ff' }); G.fx.push({ ring: true, x: P.x, y: P.y - 6, t: 0.3, max: sk.r * 0.6, c: '#ffffff' });
        for (let i = 0; i < 30; i++) { const a = Math.random() * TAU; G.fx.push({ x: P.x, y: P.y - 6, vx: Math.cos(a) * rand(70, 160), vy: Math.sin(a) * rand(70, 160), t: rand(0.3, 0.6), c: i % 2 ? '#bfe8ff' : '#ffffff', s: 2, nograv: true }); }
        for (const m of skillTargets(99, sk.r)) { damage(m, D, 0, 0); m.stunT = Math.max(m.stunT || 0, m.boss ? 0.7 : sk.stun); m.iceT = m.stunT; }
        sfx.shoot('frost'); break;
    }
  }

  // ground zones and delayed strikes tick here
  function updateEffects(dt) {
    for (const z of G.zones) {
      z.t -= dt; z.acc += dt;
      const inZone = m => Math.hypot(m.x - z.x, (m.y - z.y) * 1.4) < z.r + m.r;
      if (z.pull) for (const m of G.monsters) {
        if (m.dead || m.boss || m.rise > 0) continue;
        const dx = z.x - m.x, dy = z.y - m.y, d = Math.hypot(dx, dy);
        if (d < z.r * 1.7 && d > 3) { m.x += dx / d * z.pull * 30 * dt; m.y += dy / d * z.pull * 30 * dt; }
      }
      if (z.kind === 'vines' || z.kind === 'frost') for (const m of G.monsters) if (!m.dead && inZone(m)) m.slowT = Math.max(m.slowT || 0, 0.3);
      if (z.acc >= 0.3) {
        z.acc -= 0.3;
        for (const m of G.monsters.slice()) if (!m.dead && m.rise <= 0 && inZone(m)) damage(m, z.dps * 0.3, 0, 0);
      }
      if (z.t <= 0 && z.implode) {
        aoe(z.x, z.y, z.r, z.implode, { kb: 30 });
        G.fx.push({ ring: true, x: z.x, y: z.y, t: 0.3, max: z.r + 10, c: '#c78cff' }); G.fx.push({ ring: true, x: z.x, y: z.y, t: 0.3, max: z.r * 0.5, c: '#ffffff' });
        for (let i = 0; i < 20; i++) G.fx.push({ x: z.x, y: z.y - 4, vx: rand(-110, 110), vy: rand(-110, 40), t: rand(0.3, 0.6), c: i % 2 ? '#c78cff' : '#2a1440', s: 2.5 });
        G.shake = Math.max(G.shake, 0.2); sfx.boom();
      }
    }
    G.zones = G.zones.filter(z => z.t > 0);
    for (const k of G.strikes) {
      k.t -= dt;
      if (k.t <= 0 && !k.hit) {
        k.hit = true;
        aoe(k.x, k.y, k.r, k.dmg, { stun: k.stun, kb: 90, burn: k.kind === 'fire' });
        const c = STRIKE_COL[k.kind] || STRIKE_COL.star;
        G.fx.push({ ring: true, x: k.x, y: k.y, t: 0.3, max: k.r + 8, c: c[0] });
        for (let i = 0; i < 14; i++) G.fx.push({ x: k.x, y: k.y - 3, vx: rand(-70, 70), vy: rand(-90, -10), t: rand(0.3, 0.6), c: c[i % 2], s: 2 });
        if (k.kind === 'fire') for (let i = 0; i < 4; i++) G.fx.push({ x: k.x + rand(-8, 8), y: k.y - 4, vx: rand(-15, 15), vy: rand(-25, -8), t: 0.8, c: 'rgba(70,50,40,0.6)', s: 5, nograv: true, smoke: true });
        if (k.kind === 'star' || k.kind === 'holy') sfx.zap(); else { G.shake = Math.max(G.shake, 0.1); k.kind === 'fire' ? sfx.boom() : sfx.thud(); }
      }
      if (k.hit) k.after -= dt;
    }
    G.strikes = G.strikes.filter(k => !k.hit || k.after > 0);
  }

  function damage(m, base, kx, ky) {
    if (m.dead) return false;
    const crit = Math.random() < ST.crit, v = base * (crit ? ST.critMul : 1) * (m.ab.armored ? 0.55 : 1) * (m.sub ? 0.3 : 1);
    m.hp -= v; m.flash = 0.09; m.hitT = 0;
    if (!m.boss && !m.ab.mighty && !m.jump && !m.dash) { m.kx += kx * 0.12 / m.scale; m.ky += ky * 0.12 / m.scale; }
    if (m.ab.armored) for (let i = 0; i < 2; i++) G.fx.push({ x: m.x + rand(-3, 3), y: m.y - m.hh, vx: rand(-40, 40), vy: rand(-50, -10), t: 0.2, c: '#e8eef2', s: 1 });
    G.texts.push({ x: m.x + rand(-4, 4), y: m.y - m.hh * 2 - 2, s: fmt(Math.max(1, v)), crit, steel: m.ab.armored, t: 0.75 });
    sfx.hit();
    if (m.hp <= 0) kill(m);
    return crit;
  }

