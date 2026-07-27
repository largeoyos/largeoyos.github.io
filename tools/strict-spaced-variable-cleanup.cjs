const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reportPath = path.join(sourceDir, '粗校报告', '严格复校空格变量清理记录.json');
const dryRun = process.argv.includes('--dry-run');
const targets = [
  'Claude电路(粗校).md',
  'Claude计算机网络(粗校).md',
  'Claude离散数学(粗校)有些公式重复两到三次.md',
  'Claude模拟电路(粗校).md'
];

function cleanText(text) {
  return text.replace(
    /(?<![A-Za-z0-9])([A-Za-zΑ-ω])[\u00A0\u2009\s]+\1(?![A-Za-z0-9])/gu,
    '$1'
  );
}

function cleanLine(line) {
  if (/[┌┐└┘├┤┬┴┼─│]/.test(line) || /\s{4,}/.test(line)) return line;
  const parts = line.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/\S+|`[^`]*`|\$(?!\$).*?(?<!\\)\$|"[^"\n]*"|“[^”\n]*”)/g);
  return parts.map((part, index) => index % 2 === 1 ? part : cleanText(part)).join('');
}

const results = [];
for (const file of targets) {
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
    const after = cleanLine(line);
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
  files: targets.length,
  changedFiles: results.filter(item => item.changes.length).length,
  changes: results.reduce((sum, item) => sum + item.changes.length, 0),
  results
};
fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  dryRun,
  files: payload.files,
  changedFiles: payload.changedFiles,
  changes: payload.changes
})}\n`);
