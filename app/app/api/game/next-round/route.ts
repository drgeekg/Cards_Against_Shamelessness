import { NextRequest, NextResponse } from "next/server";
import { sessions } from "@/lib/sessions-store";
import { advanceRound, startRound } from "@/lib/game-engine";
import { loadPacks } from "@/lib/pack-loader";

export async function POST(req: NextRequest) {
  try {
    const { code, hostId } = await req.json();
    const session = sessions.get(code?.toUpperCase());

    if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const host = session.players.find((p) => p.id === hostId && p.isHost);
    if (!host) return NextResponse.json({ error: "Only host can advance round" }, { status: 403 });

    const { prompts, responses } = loadPacks(session.activePacks, session.edition);
    const advanced = advanceRound(session);
    const updated = startRound(advanced, prompts, responses);
    sessions.set(code.toUpperCase(), updated);

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error("Next round error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
