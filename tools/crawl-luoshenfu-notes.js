#!/usr/bin/env node
/*
 * 将古文岛《洛神赋》页面中的“译文及注释”区块保存为本地 Markdown。
 * 仅用于个人学习；请勿将抓取结果用于商业复制、转售或再发布。
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const pageUrl = 'https://www.gushiwen.cn/shiwenv.aspx?id=0559b0b0f385';
const robotsUrl = 'https://www.gushiwen.cn/robots.txt';
const outputPath = path.join(__dirname, 'crawled', 'luoshenfu-notes.md');
const userAgent = 'largeoyos-study-fetcher/1.0 (single-page personal study archive)';

function trimText(value) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readRobotsRule(robotsText, targetPath) {
  let applies = false;
  let matchedRule = null;

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'user-agent') {
      applies = value === '*';
      continue;
    }

    if (!applies || (field !== 'allow' && field !== 'disallow') || !value) continue;
    if (targetPath.startsWith(value) && (!matchedRule || value.length > matchedRule.value.length)) {
      matchedRule = { field, value };
    }
  }

  return !matchedRule || matchedRule.field === 'allow';
}

async function assertRobotsAllowed() {
  const response = await fetch(robotsUrl, { headers: { 'User-Agent': userAgent } });

  if (response.status === 404 || response.status === 410) return;
  if (!response.ok) {
    throw new Error(`无法确认 robots.txt（HTTP ${response.status}），已停止抓取。`);
  }

  const allowed = readRobotsRule(await response.text(), new URL(pageUrl).pathname);
  if (!allowed) {
    throw new Error('robots.txt 不允许抓取该页面，已停止。');
  }
}

function extractNotes(html) {
  const document = new JSDOM(html).window.document;
  const heading = [...document.querySelectorAll('h2, h3, strong, b')]
    .find((element) => trimText(element.textContent) === '译文及注释');

  if (!heading) throw new Error('未找到“译文及注释”区块。');

  const section = heading.closest('.sons, .contyishang, .cont') || heading.parentElement;
  const text = trimText(section.textContent);
  const annotationStart = text.lastIndexOf('注释');

  if (annotationStart === -1) throw new Error('“译文及注释”区块中未找到注释内容。');
  return trimText(text.slice(annotationStart + '注释'.length));
}

async function main() {
  await assertRobotsAllowed();

  const response = await fetch(pageUrl, {
    headers: {
      'User-Agent': userAgent,
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`页面请求失败（HTTP ${response.status}）。`);

  const notes = extractNotes(await response.text());
  const fetchedAt = new Date().toISOString();
  const markdown = [
    '# 《洛神赋》注释（本地抓取）',
    '',
    `- 来源：${pageUrl}`,
    `- 抓取时间：${fetchedAt}`,
    '- 用途：个人学习资料；请遵守来源网站协议及适用版权规定。',
    '',
    '## 注释',
    '',
    notes,
    '',
  ].join('\n');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf8');
  console.log(`已写入 ${outputPath}`);
}

main().catch((error) => {
  console.error(`抓取失败：${error.message}`);
  process.exitCode = 1;
});
