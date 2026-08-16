"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponseCard } from "@/components/cards/ResponseCard";
import { PromptCard } from "@/components/cards/PromptCard";
import { Button } from "@/components/ui/Button";
import type { GameSession, ResponseCard as ResponseCardType } from "@/types/game";
import { ALL_RESPONSES } from "@/lib/card-data";


interface JudgeViewProps {
  session: GameSession;
  playerId: string;
  isJudge: boolean;
  onSessionUpdate: (s: GameSession) => void;
}

export function JudgeView({ session, playerId, isJudge, onSessionUpdate }: JudgeViewProps) {
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const isVoting = session.phase === "voting";

  const prompt = session.currentPrompt;

  const handleReveal = (idx: number) => {
    if (!revealedIndices.includes(idx)) {
      setRevealedIndices((prev) => [...prev, idx]);
    }
  };

  const handleRevealAll = () => {
    setRevealedIndices(session.submissions.map((_, i) => i));
  };

  const handlePick = async () => {
    if (selectedIndex === null || (!isJudge && !isVoting)) return;
    setPicking(true);
    try {
      const res = await fetch(isVoting ? "/api/game/vote" : "/api/game/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: session.code,
          ...(isVoting
            ? { voterId: playerId, submissionId: session.submissions[selectedIndex]?.id }
            : { judgeId: playerId, submissionIndex: selectedIndex }),
        }),
      });
      if (res.ok) {
        const { session: updated } = await res.json();
        onSessionUpdate(updated);
      }
    } finally {
      setPicking(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100dvh-64px)] flex flex-col items-center px-4 py-6 gap-6"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span style={{ fontSize: "2rem" }}>👑</span>
        <h2
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.4rem",
            color: "var(--text)",
            marginTop: 4,
          }}
        >
          {isVoting ? "Vote for the funniest answer!" : isJudge ? "Pick your favourite!" : "The Judge is deciding..."}
        </h2>
        {!isJudge && (
          <p style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", marginTop: 4 }}>
            {session.players[session.judgeIndex]?.name} is reading the submissions
          </p>
        )}
      </motion.div>

      {/* Prompt reminder */}
      {prompt && (
        <div style={{ opacity: 0.7 }}>
          <PromptCard card={prompt} size="sm" />
        </div>
      )}

      {/* Reveal all button (judge only) */}
      {(isJudge || isVoting) && revealedIndices.length < session.submissions.length && (
        <Button variant="secondary" size="sm" onClick={handleRevealAll}>
          Reveal All Cards
        </Button>
      )}

      {/* Submission cards grid */}
      <div className="flex flex-wrap gap-4 justify-center max-w-3xl w-full">
        <AnimatePresence>
          {session.submissions.map((submission, idx) => {
            const isRevealed = revealedIndices.includes(idx);
            const isSelected = selectedIndex === idx;

            // Get card objects for this submission
            const cards = submission.cardIds
              .map((id) => ALL_RESPONSES.find((r) => r.id === id))
              .filter(Boolean) as ResponseCardType[];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 22, delay: idx * 0.1 }}
                className="flex flex-col gap-2 items-center"
              >
                {cards.map((card, cardIdx) =>
                  isRevealed ? (
                    <ResponseCard
                      key={card.id}
                      card={card}
                      layoutId={`judge-card-${card.id}`}
                      isSelected={isSelected}
                      isDimmed={selectedIndex !== null && !isSelected}
                      onClick={(isJudge || isVoting) ? () => setSelectedIndex(isSelected ? null : idx) : undefined}
                      size="md"
                    />
                  ) : (
                    <motion.div
                      key={`back-${idx}-${cardIdx}`}
                      onClick={isJudge ? () => handleReveal(idx) : undefined}
                      className="card-base rounded-2xl flex items-center justify-center"
                      style={{
                        width: 175,
                        minHeight: 220,
                        backgroundColor: "var(--accent-primary)",
                        cursor: isJudge ? "pointer" : "default",
                        border: "1px solid var(--border-strong)",
                      }}
                      whileHover={isJudge ? { scale: 1.03, rotate: 2 } : {}}
                      whileTap={isJudge ? { scale: 0.97 } : {}}
                    >
                      <span style={{ fontSize: "2.5rem", opacity: 0.3 }}>🃏</span>
                      {isJudge && (
                        <p
                          style={{
                            position: "absolute",
                            bottom: "1rem",
                            color: "var(--accent-on-primary)",
                            fontSize: "0.7rem",
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 600,
                            opacity: 0.7,
                          }}
                        >
                          tap to reveal
                        </p>
                      )}
                    </motion.div>
                  )
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pick button (judge only, after selecting) */}
      {(isJudge || isVoting) && selectedIndex !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <Button size="lg" variant="primary" loading={picking} onClick={handlePick}>
            🏆 Pick This One!
          </Button>
        </motion.div>
      )}
    </div>
  );
}
