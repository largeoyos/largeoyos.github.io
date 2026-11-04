import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(project, '../..');
const output = resolve(process.argv[2] || resolve(project, 'public'));
const manifest = JSON.parse(readFileSync(resolve(project, 'generated-site/manifest.json'), 'utf8'));
const failures = [];
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 16);
for (const page of manifest.pages) {
  const destination = resolve(output, page.url === '/' ? 'index.html' : page.url.slice(1));
  if (!existsSync(destination)) { failures.push(`Missing page: ${page.url}`); continue; }
  const rendered = readFileSync(destination, 'utf8');
  if (!rendered.includes('data-stack-app') || !rendered.includes('stack-site/interface.css')) failures.push(`Missing Stack interface: ${page.url}`);
  if (/<nav\b[^>]*class=["'][^"']*global-nav/.test(rendered)) failures.push(`Old navigation: ${page.url}`);
  const generated = readFileSync(resolve(project, page.url === '/' ? 'generated-site/content/_index.html' : `generated-site/content/site/${hash(page.url)}.html`), 'utf8');
  const content = generated.slice(generated.indexOf('\n\n') + 2).trim();
  if (!rendered.includes(content)) failures.push(`Changed application body: ${page.url}`);
}
function walk(path) { return readdirSync(path, { withFileTypes: true }).flatMap(entry => { const full = resolve(path, entry.name); return entry.isDirectory() ? walk(full) : [full]; }); }
let pdfs = 0;
for (const source of walk(resolve(repository, 'tutorials')).filter(path => extname(path).toLowerCase() === '.pdf')) {
  const destination = resolve(output, relative(repository, source));
  if (!existsSync(destination) || !readFileSync(source).equals(readFileSync(destination))) failures.push(`Changed or missing PDF: ${relative(repository, source)}`);
  pdfs++;
}
let preservedResources = 0;
for (const directory of ['blog', 'ai-tutorials', 'tutorials', 'games', 'tools', 'markets', 'quant-lab', 'quick-nav']) {
  for (const source of walk(resolve(repository, directory))) {
    if (!['.md', '.json', '.pdf', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.zip', '.woff', '.woff2', '.ttf', '.csv', '.ipynb'].includes(extname(source).toLowerCase())) continue;
    const destination = resolve(output, relative(repository, source));
    if (!existsSync(destination) || !readFileSync(source).equals(readFileSync(destination))) failures.push(`Changed or missing resource: ${relative(repository, source)}`);
    preservedResources++;
  }
}
const home = readFileSync(resolve(output, 'index.html'), 'utf8');
for (const expected of ['🏠 工作主页', '📝 博客大厅', '📚 AI 教学', '🎮 游戏大厅', '🔧 工具箱', '📈 全球行情', '🧪 量化实验室', '🔗 快捷导航', 'layout-toggle-btn', 'calendar-section', 'projects-section']) if (!home.includes(expected)) failures.push(`Missing homepage item: ${expected}`);
if (!existsSync(resolve(output, '.nojekyll'))) failures.push('Missing .nojekyll');
const report = { totals: manifest.totals, verifiedPages: manifest.pages.length, verifiedPDFs: pdfs, preservedResources, failures };
writeFileSync(resolve(project, 'generated-site/verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
