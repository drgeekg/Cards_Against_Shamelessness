# 🃏 Cards Against Shamelessness

> **The ultimate real-time multiplayer party card game.**  
> Play seamlessly with friends in your browser — zero accounts required. Features dual game editions, custom card packs, 3D card animations, and dynamic sound effects.

---

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-13.1-0055FF?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)

---

## ✨ Features

- **⚡ Instant Rooms & Zero Friction:** Host a game or join with a 4-character room code in seconds. No login or signup required.
- **🎭 Dual Game Editions:**
  - 🌍 **Global Edition (Decency):** Classic dark-humor party prompts for international players.
  - 🇮🇳 **Desi Edition (Sanskaar):** Culturally infused Indian card deck featuring pop-culture, Bollywood, & relatable family chaos.
- **🎨 Rich Design & Dynamic Color Palettes:**
  - **Deep Prussian Blue** (`#04101E`) dark mode background for an immersive night atmosphere.
  - **Deep Vermilion Orange** (`#E2381E`) vibrant Indian accent styling.
  - Light & Dark mode support with smooth palette transitions.
- **🎴 Dynamic Gameplay Mechanics:**
  - Real-time card dealing & submission tracking.
  - Rotating Card Czar (Judge) role every round.
  - 3D card flip animations and score bounce indicators.
  - Integrated sound effects (toggleable).
  - Responsive mobile-first layout.

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router + Turbopack)](https://nextjs.org/) |
| **UI & Styling** | Vanilla CSS Tokens + [TailwindCSS v4](https://tailwindcss.com/) |
| **Animations** | [Framer Motion 13](https://www.framer.com/motion/) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) (Client) + In-memory Server Sessions |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have **Node.js v18+** and **npm** installed.

```bash
node -v
npm -v
```

### 1. Clone the Repository
```bash
git clone https://github.com/drgeekg/Cards_Against_Shamelessness.git
cd Cards_Against_Shamelessness
```

### 2. Install Dependencies
```bash
cd app
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start playing!

---

## 🌐 Local Network / LAN Play

To play with friends on the same Wi-Fi network:

1. Find your IPv4 address:
   ```bash
   ipconfig   # Windows
   ifconfig   # macOS / Linux
   ```
2. Start Next.js exposed to your local network:
   ```bash
   npm run dev -- --hostname 0.0.0.0
   ```
3. Share your local IP with friends (e.g., `http://192.168.1.42:3000`).

---

## 📁 Repository Structure

```
Cards_Against_Shamelessness/
├── README.md                 # Root repository documentation
├── CardsVs-Series-PRD.md     # Product Requirements Document
└── app/                      # Main Next.js Full-stack Application
    ├── app/                  # Next.js App Router (pages & REST API)
    │   ├── page.tsx          # Landing page (Create / Join room)
    │   ├── room/[code]/      # Game room (Lobby + Active gameplay)
    │   ├── api/rooms/        # Room management endpoints
    │   └── api/game/         # Game round state machine endpoints
    ├── components/           # UI Components (Cards, Header, Toggles)
    ├── lib/                  # Server-side Session Store & Card Pack Loader
    ├── packs/                # Decency & Sanskaar Card Decks (JSON)
    ├── stores/               # Zustand Client State (Player & UI theme)
    └── types/                # TypeScript Interfaces & Game Types
```

---

## 📄 License & Disclaimer

*This project is an independent party game created for entertainment. It is **not** affiliated with, endorsed by, or associated with Cards Against Humanity®.*
