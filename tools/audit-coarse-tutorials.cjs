const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reportDir = path.join(sourceDir, '粗校报告');
const outputJson = path.join(reportDir, '严格复校初检.json');
const outputMarkdown = path.join(reportDir, '严格复校初检.md');

const files = fs.readdirSync(sourceDir)
  .filter(name => name.includes('(粗校)') && name.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const strongDialogue = /(?:请(?:你)?回答|回答我|告诉我(?!们)|你来选|你选|是否继续|要不要继续|准备好(?:了)?吗|等你(?:回答|回复)|接下来你想|如果你愿意|你刚才|你的回答|你已经|我来(?:带你|讲|解释|帮你)|我建议你|回答得|答得|说得很好|答对了)/;
const platformHeading = /^#{1,6}\s*(?:You said|Claude responded|ChatGPT said|Assistant|Human|User)\s*:/i;
const continueHeading = /^#{1,6}\s*(?:You said:\s*)?继续[。！!?？]?\s*$/i;
const standaloneReply = /^(?:继续|好的|好|是|否|1|2|3)[。！!?？]?\s*$/;
const oldImage = /!\[\[[^\]]+\]\]/;

function normalizeParagraph(value) {
  return value
    .replace(/\s+/g, '')
    .replace(/[，。；：！？、,.!?;:'"“”‘’（）()[\]{}<>《》【】`~*_#$\\|+=-]/g, '')
    .toLowerCase();
}

function scanFile(name) {
  const fullPath = path.join(sourceDir, name);
  const text = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const findings = {
    platformHeadings: [],
    continueHeadings: [],
    standaloneReplies: [],
    dialogue: [],
    oldImages: [],
    headingJumps: [],
    emptySections: [],
    duplicateParagraphs: [],
  };
  const headings = [];
  const paragraphs = [];
  let paragraph = [];
  let paragraphStart = 1;
  let inCode = false;
  let previousHeadingLevel = null;
  let displayMathMarkers = 0;
  let inDisplayMath = false;
  let codeFences = 0;

  const flushParagraph = endLine => {
    const raw = paragraph.join(' ').trim();
    if (raw) paragraphs.push({ line: paragraphStart, endLine, raw, key: normalizeParagraph(raw) });
    paragraph = [];
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/^\s*```/.test(line)) {
      flushParagraph(lineNumber - 1);
      inCode = !inCode;
      codeFences += 1;
      return;
    }
    if (inCode) return;

    const displayCount = (line.match(/\$\$/g) || []).length;
    displayMathMarkers += displayCount;
    const wasInDisplayMath = inDisplayMath;
    if (displayCount % 2) inDisplayMath = !inDisplayMath;
    if (wasInDisplayMath || inDisplayMath || displayCount) return;

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      flushParagraph(lineNumber - 1);
      const level = heading[1].length;
      const title = heading[2].trim();
      headings.push({ line: lineNumber, level, title });
      if (platformHeading.test(line)) findings.platformHeadings.push({ line: lineNumber, text: line.trim() });
      if (continueHeading.test(line)) findings.continueHeadings.push({ line: lineNumber, text: line.trim() });
      if (previousHeadingLevel !== null && level > previousHeadingLevel + 1) {
        findings.headingJumps.push({ line: lineNumber, text: line.trim() });
      }
      previousHeadingLevel = level;
      return;
    }

    if (!line.trim()) {
      flushParagraph(lineNumber - 1);
      return;
    }

    if (standaloneReply.test(line.trim())) findings.standaloneReplies.push({ line: lineNumber, text: line.trim() });
    if (!/^\s*>/.test(line) && strongDialogue.test(line)) findings.dialogue.push({ line: lineNumber, text: line.trim().slice(0, 300) });
    if (oldImage.test(line)) findings.oldImages.push({ line: lineNumber, text: line.trim().slice(0, 300) });
    if (!paragraph.length) paragraphStart = lineNumber;
    paragraph.push(line.trim());
  });
  flushParagraph(lines.length);

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index];
    const next = headings[index + 1];
    if (next && next.level <= current.level && !lines.slice(current.line, next.line - 1).some(line => line.trim())) {
      findings.emptySections.push({ line: current.line, text: `${'#'.repeat(current.level)} ${current.title}` });
    }
  }

  for (let index = 1; index < paragraphs.length; index += 1) {
    const previous = paragraphs[index - 1];
    const current = paragraphs[index];
    if (current.key.length >= 24 && current.key === previous.key) {
      findings.duplicateParagraphs.push({
        line: current.line,
        text: current.raw.slice(0, 300),
        previousLine: previous.line,
      });
    }
  }

  const h2Count = headings.filter(item => item.level === 2).length;
  const issueCount = Object.values(findings).reduce((sum, items) => sum + items.length, 0)
    + (codeFences % 2)
    + (displayMathMarkers % 2)
    + (h2Count === 0 ? 1 : 0);

  return {
    file: name,
    bytes: Buffer.byteLength(text),
    lines: lines.length,
    headings: headings.length,
    h2Count,
    codeFences,
    displayMathMarkers,
    issueCount,
    structuralIssues: {
      unbalancedCodeFences: codeFences % 2 !== 0,
      unbalancedDisplayMath: displayMathMarkers % 2 !== 0,
      missingH2: h2Count === 0,
    },
    findings,
    outline: headings,
  };
}

function renderExamples(items, limit = 8) {
  if (!items.length) return '—';
  return items.slice(0, limit).map(item => `第 ${item.line} 行：${item.text}`).join('<br>');
}

const results = files.map(scanFile);
const totals = results.reduce((acc, item) => {
  acc.lines += item.lines;
  acc.bytes += item.bytes;
  acc.issues += item.issueCount;
  return acc;
}, { files: results.length, lines: 0, bytes: 0, issues: 0 });

const rows = results.map(item => {
  const f = item.findings;
  return `|${item.file}|${item.lines}|${item.h2Count}|${f.platformHeadings.length}|${f.continueHeadings.length}|${f.standaloneReplies.length}|${f.dialogue.length}|${f.duplicateParagraphs.length}|${f.headingJumps.length}|${item.issueCount}|`;
}).join('\n');

const detail = results
  .filter(item => item.issueCount)
  .map(item => {
    const f = item.findings;
    return `### ${item.file}\n\n`
      + `- 平台标题：${renderExamples(f.platformHeadings)}\n`
      + `- “继续”标题：${renderExamples(f.continueHeadings)}\n`
      + `- 单独回复：${renderExamples(f.standaloneReplies)}\n`
      + `- 强对话语句：${renderExamples(f.dialogue)}\n`
      + `- 相邻重复段落：${renderExamples(f.duplicateParagraphs)}\n`
      + `- 标题层级跳跃：${renderExamples(f.headingJumps)}\n`
      + `- 旧图片语法：${renderExamples(f.oldImages)}\n`
      + `- 结构检查：代码围栏${item.structuralIssues.unbalancedCodeFences ? '未配对' : '配对'}；块公式${item.structuralIssues.unbalancedDisplayMath ? '未配对' : '配对'}；二级标题${item.structuralIssues.missingH2 ? '缺失' : '存在'}。\n`;
  }).join('\n');

const markdown = `# 严格复校初检\n\n`
  + `- 文件数：${totals.files}\n`
  + `- 总行数：${totals.lines}\n`
  + `- 总大小：${(totals.bytes / 1024 / 1024).toFixed(2)} MiB\n`
  + `- 初检问题计数：${totals.issues}\n\n`
  + `> 本报告只用于定位逐篇人工复校入口，命中项不等于最终错误；代码块内容已排除。\n\n`
  + `## 总表\n\n`
  + `|文件|行数|二级标题|平台标题|继续标题|单独回复|强对话|重复段落|标题跳级|合计|\n`
  + `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n\n`
  + `## 待人工复核详情\n\n${detail || '未发现待复核项。'}\n`;

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify({ generatedAt: new Date().toISOString(), totals, results }, null, 2)}\n`, 'utf8');
fs.writeFileSync(outputMarkdown, markdown, 'utf8');
process.stdout.write(`${JSON.stringify(totals)}\n`);
