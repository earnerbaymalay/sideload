<div align="center">

# ⬡ S I D E L O A D
### *Your apps. Your device. Your rules.*

[![Status](https://img.shields.io/badge/Status-Active-50fa7b?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-f1fa8c?style=for-the-badge)]()
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-bd93f9?style=for-the-badge)]()

---

### What is this?

**Sideload** is a central distribution point for local-first, privacy-respecting apps. Every app runs entirely on your device — no cloud, no accounts, no tracking, no app store gatekeepers.

> **Open in any browser. Tap "Add to Home Screen." Installed.**

</div>

## 📲 Available Apps

| App | What it does | Install |
|---|---|---|
| **🛡️ Cypherchat** | E2EE messaging — AES-256-GCM + Double Ratchet, zero-knowledge, no phone number | **[Open App](/cypherchat/)** |
| **🌌 Aether Desktop** | Full local AI workstation — 4-tier routing, toolbox, Context7 | [Source →](https://github.com/earnerbaymalay/aether-desktop) |
| **🍎 Aether Apple** | AI on Mac/iPad via iSH or a-Shell | [Source →](https://github.com/earnerbaymalay/aether-apple) |
| **📱 Aether Android** | Flagship — 4 AI tiers, swarm, 10+ tools | [Source →](https://github.com/earnerbaymalay/aether) |
| **🌗 Gloam** | Solar-timed journaling with CBT prompts, mood tracking | [Source →](https://github.com/earnerbaymalay/Gloam) |

## 🏗️ Adding a New App

Each app lives in its own subdirectory:

```
sideload/
├── index.html           ← Hub landing page
├── styles/hub.css       ← Hub styles
├── README.md            ← This file
│
├── cypherchat/          ← App 1: full PWA
│   ├── index.html       ← App shell
│   ├── manifest.json    ← PWA manifest (scope: /cypherchat/)
│   ├── sw.js            ← Service Worker
│   ├── styles/          ← App styles
│   └── ...              ← App code
│
└── next-app/            ← App 2: your PWA goes here
    ├── index.html
    ├── manifest.json    ← scope: /next-app/
    ├── sw.js
    └── ...
```

To add a new PWA:
1. Create a subdirectory with your app name
2. Include `index.html`, `manifest.json`, `sw.js`
3. Set `start_url` and `scope` in manifest to `/your-app/`
4. Register service worker at `/your-app/sw.js`
5. Add a card to `index.html` in the app grid

## 🚀 Deployment

Deploy to **any static host** — this is just HTML/CSS/JS:

| Host | Setup | Cost |
|---|---|---|
| **GitHub Pages** | Enable Pages on repo → `main` branch → root | Free |
| **Cloudflare Pages** | Connect repo or drag-and-drop `dist/` | Free |
| **Netlify** | Drag-and-drop or connect repo | Free |
| **Vercel** | Connect repo | Free |
| **Self-hosted** | Any static web server (nginx, Caddy, etc.) | Free |

After deployment:
- **Hub URL:** `your-domain.com/`
- **Cypherchat PWA:** `your-domain.com/cypherchat/`
- **Next app:** `your-domain.com/next-app/`

Each PWA is independently installable from its own subdirectory.

## 🔗 Linking From Your Repos

In each project's README, add a link to the hub:

```markdown
📲 **[Install on any device](https://your-domain.com/)
```

Or link directly to a specific PWA:

```markdown
📲 **[Install on iPhone/iPad](https://your-domain.com/cypherchat/)
```

## 📜 License

[MIT License](LICENSE) — Every app in this hub is free and open source.

---

<div align="center">

*Free. Private. Offline. No exceptions.*

</div>
