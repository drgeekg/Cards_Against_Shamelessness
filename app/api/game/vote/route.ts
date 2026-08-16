import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";
import { castVote, resolveVotes } from "@/lib/game-engine";

export async function POST(req: NextRequest) {
  const { code, voterId, submissionId } = await req.json();
  const session = await getSession(code?.toUpperCase());
  if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (session.phase !== "voting") return NextResponse.json({ error: "Voting is closed" }, { status: 400 });
  const result = castVote(session, voterId, submissionId);
  if (!result.session.votes[voterId]) return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  const updated = result.complete ? resolveVotes(result.session) : result.session;
  await setSession(session.code, updated);
  return NextResponse.json({ session: updated });
}
