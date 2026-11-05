  // ---------- chest loot: timed power-ups and permanent, stacking relics ----------
  const POWERS = [
    { id: 'flame', name: 'Flamethrower', dur: 10, col: '#ff6a1a', tip: 'Your weapon spews a cone of fire that burns through crowds.' },
    { id: 'immortal', name: 'Immortality', dur: 8, col: '#f2c14e', tip: 'Nothing can hurt you.' },
    { id: 'freeze', name: 'Time Freeze', dur: 6, col: '#7fd1ff', tip: 'Every monster and projectile stops dead.' },
    { id: 'magnet', name: 'Magnet Orb', dur: 8, col: '#d8402a', tip: 'Pulls every coin and gem on the field to you.' },
    { id: 'frenzy', name: 'Frenzy', dur: 10, col: '#ff5a3a', tip: 'Fire twice as fast.' },
    { id: 'volley', name: 'Bullet Storm', dur: 10, col: '#c9a23a', tip: '+4 projectiles with every shot.' },
    { id: 'haste', name: 'Haste', dur: 10, col: '#6ee07a', tip: 'Move 60% faster.' },
    { id: 'goldrush', name: 'Gold Rush', dur: 15, col: '#ffd84d', tip: 'Monsters drop triple gold.' },
    { id: 'wisdom', name: 'Wisdom', dur: 15, col: '#4fb6e8', tip: 'Monsters give double XP.' },
    { id: 'blades', name: 'Spinning Blades', dur: 12, col: '#c9ced2', tip: 'Three blades orbit you and cut whatever they touch.' },
    { id: 'storm', name: 'Lightning Storm', dur: 8, col: '#ffe04a', tip: 'Lightning keeps striking monsters around you.' },
    { id: 'nuke', name: 'Holy Bomb', dur: 0, col: '#fff2cf', tip: 'A blinding blast that wipes out every monster on screen.' },
    { id: 'heal', name: 'Full Heal', dur: 0, col: '#e5484d', tip: 'Restores all of your health.' },
  ];
  const RELICS = [
    { id: 'vit', name: 'Heart Stone', per: 5, unit: '% max health', col: '#e5484d' },
    { id: 'str', name: 'Whetstone', per: 3, unit: '% damage', col: '#c9ced2' },
    { id: 'boom', name: 'Blast Powder', per: 1, unit: '% chance your shots explode', col: '#ff9a3c' },
    { id: 'quick', name: 'Fletching', per: 3, unit: '% fire rate', col: '#a8763f' },
    { id: 'swift', name: 'Feather Boots', per: 2, unit: '% move speed', col: '#6ee07a' },
    { id: 'greed', name: 'Lucky Coin', per: 4, unit: '% gold', col: '#f2c14e' },
    { id: 'learn', name: 'Old Tome', per: 4, unit: '% XP', col: '#a06ad0' },
    { id: 'crit', name: 'Hawk Eye', per: 1, unit: '% crit chance', col: '#d8402a' },
    { id: 'skin', name: 'Iron Skin', per: 3, unit: '% armor', col: '#9aa2aa' },
    { id: 'fang', name: 'Vampire Fang', per: 0.5, unit: '% of max health healed per kill', col: '#a02a2a' },
    { id: 'reach', name: 'Lodestone', per: 5, unit: '% pickup range', col: '#4fb6e8' },
    { id: 'regen', name: 'Troll Blood', per: 0.1, unit: '% of max health regenerated per second', col: '#4f9a3a' },
  ];
  const relicPct = id => { const r = RELICS.find(x => x.id === id); return ((S.relics && S.relics[id]) || 0) * r.per / 100; };

  // 12x12 pixel icons for power-ups (p:) and relics (r:), cached as data URLs for the HUD and the shop
  const ICON_ART = {
    'p:flame': f => { f(5, 1, 2, 2, '#ffd25a'); f(4, 3, 4, 3, '#ff9a3c'); f(3, 5, 6, 4, '#ff6a1a'); f(4, 9, 4, 2, '#d9402a'); f(5, 6, 2, 3, '#ffd25a'); },
    'p:immortal': f => { f(3, 1, 6, 1, '#c98a14'); f(2, 2, 8, 5, '#f2c14e'); f(3, 7, 6, 2, '#f2c14e'); f(4, 9, 4, 1, '#c98a14'); f(5, 10, 2, 1, '#c98a14'); f(5, 3, 2, 5, '#fff2cf'); f(4, 4, 4, 2, '#fff2cf'); },
    'p:freeze': f => { f(5, 0, 2, 12, '#bfe8ff'); f(0, 5, 12, 2, '#bfe8ff'); f(2, 2, 2, 2, '#7fd1ff'); f(8, 2, 2, 2, '#7fd1ff'); f(2, 8, 2, 2, '#7fd1ff'); f(8, 8, 2, 2, '#7fd1ff'); f(5, 5, 2, 2, '#ffffff'); },
    'p:magnet': f => { f(2, 1, 3, 2, '#e8eef2'); f(7, 1, 3, 2, '#e8eef2'); f(2, 3, 3, 5, '#d8402a'); f(7, 3, 3, 5, '#d8402a'); f(2, 8, 8, 3, '#d8402a'); f(4, 8, 4, 1, '#a02a1a'); },
    'p:frenzy': f => { for (const [x, y] of [[1, 2], [3, 4], [5, 6], [3, 8], [1, 10]]) f(x, y - 1, 2, 2, '#ff5a3a'); for (const [x, y] of [[6, 2], [8, 4], [10, 6], [8, 8], [6, 10]]) f(x, y - 1, 2, 2, '#ffb347'); },
    'p:volley': f => { for (const y of [1, 5, 9]) { f(1, y + 1, 7, 1, '#a8763f'); f(8, y, 2, 3, '#c9ced2'); f(10, y + 1, 1, 1, '#c9ced2'); f(0, y, 2, 1, '#fff'); f(0, y + 2, 2, 1, '#fff'); } },
    'p:haste': f => { f(4, 1, 4, 7, '#6ee07a'); f(4, 8, 7, 2, '#6ee07a'); f(4, 10, 7, 1, '#3f8a33'); f(5, 2, 1, 5, '#b6f5a0'); f(0, 4, 3, 1, '#fff'); f(1, 6, 2, 1, '#fff'); f(0, 8, 3, 1, '#fff'); },
    'p:goldrush': f => { f(2, 8, 8, 3, '#c98a14'); f(2, 6, 8, 2, '#f2c14e'); f(3, 4, 6, 2, '#c98a14'); f(3, 2, 6, 2, '#ffd84d'); f(4, 2, 1, 1, '#fff'); f(3, 6, 1, 1, '#fff'); },
    'p:wisdom': f => { f(4, 1, 4, 1, '#9fe0ff'); f(3, 2, 6, 2, '#66d4ff'); f(2, 4, 8, 2, '#2c8fbf'); f(3, 6, 6, 2, '#2c8fbf'); f(4, 8, 4, 2, '#1f6a90'); f(5, 10, 2, 1, '#1f6a90'); f(4, 3, 2, 2, '#fff'); },
    'p:blades': f => { f(5, 0, 2, 4, '#e8eef2'); f(5, 8, 2, 4, '#e8eef2'); f(0, 5, 4, 2, '#e8eef2'); f(8, 5, 4, 2, '#e8eef2'); f(4, 4, 4, 4, '#9aa2aa'); f(5, 5, 2, 2, '#5a6066'); },
    'p:storm': f => { f(6, 0, 4, 2, '#ffe04a'); f(5, 2, 3, 2, '#ffe04a'); f(3, 4, 6, 2, '#ffe04a'); f(5, 6, 3, 2, '#ffe04a'); f(4, 8, 2, 2, '#ffe04a'); f(3, 10, 2, 2, '#fff6a0'); },
    'p:nuke': f => { f(3, 4, 6, 7, '#2f3338'); f(2, 5, 8, 5, '#2f3338'); f(4, 5, 2, 2, '#6a7078'); f(6, 2, 2, 2, '#8a5a2b'); f(8, 0, 2, 2, '#ffb347'); f(9, 1, 2, 1, '#fff2a0'); },
    'p:heal': f => { f(2, 2, 3, 2, '#e5484d'); f(7, 2, 3, 2, '#e5484d'); f(1, 3, 10, 4, '#e5484d'); f(2, 7, 8, 2, '#e5484d'); f(3, 9, 6, 1, '#c0392b'); f(5, 10, 2, 1, '#c0392b'); f(3, 3, 2, 1, '#ff9a9a'); },
    'r:vit': f => { ICON_ART['p:heal'](f); f(8, 0, 4, 1, '#6ee07a'); f(9, -1, 2, 3, '#6ee07a'); },
    'r:str': f => { f(5, 0, 2, 7, '#e8eef2'); f(6, 0, 1, 7, '#9aa2aa'); f(2, 7, 8, 1, '#c9a23a'); f(5, 8, 2, 3, '#7a4a1e'); f(4, 11, 4, 1, '#c9a23a'); },
    'r:boom': f => { f(5, 0, 2, 12, '#ff9a3c'); f(0, 5, 12, 2, '#ff9a3c'); f(2, 2, 2, 2, '#ffd25a'); f(8, 2, 2, 2, '#ffd25a'); f(2, 8, 2, 2, '#ffd25a'); f(8, 8, 2, 2, '#ffd25a'); f(4, 4, 4, 4, '#ff6a1a'); f(5, 5, 2, 2, '#fff2a0'); },
    'r:quick': f => { f(1, 5, 7, 2, '#a8763f'); f(8, 4, 2, 4, '#c9ced2'); f(10, 5, 1, 2, '#c9ced2'); f(0, 3, 3, 2, '#fff'); f(0, 7, 3, 2, '#fff'); f(3, 1, 4, 1, '#ffd84d'); f(3, 10, 4, 1, '#ffd84d'); },
    'r:swift': f => { f(4, 2, 4, 6, '#8a5428'); f(4, 8, 7, 2, '#8a5428'); f(4, 10, 7, 1, '#5e3518'); f(0, 1, 4, 2, '#fff2cf'); f(1, 3, 3, 2, '#fff2cf'); f(2, 5, 2, 1, '#fff2cf'); },
    'r:greed': f => { f(3, 1, 6, 10, '#f2c14e'); f(2, 2, 8, 8, '#f2c14e'); f(1, 4, 10, 4, '#f2c14e'); f(5, 3, 2, 6, '#c98a14'); f(3, 2, 2, 2, '#fff2a0'); },
    'r:learn': f => { f(2, 1, 8, 10, '#7a3fb0'); f(3, 2, 6, 8, '#a06ad0'); f(2, 10, 8, 1, '#fff2cf'); f(5, 3, 2, 4, '#ffd84d'); f(4, 4, 4, 2, '#ffd84d'); },
    'r:crit': f => { f(2, 2, 8, 8, '#d8402a'); f(3, 3, 6, 6, '#fff2cf'); f(4, 4, 4, 4, '#d8402a'); f(5, 5, 2, 2, '#fff2cf'); f(5, 0, 2, 2, '#d8402a'); f(5, 10, 2, 2, '#d8402a'); f(0, 5, 2, 2, '#d8402a'); f(10, 5, 2, 2, '#d8402a'); },
    'r:skin': f => { f(3, 1, 6, 1, '#5a6066'); f(2, 2, 8, 5, '#9aa2aa'); f(3, 7, 6, 2, '#9aa2aa'); f(4, 9, 4, 1, '#5a6066'); f(5, 10, 2, 1, '#5a6066'); f(5, 3, 2, 5, '#e8eef2'); },
    'r:fang': f => { f(1, 1, 10, 4, '#7a1a1a'); f(2, 5, 3, 4, '#fff'); f(7, 5, 3, 4, '#fff'); f(3, 9, 1, 2, '#fff'); f(8, 9, 1, 2, '#fff'); f(8, 10, 1, 2, '#d8402a'); },
    'r:reach': f => { f(2, 1, 3, 2, '#e8eef2'); f(7, 1, 3, 2, '#e8eef2'); f(2, 3, 3, 5, '#4fb6e8'); f(7, 3, 3, 5, '#4fb6e8'); f(2, 8, 8, 3, '#4fb6e8'); f(4, 8, 4, 1, '#2c8fbf'); },
    'r:regen': f => { f(4, 0, 4, 2, '#cfe9ff'); f(3, 2, 6, 2, '#4f9a3a'); f(2, 4, 8, 7, '#4f9a3a'); f(3, 11, 6, 1, '#2f6a28'); f(5, 5, 2, 5, '#b6f5a0'); f(3, 7, 6, 1, '#b6f5a0'); },
  };
  Object.assign(ICON_ART, {
    'a:whirl': f => { f(3, 0, 6, 2, '#e8eef2'); f(10, 3, 2, 6, '#e8eef2'); f(3, 10, 6, 2, '#e8eef2'); f(0, 3, 2, 6, '#e8eef2'); f(9, 1, 2, 2, '#9aa2aa'); f(1, 9, 2, 2, '#9aa2aa'); f(4, 4, 4, 4, '#c9a23a'); },
    'a:slam': f => { f(3, 0, 6, 4, '#8a949c'); f(3, 0, 6, 1, '#c9d1d8'); f(5, 4, 2, 4, '#7a4a1e'); f(0, 9, 12, 3, '#d6b482'); f(2, 8, 1, 1, '#fff'); f(9, 8, 1, 1, '#fff'); f(5, 9, 2, 1, '#8a5a2b'); },
    'a:rain': f => { for (const x of [1, 5, 9]) { f(x, 0, 1, 7, '#a8763f'); f(x - 1, 7, 3, 2, '#c9ced2'); f(x, 9, 1, 1, '#c9ced2'); } f(0, 11, 12, 1, '#d6b482'); },
    'a:volley': f => ICON_ART['p:volley'](f),
    'a:nova': f => ICON_ART['p:freeze'](f),
    'a:meteor': f => { f(7, 0, 5, 5, '#ffd25a'); f(5, 2, 4, 4, '#ff9a3c'); f(1, 5, 7, 7, '#6b3f1d'); f(2, 6, 4, 4, '#ff8a3a'); f(3, 7, 2, 2, '#fff2a0'); },
    'a:vanish': f => { f(3, 1, 6, 2, '#5a4a7a'); f(2, 3, 8, 7, '#5a4a7a'); f(3, 3, 6, 6, '#3a3540'); f(4, 5, 1, 1, '#ffffff'); f(7, 5, 1, 1, '#ffffff'); f(2, 10, 2, 1, '#5a4a7a'); f(6, 10, 2, 1, '#5a4a7a'); f(10, 9, 1, 1, '#5a4a7a'); },
    'a:step': f => { f(0, 2, 4, 1, '#c78cff'); f(0, 5, 5, 1, '#c78cff'); f(0, 8, 3, 1, '#c78cff'); f(5, 4, 6, 2, '#e8eef2'); f(11, 4, 1, 2, '#e8eef2'); f(4, 3, 1, 4, '#c9a23a'); f(2, 4, 2, 2, '#3a2a1a'); },
    'a:raise': f => { f(3, 0, 6, 6, '#e9e4d4'); f(2, 1, 8, 4, '#e9e4d4'); f(4, 6, 4, 2, '#e9e4d4'); f(3, 2, 2, 2, '#2a1406'); f(7, 2, 2, 2, '#2a1406'); f(5, 6, 1, 2, '#2a1406'); f(0, 9, 12, 3, '#6ee07a'); f(2, 8, 1, 1, '#6ee07a'); f(9, 8, 1, 1, '#6ee07a'); },
    'a:golem': f => { f(1, 1, 10, 9, '#c08a5a'); f(1, 1, 10, 2, '#d39a66'); f(3, 3, 6, 5, '#ffffff'); f(5, 4, 3, 3, '#7fbf3a'); f(6, 5, 1, 1, '#2a1406'); f(0, 10, 12, 2, '#6ee07a'); },
  });
  const iconCache = {};
  // a weapon's own picture, for the E button
  function weaponIconURL(w) {
    const key = 'w:' + w.id;
    if (iconCache[key]) return iconCache[key];
    const c = mkCanvas(22, 22), g = c.getContext('2d');
    g.imageSmoothingEnabled = false; g.translate(4, 17); g.rotate(-Math.PI / 4); g.scale(0.9, 0.9); drawWeapon(g, w.art || w.shot);
    return (iconCache[key] = c.toDataURL());
  }
  // an armor's picture (the hero wearing it), for the Q button
  function armorIconURL(a) {
    const key = 'arm:' + a.id;
    if (iconCache[key]) return iconCache[key];
    const c = mkCanvas(22, 22), g = c.getContext('2d');
    g.imageSmoothingEnabled = false; g.drawImage(hero(a, 'down', 'i0', false).c, 2, 0);
    return (iconCache[key] = c.toDataURL());
  }
  function iconURL(key) {
    if (iconCache[key]) return iconCache[key];
    const c = mkCanvas(12, 12), g = c.getContext('2d');
    ICON_ART[key]((x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); });
    return (iconCache[key] = finalize(c).c.toDataURL());
  }

  // chests: wooden ones scattered around the field, golden ones from bosses
  function makeChest(open, golden) {
    const wood = golden ? '#e2a63a' : '#a0642a', woodL = golden ? '#ffe08a' : '#c98a48', woodD = golden ? '#a8741a' : '#6b3f1d', trim = golden ? '#fff2a0' : '#d9a441';
    return paint(16, 13, g => {
      if (open) {
        px(g, 1, 0, 14, 4, woodD); px(g, 2, 1, 12, 2, '#2a1406'); px(g, 3, 0, 2, 4, trim); px(g, 11, 0, 2, 4, trim);
        px(g, 1, 4, 14, 2, '#2a1406'); px(g, 3, 4, 10, 1, '#ffd84d'); px(g, 5, 3, 6, 1, '#fff2a0');
      } else {
        px(g, 1, 1, 14, 5, wood); px(g, 1, 1, 14, 1, woodL); px(g, 0, 5, 16, 1, woodD);
        px(g, 3, 1, 2, 5, trim); px(g, 11, 1, 2, 5, trim);
        px(g, 7, 4, 2, 3, '#ffd84d'); px(g, 7, 5, 2, 1, '#5a3418');
      }
      px(g, 1, 6, 14, 6, wood); px(g, 1, 6, 14, 1, woodL); px(g, 1, 11, 14, 1, woodD);
      px(g, 3, 6, 2, 6, trim); px(g, 11, 6, 2, 6, trim);
      if (!open) px(g, 7, 6, 2, 2, '#ffd84d');
    });
  }
  const CHEST = { closed: makeChest(false, false), open: makeChest(true, false), gClosed: makeChest(false, true), gOpen: makeChest(true, true) };

  // pixel arrows pointing at off-screen chests: one straight (→) and one diagonal (↘); the rest are right-angle turns of these
  const ARROW_ROWS = [
    ['.....y....', '.....yy...', '.....yyy..', 'llllllyyy.', 'yyyyyyyyyy', 'ddddddyyy.', '.....yyy..', '.....yy...', '.....y....'],
    ['ll........', 'lyy.......', '.yyy......', '..yyy..yy.', '...yyy.yy.', '....yyyyy.', '.....yyyy.', '...yyyyyy.', '...dddddd.'],
  ];
  const ARROW = ARROW_ROWS.map(r => sprite(r, { y: '#ffc93c', l: '#fff2a0', d: '#c98a14' }));
  const ARROW_G = ARROW_ROWS.map(r => sprite(r, { y: '#fff2a0', l: '#ffffff', d: '#e2c050' }));
  // little things that float over the hero during some power-ups
  const MAGNET_SPR = sprite(['ww...ww', 'rr...rr', 'rr...rr', 'rr...rr', 'rrr.rrr', '.rrrrr.', '..rrr..'], { w: '#e8eef2', r: '#d8402a' });
  const CLOUD_SPR = sprite(['....ccc......', '..cccccc.ccc.', '.cccccccccccc', 'ccccccccccccc', 'dddddddddddd.', '.dddddddddd..'], { c: '#8a8f9c', d: '#565b68' });

  // stage scaling: each boss kill makes the next stage tougher, faster and physically bigger
  const need = s => 40 + s * 8; // kills to clear a stage (doubled: stages last twice as long)
  const hpMul = s => Math.pow(1.35, s - 1);
  const dmgMul = s => Math.pow(1.18, s - 1);
  const goldMulS = s => Math.pow(1.27, s - 1);
  const xpMulS = s => Math.pow(1.22, s - 1);
  const sizeMul = s => Math.min(1.6, 1 + 0.06 * (s - 1));
  const spdMul = s => Math.min(1.4, 1 + 0.03 * (s - 1));

