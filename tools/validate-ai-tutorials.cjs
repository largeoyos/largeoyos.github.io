const fs = require('fs');
const path = require('path');
const http = require('http');
const { marked } = require('marked');

const root = path.resolve(__dirname, '..');
const tutorialRoot = path.join(root, 'ai-tutorials');
const docsRoot = path.join(tutorialRoot, 'docs');
const docsJsonPath = path.join(tutorialRoot, 'docs.json');
const reportDir = path.join(root, '待拆解', '粗校报告', '严格复校报告');
const docs = JSON.parse(fs.readFileSync(docsJsonPath, 'utf8'));
const errors = [];
const warnings = [];

function walk(dir, predicate = () => true) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full, predicate));
    else if (predicate(full)) output.push(full);
  }
  return output;
}

const seenIds = new Set();
const expectedFiles = new Set();
const categories = new Set();
let markdownImages = 0;
let renderedImages = 0;
let legacyImageLinks = 0;
const referencedAssets = new Set();

for (const doc of docs) {
  if (!doc || typeof doc.id !== 'string' || typeof doc.title !== 'string' || typeof doc.category !== 'string') {
    errors.push(`docs.json 存在字段不完整的记录：${JSON.stringify(doc)}`);
    continue;
  }
  if (seenIds.has(doc.id)) errors.push(`重复教程 id：${doc.id}`);
  seenIds.add(doc.id);
  categories.add(doc.category);

  const file = path.join(docsRoot, doc.category, `${doc.id}.md`);
  expectedFiles.add(path.normalize(file).toLowerCase());
  if (!fs.existsSync(file)) {
    errors.push(`索引指向不存在的文件：${path.relative(root, file)}`);
    continue;
  }

  const text = fs.readFileSync(file, 'utf8');
  if (/^#{1,6}\s*(?:You said:|Claude responded:|Assistant:|User:|Human:|ChatGPT:|继续\s*$)/mi.test(text)) {
    errors.push(`教程仍有对话字段或仅“继续”标题：${path.relative(root, file)}`);
  }
  if (/^\s*(?:You said:|Claude responded:|Assistant:|User:|Human:|ChatGPT:)\s*$/mi.test(text)) {
    errors.push(`教程仍有独立对话角色行：${path.relative(root, file)}`);
  }
  if (/\[\[(?:file|image):/i.test(text)) {
    legacyImageLinks += 1;
    errors.push(`教程仍有非标准 Wiki 图片引用：${path.relative(root, file)}`);
  }

  const imageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+["'][^)]*)?\)/g;
  for (const match of text.matchAll(imageRegex)) {
    const ref = match[1].replace(/^<|>$/g, '');
    markdownImages += 1;
    if (/^(?:https?:|data:|#)/i.test(ref)) continue;
    let decoded = ref;
    try {
      decoded = decodeURIComponent(ref);
    } catch {
      warnings.push(`图片路径无法 URL 解码：${ref}（${path.relative(root, file)}）`);
    }
    // Markdown is fetched and injected into ai-tutorials/doc.html, so browser-relative
    // image URLs are resolved from the tutorial module root, not the Markdown file.
    const target = path.resolve(tutorialRoot, decoded.replace(/\//g, path.sep));
    if (!target.startsWith(root + path.sep)) {
      errors.push(`图片路径越出项目目录：${ref}（${path.relative(root, file)}）`);
    } else if (!fs.existsSync(target)) {
      errors.push(`图片不存在：${ref}（${path.relative(root, file)}）`);
    } else {
      referencedAssets.add(path.normalize(target).toLowerCase());
    }
  }

  try {
    const html = marked.parse(text);
    renderedImages += (html.match(/<img\b/gi) || []).length;
  } catch (error) {
    errors.push(`Markdown 渲染失败：${path.relative(root, file)}：${error.message}`);
  }
}

const actualDocFiles = walk(docsRoot, (file) => file.endsWith('.md'));
for (const file of actualDocFiles) {
  if (!expectedFiles.has(path.normalize(file).toLowerCase())) {
    errors.push(`未被 docs.json 索引的教程文件：${path.relative(root, file)}`);
  }
}

const assetFiles = fs.existsSync(path.join(tutorialRoot, 'assets'))
  ? walk(path.join(tutorialRoot, 'assets'), (file) => /\.(?:svg|png)$/i.test(file))
  : [];
const svgFiles = assetFiles.filter((file) => /\.svg$/i.test(file));
const pngFiles = assetFiles.filter((file) => /\.png$/i.test(file));
const unreferencedAssets = assetFiles.filter(
  (file) => !referencedAssets.has(path.normalize(file).toLowerCase())
);
if (unreferencedAssets.length) {
  warnings.push(`网站资源目录有 ${unreferencedAssets.length} 个 SVG/PNG 未被当前拆分教程引用。`);
}
if (markdownImages !== renderedImages) {
  errors.push(`Markdown 图片数 ${markdownImages} 与渲染后的 img 数 ${renderedImages} 不一致。`);
}

function serveFile(req, res) {
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
  const target = path.resolve(root, relative.replace(/\//g, path.sep));
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200);
  fs.createReadStream(target).pipe(res);
}

function getStatus(port, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: encodeURI(urlPath) }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
  });
}

async function validateHttp() {
  const server = http.createServer(serveFile);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const sampleDoc = docs[Math.floor(docs.length / 2)];
  const paths = [
    '/ai-tutorials/index.html',
    '/ai-tutorials/doc.html',
    '/ai-tutorials/docs.json',
    `/ai-tutorials/docs/${sampleDoc.category}/${sampleDoc.id}.md`
  ];
  if (assetFiles.length) paths.push(`/${path.relative(root, assetFiles[0]).split(path.sep).join('/')}`);
  const checks = [];
  try {
    for (const urlPath of paths) {
      const status = await getStatus(port, urlPath);
      checks.push({ path: urlPath, status });
      if (status !== 200) errors.push(`本地 HTTP 检查失败：${urlPath} 返回 ${status}`);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  return checks;
}

(async () => {
  const httpChecks = await validateHttp();
  const result = {
    generatedAt: '2026-07-26',
    docs: docs.length,
    categories: categories.size,
    indexedMarkdownFiles: expectedFiles.size,
    actualMarkdownFiles: actualDocFiles.length,
    duplicateIds: docs.length - seenIds.size,
    markdownImages,
    renderedImages,
    legacyImageLinks,
    assets: {
      svg: svgFiles.length,
      png: pngFiles.length,
      referenced: referencedAssets.size,
      unreferenced: unreferencedAssets.length
    },
    httpChecks,
    errors,
    warnings,
    passed: errors.length === 0
  };

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, '教程模块验证报告.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const markdown = [
    '# 教程模块验证报告',
    '',
    `- 教程条目：${result.docs}`,
    `- 教程分类：${result.categories}`,
    `- 索引文件/实际文件：${result.indexedMarkdownFiles}/${result.actualMarkdownFiles}`,
    `- 重复 ID：${result.duplicateIds}`,
    `- Markdown 图片/渲染图片：${result.markdownImages}/${result.renderedImages}`,
    `- 旧式 Wiki 图片引用：${result.legacyImageLinks}`,
    `- 网站资源：SVG ${result.assets.svg} 个，PNG ${result.assets.png} 个`,
    `- 已引用资源：${result.assets.referenced} 个；未引用资源：${result.assets.unreferenced} 个`,
    `- 本地 HTTP 检查：${httpChecks.map((item) => `${item.path} → ${item.status}`).join('；')}`,
    `- 结论：${result.passed ? '通过' : '未通过'}`,
    '',
    '## 错误',
    '',
    ...(errors.length ? errors.map((item) => `- ${item}`) : ['- 无']),
    '',
    '## 提醒',
    '',
    ...(warnings.length ? warnings.map((item) => `- ${item}`) : ['- 无']),
    ''
  ].join('\n');
  fs.writeFileSync(path.join(reportDir, '教程模块验证报告.md'), markdown, 'utf8');

  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
})();
