const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sourceDir = path.join(__dirname, '待拆解');
const targetDocsDir = path.join(__dirname, 'ai-tutorials', 'docs');
const targetJsonPath = path.join(__dirname, 'ai-tutorials', 'docs.json');
const stateFilePath = path.join(__dirname, 'ai-tutorials', '.sync_state.json');

// 如果目标文件夹不存在则创建
if (!fs.existsSync(targetDocsDir)) {
    fs.mkdirSync(targetDocsDir, { recursive: true });
}

// 读取旧状态
let state = {};
if (fs.existsSync(stateFilePath)) {
    state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
}

// 读取已存在的 docs.json
let allDocs = [];
if (fs.existsSync(targetJsonPath)) {
    try {
        allDocs = JSON.parse(fs.readFileSync(targetJsonPath, 'utf8'));
    } catch (e) {
        allDocs = [];
    }
}

// 清理文件名中的(粗校)等标记，提取干净的标题
function cleanFileName(filename) {
    let name = filename.replace(/\(粗校\)[^\.]*\.md$/, '').replace(/\.md$/, '').trim();
    // 可选：去掉开头的Claude或claude，让分类更清爽
    name = name.replace(/^[Cc]laude\s*/, '');
    return name;
}

// 简单的中文转英文ID映射（可选），如果遇到未映射的则使用拼音或直接使用中文（现代浏览器支持中文URL）
const idMap = {
    'STM32': 'stm32',
    '编译原理': 'compilers',
    '离散数学': 'discrete-math',
    '数据结构整理': 'data-structure',
    '计算机网络': 'computer-network',
    '中东历史': 'middle-east-history',
    '欧洲历史': 'european-history',
    '信息论': 'information-theory',
    '布尔代数': 'boolean-algebra'
};

function getBaseId(cleanName) {
    return idMap[cleanName] || cleanName;
}

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
let updatedCount = 0;

for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const stat = fs.statSync(filePath);
    
    // 检查是否有更新 (根据修改时间)
    if (state[file] && state[file].mtime === stat.mtimeMs) {
        console.log(`[Skip] ${file} 未更改`);
        continue; // 没有更新，跳过
    }

    console.log(`[Process] 处理文件: ${file}`);
    updatedCount++;

    const cleanTitle = cleanFileName(file);
    const categoryName = cleanTitle; 
    const baseId = getBaseId(cleanTitle);

    const categoryDir = path.join(targetDocsDir, categoryName);
    
    // 如果存在这个分类的旧文件夹，先清空它，避免残留旧的拆分文件
    if (fs.existsSync(categoryDir)) {
        fs.rmSync(categoryDir, { recursive: true, force: true });
    }
    fs.mkdirSync(categoryDir, { recursive: true });

    // 从全局的 docs.json 中移除属于此分类的旧记录
    allDocs = allDocs.filter(doc => doc.category !== categoryName);

    const content = fs.readFileSync(filePath, 'utf-8');
    // 按二级标题拆分
    const parts = content.split(/^(?=## )/m);

    let partIndex = 1;
    parts.forEach(part => {
        let text = part.trim();
        if (!text) return;

        let title = `${categoryName} - 概览`;
        const titleMatch = text.match(/^##\s+(.*)/);
        if (titleMatch) {
            title = titleMatch[1].trim();
            // 把开头的二级标题变成一级标题
            text = text.replace(/^##\s+(.*)/, '# $1');
        }

        const newId = `${baseId}-p${partIndex}`;
        const newFileName = `${newId}.md`;
        const newFilePath = path.join(categoryDir, newFileName);

        fs.writeFileSync(newFilePath, text, 'utf-8');

        allDocs.push({
            id: newId,
            title: title,
            // 简单取个时间，实际可取当前日期
            date: new Date().toISOString().split('T')[0],
            category: categoryName
        });
        
        partIndex++;
    });

    // 记录最新更新时间
    state[file] = { mtime: stat.mtimeMs };
}

if (updatedCount > 0) {
    // 写回 docs.json 与 state
    fs.writeFileSync(targetJsonPath, JSON.stringify(allDocs, null, 2), 'utf-8');
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`\n处理完成，共更新 ${updatedCount} 个文件。长教程目录已重新生成。`);
} else {
    console.log(`\n没有文件需要更新。`);
}