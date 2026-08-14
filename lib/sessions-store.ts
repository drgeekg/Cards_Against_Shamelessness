import type { GameSession } from "@/types/game";

// In-memory session store for development
// In production, replace all `sessions.get/set/delete` calls with Vercel KV (or Upstash Redis):
//   import { kv } from "@vercel/kv";
//   await kv.set(`room:${code}`, JSON.stringify(session), { ex: 14400 });
//   const session = JSON.parse(await kv.get(`room:${code}`) ?? "null");

declare global {
  // eslint-disable-next-line no-var
  var __sessions: Map<string, GameSession> | undefined;
}

// Use a global to persist across hot-reloads in dev
export const sessions: Map<string, GameSession> =
  globalThis.__sessions ?? (globalThis.__sessions = new Map());
