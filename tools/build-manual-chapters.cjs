/**
 * Rebuild ai-tutorials from the explicit human-reviewed chapter lists.
 *
 * This script does not infer chapter boundaries from Markdown heading levels.
 * Every boundary and output title comes from:
 *   待拆解/粗校报告/人工章节审核/*.md
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const reviewDir = path.join(sourceDir, '粗校报告', '人工章节审核');
const docsDir = path.join(root, 'ai-tutorials', 'docs');
const docsJsonPath = path.join(root, 'ai-tutorials', 'docs.json');
const statePath = path.join(root, 'ai-tutorials', '.sync_state.json');
const write = process.argv.includes('--write');

const idMap = {
  STM32: 'stm32',
  编译原理: 'compilers',
  离散数学: 'discrete-math',
  数据结构整理: 'data-structure',
  计算机网络: 'computer-network',
  中东历史: 'middle-east-history',
  欧洲历史: 'european-history',
  信息论: 'information-theory',
  布尔代数: 'boolean-algebra'
};

function cleanFileName(filename) {
  let name = filename
    .replace(/\(粗校\)[^\.]*\.md$/, '')
    .replace(/\.md$/, '')
    .trim();
  return name.replace(/^[Cc]laude\s*/, '');
}

function parseReviews() {
  const reviewFiles = fs.readdirSync(reviewDir)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const tutorials = [];
  const byFile = new Map();

  for (const reviewFile of reviewFiles) {
    const lines = fs.readFileSync(path.join(reviewDir, reviewFile), 'utf8').split(/\r?\n/);
    let tutorial = null;
    let chapter = null;

    for (const line of lines) {
      const fileHeading = line.match(/^#{2,3}\s+(.+\.md)\s*$/);
      if (fileHeading) {
        const file = fileHeading[1].trim();
        if (byFile.has(file)) throw new Error(`人工清单重复记录教程：${file}`);
        tutorial = { file, reviewFile, chapters: [] };
        tutorials.push(tutorial);
        byFile.set(file, tutorial);
        chapter = null;
        continue;
      }

      if (!tutorial) continue;
      const chapterLine = line.match(/^(\d+)\.\s+(.+?)\s*$/);
      if (chapterLine) {
        chapter = {
          number: Number(chapterLine[1]),
          title: chapterLine[2].trim(),
          start: null,
          occurrence: 'first'
        };
        tutorial.chapters.push(chapter);
        continue;
      }

      if (!chapter) continue;
      const startLine = line.match(/^\s+- 起点：(.+?)\s*$/);
      if (!startLine) continue;
      const code = startLine[1].match(/`([^`]+)`/);
      if (!code) throw new Error(`${reviewFile} 中起点没有代码标记：${line}`);
      chapter.start = code[1].trim();
      if (/正文中的|正文末段/.test(startLine[1])) chapter.occurrence = 'last';
      if (/第一次/.test(startLine[1])) chapter.occurrence = 'first';
    }
  }

  return tutorials;
}

function resolveTutorial(tutorial) {
  const sourcePath = path.join(sourceDir, tutorial.file);
  if (!fs.existsSync(sourcePath)) throw new Error(`人工清单指向不存在的源文件：${tutorial.file}`);
  if (!tutorial.chapters.length) throw new Error(`人工清单没有章节：${tutorial.file}`);

  const text = fs.readFileSync(sourcePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const resolved = tutorial.chapters.map((chapter, index) => {
    if (chapter.number !== index + 1) {
      throw new Error(`${tutorial.file} 的章节序号不连续：期望 ${index + 1}，实际 ${chapter.number}`);
    }
    if (!chapter.start) throw new Error(`${tutorial.file} 的“${chapter.title}”缺少起点`);
    const matches = [];
    lines.forEach((line, lineIndex) => {
      if (line.trim() === chapter.start) matches.push(lineIndex);
    });
    if (!matches.length) {
      throw new Error(`${tutorial.file} 找不到人工指定起点：${chapter.start}`);
    }
    const startLine = chapter.occurrence === 'last' ? matches.at(-1) : matches[0];
    return { ...chapter, startLine, matches: matches.length };
  });

  if (resolved[0].startLine !== 0) {
    throw new Error(`${tutorial.file} 的第一章没有从文件首行开始：第 ${resolved[0].startLine + 1} 行`);
  }
  for (let index = 1; index < resolved.length; index += 1) {
    if (resolved[index].startLine <= resolved[index - 1].startLine) {
      throw new Error(
        `${tutorial.file} 的人工边界顺序错误：${resolved[index - 1].title} → ${resolved[index].title}`
      );
    }
  }

  const cleanName = cleanFileName(tutorial.file);
  return {
    ...tutorial,
    sourcePath,
    cleanName,
    category: cleanName,
    baseId: idMap[cleanName] || cleanName,
    lines,
    chapters: resolved
  };
}

const tutorials = parseReviews().map(resolveTutorial);
const sourceFiles = fs.readdirSync(sourceDir)
  .filter((name) => name.endsWith('.md') && name.includes('粗校'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));
const reviewedFiles = tutorials.map((item) => item.file).sort((a, b) => a.localeCompare(b, 'zh-CN'));

const missingReviews = sourceFiles.filter((file) => !reviewedFiles.includes(file));
const unknownReviews = reviewedFiles.filter((file) => !sourceFiles.includes(file));
if (missingReviews.length || unknownReviews.length) {
  throw new Error(
    `人工清单覆盖不完整。未审核：${missingReviews.join('、') || '无'}；多余记录：${unknownReviews.join('、') || '无'}`
  );
}

const duplicateCategories = tutorials
  .map((item) => item.category)
  .filter((category, index, values) => values.indexOf(category) !== index);
if (duplicateCategories.length) {
  throw new Error(`人工清单产生重复分类：${[...new Set(duplicateCategories)].join('、')}`);
}

const totalChapters = tutorials.reduce((sum, item) => sum + item.chapters.length, 0);
const preview = tutorials.map((item) => ({
  file: item.file,
  category: item.category,
  chapters: item.chapters.map((chapter, index) => ({
    id: `${item.baseId}-p${index + 1}`,
    title: chapter.title,
    startLine: chapter.startLine + 1,
    start: chapter.start,
    matchedOccurrences: chapter.matches,
    chosenOccurrence: chapter.occurrence
  }))
}));

if (!write) {
  console.log(JSON.stringify({
    mode: 'check',
    reviewedFiles: tutorials.length,
    sourceFiles: sourceFiles.length,
    totalChapters,
    preview
  }, null, 2));
  process.exit(0);
}

const oldDocs = fs.existsSync(docsJsonPath)
  ? JSON.parse(fs.readFileSync(docsJsonPath, 'utf8'))
  : [];
const newDocs = [];
const state = {};

for (const tutorial of tutorials) {
  const categoryDir = path.join(docsDir, tutorial.category);
  const resolvedCategoryDir = path.resolve(categoryDir);
  if (!resolvedCategoryDir.startsWith(path.resolve(docsDir) + path.sep)) {
    throw new Error(`分类目录越出教程目录：${tutorial.category}`);
  }
  fs.rmSync(resolvedCategoryDir, { recursive: true, force: true });
  fs.mkdirSync(resolvedCategoryDir, { recursive: true });

  tutorial.chapters.forEach((chapter, index) => {
    const nextStart = tutorial.chapters[index + 1]?.startLine ?? tutorial.lines.length;
    const chapterText = `${tutorial.lines.slice(chapter.startLine, nextStart).join('\n').trim()}\n`;
    const id = `${tutorial.baseId}-p${index + 1}`;
    fs.writeFileSync(path.join(resolvedCategoryDir, `${id}.md`), chapterText, 'utf8');
    newDocs.push({
      id,
      title: chapter.title,
      date: '2026-07-26',
      category: tutorial.category
    });
  });

  state[tutorial.file] = {
    mtime: fs.statSync(tutorial.sourcePath).mtimeMs,
    mode: 'manual-major-chapters',
    chapters: tutorial.chapters.length
  };
}

fs.writeFileSync(docsJsonPath, `${JSON.stringify(newDocs, null, 2)}\n`, 'utf8');
fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

const reportJsonPath = path.join(reviewDir, '人工大章节重建报告.json');
let previousReport = null;
if (fs.existsSync(reportJsonPath)) {
  try {
    previousReport = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
  } catch {
    previousReport = null;
  }
}
const baselineOldDocuments = Math.max(oldDocs.length, previousReport?.oldDocuments || 0);

const report = {
  generatedAt: '2026-07-26',
  mode: 'manual-major-chapters',
  reviewFiles: fs.readdirSync(reviewDir).filter((name) => name.endsWith('.md')).sort(),
  tutorials: tutorials.length,
  oldDocuments: baselineOldDocuments,
  newDocuments: newDocs.length,
  removedOverfineDocuments: baselineOldDocuments - newDocs.length,
  details: preview
};
fs.writeFileSync(
  reportJsonPath,
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);
const markdown = [
  '# 人工大章节重建报告',
  '',
  `- 人工审核教程：${report.tutorials} 份`,
  `- 重建前文档：${report.oldDocuments} 篇`,
  `- 重建后大章节：${report.newDocuments} 篇`,
  `- 合并过细文档：${report.removedOverfineDocuments} 篇`,
  '- 边界来源：人工章节审核目录中的六份逐教程清单',
  '- 自动判断标题边界：未使用',
  '',
  '## 每份教程的大章节数',
  '',
  ...tutorials.map((item) => `- ${item.file}：${item.chapters.length} 章`),
  ''
].join('\n');
fs.writeFileSync(path.join(reviewDir, '人工大章节重建报告.md'), markdown, 'utf8');

console.log(JSON.stringify({
  mode: 'write',
  tutorials: tutorials.length,
  oldDocuments: baselineOldDocuments,
  newDocuments: newDocs.length,
  removedOverfineDocuments: baselineOldDocuments - newDocs.length
}, null, 2));
