# 更新日志 (Changelog)

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/) (语义化版本) 规范 (`x.x.x`)。

## [1.1.1] - 2026-04-28

### 修复/微调 (Patch)
- 将 C++ `#pragma` 相关的微知识点正式归档至博客 `micro-knowledge.md` 中。

## [1.1.0] - 2026-04-28

### 新增 (Added)
- 新增 `auto_split_docs.js` 脚本，支持基于文件修改时间戳（mtime）进行全自动增量 Markdown 文档拆解。
- 引入项目版本号控制约定，并在主页页脚展示当前版本号。
- 建立根目录 `.github/copilot-instructions.md` 进行 AI 辅助开发标准化提示。

### 移除 (Removed)
- 废弃并删除了旧版本的冗余文件：`ai-tutorials/split.js`、`process_new_docs.js` 和 `test_hljs.js`。

## [1.0.0] - 2026-04-28 及之前

### 初始化 (Initial Release)
- 初始建立并部署个人静态博客系统。
- 包含个人简介、AI 教程文库页面（长文分发）与游戏大厅导航。
- 集成经典的 Web 游戏（如 2048 与 并购 Acquire）。
- 配置 `.nojekyll` 用以直接托管 `_assets` 等前端框架编译产出。