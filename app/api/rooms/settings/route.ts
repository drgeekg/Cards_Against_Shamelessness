import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";

export async function POST(req: NextRequest) {
  try {
    const { code, hostId, settings } = await req.json();
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const session = await getSession(code.toUpperCase());
    if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const host = session.players.find((p) => p.id === hostId && p.isHost);
    if (!host) return NextResponse.json({ error: "Only the host can change settings" }, { status: 403 });

    if (session.phase !== "lobby") {
      return NextResponse.json({ error: "Settings can only be changed in the lobby" }, { status: 400 });
    }

    const updatedSession = {
      ...session,
      ...(settings.handSize !== undefined && { handSize: Number(settings.handSize) }),
      ...(settings.targetScore !== undefined && { targetScore: Number(settings.targetScore) }),
      ...(settings.totalRounds !== undefined && { totalRounds: Number(settings.totalRounds) }),
      ...(settings.minCardsRefillThreshold !== undefined && { minCardsRefillThreshold: Number(settings.minCardsRefillThreshold) }),
      ...(settings.refillCardCount !== undefined && { refillCardCount: Number(settings.refillCardCount) }),
      ...(settings.nsfw !== undefined && { nsfw: Boolean(settings.nsfw) }),
      ...(settings.roundTimer !== undefined && { roundTimer: settings.roundTimer }),
      ...(settings.activePacks !== undefined && { activePacks: settings.activePacks }),
    };

    await setSession(code.toUpperCase(), updatedSession);
    return NextResponse.json({ session: updatedSession });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
