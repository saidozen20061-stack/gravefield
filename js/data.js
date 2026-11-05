  // ================= data =================
  const WORLD = { w: 1600, h: 1200, x0: 40, y0: 50, x1: 1560, y1: 1170 };
  const SAVE_KEY = 'gravefield-save-v2'; // pre-slots save, moved into slot 1 on first load
  const SLOTS = 3, slotKey = n => `gravefield-slot-${n}`, ACTIVE_KEY = 'gravefield-active-slot';
  const OUTLINE = '#2a1406';

  const RARITY = [
    { name: 'Common',    c: '#7d7268', w: 50, m: 1 },
    { name: 'Uncommon',  c: '#3c8f2a', w: 28, m: 1.6 },
    { name: 'Rare',      c: '#2a6fc9', w: 14, m: 2.5 },
    { name: 'Epic',      c: '#8b3fc8', w: 6,  m: 4 },
    { name: 'Legendary', c: '#e0700f', w: 2,  m: 6.5 },
  ];

  // ---------- classes: each has its own weapon line, armor line and a Q ability (E comes from your weapon) ----------
  const CLASSES = {
    warrior: { name: 'Warrior', role: 'Melee', col: '#c9ced2', blurb: 'Swords, axes and hammers that cleave everything in front of you. The toughest armor in the game.',
      q: { id: 'whirl', name: 'Whirlwind', cd: 10, desc: 'Spin for 3 seconds, cutting everything around you.' } },
    ranger: { name: 'Ranger', role: 'Range', col: '#6aa84f', blurb: 'Bows, crossbows and black powder. Hits hard from far away.',
      q: { id: 'rain', name: 'Arrow Rain', cd: 10, desc: 'Arrows pour down on the spot you aim at for 3 seconds.' } },
    mage: { name: 'Mage', role: 'Magic', col: '#7a5ad0', blurb: 'Frost, fire, lightning and arcane power. Fragile, but the strongest spells.',
      q: { id: 'nova', name: 'Frost Nova', cd: 10, desc: 'Freezes every monster around you solid for 3 seconds.' } },
    rogue: { name: 'Rogue', role: 'Rogue', col: '#5a4a7a', blurb: 'A storm of knives, stars and poison. Fast, deadly crits, hard to pin down.',
      q: { id: 'vanish', name: 'Vanish', cd: 12, desc: 'Turn invisible for 4 seconds: monsters lose you and wander. Your next attack deals triple damage.' } },
    summoner: { name: 'Summoner', role: 'Summoner', col: '#4fd8a0', blurb: 'Homing soul orbs and an army of the dead that fights for you.',
      q: { id: 'raise', name: 'Raise Dead', cd: 12, desc: 'Raise skeleton warriors for 15 seconds. Better weapons raise more.' } },
  };
  const CLASS_ORDER = ['warrior', 'ranger', 'mage', 'rogue', 'summoner'];

  const WEAPONS = [
    // Ranger
    { id: 'sling',   cls: 'ranger', r: 0, name: 'Slingshot',     desc: 'A forked stick and a pocket of pebbles.',      cost: 0,      dmg: 4,    rate: 2.2, spd: 210, range: 150, shot: 'pebble' },
    { id: 'bow',     cls: 'ranger', r: 0, name: 'Short Bow',     desc: 'Arrows pierce one extra monster.',             cost: 150,    dmg: 10,   rate: 2.4, spd: 260, range: 175, shot: 'arrow', pierce: 1 },
    { id: 'xbow',    cls: 'ranger', r: 1, name: 'Crossbow',      desc: 'Heavy bolts pierce two extra monsters.',       cost: 1500,   dmg: 30,   rate: 1.9, spd: 300, range: 190, shot: 'bolt', pierce: 2 },
    { id: 'flint',   cls: 'ranger', r: 2, name: 'Flintlock',     desc: 'Fast lead shot with a loud bang.',             cost: 12000,  dmg: 80,   rate: 2.8, spd: 340, range: 185, shot: 'ball' },
    { id: 'longbow', cls: 'ranger', r: 3, name: 'Elven Longbow', desc: 'Long arrows that pierce four monsters.',       cost: 90000,  dmg: 200,  rate: 2.6, spd: 340, range: 210, shot: 'arrow', art: 'longbow', pierce: 4 },
    { id: 'cannon',  cls: 'ranger', r: 3, name: 'Dragon Cannon', desc: 'Huge blasts that flatten whole crowds.',       cost: 650000, dmg: 520,  rate: 1.6, spd: 240, range: 210, shot: 'cannon', splash: 34 },
    { id: 'starbow', cls: 'ranger', r: 4, name: 'Starfall Bow',  desc: 'Starlit arrows that pierce six monsters.',     cost: 5e6,    dmg: 1400, rate: 3.0, spd: 380, range: 230, shot: 'arrow', art: 'starbow', pierce: 6 },
    // Warrior: melee swings in an arc in front of you (reach in pixels, arc in radians)
    { id: 'club',    cls: 'warrior', r: 0, name: 'Wooden Club',  desc: 'A heavy branch. Swings hit everything in front of you.', cost: 0,   dmg: 9,    rate: 1.8, reach: 30, arc: 1.8, shot: 'slash', art: 'club', slash: '#e8dcc0' },
    { id: 'sword',   cls: 'warrior', r: 0, name: 'Iron Sword',   desc: 'A reliable blade with a wide swing.',     cost: 150,    dmg: 22,   rate: 2.0, reach: 34, arc: 2.0, shot: 'slash', art: 'sword', slash: '#ffffff' },
    { id: 'axe',     cls: 'warrior', r: 1, name: 'Battle Axe',   desc: 'Bites deep in a huge arc.',               cost: 1500,   dmg: 70,   rate: 1.6, reach: 38, arc: 2.4, shot: 'slash', art: 'axe', slash: '#ffffff' },
    { id: 'hammer',  cls: 'warrior', r: 2, name: 'War Hammer',   desc: 'Crushing blows that stun for a moment.',  cost: 12000,  dmg: 210,  rate: 1.3, reach: 40, arc: 2.6, shot: 'slash', art: 'hammer', slash: '#d6b482', stun: 0.5 },
    { id: 'gsword',  cls: 'warrior', r: 3, name: 'Greatsword',   desc: 'Two-handed steel with enormous reach.',   cost: 90000,  dmg: 480,  rate: 1.7, reach: 46, arc: 2.6, shot: 'slash', art: 'gsword', slash: '#ffffff' },
    { id: 'fsword',  cls: 'warrior', r: 3, name: 'Flame Blade',  desc: 'A burning edge that sets monsters alight.', cost: 650000, dmg: 1200, rate: 2.0, reach: 46, arc: 2.8, shot: 'slash', art: 'fsword', slash: '#ffb347', burn: true },
    { id: 'ksword',  cls: 'warrior', r: 4, name: 'Kingsbane',    desc: 'The blade of a fallen king. Stuns and burns.', cost: 5e6, dmg: 3500, rate: 2.2, reach: 52, arc: 3.2, shot: 'slash', art: 'ksword', slash: '#fff2a0', burn: true, stun: 0.4 },
    // Mage
    { id: 'appr',    cls: 'mage', r: 0, name: 'Apprentice Wand', desc: 'Small bolts of raw magic.',               cost: 0,      dmg: 5,    rate: 2.0, spd: 220, range: 165, shot: 'magic', art: 'appr' },
    { id: 'wand',    cls: 'mage', r: 0, name: 'Fire Wand',     desc: 'Fireballs burst and scorch nearby monsters.', cost: 150,    dmg: 10,   rate: 2.2, spd: 220, range: 180, shot: 'fire', splash: 20 },
    { id: 'frost',   cls: 'mage', r: 1, name: 'Frost Staff',   desc: 'Ice shards that slow monsters to a crawl.',   cost: 1500,   dmg: 30,   rate: 2.0, spd: 260, range: 190, shot: 'frost', art: 'frost', pierce: 1 },
    { id: 'staff',   cls: 'mage', r: 2, name: 'Thunder Staff', desc: 'Lightning jumps between up to 4 monsters.',   cost: 12000,  dmg: 75,   rate: 2.6, spd: 360, range: 200, shot: 'spark', chain: 3 },
    { id: 'arcane',  cls: 'mage', r: 3, name: 'Arcane Orb',    desc: 'Slow orbs that explode in a wide blast.',     cost: 90000,  dmg: 230,  rate: 1.8, spd: 170, range: 200, shot: 'arcane', art: 'arcane', splash: 32 },
    { id: 'stars',   cls: 'mage', r: 3, name: 'Staff of Stars', desc: 'Starbursts that blast and chain.',           cost: 650000, dmg: 540,  rate: 2.6, spd: 220, range: 210, shot: 'arcane', art: 'stars', splash: 30, chain: 2 },
    { id: 'void',    cls: 'mage', r: 4, name: 'Void Scepter',  desc: 'Tears in reality that swallow crowds.',       cost: 5e6,    dmg: 1500, rate: 2.4, spd: 210, range: 220, shot: 'arcane', art: 'void', splash: 42, chain: 3 },
    // Rogue: fast throws, built-in crit
    { id: 'knife',   cls: 'rogue', r: 0, name: 'Throwing Knife', desc: 'Quick, sharp, and +10% crit chance.',       cost: 0,      dmg: 4,    rate: 3.0, spd: 320, range: 130, shot: 'knife', art: 'knife', crit: 10 },
    { id: 'kunai',   cls: 'rogue', r: 0, name: 'Twin Kunai',     desc: 'Throws two at once. +10% crit chance.',     cost: 150,    dmg: 7,    rate: 3.2, spd: 330, range: 140, shot: 'knife', art: 'kunai', crit: 10, multi: 1 },
    { id: 'star',    cls: 'rogue', r: 1, name: 'Shuriken',       desc: 'Spinning stars that pierce two monsters.',  cost: 1500,   dmg: 22,   rate: 3.4, spd: 300, range: 150, shot: 'star', art: 'star', crit: 12, pierce: 2 },
    { id: 'dart',    cls: 'rogue', r: 2, name: 'Poison Darts',   desc: 'Poison eats away at whatever they hit.',    cost: 12000,  dmg: 50,   rate: 3.6, spd: 360, range: 160, shot: 'dart', art: 'dart', crit: 12 },
    { id: 'fang',    cls: 'rogue', r: 3, name: 'Shadow Fang',    desc: 'Twin cursed blades. +15% crit chance.',     cost: 90000,  dmg: 150,  rate: 4.0, spd: 360, range: 160, shot: 'knife', art: 'fang', crit: 15, multi: 1 },
    { id: 'reaper',  cls: 'rogue', r: 3, name: 'Reaper Stars',   desc: 'Blood-red stars that pierce four.',         cost: 650000, dmg: 380,  rate: 4.2, spd: 330, range: 170, shot: 'star', art: 'reaper', crit: 15, pierce: 4 },
    { id: 'night',   cls: 'rogue', r: 4, name: 'Nightfall',      desc: 'Three blades of pure shadow. +20% crit.',   cost: 5e6,    dmg: 1000, rate: 4.5, spd: 380, range: 180, shot: 'knife', art: 'night', crit: 20, multi: 2 },
    // Summoner: homing souls, and more minions with better weapons
    { id: 'bone',    cls: 'summoner', r: 0, name: 'Bone Wand',     desc: 'Souls that seek out monsters. Raises 2 skeletons.', cost: 0, dmg: 4,  rate: 2.0, spd: 170, range: 180, shot: 'soul', art: 'bone', minions: 2 },
    { id: 'rod',     cls: 'summoner', r: 0, name: 'Spirit Rod',    desc: 'Brighter souls. Raises 2 skeletons.',     cost: 150,    dmg: 9,    rate: 2.2, spd: 180, range: 185, shot: 'soul', art: 'rod', minions: 2 },
    { id: 'necro',   cls: 'summoner', r: 1, name: 'Necro Staff',   desc: 'A skull-topped staff. Raises 3 skeletons.', cost: 1500,  dmg: 26,   rate: 2.2, spd: 190, range: 190, shot: 'soul', art: 'skull', minions: 3 },
    { id: 'lich',    cls: 'summoner', r: 2, name: 'Lich Scepter',  desc: 'Souls that chain to a second monster. 3 skeletons.', cost: 12000, dmg: 70, rate: 2.4, spd: 200, range: 195, shot: 'soul', art: 'lich', minions: 3, chain: 1 },
    { id: 'lantern', cls: 'summoner', r: 3, name: 'Soul Lantern',  desc: 'A lantern of trapped souls. Raises 4 skeletons.', cost: 90000, dmg: 190, rate: 2.6, spd: 210, range: 200, shot: 'soul', art: 'lantern', minions: 4 },
    { id: 'crown',   cls: 'summoner', r: 3, name: 'Crown of Souls', desc: 'Souls chain twice. Raises 4 skeletons.',  cost: 650000, dmg: 480, rate: 2.8, spd: 220, range: 205, shot: 'soul', art: 'crown', minions: 4, chain: 2 },
    { id: 'tome',    cls: 'summoner', r: 4, name: 'Abyssal Tome',  desc: 'Forbidden pages. Raises 5 skeletons.',     cost: 5e6,    dmg: 1300, rate: 3.0, spd: 230, range: 210, shot: 'soul', art: 'tome', minions: 5, chain: 2 },
  ];
  // ---- the second armoury: per class one more plain common, two rares, two epics and a legendary, slotted in between by price ----
  WEAPONS.push(
    // Ranger
    { id: 'hunter',   cls: 'ranger', r: 0, name: 'Hunting Bow',     desc: 'A sturdy bow for the long walk. Pierces one.', cost: 500,    dmg: 18,   rate: 2.5, spd: 270, range: 180, shot: 'arrow', art: 'hunter', pierce: 1 },
    { id: 'repeater', cls: 'ranger', r: 2, name: 'Repeater',        desc: 'A crank-fed crossbow that never stops.',      cost: 5000,   dmg: 45,   rate: 3.6, spd: 300, range: 185, shot: 'bolt', pierce: 1 },
    { id: 'blunder',  cls: 'ranger', r: 2, name: 'Blunderbuss',     desc: 'Three lead balls in a wide spray. Short range.', cost: 25000, dmg: 110, rate: 1.7, spd: 300, range: 140, shot: 'ball', multi: 2 },
    { id: 'frostbow', cls: 'ranger', r: 3, name: 'Frostfang Bow',   desc: 'Arrows of ice that slow and pierce three.',   cost: 250000, dmg: 320,  rate: 2.7, spd: 350, range: 215, shot: 'frost', art: 'frostbow', pierce: 3 },
    { id: 'thunderbow', cls: 'ranger', r: 3, name: 'Thunderbow',    desc: 'Every arrow is a bolt of lightning that jumps to 3 more.', cost: 1.5e6, dmg: 800, rate: 2.8, spd: 400, range: 220, shot: 'spark', art: 'thunderbow', chain: 3 },
    { id: 'sunbow',   cls: 'ranger', r: 4, name: 'Sunpiercer',      desc: 'Arrows of sunlight that pierce eight.',        cost: 1.5e7,  dmg: 3500, rate: 3.2, spd: 420, range: 240, shot: 'arrow', art: 'sunbow', pierce: 8 },
    // Warrior
    { id: 'mace',     cls: 'warrior', r: 0, name: 'Spiked Mace',    desc: 'Iron spikes on a heavy head.',                 cost: 500,    dmg: 40,   rate: 1.7, reach: 32, arc: 2.0, shot: 'slash', art: 'mace', slash: '#d0d4d8' },
    { id: 'scimitar', cls: 'warrior', r: 2, name: 'Scimitar',       desc: 'A curved blade for fast, wide cuts.',          cost: 5000,   dmg: 130,  rate: 2.4, reach: 36, arc: 2.4, shot: 'slash', art: 'scimitar', slash: '#fff2cf' },
    { id: 'halberd',  cls: 'warrior', r: 2, name: 'Halberd',        desc: 'An axe on a long pole. Huge reach.',           cost: 25000,  dmg: 320,  rate: 1.5, reach: 50, arc: 2.0, shot: 'slash', art: 'halberd', slash: '#c9ced2' },
    { id: 'frostblade', cls: 'warrior', r: 3, name: 'Frostbrand',   desc: 'An ice-cold blade. Every hit slows.',          cost: 250000, dmg: 800,  rate: 2.0, reach: 46, arc: 2.8, shot: 'slash', art: 'frostblade', slash: '#9fe0ff', chill: true },
    { id: 'stormblade', cls: 'warrior', r: 3, name: 'Stormcaller',  desc: 'Thunder in steel. Hits stun for a moment.',    cost: 1.5e6,  dmg: 2000, rate: 2.1, reach: 48, arc: 2.8, shot: 'slash', art: 'stormblade', slash: '#7fe8ff', stun: 0.3 },
    { id: 'dragonslayer', cls: 'warrior', r: 4, name: 'Dragonslayer', desc: 'A slab of black steel forged in dragon fire. Burns and stuns.', cost: 1.5e7, dmg: 9000, rate: 1.9, reach: 58, arc: 3.4, shot: 'slash', art: 'dragonslayer', slash: '#ff6a1a', burn: true, stun: 0.4 },
    // Mage
    { id: 'oak',      cls: 'mage', r: 0, name: 'Oak Staff',         desc: 'Living wood that hums with magic.',            cost: 500,    dmg: 18,   rate: 2.2, spd: 230, range: 180, shot: 'magic', art: 'oak' },
    { id: 'ember',    cls: 'mage', r: 2, name: 'Ember Rod',         desc: 'Hot coals that burst on impact.',              cost: 5000,   dmg: 48,   rate: 2.4, spd: 240, range: 190, shot: 'fire', art: 'ember', splash: 22 },
    { id: 'crystal',  cls: 'mage', r: 2, name: 'Crystal Staff',     desc: 'Shards of crystal that slow and pierce two.',  cost: 25000,  dmg: 120,  rate: 2.4, spd: 280, range: 200, shot: 'frost', art: 'crystal', pierce: 2 },
    { id: 'tempest',  cls: 'mage', r: 3, name: 'Tempest Staff',     desc: 'Lightning jumps between up to 5 monsters.',    cost: 250000, dmg: 340,  rate: 2.8, spd: 380, range: 210, shot: 'spark', art: 'tempest', chain: 4 },
    { id: 'solar',    cls: 'mage', r: 3, name: 'Solar Scepter',     desc: 'Captured suns that explode in a wide blast.',  cost: 1.5e6,  dmg: 850,  rate: 2.4, spd: 230, range: 215, shot: 'arcane', art: 'solar', splash: 34 },
    { id: 'eternity', cls: 'mage', r: 4, name: 'Staff of Eternity', desc: 'The end of all things, on a stick.',           cost: 1.5e7,  dmg: 3800, rate: 2.6, spd: 240, range: 230, shot: 'arcane', art: 'eternity', splash: 46, chain: 3 },
    // Rogue
    { id: 'dagger',   cls: 'rogue', r: 0, name: 'Bone Dagger',      desc: 'Carved from something big. +10% crit chance.', cost: 500,    dmg: 12,   rate: 3.2, spd: 330, range: 140, shot: 'knife', art: 'dagger', crit: 10 },
    { id: 'chakram',  cls: 'rogue', r: 2, name: 'Chakram',          desc: 'Golden rings that pierce three. +12% crit.',   cost: 5000,   dmg: 32,   rate: 3.2, spd: 300, range: 160, shot: 'star', art: 'chakram', crit: 12, pierce: 3 },
    { id: 'venom',    cls: 'rogue', r: 2, name: 'Venom Fangs',      desc: 'Two poisoned darts at once. +12% crit.',       cost: 25000,  dmg: 75,   rate: 3.8, spd: 360, range: 160, shot: 'dart', art: 'dart', crit: 12, multi: 1 },
    { id: 'ghostblade', cls: 'rogue', r: 3, name: 'Ghost Knives',   desc: 'Twin knives of cold mist. +15% crit.',         cost: 250000, dmg: 230,  rate: 4.2, spd: 360, range: 170, shot: 'knife', art: 'ghostblade', crit: 15, multi: 1 },
    { id: 'bloodstar', cls: 'rogue', r: 3, name: 'Blood Moon Stars', desc: 'Dark red stars that pierce five. +16% crit.',  cost: 1.5e6,  dmg: 560,  rate: 4.4, spd: 340, range: 175, shot: 'star', art: 'bloodstar', crit: 16, pierce: 5 },
    { id: 'oblivion', cls: 'rogue', r: 4, name: 'Oblivion',         desc: 'Four blades that cut a hole in the world. +22% crit.', cost: 1.5e7, dmg: 2600, rate: 4.8, spd: 400, range: 190, shot: 'knife', art: 'oblivion', crit: 22, multi: 3 },
    // Summoner
    { id: 'charm',    cls: 'summoner', r: 0, name: 'Grave Charm',   desc: 'A dead man\'s lucky charm. Raises 2 skeletons.', cost: 500,  dmg: 14,   rate: 2.1, spd: 180, range: 185, shot: 'soul', art: 'charm', minions: 2 },
    { id: 'censer',   cls: 'summoner', r: 2, name: 'Spirit Censer', desc: 'Smoke full of souls. Raises 3 skeletons.',     cost: 5000,   dmg: 40,   rate: 2.3, spd: 190, range: 190, shot: 'soul', art: 'censer', minions: 3 },
    { id: 'ossuary',  cls: 'summoner', r: 2, name: 'Ossuary Staff', desc: 'Souls chain to a second monster. 3 skeletons.', cost: 25000, dmg: 105, rate: 2.3, spd: 200, range: 195, shot: 'soul', art: 'ossuary', minions: 3, chain: 1 },
    { id: 'wraithstaff', cls: 'summoner', r: 3, name: 'Wraith Staff', desc: 'Frozen souls that chain once. Raises 4 skeletons.', cost: 250000, dmg: 300, rate: 2.6, spd: 210, range: 200, shot: 'soul', art: 'wraithstaff', minions: 4, chain: 1 },
    { id: 'grimoire', cls: 'summoner', r: 3, name: 'Black Grimoire', desc: 'Souls chain twice. Raises 5 skeletons.',       cost: 1.5e6,  dmg: 720,  rate: 2.8, spd: 220, range: 205, shot: 'soul', art: 'tome', minions: 5, chain: 2 },
    { id: 'deathscep', cls: 'summoner', r: 4, name: 'Scepter of Death', desc: 'Souls chain three times. Raises 6 skeletons.', cost: 1.5e7, dmg: 3300, rate: 3.2, spd: 240, range: 220, shot: 'soul', art: 'deathscep', minions: 6, chain: 3 },
  );
  // each class's line, cheapest first: that is the order the shop unlocks them in
  WEAPONS.sort((a, b) => (CLASS_ORDER.indexOf(a.cls) - CLASS_ORDER.indexOf(b.cls)) || a.cost - b.cost);
  // armor lines: hp/def follow the same curve for every class, scaled by the class's toughness, plus a class bonus that grows per tier
  const ARMOR_BASE = [[0, 50, 0], [250, 85, 8], [2500, 150, 22], [20000, 280, 50], [150000, 520, 100], [1.2e6, 1000, 190]];
  const ARMOR_LINES = {
    ranger: { hp: 1, def: 1, bonus: t => ({ rate: t * 2 }), sets: [
      ['cloth', 'Cloth Tunic', 'Better than nothing. Barely.', '#6aa84f', '#4c7a38'], ['leather', 'Leather Vest', 'Stitched hide that turns a nibble.', '#a06c3c', '#734a28'],
      ['chain', 'Chainmail', 'Rings of steel against claws and teeth.', '#aab3bb', '#79828a'], ['iron', 'Iron Plate', 'Heavy plates that shrug off club blows.', '#7b8794', '#55606b'],
      ['mythril', 'Mythril Mail', 'Light as silk, hard as a cyclops skull.', '#6fd3ff', '#3a9ac4'], ['dragon', 'Dragon Scale', 'Forged from a dragon that lost a fight.', '#d0473a', '#8e2318']] },
    warrior: { hp: 1.5, def: 1.5, bonus: t => ({ dmg: t * 3 }), sets: [
      ['w_pad', 'Padded Gambeson', 'Quilted cloth for the front line.', '#b08d5a', '#7d6240'], ['w_ring', 'Ring Mail', 'Iron rings sewn onto leather.', '#9aa2aa', '#6a7078'],
      ['w_steel', 'Steel Plate', 'Full plate. Completes the Warrior set.', '#c9d1d8', '#8a949c'], ['w_knight', "Knight's Plate", 'Polished and proud.', '#e2e8ee', '#9aa6b0'],
      ['w_war', 'Warlord Plate', 'Spiked and scarred by a hundred fights.', '#8a3a2a', '#5a2016'], ['w_titan', 'Titan Plate', 'Gold-forged armor of the giants.', '#ffd36a', '#c98a14']] },
    mage: { hp: 0.75, def: 0.6, bonus: t => ({ dmg: t * 5 }), sets: [
      ['m_novice', 'Novice Robe', 'Itchy wool and big dreams.', '#5a6ad0', '#3d4aa0'], ['m_app', 'Apprentice Robe', 'Stained with failed potions.', '#7a5ad0', '#5a3fa0'],
      ['m_arc', 'Arcane Robe', 'Woven with runes. Completes the Mage set.', '#4fb6e8', '#2c7fb0'], ['m_sage', 'Sage Vestments', 'Robes of a hundred-year scholar.', '#e8e0d0', '#b0a890'],
      ['m_arch', 'Archmage Robe', 'Crackles when you walk.', '#a02a7a', '#701a54'], ['m_star', 'Starweave', 'Spun from the night sky itself.', '#2a2a6a', '#14143a']] },
    rogue: { hp: 0.8, def: 0.7, bonus: t => ({ crit: t * 2, speed: t * 3 }), sets: [
      ['r_rags', 'Patched Rags', 'Nobody looks twice at rags.', '#7a6a5a', '#5a4a3a'], ['r_wrap', 'Leather Wraps', 'Soft soles, quiet steps.', '#6b4f3a', '#4a3426'],
      ['r_shadow', 'Shadow Garb', 'Drinks the light. Completes the Rogue set.', '#3a3a4a', '#24242e'], ['r_assassin', 'Assassin Leathers', 'Hidden pockets for hidden blades.', '#4a2a2a', '#2e1818'],
      ['r_night', 'Nightshade', 'Dyed in poison flowers.', '#2a3a2a', '#162016'], ['r_phantom', 'Phantom Shroud', 'Half here, half somewhere else.', '#5a4a7a', '#3a2e54']] },
    summoner: { hp: 0.85, def: 0.8, bonus: t => ({ minion: t * 10 }), sets: [
      ['s_cult', 'Cultist Robe', 'Smells of candles and graves.', '#4a3a2a', '#2e2418'], ['s_bone', 'Bone Mantle', 'Rattles when you move.', '#d8d0b8', '#a8a088'],
      ['s_necro', 'Necro Shroud', 'Cold to the touch. Completes the Summoner set.', '#3a4a3a', '#24302a'], ['s_grave', 'Gravewarden', 'Worn by the keepers of the dead.', '#5a5a6a', '#3a3a46'],
      ['s_lich', 'Lich Robes', 'The previous owner is still in there.', '#3d2a5a', '#24183a'], ['s_soul', 'Soulweave', 'Threads of living souls.', '#4fd8a0', '#2a9a6e']] },
  };
  const ARMORS = [];
  for (const cls of CLASS_ORDER) {
    const L = ARMOR_LINES[cls];
    L.sets.forEach(([id, name, desc, c0, c1], t) => {
      const [cost, hp, def] = ARMOR_BASE[t];
      ARMORS.push({ id, cls, r: [0, 0, 1, 2, 3, 4][t], tier: t, name, desc, cost, hp: Math.round(hp * L.hp), def: Math.round(def * L.def), bonus: L.bonus(t), c: [c0, c1] });
    });
  }
  const classItems = (list, cls) => list.filter(it => it.cls === cls);

  // ---------- special effects for the better weapons (the cheap starters stay plain) ----------
  // fx: what happens on swing/fire/hit/explode/kill · look: projectile art · trail: particle colour behind shots · aura: sparks from the weapon in your hand
  const WFX = {
    hammer:  { fx: 'quake', name: 'Earthquake', text: 'Every swing cracks the ground in front of you, stunning what stands there.', aura: ['#ffb347', '#d6b482'], arate: 4 },
    gsword:  { fx: 'beam', name: 'Sword Beam', text: 'Every second swing fires a beam of light that cuts through everything.', aura: ['#ffffff', '#cfe9ff'], arate: 6 },
    fsword:  { fx: 'flamewave', name: 'Flame Wave', text: 'Every swing hurls a wave of fire that sets monsters burning.', aura: ['#ff6a1a', '#ffd25a', '#ff9a3c'], arate: 28 },
    ksword:  { fx: 'royal', name: 'Royal Judgement', text: 'Golden waves on every swing; every 4th swing calls lightning on 3 monsters.', aura: ['#fff2a0', '#ffd84d'], arate: 14 },
    flint:   { fx: 'ricochet', name: 'Ricochet', text: 'Lead shot bounces off to a second monster.', chain: 1, trail: 'rgba(230,220,200,0.7)' },
    longbow: { fx: 'vines', name: 'Entangle', text: 'Arrows sprout vines that root monsters in place.', look: 'leafarrow', trail: '#6ee07a', aura: ['#6ee07a', '#b6f5a0'], arate: 6 },
    cannon:  { fx: 'dragonfire', name: 'Dragonfire', text: 'Blasts leave the ground burning.', trail: '#ff9a3c', aura: ['#ff6a1a', '#ffd25a'], arate: 9 },
    starbow: { fx: 'starfall', name: 'Starfall', text: 'Hits can call a shower of falling stars.', look: 'stararrow', trail: '#fff2a0', aura: ['#fff2a0', '#ffffff'], arate: 10 },
    staff:   { fx: 'thunder', name: 'Thunderclap', text: 'Visible chain lightning that can stun.', trail: '#bff4ff', aura: ['#7fe8ff', '#ffffff'], arate: 12 },
    arcane:  { fx: 'arcane', name: 'Arcane Rift', text: 'Blasts open a rift that drags monsters in.', trail: '#c78cff', aura: ['#c78cff', '#e4c8ff'], arate: 9 },
    stars:   { fx: 'supernova', name: 'Supernova', text: 'Blasts shatter into five shooting stars.', look: 'starorb', trail: '#ffe04a', aura: ['#ffe04a', '#ffffff'], arate: 10 },
    void:    { fx: 'void', name: 'Black Hole', text: 'Blasts become a black hole that pulls everything in, then implodes.', look: 'voidorb', trail: '#7a3fb0', aura: ['#c78cff', '#3a1a5a'], arate: 16, inward: true },
    dart:    { fx: 'toxic', name: 'Toxic Cloud', text: 'Hits burst into a lingering cloud of poison.', trail: '#6ee07a', aura: ['#6ee07a'], arate: 6 },
    fang:    { fx: 'shadow', name: 'Shadow Strike', text: 'Critical hits are followed by a shadow slash around the target.', look: 'shadowknife', trail: '#a06ad0', aura: ['#a06ad0', '#3a2a4a'], arate: 9 },
    reaper:  { fx: 'reaper', name: 'Soul Reap', text: 'Stars bounce between two more monsters and heal you a little.', look: 'redstar', chain: 2, trail: '#d8402a', aura: ['#d8402a'], arate: 7 },
    night:   { fx: 'night', name: 'Nightblade', text: 'Hits can summon a blade of pure shadow that slashes everything nearby.', look: 'nightknife', trail: '#7a3fb0', aura: ['#c78cff', '#2a2a3a'], arate: 12 },
    lich:    { fx: 'lich', name: 'Undying', text: 'Kills can raise a skeleton for 8 seconds (up to 3).', look: 'lichsoul', trail: '#7fe8ff', aura: ['#7fe8ff', '#6ee07a'], arate: 9 },
    lantern: { fx: 'lantern', name: 'Will-o-Wisp', text: 'Each kill frees a wisp that hunts the next monster.', look: 'lanternsoul', trail: '#e0ff8a', aura: ['#e0ff8a', '#6ee07a'], arate: 10 },
    crown:   { fx: 'crown', name: 'Royal Souls', text: 'Souls split in two after their first hit.', look: 'crownsoul', trail: '#ffd84d', aura: ['#ffd84d', '#4fd8a0'], arate: 10 },
    tome:    { fx: 'abyss', name: 'Abyssal Grasp', text: 'Every 4th shot, a tentacle erupts under a monster and stuns everything around it.', look: 'abysssoul', trail: '#a06ad0', aura: ['#a06ad0', '#4fd8a0'], arate: 11 },
  };
  // effects for the second armoury (several borrow an engine from an older weapon under a new name)
  Object.assign(WFX, {
    frostbow:   { fx: 'vines', name: 'Frostbite', text: 'Arrows burst into ice that roots monsters in place.', look: 'leafarrow', trail: '#bfe4ff', aura: ['#9fe0ff', '#ffffff'], arate: 7 },
    thunderbow: { fx: 'thunder', name: 'Thunderclap', text: 'Visible chain lightning that can stun.', trail: '#ffe04a', aura: ['#ffe04a', '#7fe8ff'], arate: 12 },
    sunbow:     { fx: 'starfall', name: 'Solar Flare', text: 'Hits can call down a shower of sunfire.', look: 'stararrow', trail: '#fff2a0', aura: ['#ffd84d', '#ffffff'], arate: 12 },
    frostblade: { fx: 'beam', name: 'Frost Beam', text: 'Every second swing fires a beam of ice that cuts through everything.', aura: ['#bfe4ff', '#ffffff'], arate: 10 },
    stormblade: { fx: 'royal', name: 'Storm Edge', text: 'Waves of light on every swing; every 4th swing calls lightning on 3 monsters.', aura: ['#7fe8ff', '#ffe04a'], arate: 16 },
    dragonslayer: { fx: 'flamewave', name: 'Dragonfire', text: 'Every swing hurls a wave of dragon fire that sets monsters burning.', aura: ['#ff6a1a', '#ffd25a', '#8a1a1a'], arate: 30 },
    tempest:    { fx: 'thunder', name: 'Thunderclap', text: 'Visible chain lightning that can stun.', trail: '#bff4ff', aura: ['#7fe8ff', '#ffffff'], arate: 14 },
    solar:      { fx: 'supernova', name: 'Supernova', text: 'Blasts shatter into five shooting stars.', look: 'starorb', trail: '#ffd84d', aura: ['#ffd84d', '#fff2a0'], arate: 12 },
    eternity:   { fx: 'void', name: 'Event Horizon', text: 'Blasts become a black hole that pulls everything in, then implodes.', look: 'voidorb', trail: '#c78cff', aura: ['#ffffff', '#c78cff'], arate: 18, inward: true },
    ghostblade: { fx: 'shadow', name: 'Phantom Strike', text: 'Critical hits are followed by a ghostly slash around the target.', look: 'shadowknife', trail: '#dfe7ff', aura: ['#dfe7ff', '#9fb4ff'], arate: 9 },
    bloodstar:  { fx: 'reaper', name: 'Blood Harvest', text: 'Stars bounce between two more monsters and heal you a little.', look: 'redstar', chain: 2, trail: '#8a1a1a', aura: ['#d8402a', '#8a1a1a'], arate: 8 },
    oblivion:   { fx: 'night', name: 'Void Blade', text: 'Hits can summon a blade of pure void that slashes everything nearby.', look: 'nightknife', trail: '#ff6ad0', aura: ['#ff6ad0', '#1a1a2a'], arate: 14 },
    wraithstaff: { fx: 'lich', name: 'Undying', text: 'Kills can raise a skeleton for 8 seconds (up to 3).', look: 'lichsoul', trail: '#9fe0ff', aura: ['#9fe0ff', '#ffffff'], arate: 9 },
    grimoire:   { fx: 'abyss', name: 'Abyssal Grasp', text: 'Every 4th shot, a tentacle erupts under a monster and stuns everything around it.', look: 'abysssoul', trail: '#a06ad0', aura: ['#a06ad0', '#3a1a5a'], arate: 11 },
    deathscep:  { fx: 'crown', name: 'Reaped Souls', text: 'Souls split in two after their first hit.', look: 'crownsoul', trail: '#d8402a', aura: ['#d8402a', '#1a1a1a'], arate: 12 },
  });
  // every remaining weapon gets an effect of its own, so no two weapons share one (handlers: FX_* in combat.js)
  for (const [id, fx, name, text] of [
    // Ranger
    ['sling', 'sting', 'Stinging Shot', 'Pebbles sometimes stun what they hit.'],
    ['bow', 'pin', 'Pinning Arrow', 'Arrows slow what they hit.'],
    ['hunter', 'mark', "Hunter's Mark", 'The first hit marks a monster; the next one tears the mark open for bonus damage.'],
    ['xbow', 'bleed', 'Deep Wound', 'Heavy bolts leave monsters bleeding.'],
    ['repeater', 'overdrive', 'Overdrive', 'Every 6th shot fires two extra bolts.'],
    ['blunder', 'blowback', 'Blowback', 'Lead balls hurl monsters far backwards.'],
    ['frostbow', 'shatter', 'Shatter', 'Arrows slow what they hit and burst into three ice shards.'],
    ['thunderbow', 'skybolt', 'Sky Bolt', 'Hits can call lightning from the sky, stunning everything around the target.'],
    ['sunbow', 'sunfire', 'Solar Flare', 'Monsters you kill erupt in sunfire that burns the crowd around them.'],
    // Warrior
    ['club', 'bonk', 'Bonk', 'Hits sometimes knock monsters senseless.'],
    ['sword', 'riposte', 'Riposte', 'Every 5th swing is a full spin that cuts all around you.'],
    ['mace', 'gash', 'Gash', 'Iron spikes leave monsters bleeding.'],
    ['axe', 'backcut', 'Back Cut', 'Every swing also chops whatever is behind you.'],
    ['scimitar', 'dance', 'Blade Dance', 'Every swing carries you forward a step.'],
    ['halberd', 'thrust', 'Long Thrust', 'Every swing ends in a stab far beyond your reach.'],
    ['frostblade', 'icering', 'Ice Ring', 'Every 3rd swing bursts a ring of ice around you that slows everything it touches.'],
    ['stormblade', 'arc', 'Storm Arc', 'Hits can jump as lightning to a nearby monster.'],
    ['dragonslayer', 'scorch', 'Scorched Earth', 'Every swing leaves the ground ahead of you burning.'],
    // Mage
    ['appr', 'echo', 'Echo', 'Bolts sometimes strike a second time.'],
    ['wand', 'cinder', 'Cinders', 'Fireballs set what they hit alight.'],
    ['oak', 'regrowth', 'Regrowth', 'Every kill heals you a little.'],
    ['frost', 'deepfreeze', 'Deep Freeze', 'Three hits on one monster freeze it solid.'],
    ['ember', 'embers', 'Flying Embers', 'Blasts spit three burning embers in all directions.'],
    ['crystal', 'prism', 'Prism', 'Shards grow stronger with each monster they pierce.'],
    ['tempest', 'tempest', 'Tempest', 'Every 4th shot brings lightning down on up to 5 monsters.'],
    ['solar', 'sunburst', 'Sunburst', 'Blasts sear a huge area, leaving everything in it burning.'],
    ['eternity', 'timeslow', 'Slow Eternity', 'Blasts bend time, slowing every monster in a huge area.'],
    // Rogue
    ['knife', 'nick', 'Nick', 'Critical hits leave monsters bleeding.'],
    ['kunai', 'tether', 'Tether', 'Kunai drag what they hit towards you.'],
    ['dagger', 'siphon', 'Siphon', 'Critical hits heal you.'],
    ['star', 'boomerang', 'Boomerang', 'Stars turn back after their first hit.'],
    ['chakram', 'seeker', 'Seeking Ring', 'After each hit, rings turn towards the next monster.'],
    ['venom', 'neurotoxin', 'Neurotoxin', 'Poison also slows what it infects.'],
    ['ghostblade', 'haunt', 'Haunting', 'Hits can drop a ghostly sword on the target.'],
    ['bloodstar', 'bloodpact', 'Blood Pact', 'The less health you have, the more damage stars deal.'],
    ['oblivion', 'erase', 'Erase', 'Monsters below 15% health vanish outright. Kings are immune.'],
    // Summoner
    ['bone', 'spike', 'Bone Spike', 'Hits sometimes drive a spike of bone up under the target.'],
    ['rod', 'wail', 'Wail', 'Hits sometimes scream, stunning monsters nearby.'],
    ['charm', 'lucky', 'Lucky Charm', 'Kills sometimes drop extra gold.'],
    ['necro', 'rot', 'Spreading Rot', 'Kills poison the monsters around them.'],
    ['censer', 'snare', 'Smoke Snare', 'Hits sometimes open a wisp of smoke that pulls monsters in.'],
    ['ossuary', 'bonecage', 'Bone Burst', 'Kills burst into six shards of bone.'],
    ['wraithstaff', 'wraithchill', 'Wraith Chill', 'Souls slow everything around the monster they hit.'],
    ['grimoire', 'curse', 'Curse', 'Cursed monsters explode when they die.'],
    ['deathscep', 'harvest', 'Harvest', 'Every kill shortens your Q and E cooldowns.'],
  ]) WFX[id] = Object.assign({}, WFX[id], { fx, name, text });
  for (const w of WEAPONS) {
    const f = WFX[w.id];
    if (!f) continue;
    w.fxd = f;
    if (f.chain) w.chain = Math.max(w.chain || 0, f.chain);
    w.desc += ` <span class="wfx">${f.name}:</span> ${f.text}`;
  }
  // ---------- E skills: every weapon brings its own ----------
  // kind picks the engine (fan/barrage/strikes/zone/quake/...); the rest are its knobs. mult scales your weapon damage.
  const TAU = Math.PI * 2;
  const WSKILL = {
    // Ranger
    sling:   { name: 'Pebble Storm', cd: 8, desc: 'Fire 12 pebbles in a rapid burst.', kind: 'barrage', n: 12, gap: 0.06, mult: 1 },
    bow:     { name: 'Fan Shot', cd: 8, desc: 'Loose 5 arrows in a fan that pierce 2 monsters.', kind: 'fan', n: 5, spread: 0.8, mult: 1.2, pierce: 2 },
    xbow:    { name: 'Bolt Burst', cd: 9, desc: '8 heavy bolts in quick succession.', kind: 'barrage', n: 8, gap: 0.08, mult: 1.4, pierce: 3 },
    flint:   { name: 'Buckshot', cd: 9, desc: 'A point-blank blast of 9 lead balls.', kind: 'fan', n: 9, spread: 0.9, mult: 1.3, life: 0.35 },
    longbow: { name: 'Thornfield', cd: 12, desc: 'Vines burst from the ground where you aim and root everything for 4 seconds.', kind: 'zone', zkind: 'vines', r: 48, t: 4, mult: 0.6, root: true },
    cannon:  { name: 'Carpet Bomb', cd: 14, desc: '6 explosions march out in front of you.', kind: 'strikes', skind: 'fire', n: 6, r: 26, mult: 4, mode: 'line' },
    starbow: { name: 'Constellation', cd: 12, desc: '8 stars fall on the nearest monsters.', kind: 'strikes', skind: 'star', n: 8, r: 16, mult: 3, mode: 'enemies' },
    // Warrior
    club:    { name: 'Bonk', cd: 7, desc: 'One huge swing that stuns everything in front of you.', kind: 'quake', r: 34, mult: 3, stun: 1.2, front: true },
    sword:   { name: 'Blade Fan', cd: 8, desc: 'Three waves of light in a fan.', kind: 'fan', n: 3, spread: 0.7, mult: 1.2, look: 'wavelight', wave: true },
    axe:     { name: 'Tornado', cd: 10, desc: 'Spin like a whirlwind for 2 seconds.', kind: 'whirl', t: 2 },
    hammer:  { name: 'Earthshaker', cd: 12, desc: 'A huge quake that stuns everything around you for 2 seconds.', kind: 'quake', r: 80, mult: 3, stun: 2 },
    gsword:  { name: 'Sword Rain', cd: 12, desc: '6 giant swords fall on the nearest monsters.', kind: 'strikes', skind: 'sword', n: 6, r: 16, mult: 5, mode: 'enemies' },
    fsword:  { name: 'Inferno', cd: 10, desc: '5 waves of fire roar out in a wide fan and set everything burning.', kind: 'fan', n: 5, spread: 1.4, mult: 1.6, look: 'wavefire', wave: true, burn: true },
    ksword:  { name: 'Divine Judgement', cd: 14, desc: 'Holy rays strike down from the sky on 5 monsters.', kind: 'strikes', skind: 'holy', n: 5, r: 14, mult: 8, mode: 'enemies', stun: 1 },
    // Mage
    appr:    { name: 'Magic Missiles', cd: 8, desc: '6 bolts that hunt down monsters.', kind: 'fan', n: 6, spread: 2.4, mult: 1.2, home: true },
    wand:    { name: 'Great Fireball', cd: 10, desc: 'A huge fireball that explodes and leaves the ground burning.', kind: 'fireball', mult: 6 },
    frost:   { name: 'Blizzard', cd: 12, desc: 'A freezing storm where you aim slows and chills for 4 seconds.', kind: 'zone', zkind: 'frost', r: 50, t: 4, mult: 0.8 },
    staff:   { name: 'Chain Lightning', cd: 10, desc: 'Lightning leaps through 8 monsters.', kind: 'chain', n: 8, mult: 3 },
    arcane:  { name: 'Arcane Barrage', cd: 10, desc: '10 arcane orbs in a rapid stream.', kind: 'barrage', n: 10, gap: 0.07, mult: 0.8 },
    stars:   { name: 'Meteor Shower', cd: 14, desc: '8 starfire meteors rain down on monsters.', kind: 'strikes', skind: 'star', n: 8, r: 22, mult: 5, mode: 'enemies' },
    void:    { name: 'Singularity', cd: 16, desc: 'A huge black hole where you aim swallows everything, then implodes.', kind: 'zone', zkind: 'vortex', r: 70, t: 3, mult: 1, pull: 4.5, implode: 8, big: true },
    // Rogue
    knife:   { name: 'Fan of Knives', cd: 8, desc: '12 knives burst out in every direction.', kind: 'fan', n: 12, ring: true, mult: 1.2 },
    kunai:   { name: 'Kunai Storm', cd: 8, desc: 'A flurry of 14 kunai.', kind: 'barrage', n: 14, gap: 0.04, mult: 1 },
    star:    { name: 'Shuriken Ring', cd: 9, desc: '10 spinning stars that pierce everything around you.', kind: 'fan', n: 10, ring: true, mult: 1.2, pierce: 99 },
    dart:    { name: 'Plague', cd: 12, desc: '5 poison clouds bloom around you.', kind: 'clouds', n: 5, mult: 0.6 },
    fang:    { name: 'Shadow Clones', cd: 10, desc: 'Shadow clones slash the 5 nearest monsters.', kind: 'clones', n: 5, mult: 4, col: '#a06ad0' },
    reaper:  { name: 'Death Spiral', cd: 12, desc: '16 reaper stars spiral out around you.', kind: 'fan', n: 16, ring: true, mult: 1, pierce: 3 },
    night:   { name: 'Eclipse', cd: 16, desc: 'Darkness falls: every monster near you is cut down and you vanish for 2 seconds.', kind: 'eclipse', r: 130, mult: 5 },
    // Summoner
    bone:    { name: 'Bone Spikes', cd: 9, desc: 'Spikes of bone erupt under the 5 nearest monsters.', kind: 'strikes', skind: 'bone', n: 5, r: 14, mult: 3, mode: 'enemies', stun: 0.5 },
    rod:     { name: 'Spirit Swarm', cd: 9, desc: '10 spirits fly out and hunt monsters.', kind: 'fan', n: 10, ring: true, mult: 1, home: true },
    necro:   { name: 'Grave Call', cd: 14, desc: 'Raise 3 extra skeletons for 10 seconds.', kind: 'summon', skel: 3, t: 10 },
    lich:    { name: 'Frost Lich', cd: 12, desc: 'A wave of cold freezes everything near you for 2 seconds.', kind: 'nova', r: 80, mult: 2, stun: 2 },
    lantern: { name: 'Wisp Storm', cd: 12, desc: '14 wisps burst from the lantern and hunt monsters.', kind: 'fan', n: 14, ring: true, mult: 0.9, home: true },
    crown:   { name: 'Royal Guard', cd: 18, desc: 'A golem and 3 skeletons answer your call for 10 seconds.', kind: 'summon', skel: 3, golem: true, t: 10 },
    tome:    { name: 'Abyss Gate', cd: 14, desc: '6 tentacles tear out of the ground around where you aim.', kind: 'strikes', skind: 'tentacle', n: 6, r: 22, mult: 4, mode: 'aim', stun: 1 },
  };
  // every melee weapon swings with its own look: blunt dust, steel glints, fire, light, royal gold...
  const SLASH_STYLE = { club: 'blunt', sword: 'steel', axe: 'heavy', hammer: 'quake', gsword: 'radiant', fsword: 'fire', ksword: 'royal',
    mace: 'blunt', scimitar: 'steel', halberd: 'heavy', frostblade: 'frost', stormblade: 'storm', dragonslayer: 'fire' };
  for (const w of WEAPONS) if (SLASH_STYLE[w.id]) w.slashStyle = SLASH_STYLE[w.id];
  // how each style draws: crescent width, the cutting edge's colour (none for blunt weapons), and a glow behind it
  const SLASH_LOOK = {
    blunt:   { w: 1.35, edge: null, body: 0.7 },
    steel:   { w: 1, edge: '#ffffff', body: 0.85 },
    heavy:   { w: 1.45, edge: '#ffffff', body: 0.9 },
    quake:   { w: 1.6, edge: '#fff0c8', body: 0.8 },
    radiant: { w: 1.15, edge: '#ffffff', body: 0.85, glow: '160,210,255', gw: 2.4 },
    fire:    { w: 1.25, edge: '#ffe08a', body: 0.9, glow: '255,106,26', gw: 2.3 },
    royal:   { w: 1.2, edge: '#fffbe6', body: 0.9, glow: '255,216,77', gw: 2.4 },
    frost:   { w: 1.2, edge: '#ffffff', body: 0.85, glow: '170,220,255', gw: 2.2 },
    storm:   { w: 1.15, edge: '#fff7a0', body: 0.85, glow: '127,232,255', gw: 2.4 },
  };
  // E skills for the second armoury
  Object.assign(WSKILL, {
    repeater:   { name: 'Bolt Storm', cd: 9, desc: '14 bolts in a blur that pierce 2 monsters.', kind: 'barrage', n: 14, gap: 0.05, mult: 1, pierce: 2 },
    blunder:    { name: 'Scattershot', cd: 9, desc: 'A point-blank blast of 12 lead balls.', kind: 'fan', n: 12, spread: 1.2, mult: 1.2, life: 0.35 },
    frostbow:   { name: 'Hailstorm', cd: 12, desc: 'A storm of hail where you aim slows and chills for 4 seconds.', kind: 'zone', zkind: 'frost', r: 55, t: 4, mult: 0.9 },
    thunderbow: { name: 'Storm Volley', cd: 11, desc: 'Lightning leaps through 10 monsters.', kind: 'chain', n: 10, mult: 4 },
    sunbow:     { name: 'Solar Judgement', cd: 14, desc: 'Sunbeams strike down on 8 monsters and stun them.', kind: 'strikes', skind: 'holy', n: 8, r: 16, mult: 9, mode: 'enemies', stun: 1 },
    scimitar:   { name: 'Crescent Cut', cd: 8, desc: 'Four crescent waves of light in a fan.', kind: 'fan', n: 4, spread: 0.9, mult: 1.4, look: 'wavelight', wave: true },
    halberd:    { name: 'Sweeping Strike', cd: 10, desc: 'A huge sweep that stuns everything in front of you.', kind: 'quake', r: 64, mult: 4, stun: 1.2, front: true },
    frostblade: { name: 'Glacier', cd: 12, desc: 'A freezing storm where you aim slows and chills for 4 seconds.', kind: 'zone', zkind: 'frost', r: 60, t: 4, mult: 1 },
    stormblade: { name: 'Thunderstrike', cd: 11, desc: 'Lightning leaps through 10 monsters.', kind: 'chain', n: 10, mult: 5 },
    dragonslayer: { name: "Dragon's Wrath", cd: 12, desc: '7 waves of dragon fire roar out in a wide fan and set everything burning.', kind: 'fan', n: 7, spread: 1.6, mult: 3, look: 'wavefire', wave: true, burn: true },
    ember:      { name: 'Fire Bloom', cd: 10, desc: 'A great fireball that explodes and leaves the ground burning.', kind: 'fireball', mult: 5 },
    crystal:    { name: 'Shard Spiral', cd: 10, desc: '12 crystal shards burst out in every direction and pierce 3.', kind: 'fan', n: 12, ring: true, mult: 1.4, pierce: 3 },
    tempest:    { name: 'Tempest', cd: 11, desc: 'Lightning leaps through 12 monsters.', kind: 'chain', n: 12, mult: 3.5 },
    solar:      { name: 'Sunburst', cd: 13, desc: 'Holy fire strikes 8 monsters and stuns them.', kind: 'strikes', skind: 'holy', n: 8, r: 16, mult: 8, mode: 'enemies', stun: 1 },
    eternity:   { name: 'Big Bang', cd: 16, desc: 'A vast black hole where you aim swallows everything, then explodes.', kind: 'zone', zkind: 'vortex', r: 80, t: 3.5, mult: 1.2, pull: 5, implode: 10, big: true },
    chakram:    { name: 'Whirling Rings', cd: 9, desc: '8 golden rings fly out in every direction and pierce everything.', kind: 'fan', n: 8, ring: true, mult: 1.5, pierce: 99 },
    venom:      { name: 'Miasma', cd: 12, desc: '6 poison clouds bloom around you.', kind: 'clouds', n: 6, mult: 0.8 },
    ghostblade: { name: 'Phantom Blades', cd: 10, desc: 'Ghost clones slash the 6 nearest monsters.', kind: 'clones', n: 6, mult: 4, col: '#dfe7ff' },
    bloodstar:  { name: 'Blood Moon', cd: 12, desc: '20 blood stars spiral out around you and pierce 4.', kind: 'fan', n: 20, ring: true, mult: 1, pierce: 4 },
    oblivion:   { name: 'Oblivion', cd: 16, desc: 'Everything near you is erased in the dark and you vanish for 2 seconds.', kind: 'eclipse', r: 160, mult: 8 },
    censer:     { name: 'Spirit Burst', cd: 9, desc: '12 spirits burst out and hunt monsters.', kind: 'fan', n: 12, ring: true, mult: 1, home: true },
    ossuary:    { name: 'Ossuary', cd: 10, desc: 'Spikes of bone erupt under the 7 nearest monsters.', kind: 'strikes', skind: 'bone', n: 7, r: 14, mult: 3.5, mode: 'enemies', stun: 0.6 },
    wraithstaff: { name: 'Wraith Wail', cd: 12, desc: 'A scream of cold freezes everything near you for 2 seconds.', kind: 'nova', r: 100, mult: 3, stun: 2 },
    grimoire:   { name: 'Dark Legion', cd: 15, desc: 'Raise 5 extra skeletons for 12 seconds.', kind: 'summon', skel: 5, t: 12 },
    deathscep:  { name: 'Army of the Dead', cd: 18, desc: 'A golem and 6 skeletons rise to fight for 15 seconds.', kind: 'summon', skel: 6, golem: true, t: 15 },
  });
  // common (cheapest-tier) weapons have no E skill: you earn one with your first uncommon or better weapon
  for (const w of WEAPONS) w.skill = w.r === 0 ? null : Object.assign({ id: 'w:' + w.id }, WSKILL[w.id]);
  // ---------- Q skills: they come from your armor now (the first two armors of every class have none) ----------
  // kind 'class' reuses the old class abilities; 'guard' is a defensive burst (buffs and/or healing); the rest are E-skill engines.
  // buffs / heal can ride along on any kind.
  const ASKILL = {
    // Warrior
    w_steel:  { name: 'Whirlwind', cd: 10, desc: 'Spin for 3 seconds, cutting everything around you.', kind: 'class', cid: 'whirl' },
    w_knight: { name: 'Shield Wall', cd: 16, desc: 'Nothing can hurt you for 3 seconds, and you heal 15%.', kind: 'guard', buffs: { immortal: 3 }, heal: 0.15 },
    w_war:    { name: 'War Cry', cd: 14, desc: 'A roar that stuns everything around you and sends you into a 5-second frenzy.', kind: 'quake', r: 90, mult: 2, stun: 1.5, buffs: { frenzy: 5 } },
    w_titan:  { name: 'Titan Slam', cd: 14, desc: 'Slam the ground: a huge shockwave stuns everything nearby.', kind: 'quake', r: 120, mult: 6, stun: 2.5 },
    // Ranger
    chain:    { name: 'Arrow Rain', cd: 10, desc: 'Arrows pour down on the spot you aim at for 3 seconds.', kind: 'class', cid: 'rain' },
    iron:     { name: "Hunter's Rush", cd: 16, desc: 'Run 60% faster and shoot twice as fast for 5 seconds.', kind: 'guard', buffs: { haste: 5, frenzy: 5 } },
    mythril:  { name: 'Volley', cd: 11, desc: 'Loose 9 arrows in a wide fan that pierce 3 monsters.', kind: 'fan', n: 9, spread: 1.3, mult: 1.6, pierce: 3 },
    dragon:   { name: 'Dragon Breath', cd: 12, desc: 'Breathe 7 waves of fire that set everything burning.', kind: 'fan', n: 7, spread: 1.1, mult: 2.4, look: 'wavefire', wave: true, burn: true },
    // Mage
    m_arc:    { name: 'Frost Nova', cd: 10, desc: 'Freezes every monster around you solid for 3 seconds.', kind: 'class', cid: 'nova' },
    m_sage:   { name: 'Mana Shield', cd: 18, desc: 'A shield of light: 3 seconds untouchable, and you heal 25%.', kind: 'guard', buffs: { immortal: 3 }, heal: 0.25 },
    m_arch:   { name: 'Arcane Storm', cd: 12, desc: '10 bolts of starfire strike the nearest monsters.', kind: 'strikes', skind: 'star', n: 10, r: 18, mult: 4, mode: 'enemies' },
    m_star:   { name: 'Starfall', cd: 15, desc: '14 falling stars crush everything around you.', kind: 'strikes', skind: 'star', n: 14, r: 22, mult: 6, mode: 'enemies' },
    // Rogue
    r_shadow:   { name: 'Vanish', cd: 12, desc: 'Turn invisible for 4 seconds. Your next attack deals triple damage.', kind: 'class', cid: 'vanish' },
    r_assassin: { name: 'Smoke Bomb', cd: 13, desc: 'Poison smoke bursts around you and you dash away 60% faster for 4 seconds.', kind: 'clouds', n: 6, mult: 0.8, buffs: { haste: 4 } },
    r_night:    { name: 'Blade Dance', cd: 11, desc: 'Venom clones slash the 6 nearest monsters.', kind: 'clones', n: 6, mult: 5, col: '#6ee07a' },
    r_phantom:  { name: 'Phantom Step', cd: 16, desc: 'Step through the shadows: everything near you is cut down and you vanish for 2 seconds.', kind: 'eclipse', r: 140, mult: 6 },
    // Summoner
    s_necro:  { name: 'Raise Dead', cd: 12, desc: 'Raise skeleton warriors for 15 seconds. Better weapons raise more.', kind: 'class', cid: 'raise' },
    s_grave:  { name: 'Grave Ward', cd: 18, desc: 'The dead shield you: 2 seconds untouchable, and you heal 30%.', kind: 'guard', buffs: { immortal: 2 }, heal: 0.3 },
    s_lich:   { name: 'Lich Frost', cd: 12, desc: 'A wave of cold freezes everything near you for 2 seconds.', kind: 'nova', r: 90, mult: 3, stun: 2 },
    s_soul:   { name: 'Soul Army', cd: 18, desc: 'A golem and 4 skeletons rise to fight for you for 12 seconds.', kind: 'summon', skel: 4, golem: true, t: 12 },
  };
  for (const a of ARMORS) a.skill = ASKILL[a.id] ? Object.assign({ id: 'a:' + a.id }, ASKILL[a.id]) : null;
  // the two best armors of every class shed a little light
  const ARMOR_AURA = { mythril: '#6fd3ff', dragon: '#ff6a1a', w_war: '#d8402a', w_titan: '#ffd36a', m_arch: '#ff6ad0', m_star: '#fff2a0',
    r_night: '#6ee07a', r_phantom: '#c78cff', s_lich: '#7fe8ff', s_soul: '#4fd8a0' };
  for (const a of ARMORS) if (ARMOR_AURA[a.id]) { a.aura = ARMOR_AURA[a.id]; a.desc += ' <span class="wfx">Glows with power.</span>'; }
  const MAX_ITEM_LV = 30;
  const itemUpCost = (it, l) => Math.ceil(Math.max(30, it.cost * 0.25) * Math.pow(1.3, l));
  const weaponAt = (w, l) => ({ dmg: w.dmg * (1 + 0.2 * l), rate: w.rate * (1 + 0.04 * l) });
  const armorAt = (a, l) => ({ hp: a.hp * (1 + 0.12 * l), def: a.def * (1 + 0.12 * l) });

  const SHOT_NAMES = ['', '', 'Double Shot', 'Triple Shot', 'Quad Shot', 'Penta Shot', 'Hexa Shot', 'Septa Shot'];
  const CARDS = [
    { id: 'dmg',     icon: 'DMG', base: 6,   name: () => 'Sharpshooter', desc: 'Every hit lands harder.',              text: v => `+${v}% damage` },
    { id: 'rate',    icon: 'SPD', base: 5,   name: () => 'Rapid Fire',   desc: 'Shoot faster while holding the mouse.', text: v => `+${v}% fire rate` },
    { id: 'crit',    icon: 'CRT', base: 2,   cap: 70, name: () => 'Critical Eye', desc: 'Chance to land a critical hit.', text: v => `+${v}% crit chance` },
    { id: 'critdmg', icon: 'CDM', base: 15,  name: () => 'Brutal Crits', desc: 'Critical hits deal more damage.',      text: v => `+${v}% crit damage` },
    { id: 'speed',   icon: 'MOV', base: 4,   cap: 80, name: () => 'Swift Boots', desc: 'Walk faster around the field.', text: v => `+${v}% move speed` },
    { id: 'vit',     icon: 'HP',  base: 8,   name: () => 'Vitality',     desc: 'More maximum health.',                 text: v => `+${v}% max HP` },
    { id: 'armor',   icon: 'ARM', base: 6,   name: () => 'Iron Skin',    desc: 'Your armor blocks more damage.',       text: v => `+${v}% armor` },
    { id: 'regen',   icon: 'REG', base: 0.3, dec: 1, name: () => 'Regeneration', desc: 'Heal a share of max HP each second.', text: v => `+${v}% HP per second` },
    { id: 'range',   icon: 'RNG', base: 8,   cap: 100, name: () => 'Long Reach', desc: 'Shots fly further and melee swings reach further.', text: v => `+${v}% attack range` },
    { id: 'magnet',  icon: 'MAG', base: 15,  name: () => 'Magnet',       desc: 'Pull in gold and XP from further away.', text: v => `+${v}% pickup range` },
    { id: 'xp',      icon: 'XP',  base: 6,   name: () => 'Scholar',      desc: 'Earn more XP from every kill.',        text: v => `+${v}% XP` },
    { id: 'greed',   icon: 'GLD', base: 8,   name: () => 'Greed',        desc: 'Earn more gold from every kill.',      text: v => `+${v}% gold` },
    // melee has no projectiles: for melee classes these two cards become repeat strikes and a bigger swing
    { id: 'multi',   get icon() { return ST.melee ? 'ECH' : 'x2'; }, flat: [0, 0, 1, 1, 2], minR: 2, cap: 6, name: v => ST.melee ? 'Aftershock' : SHOT_NAMES[Math.min(7, 1 + bonus('multi') + v)],
      get desc() { return ST.melee ? 'Your swing strikes again 0.05 seconds later for 60% damage.' : 'Fire more projectiles with every shot.'; }, text: v => ST.melee ? `+${v} repeat strike${v > 1 ? 's' : ''}` : `+${v} projectile${v > 1 ? 's' : ''}` },
    { id: 'pierce',  get icon() { return ST.melee ? 'SIZ' : 'PRC'; }, flat: [0, 0, 1, 1, 2], minR: 2, cap: 6, name: () => ST.melee ? "Titan's Edge" : 'Piercing',
      get desc() { return ST.melee ? 'Your swings grow longer and wider.' : 'Shots pass through extra monsters.'; }, text: v => ST.melee ? `+${v * 15}% swing size` : `+${v} pierce` },
  ];
  // ---- insane mode (a device setting, never in the daily challenge): level-up cards give double, and the % ones compound;
  // armor and regeneration stay exactly as in normal mode so nothing becomes unkillable. XP and gold are doubled too (in stats()). ----
  const INSANE_KEY = 'gravefield-insane';
  let insaneOn = false;
  try { insaneOn = localStorage.getItem(INSANE_KEY) === '1'; } catch (e) {}
  const insane = () => insaneOn && !(S && S.daily);
  const INSANE_SAME = new Set(['armor', 'regen']);
  const COMPOUND = new Set(['dmg', 'rate', 'critdmg', 'speed', 'vit', 'magnet', 'xp', 'greed', 'range']);
  const cardBase = (c, r) => c.flat ? c.flat[r] : (c.dec ? Math.round(c.base * RARITY[r].m * 10) / 10 : Math.round(c.base * RARITY[r].m));
  const cardValue = (c, r) => cardBase(c, r) * (insane() && !INSANE_SAME.has(c.id) ? 2 : 1);
  // 50, 60, 70, 80, 95, 115, 135, 160 ... grows 18% per level, rounded to 5
  const xpNeed = L => Math.round(50 * Math.pow(1.18, L - 1) / 5) * 5;

