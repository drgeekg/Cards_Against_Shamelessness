"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CardHand } from "@/components/cards/CardHand";
import { PromptCard } from "@/components/cards/PromptCard";
import { PlayerChip } from "@/components/lobby/PlayerChip";
import { Button } from "@/components/ui/Button";
import { ScoreTick } from "@/components/animations/ScoreTick";
import type { GameSession, ResponseCard } from "@/types/game";

import { ALL_RESPONSES } from "@/lib/card-data";


interface GameBoardProps {
  session: GameSession;
  playerId: string;
  isJudge: boolean;
  onSessionUpdate: (s: GameSession) => void;
}

export function GameBoard({ session, playerId, isJudge, onSessionUpdate }: GameBoardProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const player = session.players.find((p) => p.id === playerId);
  const judge = session.players[session.judgeIndex];
  const prompt = session.currentPrompt;
  const pickCount = prompt?.pick ?? 1;
  const hasSubmitted = session.submissions.some((s) => s.playerId === playerId);
  const submissionCount = session.submissions.length;
  const totalNonJudge = session.players.filter((p) => p.id !== judge?.id && p.connected).length;

  // Map hand IDs to card objects
  const handCards = useMemo(
    () =>
      (player?.hand ?? [])
        .map((id) => ALL_RESPONSES.find((r) => r.id === id))
        .filter(Boolean) as ResponseCard[],
    [player?.hand]
  );

  const toggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds((prev) => prev.filter((id) => id !== cardId));
    } else if (selectedCardIds.length < pickCount) {
      setSelectedCardIds((prev) => [...prev, cardId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedCardIds.length !== pickCount) return;
    setSubmitting(true);
    setSubmittedIds(selectedCardIds);
    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: session.code,
          playerId,
          cardIds: selectedCardIds,
        }),
      });
      if (res.ok) {
        const { session: updated } = await res.json();
        onSessionUpdate(updated);
        setSelectedCardIds([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)]" style={{ backgroundColor: "var(--bg)" }}>
      {/* Top area — prompt + scores */}
      <div
        className="flex flex-col items-center gap-4 px-4 pt-6 pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Round + submission progress */}
        <div className="flex items-center gap-3 w-full max-w-2xl justify-between">
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            ROUND {session.round}
          </span>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalNonJudge }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor:
                    i < submissionCount ? "var(--accent-primary)" : "var(--border-strong)",
                }}
                animate={i < submissionCount ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginLeft: 4,
              }}
            >
              {submissionCount}/{totalNonJudge}
            </span>
          </div>
        </div>

        {/* Prompt card */}
        {prompt && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <PromptCard card={prompt} size="md" />
          </motion.div>
        )}

        {/* Judge indicator */}
        {judge && (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>
              {isJudge ? "You are the Judge — wait for submissions" : `${judge.name} is judging`}
            </span>
          </div>
        )}
      </div>

      {/* Scoreboard strip */}
      <div
        className="flex gap-3 overflow-x-auto px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {session.players.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className="rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                width: 28,
                height: 28,
                backgroundColor: p.avatarColor,
                color: "#fff",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {p.name.charAt(0)}
            </div>
            <ScoreTick
              value={p.score}
              className="text-sm"
            />
            {"/"}
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>
              {session.targetScore}
            </span>
          </div>
        ))}
      </div>

      {/* Hand area */}
      <div className="flex-1 flex flex-col justify-end pb-6 px-4">
        {isJudge ? (
          <motion.div
            className="flex flex-col items-center gap-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span style={{ fontSize: "3rem" }}>👑</span>
            <p
              style={{
                color: "var(--text-muted)",
                fontFamily: "Inter, sans-serif",
                fontSize: "1rem",
                textAlign: "center",
              }}
            >
              You&apos;re the judge this round.
              <br />
              Wait for everyone to submit...
            </p>
            {/* Animated waiting dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: "var(--accent-primary)" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        ) : hasSubmitted ? (
          <motion.div
            className="flex flex-col items-center gap-3 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span style={{ fontSize: "2.5rem" }}>✅</span>
            <p
              style={{
                color: "var(--text-muted)",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.95rem",
                textAlign: "center",
              }}
            >
              Card submitted! Waiting for others...
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <p
              className="text-center"
              style={{
                color: "var(--text-muted)",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {pickCount === 2
                ? `SELECT 2 CARDS (${selectedCardIds.length}/2)`
                : "SELECT A CARD FROM YOUR HAND"}
            </p>

            <CardHand
              cards={handCards}
              selectedIds={selectedCardIds}
              submittedIds={submittedIds}
              onSelect={toggleCard}
              maxSelect={pickCount}
              disabled={hasSubmitted || submitting}
            />

            {selectedCardIds.length === pickCount && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <Button
                  size="lg"
                  variant="primary"
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  Submit Card →
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
