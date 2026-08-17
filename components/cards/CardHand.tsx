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
  return (
    <div className="w-full flex flex-col items-center">
      {/* 2-col on mobile, flex-wrap on tablet/desktop */}
      <div
        className="grid grid-cols-2 sm:flex sm:flex-wrap justify-items-center justify-center gap-2.5 sm:gap-3.5 w-full max-w-4xl px-2 sm:px-4"
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => {
            const isSelected = selectedIds.includes(card.id);
            const isSubmitted = submittedIds.includes(card.id);

            if (isSubmitted) return null;

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
                  isDimmed={false}
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
          className="text-center py-6"
          style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif", fontSize: "0.9rem" }}
        >
          Your hand is empty...
        </motion.p>
      )}
    </div>
  );
}
