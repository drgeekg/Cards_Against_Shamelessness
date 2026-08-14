# CardsVs Series — Product Requirements Document (PRD)

**Umbrella project:** CardsVs
**Global/classic edition:** Cards Vs Decency
**Indian edition:** Cards Vs Sanskaar
**Format:** Real-time multiplayer party card game, browser-based, played with friends on phones/laptops in the same room or remote.
**Host:** Vercel
**Build tool:** Antigravity (agentic IDE) + Claude

> Naming note: "Cards Against Humanity" is a trademark, and its printed card text is copyrighted. This PRD specs an original game using the same fill-in-the-blank party mechanic, with original card content (not copied CAH cards). "Cards Vs Decency" / "Cards Vs Sanskaar" is the working name pair — swap freely, the doc works the same either way.

---

## 0.5 Reference Product

Style/feature reference: **cardsagainstformality.io** — an open-source CAH clone (React PWA frontend, dark-first minimalist UI, no account needed to join, up to 50 players, 25 selectable decks, host-configurable round timer and target score, host can kick players).

**Taking from it:** dark-first minimalist visual direction, the exact feature set below (§4 updated), room-based no-login flow, host controls.
**Not taking:** their backend (Kubernetes + NATS + microservices) — that's built for running your own infra at scale. We're on Vercel, so §9 stays serverless-friendly (Next.js + managed realtime + KV) instead.

---

## 1. Core Concept

- One **Prompt Card** ("black card") per round — a sentence with a blank, read aloud by that round's **Judge**.
- Every other player submits one **Response Card** ("white card") from their hand to fill the blank.
- Judge picks the funniest submission. Winner scores a point. Judge role rotates clockwise.
- First to a target score (default 7, host-configurable) wins the session.
- Both editions share the exact same engine, UI, and rules. Only the **content pack** and **branding skin** change.

---

## 2. Game Modes

| Mode | Content flavor | Palette | Default packs |
|---|---|---|---|
| Cards Vs Decency (International) | Global dark/absurdist humor, internet culture, adulting | White & Black (monochrome) | Base + Internet & Memes |
| Cards Vs Sanskaar (Indian) | Desi humor — family, shaadi, office, Bollywood, cricket | Vermilion & Prussian Blue | Base + Rishtedaar Special |

- Host picks the edition **when creating a room**; a header toggle button can flip between editions before the game starts (see §5) — this swaps palette **and** content pack list together.
- Once a round is in progress, the edition toggle is locked/hidden (mid-round palette or content swaps would be confusing) — it re-enables in the lobby and on the post-game screen.
- Stretch goal (Phase 4): a "Mixed Thali" mode that shuffles packs from both editions into one deck.

---

## 3. Player Roles & Flow

1. **Host** creates a room → gets a 4-character room code + shareable link/QR.
2. **Players** join via code, pick a display name + avatar color, land in a lobby.
3. Host picks: edition, active packs, target score, hand size (default 7), NSFW toggle.
4. Host starts the game. Engine assigns first Judge, deals hands, shows Round 1.
5. Loop per round:
   - Prompt card revealed to everyone.
   - Non-judge players pick a response card (or 2, if the prompt needs "Pick 2") from their hand.
   - Once all submitted (or a soft timer expires), submissions are shown to the Judge **anonymized and shuffled**.
   - Judge taps their favorite → winner + point revealed to everyone with an animation.
   - Hands refill back to full size, Judge role passes to the next player, new round starts.
6. Game ends at target score → final scoreboard + "play again" (same players, fresh deck).

---

## 4. Functional Requirements

**Must-have (MVP):**
1. Create/join room by code, no account needed, 3–50 players.
2. Real-time sync of hands, submissions, judge state, scores (all players see the same game state within ~1s).
3. Full round loop as in §3, including "Pick 2" prompt cards.
4. Dark mode / light mode toggle, persisted per device — **dark is the default** (matches reference product).
5. **Edition toggle button** (header, always visible pre-round) — one press flips International ↔ Indian, swapping palette and active content pack list together, animated (not a hard cut). Locked during an active round.
6. Reconnect handling — a dropped player can rejoin the same room and resume their hand/score.
7. Mobile-first responsive layout (this will mostly be played one-handed on phones).
8. Host controls: set target score, set round timer (or off), kick a player.
9. Pack selection UI — toggle individual expansion packs on/off per room, like a deck picker.

**Should-have:**
10. NSFW/18+ toggle (filters out the After Dark pack when off).
11. Spectator link (watch without playing).
12. Sound effects toggle (card deal, reveal, win chime).
13. Round timer countdown UI — auto-submits a random card (or skips) if a player stalls.

