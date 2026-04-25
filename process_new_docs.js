const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const docsDir = path.join(rootDir, 'ai-tutorials', 'docs');
const docsJsonPath = path.join(rootDir, 'ai-tutorials', 'docs.json');

const filesToProcess = [
  { file: 'Claude STM32.md', category: 'STM32', baseId: 'claude-stm32' },
  { file: 'Claude模拟电路.md', category: '模拟电路', baseId: 'claude-analog-circuit' },
  { file: 'Claude电路.md', category: '电路', baseId: 'claude-circuit' },
  { file: 'Claude离散数学.md', category: '离散数学', baseId: 'claude-discrete-math' }
];

let allDocsConfig = [];
if (fs.existsSync(docsJsonPath)) {
  allDocsConfig = JSON.parse(fs.readFileSync(docsJsonPath, 'utf8'));
}

filesToProcess.forEach(item => {
  const filePath = path.join(rootDir, item.file);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }

  const categoryDir = path.join(docsDir, item.category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parts = content.split(/^(?=## )/m);

  let partIndex = 1;

  parts.forEach(part => {
    let text = part.trim();
    if (!text) return;

    let title = `${item.category} - 概览`;
    const titleMatch = text.match(/^##\s+(.*)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      text = text.replace(/^##\s+(.*)/, '# $1');
    }

    const newId = `${item.baseId}-p${partIndex}`;
    const newFileName = `${newId}.md`;
    const newFilePath = path.join(categoryDir, newFileName);

    fs.writeFileSync(newFilePath, text, 'utf-8');
    console.log(`Created: ${newFileName} - ${title}`);

    allDocsConfig.push({
      id: newId,
      title: title,
      date: '2026-04-25',
      category: item.category
    });

    partIndex++;
  });

  // 删除处理完毕的文件
  fs.unlinkSync(filePath);
});

fs.writeFileSync(docsJsonPath, JSON.stringify(allDocsConfig, null, 2), 'utf-8');
console.log('Done!');
