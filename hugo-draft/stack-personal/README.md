# 独立个人主页

个人主页保留在主站的 `/personal/`，供 GitHub Pages 使用。也可在 Vercel 中作为独立项目部署：仓库选择本仓库，Root Directory 设为 `hugo-draft/stack-personal`，然后将 `cv.largeoyos.me` 绑定到该项目。独立项目使用本目录的 `vercel.json` 和 `build-vercel.sh`，构建时将 Hugo 的 baseURL 设为 `https://cv.largeoyos.me/`。

两个站点分别构建，个人主页不添加跳转到主站的导航。