**Nice-to-have (later phases):**
12. Custom card creator (players submit their own prompt/response cards mid-game).
13. Persistent player profiles + cross-session stats (wins, funniest-card streak).
14. Discord/WhatsApp share card for round winners ("X won with: ...").

---

## 5. Design System — Two Independent Toggles

1. **Theme toggle** — Light / Dark. Persists per device.
2. **Edition toggle** — International / Indian. One button press swaps the **entire color palette** (not just a logo). Persists per room/session, locked mid-round (§2).

Both live on `<html>` as data attributes and drive everything via CSS variables — no per-component color logic:

```html
<html data-edition="international" data-theme="dark">
```

**Palette 1 — International (White & Black, pure monochrome):**

```css
:root[data-edition="international"][data-theme="light"] {
  --bg: #FFFFFF;
  --surface: #F2F2F2;
  --text: #0B0B0B;
  --text-muted: #5A5A5A;
  --accent-primary: #0B0B0B;
  --accent-on-primary: #FFFFFF;
  --card-prompt-bg: #0B0B0B;
  --card-prompt-text: #FFFFFF;
  --card-response-bg: #FFFFFF;
  --card-response-text: #0B0B0B;
}
:root[data-edition="international"][data-theme="dark"] {
  --bg: #0B0B0B;
  --surface: #1A1A1A;
  --text: #FFFFFF;
  --text-muted: #A0A0A0;
  --accent-primary: #FFFFFF;
  --accent-on-primary: #0B0B0B;
  --card-prompt-bg: #FFFFFF;
  --card-prompt-text: #0B0B0B;
  --card-response-bg: #1A1A1A;
  --card-response-text: #FFFFFF;
}
```

**Palette 2 — Indian (Vermilion & Prussian Blue):**

```css
:root[data-edition="indian"][data-theme="light"] {
  --bg: #FFF8F2;
  --surface: #FFFFFF;
  --text: #003153;            /* Prussian Blue */
  --text-muted: #4C6B85;
  --accent-primary: #E34234;  /* Vermilion */
  --accent-on-primary: #FFF8F2;
  --accent-secondary: #003153;
  --card-prompt-bg: #003153;
  --card-prompt-text: #FFF8F2;
  --card-response-bg: #FFF8F2;
  --card-response-text: #003153;
}
:root[data-edition="indian"][data-theme="dark"] {
  --bg: #001C2E;              /* deep Prussian Blue */
  --surface: #003153;
  --text: #FFF3E0;
  --text-muted: #B7C7D4;
  --accent-primary: #E34234;  /* Vermilion stays vivid on dark blue */
  --accent-on-primary: #FFF3E0;
  --accent-secondary: #FF6B5B;
  --card-prompt-bg: #001220;
  --card-prompt-text: #FFF3E0;
  --card-response-bg: #FFF3E0;
  --card-response-text: #003153;
}
```

