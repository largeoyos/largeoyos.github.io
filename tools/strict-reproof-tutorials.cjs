const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reportDir = path.join(sourceDir, '粗校报告');
const changeLogPath = path.join(reportDir, '严格复校修改记录.json');
const dryRun = process.argv.includes('--dry-run');

const files = fs.readdirSync(sourceDir)
  .filter(name => name.includes('(粗校)') && name.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const dateLine = /^(?:[1-9]|1[0-2])月(?:[1-9]|[12][0-9]|3[01])日$/;
const userHeading = /^## You said:\s*(.*)$/i;
const interrupted = /^Claude's response was interrupted\.$/;

function compactBlankLines(lines) {
  const result = [];
  let blankCount = 0;
  for (const line of lines) {
    if (!line.trim()) {
      blankCount += 1;
      if (blankCount > 1) continue;
      result.push('');
    } else {
      blankCount = 0;
      result.push(line.replace(/[ \t]+$/g, ''));
    }
  }
  while (result.length && !result[0].trim()) result.shift();
  while (result.length && !result[result.length - 1].trim()) result.pop();
  result.push('');
  return result;
}

function transform(name, input) {
  const source = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = source.split('\n');
  const output = [];
  const changes = [];
  let inCode = false;

  const record = (type, line, before) => changes.push({ type, line, before });

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/[ \t]+$/g, '');

    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      output.push(line);
      continue;
    }
    if (inCode) {
      output.push(line);
      continue;
    }

    const headingMatch = line.match(userHeading);
    if (headingMatch) {
      let dateIndex = -1;
      const searchEnd = Math.min(lines.length, index + 10);
      for (let cursor = index + 1; cursor < searchEnd; cursor += 1) {
        if (dateLine.test(lines[cursor].trim())) {
          dateIndex = cursor;
          break;
        }
        if (/^#{1,6}\s+/.test(lines[cursor]) && lines[cursor].trim()) break;
      }
      if (dateIndex !== -1) {
        for (let cursor = index; cursor <= dateIndex; cursor += 1) {
          if (lines[cursor].trim()) record('平台/用户提示块', cursor + 1, lines[cursor].trim());
        }
        index = dateIndex;
        continue;
      }
      record('平台/用户标题', index + 1, line);
      continue;
    }

    if (dateLine.test(line.trim())) {
      record('平台/导出日期', index + 1, line.trim());
      continue;
    }
    if (interrupted.test(line.trim())) {
      record('平台/中断提示', index + 1, line.trim());
      continue;
    }

    output.push(line);
  }

  return {
    output: compactBlankLines(output).join('\n'),
    changes,
  };
}

const summary = [];
for (const name of files) {
  const fullPath = path.join(sourceDir, name);
  const input = fs.readFileSync(fullPath, 'utf8');
  const result = transform(name, input);
  if (!dryRun && result.output !== input) fs.writeFileSync(fullPath, result.output, 'utf8');
  summary.push({
    file: name,
    changes: result.changes.length,
    types: result.changes.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    details: result.changes,
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  dryRun,
  files: files.length,
  changedFiles: summary.filter(item => item.changes).length,
  totalChanges: summary.reduce((sum, item) => sum + item.changes, 0),
  summary,
};

if (!dryRun) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(changeLogPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}
process.stdout.write(`${JSON.stringify({
  files: payload.files,
  changedFiles: payload.changedFiles,
  totalChanges: payload.totalChanges,
  dryRun,
})}\n`);
