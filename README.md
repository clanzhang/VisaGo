<div align="center">

# VisaGo 签证助手

<p>AI 驱动的签证申请全流程助手</p>

</div>

<div align="center">

[![Version](https://img.shields.io/badge/version-0.3.0-blue)](https://github.com/yourusername/visago)
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
| AI 引擎 | Moonshot Kimi (moonshot-v1-8k) |

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

### v0.3.0 (当前版本)

- ✅ 申请助手接入个性化推荐：进入方案页自动生成「个性化建议」（重点材料/风险提示/办理周期与费用预估），带「AI 实时生成」来源标注；Key 无效/离线时明确提示原因
- ✅ 侧栏用户卡片弹出「个人资料」弹窗（账号功能占位），与设置弹窗职责分离、互斥打开
- 🐛 移除行程静默自动生成：材料页加载不再自动编造行程，改为用户主动生成，并标注「AI 生成建议，请按真实计划修改」
- 🐛 清理前端零调用的 Rust 死命令（get_visa_data / refresh_visa_data 及未用 cache 模块），cargo 零警告

### v0.2.1

- 🐛 修复证件照/银行流水检测的假「通过」：占位实现硬编码返回通过结果误导用户，改为接入 Kimi 视觉真实识别，失败如实显示原因
- 🐛 页面级代码分割 + vendor/data 共享 chunk 拆分，消除切页白屏、降低首屏加载

### v0.2.0

- ✅ 开发包 macOS 自签名：配置代码签名证书，隐私面板（摄像头/麦克风/通知）可识别并授权应用
- ✅ 版本号改为插件注入，dev 下改版本号刷新即生效，无需重启 dev server

### v0.1.2

- 🐛 修复大输出 AI 请求因 max_tokens 超出模型上下文被拒：国家详情/助手推荐/首页概览显式使用 32k 模型
- 🐛 移除首页与国家详情页的黄色降级横幅，改为极轻量数据来源指示（小圆点 tooltip），AI 正常时不出现

### v0.1.1

- 🐛 修复桌面端 AI 数据静默降级：`ai_chat` IPC 返回形状与前端断言不一致，导致首页始终显示本地兜底数据、黄色降级横幅无法消除
- 🐛 IPC 边界增加运行时校验（形状异常不再伪装成「服务不可用」），AI 错误区分 Key 无效 / 限流 / 网络 / 形状四类
- 🐛 修复 macOS 全应用无法粘贴（⌘V/⌘C/⌘X/⌘A/⌘Z 失效）：补齐标准 Edit/Window 菜单

### v0.1.0

- ✅ 新增「设置 → AI 模型」分区：配置 Kimi API Key（掩码显示、替换/清除、测试连接），支持环境变量 / 用户设置 / .env 三来源取 Key
- ✅ 新增澳门到签证百科与申请签证（需通行证类型），首页热门目的地同步上线
- ✅ 设置入口统一为 ⌘, / 用户卡片，弹窗精简为 通知 / AI / 关于 三栏
- ✅ 进度追踪首次添加申请后引导开启递签/出签提醒
- ✅ 材料扫描保存后结果态（存到哪张卡/写入字段/缺失必填）+ 跨人数据串档防护

### v0.0.11

- ✅ 首页统计模块改为从真实申请记录计算（费用 + 进度）
- ✅ 新增香港、台湾到签证百科与申请签证（需通行证类型）
- ✅ 选国家页加签证类型筛选 tab（互免/单免/落地/电子/需通行证）
- ✅ 港澳台费用细化（通行证/签注/入台证）
- ✅ 多国 region 调整为欧洲（格鲁吉亚/白俄罗斯/土耳其等）

### v0.0.10

- ✅ 官方签证费用数据（11 国多币种，含生效日期与来源）
- ✅ 日本签证费更新为官方数据（单次 ¥715 / 两次 ¥1430 / 多次 ¥1430）
- ✅ 签证百科新西兰/申根材料升级（翻译标注、必交/选交分组、导出 PDF、折叠）
- ✅ 材料扫描视觉识别（扫描件 PDF 转图片 + Kimi Vision）
- ✅ PDF 导出改用 printpdf（中文字体 + 字体子集化，修复空白）
- ✅ 窗口尺寸调整（1100×720，min 900×600）

### v0.0.9

- ✅ 多资料卡管理：每次扫描保存为一张资料卡（可命名），支持切换/新建/删除
- ✅ 申请助手自动读取活跃资料卡，一键填入申请信息
- ✅ 材料扫描支持选文件夹或单个/多个文件（系统选择器）
- ✅ 扫描页支持追加文件、自动识别新文件
- ✅ 行程单识别提取真实行程数据，AI 生成不再使用占位符
- ✅ 保存功能修复（字段归一化 + 容忍缺字段）
- ✅ 移除「资料生成」独立页，材料流程统一为扫描 → 识别 → 核对 → 自动填写 → 保存

### v0.0.8

- 🎉 版本更新发布
- ✅ 签证百科（免签/落地签/需提前办理分类）
- ✅ AI 文件扫描识别（身份证/护照/银行流水/在职证明）
- ✅ 智能材料清单生成
- ✅ 文档自动生成（行程单/在职证明/邀请函/个人陈述）
- ✅ 申请进度追踪
- ✅ 签证对比查询



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
