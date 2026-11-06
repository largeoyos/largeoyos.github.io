# 主站 Hugo / Stack

当前版本为 `5.0.0-preview.10`，使用真实 Stack v4.0.3 主题和默认 Lato 字体。主站所有 534 个原页面（含 200 个实验）均通过 Hugo 输出新界面。个人主页位于 `../stack-personal/`，两站没有相互链接。

## 构建与预览

需要 Hugo 0.166.0、Go 1.25 和 Node.js 22.13 以上；本次使用 Node.js 24.14.1。首次安装需要网络。Hugo 应在 PATH 中。在本目录执行：

```sh
npm ci --workspaces=false
npm run build
npm run verify
npm run dev
```

仓库根目录也可运行 `npm run build:site` 和 `npm run preview:site`。输出目录为本目录的 `public/`，其中 `personal/` 是独立构建的个人主页，两站不互相链接。Vercel 由根目录 `vercel.json` 构建并发布该目录；GitHub Pages 工作流位于 `.github/workflows/deploy-hugo.yml`，需在仓库 Pages 设置中选择 GitHub Actions。

通过 HTTP 预览，避免文件预览丢失样式。主题链接由 `RelPermalink`、`relURL` 和完整 `baseURL` 管理；保留路径大小写。子路径构建示例：

```sh
hugo --baseURL http://localhost:8000/preview/ --destination <隔离输出目录>
node scripts/verify-output.mjs <隔离输出目录>
```

## 内容与功能

- 主页保留全部原 emoji、九个项目入口、完整说明和标签；日历、农历、签到、古今时钟以及“日历优先／项目优先”的原存储偏好完整保留。
- 博客、280 篇 AI Markdown、610 条教程目录、讲义、科研应用、200 个实验、全部 PDF 和原资源路径保留；旧 query URL 与 `workspace.html` 均进入 Stack 界面。
- 阅读器保留原 Markdown 全文复制、章节键盘折叠、每段代码复制、数学公式、原数组顺序的上下篇和回顶；原生 Hugo 文章补回相同功能。
- 四个游戏、矩阵、随机数/数字炸弹、科学计算器、行情与量化练习继续运行原逻辑和存储键。React 页面直接接入主题，未用旧整页 iframe 替代；实验 iframe 的子页面也已同步改为新主题。
- 课程进度、笔记、备份/恢复、文献队列和功能状态栏保留。图形的几何和语义色保留，界面的导航、卡片、控件、字体和配色使用 Stack。
- Lato 字体自托管，许可证见 `static/fonts/OFL.txt`。`.nojekyll` 随构建保留，产物可用于 GitHub Pages 或 Vercel 静态托管。
- 侧栏可切换海岸蓝、松林绿、暖沙橙、暮紫和岩石灰；配色与深色模式各自独立，保存在当前浏览器。

## 维护

原 HTML、Markdown、索引和应用资源继续作为内容与逻辑的输入。`scripts/import-posts.mjs` 导入博客；`scripts/import-site.mjs` 分批生成 Hugo 内容和限定作用域的应用样式、脚本。生成目录被 Git 忽略，修改原内容后重新运行 `npm run import`。

原始 HTML 不作为静态页面复制，原 UI 的 CSS/JS 也由适配版本替换，防止旧界面覆盖 Hugo 输出。SVG 样式同样限定到应用范围；原脚本只将 DOM 查询限定到当前应用，不修改记录键或教学代码字符串。纯版权页脚由主题替换，功能和说明页脚保留。

`verify-output.mjs` 逐页检查主题、完整正文和旧导航残留，并按字节比对 Markdown、JSON、PDF、图像、字体及下载资源。报告位于 `generated-site/verification.json`；构建清单位于 `generated-site/manifest.json`。已知迁移问题与解决方法见 `ERRORS.md`。
