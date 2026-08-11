# VisaGo — 签证助手 Web App MVP

## 设计参考

视觉风格参考 Dribbble 作品：https://dribbble.com/shots/6243628-Visa-copy

### 设计语言提取

**色彩体系**（从参考设计提取）：
| 用途 | 色值 | 说明 |
|------|------|------|
| 主色-深空蓝 | `#0B1DA5` | 导航栏、Hero 背景渐变起点 |
| 主色-宝蓝 | `#1C39C3` | Hero 背景渐变终点、按钮 |
| 暗色 | `#0D0E32` | 深色背景、文字 |
| 中蓝 | `#17205A` | 卡片背景、次级区域 |
| 浅紫灰 | `#A2AAD0` | 辅助文字、装饰元素 |
| 背景灰 | `#F6F7F9` | 页面底色 |
| 点缀-紫 | `#7B2FBE` | CTA 按钮（费用计算等） |
| 点缀-橙 | `#F5A623` | 搜索图标、电话徽标 |

**视觉风格**：
- Hero 区域使用深蓝→宝蓝渐变，搭配飞机/云层大图的旅行意象
- 大量留白，卡片式内容区块
- 抽象几何装饰元素（三角、方块、折线）散布在白色区域，增加动感
- 圆角 12-16px，按钮为 pill 形（大圆角）
- 整体调性：专业可信赖 + 旅行感 + 现代简洁

**排版**：
- 标题：粗体无衬线，字间距略宽，营造大气感
- 正文：常规无衬线，行高 1.6-1.8
- 中文推荐字体：思源黑体 (Noto Sans SC)
- 英文/数字推荐字体：DM Sans 或 Outfit

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 构建工具 | Vite 6 |
| 框架 | Vue 3.5+ (Composition API) |
| 语言 | TypeScript + TSX |
| 路由 | Vue Router 4 |
| 样式 | UnoCSS (preset-wind + preset-icons) |
| 状态管理 | Pinia |
| 国际化 | vue-i18n (默认中文，支持英文切换) |
| PWA | vite-plugin-pwa |
| 表单 | VeeValidate + Zod |
| 图标 | @iconify-json/carbon |
| 数据持久化 | localStorage (MVP) |

---

## 项目结构

```
src/
├── assets/
│   ├── images/              # Hero 大图、国旗 SVG、装饰图形
│   └── styles/
│       └── global.css       # 全局样式、CSS 变量
├── components/
│   ├── common/              # VButton, VCard, VModal, VToast, VBadge
│   ├── layout/
│   │   ├── AppHeader.tsx    # 顶部导航（深蓝渐变背景）
│   │   ├── AppSidebar.tsx   # 桌面端侧边导航
│   │   └── LangSwitch.tsx   # 语言切换组件
│   └── visa/
│       ├── CountryCard.tsx  # 国家卡片（国旗+名称+难度标签）
│       ├── Timeline.tsx     # 进度时间线
│       ├── Checklist.tsx    # 材料清单
│       ├── GeoShape.tsx     # 几何装饰元素
│       └── FeeCalculator.tsx # 费用估算器
├── composables/
│   ├── useLocalStorage.ts
│   ├── useVisaQuery.ts
│   └── useNotification.ts
├── i18n/
│   ├── zh-CN.ts
│   └── en-US.ts
├── pages/
│   ├── Home.tsx             # 首页
│   ├── Assistant.tsx        # 签证申请助手
│   ├── Tracker.tsx          # 进度追踪
│   ├── Documents.tsx        # 资料生成
│   ├── Encyclopedia.tsx     # 签证百科
│   └── CountryDetail.tsx    # 国家详情页
├── stores/
│   ├── visaStore.ts         # 签证申请状态
│   ├── trackerStore.ts      # 进度追踪状态
│   └── appStore.ts          # 全局 UI 状态
├── data/
│   ├── countries.ts         # 国家签证数据
│   └── templates.ts         # 文档模板
├── types/
│   └── index.ts
├── utils/
│   ├── pdf.ts
│   └── date.ts
├── App.tsx
├── main.ts
└── vite-env.d.ts
```

---

## 页面设计（参考 Dribbble 风格）

### 1. 全局布局

**顶部导航栏**（参考 Dribbble 的深蓝渐变 header）：
- 背景：`#0D0E32` → `#0B1DA5` 水平渐变
- 左侧：Logo「VisaGo」+ 副标题「签证助手」
- 右侧：导航菜单（首页 / 申请助手 / 进度追踪 / 资料生成 / 签证百科）
- 最右：语言切换（中/EN）
- 导航项下方有下划线 hover 动效
- 固定定位，滚动时添加阴影

**不需要底部导航栏**，桌面端使用侧边栏辅助导航。

---

### 2. 首页 (Home)

