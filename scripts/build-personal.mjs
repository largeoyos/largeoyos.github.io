import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(repo, 'hugo-draft/stack-personal');
const output = resolve(source, 'public');
const result = spawnSync('hugo', ['--source', source, '--destination', output], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const page = readFileSync(resolve(output, 'index.html'), 'utf8');
if (!page.includes('https://cv.largeoyos.me/') || !page.includes('LarGeoYos')) throw new Error('Personal homepage did not use its independent domain.');
const stylesheet = page.match(/href=["']([^"']*\.css)["']/)?.[1];
if (!stylesheet || !stylesheet.startsWith('/') || !existsSync(resolve(output, stylesheet.slice(1)))) {
  throw new Error('Personal homepage stylesheet is missing or uses the wrong base path.');
}
const htmlFiles = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = resolve(dir, entry.name);
  return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
});
for (const file of htmlFiles(output)) {
  const url = new URL(relative(output, file).replaceAll('\\', '/'), 'https://cv.largeoyos.me/');
  for (const match of readFileSync(file, 'utf8').matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const target = new URL(match[1], url);
    if (target.hostname === 'largeoyos.github.io' || target.hostname === 'largeoyos.me' || target.hostname === 'www.largeoyos.me') {
      throw new Error(`Personal link points to the main site: ${match[1]}`);
    }
  }
}
console.log('Independent personal homepage built and checked for cv.largeoyos.me.');
