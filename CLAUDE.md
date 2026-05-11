# CLAUDE.md - 交互与编码规范

## 交互原则 (Communication)
- **拒绝废话**：严禁使用 "Great question!", "Certainly!", "Of course!" 等寒暄开头。直接进入正题，只给核心信息。
- **匹配复杂度**：简单问题短答，复杂任务深入。严禁用套话填充字数。
- **明确不确定性**：如果不确定事实、数据或技术细节，必须直说“我不确定”，禁止凭空捏造。
- **执行前选项**：在开始重要任务前，先提供 2-3 个方案，说明取舍，等我确认后再动手。

## 编辑与修改守则 (Editing)
- **保持范围**：只修改我明确要求的部分。禁止“顺手优化”没要求的代码或文字。
- **重大变动确认**：重写、重组或改变语气前，必须停下来说明原因并获得确认。
- **变更总结**：任务完成后，末尾必须简短列出：
  - 修改了什么
  - 保留了什么
  - 后续建议

## 编码规范 (Coding - Karpathy Protocol)
- **先问后猜**：需求或架构不明时，先提问，禁止假设。
- **KISS原则**：始终先实现最简单的可行方案，不要过度设计或添加未要求的抽象。
- **技术栈锁定**：
  - 语言：HTML / CSS / JavaScript (ES6+)
  - 框架：原生（子项目 React + Vite + TypeScript）
  - 工具：Node.js (marked, jsdom, highlight.js)
- **破坏性操作隐性锁定**：删除文件、覆盖数据库或执行部署前，必须在当前对话中获得明确的“是”或“确认”。

## 记忆与状态 (Memory)
- 维护并参考项目中的 `MEMORY.md` 记录重要决策。
- 维护并参考 `ERRORS.md` 记录失败尝试，避免重复踩坑。
- 当我说 "session end" 时，提供本次会话的简短总结。


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

个人静态网站/知识库，部署在 GitHub Pages 上。包含博客系统、AI 教程文库、网页小游戏、快捷导航页面。

- **站点**: https://largeoyos.github.io
- **语言**: 中文为主
- **技术栈**: 原生 HTML/CSS/JS，部分子项目使用 React + Vite + TypeScript
- **托管**: GitHub Pages（已配置 `.nojekyll`，禁止删除）

## Directory Structure

```
/
├── index.html              # 主页 — 每日签到日历 + 项目子空间入口
├── css/style.css           # 全局样式（统一导航栏、卡片、布局）
├── js/
│   ├── home-calendar.js    # 农历日历 + 运势计算（依赖 lunar-javascript）
│   └── vendor/lunar.js     # lunar-javascript 本地副本
├── blog/
│   ├── index.html          # 博客大厅 — 按分类筛选，从 posts.json 加载
│   ├── post.html           # 博客详情 — marked.js 渲染 Markdown + highlight.js
│   ├── posts.json          # 博客元数据索引（id, title, date, category）
│   └── posts/*.md          # 博客文章 Markdown 源文件
├── ai-tutorials/
│   ├── index.html          # 教程目录 — 从 docs.json 加载，按分类分组
│   ├── doc.html            # 教程详情 — 渲染拆解后的单节 Markdown
│   ├── docs.json           # 教程元数据索引（id, title, category）
│   ├── docs/{category}/    # 自动拆解后的章节文件（.md）
│   └── .sync_state.json    # auto_split_docs.js 的状态追踪文件
├── games/
│   ├── index.html          # 游戏大厅入口
│   ├── acquire/            # React + TypeScript 桌游（并购）
│   ├── suika/              # Canvas 物理游戏（合成大西瓜）
│   └── flxg-2048/          # 经典 2048 变体
├── quick-nav/index.html    # 快捷导航页 — 分类常用网站入口
├── 待拆解/                 # AI 教程长文 Markdown 源文件（按 ## 拆分）
├── 细小知识.md             # 碎片化知识临时记录
├── auto_split_docs.js      # Markdown 增量拆分脚本（Node.js）
├── CHANGELOG.md            # 版本更新日志（遵循 SemVer）
└── package.json            # 根项目依赖（marked, jsdom, highlight.js）
```

