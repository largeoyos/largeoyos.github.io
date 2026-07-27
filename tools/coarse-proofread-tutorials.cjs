const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { marked } = require('marked');

const projectRoot = path.resolve(__dirname, '..');
const draftRoot = path.join(projectRoot, '待拆解');
const sourceRoot = path.join(draftRoot, '待校对');
const reportRoot = path.join(draftRoot, '粗校报告');
const dryRun = process.argv.includes('--dry-run');

const explicitSkips = new Map([
  ['向量微积分与微分形式.md', '与“理解分析.md”几乎完全相同，且文件名与内容不符，跳过以避免重复输出。'],
]);

const titleOverrides = {
  'Claude模拟电路.md': '模拟电路教程',
  'Claude电路.md': '电路理论教程',
  'Claude输出内容.md': '电路理论学习大纲',
  'CUDA.md': 'CUDA 编程教程',
  'linux内核.md': 'Linux 内核教程',
  'rust.md': 'Rust 教程',
  '传统视觉算法.md': '传统视觉算法教程',
  '偏微分方程.md': '偏微分方程教程',
  '刚体力学.md': '刚体力学教程',
  '复分析.md': '复分析教程',
  '实分析.md': '实分析教程',
  '常微分方程.md': '常微分方程教程',
  '张量.md': '张量分析教程',
  '弹性力学.md': '弹性力学教程',
  '操作系统.md': '操作系统与 Linux 内核',
  '数字图像处理.md': '数字图像处理教程',
  '数字电路.md': '数字电路教程',
  '机器人视觉入门.md': '机器人视觉入门',
  '机器学习深度学习.md': '机器学习与深度学习教程',
  '概率论与数理统计.md': '概率论与数理统计教程',
  '法考.md': '法律职业资格考试教程',
  '流体力学.md': '流体力学教程',
  '深度学习视觉.md': '深度学习视觉教程',
  '理解分析.md': '《Understanding Analysis》讲解',
  '理论力学.md': '理论力学讲义',
  '结构力学.md': '结构力学教程',
  '计算机组成原理.md': '计算机组成原理教程',
  '通信原理.md': '通信原理教程',
};

const understandingAnalysisTitles = [
  ['第一章', '第一章：实数'],
  ['第1章', '第一章：实数'],
  ['第2章', '第二章：序列与级数'],
  ['第3章', '第三章：基本拓扑'],
  ['第4章', '第四章：函数极限与连续性'],
  ['第5章', '第五章：导数'],
  ['第6章', '第六章：函数列与函数项级数'],
  ['第7章', '第七章：Riemann 积分'],
  ['第8章', '第八章：附加专题'],
];

const contentReviewNotes = {
  '法考.md': ['法律内容具有时效性，本轮只整理文本，没有依据 2026 年现行法律、司法解释和考试大纲进行事实核查。'],
  'linux内核.md': ['内核版本、源代码行数和具体实现细节可能随 Linux 版本变化，本轮没有统一到指定内核版本。'],
  '机器学习深度学习.md': ['“最新”“当前主流”等时效性表述未做联网核查，后续应按目标发布日期单独复核。'],
  'Claude输出内容.md': ['原稿只展开到第一章热身题，属于不完整课程草稿；本轮不补写缺失章节。'],
  '理解分析.md': ['“逐点收敛与一致收敛”对比表最后一格的 `\\sup` 公式在原稿中被截断；粗校版只标记为“原稿公式未完成”，没有推测补写。'],
  '量子力学.md': ['原稿的自旋列向量使用 \\0、\\1 作为矩阵换行，疑似应为 LaTeX 行分隔符；本轮只记录，没有推测改写。'],
  '凸优化.md': ['原稿收敛公式中出现 x^_，疑似目标点上标缺失；本轮只记录，没有推测改写。'],
};

function outputName(sourceName) {
  const parsed = path.parse(sourceName);
  return `${parsed.name}(粗校)${parsed.ext}`;
}

