const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const patchDir = path.join(__dirname, 'strict-reproof-replacements');
const reportPath = path.join(sourceDir, '粗校报告', '严格复校人工改写记录.json');
const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(patchDir)) {
  throw new Error(`Patch directory does not exist: ${patchDir}`);
}

const patchFiles = fs.readdirSync(patchDir)
  .filter(name => name.endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const operations = patchFiles.flatMap(patchFile => {
  const parsed = JSON.parse(fs.readFileSync(path.join(patchDir, patchFile), 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${patchFile} must contain an array`);
  return parsed.map(operation => ({ ...operation, patchFile }));
});

const byFile = new Map();
for (const operation of operations) {
  if (!operation.file || !operation.before || typeof operation.after !== 'string') {
    throw new Error(`Invalid operation in ${operation.patchFile}`);
  }
  if (!byFile.has(operation.file)) byFile.set(operation.file, []);
  byFile.get(operation.file).push(operation);
}

const results = [];
for (const [file, fileOperations] of byFile) {
  const fullPath = path.join(sourceDir, file);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing target file: ${file}`);
  let text = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
  const original = text;

  for (const operation of fileOperations) {
    const occurrences = text.split(operation.before).length - 1;
    if (!occurrences) {
      results.push({ ...operation, status: 'not-found', occurrences: 0 });
      continue;
    }
    if (operation.expected !== undefined && occurrences !== operation.expected) {
      throw new Error(`${file}: expected ${operation.expected} occurrence(s), found ${occurrences}: ${operation.before.slice(0, 120)}`);
    }
    text = text.split(operation.before).join(operation.after);
    results.push({ ...operation, status: 'applied', occurrences });
  }

  text = text.replace(/\n{3,}/g, '\n\n').replace(/\s+$/g, '\n');
  if (!dryRun && text !== original) fs.writeFileSync(fullPath, text, 'utf8');
}

const payload = {
  generatedAt: new Date().toISOString(),
  dryRun,
  patchFiles,
  operations: operations.length,
  appliedOperations: results.filter(item => item.status === 'applied').length,
  appliedOccurrences: results.reduce((sum, item) => sum + (item.status === 'applied' ? item.occurrences : 0), 0),
  notFound: results.filter(item => item.status === 'not-found').length,
  results,
};

if (!dryRun) fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({
  dryRun,
  patchFiles: patchFiles.length,
  operations: payload.operations,
  appliedOperations: payload.appliedOperations,
  appliedOccurrences: payload.appliedOccurrences,
  notFound: payload.notFound,
})}\n`);
