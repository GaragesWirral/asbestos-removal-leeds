// Dependency-free build: copies static site into ./dist
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const DIST = join(ROOT, 'dist');

function safeDeleteDist(target) {
  const resolvedRoot = resolve(ROOT);
  const resolvedDist = resolve(target);
  if (resolvedDist === resolvedRoot) throw new Error('refusing to delete the project root');
  if (dirname(resolvedDist) !== resolvedRoot) throw new Error('dist must sit directly inside the project root');
  if (basename(resolvedDist) !== 'dist') throw new Error('refusing to delete anything other than dist');
  try {
    const st = lstatSync(resolvedDist);
    if (st.isSymbolicLink()) throw new Error('refusing to delete a symlinked dist');
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

safeDeleteDist(DIST);
if (existsSync(DIST)) {
  const st = lstatSync(DIST);
  if (st.isSymbolicLink()) throw new Error('refusing to delete a symlinked dist');
  rmSync(DIST, { recursive: true, force: true });
}
mkdirSync(DIST, { recursive: true });

const copy = (name) => {
  const src = join(ROOT, name);
  if (!existsSync(src)) return;
  cpSync(src, join(DIST, name), {
    recursive: true,
    filter: (path) => !lstatSync(path).isSymbolicLink()
  });
};

// Copy all root .html
for (const f of readdirSync(ROOT)) {
  if (f.endsWith('.html')) copy(f);
}
// Copy required static assets
for (const f of ['robots.txt', 'sitemap.xml', 'assets', 'images']) {
  copy(f);
}

// Copy future root image assets generically (approved extensions only; skip symlinks)
const OK_EXT = new Set(['.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.avif']);
for (const f of readdirSync(ROOT)) {
  const ext = f.slice(f.lastIndexOf('.')).toLowerCase();
  if (!OK_EXT.has(ext)) continue;
  const src = join(ROOT, f);
  try {
    if (lstatSync(src).isSymbolicLink()) continue;
  } catch { continue; }
  copy(f);
}

console.log('build: dist ready');
