import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, extname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(project, '../..');
const output = resolve(project, 'generated-site');
const publicDirectories = ['blog', 'ai-tutorials', 'tutorials', 'games', 'tools', 'markets', 'quant-lab', 'quick-nav'];
const warnings = [];
const manifest = { pages: [], styles: [], scripts: [], totals: {} };
const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 16);
const slash = path => path.replaceAll('\\', '/');
const write = (path, content) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content, 'utf8'); };

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git', '__pycache__', '.venv'].includes(entry.name)) return [];
    const full = resolve(path, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function splitSelectors(selector) {
  const parts = [];
  let start = 0, nesting = 0, quote = '';
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];
    if (char === '\\') { i++; continue; }
    if (quote) { if (char === quote) quote = ''; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '(' || char === '[') nesting++;
    if (char === ')' || char === ']') nesting--;
    if (char === ',' && nesting === 0) { parts.push(selector.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(selector.slice(start).trim());
  return parts.filter(Boolean);
}

function scopedSelector(selector) {
  if (/^(?:html|body)?\.(?:dark)|^(?:html|body)?\[data-theme=["']?dark/.test(selector)) {
    return 'html[data-scheme="dark"] .stack-app ' + selector.replace(/^(?:html|body)?(?:\.dark|\[data-theme=["']?dark["']?\])\s*/, '');
  }
  if (/^(?:html|body|:root)(?![\w-])/.test(selector)) {
    return selector.replace(/^(?:html|body|:root)/, '.stack-app').replace(/\.stack-app\s+body\b/, '.stack-app');
  }
  return '.stack-app ' + selector;
}

const geometry = /(?:svg|\.katex|\.MathJax|\.mjx|\.tile|\.grid-cell|\.wire|\.gate|\.wave|\.signal|\.fruit|\.lcd|\.calculator-(?:display|key)|\.bg-(?:red|green|blue|yellow|orange|purple|pink)|--viz|data-signal)/i;
const rem = value => value.replace(/(-?\d*\.?\d+)rem\b/g, (_, size) => `${Math.round(Number(size) * 1.6 * 10000) / 10000}rem`);
const colorNames = /^(?:#[\da-f]{3,8}|rgba?\(|hsla?\(|oklch\(|oklab\(|color\(|(?:white|black|gray|grey|red|blue|green|yellow|orange|purple|pink|navy|teal|silver)\b)/i;

function convertDeclaration(declaration, selector, inline = false) {
  const property = declaration.prop.toLowerCase();
  const functional = geometry.test(selector);
  if (property === 'font' && !functional) { declaration.prop = 'font-family'; declaration.value = 'var(--base-font-family)'; return; }
  if (/^font-family$/.test(property) && !functional && !/monospace|katex|mathjax/i.test(declaration.value)) declaration.value = 'var(--base-font-family)';
  if (!functional && !property.startsWith('--viz')) declaration.value = rem(declaration.value);
  if (functional) return;
  if (property.startsWith('--')) {
    if (!colorNames.test(declaration.value.trim())) return;
    if (/viz|signal|positive|negative|danger|success|warn|loss|gain|series|company/i.test(property)) return;
    if (['--accent-color', '--card-background', '--card-separator-color', '--card-text-color-main', '--card-text-color-secondary'].includes(property)) { declaration.remove(); return; }
    if (/bg|background|surface|panel|paper|card/.test(property)) declaration.value = 'var(--card-background)';
    else if (/muted|secondary|subtle/.test(property)) declaration.value = 'var(--card-text-color-secondary)';
    else if (/border|line|rule/.test(property)) declaration.value = 'var(--card-separator-color)';
    else if (/accent|primary|brand|link/.test(property)) declaration.value = 'var(--accent-color)';
    else if (/text|ink|foreground|fg/.test(property)) declaration.value = 'var(--card-text-color-main)';
    return;
  }
  if (property === 'color') {
    if (/danger|error|loss|negative/i.test(selector)) declaration.value = 'var(--stack-danger)';
    else if (/success|positive|gain/i.test(selector)) declaration.value = 'var(--stack-success)';
    else declaration.value = 'inherit';
  }
  if (/^background(?:-color)?$/.test(property) && !/url\(|^(?:none|transparent|inherit|currentcolor)$/.test(declaration.value)) declaration.value = 'var(--card-background)';
  if (property === 'background-image' && /gradient/.test(declaration.value)) declaration.value = 'none';
  if (property === 'box-shadow' && declaration.value !== 'none') declaration.value = 'var(--shadow-l1)';
  if (property === 'border-radius' && !/50%|999/.test(declaration.value)) declaration.value = 'var(--card-border-radius)';
  if (/^border(?:-(?:top|right|bottom|left))?-color$/.test(property)) declaration.value = 'var(--card-separator-color)';
  if (/^border(?:-(?:top|right|bottom|left))?$/.test(property) && !/^(none|0)$/.test(declaration.value)) declaration.value = '1px solid var(--card-separator-color)';
  if (inline && /^(?:color|background|background-color|box-shadow|border.*color)$/.test(property)) declaration.remove();
}

function convertCSS(css, filename, diagram = false) {
  if (/katex(?:\.min)?\.css$|article-math\.css$/.test(filename)) return css;
  let tree;
  try { tree = postcss.parse(css, { from: filename, map: false }); }
  catch (error) { throw new Error(`Cannot parse ${filename}: ${error.message}`); }
  // Stack's unlayered base rules otherwise outrank Tailwind's utility layers,
  // changing flex direction and even overriding display:grid on application main.
  tree.walkAtRules('layer', rule => { if (rule.nodes) rule.replaceWith(...rule.nodes); else rule.remove(); });
  tree.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    const originalSelector = rule.selector;
    if (!diagram) rule.walkDecls(declaration => convertDeclaration(declaration, originalSelector));
    if (!diagram && /^(?:html|body|:root)(?:\s*,\s*(?:html|body|:root))*$/.test(originalSelector.trim())) {
      rule.walkDecls(declaration => {
        if (/^(?:margin|padding|width|height|min-height|max-width|display|position|overflow|font-size)(?:-|$)/.test(declaration.prop)) declaration.remove();
      });
    }
    rule.selector = splitSelectors(originalSelector).map(scopedSelector).join(',\n');
  });
  return tree.toString();
}

function scopeScript(code, filename) {
  // Scope original document lookups to the migrated application without changing
  // strings containing teaching examples, localStorage keys, or application state.
  if (!/document\.(?:querySelector|getElement)/.test(code)) return code;
  let ast;
  try { ast = parse(code, { sourceType: 'unambiguous', allowReturnOutsideFunction: true, plugins: ['jsx'] }); }
  catch (error) { warnings.push({ file: filename, type: 'script-parser', message: error.message }); return code; }
  const changes = [];
  traverse(ast, { CallExpression(path) {
    const callee = path.node.callee;
    if (callee.type !== 'MemberExpression' || callee.computed || callee.object.type !== 'Identifier' || callee.object.name !== 'document') return;
    if (!['querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 'getElementsByTagName'].includes(callee.property.name)) return;
    if (path.scope.hasBinding('document')) return;
    changes.push([callee.object.start, callee.object.end, 'StackPage']);
  } });
  for (const [start, end, text] of changes.sort((a, b) => b[0] - a[0])) code = code.slice(0, start) + text + code.slice(end);
  return code;
}

function cleanInline(element) {
  if (!element.hasAttribute('style') || element.closest('svg, .katex, .MathJax, .mjx-container')) return;
  try {
    const rule = postcss.parse(`a{${element.getAttribute('style')}}`, { map: false }).first;
    rule.walkDecls(declaration => convertDeclaration(declaration, element.className?.toString() || element.tagName, true));
    const result = rule.nodes.map(node => node.toString()).join(';');
    if (result) element.setAttribute('style', result); else element.removeAttribute('style');
  } catch (error) { warnings.push({ type: 'inline-style', message: error.message }); }
}

function importHTML(filename, destinationURL, home = false) {
  const original = readFileSync(filename, 'utf8');
  const documentPath = slash(relative(repository, filename));
  const dom = new JSDOM(original);
  const document = dom.window.document;
  const idsBefore = [...document.querySelectorAll('[id]')].map(element => element.id);
  if (documentPath === 'games/flxg-2048/index.html') {
    if (!document.querySelector('.score-sharing')) {
      const sharing = document.createElement('div');
      sharing.className = 'score-sharing';
      document.querySelector('.game-message')?.append(sharing);
    }
    for (const image of document.querySelectorAll('img[src*="Count.cgi"]')) {
      image.setAttribute('src', 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="20"><text x="4" y="15" fill="gray">—</text></svg>'));
    }
  }
  const removedIds = [];
  for (const element of document.querySelectorAll('nav.global-nav, body > footer')) {
    if (element.tagName === 'FOOTER') {
      const text = element.textContent.replace(/\s+/g, ' ').trim();
      const standardCopyright = /^©\s*2026\s+Largeoyos\s*[·.]\s*Built with\s*(?:❤️|♥|❤)\s*and Hosted on GitHub Pages(?:\s*Version\s*[\s\S]*)?$/i.test(text);
      if (!standardCopyright || element.id || element.querySelector('[id], button, input, select, textarea, [data-action]')) {
        element.classList.add('stack-function-footer');
        continue;
      }
    }
    removedIds.push(...[...element.querySelectorAll('[id]')].map(node => node.id));
    if (element.id) removedIds.push(element.id);
    element.remove();
  }
  for (const aside of document.querySelectorAll('body > aside, .layout > aside, .layout > nav.toc, .app > aside, .shell > aside')) {
    if (aside.closest('details') || aside.querySelector('canvas') || /fortune-panel/.test(aside.className)) continue;
    const details = document.createElement('details');
    details.className = 'stack-source-toc';
    const summary = document.createElement('summary');
    summary.textContent = '📑 本页目录';
    aside.before(details);
    details.append(summary, aside);
  }
  for (const element of document.querySelectorAll('[style]')) cleanInline(element);
  for (const script of document.querySelectorAll('script:not([src])')) {
    if (script.type && !/javascript|module/.test(script.type)) continue;
    script.textContent = scopeScript(script.textContent, documentPath);
  }
  const styles = [];
  for (const style of document.querySelectorAll('style')) {
    // SVG styles are global in HTML too. Keep diagram geometry and colors,
    // but prevent generic svg rules from resizing Stack's navigation icons.
    if (style.closest('svg')) { style.textContent = convertCSS(style.textContent, documentPath + '#svg', true); continue; }
    styles.push(style.textContent);
    if (style.id) style.textContent = ''; else style.remove();
  }
  const key = hash(destinationURL);
  if (styles.length) write(resolve(output, 'static/stack-site/pages', `${key}.css`), convertCSS(styles.join('\n'), documentPath));
  const head = [...document.head.children].filter(element => {
    if (element.tagName === 'META' && element.httpEquiv.toLowerCase() === 'refresh') return true;
    if (['META', 'TITLE', 'BASE'].includes(element.tagName)) return false;
    if (element.tagName === 'LINK') {
      if (element.rel !== 'stylesheet' && element.rel !== 'modulepreload') return false;
      if (/fonts\.googleapis|fonts\.gstatic|highlight\.js.*\/styles\//.test(element.href)) return false;
    }
    return true;
  }).map(element => element.outerHTML).join('\n');
  const heading = document.querySelector('body > header h1, body > main h1, h1');
  const title = (heading?.textContent || document.title || destinationURL).replace(/\s*[|｜]\s*(?:LarGeoYos|Largeoyos).*$/i, '').trim();
  const bodyId = document.body.id;
  const bodyClass = document.body.className;
  const attributes = [...document.body.attributes].filter(attribute => attribute.name.startsWith('data-')).map(attribute => `${attribute.name}="${attribute.value.replaceAll('"', '&quot;')}"`).join(' ');
  const content = `<div class="source-document ${bodyClass}"${bodyId ? ` id="${bodyId}"` : ''} ${attributes}>${document.body.innerHTML}</div>`;
  const metadata = {
    title,
    url: destinationURL,
    layout: home ? 'workspace' : 'application',
    sourcePath: documentPath,
    sourceHead: head,
    sourceStyles: styles.length ? `stack-site/pages/${key}.css` : '',
    sourceKind: documentPath.split('/')[0],
    sourceBodyClass: bodyClass,
    embeddedWidget: /\/widgets\//.test(documentPath),
    build: { list: 'never' }
  };
  const contentPath = destinationURL === '/' ? resolve(output, 'content/_index.html') : resolve(output, 'content/site', `${key}.html`);
  write(contentPath, JSON.stringify(metadata, null, 2) + '\n\n' + content);
  const idsAfter = new Set([...document.querySelectorAll('[id]')].map(element => element.id));
  const missingIds = idsBefore.filter(id => !idsAfter.has(id) && !removedIds.includes(id));
  if (missingIds.length) throw new Error(`Lost DOM IDs in ${documentPath}: ${missingIds.join(', ')}`);
  manifest.pages.push({ source: documentPath, url: destinationURL, ids: idsBefore.length, oldNavigationRemoved: true, missingIds, widget: metadata.embeddedWidget, scripts: document.querySelectorAll('script').length, functionalFooters: document.querySelectorAll('.stack-function-footer').length });
  dom.window.close();
}

const files = publicDirectories.flatMap(directory => walk(resolve(repository, directory)));
if (process.argv[2] === '--styles') {
  const styles = [...files, ...walk(resolve(repository, 'css'))].filter(filename => extname(filename).toLowerCase() === '.css');
  for (const filename of styles) {
    const sourcePath = slash(relative(repository, filename));
    write(resolve(output, 'static', sourcePath), convertCSS(readFileSync(filename, 'utf8'), sourcePath));
  }
  console.log(`Updated ${styles.length} scoped stylesheets`);
  process.exit(0);
}
const htmlJobs = files.filter(filename => extname(filename).toLowerCase() === '.html').map(filename => ({ filename, url: '/' + slash(relative(repository, filename)), home: false }));
htmlJobs.push({ filename: resolve(repository, 'index.html'), url: '/', home: true }, { filename: resolve(repository, 'index.html'), url: '/workspace.html', home: true });
if (process.argv[2] === '--page') {
  const job = htmlJobs.find(job => slash(relative(repository, job.filename)) === process.argv[3]);
  if (!job) throw new Error('Unknown source page: ' + process.argv[3]);
  importHTML(job.filename, job.url, job.home);
  console.log('Updated ' + job.url);
  process.exit(0);
}
if (process.argv[2] === '--html-worker') {
  for (const job of htmlJobs.slice(Number(process.argv[3]), Number(process.argv[4]))) importHTML(job.filename, job.url, job.home);
  process.stdout.write(JSON.stringify({ pages: manifest.pages, warnings }));
  process.exit(0);
}

// Each process owns a bounded number of JSDOM windows. Releasing the process
// also releases parser caches before importing the next batch of long books.
for (let start = 0; start < htmlJobs.length; start += 20) {
  const end = Math.min(start + 20, htmlJobs.length);
  const worker = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--html-worker', String(start), String(end)], { cwd: project, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, windowsHide: true });
  if (worker.status !== 0) throw new Error(`HTML import ${start}-${end} failed: ${worker.stderr || worker.error}`);
  const result = JSON.parse(worker.stdout);
  manifest.pages.push(...result.pages);
  warnings.push(...result.warnings);
  console.log(`Imported ${end}/${htmlJobs.length} pages`);
}

for (const filename of files) {
  const sourcePath = slash(relative(repository, filename));
  const extension = extname(filename).toLowerCase();
  if (extension === '.css') {
    write(resolve(output, 'static', sourcePath), convertCSS(readFileSync(filename, 'utf8'), sourcePath));
    manifest.styles.push(sourcePath);
  }
  if (extension === '.js') {
    const originalCode = readFileSync(filename, 'utf8');
    let code = /(?:\/math\/|\/vendor\/|katex|\.min\.js$)/.test(sourcePath) ? originalCode : scopeScript(originalCode, sourcePath);
    if (sourcePath === 'markets/market.js') {
      code = code.replace("theme: 'dark'", "theme: document.documentElement.dataset.scheme || 'light'")
        .replace("backgroundColor: 'rgba(6, 14, 25, 1)'", "backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim()")
        .replace("gridColor: 'rgba(126, 165, 193, 0.10)'", "gridColor: 'rgba(128,128,128,0.10)'");
      code += '\nwindow.addEventListener("stack:scheme", () => { const active = allAssetButtons.find(button => button.classList.contains("is-selected")); if (active) renderChart(active.dataset.symbol, active.dataset.name); });\n';
    }
    // The legacy game refers to Twitter even when no Twitter widget is installed.
    if (sourcePath === 'games/flxg-2048/js/html_actuator.js') code = code.replace(/twttr\.widgets\.load\(\)/g, 'window.twttr?.widgets?.load?.()');
    write(resolve(output, 'static', sourcePath), code);
    manifest.scripts.push(sourcePath);
  }
}
for (const cssFile of walk(resolve(repository, 'css')).filter(file => extname(file) === '.css')) {
  const sourcePath = slash(relative(repository, cssFile));
  write(resolve(output, 'static', sourcePath), convertCSS(readFileSync(resolve(repository, sourcePath), 'utf8'), sourcePath));
  manifest.styles.push(sourcePath);
}
manifest.totals = { pages: manifest.pages.length, widgets: manifest.pages.filter(page => page.widget).length, styles: manifest.styles.length, scripts: manifest.scripts.length, pdfs: files.filter(file => extname(file).toLowerCase() === '.pdf').length };
write(resolve(output, 'manifest.json'), JSON.stringify({ ...manifest, warnings }, null, 2));
write(resolve(output, 'static/stack-site/migration.json'), JSON.stringify({ totals: manifest.totals, pages: manifest.pages.map(page => ({ source: page.source, url: page.url, widget: page.widget })) }, null, 2));
console.log(JSON.stringify({ ...manifest.totals, warnings }, null, 2));
