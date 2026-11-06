# 独立个人主页

个人主页独立部署在 `https://cv.largeoyos.me/`。Vercel 项目的 Root Directory 为 `hugo-draft/stack-personal`，使用本目录的 `vercel.json` 和 `build-vercel.sh`。在仓库根目录执行 `npm run build:personal` 可单独构建并校验个人主页。

两个站点分别构建，个人主页不添加跳转到主站的导航。
