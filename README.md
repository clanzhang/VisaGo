<div align="center">

# VisaGo

**签证申请一站式助手 · All-in-One Visa Assistant**

</div>

---

## 中文

<div align="center">

### VisaGo

</div>

### 📖 简介

VisaGo 是一款一站式签证申请助手，覆盖从**查询签证政策**、**扫描材料并 AI 识别**、**生成申请文档**到**进度追踪**的全流程。基于 Tauri + React + TypeScript 构建，支持 Web 与桌面双平台。

### ✨ 功能特性

| 模块 | 说明 |
|------|------|
| 🏠 首页 | 热门目的地、费用概览、办理进度一目了然 |
| 🤖 申请助手 | 四步生成个性化签证方案（国家 → 类型 → 身份 → 结果） |
| 📁 材料扫描 | 桌面端选择文件夹，递归扫描 PDF/JPG/PNG/DOCX，Kimi AI 自动识别并提取字段 |
| ✅ 进度追踪 | 管理申请进度，时间线推进、预计出签提醒 |
| 📝 资料生成 | 一次填写，AI 生成行程单 / 在职证明 / 邀请函 / 解释信，导出 PDF |
| 📚 签证百科 | 7 国签证要求、材料、费用、领区、FAQ 一站式查询，支持多国对比 |
| 🌐 双语 | 简体中文 / English 切换 |
| 🧠 Kimi AI | Moonshot (moonshot-v1-128k) 驱动的数据获取、个性化推荐与文档生成 |

### 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | Tauri v2 (Rust) |
| 前端 | React 18 + TypeScript |
| 样式 | Tailwind CSS v4 |
| 路由 | React Router v7 |
| 构建 | Vite 6 |
| AI | Moonshot Kimi (moonshot-v1-128k) |
| 存储 | localStorage / Tauri 本地 JSON |

### 🚀 快速开始

**环境要求**
- Node.js ≥ 18
- Rust 工具链（仅桌面端）
- Kimi API Key（[Moonshot 开放平台](https://platform.moonshot.cn/) 获取）

**配置**

```bash
cp .env.example .env
# 编辑 .env：填入你的 KIMI_API_KEY
```

> ⚠️ `.env` 已被 `.gitignore` 忽略，密钥不会进入仓库。

**安装与启动**

```bash
npm install
npm run dev        # Web 版：http://localhost:1420
npx tauri dev      # 桌面版（需先安装 Rust）
```

**构建**

```bash
npm run build      # Web 生产构建
npx tauri build    # 桌面安装包
```

### 📁 目录结构

```
VisaGo/
├── src/                    # 前端源码
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

### 🧠 Kimi AI 集成

- **数据获取**：首页、百科详情按需调用 Kimi 拉取最新签证政策（7 天缓存）
- **材料识别**：扫描文件后，Kimi 识别类型（身份证/护照/流水/在职证明...）并提取字段
- **个性化推荐**：按用户职业/户籍/签发地生成材料清单、风险提示、通过率建议
- **文档生成**：生成行程单/在职证明/邀请函/解释信，中英双语
- **安全**：Web 经 Vite 代理隐藏 Key；桌面端 Key 存于 Rust 后端

### 📄 版权

本仓库为**私有项目**，保留所有权利。未经授权，禁止复制、分发或用于商业用途。

---

## English

<div align="center">

### VisaGo

</div>

### 📖 About

VisaGo is an all-in-one visa application assistant covering the full workflow: **browsing visa policies**, **scanning documents with AI recognition**, **generating application documents**, and **tracking progress**. Built with Tauri + React + TypeScript, supporting both Web and Desktop platforms.

### ✨ Features

| Module | Description |
|--------|-------------|
| 🏠 Dashboard | Popular destinations, fee overview, and processing progress at a glance |
| 🤖 Assistant | 4-step personalized visa plan (Country → Type → Identity → Result) |
| 📁 Scan | Desktop: pick a folder, recursively scan PDF/JPG/PNG/DOCX, Kimi AI recognizes & extracts fields |
| ✅ Tracker | Manage application progress with timeline and expected-result reminders |
| 📝 Documents | Fill once, AI generates itinerary / employment certificate / invitation / cover letter, export PDF |
| 📚 Encyclopedia | 7 countries' visa requirements, materials, fees, districts & FAQ, with multi-country comparison |
| 🌐 i18n | Simplified Chinese / English switch |
| 🧠 Kimi AI | Moonshot (moonshot-v1-128k) powered data fetch, recommendations & document generation |

### 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Build | Vite 6 |
| AI | Moonshot Kimi (moonshot-v1-128k) |
| Storage | localStorage / Tauri local JSON |

### 🚀 Quick Start

**Prerequisites**
- Node.js ≥ 18
- Rust toolchain (desktop only)
- Kimi API Key (from [Moonshot Platform](https://platform.moonshot.cn/))

**Configuration**

```bash
cp .env.example .env
# Edit .env: fill in your KIMI_API_KEY
```

> ⚠️ `.env` is ignored by `.gitignore`, keys never enter the repo.

**Install & Run**

```bash
npm install
npm run dev        # Web: http://localhost:1420
npx tauri dev      # Desktop (requires Rust first)
```

**Build**

```bash
npm run build      # Web production build
npx tauri build    # Desktop installer
```

### 📁 Project Structure

```
VisaGo/
├── src/                    # Frontend source
│   ├── pages/              # Pages (Home/Assistant/Scan/Tracker/Documents/Encyclopedia...)
│   ├── components/         # Components (layout/common/home/visa)
│   ├── api/                # Kimi API client & prompts
│   ├── hooks/              # AI data layer / recommendation / local storage
│   ├── stores/             # React Context state management
│   ├── data/               # 7-country visa static data + mock
│   ├── i18n/               # zh-CN / en-US strings
│   ├── types/              # Type definitions
│   └── utils/              # PDF export / date utils
├── src-tauri/              # Tauri desktop (Rust)
│   ├── src/                # kimi.rs / scanner.rs / recognizer.rs / store.rs ...
│   ├── capabilities/       # Desktop permission config
│   └── Cargo.toml
├── .env.example            # Environment variable example
└── vite.config.ts
```

### 🧠 Kimi AI Integration

- **Data fetch**: Home & encyclopedia fetch latest visa policies on demand via Kimi (7-day cache)
- **Document recognition**: After scanning, Kimi identifies type (ID / passport / bank statement / employment cert...) and extracts fields
- **Personalized recommendation**: Generates material checklist, risk tips, approval advice based on user's occupation / domicile / passport issue place
- **Document generation**: Itinerary / employment certificate / invitation / cover letter, bilingual
- **Security**: Web hides key via Vite proxy; Desktop stores key in Rust backend

### 📄 License

This is a **private project**. All rights reserved. Unauthorized copying, distribution, or commercial use is prohibited.

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) · [React](https://react.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Vite](https://vite.dev/)
- [Moonshot Kimi](https://platform.moonshot.cn/) provides AI capabilities
