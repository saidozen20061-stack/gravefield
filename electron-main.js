// Desktop wrapper: shows the update screen, fetches any changed game files, then opens the game in its own window.
const { app, BrowserWindow, Menu, net, shell } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const UPDATE_URL = (!app.isPackaged && process.env.GRAVEFIELD_UPDATE_URL) || 'https://saidozen20061-stack.github.io/gravefield/';
const readManifest = dir => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); } catch (e) { return null; } };

// the newer of the copy inside the app and the last downloaded update
function currentGame() {
  const bundled = { dir: __dirname, manifest: readManifest(__dirname) };
  const dir = path.join(app.getPath('userData'), 'game'), manifest = readManifest(dir);
  return manifest && (!bundled.manifest || manifest.version > bundled.manifest.version) ? { dir, manifest } : bundled;
}

async function fetchOk(url, ms) {
  const res = await net.fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

// downloads the update into a side folder and only swaps it in once every file has checked out
async function update(cur, send) {
  const remote = await (await fetchOk(UPDATE_URL + 'manifest.json?t=' + Date.now(), 5000)).json();
  if (!(remote.version > (cur.manifest ? cur.manifest.version : 0))) return cur;
  for (const f of remote.files) if (!/^[\w-]+(\/[\w.-]+)*(\.\w+)?$/.test(f.path) || f.path.includes('..')) throw new Error('bad path ' + f.path);
  const have = new Map((cur.manifest ? cur.manifest.files : []).map(f => [f.path, f.sha256]));
  const changed = remote.files.filter(f => have.get(f.path) !== f.sha256);
  const total = changed.reduce((n, f) => n + f.size, 0);
  let done = 0;
  const tmp = path.join(app.getPath('userData'), 'game-new'), final = path.join(app.getPath('userData'), 'game');
  fs.rmSync(tmp, { recursive: true, force: true });
  send({ done, total });
  for (const f of remote.files) {
    const dest = path.join(tmp, f.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    let data;
    if (have.get(f.path) === f.sha256) data = fs.readFileSync(path.join(cur.dir, f.path));
    else {
      const reader = (await fetchOk(UPDATE_URL + f.path + '?v=' + f.sha256.slice(0, 12), 30000)).body.getReader(), parts = [];
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        parts.push(Buffer.from(value)); done += value.length;
        send({ done, total });
      }
      data = Buffer.concat(parts);
    }
    if (crypto.createHash('sha256').update(data).digest('hex') !== f.sha256) throw new Error('corrupt download ' + f.path);
    fs.writeFileSync(dest, data);
  }
  fs.writeFileSync(path.join(tmp, 'manifest.json'), JSON.stringify(remote));
  fs.rmSync(final, { recursive: true, force: true });
  fs.renameSync(tmp, final);
  return { dir: final, manifest: remote };
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1d2b12',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'electron-preload.js') },
  });
  Menu.setApplicationMenu(null);
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    }
  });
  // links out of the game open in the normal browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  await win.loadFile(path.join(__dirname, 'updater.html'));
  let game = currentGame();
  try {
    game = await update(game, p => { if (!win.isDestroyed()) win.webContents.send('progress', p); });
  } catch (e) {
    // offline or a failed download: play the copy we already have
    console.error('update skipped:', e.message);
  }
  if (!win.isDestroyed()) win.loadFile(path.join(game.dir, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
