import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode, generateId, createSession } from "@/lib/game-engine";
import type { Player } from "@/types/game";

// In-memory store for development (replace with Vercel KV in production)
import { sessions } from "@/lib/sessions-store";

export async function POST(req: NextRequest) {
  try {
    const { edition, hostName, avatarColor } = await req.json();

    if (!hostName?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate unique room code
    let code = generateRoomCode();
    while (sessions.has(code)) {
      code = generateRoomCode();
    }

    const playerId = generateId();

    const hostPlayer: Player = {
      id: playerId,
      name: hostName.trim().slice(0, 20),
      avatarColor: avatarColor || "#FF6B6B",
      hand: [],
      score: 0,
      connected: true,
      isHost: true,
    };

    const session = createSession({
      code,
      edition: edition === "sanskaar" ? "sanskaar" : "decency",
      hostPlayer,
    });

    sessions.set(code, session);

    // Auto-cleanup after 4 hours
    setTimeout(() => sessions.delete(code), 4 * 60 * 60 * 1000);

    return NextResponse.json({ code, playerId, session });
  } catch (err) {
    console.error("Create room error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
