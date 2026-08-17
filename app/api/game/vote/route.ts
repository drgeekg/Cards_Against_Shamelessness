import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";
import { castVote, resolveVotes } from "@/lib/game-engine";
import { loadPacks } from "@/lib/pack-loader";

export async function POST(req: NextRequest) {
  try {
    const { code, voterId, submissionId } = await req.json();
    const session = await getSession(code?.toUpperCase());
    if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (session.phase !== "voting") return NextResponse.json({ error: "Voting is closed" }, { status: 400 });

    const result = castVote(session, voterId, submissionId);
    if (!result.session.votes[voterId]) {
      return NextResponse.json({ error: result.error || "Invalid vote" }, { status: 400 });
    }

    let updated = result.session;
    if (result.complete) {
      const { prompts, responses } = loadPacks(session.activePacks, session.edition);
      updated = resolveVotes(result.session, prompts, responses);
    }

    await setSession(session.code.toUpperCase(), updated);
    return NextResponse.json({ session: updated, complete: result.complete });
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