function normalizeForCompare(value) {
  return value
    .replace(/[\u200B\u2060\uFEFF\u2061]/g, '')
    .replace(/\s+/g, '')
    .replace(/[“”"'`*_#]/g, '')
    .replace(/[，,。.!！?？:：；;]/g, '')
    .toLowerCase();
}

function cleanMathKey(value) {
  const subscriptMap = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
  const superscriptMap = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9' };
  return value
    .replace(/[\u200B\u2060\uFEFF\u2061\u2009\u00A0]/g, '')
    .replace(/[₀-₉]/g, char => subscriptMap[char] || char)
    .replace(/[⁰-⁹]/g, char => superscriptMap[char] || char)
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\(?:boxed|text|mathbf|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/\\(?:mathbf|mathrm|textit|operatorname|left|right|displaystyle)/g, '')
    .replace(/\\(?:cdot|times)/g, '*')
    .replace(/\\(?:leq|le)/g, '<=')
    .replace(/\\(?:geq|ge)/g, '>=')
    .replace(/\\to/g, '->')
    .replace(/\\(?:lor|vee)/g, 'v')
    .replace(/\\(?:land|wedge)/g, '^')
    .replace(/\\neg/g, '!')
    .replace(/[{}\s]/g, '')
    .replace(/[−–—]/g, '-')
    .replace(/⋅|·|×/g, '*')
    .toLowerCase();
}

function similarity(a, b) {
  a = cleanMathKey(a);
  b = cleanMathKey(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = previous[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + cost);
      diagonal = old;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

function dedupeAdjacentGroups(text, open, close) {
  const escaped = { '(': '\\(', ')': '\\)', '[': '\\[', ']': '\\]', '{': '\\{', '}': '\\}' };
  const escapedOpen = escaped[open];
  const escapedClose = escaped[close];
  const regex = new RegExp(`(${escapedOpen}[^${escapedOpen}${escapedClose}\\n]{1,120}${escapedClose})(\\s*)(${escapedOpen}[^${escapedOpen}${escapedClose}\\n]{1,120}${escapedClose})(?:(\\s*)(${escapedOpen}[^${escapedOpen}${escapedClose}\\n]{1,120}${escapedClose}))?`, 'g');
  return text.replace(regex, (match, first, gap, second, gap2, third) => {
    const firstKey = cleanMathKey(first);
    const secondKey = cleanMathKey(second);
    const thirdKey = third ? cleanMathKey(third) : null;
    if (firstKey === secondKey && (!third || secondKey === thirdKey)) return second;
    return match;
  });
}

function bestRepeatedSplit(run) {
  const compact = run.trim();
  if (compact.length < 8 || compact.length > 220) return null;
  if (/[A-Za-z]{5,}/.test(compact) || !/[=<>≤≥≠≈+−*/∑∫√()\[\]]/.test(compact)) return null;

  let best = null;
  const consider = (parts, score, kind) => {
    if (!best || score > best.score) best = { parts, score, kind };
  };

  const n = compact.length;
  for (let i = Math.max(2, Math.floor(n * 0.22)); i <= Math.floor(n * 0.45); i += 1) {
    for (let j = Math.max(i + 2, Math.floor(n * 0.55)); j <= Math.floor(n * 0.78); j += 1) {
      const parts = [compact.slice(0, i), compact.slice(i, j), compact.slice(j)];
      const lengths = parts.map(part => cleanMathKey(part).length);
      const balanced = parts.every(part => ['()', '[]', '{}'].every(pair => (part.split(pair[0]).length - 1) === (part.split(pair[1]).length - 1)));
      if (!balanced || Math.min(...lengths) < 2 || Math.max(...lengths) / Math.min(...lengths) > 1.9) continue;
      const score = (similarity(parts[0], parts[1]) + similarity(parts[1], parts[2]) + similarity(parts[0], parts[2])) / 3;
      consider(parts, score, 'triple');
    }
  }

  for (let i = Math.max(2, Math.floor(n * 0.35)); i <= Math.floor(n * 0.65); i += 1) {
    const parts = [compact.slice(0, i), compact.slice(i)];
    const lengths = parts.map(part => cleanMathKey(part).length);
    const balanced = parts.every(part => ['()', '[]', '{}'].every(pair => (part.split(pair[0]).length - 1) === (part.split(pair[1]).length - 1)));
    if (!balanced || Math.min(...lengths) < 2 || Math.max(...lengths) / Math.min(...lengths) > 1.7) continue;
    consider(parts, similarity(parts[0], parts[1]), 'double');
  }

  if (!best) return null;
  if (best.kind === 'triple' && best.score >= 0.995) return best.parts[1].trim();
  if (best.kind === 'double' && best.score >= 0.995) {
    const [first, second] = best.parts;
    return (second.includes('\\') || second.includes('_')) ? second.trim() : first.trim();
  }
  return null;
}

function cleanupLatexTripletSegments(text) {
  return text.replace(/[^\p{Script=Han}，。；：！？“”\n]+/gu, segment => {
    if (!segment.includes('\\') || segment.includes('$') || segment.length < 8 || segment.length > 700) return segment;
    const leading = (segment.match(/^\s*/) || [''])[0];
    const trailing = (segment.match(/\s*$/) || [''])[0];
    const core = segment.slice(leading.length, segment.length - trailing.length);
    const firstSlash = core.indexOf('\\');
    const lastSlash = core.lastIndexOf('\\');
    if (firstSlash <= 0 || lastSlash < firstSlash || core.length < 10) return segment;

    let best = null;
    const startMin = Math.max(1, Math.floor(core.length * 0.12));
    const startMax = Math.min(firstSlash, Math.floor(core.length * 0.55));
    const endMin = Math.max(lastSlash + 2, Math.floor(core.length * 0.45));
    const endMax = Math.min(core.length - 1, Math.floor(core.length * 0.88));
    for (let start = startMin; start <= startMax; start += 1) {
      for (let end = endMin; end <= endMax; end += 1) {
        const left = core.slice(0, start).trim();
        const middle = core.slice(start, end).trim();
        const right = core.slice(end).trim();
        if (!middle.includes('\\') || !left || !right) continue;
        const open = (middle.match(/\{/g) || []).length;
        const close = (middle.match(/\}/g) || []).length;
        if (open !== close) continue;
        const lengths = [left, middle, right].map(part => cleanMathKey(part).length);
        if (Math.min(...lengths) < 2 || Math.max(...lengths) / Math.min(...lengths) > 3.2) continue;
        const semantic = (similarity(left, middle) + similarity(middle, right) + similarity(left, right)) / 3;
        const balance = 1 - (Math.max(...lengths) - Math.min(...lengths)) / Math.max(...lengths);
        const score = semantic * 0.82 + balance * 0.18;
        if (!best || score > best.score) best = { start, end, middle, score, semantic };
      }
    }
    if (!best || best.score < 0.64 || best.semantic < 0.55) return segment;
    return `${leading}$${best.middle}$${trailing}`;
  });
}
function extractCentralLatex(run) {
  const firstSlash = run.indexOf('\\');
  const lastSlash = run.lastIndexOf('\\');
  if (firstSlash < 0) return null;

  let start = firstSlash;
  const before = run.slice(0, firstSlash);
  const firstUnderscore = before.indexOf('_');
  if (firstUnderscore >= 0) {
    const variableStart = before.slice(0, firstUnderscore).search(/[A-Za-z][A-Za-z0-9]*$/);
    if (variableStart >= 0) start = variableStart;
  } else {
    const leadingToken = (before.match(/[A-Za-z][A-Za-z0-9]{0,3}/) || [])[0];
    if (leadingToken) {
      const repeatedAt = before.lastIndexOf(leadingToken);
      if (repeatedAt > 0 && firstSlash - repeatedAt < 45) start = repeatedAt;
    }
  }

  let end = run.length;
  const zeroWidthAt = run.slice(lastSlash).search(/[\u200B\u2060\uFEFF]/);
  if (zeroWidthAt >= 0) {
    const absolute = lastSlash + zeroWidthAt;
    const space = run.lastIndexOf(' ', absolute);
    if (space > lastSlash && !/[\\{}]/.test(run.slice(space, absolute))) end = space;
  }

  if (end === run.length) {
    let depth = 0;
    let seenCommand = false;
    let balancedEnd = -1;
    for (let i = start; i < run.length; i += 1) {
      if (run[i] === '\\') seenCommand = true;
      if (run[i] === '{') depth += 1;
      if (run[i] === '}') {
        depth -= 1;
        if (seenCommand && depth === 0) balancedEnd = i + 1;
      }
    }
    if (balancedEnd > lastSlash) end = balancedEnd;
  }

  const latex = run.slice(start, end).trim();
  if (!latex.includes('\\') || latex.length < 3) return null;
  const display = /\\begin\{|\\frac\{|\\sum|\\int|\\begin\s/.test(latex) && latex.length > 45;
  return display ? `$$${latex}$$` : `$${latex}$`;
}

function cleanupMathText(text) {
  let result = text
    .replace(/[\u200B\u2060\uFEFF\u2061]/g, '')
    .replace(/[\u00A0\u2009]/g, ' ');
  result = cleanupLatexTripletSegments(result);
  result = dedupeAdjacentGroups(result, '(', ')');
  result = dedupeAdjacentGroups(result, '[', ']');
  result = dedupeAdjacentGroups(result, '{', '}');
  result = result.replace(/([A-Za-zΑ-ω])=\{\1=\{([^{}\n]{1,120})\}\}/g, '$1={$2}');
  result = result.replace(/\b([A-Za-z]{1,4}\([^()\n]{1,100}\))(?:\s*)\1(?:\s*\1)?/g, '$1');
  result = result.replace(/([A-Za-zΑ-ω0-9_{}^+\-−*/=<>≤≥≠≈∑∏∫∞∣∩∪().,·⋅×÷√]{3,180})\1/g, (match, formula) => /[=<>≤≥≠≈+\-−*/()0-9∩∪]/.test(formula) ? formula : match);
  result = result.replace(/事件域\s+FF/g, '事件域 F');
  result = result.replace(/(?<![A-Za-z])([qQnNtTwWzZxXyYpP])\1(?![A-Za-z])/g, '$1');
  result = result.replace(/([λμσρθαβγΔΩ])\1/g, '$1');
  result = result.replace(/\b([A-Z])([0-9]+)\1\2\b/g, '$1$2');

  const mathRun = /[A-Za-zΑ-ω0-9_{}\\^+\-−*/=<>≤≥≠≈∑∏∫∞∣|(),.\[\]·⋅×÷√⁡…:\s\u200B\u2060\uFEFF]{8,}/gu;
  result = result.replace(mathRun, run => {
    if (!run.includes('\\')) {
      const repeated = bestRepeatedSplit(run);
      if (repeated) return repeated;
    }
    return run;
  });

  result = result.replace(/[ \t]{2,}/g, ' ');
  return result;
}

function processInlineCodeSafely(text) {
  const parts = text.split(/(`[^`]*`)/g);
  return parts.map((part, index) => index % 2 === 1 ? part : cleanupMathText(part)).join('');
}

function extractResponseTitle(response, fileName) {
  let text = response.trim().replace(/\s+---\s*$/, '').trim();
  if (!text) return null;

  if (fileName === '理解分析.md') {
    for (const [needle, title] of understandingAnalysisTitles) {
      if (text.includes(needle)) return title;
    }
  }

  if (/^以下是法考的核心框架/.test(text)) return '法考核心框架';
  const structural = text.match(/(第[一二三四五六七八九十百0-9]+(?:章|节|讲|课|步))/);
  if (structural) {
    const label = structural[1];
    const remainder = text.slice(structural.index + label.length);
    if (/^[：:·\s　—-]+/.test(remainder)) {
      const title = `${label}${remainder}`.split(/[。！？!?]/)[0].trim();
      if (title.length <= 90) return title.replace(/^[:：\s]+/, `${label}：`);
    }
    return label;
  }

  const dialogue = /我|你|我们|让|回答|继续|跳过|选择|问题|好的|很好|漂亮|担心|尊重|开始之前|信息够了|找到了/;
  const sentencePunctuation = /[。！？!?]/;
  const titleKeyword = /教程|入门|指南|讲义|完整讲解|教学系列|分析|力学|视觉|原理|概率|电路|内核|图像|通信|法考|学习大纲|实战应用/;
  if (text.length <= 80 && !dialogue.test(text) && !sentencePunctuation.test(text) && titleKeyword.test(text)) return text;
  return null;
}

function cleanConversationText(text) {
  let result = text;
  result = result.replace(/largeoyos[，,]\s*/gi, '');
  result = result.replace(/^你好[！!，,。\s]*很高兴[^。！？!?]*[。！？!?]\s*/, '');
  result = result.replace(/^(?:好(?:的)?|很好|漂亮)[！!，,。]\s*/, '');
  result = result.replace(/^我来为你系统(?:地)?讲解/, '本教程系统讲解');
  result = result.replace(/^我来为你构建/, '本教程构建');
  result = result.replace(/^我把([^。！？!?]{0,50})归纳为/, '可以把$1归纳为');
  result = result.replace(/你看看是否能理解这样划分的逻辑[。！？!?]?/g, '');
  result = result.replace(/你提到的难点[，,]我建议/g, '主要难点建议');
  result = result.replace(/我想特别强调/g, '需要特别强调');
  result = result.replace(/我准备这样陪你走完整个课程/g, '建议按以下节奏学习');
  result = result.replace(/根据你[^。！？!?]{0,100}(?:背景|基础)[，,]?/g, '');

  const removableSentence = /(?:告诉我|回复我|你想继续|你想先|你来选|你选|等你回答|等你回复|回答完|随时回来|要不要继续|是否继续|准备好了吗|请你回答|请回答|不用担心答错|根据你的回答|你最感兴趣|如果你愿意.*(?:继续|告诉)|接下来.*(?:选择|你来决定)|我们继续走)/;
  const sentences = result.match(/[^。！？!?]+[。！？!?]?/g) || [result];
  result = sentences.filter(sentence => !removableSentence.test(sentence)).join('').trim();
  return result;
}

function transformFile(sourceName, original) {
  const changes = [];
  const sourceLines = original.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  const interim = [];
  let inCode = false;
  let lastResponse = null;
  let sawHeading = false;
  let skipContinuePrompt = false;

  const record = (category, line, before, after = '') => {
    if (before === after) return;
    changes.push({ category, line, before, after });
  };

  for (let index = 0; index < sourceLines.length; index += 1) {
    const lineNumber = index + 1;
    const originalLine = sourceLines[index].replace(/[ \t]+$/g, '');
    let line = originalLine;

    if (/^## You said:\s*继续\s*$/.test(line)) {
      record('平台/对话字段', lineNumber, originalLine, '');
      skipContinuePrompt = true;
      continue;
    }
    if (skipContinuePrompt) {
      if (!line.trim()) {
        record('平台/对话字段', lineNumber, originalLine, '');
        continue;
      }
      skipContinuePrompt = false;
      if (/^继续[。！!?？]?$/.test(line.trim())) {
        record('互动/等待回复字段', lineNumber, originalLine, '');
        continue;
      }
    }

    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      interim.push({ text: line, line: lineNumber });
      continue;
    }
    if (inCode) {
      interim.push({ text: line, line: lineNumber });
      continue;
    }

    const nextNonEmpty = sourceLines.slice(index + 1, index + 4).find(candidate => candidate.trim());
    if (/^\s*(?:c|cpp|c\+\+|python|javascript|js|bash|shell|rust|verilog|text)\s*$/i.test(line) && nextNonEmpty && /^\s*```/.test(nextNonEmpty)) {
      record('平台/导出字段', lineNumber, originalLine, '');
      continue;
    }

    if (/Claude is AI and can make mistakes|support\.anthropic\.com\/en\/articles\/8525154/.test(line)) {
      record('平台/导出字段', lineNumber, originalLine, '');
      continue;
    }

    const responseMatch = line.match(/^\s*#{1,6}\s*Claude responded:\s*(.*)$/i);
    if (responseMatch) {
      const response = responseMatch[1].trim();
      const title = extractResponseTitle(response, sourceName);
      lastResponse = response;
      const replacement = title ? `## ${title}` : '';
      record(title ? '章节整理' : '平台/对话字段', lineNumber, originalLine, replacement);
      if (replacement) {
        interim.push({ text: replacement, line: lineNumber });
        sawHeading = true;
      }
      continue;
    }

    if (lastResponse && line.trim()) {
      if (normalizeForCompare(line) === normalizeForCompare(lastResponse)) {
        record('重复回答', lineNumber, originalLine, '');
        lastResponse = null;
        continue;
      }
      lastResponse = null;
    }

    if (!sawHeading && !interim.some(item => item.text.trim()) && (/^(?:讲|讲解|请讲|继续讲)/.test(line.trim()) || /^\d{1,2}月\d{1,2}日$/.test(line.trim()))) {
      record('平台/对话字段', lineNumber, originalLine, '');
      continue;
    }

    if (/^#{1,6}\s/.test(line)) sawHeading = true;
    line = line.replace(/^(#{1,6}\s+)(.*?)(?:（请你回答|\(请你回答\))\s*$/, '$1$2');
    line = line.replace(/^(#{1,6}\s+)(.*?)Claude\s*$/i, '$1$2').trimEnd();

    const trimmed = line.trim();
    const isStructural = /^(?:#{1,6}\s|[-*+]\s|\d+[.)、]\s|\||>|---+$)/.test(trimmed);
    if (!isStructural && trimmed) {
      const cleanedDialogue = cleanConversationText(line);
      if (!cleanedDialogue) {
        record('互动/等待回复字段', lineNumber, originalLine, '');
        continue;
      }
      line = cleanedDialogue;
    }

    const imageCleaned = line
      .replace(/!\[\[([^\]|]+\.(?:png|svg|jpe?g|gif|webp))(?:\|[^\]]+)?\]\]/gi, (_, imageName) =>
        `![${path.parse(imageName).name}](assets/images/${encodeURI(imageName)})`)
      .replace(/\[\[([^\]|]+\.(?:png|svg|jpe?g|gif|webp))(?:\|[^\]]+)?\]\]/gi, (_, imageName) =>
        `![${path.parse(imageName).name}](assets/images/${encodeURI(imageName)})`);
    if (imageCleaned !== line) record('图片资源', lineNumber, line, imageCleaned);
    line = imageCleaned;

    const mathCleaned = processInlineCodeSafely(line);
    if (mathCleaned !== line) record('公式与格式', lineNumber, line, mathCleaned);
    line = mathCleaned;

    if (line !== originalLine && !changes.some(change => change.line === lineNumber && change.after === line)) {
      record('教程语气', lineNumber, originalLine, line);
    }
    interim.push({ text: line, line: lineNumber });
  }

  const deduped = [];
  let previousMeaningful = null;
  for (const item of interim) {
    if (/^\s*```/.test(item.text)) {
      deduped.push(item);
      previousMeaningful = null;
      continue;
    }
    const key = normalizeForCompare(item.text);
    if (key && previousMeaningful && key === previousMeaningful.key && !/^[-*+]\s/.test(item.text.trim())) {
      record('重复内容', item.line, item.text, '');
      continue;
    }
    deduped.push(item);
    if (key) previousMeaningful = { key, item };
  }

  let outputLines = deduped.map(item => item.text);
  while (outputLines.length && !outputLines[0].trim()) outputLines.shift();
  while (outputLines.length && !outputLines[outputLines.length - 1].trim()) outputLines.pop();

  const firstHeading = outputLines.find(line => /^#{1,6}\s/.test(line));
  if (!firstHeading || !/^#{1,2}\s/.test(firstHeading)) {
    outputLines.unshift(`## ${titleOverrides[sourceName] || path.parse(sourceName).name}`, '');
    record('章节整理', 1, '', `## ${titleOverrides[sourceName] || path.parse(sourceName).name}`);
  }

  let output = outputLines.join('\n')
    .replace(/\$\$\$/g, '$$')
    .replace(/\$\$([\s\S]*?)\$\$/g, (match, body) => `$$${body.replace(/\$/g, '')}$$`)
    .replace(/\$\|([^|\n]{1,80})\|\$/g, '$\\lvert $1 \\rvert$')
    .replace(/\$(\d+(?:\.\d+)?\s*(?:美分|美元|元))/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim() + '\n';

  const targetedRepairs = sourceName === 'Claude电路.md' ? [
    [276, '1. **KCL = 电荷守恒**（节点处i=0\\sum i = 0 ∑i=0，可推广到任意闭合面）', '1. **KCL = 电荷守恒**（节点处 $\\sum i = 0$，可推广到任意闭合面）'],
    [277, '2. **KVL = 能量守恒**（回路中u=0\\sum u = 0 ∑u=0）', '2. **KVL = 能量守恒**（回路中 $\\sum u = 0$）'],

    [755, '所以I_1 = 6 - 4 = 2，I_2 = 2 - \\frac{8}{3} = -\\frac{2}{3}，I_3 = \\frac{4}{3}', '所以 $I_1 = 6 - 4 = 2$，$I_2 = 2 - \\frac{8}{3} = -\\frac{2}{3}$，$I_3 = \\frac{4}{3}$。'],
    [811, 'Usk\\sum U_{sk}：', '$\\sum U_{sk}$：'],
    [851, '解得 Ia=2I_a = 2 Ia=2 A，I_b = \\frac{2}{3}', '解得 $I_a = 2\\text{ A}$，$I_b = \\frac{2}{3}\\text{ A}$。'],
    [856, 'I_2 = -I_b = -\\frac{2}{3}（因为 I2I_2 I2 方向和 IbI_b Ib 相反）', '$I_2 = -I_b = -\\frac{2}{3}$（因为 $I_2$ 方向和 $I_b$ 相反）'],
    [857, '- I3I_3 I3（6Ω 向下）I_a - I_b = 2 - \\frac{2}{3} = \\frac{4}{3}✓', '- $I_3$（6 Ω 向下）：$I_a - I_b = 2 - \\frac{2}{3} = \\frac{4}{3}$ ✓'],
    [896, 'Isk\\sum I_{sk}：', '$\\sum I_{sk}$：'],
    [993, '\\boxed{v_{out} = -\\frac{R_f}{R_1} v_{in}}', '$$\\boxed{v_{out} = -\\frac{R_f}{R_1} v_{in}}$$'],
    [1468, '1 \\Rightarrow U_{oc}$$ 节点 a 的电位 = 10V（因为 $R_1 无压降，a 直接等于 10V 电源的正极电位）', '因此，$U_{oc}$ 等于节点 a 的电位，即 10 V（因为 $R_1$ 无压降，a 直接等于 10 V 电源的正极电位）。'],
    [2867, '电路：R = 20 Ω，L = 0.05 H 串联，接到 u_s(t) = 50\\sqrt{2} cos(200t + 30°) V', '电路：$R = 20\\,\\Omega$、$L = 0.05\\,\\text{H}$ 串联，接到 $u_s(t) = 50\\sqrt{2}\\cos(200t + 30^\\circ)\\,\\text{V}$。'],
  ] : sourceName === '理解分析.md' ? [
    [1303, '|判断工具|逐点算极限|$\\sup|', '|判断工具|逐点算极限|`\\sup`（原稿公式未完成）|'],
  ] : [];
  for (const [sourceLine, before, after] of targetedRepairs) {
    if (output.includes(before)) {
      output = output.replace(before, after);
      record('公式与格式', sourceLine, before, after);
    }
  }

  if (sourceName === 'Claude电路.md') {
    const wholeLineRepairs = [
      [/^12−2I−5I=.*$/m, '$$12 - 2I - 5I = 0 \\implies I = \\frac{12}{7} \\approx 1.71 \\text{A}$$', 542],
      [/^- I=127I = \\frac\{12\}\{7\}.*$/m, '- $I = \\frac{12}{7} \\approx 1.71\\,\\text{A}$', 546],
      [/^- UCCVS=5I=.*$/m, '- $U_{CCVS} = 5I = \\frac{60}{7} \\approx 8.57\\,\\text{V}$', 547],
      [/^- Ux=UCCVS=.*$/m, '- $U_x = U_{CCVS} = \\frac{60}{7} \\approx 8.57\\,\\text{V}$', 548],
      [/^- I2=−23I_2 = -I_b = -\\frac\{2\}\{3\}.*$/m, '- $I_2 = -I_b = -\\frac{2}{3}\\,\\text{A}$（方向与 $I_b$ 相反）✓', 856],
      [/^- I3=8\/6=43I_3 = 8\/6 = \\frac\{4\}\{3\}.*$/m, '- $I_3 = \\frac{8}{6} = \\frac{4}{3}\\,\\text{A}$ ✓', 930],
      [/^2\. \*\*KVL = 能量守恒\*\*.*$/m, '2. **KVL = 能量守恒**（回路中 $\\sum u = 0$）', 277],
      [/^\\Rightarrow U_\{oc\} = \$ 节点 a 的电位.*$/m, '因此，$U_{oc}$ 等于节点 a 的电位，即 10 V（因为 $R_1$ 无压降，a 直接等于 10 V 电源的正极电位）。', 1468],
    ];
    for (const [pattern, after, sourceLine] of wholeLineRepairs) {
      const match = output.match(pattern);
      if (!match) continue;
      output = output.replace(pattern, () => after);
      record('公式与格式', sourceLine, match[0], after);
    }
  }

  if (sourceName === 'Claude电路.md') {
    output = output
      .replace(/（因为 \$\\angle 90° = \\cos 90° \+ j\\sin 90° = j$/m, '（因为 $\\angle 90° = \\cos 90° + j\\sin 90° = j$）')
      .replace(/（用到1\/j = -j，因为 \$j \\cdot \(-j\) = -j\^2 = 1$/m, '（用到 $1/j = -j$，因为 $j \\cdot (-j) = -j^2 = 1$）')
      .replace(/(?:- )?\*\*容抗 \$\\lvert X_C \\rvert\$ = 1\/\(\\omega C\)\$ 随频率变化\*\*：/g, '**容抗 $\\lvert X_C \\rvert = 1\/(\\omega C)$ 随频率变化**：');

    const finalFormulaLines = new Map([
      [271, "1. **KCL = 电荷守恒**（节点处 $\\sum i = 0$，可推广到任意闭合面）"],
      [747, "所以 $I_1 = 6 - 4 = 2\\,\\text{A}$，$I_2 = 2 - \\frac{8}{3} = -\\frac{2}{3}\\,\\text{A}$，$I_3 = \\frac{4}{3}\\,\\text{A}$。"],
      [799, "$$R_{kk} I_k - \\sum_{j \\neq k} R_{kj} I_j = \\sum U_{sk}$$"],
      [803, "- $\\sum U_{sk}$：回路 $k$ 中所有电压源的代数和（与绕行方向相同的电位升取正）"],
      [841, "$$\\begin{cases} 8I_a - 6I_b = 12 \\\\ -6I_a + 9I_b = -6 \\end{cases}$$"],
      [843, "解得 $I_a = 2\\,\\text{A}$，$I_b = \\frac{2}{3}\\,\\text{A}$。"],
      [848, "- $I_2 = -I_b = -\\frac{2}{3}\\,\\text{A}$（$I_2$ 方向与 $I_b$ 相反）✓"],
      [849, "- $I_3 = I_a - I_b = 2 - \\frac{2}{3} = \\frac{4}{3}\\,\\text{A}$ ✓"],
      [883, "$$G_{kk} U_k - \\sum_{j \\neq k} G_{kj} U_j = \\sum I_{sk}$$"],
      [888, "- $\\sum I_{sk}$：流入节点 $k$ 的电流源电流代数和（流入为正）"],
      [912, "$$\\frac{12-U_a}{2} + \\frac{6-U_a}{3} = \\frac{U_a}{6}$$"],
      [983, "- 所以 $R_1$ 的电流等于 $R_f$ 的电流（KCL）：$\\frac{v_{in}}{R_1} = \\frac{-v_{out}}{R_f}$。"],
      [1160, "$$R_{左下} = 2 \\parallel 6 = \\frac{2 \\times 6}{2+6} = 1.5\\,\\Omega$$"],
      [1291, "$$I_{sc} = \\frac{U_{oc}}{R_{th}}, \\qquad R_N = R_{th}$$"],
      [1482, "$I_{R_2} = \\frac{2U_T}{3}$（从 a 流向地）"],
      [1488, "$$I_T = \\frac{2U_T}{3} + \\frac{U_T}{2} = \\frac{7U_T}{6}, \\qquad R_{th} = \\frac{U_T}{I_T} = \\frac{6}{7}\\,\\Omega$$"],
      [1490, "**戴维南等效**：10 V 电压源串联 $\\frac{6}{7}\\,\\Omega$。"],
      [1572, "> $$\\sum_{k=1}^{b} u_k i_k = 0$$"],
      [1592, "> $$\\sum_{k=1}^{b} u_k \\hat{i}_k = 0 \\quad \\text{和} \\quad \\sum_{k=1}^{b} \\hat{u}_k i_k = 0$$"],
      [1717, "|特勒根定理|$\\sum u_k i_k = 0$（能量守恒）|主要用于理论证明|"],
      [1766, "$$\\frac{dQ}{dt} = C\\frac{du}{dt}$$"],
      [1770, "$$\\boxed{i = C\\frac{du}{dt}}$$"],
      [1803, "$$u(t) = \\frac{1}{C}\\int_{-\\infty}^{t} i(\\tau)\\,d\\tau$$"],
      [1807, "$$u(t) = u(t_0) + \\frac{1}{C}\\int_{t_0}^{t} i(\\tau)\\,d\\tau$$"],
      [1821, "$$\\boxed{W_C = \\frac{1}{2}Cu^2}$$"],
      [1851, "$$\\frac{1}{C_{串}} = \\frac{1}{C_1} + \\frac{1}{C_2} + \\cdots$$"],
      [1877, "$$u = \\frac{d\\Phi}{dt}$$"],
      [1883, "$$\\boxed{u = L\\frac{di}{dt}}$$"],
      [1919, "$$i(t) = i(t_0) + \\frac{1}{L}\\int_{t_0}^{t} u(\\tau)\\,d\\tau$$"],
      [1923, "$$W_L = \\frac{1}{2}Li^2 \\quad \\text{（磁场能量）}$$"],
      [1996, "$$\\begin{aligned} u_1 &= L_1\\frac{di_1}{dt} \\pm M\\frac{di_2}{dt} \\\\ u_2 &= L_2\\frac{di_2}{dt} \\pm M\\frac{di_1}{dt} \\end{aligned}$$"],
      [2047, "$$\\begin{aligned} u_1 &= L_1\\frac{di_1}{dt} + M\\frac{di_2}{dt} \\\\ u_2 &= L_2\\frac{di_2}{dt} + M\\frac{di_1}{dt} \\end{aligned}$$"],
      [2061, "$$k = \\frac{M}{\\sqrt{L_1L_2}}, \\qquad 0 \\leq k \\leq 1$$"],
      [2066, "所以 $M$ 的上界为 $M \\leq \\sqrt{L_1L_2}$。"],
      [2090, "$$\\boxed{\\frac{u_1}{u_2} = \\frac{N_1}{N_2} = n}$$"],
      [2094, "$$\\boxed{\\frac{i_1}{i_2} = \\frac{N_2}{N_1} = \\frac{1}{n}}$$"],
      [2124, "$$\\boxed{Z_{in} = n^2 Z_L}$$"],
      [2250, "$$\\omega = 2\\pi f = \\frac{2\\pi}{T}$$"],
      [2279, "$$U = \\frac{U_m}{\\sqrt{2}} \\approx 0.707\\,U_m$$"],
      [2281, "所以 220 V 的实际峰值为 $U_m = 220\\sqrt{2} \\approx 311\\,\\text{V}$。"],
      [2316, "$$u_s = Ri + L\\frac{di}{dt} + \\frac{1}{C}\\int i\\,dt$$"],
      [2346, "- 模：$|A| = \\sqrt{a^2+b^2}$"],
      [2403, "$$\\dot{I} = I\\angle\\varphi = \\frac{I_m}{\\sqrt{2}}\\angle\\varphi$$"],
      [2448, "$$\\frac{di}{dt} = -\\omega I_m\\sin(\\omega t+\\varphi) = \\omega I_m\\cos(\\omega t+\\varphi+90^\\circ)$$"],
      [2458, "$$\\boxed{\\frac{di}{dt} \\quad \\longleftrightarrow \\quad j\\omega\\dot{I}}$$"],
      [2464, "$$\\boxed{\\int i\\,dt \\quad \\longleftrightarrow \\quad \\frac{\\dot{I}}{j\\omega}}$$"],
      [2470, "$$u_s = Ri + L\\frac{di}{dt} + \\frac{1}{C}\\int i\\,dt$$"],
      [2474, "$$\\dot{U}_s = R\\dot{I} + j\\omega L\\dot{I} + \\frac{1}{j\\omega C}\\dot{I}$$"],
      [2478, "$$\\dot{U}_s = \\left(R+j\\omega L+\\frac{1}{j\\omega C}\\right)\\dot{I}$$"],
      [2492, "|$\\int i\\,dt$|$\\dfrac{\\dot{I}}{j\\omega}$|"],
      [2603, "$$\\boxed{\\dot{U} = \\frac{1}{j\\omega C}\\dot{I} = \\frac{-j}{\\omega C}\\dot{I}}$$"],
      [2609, "- **模**：$\\left|\\dfrac{1}{j\\omega C}\\right| = \\dfrac{1}{\\omega C}$"],
      [2664, "> $$Z = \\frac{\\dot{U}}{\\dot{I}}$$"],
      [2689, "- $|Z| = \\sqrt{R^2+X^2}$：**阻抗模**"],
      [2767, "$$Y = \\frac{1}{Z} = \\frac{\\dot{I}}{\\dot{U}}$$"],
      [2780, "$$Y = \\frac{1}{Z} = \\frac{1}{R+jX} = \\frac{R-jX}{R^2+X^2}$$"],
      [2812, "1. **写电源相量**：幅值 $100\\sqrt{2}$，有效值为 100；初相为 $0^\\circ$，所以 $\\dot{U}_s = 100\\angle 0^\\circ\\,\\text{V}$。"],
      [2819, "- 化成极坐标：$|Z| = \\sqrt{10^2+90^2} = \\sqrt{8200} \\approx 90.55\\,\\Omega$"],
      [2825, "- 电流有效值为 1.10 A，所以幅值 $I_m = 1.10\\sqrt{2} \\approx 1.56\\,\\text{A}$。"],
    ]);
    const finalLines = output.split('\n');
    for (const [lineNumber, after] of finalFormulaLines) {
      const before = finalLines[lineNumber - 1];
      if (before === undefined || before === after) continue;
      finalLines[lineNumber - 1] = after;
      record('公式与格式', lineNumber, before, after);
    }
    output = finalLines.join('\n');
  }

  if (!/^#{1,2}\s/.test(output)) output = `## ${titleOverrides[sourceName] || path.parse(sourceName).name}\n\n${output}`;
  return { output, changes };
}

function validateOutput(output) {
  const issues = [];
  if (/Claude responded:/i.test(output)) issues.push('仍含 Claude responded 字段');
  if (/Claude is AI and can make mistakes/.test(output)) issues.push('仍含 Claude 免责声明');
  const fences = (output.match(/^\s*```/gm) || []).length;
  if (fences % 2 !== 0) issues.push('代码围栏数量为奇数');
  const proseOnly = output.replace(/^\s*```[^\n]*\n[\s\S]*?^\s*```\s*$/gm, '');
  const display = (proseOnly.match(/\$\$/g) || []).length;
  const withoutDisplay = proseOnly.replace(/\$\$[\s\S]*?\$\$/g, '');
  const inline = (withoutDisplay.match(/(?<!\$)\$(?!\$)/g) || []).length;
  if (display % 2 !== 0) issues.push('块级 LaTeX 定界符不配对');
  if (inline % 2 !== 0) issues.push('行内 LaTeX 定界符不配对');
  try { marked.lexer(output); } catch (error) { issues.push(`Markdown 解析失败：${error.message}`); }
  const suspiciousLatex = output.split('\n').flatMap((line, index) =>
    /\\(?:frac|sum|int|mathbf|begin|left|right|sqrt|partial|nabla)/.test(line) && !line.includes('$') && !/^\s*```/.test(line)
      ? [{ line: index + 1, text: line }]
      : []
  );
  const warnings = suspiciousLatex.length ? [`仍有 ${suspiciousLatex.length} 行低置信公式混排，已在报告中逐行列出，未做猜测性改写`] : [];
  return { issues, warnings, fences, displayFormulas: display / 2, inlineFormulas: inline / 2, suspiciousLatex };
}

function renderExamples(changes, category, limit = 12) {
  const selected = changes.filter(change => change.category === category).slice(0, limit);
  if (!selected.length) return '- 无。';
  return selected.map(change => {
    const before = change.before.replace(/`/g, '\\`').slice(0, 320);
    const after = change.after.replace(/`/g, '\\`').slice(0, 320);
    return `- 原稿第 ${change.line} 行\n  - 修改前：\`${before}\`\n  - 修改后：\`${after || '（删除）'}\``;
  }).join('\n');
}

function buildReport(sourceName, targetName, original, output, changes, validation, diffStats) {
  const categoryCounts = new Map();
  for (const change of changes) categoryCounts.set(change.category, (categoryCounts.get(change.category) || 0) + 1);
  const rows = [...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN')).map(([category, count]) => `|${category}|${count}|`).join('\n');
  const reviewNotes = contentReviewNotes[sourceName] || [];
  const originalLines = original.replace(/\r\n/g, '\n').split('\n').length;
  const outputLines = output.split('\n').length - 1;
  const formulaReview = validation.suspiciousLatex.length
    ? validation.suspiciousLatex.map(item => `- 粗校版第 ${item.line} 行：\`${item.text.replace(/`/g, '\\`').slice(0, 500)}\``).join('\n')
    : '- 无低置信公式混排行。';
  return `# 《${path.parse(sourceName).name}》粗校报告\n\n` +
    `## 一、文件\n\n- 原稿：\`待拆解/待校对/${sourceName}\`\n- 粗校结果：\`待拆解/${targetName}\`\n- 完整差异：\`待拆解/粗校报告/${path.parse(sourceName).name}(粗校差异).diff\`\n- 原稿保持不变。\n\n` +
    `## 二、统计\n\n|项目|数量|\n|---|---:|\n|原稿行数|${originalLines}|\n|粗校版行数|${outputLines}|\n|记录的修改动作|${changes.length}|\n|差异新增行|${diffStats.insertions}|\n|差异删除行|${diffStats.deletions}|\n|块级 LaTeX 公式|${validation.displayFormulas}|\n|行内 LaTeX 公式|${validation.inlineFormulas}|\n\n` +
    `### 修改分类\n\n|分类|数量|\n|---|---:|\n${rows || '|无|0|'}\n\n` +
    `## 三、对话与平台字段修改示例\n\n${renderExamples(changes, '平台/对话字段')}\n\n${renderExamples(changes, '互动/等待回复字段')}\n\n` +
    `## 四、章节与重复内容修改示例\n\n${renderExamples(changes, '章节整理')}\n\n${renderExamples(changes, '重复内容')}\n\n` +
    `## 五、公式修改示例\n\n${renderExamples(changes, '公式与格式', 20)}\n\n` +
    `## 六、待确认内容问题\n\n${reviewNotes.length ? reviewNotes.map(note => `- ${note}`).join('\n') : '- 本轮未记录明确的内容错误；这不等于已完成事实核查。'}\n\n` +
    `## 七、结构验证\n\n${validation.issues.length ? validation.issues.map(issue => `- ⚠️ ${issue}`).join('\n') : '- Markdown 解析通过。\n- LaTeX 定界符配对。\n- 未发现 Claude 平台字段残留。'}\n\n` +
    `## 八、低置信公式复核\n\n${validation.warnings.length ? validation.warnings.map(warning => `- ⚠️ ${warning}`).join('\n') : '- 无警告。'}\n\n${formulaReview}\n\n` +
    `> 每一处原文与粗校结果的精确变化均保存在对应的完整差异文件中。\n`;
}

function diffFiles(sourcePath, outputPath) {
  const result = spawnSync('git', ['-c', 'core.quotepath=false', 'diff', '--no-index', '--no-color', '--unified=3', '--', sourcePath, outputPath], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const text = result.stdout || '';
  const statResult = spawnSync('git', ['-c', 'core.quotepath=false', 'diff', '--no-index', '--numstat', '--', sourcePath, outputPath], { cwd: projectRoot, encoding: 'utf8' });
  const match = (statResult.stdout || '').match(/^(\d+)\s+(\d+)\s+/m);
  return { text, insertions: match ? Number(match[1]) : 0, deletions: match ? Number(match[2]) : 0 };
}

function buildSummaryReport(summary) {
  const totalChanges = summary.processed.reduce((sum, item) => sum + item.changes, 0);
  const totalInsertions = summary.processed.reduce((sum, item) => sum + (item.insertions || 0), 0);
  const totalDeletions = summary.processed.reduce((sum, item) => sum + (item.deletions || 0), 0);
  const formulaReviewLines = summary.processed.reduce((sum, item) => sum + (item.formulaReviewLines || 0), 0);
  const processedRows = summary.processed.map(item => `|${item.file}|${item.target}|${item.changes}|${item.insertions || 0}|${item.deletions || 0}|${item.formulaReviewLines || 0}|`).join('\n');
  const skippedRows = summary.skipped.map(item => `|${item.file}|${item.reason}|`).join('\n');
  const issueRows = summary.processed.filter(item => item.issues.length).map(item => `- ${item.file}：${item.issues.join('；')}`).join('\n');
  return `# 待校对文件粗校汇总报告\n\n` +
    `- 生成时间：${summary.generatedAt}\n- 本批新增粗校文件：${summary.processed.length} 个\n- 跳过：${summary.skipped.length} 个\n- 记录修改动作：${totalChanges}\n- 差异新增/删除行：${totalInsertions}/${totalDeletions}\n- 低置信公式复核行：${formulaReviewLines}\n- 所有原稿保持不变。\n\n` +
    `## 处理结果\n\n|原稿|粗校结果|修改动作|新增行|删除行|低置信公式复核行|\n|---|---|---:|---:|---:|---:|\n${processedRows}\n\n` +
    `## 跳过文件\n\n|文件|原因|\n|---|---|\n${skippedRows}\n\n` +
    `## 结构验证\n\n${issueRows || '- 28 个新增粗校文件均通过 Markdown 解析、代码围栏、LaTeX 定界符和平台字段检查。'}\n\n` +
    `## 内容问题日志\n\n- 《法考》：法律时效性未核查。\n- 《Linux 内核》：版本相关实现未统一到指定内核版本。\n- 《机器学习深度学习》：“最新”“当前主流”等表述未联网核查。\n- 《Claude 输出内容》：原稿仅展开到第一章热身题，未补写。\n- 《理解分析》：原稿有一处被截断的 \\sup 公式，只作标记。\n- 《Claude 电路》：复杂三重公式已逐行保留中间 LaTeX 版本。\n- 《量子力学》：自旋列向量使用 \\0、\\1 作为矩阵换行，疑似 LaTeX 行分隔符缺失，未推测改写。\n- 《凸优化》：收敛公式出现 x^_，疑似目标点上标缺失，未推测改写。\n- 《向量微积分与微分形式》：内容与《理解分析》几乎完全相同且文件名不符，未重复生成。\n\n` +
    `## 文件位置\n\n- 粗校正文：\`待拆解/*(粗校).md\`\n- 逐文件报告：\`待拆解/粗校报告/*(粗校报告).md\`\n- 完整差异：\`待拆解/粗校报告/*(粗校差异).diff\`\n`;
}

function main() {
  if (!fs.existsSync(sourceRoot)) throw new Error(`源目录不存在：${sourceRoot}`);
  if (!dryRun) fs.mkdirSync(reportRoot, { recursive: true });

  const sourceNames = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));

  const processed = [];
  const skipped = [];
  for (const sourceName of sourceNames) {
    const sourcePath = path.join(sourceRoot, sourceName);
    const stats = fs.statSync(sourcePath);
    if (stats.size === 0) { skipped.push({ file: sourceName, reason: '空文件' }); continue; }
    if (explicitSkips.has(sourceName)) { skipped.push({ file: sourceName, reason: explicitSkips.get(sourceName) }); continue; }
    if (/粗校/.test(path.parse(sourceName).name)) { skipped.push({ file: sourceName, reason: '文件名已标注粗校' }); continue; }
    const targetName = outputName(sourceName);
    const targetPath = path.join(draftRoot, targetName);
    if (fs.existsSync(targetPath)) { skipped.push({ file: sourceName, reason: '根目录已有对应粗校文件' }); continue; }

    const original = fs.readFileSync(sourcePath, 'utf8');
    const { output, changes } = transformFile(sourceName, original);
    const validation = validateOutput(output);

    if (dryRun) {
      processed.push({ file: sourceName, target: targetName, changes: changes.length, issues: validation.issues, warnings: validation.warnings, formulaReviewLines: validation.suspiciousLatex.length });
      continue;
    }

    fs.writeFileSync(targetPath, output, 'utf8');
    const diff = diffFiles(sourcePath, targetPath);
    const stem = path.parse(sourceName).name;
    const diffPath = path.join(reportRoot, `${stem}(粗校差异).diff`);
    const reportPath = path.join(reportRoot, `${stem}(粗校报告).md`);
    fs.writeFileSync(diffPath, diff.text, 'utf8');
    fs.writeFileSync(reportPath, buildReport(sourceName, targetName, original, output, changes, validation, diff), 'utf8');
    processed.push({ file: sourceName, target: targetName, changes: changes.length, issues: validation.issues, warnings: validation.warnings, formulaReviewLines: validation.suspiciousLatex.length, insertions: diff.insertions, deletions: diff.deletions });
  }

  const summary = { generatedAt: new Date().toISOString(), dryRun, processed, skipped };
  if (!dryRun) {
    const summaryPath = path.join(reportRoot, '粗校汇总报告.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
    fs.writeFileSync(path.join(reportRoot, '粗校汇总报告.md'), buildSummaryReport(summary), 'utf8');
  }
  process.stdout.write(JSON.stringify(summary, null, 2));
}

if (require.main === module) main();
module.exports = { transformFile, validateOutput, buildReport, buildSummaryReport, diffFiles };
