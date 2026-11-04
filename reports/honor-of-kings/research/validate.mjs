import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = path.resolve('reports/honor-of-kings');
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
const dataJS = await fs.readFile(path.join(root, 'data.js'), 'utf8');
const appJS = await fs.readFile(path.join(root, 'app.js'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push(e.message));
const dom = new JSDOM(html, { url: 'http://localhost/reports/honor-of-kings/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window;
// Layout/native focus and Escape are verified in the browser, not emulated here.
w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
w.matchMedia = () => ({ matches: true });
w.HTMLElement.prototype.scrollIntoView = function () {};
w.eval(dataJS); w.eval(appJS);
const d = w.document;
const report = w.HOK_REPORT;
const cards = () => [...d.querySelectorAll('.hero-card')];
const change = (id, value) => { const e = d.getElementById(id); e.value = value; e.dispatchEvent(new w.Event(id === 'search' ? 'input' : 'change', { bubbles: true })); };
const reset = () => d.getElementById('reset-filters').click();
assert.equal(report.heroes.length, 132);
assert.equal(new Set(report.heroes.map(h => h.id)).size, 132);
assert.equal(report.heroes.filter(h => h.variant === '元流之子职业').length, 5);
assert.equal(report.heroes.filter(h => h.variant === '孙悟空命格').length, 1);
assert.equal(cards().length, 24);
assert.equal(d.querySelectorAll('#all-sources a').length, 132);
change('search', '元流之子'); assert.equal(cards().length, 5);
change('difficulty', '挑战'); assert.equal(cards().length, 2);
change('role', '刺客'); assert.deepEqual(cards().map(c => c.dataset.hero), ['583']);
reset(); change('search', '成吉思汗'); assert.deepEqual(cards().map(c => c.dataset.hero), ['177']);
reset(); change('search', 'LuYaNa'); assert.deepEqual(cards().map(c => c.dataset.hero), ['547']);
d.querySelector('[data-filter-lane="发育路"]').click(); assert.equal(cards().length, 1);
d.querySelector('[data-filter-lane="游走"]').click(); assert.equal(cards().length, 0); assert.equal(d.getElementById('empty-state').hidden, false);
reset(); change('search', '圣剑裁决'); assert.deepEqual(cards().map(c => c.dataset.hero), ['166']);
reset(); change('search', '<img src=x onerror=alert(1)>'); assert.equal(cards().length, 0); assert.equal(d.querySelectorAll('#hero-grid img').length, 0);
reset();
for (const lane of ['对抗路', '打野', '中路', '发育路', '游走']) {
  d.querySelector(`[data-lane-guide="${lane}"]`).click();
  assert.equal(d.querySelector('[data-route].active').dataset.route, lane);
  d.querySelector(`[data-pick-lane="${lane}"]`).click();
  while (!d.getElementById('load-more').hidden) d.getElementById('load-more').click();
  assert.deepEqual(cards().map(c => c.dataset.hero).sort(), Array.from(report.heroes.filter(h => h.lanes.includes(lane)), h => h.id).sort());
}
reset();
while (!d.getElementById('load-more').hidden) d.getElementById('load-more').click();
assert.equal(cards().length, 132);
assert.equal(new Set(cards().map(c => c.dataset.hero)).size, 132);
for (const h of report.heroes) {
  assert.ok(h.theme?.length >= 2, `${h.name}: theme`);
  for (const field of ['combo', 'early', 'team', 'buildNote', 'mistake', 'source']) assert.ok(h[field]?.length > 5, `${h.name}: ${field}`);
  assert.ok(h.mechanics.length >= 4, h.name);
  assert.ok(report.buildGuides[h.build], h.name);
  assert.ok(h.lanes.length && h.lanes.every(Boolean), h.name);
  assert.ok(h.roles.length && h.roles.every(Boolean), h.name);
  assert.ok(h.skillNames.length >= 4, h.name);
  for (const id of [...h.partners, ...h.favorable, ...h.difficult]) assert.ok(report.heroes.some(h => h.id === id));
  assert.ok((await fs.stat(path.join(root, h.avatar))).size > 200, h.name);
  d.querySelector(`.hero-card[data-hero="${h.id}"]`).click();
  assert.equal(d.getElementById('hero-dialog').open, true);
  assert.equal(d.getElementById('detail-name').textContent.replace(/[()（）\s]/g, ''), h.name.replace(/[()（）\s]/g, ''));
  assert.equal(d.querySelectorAll('.mechanic-list p').length, h.mechanics.length);
  assert.ok(d.querySelector('.skill-name-list').textContent.includes(h.skillNames[0]));
  assert.equal(d.querySelector('.detail-source').href, h.source);
  assert.equal(new URL(w.location.href).searchParams.get('hero'), h.id);
  d.querySelector('[data-close]').click();
  assert.equal(d.getElementById('hero-dialog').open, false);
  assert.equal(d.body.classList.contains('modal-open'), false);
}
for (const e of d.querySelectorAll('img[src], script[src], link[rel="stylesheet"][href]')) {
  const value = e.getAttribute('src') || e.getAttribute('href');
  assert.ok(!/^https?:/.test(value), `Runtime external dependency: ${value}`);
  await fs.access(path.join(root, value));
}
const sources = JSON.parse(await fs.readFile(path.join(root, 'research/source-manifest.json'), 'utf8'));
assert.equal(sources.sources.length, 134); assert.equal(sources.failed.length, 0);
const images = JSON.parse(await fs.readFile(path.join(root, 'research/image-sources.json'), 'utf8'));
assert.equal(images.images.length, 135); assert.equal(images.errors.length, 0);
for (const i of images.images) assert.ok((await fs.stat(path.join(root, 'assets', i.file))).size > 200);
assert.deepEqual(errors, []);
// jsdom restricts file URL query changes; the app intentionally tolerates that.
const offline = new JSDOM(html, { url: pathToFileURL(path.join(root, 'index.html')).href, runScripts: 'outside-only', virtualConsole: vc });
offline.window.eval(dataJS); offline.window.eval(appJS);
assert.equal(offline.window.document.querySelectorAll('.hero-card').length, 24);
const offlineSearch = offline.window.document.getElementById('search');
offlineSearch.value = '元流之子'; offlineSearch.dispatchEvent(new offline.window.Event('input'));
assert.equal(offline.window.document.querySelectorAll('.hero-card').length, 5);
assert.deepEqual(errors, []);
offline.window.close();
console.log(JSON.stringify({ result: 'PASS', heroDetails: 132, officialSources: 134, images: 135, laneFilters: 5, checks: ['offline file URL', 'combined filters', 'aliases and pinyin', 'skill search', 'empty state', 'all-entry pagination', 'all hero dialogs', 'source links', 'local assets', 'input escaping'] }, null, 2));
dom.window.close();
