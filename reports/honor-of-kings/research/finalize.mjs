import fs from 'node:fs/promises';
const root = 'reports/honor-of-kings';
let html = await fs.readFile(`${root}/index.html`, 'utf8');
for (const [id, label] of [['difficulty', '操作门槛'], ['role', '职业'], ['sort', '排序']]) {
  html = html.replace(`id="${id}">`, `id="${id}" aria-label="${label}">`);
}
await fs.writeFile(`${root}/index.html`, html);
let app = await fs.readFile(`${root}/app.js`, 'utf8');
const anchor = '</div></section><section class="detail-block"><h3>入门操作顺序';
const replacement = '</div><p class="skill-name-list">官网技能名称：${h.skillNames.map(esc).join(" · ")}</p></section><section class="detail-block"><h3>入门操作顺序';
if (app.includes(anchor)) app = app.replace(anchor, replacement);
await fs.writeFile(`${root}/app.js`, app);
for (const file of ['index.html', 'blog/index.html', 'ai-tutorials/index.html', 'games/index.html', 'quick-nav/index.html']) {
  const text = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, text.replace('Version 4.3.2 — 全站一致性修复', 'Version 4.4.0 — 王者荣耀全英雄研究报告').replace('Version 4.3.2', 'Version 4.4.0'));
}
const changelog = await fs.readFile('CHANGELOG.md', 'utf8');
if (!changelog.includes('## [4.4.0]')) await fs.appendFile('CHANGELOG.md', '\n\n## [4.4.0] - 2026-09-13\n\n### 新增 (Added)\n- 新增独立的王者荣耀全英雄图文研究报告，覆盖 132 个官方条目（按角色身份合并为 127 位英雄），包含五路入门、技能机制、操作顺序、发育与团战分析、出装方向和官方对抗参考。\n- 提供本地搜索、分路／职业／操作门槛组合筛选、英雄详情及深链接；官方图片与正文可离线浏览，附来源与数据差异说明。\n\n### 变更 (Changed)\n- 五个站点入口页脚版本同步为 v4.4.0；既有站点功能与导航保留。\n');
console.log('Accessible select labels, skill names and version records updated.');
