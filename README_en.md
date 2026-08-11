<div align="center">

# VisaGo

**All-in-One Visa Assistant**

</div>

---

## 📖 About

VisaGo is an all-in-one visa application assistant covering the full workflow: **browsing visa policies**, **scanning documents with AI recognition**, **generating application documents**, and **tracking progress**. Built with Tauri + React + TypeScript, supporting both Web and Desktop platforms.

## ✨ Features

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

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Build | Vite 6 |
| AI | Moonshot Kimi (moonshot-v1-128k) |
| Storage | localStorage / Tauri local JSON |

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Rust toolchain (desktop only)
- Kimi API Key (from [Moonshot Platform](https://platform.moonshot.cn/))

### Configuration

```bash
cp .env.example .env
# Edit .env: fill in your KIMI_API_KEY
```

> ⚠️ `.env` is ignored by `.gitignore`, keys never enter the repo.

### Install & Run

```bash
npm install
npm run dev        # Web: http://localhost:1420
npx tauri dev      # Desktop (requires Rust first)
```

### Build

```bash
npm run build      # Web production build
npx tauri build    # Desktop installer
```

## 📁 Project Structure

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

## 🧠 Kimi AI Integration

- **Data fetch**: Home & encyclopedia fetch latest visa policies on demand via Kimi (7-day cache)
- **Document recognition**: After scanning, Kimi identifies type (ID / passport / bank statement / employment cert...) and extracts fields
- **Personalized recommendation**: Generates material checklist, risk tips, approval advice based on user's occupation / domicile / passport issue place
- **Document generation**: Itinerary / employment certificate / invitation / cover letter, bilingual
- **Security**: Web hides key via Vite proxy; Desktop stores key in Rust backend

## 📄 License

This is a **private project**. All rights reserved. Unauthorized copying, distribution, or commercial use is prohibited.

---

[⬅️ Back to main README](../README.md) · [🇨🇳 中文版](./README_zh.md)
