"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, CheckCircle2, ArrowRight } from "lucide-react";
import { CardHand } from "@/components/cards/CardHand";
import { PromptCard } from "@/components/cards/PromptCard";
import { Button } from "@/components/ui/Button";
import { ScoreTick } from "@/components/animations/ScoreTick";
import type { GameSession, ResponseCard } from "@/types/game";
import { ALL_RESPONSES } from "@/lib/card-data";
import { useUIStore } from "@/stores/uiStore";

interface GameBoardProps {
  session: GameSession;
  playerId: string;
  isJudge?: boolean;
  onSessionUpdate: (s: GameSession) => void;
}

export function GameBoard({ session, playerId, onSessionUpdate }: GameBoardProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const { addToast } = useUIStore();

  const player = session.players.find((p) => p.id === playerId);
  const prompt = session.currentPrompt;
  const pickCount = prompt?.pick ?? 1;
  const hasSubmitted = session.submissions.some((s) => s.playerId === playerId);
  const allowRefresh = session.allowCardRefresh ?? true;
  const maxShuffles = session.maxShufflesPerRound ?? 1;
  const shuffleCount = session.playerShuffleCounts?.[playerId] ?? (session.shuffledThisRound?.includes(playerId) ? 1 : 0);
  const reachedShuffleLimit = !allowRefresh || shuffleCount >= maxShuffles;
  const submissionCount = session.submissions.length;
  const totalPlayers = session.players.filter((p) => p.connected).length;

  // Map hand IDs to card objects
  const handCards = useMemo(
    () =>
      (player?.hand ?? [])
        .map((id) => ALL_RESPONSES.find((r) => r.id === id))
        .filter(Boolean) as ResponseCard[],
    [player?.hand]
  );

  // Card Swap Selection Logic: Tapping another card replaces or toggles without requiring explicit deselect
  const toggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds((prev) => prev.filter((id) => id !== cardId));
    } else if (pickCount === 1) {
      // Instant single card swap
      setSelectedCardIds([cardId]);
    } else {
      // Pick 2 or more: replace oldest selected card if limit reached
      setSelectedCardIds((prev) => {
        const next = prev.length >= pickCount ? prev.slice(-(pickCount - 1)) : prev;
        return [...next, cardId];
      });
    }
  };

  const handleShuffle = async () => {
    if (!allowRefresh || reachedShuffleLimit || hasSubmitted || shuffling) return;
    setShuffling(true);
    try {
      const res = await fetch("/api/game/shuffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: session.code,
          playerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Could not shuffle cards" });
        return;
      }
      setSelectedCardIds([]);
      onSessionUpdate(data.session);
      addToast({ type: "success", message: "Hand refreshed with new cards! 🔀" });
    } catch {
      addToast({ type: "error", message: "Network error while shuffling cards" });
    } finally {
      setShuffling(false);
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
    <div className="flex flex-col min-h-[calc(100dvh-64px)] justify-between" style={{ backgroundColor: "var(--bg)" }}>
      {/* Zone 1: Top Sticky Area — Prompt & Round Progress */}
      <div
        className="flex flex-col items-center gap-3 px-3 sm:px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Round counter + submission dots */}
        <div className="flex items-center justify-between w-full max-w-2xl">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--accent-primary)",
                border: "1px solid var(--border-strong)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              ROUND {session.round} / {session.totalRounds}
            </span>
          </div>

          {/* Submission progress */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPlayers }).map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 7,
                    height: 7,
                    backgroundColor:
                      i < submissionCount ? "var(--accent-primary)" : "var(--border-strong)",
                  }}
                  animate={i < submissionCount ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                marginLeft: 4,
              }}
            >
              {submissionCount}/{totalPlayers} submitted
            </span>
          </div>
        </div>

        {/* Prompt Card */}
        {prompt && (
          <div className="w-full flex justify-center py-1">
            <PromptCard card={prompt} size="md" />
          </div>
        )}
      </div>

      {/* Zone 2: Mini Player Score Strip */}
      <div
        className="flex gap-2.5 overflow-x-auto px-4 py-2 justify-start sm:justify-center"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {session.players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: p.id === playerId ? "var(--surface-2)" : "var(--surface)",
              border: p.id === playerId ? "1px solid var(--accent-primary)" : "1px solid var(--border)",
            }}
          >
            <div
              className="rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                width: 20,
                height: 20,
                backgroundColor: p.avatarColor,
                color: "#fff",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {p.name.charAt(0)}
            </div>
            <span
              className="text-xs font-semibold max-w-[70px] truncate"
              style={{ color: "var(--text)", fontFamily: "Inter, sans-serif" }}
            >
              {p.name}
            </span>
            <ScoreTick value={p.score} className="text-xs font-bold text-[var(--accent-primary)]" />
          </div>
        ))}
      </div>

      {/* Zone 3: Bottom Area — Card Hand & Actions */}
      <div className="flex-1 flex flex-col justify-between py-4 px-2 sm:px-4 pb-safe">
        {hasSubmitted ? (
          <motion.div
            className="flex flex-col items-center justify-center gap-3 py-12 flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span style={{ fontSize: "2.8rem" }}>✅</span>
            <h3
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "var(--text)",
              }}
            >
              Card Submitted!
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9rem",
                textAlign: "center",
              }}
            >
              Waiting for other players ({submissionCount}/{totalPlayers})...
            </p>
            {/* Animated Waiting Dots */}
            <div className="flex gap-1.5 mt-2">
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
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto">
            {/* Instruction and Shuffle Toolbar */}
            <div className="flex items-center justify-between px-2">
              <p
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {pickCount === 2
                  ? `PICK 2 CARDS (${selectedCardIds.length}/2)`
                  : "TAP A CARD TO SELECT"}
              </p>

              {/* Hand Shuffle Button (only if enabled by host) */}
              {allowRefresh ? (
                <button
                  onClick={handleShuffle}
                  disabled={reachedShuffleLimit || shuffling}
                  aria-label="Refresh response cards"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all touch-target"
                  style={{
                    backgroundColor: reachedShuffleLimit ? "var(--surface)" : "var(--surface-2)",
                    color: reachedShuffleLimit ? "var(--text-muted)" : "var(--text)",
                    border: "1px solid var(--border-strong)",
                    opacity: reachedShuffleLimit ? 0.6 : 1,
                    cursor: reachedShuffleLimit ? "not-allowed" : "pointer",
                  }}
                >
                  <Shuffle size={13} className={shuffling ? "animate-spin" : ""} />
                  {reachedShuffleLimit
                    ? `Refreshed (${maxShuffles}/${maxShuffles})`
                    : shuffling
                    ? "Refreshing..."
                    : `🔀 Refresh (${maxShuffles - shuffleCount} left)`}
                </button>
              ) : (
                <span className="text-[11px] text-[var(--text-subtle)] font-medium">
                  Refresh Off
                </span>
              )}
            </div>

            {/* Hand Cards Grid */}
            <div className="overflow-y-auto max-h-[46vh] sm:max-h-[50vh] py-1">
              <CardHand
                cards={handCards}
                selectedIds={selectedCardIds}
                submittedIds={submittedIds}
                onSelect={toggleCard}
                maxSelect={pickCount}
                disabled={hasSubmitted || submitting}
              />
            </div>

            {/* Sticky Submit Button */}
            <div className="flex justify-center pt-2 px-2">
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
                    Submit Card <ArrowRight size={18} />
                  </span>
                ) : (
                  `Select ${pickCount - selectedCardIds.length} more card${pickCount - selectedCardIds.length > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

