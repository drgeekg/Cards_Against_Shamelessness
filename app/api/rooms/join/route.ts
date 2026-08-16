import { NextRequest, NextResponse } from "next/server";
import { generateId, addPlayer } from "@/lib/game-engine";
import { getSession, setSession } from "@/lib/sessions-store";
import type { Player } from "@/types/game";

export async function POST(req: NextRequest) {
  try {
    const { code, name, avatarColor, playerId: reconnectId } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!code || code.length !== 4) {
      return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
    }

    const session = await getSession(code.toUpperCase());
    if (!session) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const existing = reconnectId && session.players.find((p) => p.id === reconnectId);
    if (existing) {
      const updatedSession = { ...session, players: session.players.map((p) => p.id === reconnectId ? { ...p, connected: true } : p) };
      await setSession(code.toUpperCase(), updatedSession);
      return NextResponse.json({ playerId: reconnectId, session: updatedSession, reconnected: true });
    }
    if (session.phase !== "lobby") {
      return NextResponse.json({ error: "Game already in progress" }, { status: 403 });
    }
    if (session.players.filter((p) => p.connected).length >= 50) {
      return NextResponse.json({ error: "Room is full (50 players max)" }, { status: 403 });
    }

    const playerId = generateId();

    const newPlayer: Player = {
      id: playerId,
      name: name.trim().slice(0, 20),
      avatarColor: avatarColor || "#54A0FF",
      hand: [],
      score: 0,
      connected: true,
      isHost: false,
    };

    const updatedSession = addPlayer(session, newPlayer);
    await setSession(code.toUpperCase(), updatedSession);

    return NextResponse.json({ playerId, session: updatedSession });
  } catch (err) {
    console.error("Join room error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
