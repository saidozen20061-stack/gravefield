  // ================= Ascension: a constellation of permanent nodes, 1 point for every 5 stages ever reached =================
  // a node can only be lit from a lit neighbour nearer the core; none of it resets when you die
  const ASC_BRANCHES = [
    { id: 'wrath', name: 'Wrath', a: -90, n: [
      ['Spark of Rage', { dmg: 4 }, 3], ['Cruel Intent', { dmg: 5 }, 3],
      ['Rending Edge', { critdmg: 10 }, 2], ['Red Hunger', { leech: 0.3 }, 2],
      ['Butcher', { dmg: 8 }, 2], ['Feast', { leech: 0.4, hp: 5 }, 2],
      ['Annihilation', { dmg: 25, critdmg: 25 }, 1]] },
    { id: 'swift', name: 'Celerity', a: -30, n: [
      ['Quickened Pulse', { rate: 4 }, 3], ['Light Step', { speed: 3 }, 3],
      ['Flicker', { rate: 6 }, 2], ['Tailwind', { speed: 4 }, 2],
      ['Hailstorm', { range: 12, rate: 4 }, 2], ['Slipstream', { cdr: 6 }, 2],
      ['Quicksilver', { rate: 15, speed: 8 }, 1]] },
    { id: 'fortune', name: 'Fortune', a: 30, n: [
      ['Glint', { gold: 8 }, 3], ['Insight', { xp: 8 }, 3],
      ['Lodestone', { magnet: 20 }, 2], ['Tithe', { gold: 12 }, 2],
      ['Old Knowledge', { xp: 12 }, 2], ['Hoard', { gold: 15 }, 2],
      ['Midas Throne', { gold: 40, xp: 25 }, 1]] },
    { id: 'bulwark', name: 'Bulwark', a: 90, n: [
      ['Stone Heart', { hp: 5 }, 3], ['Iron Veil', { armor: 8 }, 3],
      ['Mending', { regen: 0.15 }, 2], ['Bastion', { armor: 12 }, 2],
      ['Vigil', { hp: 8 }, 2], ['Deep Roots', { regen: 0.2, hp: 4 }, 2],
      ['Undying', { undying: 1 }, 1]] },
    { id: 'hex', name: 'Hex', a: 150, n: [
      ['Evil Eye', { crit: 2 }, 3], ['Malice', { critdmg: 8 }, 3],
      ['Omen', { crit: 3 }, 2], ['Piercing Gaze', { pierce: 1 }, 1],
      ['Curse', { critdmg: 15 }, 2], ['Wither', { dmg: 6 }, 2],
      ['Doom', { crit: 8, critdmg: 40 }, 1]] },
    { id: 'echo', name: 'Echo', a: 210, n: [
      ['Whisper', { cdr: 4 }, 3], ['Kindred', { minion: 8, dmg: 2 }, 3],
      ['Reverb', { cdr: 6 }, 2], ['Choir', { minion: 12, hp: 3 }, 2],
      ['Ripple', { dmg: 5, rate: 5 }, 2], ['Host', { minion: 15, armor: 6 }, 2],
      ['Resonance', { cdr: 15, dmg: 10 }, 1]] },
  ];
  // the threads that cross between neighbouring branches: lit from either side
  const ASC_BRIDGES = [['Frenzied Thread', { dmg: 3, rate: 3 }], ['Quick Hands', { speed: 2, magnet: 10 }], ['Gilded Skin', { armor: 5, gold: 5 }],
    ['Blood Ward', { hp: 4, crit: 1 }], ['Dark Litany', { critdmg: 6, cdr: 3 }], ['Vengeance', { dmg: 4, cdr: 3 }]];
  const ascPol = (a, r) => ({ x: Math.cos(a * Math.PI / 180) * r, y: Math.sin(a * Math.PI / 180) * r });
  // per branch: [angle offset, ring] and which earlier nodes light it
  const ASC_POS = [[0, 1.15], [0, 2.2], [-11, 3.25], [11, 3.25], [-15, 4.3], [15, 4.3], [0, 5.45]];
  const ASC_REQ = [['core'], [0], [1], [1], [2], [3], [4, 5]];
  const ASC = [{ id: 'core', br: -1, name: 'The Waking Eye', fx: { dmg: 3, hp: 3 }, max: 1, cost: 1, x: 0, y: 0, req: [], core: true }];
  ASC_BRANCHES.forEach((b, bi) => b.n.forEach(([name, fx, max], i) => ASC.push({ id: b.id + i, br: bi, name, fx, max, cost: i === 6 ? 3 : 1, key: i === 6,
    ...ascPol(b.a + ASC_POS[i][0], ASC_POS[i][1]), req: ASC_REQ[i].map(r => r === 'core' ? r : b.id + r) })));
  ASC_BRIDGES.forEach(([name, fx], i) => {
    const a = ASC_BRANCHES[i], c = ASC_BRANCHES[(i + 1) % 6];
    ASC.push({ id: 'bridge' + i, br: i, name, fx, max: 2, cost: 1, bridge: true, ...ascPol(a.a + 30, 4.75), req: [a.id + 5, c.id + 4] });
  });
  const ASC_BY = Object.fromEntries(ASC.map(n => [n.id, n]));
  const ascRank = id => (S && S.asc && S.asc[id]) || 0;
  const ascPts = () => S && !S.daily ? Math.floor(bestOf(S) / 5) : 0;
  const ascSpent = () => ASC.reduce((a, n) => a + ascRank(n.id) * n.cost, 0);
  const ascOpen = n => !n.req.length || n.req.some(r => ascRank(r) > 0);
  function ascFx() {
    const o = {};
    if (!S || S.daily) return o;
    for (const n of ASC) { const r = ascRank(n.id); if (r) for (const k in n.fx) o[k] = (o[k] || 0) + n.fx[k] * r; }
    return o;
  }
  // balance panel multipliers: only while admin tools are on
  const BAL_KEY = 'gravefield-balance';
  const BAL_DEF = { hp: 1, dmg: 1, boss: 1, spawn: 1, elite: 1, gold: 1, xp: 1 };
  const BAL = Object.assign({}, BAL_DEF);
  try { Object.assign(BAL, JSON.parse(localStorage.getItem(BAL_KEY)) || {}); } catch (e) {}
  const bal = k => (adminOn ? BAL[k] : 1);
  let ST;
  const dmod = id => !!(S && S.dmods && S.dmods.includes(id));

