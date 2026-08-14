"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ResponseCard } from "./ResponseCard";
import type { ResponseCard as ResponseCardType } from "@/types/game";

interface CardHandProps {
  cards: ResponseCardType[];
  selectedIds: string[];
  submittedIds: string[];
  onSelect: (cardId: string) => void;
  maxSelect?: number;
  disabled?: boolean;
}

const cardVariants = {
  hidden: { y: 140, opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 280,
      damping: 22,
      delay: i * 0.06,
    },
  }),
  exit: { y: 60, opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export function CardHand({
  cards,
  selectedIds,
  submittedIds,
  onSelect,
  maxSelect = 1,
  disabled = false,
}: CardHandProps) {
  const isMaxSelected = selectedIds.length >= maxSelect;

  return (
    <div
      className="relative flex items-end justify-center"
      style={{ minHeight: 240, width: "100%" }}
    >
      {/* Card row / fan */}
      <div
        className="flex gap-3 flex-wrap justify-center"
        style={{ padding: "0 1rem 0.5rem" }}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => {
            const isSelected = selectedIds.includes(card.id);
            const isSubmitted = submittedIds.includes(card.id);
            const isDimmed =
              !isSelected && isMaxSelected && !isSubmitted;

            if (isSubmitted) return null; // card has flown away

            return (
              <motion.div
                key={card.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <ResponseCard
                  card={card}
                  layoutId={`hand-card-${card.id}`}
                  isSelected={isSelected}
                  isDimmed={isDimmed}
                  onClick={() => {
                    if (!disabled && !isSubmitted) {
                      onSelect(card.id);
                    }
                  }}
                  disabled={disabled || isSubmitted}
                  size="md"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty hand message */}
      {cards.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
          style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem" }}
        >
          Your hand is empty...
        </motion.p>
      )}
    </div>
  );
}
