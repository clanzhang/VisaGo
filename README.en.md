<div align="center">

# VisaGo Visa Assistant

**AI-Powered All-in-One Visa Application Assistant**

</div>

<div align="center">

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/yourusername/visago)
[![Platform](https://img.shields.io/badge/platform-macOS%7CWindows%7CLinux-lightgrey)](https://tauri.app)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

<div align="center">

**English** | [中文](./README.md)

</div>

---

## ✨ Features

- 🧠 **AI-Powered** — Powered by Moonshot Kimi: queries visa policies, recognizes documents, and generates personalized plans
- 🤖 **Smart Assistant** — 4-step personalized visa plan: materials, fees, timeline, and risk tips
- 📁 **Document Scan** — Desktop: pick a folder, auto-recognize PDF/JPG/PNG/DOCX and extract key fields
- ✅ **Progress Tracker** — Manage applications with timeline and expected-result reminders
- 📝 **Document Generator** — AI generates itinerary / employment certificate / invitation / cover letter, export PDF
- 🌐 **Bilingual UI** — Simplified Chinese / English switch anytime

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- Rust toolchain (desktop only)
- Kimi API Key (from [Moonshot Platform](https://platform.moonshot.cn/))

### Install

```bash
# Clone the repository
git clone https://github.com/yourusername/visago.git
cd visago

# Install dependencies
npm install

# Configure environment variables (copy example and fill in Kimi Key)
cp .env.example .env
```

### Build

```bash
# Web development server
npm run dev

# Web production build
npm run build

# Desktop app (requires Rust first)
npx tauri dev
npx tauri build
```

## 📖 Usage Guide

1. **Configure Key** — Copy `.env.example` to `.env` and fill in your Kimi API Key
2. **Browse Policies** — Open "Encyclopedia" to view visa requirements, fees & timelines for 7 countries
3. **Get a Plan** — In "Assistant", select country & type, fill in identity; AI generates a personalized checklist
4. **Scan Documents** — On desktop, pick a folder in "Scan"; AI auto-recognizes and extracts fields
5. **Generate Documents** — In "Documents", one-click generate visa materials and export PDF

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Desktop Framework | Tauri 2.0 (Rust) |
| Frontend Framework | React 18 + TypeScript 5 |
| Styling | Tailwind CSS |
| Build Tool | Vite 6 |
| Routing | React Router 7 |
| AI Engine | Moonshot Kimi (moonshot-v1-128k) |

## 📁 Project Structure

```
visago/
├── src/                    # Frontend source
│   ├── pages/              # Pages (Home/Assistant/Scan/Tracker/Documents/Encyclopedia...)
│   ├── components/         # Components (layout/common/home/visa)
│   ├── api/                # Kimi API client & prompts
│   ├── hooks/              # AI data layer / recommendation / local storage
│   ├── stores/             # React Context state management
│   ├── data/               # 7-country visa static data + mock
│   ├── i18n/               # zh-CN / en-US strings
│   └── types/              # Type definitions
├── src-tauri/              # Tauri desktop (Rust)
│   ├── src/                # kimi.rs / scanner.rs / recognizer.rs / store.rs ...
│   └── capabilities/       # Desktop permission config
├── .env.example            # Environment variable example
└── package.json
```

## 🔒 Privacy & Security

- 🔑 **Key Protection** — Kimi API Key stored in local `.env` (gitignored) or Rust backend, never in the frontend bundle
- 📁 **Local-First** — Application data, scan records & user profiles stored locally (localStorage / Tauri local files)
- 🚫 **No Collection** — No upload of user private data; AI calls only for visa info lookup & document generation

## 🛂 Supported Visa Types

| Type | Description |
|------|-------------|
| 🇹🇭 Visa-free / VOA | Thailand, Jeju Island and other visa-free or visa-on-arrival destinations |
| 🇯🇵🇰🇷 Apply in advance | Japan, South Korea and other countries requiring advance visas |
| 🇪🇺🇺🇸🇬🇧🇦🇺 Apply in advance | Schengen, USA, UK, Australia and other strict-review countries |

## 🤝 Contributing

Issues and Pull Requests are welcome! Please ensure:

- Code passes `npm run build`
- Follow existing code style and structure
- Open an Issue first for major changes

## ⚠️ Disclaimer

VisaGo provides visa information for reference only and does not constitute legal advice. Visa policies change frequently; always refer to official announcements from embassies/consulates. The authors are not responsible for any consequences arising from the use of this tool.

---

<div align="center">

Made with ❤️ by [VisaGo Team](https://github.com/yourusername/visago)

</div>
