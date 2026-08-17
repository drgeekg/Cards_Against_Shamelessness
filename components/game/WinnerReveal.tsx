"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowRight, Heart } from "lucide-react";
import { ResponseCard } from "@/components/cards/ResponseCard";
import { PlayerChip } from "@/components/lobby/PlayerChip";
import { ScoreTick } from "@/components/animations/ScoreTick";
import { Button } from "@/components/ui/Button";
import type { GameSession, ResponseCard as ResponseCardType } from "@/types/game";
import { ALL_RESPONSES } from "@/lib/card-data";

interface WinnerRevealProps {
  session: GameSession;
  playerId: string;
  isHost: boolean;
  onNextRound: () => void;
}

export function WinnerReveal({ session, playerId, isHost, onNextRound }: WinnerRevealProps) {
  const [advancing, setAdvancing] = useState(false);

  // Compute vote count per submission
  const voteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    Object.values(session.votes || {}).forEach((subId) => {
      counts.set(subId, (counts.get(subId) ?? 0) + 1);
    });
    return counts;
  }, [session.votes]);

  // Find the winning submission
  const winningSubmission = useMemo(() => {
    if (session.winningSubmissionId) {
      return session.submissions.find((s) => s.id === session.winningSubmissionId);
    }
    // Fallback: highest voted submission
    return session.submissions.slice().sort((a, b) => (voteCounts.get(b.id) ?? 0) - (voteCounts.get(a.id) ?? 0))[0];
  }, [session.winningSubmissionId, session.submissions, voteCounts]);

  const winningPlayer = useMemo(() => {
    if (!winningSubmission) return null;
    return session.players.find((p) => p.id === winningSubmission.playerId);
  }, [winningSubmission, session.players]);

  const handleNextRound = async () => {
    setAdvancing(true);
    try {
      await fetch("/api/game/next-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: session.code, hostId: playerId }),
      });
      onNextRound();
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-between px-3 sm:px-4 py-6 gap-6 pb-safe"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Winner announcement header */}
      <motion.div
        className="text-center flex flex-col items-center gap-2"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 18 }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl sm:text-5xl"
        >
          🏆
        </motion.div>

        <h2
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            color: "var(--text)",
            lineHeight: 1.1,
          }}
        >
          {winningPlayer
            ? `${winningPlayer.id === playerId ? "You" : winningPlayer.name} Won the Round!`
            : "Round Winner!"}
        </h2>

        {winningPlayer && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                width: 24,
                height: 24,
                backgroundColor: winningPlayer.avatarColor,
                color: "#fff",
              }}
            >
              {winningPlayer.name.charAt(0)}
            </div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9rem",
                color: "var(--accent-primary)",
                fontWeight: 700,
              }}
            >
              {winningPlayer.name} (+1 point)
            </span>
          </div>
        )}
      </motion.div>

      {/* Submitted cards list with vote counts and winner highlighted */}
      <div className="w-full max-w-4xl flex flex-col items-center">
        <h3
          className="text-xs font-bold tracking-wider uppercase mb-3 text-center"
          style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}
        >
          All Round Submissions
        </h3>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-items-center justify-center gap-3 sm:gap-4 w-full px-1 sm:px-4 max-h-[46vh] overflow-y-auto py-2">
          {session.submissions.map((submission, idx) => {
            const isWinner = submission.id === winningSubmission?.id;
            const votesForThis = voteCounts.get(submission.id) ?? 0;
            const subPlayer = session.players.find((p) => p.id === submission.playerId);

            const cards = submission.cardIds
              .map((id) => ALL_RESPONSES.find((r) => r.id === id))
              .filter(Boolean) as ResponseCardType[];

            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                className="w-full flex flex-col items-center gap-1.5"
              >
                <div className="relative w-full flex justify-center">
                  {cards.map((card) => (
                    <ResponseCard
                      key={card.id}
                      card={card}
                      isWinner={isWinner}
                      isDimmed={!isWinner}
                      size="md"
                    />
                  ))}

                  {/* Vote Count Badge */}
                  <div
                    className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1"
                    style={{
                      backgroundColor: isWinner ? "var(--accent-primary)" : "var(--surface)",
                      color: isWinner ? "var(--accent-on-primary)" : "var(--text)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    <Heart size={11} fill={isWinner ? "currentColor" : "none"} />
                    <span>{votesForThis}</span>
                  </div>
                </div>

                {/* Submitter Name Tag */}
                <div className="flex items-center gap-1">
                  <span
                    className="text-[11px] font-semibold truncate max-w-[120px]"
                    style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}
                  >
                    {subPlayer?.name || "Player"}
                  </span>
                  {isWinner && <span className="text-xs">👑</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Scoreboard Strip & Next Round CTA */}
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {/* Compact scores */}
        <div
          className="w-full rounded-2xl p-3 flex flex-col gap-2"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-strong)",
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold px-1" style={{ color: "var(--text-muted)" }}>
            <span>STANDINGS</span>
            <span>TARGET: {session.targetScore} PTS</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {[...session.players]
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: p.id === winningPlayer?.id ? "var(--surface-2)" : "transparent",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: p.avatarColor, color: "#fff" }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-xs" style={{ color: "var(--text)" }}>
                    {p.name}
                  </span>
                  <span className="font-bold text-[var(--accent-primary)]">{p.score}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Next Round Button for Host */}
        {isHost ? (
          <Button
            size="lg"
            variant="primary"
            loading={advancing}
            onClick={handleNextRound}
            className="w-full touch-target font-bold"
          >
            <span className="flex items-center justify-center gap-2">
              Next Round <ArrowRight size={18} />
            </span>
          </Button>
        ) : (
          <motion.p
            style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem" }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center"
          >
            Waiting for the host to start next round...
          </motion.p>
        )}
      </div>
    </div>
  );
}

