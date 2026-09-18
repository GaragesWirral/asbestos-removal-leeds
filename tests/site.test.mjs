import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('sitemap covers all retained root HTML pages', () => {
  const sm = read('sitemap.xml');
  const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  const excluded = new Set([
    'asbestos-removal-companies-leeds-west-yorkshire.html',
    'asbestos-removal-contractors-leeds-west-yorkshire.html'
  ]);
  for (const p of pages) {
    if (excluded.has(p)) {
      assert.ok(!sm.includes('/' + p), `sitemap must exclude ${p}`);
    } else if (p === 'index.html') {
      assert.ok(sm.includes('<loc>https://asbestosremoval-leeds.co.uk/</loc>'), 'sitemap must include home /');
    } else {
      assert.ok(sm.includes('/' + p), `sitemap must include ${p}`);
    }
  }
});

test('vercel.json contains 301 redirects for retired URLs and preserves www redirect', () => {
  const vc = JSON.parse(read('vercel.json'));
  const r = vc.redirects || [];
  const has = (src) => r.some((x) => x.source === src && x.statusCode === 301);
  assert.ok(has('/asbestos-removal-companies-leeds-west-yorkshire.html'));
  assert.ok(has('/asbestos-removal-companies-leeds-west-yorkshire'));
  assert.ok(has('/asbestos-removal-contractors-leeds-west-yorkshire.html'));
  assert.ok(has('/asbestos-removal-contractors-leeds-west-yorkshire'));
  assert.ok(r.some((x) => x.has && x.has.some((h) => h.value === 'www.asbestosremoval-leeds.co.uk') && x.permanent === true));
  assert.equal(vc.buildCommand, 'npm run build');
  assert.equal(vc.outputDirectory, 'dist');
});

test('no internal hrefs point at retired pages', () => {
  const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  const retired = [
    'asbestos-removal-companies-leeds-west-yorkshire.html',
    'asbestos-removal-contractors-leeds-west-yorkshire.html'
  ];
  for (const p of pages) {
    const body = read(p);
    for (const r of retired) {
      const pat = new RegExp(`href=["'][^"']*${r.replace('.', '\\.')}`, 'g');
      const m = body.match(pat) || [];
      // Retired pages themselves may reference each other via canonical — but that is canonical/JSON-LD not an a href.
      assert.equal(m.length, 0, `unexpected href to ${r} in ${p}`);
    }
  }
});

test('every Formspree form has visible labels for name/phone/email', () => {
  const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  const withForms = pages.filter((p) => read(p).includes('formspree.io/f/xgolnbdl'));
  assert.ok(withForms.length > 0, 'expected at least one page with a Formspree form');
  for (const p of withForms) {
    const body = read(p);
    assert.ok(/<label for="field-name"/.test(body), `${p} missing label for name`);
    assert.ok(/<label for="field-phone"/.test(body), `${p} missing label for phone`);
    assert.ok(/<label for="field-email"/.test(body), `${p} missing label for email`);
    assert.ok(/autocomplete="name"/.test(body), `${p} missing autocomplete name`);
    assert.ok(/autocomplete="tel"/.test(body), `${p} missing autocomplete tel`);
    assert.ok(/autocomplete="email"/.test(body), `${p} missing autocomplete email`);
  }
});

test('shared navigation assets exist and are referenced on every page', () => {
  assert.ok(existsSync(join(ROOT, 'assets', 'navigation.js')));
  assert.ok(existsSync(join(ROOT, 'assets', 'site-fixes.css')));
  const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  for (const p of pages) {
    const body = read(p);
    assert.ok(body.includes('assets/navigation.js'), `${p} missing shared nav script`);
    assert.ok(body.includes('assets/site-fixes.css'), `${p} missing shared css`);
  }
});

test('mobile toggle is a real button with aria attributes', () => {
  const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  for (const p of pages) {
    const body = read(p);
    assert.ok(/<button[^>]*class="[^"]*mobile-toggle[^"]*"[^>]*type="button"/.test(body) ||
              /<button[^>]*type="button"[^>]*class="[^"]*mobile-toggle/.test(body),
              `${p} mobile toggle not a type=button`);
    assert.ok(/aria-controls="nav-links"/.test(body), `${p} missing aria-controls`);
    assert.ok(/aria-expanded="false"/.test(body), `${p} missing aria-expanded`);
  }
});