**Hero 区域**（核心视觉，参考 Dribbble 设计）：
- 全屏深蓝渐变背景（`#0D0E32` → `#1C39C3`）
- 中央大标题：「轻松搞定签证」
- 副标题：「全球签证申请一站式助手」
- 视觉元素：飞机穿越云层的插画/图片（可用 CSS 渐变 + SVG 模拟）
- 白色几何线条装饰（云、三角、圆点）
- CTA 按钮：紫色 pill 按钮「开始申请」→ 跳转 Assistant
- 次要按钮：白色描边按钮「查看百科」→ 跳转 Encyclopedia

**快捷入口区域**（Hero 下方白色区域）：
- 4 张功能卡片横向排列（响应式 2x2）
- 每张卡片：图标 + 标题 + 简述 + 箭头
- 卡片 hover 微浮起 + 阴影加深
- 背景散布淡色几何装饰（三角、方块、折线）

**热门目的地**：
- 横向滚动卡片条：日本🇯🇵、韩国🇰🇷、泰国🇹🇭、申根🇪🇺、美国🇺🇸、英国🇬🇧、澳大利亚🇦🇺
- 每张：国旗 emoji + 国名 + 签证难度标签（易/中/难）

**最近申请进度摘要**（如有数据）：
- 紧凑卡片，显示国家 + 当前状态 + 进度条
- 点击跳转 Tracker 详情

---

### 3. 签证申请助手 (Assistant)

**步骤式向导**（Stepper 组件）：
- 顶部步骤条：① 选国家 → ② 选类型 → ③ 填身份 → ④ 看结果
- 当前步骤高亮（宝蓝色），已完成步骤打勾

**Step 1 — 选国家**：
- 搜索框（圆角，带搜索图标）
- 国家卡片网格（3 列桌面端，2 列平板，1 列手机）
- 每张卡片：国旗 + 中文名 + 英文名 + 难度标签
- 难度标签颜色：易=绿、中=橙、难=红

**Step 2 — 选签证类型**：
- 列表式卡片，每种类型显示：
  - 类型名称、停留天数、有效期、单次/多次
  - 费用、办理周期
- 单选，选中态有宝蓝色边框

**Step 3 — 用户身份**：
- 表单字段：
  - 护照签发地（下拉选择省份）
  - 户籍/居住地（下拉）
  - 职业身份（单选：在职/学生/退休/自由职业）
  - 是否有该国历史签证（是/否）
- 表单使用 VeeValidate + Zod 校验

**Step 4 — 结果页**：
- 材料清单，按分类折叠展示：
  - 基础材料 / 身份材料 / 财力材料 / 行程材料
  - 每项：名称 + 必须/可选标签 + 格式要求 + 翻译要求
- 费用明细卡片（签证费 + 服务费 + 快递费 = 总计）
- 办理周期甘特图（横向时间条）
- 注意事项列表
- 常见拒签原因（手风琴折叠）
- 底部操作：「生成材料清单 PDF」/「追踪此申请」

---

### 4. 进度追踪 (Tracker)

**页面布局**：
- 顶部：「新建申请」按钮（紫色 pill）
- 申请列表（卡片式）

**每个申请卡片**：
- 国家 + 签证类型 + 创建时间
- 当前状态标签（彩色 badge）
- 迷你进度条
- 点击展开详情

**申请详情**：
- 完整时间线（竖向）：
  ```
  ● 准备材料 ─── 2025-01-15
  │  备注：护照已更新
  ● 预约递签 ─── 2025-01-20
  │  备注：已预约北京使馆
  ● 已递签 ──── 2025-01-22
  │
  ○ 使馆审核中 ── 等待中
  ○ 已出签 ───── 等待中
  ```
- 已完成节点：宝蓝色实心圆 + 连线
- 当前节点：脉动动画
- 未完成节点：灰色空心圆
- 每个节点可点击编辑（日期 + 备注）

**提醒机制**：
- 递签前 3 天：显示材料检查提醒
- 预计出签日前：显示进度查询提醒
- 提醒以 Toast 形式出现在页面顶部

---

### 5. 资料生成 (Documents)

**页面布局**：左右分栏（桌面端），上下堆叠（移动端）

**左侧 — 表单区**：
- Tab 切换文档类型：行程单 / 在职证明 / 邀请函 / 个人陈述 / 材料清单
- 「我的信息」折叠面板（一次填写，多模板复用）：
  - 姓名、护照号、出生日期、国籍
  - 职业信息（公司名、职位、薪资）
  - 行程信息（目的地、日期、航班号、酒店）
- 当前模板专属字段

**右侧 — 预览区**：
- 实时预览文档效果（A4 纸张比例容器）
- 顶部工具栏：语言切换（中/英版本）+ 「导出 PDF」按钮
- 预览区域有纸张阴影效果

---

### 6. 签证百科 (Encyclopedia)

**国家列表页**：
- 搜索框 + 筛选（按难度、按区域）
- 卡片网格（同 Assistant Step 1 风格）

