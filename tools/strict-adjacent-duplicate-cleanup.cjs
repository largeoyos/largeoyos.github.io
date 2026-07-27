const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reportPath = path.join(sourceDir, '粗校报告', '严格复校相邻重复清理记录.json');
const dryRun = process.argv.includes('--dry-run');

const files = fs.readdirSync(sourceDir)
  .filter(name => name.includes('(粗校)') && name.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const duplicateFunction = /(\b[A-Za-z][A-Za-z0-9_]*\([^()\n]{1,80}\))[\u200B-\u200D\uFEFF]*\1/g;
const duplicateBigO = /(O\([^()\n]{1,80}\))[\u200B-\u200D\uFEFF]*\1/g;
const duplicateToken = /(?<![A-Za-z])([A-Za-zΑ-ω][A-Za-zΑ-ω0-9]*(?:[_^](?:\{[^{}\n]{1,30}\}|[A-Za-z0-9]))?)[\u200B-\u200D\uFEFF]*\1(?![A-Za-z])/g;

function keepToken(match, file, line) {
  if (['mm', 'MCMC', 'ISIS', 'COCO', 'IEEE', 'EE', 'ChaCha', 'TFTF', 'TTFFTTFF', 'FFFF', 'abab', 'LL'].includes(match)) return true;
  if (match.length >= 4 && /^[TF]+$/.test(match)) return true;
  if (match === 'xx' && /[01]x{2,}/.test(line)) return true;
  if (match === 'XX' && /XX 算法/.test(line)) return true;
  if (match === 'FF' && (
    file === '数字电路(粗校).md'
    || /Flip-Flop|触发器|FF\d|0x[0-9A-F]*FF/i.test(line)
  )) return true;
  if (match === 'II' && /Type II|Emmanuel II|OBD-II|课程表 II|两数之和 II/.test(line)) return true;
  if (match === 'QQ' && /QQ\s*(?:好友|邮箱)/.test(line)) return true;
  if (match === 'SS' && /NSS、SS/.test(line)) return true;
  if (match === 'XX' && /0x[0-9A-F]*XX/i.test(line)) return true;
  if (match === 'xx' && /\b[1-5]xx\b/.test(line)) return true;
  if (match === 'TT' && /TTFF|TFTF|真值表/.test(line)) return true;
  if (match === 'RR' && /AVL|旋转/.test(line)) return true;
  if (match === 'DD' && /V_DD/.test(line)) return true;
  return false;
}

function cleanText(text, file, line) {
  return text
    .replace(duplicateFunction, '$1')
    .replace(duplicateBigO, '$1')
    .replace(duplicateToken, (match, token) => keepToken(match, file, line) ? match : token);
}

function cleanLine(line, file) {
  const parts = line.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/\S+|`[^`]*`|\$(?!\$).*?(?<!\\)\$)/g);
  return parts.map((part, index) => index % 2 === 1 ? part : cleanText(part, file, line)).join('');
}

const results = [];
for (const file of files) {
  const fullPath = path.join(sourceDir, file);
  const input = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
  const lines = input.split('\n');
  const output = [];
  const changes = [];
  let inCode = false;
  let inDisplayMath = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      output.push(line);
      return;
    }
    if (inCode) {
      output.push(line);
      return;
    }
    const displayCount = (line.match(/\$\$/g) || []).length;
    const wasInDisplay = inDisplayMath;
    if (displayCount % 2) inDisplayMath = !inDisplayMath;
    if (wasInDisplay || inDisplayMath || displayCount) {
      output.push(line);
      return;
    }
    const after = cleanLine(line, file);
    if (after !== line) changes.push({ line: index + 1, before: line, after });
    output.push(after);
  });

  const text = output.join('\n');
  if (!dryRun && text !== input) fs.writeFileSync(fullPath, text, 'utf8');
  results.push({ file, changes });
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
