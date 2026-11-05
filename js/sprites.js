  // ================= pixel sprites =================
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function tinted(src, color) {
    const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  // adds a 1px dark outline (Stardew-style), plus white (hit flash) and black (shadow) silhouettes
  function finalize(src) {
    const sw = src.width, sh = src.height, d = src.getContext('2d').getImageData(0, 0, sw, sh).data;
    const op = (x, y) => x >= 0 && y >= 0 && x < sw && y < sh && d[(y * sw + x) * 4 + 3] > 0;
    const c = mkCanvas(sw + 2, sh + 2), g = c.getContext('2d');
    g.fillStyle = OUTLINE;
    for (let y = -1; y <= sh; y++) for (let x = -1; x <= sw; x++) {
      if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) g.fillRect(x + 1, y + 1, 1, 1);
    }
    g.drawImage(src, 1, 1);
    return { c, white: tinted(c, '#ffffff'), dark: tinted(c, '#000000'), w: c.width, h: c.height };
  }
  function sprite(rows, pal) {
    const c = mkCanvas(rows[0].length, rows.length), g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    const o = finalize(c);
    o.rows = rows; o.pal = pal;
    return o;
  }
  // a copy of a sprite with some rows swapped out: used to build animation frames
  const variant = (spr, edits) => sprite(spr.rows.map((r, i) => edits[i] != null ? edits[i] : r), spr.pal);
  function paint(w, h, fn) { const c = mkCanvas(w, h), g = c.getContext('2d'); fn(g); return finalize(c); }
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  function disc(g, cx, cy, r, col) { g.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const dx = Math.floor(Math.sqrt(r * r - dy * dy)); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } }
  function oval(g, cx, cy, rx, ry, col) { g.fillStyle = col; for (let dy = -ry; dy <= ry; dy++) { const dx = Math.floor(rx * Math.sqrt(1 - (dy * dy) / (ry * ry))); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } }

  // ---------- hero: drawn per direction and pose so the walk has real steps ----------
  const HC = { hat: '#8a5428', hatD: '#5e3518', band: '#d9a441', skin: '#f4c9a0', skinD: '#d9a077', eye: '#2b1d14', hair: '#6b3b1c',
    belt: '#4a2d18', buckle: '#e2c050', pants: '#3d4a6b', pantsD: '#2c3650', boot: '#4a2d18', pack: '#8a5a2b', packL: '#a8763f' };
  const heroCache = {};
  // arms=false leaves the arms off: in play they're drawn live so the hands can grip the weapon
  // class headgear: ranger hat, warrior helmet, mage hat, rogue hood and mask, summoner hood
  function drawHat(P_, side, up, cls, hy, blink) {
    if (cls === 'mage') {
      const h = '#5a3fa0', d = '#3d2a70';
      if (side) { P_(2, -1 + hy, 2, 1, h); P_(3, 0 + hy, 4, 1, h); P_(4, 1 + hy, 5, 1, h); P_(4, 2 + hy, 5, 1, '#ffd84d'); P_(3, 3 + hy, 9, 1, d); }
      else { P_(6, -1 + hy, 2, 1, h); P_(5, 0 + hy, 4, 1, h); P_(4, 1 + hy, 6, 1, h); P_(4, 2 + hy, 6, 1, '#ffd84d'); P_(2, 3 + hy, 10, 1, d); if (!up) P_(6, 1 + hy, 1, 1, '#ffe04a'); }
    } else if (cls === 'warrior') {
      const l = '#e2e8ee', m = '#a8b2ba', d = '#6a7078';
      if (side) { P_(4, -1 + hy, 3, 1, '#d8402a'); P_(4, 0 + hy, 5, 1, l); P_(3, 1 + hy, 7, 3, m); P_(3, 3 + hy, 7, 1, d); P_(3, 4 + hy, 2, 3, m); P_(9, 4 + hy, 1, 2, d); }
      else { P_(6, -1 + hy, 2, 1, '#d8402a'); P_(4, 0 + hy, 6, 1, l); P_(3, 1 + hy, 8, 3, m); P_(3, 3 + hy, 8, 1, d); P_(3, 4 + hy, 1, 3, m); P_(10, 4 + hy, 1, 3, m); if (!up) P_(6, 4 + hy, 2, 2, d); }
    } else if (cls === 'rogue' || cls === 'summoner') {
      const rogue = cls === 'rogue', h = rogue ? '#3a3540' : '#3d2a4a', trim = rogue ? '#24202a' : '#6ee07a';
      if (side) {
        P_(3, 0 + hy, 6, 1, h); P_(2, 1 + hy, 8, 3, h); P_(2, 3 + hy, 3, 6, h); P_(3, 3 + hy, 7, 1, trim);
        if (rogue) P_(7, 7 + hy, 4, 2, '#24202a'); else if (!blink) P_(8, 6 + hy, 1, 1, '#6ee07a');
      } else {
        P_(4, 0 + hy, 6, 1, h); P_(3, 1 + hy, 8, 3, h); P_(2, 3 + hy, 2, 6, h); P_(10, 3 + hy, 2, 6, h); P_(3, 3 + hy, 8, 1, trim);
        if (up) P_(3, 4 + hy, 8, 5, h);
        else if (rogue) P_(4, 7 + hy, 6, 2, '#24202a');
        else if (!blink) { P_(5, 6 + hy, 1, 1, '#6ee07a'); P_(8, 6 + hy, 1, 1, '#6ee07a'); }
      }
    } else {
      if (side) { P_(4, 0 + hy, 5, 2, HC.hat); P_(4, 2 + hy, 5, 1, HC.band); P_(3, 3 + hy, 9, 1, HC.hatD); }
      else { P_(4, 0 + hy, 6, 2, HC.hat); P_(4, 2 + hy, 6, 1, HC.band); P_(2, 3 + hy, 10, 1, HC.hatD); }
    }
  }
  function hero(armor, dir, pose, blink, arms = true, cls = (S && S.cls) || 'ranger') {
    const key = `${armor.id}|${dir}|${pose}|${blink ? 1 : 0}|${arms ? 1 : 0}|${cls}`;
    if (heroCache[key]) return heroCache[key];
    const c = mkCanvas(14, 19), g = c.getContext('2d');
    g.translate(0, 1);
    const P_ = (x, y, w, h, col) => px(g, x, y, w, h, col);
    const a = armor.c[0], A_ = armor.c[1];
    const walk = typeof pose === 'number';
    const lift = walk && (pose === 1 || pose === 3) ? -1 : 0;
    const hy = lift + (pose === 'i1' ? 1 : 0), by = lift;
    if (dir === 'side') {
      const legTop = 14 + by;
      const L = walk ? [[4, 8], [6, 6], [8, 4], [6, 6]][pose] : [5, 7];
      P_(L[0], legTop, 2, 17 - legTop, HC.pantsD); P_(L[0], 17, 2, 1, HC.boot);
      P_(L[1], legTop, 2, 17 - legTop, HC.pants); P_(L[1], 17, 3, 1, HC.boot);
      P_(3, 9 + by, 2, 4, HC.pack); P_(3, 9 + by, 2, 1, HC.packL);
      P_(5, 9 + by, 5, 5, a); P_(5, 9 + by, 1, 5, A_); P_(5, 12 + by, 5, 1, HC.belt);
      P_(4, 4 + hy, 6, 5, HC.skin); P_(4, 4 + hy, 2, 4, HC.hair); P_(6, 6 + hy, 1, 1, HC.skinD);
      P_(8, 6 + hy, 1, 1, blink ? HC.skinD : HC.eye); P_(10, 6 + hy, 1, 2, HC.skin);
      drawHat(P_, true, false, cls, hy, blink);
      const sw = walk ? [2, 0, -2, 0][pose] : 0;
      if (arms) {
        P_(7, 9 + by, 2, 2, A_);
        P_(7 + Math.sign(sw), 11 + by, 2, 1, A_);
        P_(7 + sw, 12 + by, 2, 1, HC.skin);
      } else P_(7, 9 + by, 2, 1, A_);
    } else {
      const up = dir === 'up', legTop = 14 + by;
      let lY = 17, rY = 17;
      if (walk) { if (pose === 0) rY = 16; if (pose === 2) lY = 16; }
      P_(4, legTop, 2, lY - legTop, HC.pants); P_(4, lY, 2, 1, HC.boot);
      P_(8, legTop, 2, rY - legTop, HC.pants); P_(8, rY, 2, 1, HC.boot);
      P_(3, 9 + by, 8, 5, a); P_(3, 9 + by, 1, 5, A_); P_(10, 9 + by, 1, 5, A_);
      P_(3, 12 + by, 8, 1, HC.belt);
      if (!up) { P_(6, 12 + by, 2, 1, HC.buckle); P_(6, 9 + by, 2, 1, HC.skinD); }
      else { P_(5, 9 + by, 4, 3, HC.pack); P_(5, 9 + by, 4, 1, HC.packL); }
      const sL = walk ? [1, 0, -1, 0][pose] : 0, sR = -sL;
      if (arms) {
        P_(1, 9 + by, 2, 3 + sL, A_); P_(1, 12 + by + sL, 2, 1, HC.skin);
        P_(11, 9 + by, 2, 3 + sR, A_); P_(11, 12 + by + sR, 2, 1, HC.skin);
      } else { P_(2, 9 + by, 1, 2, A_); P_(11, 9 + by, 1, 2, A_); }
      P_(4, 4 + hy, 6, 5, up ? HC.hair : HC.skin);
      P_(3, 4 + hy, 1, 3, HC.hair); P_(10, 4 + hy, 1, 3, HC.hair);
      if (!up) {
        P_(9, 4 + hy, 1, 5, HC.skinD);
        const ec = blink ? HC.skinD : HC.eye;
        P_(5, 6 + hy, 1, 1, ec); P_(8, 6 + hy, 1, 1, ec); P_(6, 8 + hy, 2, 1, HC.skinD);
      }
      drawHat(P_, false, up, cls, hy, blink);
    }
    return (heroCache[key] = finalize(c));
  }

  const MON = {
    slime: { name: 'Slime', min: 1, hp: 10, dmg: 4, spd: 22, xp: 2, gold: 1, w: 1, spr: sprite([
      '....llll....',
      '..llllllll..',
      '.llwkllwkll.',
      '.llllllllll.',
      '.lllkkkklll.',
      'llllllllllll',
      '.LLLLLLLLLL.',
    ], { l: '#59c96b', L: '#3a9a4c', w: '#ffffff', k: '#1b2a1e' }) },
    bat: { name: 'Bat', min: 2, hp: 7, dmg: 3, spd: 46, xp: 2, gold: 1, w: 1, fly: true, spr: sprite([
      'v..........v',
      'vv..v..v..vv',
      'vvv.vvvv.vvv',
      'vvvvrvvrvvvv',
      '.vvvvvvvvvv.',
      '..v.vvvv.v..',
      '.....vv.....',
    ], { v: '#5b4570', r: '#ff4d4d' }) },
    skeleton: { name: 'Skeleton', min: 3, hp: 22, dmg: 6, spd: 30, xp: 4, gold: 2, w: 1.2, walker: true, spr: sprite([
      '....wwww....',
      '...wwwwww...',
      '...wkwwkw...',
      '...wwwwww...',
      '....wkkw....',
      '.....ww.....',
      '..wwwwwwww..',
      '.w..wkkw..w.',
      '.w..wwww..w.',
      '....wkkw....',
      '....wwww....',
      '....w..w....',
      '....w..w....',
      '...ww..ww...',
    ], { w: '#e9e4d4', k: '#3a352f' }) },
    zombie: { name: 'Zombie', min: 4, hp: 40, dmg: 9, spd: 20, xp: 6, gold: 3, w: 1.3, walker: true, spr: sprite([
      '............',
      '....gggg....',
      '...gggggg...',
      '...geggeg...',
      '...gggggg...',
      '...gkkkgg...',
      '..tttttt....',
      '.gtttttgggg.',
      '..tttttt....',
      '..tTtttT....',
      '..pppppp....',
      '..pp..pp....',
      '..pp..pp....',
      '.kk...kk....',
    ], { g: '#7fb069', e: '#d7263d', k: '#2b2b2b', t: '#4a6fa5', T: '#34507a', p: '#6b4f3a' }) },
    ghost: { name: 'Ghost', min: 6, hp: 30, dmg: 8, spd: 36, xp: 7, gold: 4, w: 1.3, alpha: 0.8, fly: true, spr: sprite([
      '....qqqq....',
      '..qqqqqqqq..',
      '.qqqqqqqqqq.',
      '.qqkkqqkkqq.',
      '.qqkkqqkkqq.',
      '.qqqqqqqqqq.',
      'qqqqqkkqqqqq',
      'qqqqqqqqqqqq',
      'qqqqqqqqqqqq',
      'qqqqqqqqqqqq',
      'qq.qqq.qqq.q',
      'q...q...q...',
    ], { q: '#dfe7ff', k: '#2d2a45' }) },
    cyclops: { name: 'Cyclops', min: 8, hp: 160, dmg: 18, spd: 16, xp: 25, gold: 15, w: 0.8, walker: true, spr: sprite([
      '.....oooooo.....',
      '....oooooooo....',
      '...oooowwwoooo..',
      '...ooowwkwwooo..',
      '...oooowwwoooo..',
      '...oooooooooo...',
      '....ookkkkoo....',
      '..oooooooooooo..',
      '.oooooooooooooo.',
      'oo.oooooooooo.oo',
      'oo.oooooooooo.cc',
      'oo.llllllllll.cc',
      '...llllllllll.cc',
      '...oooo..oooo.cc',
      '...oooo..oooo...',
      '...oooo..oooo...',
      '..kkkkk..kkkkk..',
    ], { o: '#c08a5a', w: '#ffffff', k: '#2a1c12', l: '#6b4423', c: '#8b5a2b' }) },
    // ---- biome natives: only spawn in their own biome; innate = elite behaviours they always have, without being elites ----
    toad: { name: 'Bog Toad', biome: 'swamp', min: 1, hp: 30, dmg: 8, spd: 24, xp: 6, gold: 3, w: 1, innate: ['leap'], blood: '#4f7a3a', spr: sprite([
      '..gg....gg..',
      '.gwkg..gwkg.',
      '.gggggggggg.',
      'gggggggggggg',
      'gkkkkkkkkkkg',
      'gbbbbbbbbbbg',
      '.gbbbbbbbbg.',
      'GG.gggggg.GG',
      'GGG......GGG',
    ], { g: '#4f7a3a', G: '#3a5a2a', b: '#a8b86a', w: '#ffffff', k: '#1b2a1e' }) },
    lurker: { name: 'Bog Lurker', biome: 'swamp', min: 1, hp: 35, dmg: 10, spd: 26, xp: 7, gold: 4, w: 1, lurk: true, blood: '#5e5038', spr: sprite([
      '....mmmm....',
      '...mmmmmm...',
      '..mmemmemm..',
      '..mmmmmmmm..',
      '.mmmkkkkmmm.',
      '.mMmmmmmmMm.',
      'mMmmmmmmmmMm',
      'mM.mmmmmm.Mm',
      'dddddddddddd',
    ], { m: '#3f5a34', M: '#2a3d24', e: '#ffe04a', k: '#101a10', d: '#5e5038' }) },
    wraith: { name: 'Ice Wraith', biome: 'frozen', min: 1, hp: 28, dmg: 7, spd: 32, xp: 6, gold: 3, w: 1, fly: true, alpha: 0.85, innate: ['spit'], hitFx: 'slow', blood: '#bfe4ff', spr: sprite([
      '....qqqq....',
      '..qqqqqqqq..',
      '.qqkeqqkeqq.',
      '.qqqqqqqqqq.',
      '.qqqkkkkqqq.',
      'qqQqqqqqqQqq',
      'qQ.qqqqqq.Qq',
      'Q..qQqqQq..Q',
      '...Q.QQ.Q...',
    ], { q: '#bfe4ff', Q: '#7fb4e8', k: '#1a2a4a', e: '#7fd1ff' }) },
    frostgolem: { name: 'Frost Golem', biome: 'frozen', min: 1, hp: 120, dmg: 15, spd: 14, xp: 18, gold: 10, w: 0.6, walker: true, innate: ['armored'], hitFx: 'slow', blood: '#a8d4f0', spr: sprite([
      '....wwwwww....',
      '...wiiiiiiw...',
      '...ikkiikki...',
      '...iiiiiiii...',
      '..wwiiiiiiww..',
      '.wiiiiiiiiiiw.',
      'wiiIiiiiiiIiiw',
      'iiIIiiiiiiIIii',
      'ii.iiiiiiii.ii',
      '...iiiIIiii...',
      '...iii..iii...',
      '..IIII..IIII..',
    ], { i: '#a8d4f0', I: '#6f9cc8', w: '#e8f6ff', k: '#1a2a4a' }) },
    imp: { name: 'Fire Imp', biome: 'ember', min: 1, hp: 18, dmg: 6, spd: 44, xp: 5, gold: 3, w: 1, trail: true, blood: '#ff9a3c', spr: sprite([
      '.r........r.',
      '.rr......rr.',
      '..rrrrrrrr..',
      '..rykrrykr..',
      '..rrrrrrrr..',
      '...rkkkkr...',
      '.oorrrrrroo.',
      'o..rrrrrr..o',
      '...rr..rr...',
      '..RR....RR..',
    ], { r: '#e5484d', R: '#a8262b', y: '#ffe04a', k: '#2a0a06', o: '#ff9a3c' }) },
    brute: { name: 'Magma Brute', biome: 'ember', min: 1, hp: 100, dmg: 16, spd: 18, xp: 16, gold: 9, w: 0.6, walker: true, innate: ['dash', 'volatile'], blood: '#ff6a1a', spr: sprite([
      '....mmmmmm....',
      '...mmmmmmmm...',
      '...mlymmylm...',
      '...mmmmmmmm...',
      '..mmmllllmmm..',
      '.mmmmmmmmmmmm.',
      'mmlmmmmmmmmlmm',
      'mm.mmlmmlmm.mm',
      'll.mmmmmmmm.ll',
      '...mmmlmmmm...',
      '...mmm..mmm...',
      '..llll..llll..',
    ], { m: '#3a2a26', l: '#ff6a1a', y: '#ffc24a', k: '#120806' }) },
    scorpion: { name: 'Sand Scorpion', biome: 'desert', min: 1, hp: 26, dmg: 8, spd: 36, xp: 6, gold: 3, w: 1, hitFx: 'poison', blood: '#c9883a', spr: sprite([
      '..........tt..',
      '..........sS..',
      '...........s..',
      '..........ss..',
      '.s.s.....ss...',
      'ss.ssssssss...',
      's.sksssksss...',
      '..ssssssss....',
      '.s.s.s.s.s....',
      's.s.s.s.s.s...',
    ], { s: '#c9883a', S: '#8a5a2b', k: '#2a1406', t: '#e5484d' }) },
    mummy: { name: 'Mummy', biome: 'desert', min: 1, hp: 60, dmg: 10, spd: 18, xp: 9, gold: 5, w: 1, walker: true, innate: ['regen'], blood: '#e8dcc0', spr: sprite([
      '....wwww....',
      '...wWwwWw...',
      '..wkewwkew..',
      '...wwwwww...',
      '...WwwwwW...',
      '..wwWwwWww..',
      '.wwwwwwwwww.',
      '.wWwwWwwWww.',
      '..wwwwwwww..',
      '..wwW..Www..',
      '..ww....ww..',
      '.WWW....WWW.',
    ], { w: '#e8dcc0', W: '#b8a888', k: '#2a1406', e: '#4fe04a' }) },
  };
  // ---- The Grinner: the only thing in the Backrooms. A 3.5 m stick-thin black figure, twice your height, joints bulging
  // at the elbows and knees, no eyes, and a grin of teeth from cheek to cheek. Poses: 0 stand, 1/2 stride, 'atk' reach.
  // drawn facing right (the game mirrors it to face left): about three times your height, badly hunched, the spine
  // curving into a hump so the eyeless head hangs forward and low in front of its shoulders
  function grinnerRows(pose) {
    const W = 26, H = 62, g = Array.from({ length: H }, () => Array(W).fill('.'));
    const dot = (x, y, c = 'k') => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
    const line = (x0, y0, x1, y1, c = 'k', th = 1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) for (let t = 0; t < th; t++) dot(x0 + (x1 - x0) * i / n + t, y0 + (y1 - y0) * i / n, c);
    };
    const knob = (x, y) => { for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]]) dot(x + a, y + b, 'K'); };
    // the spine: up from the hips, bowing back into a hump, then the neck thrusting forward and down
    line(11, 38, 10, 28, 'k', 3); line(10, 28, 11, 18, 'k', 3); line(11, 18, 14, 13, 'k', 3); line(14, 13, 18, 15, 'k', 2);
    // the head hangs in front, lower than the hump: smooth, eyeless
    const hx = 20, hy = 21;
    for (let y = -6; y <= 6; y++) { const hw = Math.round(4.6 * Math.sqrt(Math.max(0, 1 - (y / 6.4) ** 2))); for (let x = -hw; x < hw; x++) dot(hx + x, hy + y); }
    // the grin wraps round the front of the face: gums and two packed rows of teeth (wider when it lunges)
    const open = pose === 'atk' ? 2 : 0;
    for (let x = hx - 3; x <= hx + 4; x++) for (let y = hy; y <= hy + 2 + open; y++) dot(x, y, 'r');
    for (let x = hx - 3; x <= hx + 4; x++) { dot(x, hy, x % 2 ? 'w' : 'W'); dot(x, hy + 2 + open, x % 2 ? 'W' : 'w'); }
    dot(hx - 4, hy - 1, 'w'); dot(hx + 5, hy - 1, 'W');
    // arms dangle from the hunched shoulders to below the knees; elbows bulge like they've popped
    if (pose === 'atk') {
      line(14, 15, 18, 10); line(18, 10, 24, 6); line(13, 16, 16, 13); line(16, 13, 22, 3);
      knob(18, 10); knob(16, 13); line(24, 6, 25, 3); line(24, 6, 25, 8); line(22, 3, 23, 0); line(22, 3, 24, 2);
    } else {
      line(13, 15, 8, 28); line(8, 28, 11, 42); line(15, 16, 19, 29); line(19, 29, 17, 44);
      knob(8, 28); knob(19, 29); line(11, 42, 10, 46); line(11, 42, 12, 46); line(17, 44, 16, 48); line(17, 44, 18, 48);
    }
    // long legs, knees bulging out
    const legs = pose === 1 ? [[7, 49, 7, 61], [16, 51, 15, 61]] : pose === 2 ? [[6, 51, 7, 61], [15, 49, 15, 61]] : [[6, 50, 9, 61], [16, 50, 13, 61]];
    const hips = [[10, 38], [12, 38]];
    legs.forEach(([kx, ky, fx, fy], i) => { line(hips[i][0], hips[i][1], kx, ky); line(kx, ky, fx, fy); knob(kx, ky); line(fx - 1, fy, fx + 2, fy); });
    return g.map(r => r.join(''));
  }
  MON.grinner = { name: 'The Grinner', biome: 'void', where: 'The Backrooms', min: 1, hp: 500, dmg: 30, spd: 70, xp: 80, gold: 50, w: 0, walker: true, grinner: true,
    blood: '#1a1a1e', spr: sprite(grinnerRows(0), { k: '#0b0b0e', K: '#26262e', r: '#4a0606', w: '#f2f2ea', W: '#c8c8bc' }) };
  // ---- the Crawlers: the Grinner's kin, down on all fours. No face at all, the spine bent up into a hump, the knees and
  // elbows jutting up above the back like a spider's. 'hollow' roams the halls; 'stalker' is longer, lower and creeps after you.
  function crawlerRows(kind, pose) {
    const W = 38, H = 28, g = Array.from({ length: H }, () => Array(W).fill('.'));
    const dot = (x, y, c = 'k') => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
    const line = (x0, y0, x1, y1, c = 'k', th = 1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) for (let t = 0; t < th; t++) dot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n + t, c);
    };
    const knob = (x, y) => { for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) dot(x + a, y + b, 'K'); };
    const st = kind === 'stalker';
    // walk poses 1..6 run round one stride; 0 stands, 'atk' reaches
    const ph = typeof pose === 'number' && pose > 0 ? (pose - 1) / 6 * Math.PI * 2 : null;
    const hump = (st ? 4 : 6) + (ph != null ? Math.round(Math.sin(ph * 2 + 1)) : 0); // the hump heaves up and down
    // the spine: hips, up into the hump, down to the shoulders, then the neck dropping the head to the floor
    line(8, 13, 13, hump + 1, 'k', 3); line(13, hump + 1, 19, hump, 'k', 3); line(19, hump, 25, 12, 'k', 3);
    for (let x = 11; x <= 22; x += 3) dot(x, hump - 1 + (x > 16 ? (x - 16) / 3 : 0), 'p'); // vertebrae poking through
    // the head swings low as it walks, and on one beat of the stride it snaps sideways and up, like a broken neck
    const snap = pose === (st ? 5 : 3);
    const hx = (st ? 32 : 30) + (snap ? 2 : 0), hy = (st ? 22 : 19) + (ph != null ? Math.round(Math.sin(ph * 2) * 1.4) : 0) - (snap ? 3 : 0);
    line(25, 13, hx - 2, hy - 2, 'k', 2);
    // the head: a smooth, featureless lump hanging upside-down-ish under the neck
    for (let y = -3; y <= 3; y++) { const hw = Math.round(3.2 * Math.sqrt(Math.max(0, 1 - (y / 3.4) ** 2))); for (let x = -hw; x <= hw; x++) dot(hx + x, hy + y); }
    if (st) dot(hx + 2, hy + 1, 'p'); // the stalker's jaw hangs a little open
    // legs: hips -> knee jutting up behind -> foot; arms: shoulders -> elbow jutting up -> hand. They walk in diagonal
    // pairs, each limb hoisting its knee or elbow high over the back before the hand or foot slaps back down
    const limb = (ax, ay, kx, ky, fx, off) => {
      let sw = 0, lift = 0;
      if (ph != null) { const a = ph + off; sw = Math.round(Math.cos(a) * 3); lift = Math.round(Math.max(0, Math.sin(a)) * 5); }
      const jx = kx + Math.round(sw / 2), jy = ky - Math.round(lift * 0.7), ex = fx + sw, ey = 27 - lift;
      line(ax, ay, jx, jy); line(jx, jy, ex, ey); knob(jx, jy);
      if (lift) { dot(ex + 1, ey + 1); dot(ex - 1, ey + 1); } // fingers curled, dangling
      else line(ex - 1, 27, ex + 1, 27); // long splayed fingers / toes
    };
    limb(8, 13, 3, 4, 2, 0); limb(9, 14, 6, 3, 9, Math.PI);
    if (pose === 'atk') {
      for (const [ax, ay, kx, ky, fx, fy] of [[24, 12, 30, 5, 37, 10], [25, 13, 29, 7, 36, 16]]) { line(ax, ay, kx, ky); line(kx, ky, fx, fy); knob(kx, ky); }
    } else { limb(24, 12, 28, 4, 30, Math.PI); limb(25, 13, 27, 5, 22, 0); }
    return g.map(r => r.join(''));
  }
  const CRAWL_PAL = {
    hollow: { k: '#16161a', K: '#2c2c33', p: '#3a3a42' },
    stalker: { k: '#0c0b0e', K: '#2a2530', p: '#5a5260' },
  };
  MON.hollow = { name: 'The Hollow', biome: 'void', where: 'The Backrooms', min: 1, hp: 220, dmg: 22, spd: 60, xp: 45, gold: 30, w: 0, walker: true, crawler: 'hollow',
    blood: '#16161a', spr: sprite(crawlerRows('hollow', 0), CRAWL_PAL.hollow) };
  MON.stalker = { name: 'The Stalker', biome: 'void', where: 'The Backrooms', min: 1, hp: 260, dmg: 26, spd: 60, xp: 55, gold: 35, w: 0, walker: true, crawler: 'stalker',
    blood: '#0c0b0e', spr: sprite(crawlerRows('stalker', 0), CRAWL_PAL.stalker) };
  // ---- the later bestiary: general monsters (ascending by stage: the last one you've reached is the stage's king) and more biome natives ----
  Object.assign(MON, {
    leech: { name: 'Giant Leech', biome: 'swamp', min: 1, hp: 24, dmg: 6, spd: 28, xp: 5, gold: 3, w: 1, hitFx: 'poison', blood: '#7a1a2a', spr: sprite([
      '...llllll...',
      '.lllllllll..',
      'lrrllllllll.',
      'lrrlLlLlLlll',
      'lllllllllll.',
      '.LLLLLLLLL..',
    ], { l: '#3a2a3a', L: '#241824', r: '#c8324a' }) },
    sporeling: { name: 'Sporeling', biome: 'swamp', min: 1, hp: 20, dmg: 7, spd: 20, xp: 5, gold: 3, w: 0.8, walker: true, innate: ['volatile'], blood: '#b86ad0', spr: sprite([
      '...pppppp...',
      '.ppwppppwpp.',
      'pppppwpppppp',
      'pppppppppppp',
      '...ckcckc...',
      '...cccccc...',
      '...cc..cc...',
    ], { p: '#a04ac0', w: '#f0d8ff', c: '#d8cfa8', k: '#2a1a2a' }) },
    frostbat: { name: 'Frost Bat', biome: 'frozen', min: 1, hp: 14, dmg: 6, spd: 50, xp: 5, gold: 3, w: 1, fly: true, hitFx: 'slow', blood: '#bfe4ff', spr: sprite([
      'b..........b',
      'bb..b..b..bb',
      'bbb.bbbb.bbb',
      'bbbbkbbkbbbb',
      '.bbbbbbbbbb.',
      '..b.BBBB.b..',
      '.....BB.....',
    ], { b: '#8fc4ec', B: '#5f94c4', k: '#ffffff' }) },
    yeti: { name: 'Yeti', biome: 'frozen', min: 1, hp: 110, dmg: 14, spd: 20, xp: 16, gold: 9, w: 0.6, walker: true, innate: ['dash'], blood: '#d8e8f4', spr: sprite([
      '....wwwwww....',
      '...wwbbbbww...',
      '...wbkbbkbw...',
      '...wbbkkbbw...',
      '..wwwwwwwwww..',
      '.wwwwwwwwwwww.',
      'www.wwwwww.www',
      'ww..wwwwww..ww',
      '....www.www...',
      '...WWWW.WWWW..',
    ], { w: '#eef6fc', W: '#b4c8d8', b: '#7f9cb8', k: '#142030' }) },
    cinderskull: { name: 'Cinder Skull', biome: 'ember', min: 1, hp: 22, dmg: 8, spd: 38, xp: 6, gold: 4, w: 1, fly: true, innate: ['spit'], blood: '#ff9a3c', spr: sprite([
      '..o.y..y.o..',
      '.o.oyooy.o..',
      '...wwwwww...',
      '..wwwwwwww..',
      '..wkrwwkrw..',
      '..wwwkkwww..',
      '...wkwwkw...',
    ], { w: '#e8dcc8', k: '#1a0a06', r: '#ff4a1a', o: '#ff6a1a', y: '#ffd25a' }) },
    lavaslug: { name: 'Lava Slug', biome: 'ember', min: 1, hp: 70, dmg: 11, spd: 14, xp: 10, gold: 6, w: 0.8, innate: ['regen'], trail: true, blood: '#ff6a1a', spr: sprite([
      '.k.k........',
      '.y.y........',
      '.mmmmmm.....',
      'mmmmlmmmmm..',
      'mlmmmmlmmmmm',
      'llllllllllll',
    ], { m: '#4a2a22', l: '#ff6a1a', y: '#ffd25a', k: '#120806' }) },
    vulture: { name: 'Bone Vulture', biome: 'desert', min: 1, hp: 20, dmg: 7, spd: 42, xp: 5, gold: 3, w: 1, fly: true, blood: '#6a4a2a', spr: sprite([
      'b...........',
      'bb...wr.....',
      'bbb.wwww.bbb',
      '.bbbbbbbbbb.',
      '..bbbbbbbb..',
      '....BBBB....',
      '....y..y....',
    ], { b: '#6a4a2a', B: '#3e2a16', w: '#e8dcc0', r: '#c8324a', y: '#e0b46a' }) },
    sandworm: { name: 'Sand Worm', biome: 'desert', min: 1, hp: 55, dmg: 12, spd: 28, xp: 9, gold: 5, w: 0.8, lurk: true, blood: '#c9883a', spr: sprite([
      '...ssssss...',
      '..swkwwkws..',
      '..skkkkkks..',
      '..swkwwkws..',
      '...SsSSsS...',
      '...ssssss...',
      '..SsSSSSsS..',
      'dddddddddddd',
    ], { s: '#d8a860', S: '#a87a3a', w: '#fff2cf', k: '#2a1406', d: '#c0904c' }) },
    spider: { name: 'Crypt Spider', min: 10, hp: 50, dmg: 11, spd: 42, xp: 9, gold: 5, w: 1, innate: ['leap'], blood: '#6ee07a', spr: sprite([
      'l...l..l...l',
      '.l.lk..kl.l.',
      '..lkkkkkkl..',
      'l.krkrrkrk.l',
      '.lkkkkkkkkl.',
      'l.lkkkkkkl.l',
      '.l..kkkk..l.',
      'l..l....l..l',
    ], { k: '#26202e', l: '#46384e', r: '#ff4d4d' }) },
    harpy: { name: 'Harpy', min: 12, hp: 60, dmg: 13, spd: 46, xp: 11, gold: 6, w: 1, fly: true, blood: '#b86a3a', spr: sprite([
      'f..........f',
      'ff..hhhh..ff',
      'fff.hsks.fff',
      'ffffhsssffff',
      '.ffffttffff.',
      '...ftttt....',
      '...f.tt.f...',
      '...y....y...',
    ], { f: '#a0582a', h: '#3a2418', s: '#e8c8a0', k: '#c8324a', t: '#7a3a1a', y: '#ffd25a' }) },
    gargoyle: { name: 'Gargoyle', min: 15, hp: 140, dmg: 16, spd: 26, xp: 16, gold: 9, w: 0.9, walker: true, innate: ['armored'], blood: '#8a8f96', spr: sprite([
      'g.g......g.g',
      'gg.gggggg.gg',
      'gggrgggrgggg',
      'ggggkkkkgggg',
      '.ggggggggg..',
      '..GgggggG...',
      '..gg....gg..',
      '.GGG....GGG.',
    ], { g: '#7c828a', G: '#54595f', r: '#ffb347', k: '#22252a' }) },
    banshee: { name: 'Banshee', min: 18, hp: 90, dmg: 18, spd: 40, xp: 18, gold: 10, w: 1, fly: true, alpha: 0.82, innate: ['spit'], blood: '#d8c8ff', spr: sprite([
      '...hhhhhh...',
      '..hqqqqqqh..',
      '..hkkqqkkh..',
      '..hqqkkqqh..',
      '.hhqqkkqqhh.',
      'h.qqqqqqqq.h',
      '..qqqqqqqq..',
      '..qq.qq.qq..',
      '..q...q...q.',
    ], { q: '#d8c8ff', h: '#8a6ac8', k: '#201838' }) },
    ogre: { name: 'Ogre', min: 22, hp: 220, dmg: 24, spd: 18, xp: 30, gold: 18, w: 0.7, walker: true, innate: ['mighty'], blood: '#7a8a3a', spr: sprite([
      '....oooooo....',
      '...oowoowoo...',
      '...ooooooooo..',
      '...okwkkwko...',
      '..oooooooooo..',
      '.oooooooooooo.',
      'oo.oooooooo.oo',
      'oo.llllllll.cc',
      '...llllllll.cc',
      '...ooo..ooo.cc',
      '..kkkk..kkkk..',
    ], { o: '#7a8a3a', w: '#ffffff', k: '#20240e', l: '#6b4423', c: '#8b5a2b' }) },
    darkknight: { name: 'Dark Knight', min: 26, hp: 260, dmg: 28, spd: 24, xp: 38, gold: 22, w: 0.8, walker: true, innate: ['armored', 'dash'], blood: '#3a2a4a', spr: sprite([
      '.....rr.....',
      '....aaaa....',
      '...aaaaaa...',
      '...akrrka...',
      '...aaaaaa...',
      '.saaaAAaaa..',
      '.saaaaaaaaa.',
      '.s.aAAAAa.a.',
      '.s.aaaaaa...',
      '...aa..aa...',
      '...aa..aa...',
      '..AAA..AAA..',
    ], { a: '#34303e', A: '#1e1b26', r: '#d8402a', k: '#0e0c14', s: '#c9ced2' }) },
    demon: { name: 'Pit Demon', min: 30, hp: 320, dmg: 34, spd: 28, xp: 50, gold: 30, w: 0.7, fly: true, innate: ['spit'], blood: '#d8402a', spr: sprite([
      'h..........h',
      'h.h......h.h',
      'wwhrrrrrrhww',
      'wwwryrryrwww',
      'wwwrrrrrrwww',
      'ww.rkkkkr.ww',
      'w.rrrrrrrr.w',
      '..rRrrrrRr..',
      '...rr..rr...',
      '..RRR..RRR..',
    ], { r: '#b82a1e', R: '#74150e', y: '#ffe04a', k: '#200806', h: '#e8dcc0', w: '#3e1810' }) },
  });
  const MON_KEYS = Object.keys(MON);
  // animation frames as row swaps on the base sprite: walk cycle, attack pose, blink
  const ANIM = {
    slime: { walk: [{}], atk: { 2: '.llkwllkwll.', 4: '.llkkkkkkll.', 5: 'lllkkkkkklll' }, blink: { 2: '.llkkllkkll.' } },
    bat: {
      walk: [{}, { 0: '............', 1: 'v...v..v...v', 2: 'vv..vvvv..vv', 5: '....vvvv....' },
        { 0: '............', 1: '....v..v....', 2: '....vvvv....', 3: '.vvvrvvrvvv.', 4: 'vvvvvvvvvvvv', 5: 'vv..vvvv..vv', 6: 'v....vv....v' },
        { 0: '............', 1: 'v...v..v...v', 2: 'vv..vvvv..vv', 5: '....vvvv....' }],
      atk: { 0: '............', 1: '....v..v....', 2: '....vvvv....', 3: '.vvvrvvrvvv.', 4: 'vvvvvvvvvvvv', 5: 'vv..vvvv..vv', 6: 'v....vv....v' },
    },
    skeleton: {
      walk: [{ 8: '.w..wwww...w', 12: '...w....w...', 13: '..ww....ww..' },
        { 11: '...ww..w....', 12: '.......w....', 13: '.......ww...' },
        { 8: 'w...wwww..w.', 12: '...w....w...', 13: '..ww....ww..' },
        { 11: '....w..ww...', 12: '....w.......', 13: '...ww.......' }],
      atk: { 3: '.w.wwwwww.w.', 4: '.w..wkkw..w.', 5: '.w...ww...w.', 6: '.wwwwwwwwww.', 7: '....wkkw....', 8: '....wwww....' },
      blink: { 2: '...wwwwww...' },
    },
    zombie: {
      walk: [{ 12: '.pp....pp...', 13: 'kk.....kk...' },
        { 7: '.gttttttggg.', 12: '..kk..pp....', 13: '......kk....' },
        { 6: '..ttttttggg.', 7: '.gtttttt....', 12: '.pp....pp...', 13: 'kk.....kk...' },
        { 12: '..pp..kk....', 13: '.kk.........' }],
      atk: { 1: '.....gggg...', 2: '....gggggg..', 3: '....geggeg..', 4: '....gggggg..', 5: '....gkkkgg..', 6: '..ttttttgggg', 7: '.gttttttgggg' },
    },
    ghost: {
      walk: [{}, { 10: 'q.qqq.qqq.qq', 11: '...q...q...q' }],
      atk: { 3: '.qkkqqqqkkq.', 6: 'qqqqkkkkqqqq', 7: 'qqqqkkkkqqqq' },
    },
    cyclops: {
      walk: [{}, { 14: '...kkkkk.oooo...', 15: '.........oooo...', 16: '.........kkkkk..' },
        {}, { 14: '...oooo.kkkkk...', 15: '...oooo.........', 16: '..kkkkk.........' }],
      atk: { 0: '.....oooooo..cc.', 1: '....oooooooo.cc.', 2: '...oooowwwoooocc', 3: '...ooowwkwwooo.o', 4: '...oooowwwoooo.o',
        5: '...oooooooooo.oo', 6: '....ookkkkoo..oo', 7: '..oooooooooooooo', 9: 'oo.oooooooooo...', 10: 'oo.oooooooooo...', 11: 'oo.llllllllll...', 12: '...llllllllll...' },
      blink: { 3: '...ooowwwwwooo..' },
    },
    toad: { walk: [{}, { 7: 'G.gggggggg.G', 8: 'GG........GG' }], atk: { 4: 'gkkrrrrrrkkg', 5: 'gkrrrrrrrrkg' }, blink: { 1: '.gggg..gggg.' } },
    lurker: { walk: [{}, { 6: 'mmMmmmmmmMmm', 7: 'm.Mmmmmmm.Mm' }], atk: { 4: '.mmkkkkkkmm.', 5: '.mMkrrrrkMm.' }, blink: { 2: '..mmmmmmmm..' } },
    wraith: { walk: [{}, { 7: '.Q.qQqqQq.Q.', 8: 'Q..Q.QQ.Q..Q' }], atk: { 4: '.qqkkkkkkqq.', 2: '.qqkeqqkeqq.' } },
    frostgolem: { walk: [{}, { 10: '...iii..iii...', 11: '...IIII.IIII..' }, {}, { 10: '...iii..iii...', 11: '..IIII.IIII...' }], atk: { 5: 'wwiiiiiiiiiiww', 6: 'iiiIiiiiiiIiii', 4: '..wwikkkkiww..' } },
    imp: { walk: [{}, { 8: '..rr....rr..', 9: '.RR......RR.' }], atk: { 5: '...rkrrkr...', 6: 'oorrrrrrrroo' } },
    brute: { walk: [{}, { 10: '...mmm..mmm...', 11: '...llll.llll..' }, {}, { 10: '...mmm..mmm...', 11: '..llll.llll...' }], atk: { 4: '..mmmkkkkmmm..', 6: 'llmmmmmmmmmmll' } },
    scorpion: { walk: [{}, { 8: 's.s.s.s.s.....', 9: '.s.s.s.s.s....' }], atk: { 0: '.............t', 1: '...........tS.', 2: '..........ss..', 3: '..........s...' } },
    mummy: { walk: [{}, { 10: '..ww...ww...', 11: '.WWW...WWW..' }, {}, { 10: '...ww...ww..', 11: '..WWW...WWW.' }], atk: { 6: 'wwwwwwwwwwww', 7: 'wWwwWwwWwwWw' } },
  };
  Object.assign(ANIM, {
    leech: { walk: [{}, { 0: '............', 1: '...llllll...', 5: '.LLLLLLLLLL.' }], atk: { 2: 'lrrrllllllll', 3: 'lrrrLlLlLlll' } },
    sporeling: { walk: [{}, { 6: '...cc...cc..' }, {}, { 6: '..cc...cc...' }], atk: { 4: '...kkkkkk...', 1: '.ppppwwpppp.' } },
    frostbat: { walk: [{}, { 0: '............', 1: 'b...b..b...b', 2: 'bb..bbbb..bb', 5: '....BBBB....' }], atk: { 3: 'bbbbkkkkbbbb' } },
    yeti: { walk: [{}, { 8: '....www..www..', 9: '....WWW.WWWW..' }, {}, { 8: '..www..www....', 9: '..WWWW.WWW....' }], atk: { 3: '...wkkkkkkw...', 6: 'wwwwwwwwwwwwww' } },
    cinderskull: { walk: [{}, { 0: '.o..y.y..o..', 1: '..o.oyoy.o..' }], atk: { 5: '..wkkkkkkw..', 6: '...kkkkkk...' } },
    lavaslug: { walk: [{}, { 5: 'l.llllllll.l' }], atk: { 0: 'k.k.........', 1: 'y.y.........' } },
    vulture: { walk: [{}, { 0: '............', 1: '.....wr.....', 2: 'b...wwww...b', 3: 'bbbbbbbbbbbb', 4: 'bb.bbbbbb.bb' }], atk: { 1: 'bb...wrr....' } },
    sandworm: { walk: [{}, { 6: '..SsSSSSSs..' }], atk: { 1: '..skkkkkks..', 3: '..skkkkkks..' } },
    spider: { walk: [{}, { 0: '.l..l..l..l.', 7: '.l.l....l.l.' }], atk: { 3: 'l.krrrrrrk.l' } },
    harpy: { walk: [{}, { 0: '............', 1: 'f...hhhh...f', 2: 'ff..hsks..ff', 4: 'fffffttfffff' }], atk: { 3: 'ffffhkkkffff' } },
    gargoyle: { walk: [{}, { 6: '..gg...gg...', 7: '.GGG...GGG..' }, {}, { 6: '...gg...gg..', 7: '..GGG...GGG.' }], atk: { 3: 'ggkkkkkkkkgg' } },
    banshee: { walk: [{}, { 7: '.qq.qq.qq...', 8: '.q...q...q..' }], atk: { 3: '..hqkkkkqh..', 4: '.hhqkkkkqhh.' } },
    ogre: { walk: [{}, { 9: '...ooo.ooo....', 10: '..kkkk.kkkk...' }, {}, { 9: '....ooo.ooo...', 10: '...kkkk.kkkk..' }], atk: { 6: 'oooooooooooooo', 3: '...okkkkkko...' } },
    darkknight: { walk: [{}, { 10: '...aa...aa..', 11: '..AAA...AAA.' }, {}, { 10: '..aa...aa...', 11: '.AAA...AAA..' }], atk: { 5: 'ssaaaAAaaa..', 3: '...arrrra...' } },
    demon: { walk: [{}, { 2: 'w.hrrrrrrh.w', 3: 'w.wryrryrw.w', 8: '...rr...rr..' }], atk: { 5: 'ww.rkrrkr.ww', 4: 'wwwrkkkkrwww' } },
  });
  // the Grinner's frames: only the rows that change from its standing pose
  const grinnerDiff = pose => { const base = grinnerRows(0), o = {}; grinnerRows(pose).forEach((row, i) => { if (row !== base[i]) o[i] = row; }); return o; };
  ANIM.grinner = { walk: [grinnerDiff(1), {}, grinnerDiff(2), {}], atk: grinnerDiff('atk') };
  for (const kind of ['hollow', 'stalker']) {
    const base = crawlerRows(kind, 0), diff = pose => { const o = {}; crawlerRows(kind, pose).forEach((row, i) => { if (row !== base[i]) o[i] = row; }); return o; };
    ANIM[kind] = { walk: [1, 2, 3, 4, 5, 6].map(diff), atk: diff('atk') };
  }
  for (const k of MON_KEYS) {
    const d = MON[k], an = ANIM[k];
    d.walk = an.walk.map(e => variant(d.spr, e));
    d.atk = variant(d.spr, an.atk);
    d.blink = an.blink ? variant(d.spr, an.blink) : null;
  }
  // which frame a monster shows right now
  function monSpr(m) {
    const d = m.d;
    if (m.wind > 0 || m.atkT > 0 || m.crouch > 0 || m.tele > 0) return d.atk;
    if (d.blink && (m.t % 3.3) < 0.13) return d.blink;
    return d.walk[Math.floor(m.ph) % d.walk.length];
  }

  // ---------- elite abilities ----------
  const AFFIX = [
    { id: 'swift', name: 'Swift', col: '#ffe04a', min: 2, tip: 'moves 60% faster', how: 'You can\'t outrun it. Stand your ground and hit it as it comes in.' },
    { id: 'mighty', name: 'Mighty', col: '#ff5a3a', min: 2, tip: 'bigger, hits much harder, can\'t be knocked back', how: 'Don\'t let it reach you. Keep your distance and wear it down.' },
    { id: 'leap', name: 'Leaping', col: '#7fd1ff', min: 3, ground: true, tip: 'crouches, then leaps onto you', how: 'Watch for the crouch and the mark on the ground, then step aside.' },
    { id: 'armored', name: 'Armored', col: '#b8c4cc', min: 3, tip: 'takes 45% less damage', how: 'Save your strongest hits and abilities for it. Crits help.' },
    { id: 'regen', name: 'Regenerating', col: '#6ee07a', min: 4, tip: 'heals when not hit for a moment', how: 'Once you start on it, don\'t stop until it falls.' },
    { id: 'dash', name: 'Charging', col: '#ff9a2a', min: 4, tip: 'aims, then charges in a straight line', how: 'When it lines up and shakes, move sideways out of its path.' },
    { id: 'spit', name: 'Spitting', col: '#c78cff', min: 5, tip: 'shoots at you from range', how: 'Keep moving so the shots miss, and close in to finish it.' },
    { id: 'volatile', name: 'Volatile', col: '#ff6a1a', min: 5, tip: 'explodes a moment after dying', how: 'Back off as soon as it goes down. The blast hurts.' },
  ];
  const CROWN = sprite(['y..y..y', 'yyyyyyy', 'yryyyry'], { y: '#f2c14e', r: '#e5484d' });
  const eliteQ = []; // elite kinds waiting to be introduced: { f: affix, spr: the monster that brought it }
  // bestiary discoveries, for every save on this device: 'mon:slime', 'boss:bat', 'elite:swift', 'power:frenzy', 'weapon:axe' ...
  const SEEN_KEY = 'gravefield-seen';
  const SEEN = new Set();
  try { for (const id of JSON.parse(localStorage.getItem(SEEN_KEY)) || []) SEEN.add(id); } catch (e) {}
  function discover(id) {
    if (SEEN.has(id)) return;
    SEEN.add(id);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...SEEN])); } catch (e) {}
  }