`--danger` stays `#E63946` in all four combinations (kick/leave/error states shouldn't shift with branding).

**Edition toggle component:** a pill switch in the header — e.g. `🌍 International` / `🇮🇳 Indian` — press flips `data-edition`, all four CSS variable blocks above make the repaint automatic; no per-component JS needed, only the values change. Pair with the cross-fade in §6.

**Typography (shared across both palettes):**
- Display / headers: **Baloo 2**.
- Body / UI: **Inter**.
- Card text: Baloo 2, slightly larger weight for shared-screen readability.

**Layout:** rounded-corner cards (16px radius), generous shadow in light mode / soft glow in dark mode, big touch targets (min 44px) since this is phone-first.

---

## 6. Animation Spec (Framer Motion)

Animations should feel like a physical card game, not a spinner-heavy web app.

| Moment | Animation |
|---|---|
| Hand deal (round start) | Cards slide up from bottom edge, staggered 60ms apart |
| Selecting a response card | Card lifts + scales 1.05, rest of hand dims slightly |
| Submission sent | Card flies to center, flips face-down |
| Reveal to judge | Submissions flip face-up one at a time, staggered |
| Judge picks winner | Winning card scales up + glows with `--accent-primary`, others fade to 40% opacity |
| Score increment | Number ticks up with a small bounce, avatar pulses |
| Judge rotation | Crown/badge icon slides from old judge's avatar to new one |
| Theme toggle | Cross-fade background + text colors over 200ms, no flash |
| Edition toggle | Cross-fade all palette CSS variables (bg, text, accent, card colors) together over 250ms; pill switch thumb slides + icon/flag crossfades in sync |
| Player join/leave (lobby) | Avatar chips slide in/out, list reflows with layout animation |

Keep every transition under 300ms — this is a fast party game, animations should never make players wait.

---

## 7. Content Packs

Structure only below — actual card text is a separate content-generation pass (large volume, doesn't belong bloating a requirements doc). Recommend generating each pack as its own JSON file: `packs/<edition>/<pack-id>.json`.

**Cards Vs Decency (global):**
1. Base Set — general absurdist/dark humor
2. Internet & Memes
3. Adulting & Work Life
4. Relationships & Dating
5. After Dark (18+, off by default)

**Cards Vs Sanskaar (Indian):**
1. Base Set (Sanskaar) — general desi humor
2. Rishtedaar Special — relatives, shaadi, biodata culture
3. Corporate Chutiyapa — Indian office/WFH life
4. Bollywood & OTT
5. Festival & Cricket Fever
6. After Dark Desi (18+, off by default)

**Card schema (shared):**

```ts
type PromptCard = {
  id: string;
  edition: "decency" | "sanskaar";
  pack: string;
  text: string;        // uses "_____" for blank(s)
  pick: 1 | 2;          // how many response cards it needs
};

type ResponseCard = {
  id: string;
  edition: "decency" | "sanskaar";
  pack: string;
  text: string;
};
```

**Sample originals** (illustrative only, not the full deck):

- Prompt (Decency): "My therapist says the root of my anxiety is _____."
- Response (Decency): "a group chat that won't stop buzzing."
- Prompt (Sanskaar): "Papa ne rishta reject kar diya kyunki ladka _____ nikla."
- Response (Sanskaar): "engineering degree se zyada Instagram followers rakhta hai."

Next step for real content: generate each pack (~90 prompt + ~300 response cards, matching physical CAH pack sizes) as JSON in a follow-up task once you confirm pack list/priority.

---

## 8. Tech Stack (Vercel-first)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Native Vercel deploy, server actions, RSC for fast loads |
| Styling | Tailwind CSS + CSS variables above | Fast theming, matches design token approach |
| Animation | Framer Motion | Handles the spec in §6 cleanly |
| Realtime | Pusher **or** Ably **or** PartyKit | Vercel serverless functions can't hold persistent WebSocket connections — need a managed realtime layer |
| Game state | Vercel KV (Redis) | Cheap, fast, fits ephemeral room-based state well |
| Deployment | Vercel | As planned |
| Card data | Static JSON per pack, bundled at build time | No DB needed for content that doesn't change per-session |

**Why not raw WebSockets on Vercel:** serverless functions are short-lived, so a managed realtime service (Pusher/Ably/PartyKit) is doing the actual socket-holding; your Next.js API routes just publish/subscribe to it. PartyKit is the most "just works" option if you want less third-party account juggling.

---

## 9. Data Model (game session)

```ts
type GameSession = {
  code: string;                 // room code, e.g. "F9K2"
  edition: "decency" | "sanskaar";
  activePacks: string[];
  targetScore: number;
  nsfw: boolean;
  players: Player[];
  judgeIndex: number;
  round: number;
  currentPrompt: PromptCard;
  submissions: { playerId: string; cardIds: string[] }[];
  phase: "lobby" | "submitting" | "judging" | "reveal" | "gameOver";
};

type Player = {
  id: string;
  name: string;
  avatarColor: string;
  hand: string[];               // response card ids
  score: number;
  connected: boolean;
};
```

---

## 10. Non-Functional Requirements

1. Support 3–50 concurrent players per room (matches reference product ceiling), target <1s state sync latency.
2. Mobile-first (majority of play sessions), works on a 375px-wide screen without cramping.
3. Graceful reconnect within a 60s grace window if a player's tab drops.
4. Dark/light mode meets WCAG AA contrast in both modes.
5. No account required to play — room code is the only auth needed for a session.

---

## 11. Build Phases

1. **Design system** — theme tokens, Baloo 2 + Inter setup, card components (light + dark), no game logic yet. ~1–2 days.
2. **MVP engine** — single edition, lobby → round loop → scoreboard, using Base pack sample cards only. ~1 week.
3. **Content pipeline** — generate full JSON decks for all packs listed in §7, both editions.
4. **Second edition + switcher** — wire in Cards Vs Sanskaar packs, room-creation edition picker.
5. **Animation polish** — implement full §6 spec, sound effects toggle.
6. **Hardening** — reconnect handling, NSFW toggle, spectator mode, mobile QA pass.

---

## 12. Open Questions (need your input before Phase 3)

1. Which pack themes from §7 do you want prioritized first — Sanskaar side, Decency side, or both in parallel?
2. Target NSFW intensity — "party with coworkers" level or "close friends only" level? Changes what goes in After Dark.
3. Any specific inside-joke categories from your friend group you want as a bonus pack (e.g. a pack themed on your college/office)?