## Key Conventions

### Versioning & Changelog
- 遵循 SemVer (`x.x.x`)：
  - **MAJOR**：重大架构改变、全新系统上线或重大交互重构
  - **MINOR**：新文章、新拆解教程、新小游戏功能等特性增加
  - **PATCH**：修复错别字、微调样式、修复 Bug
- 每次迭代必须在 `CHANGELOG.md` 末尾增补新版本记录（版本号、日期、更改说明）
- 同步更新入口页面底部版本标识：`index.html`, `blog/index.html`, `ai-tutorials/index.html`, `games/index.html`, `quick-nav/index.html`

### AI Tutorial Document Split Workflow
1. 修改源文件：编辑 `待拆解/` 下的 Markdown（长文，使用 `##` 二级标题分隔章节）
2. 运行拆分脚本：`node auto_split_docs.js`（增量执行，仅处理修改时间变化的文件）
3. 脚本将长文按 `##` 拆成独立小节输出到 `ai-tutorials/docs/{category}/`，并更新 `docs.json`

### Fragmented Knowledge Workflow
1. 日常碎片笔记先记录在根目录 `细小知识.md`
2. 正式归档时将内容追加到 `blog/posts/micro-knowledge.md`
3. 按 `## YYYY-MM-DD` 格式分组

### Blog Posts
- 文章 Markdown 放在 `blog/posts/` 目录
- 添加新文章后需在 `blog/posts.json` 注册元数据（id, title, date, category）
- 前端通过 `post.html?id=<id>` 渲染

### Page Footer Version Sync
修改版本号时，同步更新以下文件的页脚：`index.html`, `blog/index.html`, `ai-tutorials/index.html`, `games/index.html`, `quick-nav/index.html`

### Responsive Design
确保新添加的 HTML/CSS 满足移动端与桌面端的自适应要求

### Path References
所有资源引用使用相对路径（如 `../css/style.css`），确保 GitHub Pages 子路径兼容

### Markdown & 代码高亮
- 根项目前端渲染 Markdown 使用 `marked`，代码高亮使用 `highlight.js`
- 后端/脚本处理（如 `auto_split_docs.js`）也依赖 `marked` 与 `jsdom`

## Tech Details

### Home Calendar
- 使用 `lunar-javascript` 库计算农历/干支/节气
- 运势系统：多维度混合哈希算法（干支柱干支 + 生肖 + 节气 + 星期 + 日期）
- 支持布局切换（日历优先/项目优先），偏好存储于 localStorage

### Sub-projects
- `games/acquire/` (并购桌游): React + Vite + TypeScript，独立 `package.json`
- `games/suika/` (合成大西瓜): Canvas 原生 JS 实现
- `games/flxg-2048/`: 纯 JS HTML5 游戏，含 AI 自动演示
- `并购-(acquire)---经典桌游/`: Acquire 的旧版源码目录

### Dev Dependencies
- Node.js 脚本使用 `marked`（Markdown 解析）、`jsdom`（DOM 操作）、`highlight.js`（代码高亮）
- 根项目无构建工具，纯静态 HTML

## 识图能力 (Vision)

底层模型无原生识图能力，遇到图片时使用 `vision.js` 调用外部 vision API：

```bash
node vision.js "<图片路径>" [问题]       # 默认日常模型（最便宜）
node vision.js "<图片路径>" -t pro       # 复杂任务用更强模型
node vision.js --url "<图片链接>" -t fallback  # 备用路由
```

### Tiers（按价格排序）
| Tier | 首选模型 | 适用场景 | 自动降级 |
|------|---------|---------|---------|
| `daily` | gemini-3-flash-preview | 日常识图，最便宜 | gemini-3.1-pro-preview 兜底 |
| `pro` | gemini-3.1-pro-preview | 复杂图片分析 | gemini-3-pro-preview 备选 |
| `fallback` | 全模型轮询 | 上述都连不上时 | Flash → Pro → Qwen → GPT 顺序试 |

### 触发场景
- 用户分享图片路径（本地或网络 URL）
- 用户要求分析、描述、识别图片内容
- 遇到截图、示意图等需要视觉理解的任务
