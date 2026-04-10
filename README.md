<div align="center">

# ⬡ S I D E L O A D
### *Your apps. Your device. Your rules.*

[![Status](https://img.shields.io/badge/Status-Active-50fa7b?style=for-the-badge)](https://earnerbaymalay.github.io/sideload/)
[![License](https://img.shields.io/badge/License-MIT-f1fa8c?style=for-the-badge)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-bd93f9?style=for-the-badge)]()

**[🌐 Open the Hub](https://earnerbaymalay.github.io/sideload/)**

</div>

---

### What is this?

**Sideload** is a central distribution point for local-first, privacy-respecting apps. Every app runs entirely on your device — no cloud, no accounts, no tracking, no app store gatekeepers.

> **Open in any browser. Tap "Add to Home Screen." Installed.**

---

## 📲 Available Apps

### 🌌 Aether — AI Workstation

| Variant | Platform | Version | Status | Link |
|---|---|---|---|---|
| Flagship | 📱 Android (Termux) | v18.0 | ✅ Live | [Source →](https://github.com/earnerbaymalay/aether) |
| Full | 🖥️ macOS | v2.0 | ✅ Live | [Source →](https://github.com/earnerbaymalay/aether-apple) |
| Medium | 📱 iPad (iSH) | v2.0 | ✅ Live | [Source →](https://github.com/earnerbaymalay/aether-apple) |
| Lite | 📱 iPad (a-Shell) | v2.0 | ✅ Live | [Source →](https://github.com/earnerbaymalay/aether-apple) |

### 🛡️ Cypherchat — Encrypted Messaging

| Variant | Platform | Version | Status | Link |
|---|---|---|---|---|
| Native | 📱 Android | v1.0-alpha | ✅ Live | [Source →](https://github.com/earnerbaymalay/cyph3rchat) |
| PWA | 🍎 iPhone / Any Browser | v1.0 | ✅ Live | **[Open App →](/cypherchat/)** |
| Desktop | 🖥️ macOS / Windows / Linux | Planned | 🔮 Planned | — |

### 🌗 Gloam — Solar Journaling

| Variant | Platform | Version | Status | Link |
|---|---|---|---|---|
| Native | 📱 Android | v2.0 | ✅ Live | [Source →](https://github.com/earnerbaymalay/Gloam) |
| Desktop | 🖥️ macOS / Windows / Linux | v2.0 | ✅ Live | [Source →](https://github.com/earnerbaymalay/Gloam) |
| PWA | 🌐 Any Browser | Planned | 🔮 Planned | — |

### 🧰 Tools & Utilities

| Tool | Platform | Status | Link |
|---|---|---|---|
| 🔐 Termux-Vault | 📱 Android | ✅ Live | [Source →](https://github.com/earnerbaymalay/Termux-Vault) |
| 💻 Multi-AI Terminal | 🖥️ Windows | ✅ Live | [Source →](https://github.com/earnerbaymalay/multi-ai-terminal-setup) |
| ⚡ Nexus Optimizer | 🖥️ Windows 10/11 | ✅ Live | [Source →](https://github.com/earnerbaymalay/nexus11-optimizer.py) |
| 🤖 AI Hub Widget | 🖥️ Windows Desktop | ✅ Live | [Source →](https://github.com/earnerbaymalay/ai-hub-widget) |
| 🛡️ Edge Sentinel | 🖥️ Hybrid | ✅ Live | [Source →](https://github.com/earnerbaymalay/edge-sentinel) |
| 🧬 CasCad Mobile | 🌐 PWA | ✅ Live | [Source →](https://github.com/earnerbaymalay/cascad-mobile) |

---

## 🏗️ Adding a New App

Each app lives in its own subdirectory:

```
sideload/
├── index.html              ← Hub landing page (categorized by project~OS~version~variant)
├── styles/hub.css          ← Hub styles
├── README.md               ← This file
├── assets/                 ← Shared SVG assets for repo READMEs
│
├── cypherchat/             ← App 1: full PWA
│   ├── index.html          ← App shell
│   ├── manifest.json       ← PWA manifest (scope: /cypherchat/)
│   ├── sw.js               ← Service Worker
│   ├── styles/             ← App styles
│   ├── crypto/             ← WebCrypto engine
│   └── db/                 ← IndexedDB store
│
└── next-app/               ← App 2: your PWA goes here
    ├── index.html
    ├── manifest.json       ← scope: /next-app/
    ├── sw.js
    └── ...
```

To add a new PWA:
1. Create a subdirectory with your app name
2. Include `index.html`, `manifest.json`, `sw.js`
3. Set `start_url` and `scope` in manifest to `/your-app/`
4. Register service worker at `/your-app/sw.js`
5. Add a card to `index.html` under the appropriate project section

## 🚀 Deployment

Deploy to **any static host** — this is just HTML/CSS/JS:

| Host | Setup | Cost |
|---|---|---|
| **GitHub Pages** | Enable Pages on repo → `main` branch → root | Free |
| **Cloudflare Pages** | Connect repo or drag-and-drop | Free |
| **Netlify** | Drag-and-drop or connect repo | Free |
| **Vercel** | Connect repo | Free |
| **Self-hosted** | Any static web server | Free |

## 🔗 Linking From Your Repos

In each project's README, add a link to the hub:

```markdown
📲 **[Install on any device](https://earnerbaymalay.github.io/sideload/)
```

Or link directly to a specific PWA:

```markdown
📲 **[Install on iPhone](https://earnerbaymalay.github.io/sideload/cypherchat/)
```

## 📜 License

[MIT License](LICENSE) — Every app in this hub is free and open source.

---

<div align="center">

*Free. Private. Offline. No exceptions.*

</div>
