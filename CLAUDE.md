# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

个人静态网站/知识库，部署在 GitHub Pages 上。包含博客系统、AI 教程文库、网页小游戏、投资观察仪表板、快捷导航页面。

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
├── invest/
│   ├── index.html          # 投资观察仪表板 — ECharts 行情图表
│   ├── css/invest.css      # 投资版块专用样式
│   ├── js/invest.js        # 前端行情逻辑
│   ├── scripts/            # Python 数据采集脚本（scrape.py）
│   └── data/               # 本地样本/缓存数据（JSON）
├── quick-nav/index.html    # 快捷导航页 — 分类常用网站入口
├── 待拆解/                 # AI 教程长文 Markdown 源文件（按 ## 拆分）
├── 细小知识.md             # 碎片化知识临时记录
├── auto_split_docs.js      # Markdown 增量拆分脚本（Node.js）
├── CHANGELOG.md            # 版本更新日志（遵循 SemVer）
└── package.json            # 根项目依赖（marked, jsdom, highlight.js）
```

## Key Conventions

### Versioning & Changelog
- 遵循 SemVer (`x.x.x`)：MAJOR=架构改变，MINOR=新功能/文章，PATCH=修复/样式
- 每次更新必须更新 `CHANGELOG.md` 并在所有入口页面底部同步版本号

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
修改版本号时，同步更新以下文件的页脚：`index.html`, `blog/index.html`, `ai-tutorials/index.html`, `games/index.html`, `invest/index.html`, `quick-nav/index.html`

### Path References
所有资源引用使用相对路径（如 `../css/style.css`），确保 GitHub Pages 子路径兼容

## Tech Details

### Home Calendar
- 使用 `lunar-javascript` 库计算农历/干支/节气
- 运势系统：多维度混合哈希算法（干支柱干支 + 生肖 + 节气 + 星期 + 日期）
- 支持布局切换（日历优先/项目优先），偏好存储于 localStorage

### Invest Section
- ECharts 5.4.3 渲染 K 线图/分时图
- Python 数据采集脚本在 `invest/scripts/` 中
- 资产：建行黄金积存、英伟达 NVDA、纳斯达克 NASDAQ

### Sub-projects
- `games/acquire/` (并购桌游): React + Vite + TypeScript，独立 `package.json`
- `games/suika/` (合成大西瓜): Canvas 原生 JS 实现
- `games/flxg-2048/`: 纯 JS HTML5 游戏，含 AI 自动演示
- `并购-(acquire)---经典桌游/`: Acquire 的旧版源码目录

### Dev Dependencies
- Node.js 脚本使用 `marked`（Markdown 解析）、`jsdom`（DOM 操作）、`highlight.js`（代码高亮）
- 根项目无构建工具，纯静态 HTML
