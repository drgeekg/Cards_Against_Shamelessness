"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Vote, SlidersHorizontal, LayoutGrid, Layers } from "lucide-react";
import { ResponseCard } from "@/components/cards/ResponseCard";
import { PromptCard } from "@/components/cards/PromptCard";
import { SwipeCardDeck } from "@/components/cards/SwipeCardDeck";
import { Button } from "@/components/ui/Button";
import type { GameSession, ResponseCard as ResponseCardType } from "@/types/game";
import { ALL_RESPONSES } from "@/lib/card-data";
import { useUIStore } from "@/stores/uiStore";
import type { CardViewMode } from "@/components/cards/CardHand";

interface VotingViewProps {
  session: GameSession;
  playerId: string;
  isJudge?: boolean;
  onSessionUpdate: (s: GameSession) => void;
}

export function VotingView({ session, playerId, onSessionUpdate }: VotingViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [viewMode, setViewMode] = useState<CardViewMode>("horizontal");
  const { addToast } = useUIStore();

  // Load view mode preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cardsvs-view-mode") as CardViewMode;
      if (saved && (saved === "horizontal" || saved === "swipe" || saved === "grid")) {
        setViewMode(saved);
      }
    }
  }, []);

  const handleModeChange = (mode: CardViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("cardsvs-view-mode", mode);
    }
  };

  const prompt = session.currentPrompt;
  const myVotedSubmissionId = session.votes?.[playerId];
  const hasVoted = !!myVotedSubmissionId;
  const connectedPlayers = session.players.filter((p) => p.connected);
  const voteCount = Object.keys(session.votes || {}).length;
  const totalVoters = connectedPlayers.length;

  const handleVote = async (overrideIndex?: number) => {
    const idxToVote = overrideIndex !== undefined ? overrideIndex : selectedIndex;
    if (idxToVote === null || hasVoted || submittingVote) return;
    const chosenSubmission = session.submissions[idxToVote];
    if (!chosenSubmission) return;

    setSubmittingVote(true);
    try {
      const res = await fetch("/api/game/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: session.code,
          voterId: playerId,
          submissionId: chosenSubmission.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Could not record vote" });
        return;
      }
      onSessionUpdate(data.session);
    } catch {
      addToast({ type: "error", message: "Network error while voting" });
    } finally {
      setSubmittingVote(false);
    }
  };

  // Prepare submission items for SwipeDeck
  const swipeItems = session.submissions.map((sub, idx) => {
    const cardObj = ALL_RESPONSES.find((r) => r.id === sub.cardIds[0]) || {
      id: sub.cardIds[0],
      text: "Unknown card",
      edition: "decency" as const,
      pack: "main",
    };
    const isMy = sub.playerId === playerId;
    const isMyVote = sub.id === myVotedSubmissionId;

    return {
      id: String(idx),
      card: cardObj,
      badge: isMy ? "Your Card ⭐" : isMyVote ? "Your Vote ✓" : undefined,
      isMyCard: isMy,
    };
  });

  const selectedSwipeIds = selectedIndex !== null ? [String(selectedIndex)] : [];

  return (
    <div
      className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-between px-3 sm:px-4 py-4 sm:py-6 gap-4 pb-safe"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Top Header: Vote prompt + Round */}
      <motion.div
        className="text-center flex flex-col items-center gap-2 w-full max-w-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
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
            VOTING PHASE
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}
          >
            {voteCount}/{totalVoters} votes in
          </span>
        </div>

        <h2
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)",
            color: "var(--text)",
            lineHeight: 1.2,
          }}
        >
          {hasVoted ? "Vote Recorded! 🗳️" : "Vote for the Funniest Answer!"}
        </h2>
        <p style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.85rem" }}>
          {hasVoted
            ? "Waiting for all players to finish voting..."
            : "Select any card below (including your own) and cast your vote."}
        </p>

        {/* Prompt Card Reminder */}
        {prompt && (
          <div className="w-full flex justify-center mt-1">
            <PromptCard card={prompt} size="sm" />
          </div>
        )}
      </motion.div>

      {/* Submissions Container with View Switcher */}
      <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center gap-3">
        {/* View Mode Toggle Switcher */}
        <div className="flex items-center justify-end w-full px-2">
          <div
            className="flex items-center p-1 rounded-xl gap-1 shadow-sm"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => handleModeChange("horizontal")}
              aria-label="Horizontal scroll view"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: viewMode === "horizontal" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "horizontal" ? "var(--accent-on-primary)" : "var(--text-muted)",
              }}
            >
              <SlidersHorizontal size={13} />
              <span className="hidden xs:inline">Horizontal</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("swipe")}
              aria-label="Swipe stack view"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: viewMode === "swipe" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "swipe" ? "var(--accent-on-primary)" : "var(--text-muted)",
              }}
            >
              <Layers size={13} />
              <span className="hidden xs:inline">Swipe Deck</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("grid")}
              aria-label="Grid view"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: viewMode === "grid" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "grid" ? "var(--accent-on-primary)" : "var(--text-muted)",
              }}
            >
              <LayoutGrid size={13} />
              <span className="hidden xs:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Swipe Deck (Tinder/Bumble Loop) */}
        {viewMode === "swipe" && (
          <SwipeCardDeck
            items={swipeItems}
            selectedIds={selectedSwipeIds}
            onSelect={(idxStr) => {
              if (!hasVoted) {
                const idx = Number(idxStr);
                setSelectedIndex(selectedIndex === idx ? null : idx);
              }
            }}
            disabled={hasVoted || submittingVote}
            selectButtonLabel="Vote"
            selectedButtonLabel="Selected"
          />
        )}

        {/* View Mode 2: Horizontal Row View */}
        {viewMode === "horizontal" && (
          <div className="w-full max-w-4xl overflow-x-auto pb-3 pt-1 px-3 flex flex-row gap-3 snap-x snap-mandatory scroll-smooth justify-start sm:justify-center">
            <AnimatePresence>
              {session.submissions.map((submission, idx) => {
                const isMySubmission = submission.playerId === playerId;
                const isSelected = selectedIndex === idx;
                const isMyVote = submission.id === myVotedSubmissionId;

                const cards = submission.cardIds
                  .map((id) => ALL_RESPONSES.find((r) => r.id === id))
                  .filter(Boolean) as ResponseCardType[];

                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0 snap-center w-[160px] sm:w-[175px] flex flex-col items-center gap-1.5"
                  >
                    <div
                      onClick={() => {
                        if (!hasVoted) {
                          setSelectedIndex(isSelected ? null : idx);
                        }
                      }}
                      className="relative w-full flex justify-center cursor-pointer transition-transform"
                    >
                      {cards.map((card) => (
                        <ResponseCard
                          key={card.id}
                          card={card}
                          layoutId={`vote-card-${card.id}`}
                          isSelected={isSelected || isMyVote}
                          isDimmed={hasVoted ? !isMyVote : false}
                          size="md"
                          className="w-full"
                        />
                      ))}

                      {isMyVote && (
                        <div
                          className="absolute -top-2 -right-2 rounded-full p-1 shadow-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--accent-primary)",
                            color: "var(--accent-on-primary)",
                          }}
                        >
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {isMySubmission ? (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Your card ⭐
                      </span>
                    ) : isMyVote ? (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          color: "var(--accent-on-primary)",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Your Vote
                      </span>
                    ) : null}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* View Mode 3: Standard Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-items-center justify-center gap-3 sm:gap-4 w-full px-1 sm:px-4 max-h-[50vh] overflow-y-auto py-2">
            <AnimatePresence>
              {session.submissions.map((submission, idx) => {
                const isMySubmission = submission.playerId === playerId;
                const isSelected = selectedIndex === idx;
                const isMyVote = submission.id === myVotedSubmissionId;

                const cards = submission.cardIds
                  .map((id) => ALL_RESPONSES.find((r) => r.id === id))
                  .filter(Boolean) as ResponseCardType[];

                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="w-full flex flex-col items-center gap-1.5"
                  >
                    <div
                      onClick={() => {
                        if (!hasVoted) {
                          setSelectedIndex(isSelected ? null : idx);
                        }
                      }}
                      className="relative w-full flex justify-center cursor-pointer transition-transform"
                    >
                      {cards.map((card) => (
                        <ResponseCard
                          key={card.id}
                          card={card}
                          layoutId={`vote-card-${card.id}`}
                          isSelected={isSelected || isMyVote}
                          isDimmed={hasVoted ? !isMyVote : false}
                          size="md"
                        />
                      ))}

                      {isMyVote && (
                        <div
                          className="absolute -top-2 -right-2 rounded-full p-1 shadow-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--accent-primary)",
                            color: "var(--accent-on-primary)",
                          }}
                        >
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {isMySubmission ? (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Your card ⭐
                      </span>
                    ) : isMyVote ? (
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--accent-primary)",
                          color: "var(--accent-on-primary)",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Your Vote
                      </span>
                    ) : null}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="w-full max-w-md flex flex-col items-center gap-3 pt-2">
        {!hasVoted ? (
          <Button
            size="lg"
            variant="primary"
            loading={submittingVote}
            disabled={selectedIndex === null}
            onClick={() => handleVote()}
            className="w-full touch-target font-bold"
          >
            {selectedIndex !== null ? (
              <span className="flex items-center justify-center gap-2">
                <Vote size={18} /> Cast Vote →
              </span>
            ) : (
              "Tap a Card to Vote"
            )}
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-2">
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
                fontSize: "0.85rem",
              }}
            >
              Counting final votes ({voteCount}/{totalVoters})...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
