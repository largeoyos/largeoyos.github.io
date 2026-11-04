# 主站 Blowfish 草案

主站采用 Blowfish v3.9.0 的 Landing 首页与主题原生 feature-grid 组件，使用 Ocean 蓝青主色，各栏目搭配彩色图标、边线与浅色背景，深色模式保留栏目颜色。字体为自托管 Mulish，中文由系统字体回退。字体许可证在 `static/fonts/OFL.txt`。

## 构建与预览

需要 Hugo Extended 0.164.0 至 0.167.0、Go 和首次下载主题所需的网络访问。当前验证使用 Hugo Extended 0.166.0。`go.mod` 和 `go.sum` 固定主题版本。

在本目录运行 `hugo server`，或从仓库根目录运行：

```sh
hugo --source hugo-draft/blowfish-main --destination <隔离输出目录>
```

用 HTTP 服务器预览构建结果，不要使用 HTML 文件预览。正式发布前需要按实际域名和部署子路径配置 `baseURL`。

## 当前范围

- 首页使用真实 Blowfish 主题；栏目入口和最近文章来自现有站点。
- 旧主页挂载为 `workspace.html`，保留日历及其脚本。栏目子页面暂时沿用原来的 HTML 和样式。
- 原有文件直接挂载，不复制到源码目录。`.nojekyll` 随构建保留。
- 搜索尚未启用，因为原有静态文章还没有转为 Hugo 内容；避免出现无结果的搜索入口。
- 个人主页仍单独使用 Stack；本草案没有个人主页链接。
- 正式站入口、子项目和部署配置尚未替换。本次草案不提升正式站版本。

主题配置遵循 [官方 Blowfish skill](https://github.com/nunocoracao/blowfish/blob/main/.claude/skills/blowfish/SKILL.md)。
