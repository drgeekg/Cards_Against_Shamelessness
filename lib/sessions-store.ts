import type { GameSession } from "@/types/game";
import { Redis } from "@upstash/redis";

// Support both standard Upstash and Vercel KV environment variable keys
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL;

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

declare global {
  // eslint-disable-next-line no-var
  var __sessions: Map<string, GameSession> | undefined;
}

// In-memory fallback map for local development or when Redis env vars are missing
const inMemorySessions =
  globalThis.__sessions ?? (globalThis.__sessions = new Map<string, GameSession>());

const TTL_SECONDS = 4 * 60 * 60; // Auto-expire inactive rooms after 4 hours

/**
 * Fetch a game session by room code (checks Redis first, falls back to memory).
 */
export async function getSession(code: string): Promise<GameSession | null> {
  const normalized = code.toUpperCase();
  if (redis) {
    try {
      const data = await redis.get<GameSession | string>(`room:${normalized}`);
      if (!data) return null;
      return typeof data === "string" ? JSON.parse(data) : (data as GameSession);
    } catch (err) {
      console.warn("Redis getSession error, using in-memory fallback:", err);
    }
  }
  return inMemorySessions.get(normalized) ?? null;
}

/**
 * Save or update a game session by room code.
 */
export async function setSession(code: string, session: GameSession): Promise<void> {
  const normalized = code.toUpperCase();
  inMemorySessions.set(normalized, session);

  if (redis) {
    try {
      await redis.set(`room:${normalized}`, JSON.stringify(session), {
        ex: TTL_SECONDS,
      });
    } catch (err) {
      console.warn("Redis setSession error:", err);
    }
  }
}

/**
 * Check if a room session exists.
 */
export async function hasSession(code: string): Promise<boolean> {
  const normalized = code.toUpperCase();
  if (redis) {
    try {
      const exists = await redis.exists(`room:${normalized}`);
      if (exists > 0) return true;
    } catch (err) {
      console.warn("Redis hasSession error:", err);
    }
  }
  return inMemorySessions.has(normalized);
}

/**
 * Delete a room session.
 */
export async function deleteSession(code: string): Promise<void> {
  const normalized = code.toUpperCase();
  inMemorySessions.delete(normalized);

  if (redis) {
    try {
      await redis.del(`room:${normalized}`);
    } catch (err) {
      console.warn("Redis deleteSession error:", err);
    }
  }
}

// Legacy fallback reference for synchronous access in non-async development context
export const sessions = inMemorySessions;
