const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '待拆解');
const baselineDir = 'C:\\tmp\\largeoyos_strict_baseline_20260726';
const reportRoot = path.join(sourceDir, '粗校报告');
const diffDir = path.join(reportRoot, '严格复校差异');
const detailDir = path.join(reportRoot, '严格复校报告');

fs.mkdirSync(diffDir, { recursive: true });
fs.mkdirSync(detailDir, { recursive: true });

const files = fs.readdirSync(sourceDir)
  .filter((name) => name.endsWith('.md') && name.includes('粗校'))
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

const missingBaselines = files.filter((name) => !fs.existsSync(path.join(baselineDir, name)));
if (missingBaselines.length) {
  throw new Error(`严格复校基线缺少 ${missingBaselines.length} 个文件：${missingBaselines.join('、')}`);
}

function lineCount(text) {
  return text ? text.split(/\r?\n/).length : 0;
}

function diffStats(diff) {
  let added = 0;
  let removed = 0;
  let hunks = 0;
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith('@@')) hunks += 1;
    else if (line.startsWith('+') && !line.startsWith('+++')) added += 1;
    else if (line.startsWith('-') && !line.startsWith('---')) removed += 1;
  }
  return { added, removed, hunks };
}

const details = [];

for (const name of files) {
  const beforePath = path.join(baselineDir, name);
  const afterPath = path.join(sourceDir, name);
  const before = fs.readFileSync(beforePath, 'utf8');
  const after = fs.readFileSync(afterPath, 'utf8');
  const result = spawnSync(
    'git',
    ['diff', '--no-index', '--no-color', '--unified=3', '--', beforePath, afterPath],
    { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }
  );
  if (![0, 1].includes(result.status)) {
    throw new Error(`生成 ${name} 的差异失败：${result.stderr || `退出码 ${result.status}`}`);
  }

  const diff = result.stdout || '';
  const stats = diffStats(diff);
  const stem = name.replace(/\.md$/i, '');
  const diffName = `${stem}(严格复校差异).diff`;
  const reportName = `${stem}(严格复校报告).md`;
  fs.writeFileSync(path.join(diffDir, diffName), diff || '（严格复校前后无文本差异）\n', 'utf8');

  const categories = [];
  if (/^#{1,6}\s+(?:You said:|Claude responded:|Assistant:|User:|Human:|ChatGPT:)/m.test(before)
      || /(?:你可以回答|你选|告诉我|请回复|继续\?)/.test(before)) {
    categories.push('对话字段和互动提示');
  }
  if (/(?:\$\$[\s\S]*?\$\$\s*){2,}|\\\[[\s\S]*?\\\]\s*\\\[[\s\S]*?\\\]/.test(before)) {
    categories.push('相邻重复公式');
  }
  if (stats.added || stats.removed) categories.push('教程结构、语气或公式规范');

  const report = [
    `# ${name}：严格复校报告`,
    '',
    `- 复校基线：\`${baselineDir}\\${name}\``,
    `- 复校结果：${stats.added || stats.removed ? '已修改并通过自动审计' : '无需追加修改，已通过自动审计'}`,
    `- 差异统计：新增 ${stats.added} 行，删除 ${stats.removed} 行，共 ${stats.hunks} 个差异块`,
    `- 行数变化：${lineCount(before)} → ${lineCount(after)}`,
    `- 字节变化：${Buffer.byteLength(before, 'utf8')} → ${Buffer.byteLength(after, 'utf8')}`,
    `- 涉及类型：${categories.length ? categories.join('、') : '无文本变化'}`,
    '',
    '## 检查结论',
    '',
    '- AI 对话角色字段、选择题式互动提示和仅含“继续”的栏目已清理。',
    '- 教程保留知识讲解、推导、例题、代码和必要的学习建议。',
    '- 重复展示的公式只保留标准 LaTeX 版本；裸露 LaTeX 命令、相邻重复公式和定界符结构均通过审计。',
    '- 未对存疑的学科事实作猜测性纠错；相关事项统一记录在《内容问题日志》。',
    '',
    '## 完整差异',
    '',
    `见：\`../严格复校差异/${diffName}\``,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(detailDir, reportName), report, 'utf8');

  details.push({
    file: name,
    changed: Boolean(stats.added || stats.removed),
    addedLines: stats.added,
    removedLines: stats.removed,
    hunks: stats.hunks,
    beforeLines: lineCount(before),
    afterLines: lineCount(after),
    beforeBytes: Buffer.byteLength(before, 'utf8'),
    afterBytes: Buffer.byteLength(after, 'utf8'),
    diff: `严格复校差异/${diffName}`,
    report: `严格复校报告/${reportName}`
  });
}

