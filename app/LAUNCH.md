# 🃏 Launch Guide — Cards Against Shamelessness

> This is a **Next.js 16 full-stack app** — the frontend and backend (API routes) live in the same project.
> You do **not** need to run two separate servers. One command starts everything.

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Check |
|------|---------|-------|
| **Node.js** | v18 or higher | `node -v` |
| **npm** | v9 or higher | `npm -v` |

---

## 1. Install Dependencies

Open a terminal in the `app/` folder and run:

```powershell
cd C:\Users\Ganesh\Desktop\cards\app
npm install
```

> This only needs to be done once (or whenever `package.json` changes).

---

## 2. Start the Development Server

```powershell
npm run dev
```

This starts **both** the frontend and backend simultaneously:

- 🌐 **Frontend** → [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend API** → [http://localhost:3000/api/...](http://localhost:3000/api/)
  - `POST /api/rooms/create` — Create a new game room
  - `POST /api/rooms/join` — Join an existing room
  - `GET  /api/rooms/[code]` — Get room state
  - `POST /api/game/start` — Start the game
  - `POST /api/game/submit` — Submit a card
  - `POST /api/game/judge` — Judge picks a winner
  - `POST /api/game/next-round` — Advance to next round

Open your browser at **http://localhost:3000** to play.

---

## 3. Multi-Device / LAN Play (play with friends on the same Wi-Fi)

To let others on your local network join:

```powershell
# Find your local IP address first
ipconfig
# Look for "IPv4 Address" (e.g. 192.168.1.42)
```

Then start the dev server with:

```powershell
npm run dev -- --hostname 0.0.0.0
```

Friends on the same Wi-Fi can join at `http://<your-ip>:3000` (e.g. `http://192.168.1.42:3000`).

---

## 4. Build for Production (optional)

If you want to run a production-optimised build:

```powershell
# Build
npm run build

# Start the production server
npm start
```

The app will be available at **http://localhost:3000**.

---

## 5. How It Works (Architecture Overview)

```
cards/app/
├── app/
│   ├── page.tsx          ← Landing page (Create / Join room)
│   ├── room/[code]/      ← Game room page (lobby + gameplay)
│   └── api/
│       ├── rooms/        ← REST API: create, join, fetch room
│       └── game/         ← REST API: start, submit, judge, next-round
├── components/           ← Shared UI components
├── lib/
│   └── sessions-store.ts ← In-memory game state (persists across hot-reloads)
├── stores/               ← Zustand client-side state (player, UI)
├── packs/                ← Card decks (Decency & Sanskaar editions)
└── types/                ← TypeScript types
```

> **Note on State:** Game sessions are stored **in-memory** on the server.
> Restarting the dev server will wipe all active rooms.
> For production persistence, swap `lib/sessions-store.ts` for Vercel KV / Upstash Redis
> (the commented-out code in that file shows exactly how).

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3000 already in use | `npm run dev -- --port 3001` |
| `node_modules` missing / broken | Delete `node_modules` and run `npm install` again |
| Changes not reflecting | Hard-refresh browser (`Ctrl+Shift+R`) |
| Room state lost after restart | Expected in dev — sessions are in-memory |
| TypeScript errors on start | Run `npm run lint` to see details |

---

## Quick-Start Cheat Sheet

```powershell
# 1. Navigate to the app folder
cd C:\Users\Ganesh\Desktop\cards\app

# 2. Install dependencies (first time only)
npm install

# 3. Start the app (frontend + backend together)
npm run dev

# 4. Open in browser
start http://localhost:3000
```
