const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const docsJsonPath = path.join(__dirname, 'docs.json');

const filesToSplit = [
  'claude-data-structure.md',
  'claude-compilers.md',
  'claude-computer-network.md'
];

let allDocsConfig = [];

// 分配更加明确的分类
const categories = {
  'claude-data-structure': '数据结构',
  'claude-compilers': '编译原理',
  'claude-computer-network': '计算机网络'
};

filesToSplit.forEach(filename => {
  const filePath = path.join(docsDir, filename);
  if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 使用正则表达式按 /^## / 切割内容，前瞻断言保留分隔符
  const parts = content.split(/^(?=## )/m);
  
  let baseId = path.basename(filename, '.md');
  let partIndex = 1;
  let categoryStr = categories[baseId] || 'AI教学';
  
  parts.forEach(part => {
    let text = part.trim();
    if (!text) return; // 空块跳过
    
    let title = `${categoryStr} - 概览`; 
    const titleMatch = text.match(/^##\s+(.*)/);
    if (titleMatch) {
        title = titleMatch[1].trim();
        // 将顶部的 ## 替换为 #，在单独页面中作为一级标题显示
        text = text.replace(/^##\s+(.*)/, '# $1');
    }
    
    const newId = `${baseId}-p${partIndex}`;
    const newFileName = `${newId}.md`;
    const newFilePath = path.join(docsDir, newFileName);
    
    fs.writeFileSync(newFilePath, text, 'utf-8');
    console.log(`Created: ${newFileName} - ${title}`);
    
    allDocsConfig.push({
      id: newId,
      title: title,
      date: '2026-04-25',
      category: categoryStr
    });
    
    partIndex++;
  });
  
  // 拆分完成后删除原大文件
  fs.unlinkSync(filePath);
});

// 重写 docs.json
fs.writeFileSync(docsJsonPath, JSON.stringify(allDocsConfig, null, 2), 'utf-8');
console.log('All documents processed and docs.json updated!');
