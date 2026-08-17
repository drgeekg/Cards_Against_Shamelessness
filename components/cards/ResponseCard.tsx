"use client";
import { motion } from "framer-motion";
import type { ResponseCard as ResponseCardType } from "@/types/game";

interface ResponseCardProps {
  card: ResponseCardType;
  layoutId?: string;
  isSelected?: boolean;
  isDimmed?: boolean;
  isWinner?: boolean;
  isFaceDown?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

const sizes = {
  sm: { className: "w-[120px] min-h-[150px] text-xs p-3", fontSize: "0.75rem", padding: "0.75rem", minHeight: 150 },
  md: { className: "w-full max-w-[175px] min-w-[135px] min-h-[180px] sm:min-h-[210px] text-sm p-3.5 sm:p-4", fontSize: "0.88rem", padding: "1rem", minHeight: 180 },
  lg: { className: "w-full max-w-[220px] min-h-[240px] text-base p-4", fontSize: "1rem", padding: "1.25rem", minHeight: 240 },
};

export function ResponseCard({
  card,
  layoutId,
  isSelected = false,
  isDimmed = false,
  isWinner = false,
  isFaceDown = false,
  onClick,
  size = "md",
  className = "",
  disabled = false,
}: ResponseCardProps) {
  const s = sizes[size];

  return (
    <motion.div
      layoutId={layoutId}
      className={`card-base card-flip-container touch-target ${s.className} ${className}`}
      style={{ cursor: onClick && !disabled ? "pointer" : "default" }}
      onClick={() => !disabled && onClick?.()}
      animate={{
        scale: isWinner ? 1.08 : isSelected ? 1.03 : 1,
        opacity: isDimmed ? 0.35 : 1,
        rotateY: isFaceDown ? 180 : 0,
        boxShadow: isWinner
          ? "var(--card-glow), var(--card-shadow-hover)"
          : isSelected
          ? "0 0 0 2.5px var(--accent-primary), var(--card-shadow-hover)"
          : "var(--card-shadow)",
      }}
      whileHover={onClick && !disabled && !isSelected && !isDimmed
        ? { scale: 1.04, y: -4, boxShadow: "var(--card-shadow-hover)" }
        : {}}
      whileTap={onClick && !disabled ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {/* Front face */}
      <div
        className="card-face card-response"
        style={{
          padding: s.padding,
          fontSize: s.fontSize,
          backgroundColor: "var(--card-response-bg)",
          color: "var(--card-response-text)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: s.minHeight,
          borderRadius: 16,
          position: "relative",
        }}
      >
        <p style={{ flex: 1, lineHeight: 1.45, fontWeight: 600, fontFamily: "'Baloo 2', sans-serif" }}>
          {card.text}
        </p>

        <div style={{ fontSize: "0.6rem", fontWeight: 700, opacity: 0.4, letterSpacing: "0.08em", marginTop: "0.5rem" }}>
          {card.edition === "decency" ? "CARDS VS DECENCY" : "CARDS VS SANSKAAR"}
        </div>

        {isWinner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-3 -right-3 text-xl"
          >
            ⭐
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* Card back face (for face-down display) */
export function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = sizes[size];

  return (
    <div
      className={`card-base ${s.className}`}
      style={{
        minHeight: s.minHeight,
        backgroundColor: "var(--accent-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
      }}
    >
      <span style={{ fontSize: "2rem", opacity: 0.2 }}>🃏</span>
    </div>
  );
}

