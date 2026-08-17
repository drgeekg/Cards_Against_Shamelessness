import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";
import { shuffleHand } from "@/lib/game-engine";
import { loadPacks } from "@/lib/pack-loader";

export async function POST(req: NextRequest) {
  try {
    const { code, playerId } = await req.json();
    if (!code || !playerId) {
      return NextResponse.json({ error: "Code and playerId required" }, { status: 400 });
    }

    const session = await getSession(code.toUpperCase());
    if (!session) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { responses } = loadPacks(session.activePacks, session.edition);
    const result = shuffleHand(session, playerId, responses);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Could not shuffle cards" }, { status: 400 });
    }

    await setSession(code.toUpperCase(), result.session);
    return NextResponse.json({ success: true, session: result.session });
  } catch (err) {
    console.error("Shuffle hand error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
