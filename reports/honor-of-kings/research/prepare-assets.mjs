import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('reports/honor-of-kings');
const { yxlb20_2489: roster } = JSON.parse(await fs.readFile('.cache/hok-research/roster.json', 'utf8'));
await fs.mkdir(path.join(root, 'assets'), { recursive: true });
const tasks = roster.map(h => ({ id: h.yxid_a7, file: `${h.yxid_a7}.jpg`, original: h.yxtxlb_8443, url: h.yxtxlb_8443 + '?imageMogr2/thumbnail/320x320' }));
for (const id of ['547', '531', '166']) {
  const h = roster.find(h => h.yxid_a7 === id);
  tasks.push({ id, file: `${id}-cover.jpg`, original: h.fmlb_4536, url: h.fmlb_4536 + '?imageMogr2/thumbnail/1600x' });
}
const queue = [...tasks];
const errors = [];
await Promise.all(Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const task = queue.shift();
    try {
      const res = await fetch(task.url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) throw new Error(`HTTP ${res.status} ${res.headers.get('content-type')}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length < 200) throw new Error('Unexpected empty image');
      await fs.writeFile(path.join(root, 'assets', task.file), bytes);
      task.bytes = bytes.length;
    } catch (e) { errors.push({ ...task, error: e.message }); }
  }
}));
await fs.writeFile(path.join(root, 'research', 'image-sources.json'), JSON.stringify({ credit: '腾讯游戏 / 王者荣耀官方美术。仅用于英雄介绍与研究说明，权利归原权利人。', images: tasks, errors }, null, 2));
console.log(JSON.stringify({ images: tasks.length, bytes: tasks.reduce((s, t) => s + (t.bytes || 0), 0), errors }, null, 2));
if (errors.length) process.exitCode = 1;
