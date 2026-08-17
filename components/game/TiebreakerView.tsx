"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { CardHand } from "@/components/cards/CardHand";
import { PromptCard } from "@/components/cards/PromptCard";
import { Button } from "@/components/ui/Button";
import type { GameSession, ResponseCard } from "@/types/game";
import { ALL_RESPONSES } from "@/lib/card-data";
import { useUIStore } from "@/stores/uiStore";

interface TiebreakerViewProps {
  session: GameSession;
  playerId: string;
  onSessionUpdate: (s: GameSession) => void;
}

export function TiebreakerView({ session, playerId, onSessionUpdate }: TiebreakerViewProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useUIStore();

  const isTiedPlayer = session.tiebreakerPlayerIds?.includes(playerId);
  const prompt = session.currentPrompt;
  const pickCount = prompt?.pick ?? 1;
  const hasSubmitted = session.submissions.some((s) => s.playerId === playerId);
  const submissionCount = session.submissions.length;
  const totalTied = session.tiebreakerPlayerIds?.length ?? 0;

  const player = session.players.find((p) => p.id === playerId);
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
    } else if (pickCount === 1) {
      setSelectedCardIds([cardId]);
    } else {
      setSelectedCardIds((prev) => {
        const next = prev.length >= pickCount ? prev.slice(-(pickCount - 1)) : prev;
        return [...next, cardId];
      });
    }
  };

  const handleSubmit = async () => {
    if (selectedCardIds.length !== pickCount || submitting) return;
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
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Submission error" });
        return;
      }
      onSessionUpdate(data.session);
      setSelectedCardIds([]);
    } catch {
      addToast({ type: "error", message: "Network error submitting tiebreaker card" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-between px-3 sm:px-4 py-4 sm:py-6 gap-4 pb-safe"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Top Banner: Tiebreaker Alert */}
      <motion.div
        className="w-full max-w-xl text-center flex flex-col items-center gap-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-md"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "var(--accent-on-primary)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <Zap size={14} /> TIEBREAKER ROUND
        </div>

        <h2
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.3rem, 4vw, 1.75rem)",
            color: "var(--text)",
            lineHeight: 1.1,
          }}
        >
          {isTiedPlayer ? "You're in the Tiebreaker! 🔥" : "Tiebreaker in Progress! ⚡"}
        </h2>

        <p style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.85rem" }}>
          {isTiedPlayer
            ? "You received 3 extra cards. Pick the winning card to break the tie!"
            : "Top players are tied. Waiting for them to submit their tiebreaker cards..."}
        </p>

        {/* Prompt Card */}
        {prompt && (
          <div className="w-full flex justify-center mt-2">
            <PromptCard card={prompt} size="md" />
          </div>
        )}
      </motion.div>

      {/* Main Area: Hand or Spectate */}
      <div className="w-full max-w-4xl flex-1 flex flex-col justify-center items-center">
        {isTiedPlayer ? (
          hasSubmitted ? (
            <motion.div
              className="flex flex-col items-center gap-3 py-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span style={{ fontSize: "2.8rem" }}>✅</span>
              <p
                style={{
                  color: "var(--text)",
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                }}
              >
                Tiebreaker Card Submitted!
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "Inter, sans-serif" }}>
                Waiting for other tied players ({submissionCount}/{totalTied})...
              </p>
            </motion.div>
          ) : (
            <div className="w-full flex flex-col gap-3">
              <div className="overflow-y-auto max-h-[46vh] py-1">
                <CardHand
                  cards={handCards}
                  selectedIds={selectedCardIds}
                  submittedIds={submittedIds}
                  onSelect={toggleCard}
                  maxSelect={pickCount}
                  disabled={hasSubmitted || submitting}
                />
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  loading={submitting}
                  disabled={selectedCardIds.length !== pickCount}
                  onClick={handleSubmit}
                  className="w-full max-w-md touch-target font-bold"
                >
                  {selectedCardIds.length === pickCount ? (
                    <span className="flex items-center justify-center gap-2">
                      Submit Tiebreaker Card <ArrowRight size={18} />
                    </span>
                  ) : (
                    "Select a Card"
                  )}
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 py-10">
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
            <p
              style={{
                color: "var(--text-muted)",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9rem",
              }}
            >
              Tied players submitting ({submissionCount}/{totalTied})...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
