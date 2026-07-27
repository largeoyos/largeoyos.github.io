const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reportPath = path.join(sourceDir, '粗校报告', '严格复校公式清理记录-v2.json');
const dryRun = process.argv.includes('--dry-run');

const files = fs.readdirSync(sourceDir)
  .filter(name => name.includes('(粗校)') && name.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

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
    .replace(/\\(?:Longleftrightarrow|Leftrightarrow|leftrightarrow)/g, '⇔')
    .replace(/\\subseteq/g, '⊆')
    .replace(/\\subsetneq/g, '⊊')
    .replace(/\\subset/g, '⊂')
    .replace(/\\notin/g, '∉')
    .replace(/\\in/g, '∈')
    .replace(/\\emptyset/g, '∅')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\models/g, '⊨')
    .replace(/\\uparrow/g, '↑')
    .replace(/\\downarrow/g, '↓')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\mid/g, '∣')
    .replace(/\\ldots|\\cdots/g, '…')
    .replace(/\\varphi/g, 'φ')
    .replace(/\\varepsilon/g, 'ε')
    .replace(/\\Gamma/g, 'Γ')
    .replace(/\\Sigma/g, 'Σ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\lceil|\\rceil|\\quad|\\qquad|\\,/g, '')
    .replace(/\\(?:leq|le)/g, '≤')
    .replace(/\\(?:geq|ge)/g, '≥')
    .replace(/\\to/g, '→')
    .replace(/\\(?:lor|vee)/g, '∨')
    .replace(/\\(?:land|wedge)/g, '∧')
    .replace(/\\neg/g, '¬')
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

function cleanupLatexTripletSegments(text) {
  return text.replace(/[^\p{Script=Han}，。；：！？“”\n]+/gu, segment => {
    if (!segment.includes('\\') || segment.includes('$') || segment.length < 8 || segment.length > 700) return segment;
    const leading = (segment.match(/^\s*(?:(?:>\s*)+|(?:[-+*]|\d+\.)\s+)?/) || [''])[0];
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
        const leftMiddle = similarity(left, middle);
        const middleRight = similarity(middle, right);
        const leftRight = similarity(left, right);
        const semantic = (leftMiddle + middleRight + leftRight) / 3;
        const balance = 1 - (Math.max(...lengths) - Math.min(...lengths)) / Math.max(...lengths);
        const score = semantic * 0.82 + balance * 0.18;
        if (!best || score > best.score) best = { middle, score, semantic, leftMiddle, middleRight, leftRight };
      }
    }
    if (!best || best.leftRight < 0.82 || Math.max(best.leftMiddle, best.middleRight) < 0.35) return segment;
    return `${leading}$${best.middle}$${trailing}`;
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
  if (best.kind === 'double' && best.score >= 0.995) return best.parts[0].trim();
  return null;
}

function collapsePlainDuplicates(text) {
  const brandSentinel = '\uE000品牌占位\uE001';
  const engineeringSentinel = '\uE002电子工程占位\uE003';
  const denyRepeatedTokens = new Set(['QQ', 'SS', 'TT', 'FF', 'II', 'XX', 'YY', 'ZZ', 'PPP', 'www', 'MCMC', 'IEEE', 'COCO', 'ISIS', 'TFTF', 'XXX', 'YYY', 'ZZZ']);
  const collapseIdentifier = (match, identifier) => denyRepeatedTokens.has(match) || /^[TF]+$/.test(match) || /^I{2,4}$/.test(match) ? match : identifier;
  let result = text
    .replace(/QQ 好友/g, brandSentinel)
    .replace(/EE(?=\s*(?:和\s*CS|工程))/g, engineeringSentinel)
    .replace(/[\u200B\u2060\uFEFF\u2061]/g, '');
  result = result.replace(/(\b[A-Za-z][A-Za-z0-9_]*\([^()\n]{1,100}\))\1(?:\1)?/g, '$1');
  result = result.replace(/(?<![A-Za-z0-9Α-ω])([A-Za-z0-9]{0,8}[Α-ω][A-Za-z0-9]{0,8})\1(?:\1)?(?![A-Za-z0-9Α-ω])/gu, '$1');
  result = result.replace(/(?<![A-Za-z0-9_])([A-Za-z][A-Za-z0-9_]{0,11})\1(?:\1)?(?![A-Za-z0-9_])/g, collapseIdentifier);
  result = result.replace(/(?<![A-Za-z0-9_])([0-9]+[A-Za-z][A-Za-z0-9_]{0,10})\1(?:\1)?(?![A-Za-z0-9_])/g, collapseIdentifier);
  const mathRun = /[A-Za-zΑ-ω0-9_{}^+\-−*/=<>≤≥≠≈∑∏∫∞∣|(),.\[\]·⋅×÷√⁡…:\s]{8,}/gu;
  result = result.replace(mathRun, run => {
    const repeated = bestRepeatedSplit(run);
    return repeated && repeated.length <= run.trim().length * 0.72 ? repeated : run;
  });
  return result.replace(brandSentinel, 'QQ 好友').replaceAll(engineeringSentinel, 'EE');
}

function cleanTextPart(text) {
  let result = cleanupLatexTripletSegments(text);
  result = collapsePlainDuplicates(result);
  return result;
}

function cleanLine(line) {
  const parts = line.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/\S+|`[^`]*`|"[^"\n]*"|“[^”\n]*”|'[^'\n]*'|\$(?!\$).*?(?<!\\)\$)/g);
  return parts.map((part, index) => index % 2 === 1 ? part : cleanTextPart(part)).join('');
}

function isMeaningfulChange(before, after) {
  const normalizedBefore = before.replace(/[\u200B\u2060\uFEFF\u2061]/g, '').replace(/[\u00A0\u2009]/g, ' ');
  const normalizedAfter = after.replace(/[\u200B\u2060\uFEFF\u2061]/g, '').replace(/[\u00A0\u2009]/g, ' ');
  if (normalizedBefore === normalizedAfter) return false;
  const countText = (value, needle) => value.split(needle).length - 1;
  const balance = (value, open, close) => countText(value, open) - countText(value, close);
  const markdownPrefix = value => (value.match(/^\s*(?:(?:>\s*)+|(?:[-+*]|\d+\.)\s+)/) || [''])[0];
  if (markdownPrefix(before) !== markdownPrefix(after)) return false;
  if (countText(before, '|') !== countText(after, '|')) return false;
  if (countText(before, '**') !== countText(after, '**')) return false;
  if (balance(before, '(', ')') !== balance(after, '(', ')')) return false;
  if (balance(before, '（', '）') !== balance(after, '（', '）')) return false;
  if (balance(before, '[', ']') !== balance(after, '[', ']')) return false;
  const addedMathDelimiter = (normalizedAfter.match(/\$/g) || []).length > (normalizedBefore.match(/\$/g) || []).length;
  if (addedMathDelimiter) {
    const insertedMath = [...normalizedAfter.matchAll(/\$([^$]+)\$/g)].map(match => match[1]);
    const malformed = insertedMath.some(formula => {
      if (/^[}\])]|[{[(]$/.test(formula.trim())) return true;
      if (/(?:\\[A-Za-z]+|[=<>+*/→⇔∧∨¬\x2d])$/.test(formula.trim())) return true;
      let depth = 0;
      for (const char of formula) {
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        if (depth < 0) return true;
      }
      return depth !== 0;
    });
    if (malformed) return false;
  }
  return addedMathDelimiter || normalizedAfter.length < normalizedBefore.length;
}

function transform(input) {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const output = [];
  const changes = [];
  let inCode = false;
  let inDisplayMath = false;
  lines.forEach((sourceLine, index) => {
    if (/^\s*```/.test(sourceLine)) {
      inCode = !inCode;
      output.push(sourceLine);
      return;
    }
    if (inCode) {
      output.push(sourceLine);
      return;
    }
    const displayCount = (sourceLine.match(/\$\$/g) || []).length;
    const wasInDisplay = inDisplayMath;
    if (displayCount % 2) inDisplayMath = !inDisplayMath;
    if (wasInDisplay || inDisplayMath || displayCount) {
      output.push(sourceLine);
      return;
    }
    const candidate = sourceLine.trimStart().startsWith('|') && sourceLine.includes('\\')
      ? sourceLine.split('|').map(cell => cleanLine(cell)).join('|')
      : cleanLine(sourceLine);
    const line = candidate !== sourceLine && isMeaningfulChange(sourceLine, candidate) ? candidate : sourceLine;
    if (line !== sourceLine) changes.push({ line: index + 1, before: sourceLine, after: line });
    output.push(line);
  });
  return { output: output.join('\n'), changes };
}

const results = [];
for (const file of files) {
  const fullPath = path.join(sourceDir, file);
  const input = fs.readFileSync(fullPath, 'utf8');
  const result = transform(input);
  if (!dryRun && result.output !== input) fs.writeFileSync(fullPath, result.output, 'utf8');
  results.push({ file, changes: result.changes });
}

const payload = {
  generatedAt: new Date().toISOString(),
  dryRun,
  files: files.length,
  changedFiles: results.filter(item => item.changes.length).length,
  changes: results.reduce((sum, item) => sum + item.changes.length, 0),
  results,
};
fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  dryRun,
  files: payload.files,
  changedFiles: payload.changedFiles,
  changes: payload.changes,
})}\n`);
