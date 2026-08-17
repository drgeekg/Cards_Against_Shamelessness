import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";
import { removePlayer } from "@/lib/game-engine";

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

    const updatedSession = removePlayer(session, playerId);
    await setSession(code.toUpperCase(), updatedSession);

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (err) {
    console.error("Leave room error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
