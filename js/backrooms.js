  // ================= The Grinner: the Backrooms' only inhabitant =================
  // It turns up somewhere in the dark, far from you, and comes for you along the corridors (a path through the maze,
  // recomputed from where you are), always 2 px/s faster than you can currently run. Killing it clears the stage.
  const GRID_STEP = 16;
  const BEAM_LEN = 160, BEAM_HALF = 0.4; // the flashlight cone: reach and half-angle
  // an uneven, limping cadence for the Backrooms' things: strides hurry, then drag
  const lurch = m => 0.45 + Math.abs(Math.sin(m.t * 3.1)) * 1.2;
  // is this monster caught in your flashlight beam? (the faint glow around you doesn't count: only the beam scares them)
  function inBeam(m) {
    const lx = m.x - P.x, ly = m.y - m.hh / 2 - (P.y - 9), ld = Math.hypot(lx, ly);
    let da = Math.atan2(ly, lx) - P.aim; da = Math.atan2(Math.sin(da), Math.cos(da));
    return ld > 6 && ld < BEAM_LEN + 10 && Math.abs(da) < BEAM_HALF + Math.min(0.5, 8 / ld); // a little wider up close, where the body fills the cone
  }
  let mazeGrid = null; // { cols, rows, open: Uint8Array } for the Backrooms
  function buildMazeGrid() {
    const cols = Math.ceil(WORLD.w / GRID_STEP), rows = Math.ceil(WORLD.h / GRID_STEP), open = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wx = x * GRID_STEP + 8, wy = y * GRID_STEP + 8;
      open[y * cols + x] = wx > WORLD.x0 && wx < WORLD.x1 && wy > WORLD.y0 && wy < WORLD.y1 && !blockedAt(wx, wy) && !inBackroomWall(wx, wy - 8) ? 1 : 0;
    }
    mazeGrid = { cols, rows, open, dist: new Int32Array(cols * rows), at: -1 };
  }
  // distance (in grid steps) from every open cell to you, refreshed a few times a second
  function mazeDistances() {
    const M = mazeGrid, { cols, rows, open, dist } = M, cell = (Math.floor(P.y / GRID_STEP)) * cols + Math.floor(P.x / GRID_STEP);
    if (M.at === cell && G.t - (M.t || 0) < 0.4) return;
    M.at = cell; M.t = G.t; dist.fill(-1);
    const q = new Int32Array(cols * rows); let h = 0, tl = 0;
    if (cell < 0 || cell >= dist.length) return;
    dist[cell] = 0; q[tl++] = cell;
    while (h < tl) {
      const c = q[h++], cx = c % cols, cy = (c / cols) | 0, d = dist[c] + 1;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = ny * cols + nx; if (dist[n] !== -1 || !open[n]) continue;
        dist[n] = d; q[tl++] = n;
      }
    }
  }
  function grinnerSpawn(dt) {
    if (G.dead > 0 || G.monsters.some(m => m.d.grinner && !m.dead)) return;
    G.grinnerT = (G.grinnerT == null ? 3 : G.grinnerT) - dt;
    if (G.grinnerT > 0) return;
    if (!mazeGrid || mazeGrid.cols !== Math.ceil(WORLD.w / GRID_STEP)) buildMazeGrid();
    mazeDistances();
    // somewhere random in the dark, well away from you, with a way through to you
    for (let i = 0; i < 60; i++) {
      const x = rand(WORLD.x0 + 30, WORLD.x1 - 30), y = rand(WORLD.y0 + 40, WORLD.y1 - 20);
      if (Math.hypot(x - P.x, y - P.y) < 380 || blockedAt(x, y) || inBackroomWall(x, y - 8)) continue;
      if (mazeGrid.dist[Math.floor(y / GRID_STEP) * mazeGrid.cols + Math.floor(x / GRID_STEP)] < 0) continue;
      const m = spawnMonster(false, { type: 'grinner', at: { x, y } });
      m.scale = 1; m.r = m.d.spr.w * 0.34; m.hh = m.d.spr.h / 2; m.ab.mighty = true; m.rise = 0.8; // its own size, and it can't be knocked back
      G.grinnerT = 6;
      banner('Something is here.', 'It is always a little faster than you. Fight it, or keep moving.', true);
      if (AC && AMB.out) ambThud(AC.currentTime + 0.05);
      return;
    }
  }
  function grinnerMove(m, dt, alive) {
    if (!mazeGrid || mazeGrid.cols !== Math.ceil(WORLD.w / GRID_STEP)) buildMazeGrid();
    mazeDistances();
    const M = mazeGrid, { cols, dist } = M, cx = Math.floor(m.x / GRID_STEP), cy = Math.floor(m.y / GRID_STEP);
    // it hates the light: caught in your flashlight beam, it turns and runs for 5 seconds
    if (alive && m.rise <= 0 && !(m.fleeT > 0) && inBeam(m)) {
      m.fleeT = 5; m.wind = 0;
      if (AC && AMB.out) ambThud(AC.currentTime + 0.02);
    }
    if (m.fleeT > 0) m.fleeT -= dt;
    const fleeing = m.fleeT > 0;
    // head for the neighbouring cell that is closest to you (or, fleeing, furthest away); straight at you once it's in the same room, or if lost
    let tx = P.x, ty = P.y;
    const here = dist[cy * cols + cx];
    if (fleeing && here >= 0) {
      let best = here, bx = cx, by = cy;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = cx + ox, ny = cy + oy, dd = dist[ny * cols + nx];
        if (dd >= 0 && dd > best && (ox === 0 || oy === 0 || (dist[cy * cols + nx] >= 0 && dist[ny * cols + cx] >= 0))) { best = dd; bx = nx; by = ny; }
      }
      tx = bx * GRID_STEP + 8; ty = by * GRID_STEP + 8;
      if (bx === cx && by === cy) { tx = m.x; ty = m.y; } // cornered in a dead end: it just cowers there
    } else if (here > 2) {
      let best = here, bx = cx, by = cy;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = cx + ox, ny = cy + oy, dd = dist[ny * cols + nx];
        if (dd >= 0 && dd < best && (ox === 0 || oy === 0 || (dist[cy * cols + nx] >= 0 && dist[ny * cols + cx] >= 0))) { best = dd; bx = nx; by = ny; }
      }
      tx = bx * GRID_STEP + 8; ty = by * GRID_STEP + 8;
    } else if (here < 0) {
      // squeezed against a wall (or somehow cut off): step back onto the nearest cell that leads to you
      let best = -1, bx = cx, by = cy, bd = 1e9;
      for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) {
        const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= cols || ny >= M.rows) continue;
        const dd = dist[ny * cols + nx], k = ox * ox + oy * oy;
        if (dd >= 0 && k < bd) { bd = k; best = dd; bx = nx; by = ny; }
      }
      if (best >= 0) { tx = bx * GRID_STEP + 8; ty = by * GRID_STEP + 8; }
      else if ((m.lostT = (m.lostT || 0) + dt) > 1.5) { // truly sealed in: it slips out somewhere else in the dark
        m.lostT = 0;
        for (let i = 0; i < 80; i++) {
          const k = Math.random() * dist.length | 0, x = (k % cols) * GRID_STEP + 8, y = ((k / cols) | 0) * GRID_STEP + 8;
          if (dist[k] >= 0 && Math.hypot(x - P.x, y - P.y) > 380) { m.x = x; m.y = y; break; }
        }
      }
    }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1, pd = Math.hypot(P.x - m.x, P.y - m.y);
    const spd = (ST.speed + 2) * (m.slowT > 0 ? 0.6 : 1) * (alive ? 1 : 0);
    if (fleeing) {
      if (Math.abs(dx) > 1) m.face = dx > 0 ? 1 : -1;
      const step = Math.min(spd * dt, d);
      if (d > 0.5) { m.x += dx / d * step; m.y += dy / d * step; pushOut(m, m.r * 0.5); }
      m.ph += dt * spd / 6 * lurch(m);
      return;
    }
    if (Math.abs(P.x - m.x) > 2) m.face = P.x > m.x ? 1 : -1;
    if (m.wind > 0) {
      m.wind -= dt;
      if (m.wind <= 0) { m.atkT = 0.25; m.cd = 0.8; if (alive && pd < m.r + 13) { hurtPlayer(m.dmg, m, 140); grinnerScream(); G.shake = Math.max(G.shake, 0.35); } }
    } else if (pd > m.r + 6) { // stops at arm's reach instead of walking into you
      const step = Math.min(spd * dt, d);
      m.x += dx / d * step; m.y += dy / d * step;
      pushOut(m, m.r * 0.5);
    }
    m.ph += dt * spd / 6 * lurch(m);
    if (alive && pd < m.r + 9 && m.cd <= 0 && m.wind <= 0) m.wind = 0.18;
  }

  // ================= The Crawlers: the Grinner's kin, on all fours =================
  // Get a little way inside their sight and they shriek and sprint at you, twice as fast as you can run. Catch one in
  // your flashlight and it hisses, bolts away, and turns up somewhere else in the dark.
  // The Hollow wanders from room to room at random; the Stalker creeps after you, freezing now and then to listen.
  const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  // distance (in grid steps) from one point to every open cell: for walking somewhere that isn't you
  function mazeField(x, y) {
    const { cols, rows, open } = mazeGrid, f = new Int32Array(cols * rows).fill(-1), q = new Int32Array(cols * rows);
    const c0 = Math.floor(y / GRID_STEP) * cols + Math.floor(x / GRID_STEP);
    if (c0 < 0 || c0 >= f.length || !open[c0]) return null;
    let h = 0, tl = 0; f[c0] = 0; q[tl++] = c0;
    while (h < tl) {
      const c = q[h++], cx = c % cols, cy = (c / cols) | 0, d = f[c] + 1;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = ny * cols + nx; if (f[n] !== -1 || !open[n]) continue;
        f[n] = d; q[tl++] = n;
      }
    }
    return f;
  }
  // the next cell to head for along a distance field: downhill toward its source, or uphill (away) when fleeing
  function fieldStep(m, f, away) {
    const { cols, rows } = mazeGrid, cx = Math.floor(m.x / GRID_STEP), cy = Math.floor(m.y / GRID_STEP), here = f[cy * cols + cx];
    if (here < 0) { // pressed into a wall: step back onto the nearest open cell
      let bd = 1e9, b = null;
      for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
        const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const k = ox * ox + oy * oy; if (f[ny * cols + nx] >= 0 && k < bd) { bd = k; b = { x: nx * GRID_STEP + 8, y: ny * GRID_STEP + 8, d: f[ny * cols + nx] }; }
      }
      return b;
    }
    let best = here, bx = cx, by = cy;
    for (const [ox, oy] of DIRS8) {
      const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const dd = f[ny * cols + nx];
      if (dd >= 0 && (away ? dd > best : dd < best) && (ox === 0 || oy === 0 || (f[cy * cols + nx] >= 0 && f[ny * cols + cx] >= 0))) { best = dd; bx = nx; by = ny; }
    }
    return { x: bx * GRID_STEP + 8, y: by * GRID_STEP + 8, d: best };
  }
  // a random open cell you can reach, at least minD away from you
  function farCell(minD) {
    const { cols, dist } = mazeGrid;
    for (let i = 0; i < 150; i++) {
      const k = Math.random() * dist.length | 0, x = (k % cols) * GRID_STEP + 8, y = ((k / cols) | 0) * GRID_STEP + 8;
      if (dist[k] >= 0 && Math.hypot(x - P.x, y - P.y) > minD) return { x, y };
    }
    return null;
  }
  function crawlerSpawn(dt) {
    if (G.dead > 0) return;
    G.crawlT = G.crawlT || { hollow: 10, stalker: 18 }; // the first ones take a little while to find you
    for (const kind of ['hollow', 'stalker']) {
      if (G.monsters.some(m => m.d.crawler === kind && !m.dead)) continue;
      if ((G.crawlT[kind] -= dt) > 0) continue;
      if (!mazeGrid || mazeGrid.cols !== Math.ceil(WORLD.w / GRID_STEP)) buildMazeGrid();
      mazeDistances();
      const at = farCell(450); if (!at) continue;
      const m = spawnMonster(false, { type: kind, at });
      m.scale = 1; m.r = m.d.spr.w * 0.22; m.hh = m.d.spr.h / 2; m.ab.mighty = true; m.rise = 0.5;
      m.st = kind === 'hollow' ? 'roam' : 'stalk'; m.stT = 0; m.calm = 2;
      G.crawlT[kind] = 14;
    }
  }
  function crawlerMove(m, dt, alive) {
    if (!mazeGrid || mazeGrid.cols !== Math.ceil(WORLD.w / GRID_STEP)) buildMazeGrid();
    mazeDistances();
    const M = mazeGrid, pd = Math.hypot(P.x - m.x, P.y - m.y), run = ST.speed * 2;
    const sight = Math.min(cv.width, cv.height) / 2 / G.zoom * 0.85; // a little way inside the edge of your screen
    const rest = m.d.crawler === 'hollow' ? 'roam' : 'stalk';
    m.calm = Math.max(0, (m.calm || 0) - dt); m.stT -= dt;
    // the light: it recoils with a hiss and bolts the other way
    if (alive && m.st !== 'flee' && inBeam(m)) { m.st = 'flee'; m.stT = 2.5; m.wind = 0; crawlerHiss(m); }
    let tgt = null, spd = 0;
    if (m.st === 'flee') {
      tgt = fieldStep(m, M.dist, true); spd = run;
      if (m.stT <= 0) {
        // gone: once you can't see it, it turns up somewhere else in the dark, well away from you
        const at = pd > sight && farCell(Math.max(450, sight + 120));
        if (at) { m.x = at.x; m.y = at.y; }
        m.st = rest; m.calm = 4; m.goal = null; m.stT = 0;
      }
    } else if (m.st === 'hunt') {
      if (!alive || pd > sight * 2.2) { m.st = rest; m.calm = 2; }
      else {
        tgt = pd < 40 ? { x: P.x, y: P.y } : fieldStep(m, M.dist, false); spd = run;
        if (m.wind > 0) {
          m.wind -= dt;
          if (m.wind <= 0) { m.atkT = 0.25; m.cd = 0.7; if (pd < m.r + 14) { hurtPlayer(m.dmg, m, 160); G.shake = Math.max(G.shake, 0.3); } }
          return;
        }
        if (pd < m.r + 10 && m.cd <= 0) { m.wind = 0.15; return; }
        if (pd < m.r + 6) return; // at arm's reach
      }
    } else {
      const here = M.dist[Math.floor(m.y / GRID_STEP) * M.cols + Math.floor(m.x / GRID_STEP)];
      if (alive && m.calm <= 0 && pd < sight && here >= 0) {
        m.st = 'hunt'; m.still = false; crawlerShriek(m); G.shake = Math.max(G.shake, 0.2);
      } else if (m.st === 'roam') {
        // the Hollow drifts from room to room
        if (!m.goal && m.stT <= 0) {
          const at = farCell(0), f = at && mazeField(at.x, at.y);
          if (f) { m.goal = f; m.stT = 15; } else m.stT = 0.5;
        }
        if (m.goal) {
          tgt = fieldStep(m, m.goal, false); spd = ST.speed * 0.55;
          if (!tgt || tgt.d <= 1 || m.stT <= 0) { m.goal = null; m.stT = rand(0.5, 2); } // arrived: stands a moment, then moves on
        }
      } else {
        // the Stalker creeps toward you, freezing now and then to listen
        if (m.stT <= 0) { m.still = !m.still && Math.random() < 0.45; m.stT = m.still ? rand(1, 2.5) : rand(2, 4); }
        if (!m.still) { tgt = fieldStep(m, M.dist, false); spd = ST.speed * 0.45; }
      }
    }
    if (!tgt) return;
    const dx = tgt.x - m.x, dy = tgt.y - m.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 1) m.face = dx > 0 ? 1 : -1;
    if (d > 0.5) {
      const step = Math.min(spd * (m.slowT > 0 ? 0.6 : 1) * dt, d);
      m.x += dx / d * step; m.y += dy / d * step; pushOut(m, m.r * 0.5);
      m.ph += dt * spd / 5 * lurch(m);
    }
  }