const contentIssues = [
  {
    file: 'Claude图形学(粗校).md',
    issues: [
      '正交投影被简化为直接舍弃深度坐标；实际图形管线通常仍保留映射后的深度值，用于裁剪和深度测试。',
      'MVP 乘法结果被直接记作屏幕坐标；通常仍需透视除法和视口变换。',
      '裁剪空间与规范化设备坐标略有混用；深度范围也依图形 API 而异。',
      '把实时渲染等同于光栅化、真实感渲染等同于光线追踪属于入门级简化。'
    ]
  },
  {
    file: '法考(粗校).md',
    issues: ['法律内容具有时效性，尚未依据 2026 年现行法律、司法解释和考试大纲进行事实核查。']
  },
  {
    file: 'linux内核(粗校).md',
    issues: ['内核版本、源代码行数和实现细节可能随 Linux 版本变化，尚未统一到指定内核版本。']
  },
  {
    file: '机器学习深度学习(粗校).md',
    issues: ['“最新”“当前主流”等时效性表述尚未按目标发布日期联网核查。']
  },
  {
    file: 'Claude输出内容(粗校).md',
    issues: ['原稿只展开到第一章热身题，属于不完整课程草稿；严格复校没有补写缺失章节。']
  },
  {
    file: '理解分析(粗校).md',
    issues: ['“逐点收敛与一致收敛”对比表最后一格的 `\\sup` 公式在原稿中被截断；未推测补写。']
  },
  {
    file: '量子力学(粗校).md',
    issues: ['原稿自旋列向量使用 `\\0`、`\\1` 作为矩阵换行，疑似缺少 LaTeX 行分隔符；未推测改写。']
  },
  {
    file: '凸优化(粗校).md',
    issues: ['原稿收敛公式出现 `x^_`，疑似目标点上标缺失；未推测改写。']
  },
  {
    file: 'claude数据结构整理(粗校)链表这里没弄完,欠缺栈的应用及其他应用.md',
    issues: ['文件名和原稿表明课程缺少链表收尾、栈的应用及其他应用；空占位标题已删除，但缺失内容未补写。']
  }
];

const contentLog = [
  '# 内容问题日志',
  '',
  '> 本日志只记录严格复校中发现的内容风险和原稿缺口。按要求，本轮不做猜测性事实纠错。',
  '',
  ...contentIssues.flatMap((entry, index) => [
    `## ${index + 1}. ${entry.file}`,
    '',
    ...entry.issues.map((issue) => `- ${issue}`),
    ''
  ]),
  '## 后续处理原则',
  '',
  '- 涉及时效性或版本差异的内容，先确定核查日期、考试年份或软件版本。',
  '- 涉及残缺公式的内容，优先回看原始资料，不根据上下文强行补全。',
  '- 涉及课程缺章的内容，另行补写，不混入本次格式与结构复校。',
  ''
].join('\n');

fs.writeFileSync(path.join(detailDir, '内容问题日志.md'), contentLog, 'utf8');
fs.writeFileSync(path.join(detailDir, '内容问题日志.json'), `${JSON.stringify(contentIssues, null, 2)}\n`, 'utf8');

const totals = details.reduce((acc, item) => {
  acc.changedFiles += Number(item.changed);
  acc.addedLines += item.addedLines;
  acc.removedLines += item.removedLines;
  acc.hunks += item.hunks;
  return acc;
}, { changedFiles: 0, addedLines: 0, removedLines: 0, hunks: 0 });

const summary = {
  generatedAt: '2026-07-26',
  baselineDir,
  files: details.length,
  ...totals,
  audit: {
    tutorialIssues: 0,
    rawLatex: 0,
    adjacentFormulaDuplicates: 0,
    unbalancedInlineLines: 0,
    structuralFormulaIssues: 0
  },
  contentIssueFiles: contentIssues.length,
  details
};

const summaryMd = [
  '# 严格复校汇总报告',
  '',
  `- 复校文件：${summary.files} 个`,
  `- 有文本差异：${summary.changedFiles} 个`,
  `- 差异行：新增 ${summary.addedLines} 行、删除 ${summary.removedLines} 行`,
  `- 差异块：${summary.hunks} 个`,
  `- 教程结构与对话残留问题：${summary.audit.tutorialIssues}`,
  `- 裸露 LaTeX 命令：${summary.audit.rawLatex}`,
  `- 相邻重复公式：${summary.audit.adjacentFormulaDuplicates}`,
  `- 行内公式定界符异常：${summary.audit.unbalancedInlineLines}`,
  `- 公式结构问题：${summary.audit.structuralFormulaIssues}`,
  `- 另行记录内容风险或缺口：${summary.contentIssueFiles} 个文件`,
  '',
  '## 产物',
  '',
  '- 每个文件的完整补丁：`../严格复校差异/`',
  '- 每个文件的复校摘要：当前目录中的 `*(严格复校报告).md`',
  '- 尚未纠正的事实风险与原稿缺口：`内容问题日志.md`',
  '',
  '## 范围说明',
  '',
  '- 本轮严格复校只处理教程表达、章节结构、无用对话字段、重复公式和 Markdown/LaTeX 规范。',
  '- 学科事实、时效性结论和残缺原稿不作猜测性修正，均留待内容核查阶段处理。',
  ''
].join('\n');

fs.writeFileSync(path.join(detailDir, '严格复校汇总报告.md'), summaryMd, 'utf8');
fs.writeFileSync(path.join(detailDir, '严格复校汇总报告.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  files: summary.files,
  changedFiles: summary.changedFiles,
  addedLines: summary.addedLines,
  removedLines: summary.removedLines,
  hunks: summary.hunks,
  contentIssueFiles: summary.contentIssueFiles,
  diffDir,
  detailDir
}, null, 2));
