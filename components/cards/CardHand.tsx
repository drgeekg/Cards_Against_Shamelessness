"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponseCard } from "./ResponseCard";
import { SwipeCardDeck } from "./SwipeCardDeck";
import type { ResponseCard as ResponseCardType } from "@/types/game";
import { SlidersHorizontal, LayoutGrid, Layers } from "lucide-react";

export type CardViewMode = "horizontal" | "swipe" | "grid";

interface CardHandProps {
  cards: ResponseCardType[];
  selectedIds: string[];
  submittedIds: string[];
  onSelect: (cardId: string) => void;
  maxSelect?: number;
  disabled?: boolean;
}

const cardVariants = {
  hidden: { y: 60, opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      delay: i * 0.04,
    },
  }),
  exit: { y: 40, opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export function CardHand({
  cards,
  selectedIds,
  submittedIds,
  onSelect,
  maxSelect = 1,
  disabled = false,
}: CardHandProps) {
  const [viewMode, setViewMode] = useState<CardViewMode>("horizontal");

  // Load user preference on mount
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

  const activeCards = cards.filter((card) => !submittedIds.includes(card.id));

  if (activeCards.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-6"
        style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem" }}
      >
        Your hand is empty...
      </motion.p>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* View Mode Toggle Controls */}
      <div className="flex items-center justify-end w-full max-w-4xl px-2">
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
            title="Horizontal scroll view"
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
            title="Swipe stack view (Tinder style)"
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
            title="Grid view"
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

      {/* Mode 1: Swipe Deck (Tinder/Bumble loop) */}
      {viewMode === "swipe" && (
        <SwipeCardDeck
          items={activeCards.map((c) => ({ id: c.id, card: c }))}
          selectedIds={selectedIds}
          onSelect={onSelect}
          disabled={disabled}
          selectButtonLabel="Select"
          selectedButtonLabel="Selected"
        />
      )}

      {/* Mode 2: Horizontal Row View */}
      {viewMode === "horizontal" && (
        <div className="w-full max-w-4xl overflow-x-auto pb-3 pt-1 px-3 flex flex-row gap-3 snap-x snap-mandatory scroll-smooth justify-start sm:justify-center">
          <AnimatePresence mode="popLayout">
            {activeCards.map((card, i) => {
              const isSelected = selectedIds.includes(card.id);
              return (
                <motion.div
                  key={card.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="flex-shrink-0 snap-center w-[160px] sm:w-[175px]"
                >
                  <ResponseCard
                    card={card}
                    layoutId={`hand-card-${card.id}`}
                    isSelected={isSelected}
                    onClick={() => !disabled && onSelect(card.id)}
                    disabled={disabled}
                    size="md"
                    className="w-full h-full"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Mode 3: Standard Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-items-center justify-center gap-2.5 sm:gap-3.5 w-full max-w-4xl px-2 sm:px-4">
          <AnimatePresence mode="popLayout">
            {activeCards.map((card, i) => {
              const isSelected = selectedIds.includes(card.id);
              return (
                <motion.div
                  key={card.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="w-full flex justify-center"
                >
                  <ResponseCard
                    card={card}
                    layoutId={`hand-card-${card.id}`}
                    isSelected={isSelected}
                    onClick={() => !disabled && onSelect(card.id)}
                    disabled={disabled}
                    size="md"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
