# largeoyos.github.io

LarGeoYos 的个人静态网站与知识库，集中收录博客、系统化学习笔记、网页游戏、在线工具、全球行情观察和量化学习实验。

- 在线访问：[https://largeoyos.github.io](https://largeoyos.github.io)
- 当前版本：`v3.2.1`
- 部署平台：GitHub Pages + Vercel

## 主要内容

| 模块 | 说明 |
| --- | --- |
| [工作主页](index.html) | 每日签到日历、农历与干支信息、古今时钟、运势计算及站点入口 |
| [博客大厅](blog/) | 使用 Markdown 编写的技术文章、效率笔记与碎片知识归档 |
| [AI 教学](ai-tutorials/) | STM32、数据结构、离散数学、编译原理、信息论、计算机网络、布尔代数及历史类系统笔记 |
| [游戏大厅](games/) | Acquire 桌游、合成大西瓜和带 AI 自动演示的 2048 |
| [工具箱](tools/) | 矩阵计算器、随机数助手和 fx-991CN X 科学计算器 |
| [全球行情](markets/) | 基于 TradingView 组件观察美股、港股、A 股、英国股票、黄金、期货与 ETF |
| [量化实验室](quant-lab/) | 围绕信号、仓位、回测偏差与研究复盘设计的浏览器端互动练习 |
| [快捷导航](quick-nav/) | 校园、AI 助手、金融市场、工具与娱乐等常用网站入口 |

## 技术架构

- 主站使用原生 HTML、CSS 与 JavaScript，保持纯静态部署和移动端适配。
- 博客与教程使用 Markdown 存储内容，前端通过 `marked` 渲染，并使用 `highlight.js` 进行代码高亮。
- 农历与干支信息由 `lunar-javascript` 计算，站点运行时使用本地脚本副本。
- Acquire 与 fx-991CN X 计算器的源码使用 React、Vite 和 TypeScript，作为 npm workspaces 管理。
- 全球行情使用 TradingView 外部组件；不同交易所的数据可能为实时、延时或收盘行情。
- 所有基础页面使用相对路径，兼容 GitHub Pages 与 Vercel 双平台部署。

## 目录结构

```text
.
├── index.html                         # 工作主页与每日签到日历
├── css/                               # 全站共享样式
├── js/                                # 首页逻辑与本地第三方脚本
├── blog/                              # 博客列表、渲染页面、索引和 Markdown 文章
├── ai-tutorials/                      # 教程目录、渲染页面及拆分后的章节
├── games/                             # Acquire、合成大西瓜、2048
├── tools/                             # 矩阵、随机数与科学计算器工具
├── markets/                           # 全球行情观察页
├── quant-lab/                         # 量化学习互动实验
├── quick-nav/                         # 快捷导航页
├── 待拆解/                            # AI 教程长文源文件
├── 并购-(acquire)---经典桌游/         # Acquire React + TypeScript 源码
├── fx-991cn-x-科学计算器/             # 科学计算器 React + TypeScript 源码
├── auto_split_docs.js                 # 教程增量拆分脚本
├── CHANGELOG.md                       # 版本更新记录
└── package.json                       # 根依赖、workspaces 与构建命令
```

`.nojekyll` 用于保证 GitHub Pages 直接托管静态资源，请勿删除。

## 本地运行

安装根项目及两个 workspace 的依赖：

```bash
npm install
```

主站会通过 `fetch` 加载 JSON 和 Markdown，请从仓库根目录启动任意静态文件服务器。例如：

```bash
python -m http.server 8000
```

随后访问 `http://localhost:8000/`。

React 子项目可分别启动：

```bash
npm run dev -w acquire-classic-board-game
npm run dev -w fx-991cn-x-calculator
```

常用检查与构建命令：

```bash
npm run lint:apps
npm run build:apps
```

## 内容维护

### 添加博客文章

1. 在 `blog/posts/` 中新增 Markdown 文件。
2. 在 `blog/posts.json` 中登记文章的 `id`、`title`、`date` 和 `category`。

### 更新 AI 教程

1. 编辑 `待拆解/` 中的长篇 Markdown 源文件，并使用二级标题 `##` 划分章节。
2. 运行增量拆分脚本：

```bash
node auto_split_docs.js
```

脚本会更新 `ai-tutorials/docs/` 中的章节文件和 `ai-tutorials/docs.json`。

### 版本发布

项目遵循语义化版本规范。每次迭代需要：

1. 在 `CHANGELOG.md` 末尾追加版本记录。
2. 同步更新 `index.html`、`blog/index.html`、`ai-tutorials/index.html`、`games/index.html` 和 `quick-nav/index.html` 的页脚版本号。

## 部署说明

仓库同时面向 GitHub Pages 与 Vercel：

- GitHub Pages 提供主站静态托管。
- Vercel 提供静态 CDN、HTTPS、预览部署与回滚能力。
- 基础浏览体验不依赖 Vercel 专属后端能力。
- 新增资源时应继续使用相对路径，确保两个平台均可访问。


