# Hugo 迁移草案

`stack-personal/` 是独立的 Hugo + Stack 个人主页草案；`main/` 是此前的主站 Hugo 迁移试验。两站没有相互链接。`personal/` 保留此前的 Toha 草案。

主站当前使用 `stack-main/`：真实 Stack v4.0.3，已将 534 个原页面（含 200 个实验）全部接入新主题，完整保留原内容、emoji 与交互功能。原始 HTML 不直接复制成新版页面。构建见 `stack-main/README.md`，使用 Hugo 0.166.0；根目录可执行 `npm run build:site`。

`main/`、`blowfish-main/` 和 `personal/` 仅保留此前的兼容性、Blowfish 与 Toha 试验；当前主站构建不使用这些旧试验。正式发布应使用 `stack-main/public/` 产物，不能直接发布原 HTML 输入目录。

Stack 草案需要 Hugo Extended、Go 和网络访问主题模块；在 `stack-personal/` 目录运行 `hugo server`。个人信息与真实文章待补充。

主题采用 Toha v4.16.0，依赖 Hugo Extended 0.163.0 或以上、Go 和 Node.js。安装好工具后，在 `personal/` 目录执行：

```sh
npm install --workspaces=false
hugo server
```

目前使用 Toha 默认背景及默认头像作为主题占位，正式使用前应更换为用户授权的图片；介绍、教育和项目均为待填写内容。预览使用相对路径，正式发布时仍需按实际域名和部署路径配置 `baseURL` 并重新验证。

## 维护与发布

1. 主站入口、博客、教程和应用已由独立的 Hugo 源目录统一输出；继续保留现有 URL、Markdown 数据和资源路径。
2. 日历、游戏、计算器及其他应用继续运行原逻辑，通过统一模板和样式适配输出；不直接发布旧页面界面。
3. 个人主页单独使用 Stack 配置，构建到独立路径或独立域名；与主站不互相放置链接。两个站点分别维护内容和导航。
4. 在隔离的输出目录比较旧站与新站的页面、资源与行为，再分别验证 GitHub Pages 与 Vercel 的构建和子路径。正式替换或部署前单独确认。

GitHub Pages 的 Hugo 工作流和 Vercel 配置均发布 `stack-main/public/`；独立个人主页构建到其中的 `personal/`，两站不互相链接。`.nojekyll` 和全部原内容继续保留。
