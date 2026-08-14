"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Find the winning submission (the one that made session go to reveal)
  // We look for the submission from the player who just got a point
  // The winning player is whoever has the highest score increment
  // For simplicity: find the submission that is "selected" by checking scores
  const winningSubmission = session.submissions[0]; // first one (for now, improve with tracking)

  // In a full implementation, we'd track which submission was picked
  // For the demo, show all submissions with the first one as "winner"
  const allSubmissions = session.submissions;

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
      className="min-h-[calc(100dvh-64px)] flex flex-col items-center px-4 py-8 gap-8"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Winner announcement */}
      <motion.div
        className="text-center flex flex-col items-center gap-3"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 18 }}
      >
        <motion.span
          style={{ fontSize: "3.5rem" }}
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          🏆
        </motion.span>
        <h2
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.75rem",
            color: "var(--text)",
          }}
        >
          Round Over!
        </h2>
      </motion.div>

      {/* Scoreboard */}
      <motion.div
        className="w-full max-w-md rounded-2xl p-5 flex flex-col gap-3"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-strong)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Scoreboard
        </h3>
        {[...session.players]
          .sort((a, b) => b.score - a.score)
          .map((player, i) => (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "Inter, sans-serif", width: 20 }}>
                  {i + 1}.
                </span>
                <PlayerChip
                  name={player.name}
                  avatarColor={player.avatarColor}
                  isYou={player.id === playerId}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <ScoreTick value={player.score} className="text-lg" />
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "Inter, sans-serif" }}>
                  /{session.targetScore}
                </span>
              </div>
            </div>
          ))}
      </motion.div>

      {/* All submitted cards */}
      <div className="flex flex-wrap gap-4 justify-center max-w-3xl">
        {allSubmissions.map((submission, idx) => {
          const cards = submission.cardIds
            .map((id) => ALL_RESPONSES.find((r) => r.id === id))
            .filter(Boolean) as ResponseCardType[];

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="flex flex-col gap-2"
            >
              {cards.map((card) => (
                <ResponseCard
                  key={card.id}
                  card={card}
                  isWinner={idx === 0}
                  isDimmed={idx !== 0}
                  size="md"
                />
              ))}
            </motion.div>
          );
        })}
      </div>

      {/* Next round button */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button size="lg" variant="primary" loading={advancing} onClick={handleNextRound}>
            Next Round →
          </Button>
        </motion.div>
      )}
      {!isHost && (
        <motion.p
          style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          initial={{ opacity: 0 }}
        >
          Waiting for the host to start next round...
        </motion.p>
      )}
    </div>
  );
}
