"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);

  // Keep index within bounds if items change
  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [items.length, currentIndex]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-22, 22]);
  const opacity = useTransform(x, [-250, -180, 0, 180, 250], [0.2, 0.8, 1, 0.8, 0.2]);

  // Dynamic transforms for the card underneath as top card is dragged
  const nextScale = useTransform(x, [-200, 0, 200], [1, 0.94, 1]);
  const nextY = useTransform(x, [-200, 0, 200], [0, 10, 0]);
  const nextOpacity = useTransform(x, [-200, 0, 200], [1, 0.75, 1]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem" }}>
          No cards to display...
        </p>
      </div>
    );
  }

  const triggerFlyAway = (direction: "left" | "right", isNext: boolean) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);

    const targetX = direction === "right" ? 420 : -420;

    animate(x, targetX, {
      duration: 0.22,
      ease: "easeOut",
      onComplete: () => {
        // After flying away, advance the deck and loop the swiped card to the back
        setCurrentIndex((prev) =>
          isNext ? (prev + 1) % items.length : (prev - 1 + items.length) % items.length
        );
        x.set(0);
        isAnimatingRef.current = false;
        setIsAnimating(false);
      },
    });
  };

  const handleNext = () => {
    triggerFlyAway("right", true);
  };

  const handlePrev = () => {
    triggerFlyAway("left", false);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isAnimatingRef.current) return;

    const swipeThreshold = 60;
    const velocityThreshold = 300;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swiped right -> fly off to the right, next card comes up
      triggerFlyAway("right", true);
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swiped left -> fly off to the left, next card comes up
      triggerFlyAway("left", true);
    } else {
      // Small drag -> spring back smoothly to center
      animate(x, 0, {
        type: "spring",
        stiffness: 420,
        damping: 26,
      });
    }
  };

  const currentItem = items[currentIndex];
  const isSelected = selectedIds.includes(currentItem.id);
  const nextIndex = (currentIndex + 1) % items.length;
  const nextItem = items[nextIndex];
  const hasMultiple = items.length > 1;

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
            disabled={isAnimating}
            aria-label="Previous card"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors touch-target"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text)",
              opacity: isAnimating ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isAnimating}
            aria-label="Next card"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors touch-target"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-strong)",
              color: "var(--text)",
              opacity: isAnimating ? 0.5 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Tinder/Bumble Card Stack Container */}
      <div className="relative w-full max-w-[280px] h-[340px] sm:h-[360px] flex items-center justify-center select-none touch-none">
        {/* Background Deck Card 2 (Bottom layer shadow/preview) */}
        {items.length > 2 && (
          <div
            className="absolute rounded-2xl w-[245px] h-[305px] pointer-events-none"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
              transform: "translateY(18px) scale(0.88)",
              opacity: 0.35,
              boxShadow: "var(--card-shadow)",
              zIndex: 1,
            }}
          />
        )}

        {/* Next Card in Stack (Directly Underneath Top Card) */}
        {hasMultiple && (
          <motion.div
            key={nextItem.id}
            style={{
              scale: nextScale,
              y: nextY,
              opacity: nextOpacity,
              zIndex: 2,
            }}
            className="absolute w-[270px] sm:w-[280px] h-[330px] sm:h-[350px] pointer-events-none"
          >
            <div className="relative w-full h-full">
              <ResponseCard
                card={nextItem.card}
                isSelected={selectedIds.includes(nextItem.id)}
                size="lg"
                className="w-full h-full shadow-lg !max-w-none"
              />

              {nextItem.badge && (
                <div
                  className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text)",
                    border: "1px solid var(--border-strong)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {nextItem.badge}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Top Active Card with Gestures */}
        <motion.div
          key={currentItem.id}
          style={{ x, rotate, opacity, zIndex: 10 }}
          drag={isAnimating ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.85}
          onDragEnd={handleDragEnd}
          className="absolute cursor-grab active:cursor-grabbing w-[270px] sm:w-[280px] h-[330px] sm:h-[350px]"
        >
          <div className="relative w-full h-full">
            {/* The Active Card */}
            <ResponseCard
              card={currentItem.card}
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
                if (!disabled && !isAnimating) {
                  onSelect(currentItem.id);
                }
              }}
              disabled={disabled || isAnimating}
              aria-label={`${isSelected ? "Deselect" : "Select"} card`}
              className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all"
              style={{
                backgroundColor: isSelected ? "var(--accent-primary)" : "var(--surface-2)",
                color: isSelected ? "var(--accent-on-primary)" : "var(--text)",
                border: isSelected
                  ? "1.5px solid var(--accent-primary)"
                  : "1.5px solid var(--border-strong)",
                fontFamily: "Inter, sans-serif",
                cursor: disabled || isAnimating ? "not-allowed" : "pointer",
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
      </div>

      {/* Bottom Swipe Indicator Dots */}
      <div className="flex items-center gap-1.5 mt-1">
        {items.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (!isAnimating) {
                x.set(0);
                setCurrentIndex(idx);
              }
            }}
            disabled={isAnimating}
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
