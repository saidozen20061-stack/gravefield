// Lists the game's files with their hashes in manifest.json; the desktop app reads it to see what changed.
// Run before pushing an update: node make-manifest.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const files = ['index.html', 'style.css', ...fs.readdirSync(path.join(__dirname, 'js')).map(f => 'js/' + f)].map(p => {
  const data = fs.readFileSync(path.join(__dirname, p));
  return { path: p, size: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') };
});
const out = path.join(__dirname, 'manifest.json');
let old = null;
try { old = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (e) {}
const same = old && JSON.stringify(old.files) === JSON.stringify(files);
fs.writeFileSync(out, JSON.stringify({ version: same ? old.version : Date.now(), files }, null, 1) + '\n');
console.log(same ? 'manifest unchanged' : 'manifest updated', files.length, 'files');
