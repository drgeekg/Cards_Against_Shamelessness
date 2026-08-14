import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/sessions-store";
import { judgePicksWinner, checkWinCondition, endGame } from "@/lib/game-engine";

export async function POST(req: NextRequest) {
  try {
    const { code, judgeId, submissionIndex } = await req.json();
    const session = await getSession(code?.toUpperCase());

    if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (session.phase !== "judging") {
      return NextResponse.json({ error: "Not in judging phase" }, { status: 400 });
    }

    const { session: afterJudge, winnerId } = judgePicksWinner(
      session,
      judgeId,
      submissionIndex
    );

    if (!winnerId) {
      return NextResponse.json({ error: "Invalid judge or submission" }, { status: 400 });
    }

    // Check win condition
    const winner = checkWinCondition(afterJudge);
    const finalSession = winner ? endGame(afterJudge) : afterJudge;
    await setSession(code.toUpperCase(), finalSession);

    return NextResponse.json({
      session: finalSession,
      winnerId,
      gameOver: !!winner,
      gameWinner: winner ?? null,
    });
  } catch (err) {
    console.error("Judge pick error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
