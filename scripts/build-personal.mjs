import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(repo, 'hugo-draft/stack-personal');
const output = resolve(repo, 'hugo-draft/stack-main/public/personal');
const result = spawnSync('hugo', ['--source', source, '--destination', output], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const page = readFileSync(resolve(output, 'index.html'), 'utf8');
if (!page.includes('/personal/') || !page.includes('LarGeoYos')) throw new Error('Personal homepage did not use the independent /personal/ base path.');
const stylesheet = page.match(/href=["']([^"']*\.css)["']/)?.[1];
if (!stylesheet || !stylesheet.startsWith('/personal/') || !existsSync(resolve(output, stylesheet.slice('/personal/'.length)))) {
  throw new Error('Personal homepage stylesheet is missing or uses the wrong base path.');
}
const htmlFiles = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = resolve(dir, entry.name);
  return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
});
for (const file of htmlFiles(output)) {
  const url = new URL(relative(output, file).replaceAll('\\', '/'), 'https://largeoyos.github.io/personal/');
  for (const match of readFileSync(file, 'utf8').matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const target = new URL(match[1], url);
    if (target.hostname === 'largeoyos.github.io' && !target.pathname.startsWith('/personal/')) {
      throw new Error(`Personal link leaves /personal/: ${match[1]}`);
    }
  }
}
console.log('Independent personal homepage built and checked at /personal/.');
