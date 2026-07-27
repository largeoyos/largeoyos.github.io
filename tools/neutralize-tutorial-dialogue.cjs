const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reportPath = path.join(sourceDir, '粗校报告', '严格复校通用语气改写.json');
const dryRun = process.argv.includes('--dry-run');

const files = fs.readdirSync(sourceDir)
  .filter(name => name.includes('(粗校)') && name.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const replacements = [
  [/根据你的回答/g, '根据作答情况', '去除对话依赖'],
  [/你的回答/g, '作答情况', '去除对话依赖'],
  [/你刚才/g, '前文', '教程语气'],
  [/你已经/g, '此前已经', '教程语气'],
  [/如果你愿意/g, '如有需要', '教程语气'],
  [/我来帮你/g, '下面', '教程语气'],
];

function transform(file, input) {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const output = [];
  const changes = [];
  let inCode = false;

  lines.forEach((sourceLine, index) => {
    let line = sourceLine;
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      output.push(line);
      return;
    }
    if (inCode || /^\s*>/.test(line)) {
      output.push(line);
      return;
    }

    if (/^\s*准备好.*告诉我(?:[\"“']?继续[\"”']?)?[。！!？?]?(?:或者.*)?\s*$/.test(line)) {
      changes.push({ line: index + 1, before: line, after: '', reason: '删除等待回复' });
      return;
    }

    for (const [pattern, replacement, reason] of replacements) {
      const before = line;
      line = line.replace(pattern, replacement);
      if (line !== before) changes.push({ line: index + 1, before, after: line, reason });
    }
    output.push(line);
  });

  return {
    output: output.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/g, '\n'),
    changes,
  };
}

const results = [];
for (const file of files) {
  const fullPath = path.join(sourceDir, file);
  const input = fs.readFileSync(fullPath, 'utf8');
  const result = transform(file, input);
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

if (!dryRun) fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  dryRun,
  files: payload.files,
  changedFiles: payload.changedFiles,
  changes: payload.changes,
})}\n`);
