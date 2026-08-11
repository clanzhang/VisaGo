# VisaGo 签证助手 / Visa Assistant

VisaGo 是一款一站式签证申请助手，覆盖从**查询签证政策**、**扫描材料并 AI 识别**、**生成申请文档**到**进度追踪**的全流程。采用 Tauri + React + TypeScript 构建，支持 Web 与桌面端双平台。

VisaGo is an all-in-one visa application assistant covering the full workflow: **browsing visa policies**, **scanning documents with AI recognition**, **generating application documents**, and **tracking progress**. Built with Tauri + React + TypeScript, supporting both Web and Desktop.

---

## ✨ 功能特性 / Features

| 模块 Module | 说明 Description |
|------------|------------------|
| 🏠 首页 Dashboard | 热门目的地、费用概览、办理进度一目了然 |
| 🤖 申请助手 Assistant | 四步生成个性化签证方案（国家 → 类型 → 身份 → 结果） |
| 📁 材料扫描 Scan | 桌面端选择文件夹，递归扫描 PDF/JPG/PNG/DOCX，Kimi AI 自动识别类型并提取字段 |
| ✅ 进度追踪 Tracker | 管理申请进度，时间线推进、预计出签提醒 |
| 📝 资料生成 Documents | 一次填写，AI 生成行程单 / 在职证明 / 邀请函 / 解释信，导出 PDF |
| 📚 签证百科 Encyclopedia | 7 国签证要求、材料、费用、领区、FAQ 一站式查询，支持多国对比 |
| 🌐 双语 i18n | 简体中文 / English 切换 |
| 🧠 Kimi AI 集成 | Moonshot (moonshot-v1-128k) 驱动的数据获取、个性化推荐与文档生成 |

---

## 🛠️ 技术栈 / Tech Stack

| 层 Layer | 技术 Technology |
|----------|-----------------|
| 桌面壳 Desktop Shell | [Tauri v2](https://tauri.app/) (Rust) |
| 前端框架 Frontend | React 18 + TypeScript |
| 样式 Styling | Tailwind CSS v4 |
| 路由 Routing | React Router v7 |
| 构建工具 Build | Vite 6 |
| AI 引擎 AI Engine | Moonshot Kimi (moonshot-v1-128k) |
| 本地存储 Local Storage | localStorage / Tauri 本地 JSON 文件 |

---

## 🚀 快速开始 / Quick Start

### 环境要求 / Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/) toolchain（仅桌面端需要 / desktop only）
- Kimi API Key（[Moonshot 开放平台](https://platform.moonshot.cn/) 获取）

### 配置 / Configuration

```bash
# 复制示例配置并填入你的 Kimi API Key
cp .env.example .env
# 编辑 .env：
#   KIMI_API_KEY=你的密钥
#   KIMI_BASE_URL=https://api.moonshot.cn/v1
#   KIMI_MODEL=moonshot-v1-128k
```

> ⚠️ `.env` 已被 `.gitignore` 忽略，密钥不会进入仓库。

### 安装依赖 / Install

```bash
npm install
```

### 启动 Web 版 / Run Web

```bash
npm run dev
# 打开 http://localhost:1420
```

### 启动桌面版 / Run Desktop (Tauri)

```bash
npm run dev        # 终端 1：前端 dev server
npx tauri dev      # 终端 2：桌面应用（需先安装 Rust）
```

### 构建 / Build

```bash
npm run build      # Web 生产构建
npx tauri build    # 桌面安装包
```

---

## 📁 目录结构 / Project Structure

```
VisaGo/
├── src/                    # 前端源码 Frontend
│   ├── pages/              # 页面（Home/Assistant/Scan/Tracker/Documents/Encyclopedia...）
│   ├── components/         # 组件（layout/common/home/visa）
│   ├── api/                # Kimi API 客户端与 Prompts
│   ├── hooks/              # AI 数据层 / 推荐 / 本地存储
│   ├── stores/             # React Context 状态管理
│   ├── data/               # 7 国签证静态数据 + mock
│   ├── i18n/               # 中英文文案
│   ├── types/              # 类型定义
│   └── utils/              # PDF 导出 / 日期工具
├── src-tauri/              # Tauri 桌面端（Rust）
│   ├── src/                # kimi.rs / scanner.rs / recognizer.rs / store.rs ...
│   ├── capabilities/       # 桌面权限配置
│   └── Cargo.toml
├── .env.example            # 环境变量示例
└── vite.config.ts
```

---

## 🧠 Kimi AI 集成 / AI Integration

- **数据获取**：首页、百科详情按需调用 Kimi 拉取最新签证政策（7 天缓存）
- **材料识别**：桌面端扫描文件后，Kimi 识别类型（身份证/护照/流水/在职证明...）并提取字段
- **个性化推荐**：按用户职业/户籍/签发地生成材料清单、风险提示、通过率建议
- **文档生成**：生成行程单/在职证明/邀请函/解释信，中英双语
- **安全**：Web 模式经 Vite 代理隐藏 Key；桌面模式 Key 存于 Rust 后端

---

## 📄 License / 版权

本仓库为**私有项目**，保留所有权利。未经授权，禁止复制、分发或用于商业用途。

This is a **private project**. All rights reserved. Unauthorized copying, distribution, or commercial use is prohibited.

---

## 🙏 致谢 / Acknowledgments

- [Tauri](https://tauri.app/) · [React](https://react.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Vite](https://vite.dev/)
- [Moonshot Kimi](https://platform.moonshot.cn/) 提供 AI 能力
