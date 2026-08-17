import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";
import { submitCards } from "@/lib/game-engine";

export async function POST(req: NextRequest) {
  try {
    const { code, playerId, cardIds } = await req.json();
    const session = await getSession(code?.toUpperCase());

    if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (session.phase !== "submitting" && session.phase !== "tiebreaker") {
      return NextResponse.json({ error: "Not in submission phase" }, { status: 400 });
    }

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json({ error: "No cards provided" }, { status: 400 });
    }

    const expectedPick = session.currentPrompt?.pick ?? 1;
    if (cardIds.length !== expectedPick) {
      return NextResponse.json(
        { error: `This prompt requires ${expectedPick} card(s)` },
        { status: 400 }
      );
    }

    const { session: updated, allSubmitted, error } = submitCards(session, playerId, cardIds);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    await setSession(code.toUpperCase(), updated);

    return NextResponse.json({ session: updated, allSubmitted });
  } catch (err) {
    console.error("Submit card error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
