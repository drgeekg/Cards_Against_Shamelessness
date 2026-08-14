import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";
import { startRound, checkWinCondition, endGame } from "@/lib/game-engine";
import { loadPacks } from "@/lib/pack-loader";

export async function POST(req: NextRequest) {
  try {
    const { code, hostId } = await req.json();
    const session = await getSession(code?.toUpperCase());

    if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const host = session.players.find((p) => p.id === hostId && p.isHost);
    if (!host) return NextResponse.json({ error: "Only the host can start" }, { status: 403 });
    if (session.players.filter((p) => p.connected).length < 3) {
      return NextResponse.json({ error: "Need at least 3 players" }, { status: 400 });
    }

    const { prompts, responses } = loadPacks(session.activePacks, session.edition);
    const updated = startRound(session, prompts, responses);
    await setSession(code.toUpperCase(), updated);

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error("Start game error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
