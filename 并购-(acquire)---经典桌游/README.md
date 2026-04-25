# 并购 (Acquire) —— 经典商业模拟桌游

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

### Overview
This project is a modern web implementation of the classic board game **Acquire**. It is a strategic business simulation game where players invest in hotel chains (or corporations), expand them through tile placement, and profit from mergers and stock price appreciation.

### Key Features
- **Full Game Logic**: Implements the complete Acquire rule set, including tile placement, chain founding, mergers, and stock trading.
- **AI Opponents**: Play against intelligent AI players that make strategic decisions based on market conditions.
- **Modern UI/UX**: Built with a sleek, dark-themed interface using **Tailwind CSS** and smooth animations via **Framer Motion**.
- **Interactive Board**: A responsive grid system representing the city blocks.
- **Real-time Stats**: Track player money, stock holdings, and corporation values dynamically.
- **Game History Log**: A detailed log of every action taken during the game.

### Tech Stack
- **Framework**: React 19
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Language**: TypeScript
- **Icons**: Lucide React

### Getting Started

#### Prerequisites
- Node.js (Latest LTS version recommended)
- npm or yarn

#### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/largeoyos/----acquire--------.git
   ```
2. Navigate to the project directory:
   ```bash
   cd 并购-(acquire)---经典桌游
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

#### Running the Project
Start the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

<a name="chinese"></a>
## 中文

### 项目概述
本项目是经典商业模拟桌游**《并购》(Acquire)** 的现代网页版实现。这是一款策略性极强的商业游戏，玩家通过放置板块来建立和扩张连锁集团，通过购买股票进行投资，并从公司合并和股价上涨中获取巨额利润。

### 主要功能
- **完整游戏逻辑**: 实现了《并购》的全部规则，包括板块放置、公司成立、并购决策（换股、卖出、保留）以及股票购买。
- **AI 对手**: 支持与具备策略思维的 AI 玩家对战。
- **现代 UI/UX**: 采用 **Tailwind CSS** 构建的酷炫深色系界面，以及通过 **Framer Motion** 实现的流畅动画效果。
- **交互式棋盘**: 响应式的网格系统，清晰展示城市地块状态。
- **实时数据看板**: 动态追踪玩家资金、持股情况及各公司的市值。
- **游戏日志**: 记录游戏过程中发生的每一项操作。

### 技术栈
- **框架**: React 19
- **构建工具**: Vite 6
- **样式**: Tailwind CSS 4
- **动画**: Framer Motion
- **语言**: TypeScript
- **图标**: Lucide React

### 快速开始

#### 环境要求
- Node.js (建议使用最新的 LTS 版本)
- npm 或 yarn

#### 安装步骤
1. 克隆仓库:
   ```bash
   git clone https://github.com/largeoyos/----acquire--------.git
   ```
2. 进入项目目录:
   ```bash
   cd 并购-(acquire)---经典桌游
   ```
3. 安装依赖:
   ```bash
   npm install
   ```

#### 运行项目
启动开发服务器:
```bash
npm run dev
```
在浏览器中访问 `http://localhost:3000` 即可开始游戏。

### 游戏规则简述
1. **放置板块**: 每回合玩家放置一个地块到棋盘上。
2. **成立公司**: 当两个相邻地块相连且不属于任何公司时，可以成立新公司并获得一股奖励。
3. **扩张与合并**: 地块与现有公司相邻会使其扩张；当两个或多个公司相连时，会发生并购。规模大的公司吞并规模小的公司。
4. **购买股票**: 玩家每回合最多可购买 3 股现有公司的股票。
5. **胜负判定**: 当所有板块放完，或某公司规模达到 41 以上，或所有存续公司都已“安全”（规模达 11 或以上）时，游戏结束。总资产（现金+股票市值）最高的玩家获胜。