**国家详情页**：
- 顶部 Banner：国旗 + 国名 + 签证难度 + 一句话概述
- 内容区块（Tab 或锚点导航）：
  - 签证类型总览（表格）
  - 各类型材料要求
  - 费用对比表
  - 办理周期
  - 领区划分（地图或列表）
  - 免签/落地签/电子签政策
  - FAQ（手风琴折叠）
- 底部：「对比其他国家」按钮

**对比页面**：
- 选择 2-3 个国家
- 横向表格对比：费用、周期、难度、材料数量、免签政策

---

## 数据结构

```ts
// types/index.ts

export interface Country {
  id: string
  name: { zh: string; en: string }
  flag: string
  difficulty: 'easy' | 'medium' | 'hard'
  region: string              // 亚洲/欧洲/北美/大洋洲
  visaTypes: VisaType[]
  overview: { zh: string; en: string }
  visaFree: { zh: string; en: string }
  announcements: Announcement[]
}

export interface VisaType {
  id: string
  name: { zh: string; en: string }
  category: 'tourist' | 'business' | 'family' | 'transit' | 'student'
  duration: string
  validity: string
  entries: 'single' | 'multiple'
  fee: { amount: number; currency: string }
  serviceFee?: { amount: number; currency: string }
  processingDays: { min: number; max: number }
  consularDistricts: ConsularDistrict[]
  requirements: Requirement[]
  faq: FAQ[]
  tips: { zh: string; en: string }
  rejectionReasons: { zh: string; en: string }[]
}

export interface ConsularDistrict {
  name: { zh: string; en: string }
  provinces: string[]
}

export interface Requirement {
  id: string
  name: { zh: string; en: string }
  category: 'basic' | 'identity' | 'financial' | 'travel' | 'extra'
  required: boolean
  format: 'original' | 'copy' | 'both'
  translationRequired: boolean
  notes?: { zh: string; en: string }
}

export interface FAQ {
  question: { zh: string; en: string }
  answer: { zh: string; en: string }
}

export interface Announcement {
  date: string
  title: { zh: string; en: string }
  content: { zh: string; en: string }
}

export interface VisaApplication {
  id: string
  countryId: string
  visaTypeId: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  timeline: TimelineNode[]
  notes: string
}

export type ApplicationStatus =
  | 'preparing'
  | 'appointment_booked'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'

export interface TimelineNode {
  status: ApplicationStatus
  date?: string
  note?: string
}

export interface UserProfile {
  name: string
  passportNumber: string
  nationality: string
  birthDate: string
  occupation: 'employed' | 'student' | 'retired' | 'freelance'
  company?: string
  position?: string
  salary?: string
  homeProvince: string
  passportIssuedIn: string
}
```

---

## 动效规范

| 场景 | 动效 | 时长 |
|------|------|------|
| 页面切换 | 淡入 + 轻微上移 | 300ms ease-out |
| 卡片 hover | translateY(-4px) + 阴影加深 | 200ms ease |
| 按钮 hover | 背景色变亮 + 微缩放 | 150ms ease |
| 步骤切换 | 当前步骤滑入，旧步骤滑出 | 400ms ease-in-out |
| 时间线节点 | 当前节点脉动光晕 | 2s infinite |
| 几何装饰 | 缓慢浮动/旋转 | 8-12s infinite |
| Hero 飞机 | 轻微上下浮动 | 4s infinite ease-in-out |
| Toast 通知 | 从顶部滑入 | 300ms spring |

---

## PWA 配置

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'VisaGo 签证助手',
        short_name: 'VisaGo',
        description: '个人签证申请全流程助手',
        theme_color: '#0D0E32',
        background_color: '#F6F7F9',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
})
```

---

## 非功能要求

- Lighthouse Performance ≥ 90
- 首屏加载 < 2s（纯静态数据，无后端）
- 离线可用（PWA 缓存所有资源）
- 无障碍：语义化标签、键盘导航、对比度达标
- 响应式：移动端优先，断点 640 / 768 / 1024 / 1280
- 无外部 API 依赖

---

## 开发优先级

1. 脚手架搭建（Vite + Vue3 + TSX + UnoCSS + Pinia + vue-i18n + PWA）
2. 全局布局（Header + 路由 + 侧边栏）
3. 首页 Hero + 快捷入口（视觉冲击力最强，先出效果）
4. 签证数据结构 + 静态数据录入（7 国）
5. 签证百科（纯展示，快速填充内容）
6. 签证申请助手（核心交互，Stepper 向导）
7. 进度追踪（Pinia + localStorage）
8. 资料生成（表单 + PDF 导出）
9. PWA 调试 + 动效打磨 + 性能优化

---

## 启动命令

```bash
npm create vite@latest visa-app -- --template vue-ts
cd visa-app

npm install vue-router@4 pinia vue-i18n@9 \
  veevalidate zod @vee-validate/zod \
  jspdf html2canvas @iconify-json/carbon

npm install -D unocss @unocss/preset-wind @unocss/preset-icons \
  vite-plugin-pwa @vitejs/plugin-vue-jsx

npm run dev
```
