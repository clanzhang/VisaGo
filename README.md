<div align="center">

# VisaGo 签证助手

<p>AI 驱动的签证申请全流程助手</p>

</div>

<div align="center">

[![Version](https://img.shields.io/badge/version-0.0.8-blue)](https://github.com/yourusername/visago)
[![Platform](https://img.shields.io/badge/platform-macOS%7CWindows%7CLinux-lightgrey)](https://tauri.app)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

<div align="center">

[English](./README.en.md) | **中文**

</div>

---

## ✨ 特性

- 🧠 **AI 驱动** — 接入 Moonshot Kimi，自动查询签证政策、识别材料、生成个性化方案
- 🤖 **智能申请助手** — 四步生成专属签证方案：材料清单、费用、周期、风险提示
- 📁 **材料扫描** — 桌面端选文件夹，自动识别 PDF/JPG/PNG/DOCX 并提取关键字段
- ✅ **进度追踪** — 管理申请进度，时间线推进与预计出签提醒
- 📝 **文档生成** — AI 一键生成行程单 / 在职证明 / 邀请函 / 解释信，导出 PDF
- 🌐 **双语界面** — 简体中文 / English 随时切换

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- Rust 工具链（仅桌面端）
- Kimi API Key（[Moonshot 开放平台](https://platform.moonshot.cn/) 获取）

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/visago.git
cd visago

# 安装依赖
npm install

# 配置环境变量（复制示例并填入 Kimi Key）
cp .env.example .env
```

### 构建

```bash
# Web 开发服务器
npm run dev

# Web 生产构建
npm run build

# 桌面应用（需先安装 Rust）
npx tauri dev
npx tauri build
```

## 📖 使用指南

1. **配置 Key** — 复制 `.env.example` 为 `.env` 并填入你的 Kimi API Key
2. **查询政策** — 打开「签证百科」查看 7 国签证要求、费用与周期
3. **申请方案** — 在「申请助手」选择国家、类型并填写身份，AI 生成个性化清单
4. **扫描材料** — 桌面端在「材料扫描」选择文件夹，AI 自动识别并提取字段
5. **生成文档** — 在「资料生成」一键生成签证材料并导出 PDF

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| 桌面框架 | Tauri 2.0 (Rust) |
| 前端框架 | React 18 + TypeScript 5 |
| 样式 | Tailwind CSS |
| 构建工具 | Vite 6 |
| 路由 | React Router 7 |
| AI 引擎 | Moonshot Kimi (moonshot-v1-128k) |

## 📁 项目结构

```text
visago/
├── src/                    # 前端源码
│   ├── pages/              # 页面（Home/Assistant/Scan/Tracker/Documents/Encyclopedia...）
│   ├── components/         # 组件（layout/common/home/visa）
│   ├── api/                # Kimi API 客户端与 Prompts
│   ├── hooks/              # AI 数据层 / 推荐 / 本地存储
│   ├── stores/             # React Context 状态管理
│   ├── data/               # 7 国签证静态数据 + mock
│   ├── i18n/               # 中英文文案
│   └── types/              # 类型定义
├── src-tauri/              # Tauri 桌面端（Rust）
│   ├── src/                # kimi.rs / scanner.rs / recognizer.rs / store.rs ...
│   └── capabilities/       # 桌面权限配置
├── .env.example            # 环境变量示例
└── package.json
```

## 🔒 隐私与安全

- 🔑 **Key 保护** — Kimi API Key 存于本地 `.env`（已 gitignore）或 Rust 后端，不进入前端 bundle
- 📁 **本地优先** — 申请数据、扫描记录、用户资料均存本地（localStorage / Tauri 本地文件）
- 🚫 **不采集** — 不上传用户隐私数据，AI 调用仅用于签证信息查询与文档生成

## 🛂 支持的签证类型

| 类型 | 说明 |
|------|------|
| 🇹🇭 免签/落地签 | 泰国、济州岛等免签或落地签目的地 |
| 🇯🇵🇰🇷 需提前办理 | 日本、韩国等需提前办理签证的国家 |
| 🇪🇺🇺🇸🇬🇧🇦🇺 需提前办理 | 申根、美国、英国、澳大利亚等严格审核国家 |

## 📦 迭代版本

### v0.0.8 (当前版本)

- 🎉 版本更新发布
- ✅ 签证百科（免签/落地签/需提前办理分类）
- ✅ AI 文件扫描识别（身份证/护照/银行流水/在职证明）
- ✅ 智能材料清单生成
- ✅ 文档自动生成（行程单/在职证明/邀请函/个人陈述）
- ✅ 申请进度追踪
- ✅ 签证对比查询

### v0.0.9 (计划中)

- 🔜 接入更多国家签证数据
- 🔜 AI 智能问答浮窗
- 🔜 自动更新功能
- 🔜 多语言支持完善

## 🤝 贡献

欢迎提交 Issue 与 Pull Request！请确保：

- 代码通过 `npm run build` 构建检查
- 遵循现有的代码风格与结构
- 重大改动请先开 Issue 讨论

## ⚠️ 免责声明

VisaGo 提供的签证信息仅供参考，不构成法律建议。签证政策变化频繁，请务必以各国使领馆官方公告为准。因使用本工具产生的任何后果，作者不承担责任。

---

<div align="center">

Made with ❤️ by [VisaGo Team](https://github.com/clanz/visago)

</div>
