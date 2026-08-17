"use client";
import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { ResponseCard as ResponseCardType } from "@/types/game";
import { ResponseCard } from "./ResponseCard";

interface SwipeCardItem {
  id: string;
  card: ResponseCardType;
  badge?: string;
  isMyCard?: boolean;
}

interface SwipeCardDeckProps {
  items: SwipeCardItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  selectButtonLabel?: string;
  selectedButtonLabel?: string;
}

export function SwipeCardDeck({
  items,
  selectedIds,
  onSelect,
  disabled = false,
  selectButtonLabel = "Select",
  selectedButtonLabel = "Selected",
}: SwipeCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  // Keep index within bounds if items change
  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [items.length, currentIndex]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-150, 0, 150], [0.6, 1, 0.6]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem" }}>
          No cards to display...
        </p>
      </div>
    );
  }

  const handleNext = () => {
    setSwipeDirection("right");
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setSwipeDirection("left");
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 300;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swiped right -> next card (looping)
      handleNext();
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swiped left -> prev card (or next in loop)
      handlePrev();
    }
  };

  const currentItem = items[currentIndex];
  const isSelected = selectedIds.includes(currentItem.id);
  const nextItem = items[(currentIndex + 1) % items.length];
  const prevItem = items[(currentIndex - 1 + items.length) % items.length];

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Top Header: Progress Counter + Loop Hint + Prev/Next Controls */}
      <div className="flex items-center justify-between w-full max-w-sm px-3">
        <span
          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{
            backgroundColor: "var(--surface-2)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {currentIndex + 1} / {items.length}
        </span>

        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}
        >
          Swipe ⇄ in Loop
        </span>

        {/* Small Next/Prev arrow buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous card"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text)",
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next card"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text)",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Tinder/Bumble Card Stack Container */}
      <div className="relative w-full max-w-[280px] h-[340px] sm:h-[360px] flex items-center justify-center select-none touch-none">
        {/* Background Deck Card 2 (Bottom layer) */}
        {items.length > 2 && (
          <div
            className="absolute rounded-2xl w-[240px] h-[300px] pointer-events-none"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
              transform: "translateY(16px) scale(0.88)",
              opacity: 0.4,
              boxShadow: "var(--card-shadow)",
            }}
          />
        )}

        {/* Background Deck Card 1 (Middle layer) */}
        {items.length > 1 && (
          <div
            className="absolute rounded-2xl w-[260px] h-[320px] pointer-events-none"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-strong)",
              transform: "translateY(8px) scale(0.94)",
              opacity: 0.7,
              boxShadow: "var(--card-shadow)",
            }}
          />
        )}

        {/* Active Top Swiping Card */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentItem.id}
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              x: swipeDirection === "right" ? 280 : -280,
              opacity: 0,
              scale: 0.85,
              rotate: swipeDirection === "right" ? 20 : -20,
              transition: { duration: 0.2 },
            }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="absolute cursor-grab active:cursor-grabbing w-[270px] sm:w-[280px] h-[330px] sm:h-[350px] z-10"
          >
            <div className="relative w-full h-full">
              {/* The Actual Card */}
              <ResponseCard
                card={currentItem.card}
                layoutId={`swipe-card-${currentItem.id}`}
                isSelected={isSelected}
                size="lg"
                className="w-full h-full shadow-2xl !max-w-none pointer-events-none"
              />

              {/* Top Custom Badge (e.g. 'Your Card' in voting) */}
              {currentItem.badge && (
                <div
                  className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold z-20"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text)",
                    border: "1px solid var(--border-strong)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {currentItem.badge}
                </div>
              )}

              {/* Bottom Right corner: Prominent SELECT Button */}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) {
                    onSelect(currentItem.id);
                  }
                }}
                disabled={disabled}
                aria-label={`${isSelected ? "Deselect" : "Select"} card`}
                className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all"
                style={{
                  backgroundColor: isSelected ? "var(--accent-primary)" : "var(--surface-2)",
                  color: isSelected ? "var(--accent-on-primary)" : "var(--text)",
                  border: isSelected
                    ? "1.5px solid var(--accent-primary)"
                    : "1.5px solid var(--border-strong)",
                  fontFamily: "Inter, sans-serif",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
              >
                {isSelected ? (
                  <>
                    <Check size={14} strokeWidth={3} />
                    <span>{selectedButtonLabel}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-amber-500" />
                    <span>{selectButtonLabel}</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Swipe Indicator Dots */}
      <div className="flex items-center gap-1.5 mt-1">
        {items.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Jump to card ${idx + 1}`}
            className="rounded-full transition-all"
            style={{
              width: idx === currentIndex ? 18 : 6,
              height: 6,
              backgroundColor:
                idx === currentIndex
                  ? "var(--accent-primary)"
                  : selectedIds.includes(item.id)
                  ? "var(--text)"
                  : "var(--border-strong)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
