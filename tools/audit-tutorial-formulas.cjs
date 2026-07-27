const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reportDir = path.join(sourceDir, '粗校报告');
const jsonPath = path.join(reportDir, '严格复校公式检查.json');
const markdownPath = path.join(reportDir, '严格复校公式检查.md');

const files = fs.readdirSync(sourceDir)
  .filter(name => name.includes('(粗校)') && name.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const latexCommand = /\\[A-Za-z]+/;
const adjacentFunction = /(\b[A-Za-z][A-Za-z0-9_]*\([^()\n]{1,80}\))[\u200B-\u200D\uFEFF]*\1/;
const adjacentBigO = /(O\([^()\n]{1,80}\))[\u200B-\u200D\uFEFF]*\1/;
const adjacentMathToken = /(?<![A-Za-z])([A-Za-zΑ-ω][A-Za-zΑ-ω0-9]*(?:[_^](?:\{[^{}\n]{1,30}\}|[A-Za-z0-9]))?)[\u200B-\u200D\uFEFF]*\1(?![A-Za-z])/;

function isApprovedAdjacentException(line) {
  return /mm_struct|\b\d+(?:mm|cm)\b|N\/mm2|Type II|MCMC|\bEE\b|COCO|Flip-Flop|\bFF\d|Victor Emmanuel II|ISIS|NSS、SS|0x[0-9A-F]*FF|OBD-II|QQ\s*(?:好友|邮箱)|\b[1-5]xx\b|[TF]{4,}|ChaCha|V_DD|\babab\b|AVL.*(?:LL|RR)|课程表 II|两数之和 II/.test(line);
}

function removeInlineMath(line) {
  return line
    .replace(/\$\$.*?\$\$/g, '')
    .replace(/(?<!\\)\$(?!\$).*?(?<!\\)\$/g, '');
}

function scanFile(file) {
  const text = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const findings = {
    rawLatex: [],
    adjacentDuplicates: [],
    unbalancedInlineLines: [],
  };
  let inCode = false;
  let inDisplayMath = false;
  let codeFences = 0;
  let displayMarkers = 0;
  let inlineMarkers = 0;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      codeFences += 1;
      return;
    }
    if (inCode) return;

    const displayCount = (line.match(/\$\$/g) || []).length;
    displayMarkers += displayCount;
    const wasInDisplay = inDisplayMath;
    if (displayCount % 2) inDisplayMath = !inDisplayMath;
    if (wasInDisplay || inDisplayMath || displayCount) return;

    const scanLine = line.replace(/`[^`]*`/g, '');
    const inlineCount = (scanLine.match(/(?<!\\)(?<!\$)\$(?!\$)/g) || []).length;
    inlineMarkers += inlineCount;
    if (inlineCount % 2) {
      findings.unbalancedInlineLines.push({ line: lineNumber, text: line.trim().slice(0, 500) });
    }

    const prose = removeInlineMath(scanLine);
    if (latexCommand.test(prose)) {
      findings.rawLatex.push({ line: lineNumber, text: line.trim().slice(0, 500) });
    }
    if ((adjacentFunction.test(prose) || adjacentBigO.test(prose) || adjacentMathToken.test(prose))
      && !isApprovedAdjacentException(line)) {
      findings.adjacentDuplicates.push({ line: lineNumber, text: line.trim().slice(0, 500) });
    }
  });

  return {
    file,
    lines: lines.length,
    codeFences,
    displayMarkers,
    inlineMarkers,
    structuralIssues: {
      unbalancedCodeFences: codeFences % 2 !== 0,
      unbalancedDisplayMath: displayMarkers % 2 !== 0,
      unbalancedInlineMath: inlineMarkers % 2 !== 0,
    },
    findings,
  };
}

const results = files.map(scanFile);
const totals = results.reduce((acc, item) => {
  acc.rawLatex += item.findings.rawLatex.length;
  acc.adjacentDuplicates += item.findings.adjacentDuplicates.length;
  acc.unbalancedInlineLines += item.findings.unbalancedInlineLines.length;
  acc.structuralIssues += Object.values(item.structuralIssues).filter(Boolean).length;
  return acc;
}, {
  files: results.length,
  rawLatex: 0,
  adjacentDuplicates: 0,
  unbalancedInlineLines: 0,
  structuralIssues: 0,
});

function render(items) {
  return items.length
    ? items.map(item => `- 第 ${item.line} 行：\`${item.text.replace(/`/g, '\\`')}\``).join('\n')
    : '- 无。';
}

const details = results
  .filter(item => Object.values(item.findings).some(items => items.length) || Object.values(item.structuralIssues).some(Boolean))
  .map(item => `### ${item.file}\n\n`
    + `- 结构：代码围栏${item.structuralIssues.unbalancedCodeFences ? '未配对' : '配对'}；块公式${item.structuralIssues.unbalancedDisplayMath ? '未配对' : '配对'}；行内公式${item.structuralIssues.unbalancedInlineMath ? '未配对' : '配对'}。\n\n`
    + `#### 未置于数学定界符中的 LaTeX\n\n${render(item.findings.rawLatex)}\n\n`
    + `#### 疑似相邻重复公式\n\n${render(item.findings.adjacentDuplicates)}\n\n`
    + `#### 单行行内公式定界符不配对\n\n${render(item.findings.unbalancedInlineLines)}\n`)
  .join('\n');

const markdown = `# 严格复校公式检查\n\n`
  + `- 文件数：${totals.files}\n`
  + `- 未置于数学定界符中的 LaTeX：${totals.rawLatex}\n`
  + `- 疑似相邻重复公式：${totals.adjacentDuplicates}\n`
  + `- 单行行内公式定界符不配对：${totals.unbalancedInlineLines}\n`
  + `- 文件级结构问题：${totals.structuralIssues}\n\n`
  + `> 检查已排除代码围栏和块级公式内部；命中项仍需逐条人工判断。\n\n`
  + `## 详情\n\n${details || '全部检查通过。'}\n`;

fs.writeFileSync(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), totals, results }, null, 2)}\n`, 'utf8');
fs.writeFileSync(markdownPath, markdown, 'utf8');
process.stdout.write(`${JSON.stringify(totals)}\n`);
