// Public, read-only official sources. Run from the repository root.
// Raw responses stay in .cache/hok-research; report prose is maintained separately.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const cache = path.resolve('.cache/hok-research');
await fs.mkdir(cache, { recursive: true });
const sources = [];
async function get(url, file) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const body = await response.text();
  const data = JSON.parse(body);
  await fs.writeFile(path.join(cache, file), body);
  sources.push({ url, retrievedAt: new Date().toISOString(), sha256: crypto.createHash('sha256').update(body).digest('hex') });
  return data;
}
const roster = await get('https://pvp.qq.com/zlkdatasys/heroskinlist.json', 'roster.json');
const legacy = await get('https://pvp.qq.com/web201605/js/herolist.json', 'legacy.json');
const heroes = roster.yxlb20_2489;
const queue = [...heroes];
const details = [];
const failed = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const h = queue.shift();
    const id = h.yxid_a7;
    try {
      const d = await get(`https://pvp.qq.com/zlkdatasys/zsbd_herolist/${id}.json`, `${id}.json`);
      details.push(d);
    } catch (e) { failed.push({ id, name: h.yxmclb_9965, error: e.message }); }
  }
}));
await fs.writeFile(path.join(cache, 'details.json'), JSON.stringify(details, null, 2));
await fs.writeFile(path.join(cache, 'manifest.json'), JSON.stringify({ sources, failed }, null, 2));
console.log(JSON.stringify({ officialEntries: heroes.length, legacyEntries: legacy.length, details: details.length, failed, onlyCurrent: heroes.filter(h => !legacy.some(l => String(l.ename) === h.yxid_a7)).map(h => h.yxmclb_9965), onlyLegacy: legacy.filter(l => !heroes.some(h => h.yxid_a7 === String(l.ename))).map(l => l.cname) }, null, 2));
