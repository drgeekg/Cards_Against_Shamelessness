"use client";
import { motion } from "framer-motion";
import type { PromptCard as PromptCardType } from "@/types/game";

interface PromptCardProps {
  card: PromptCardType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function formatText(text: string) {
  const parts = text.split("___");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span
          style={{
            borderBottom: "2px solid currentColor",
            display: "inline-block",
            minWidth: "4rem",
            margin: "0 2px",
          }}
        />
      )}
    </span>
  ));
}

const sizes = {
  sm: { className: "w-full max-w-[200px] min-h-[140px] text-xs p-3", fontSize: "0.8rem", padding: "0.75rem" },
  md: { className: "w-full max-w-[340px] min-h-[180px] sm:min-h-[200px] text-sm sm:text-base p-4", fontSize: "0.95rem", padding: "1rem" },
  lg: { className: "w-full max-w-[400px] min-h-[220px] text-base sm:text-lg p-5", fontSize: "1.1rem", padding: "1.25rem" },
};

export function PromptCard({ card, size = "md", className = "" }: PromptCardProps) {
  const s = sizes[size];

  return (
    <motion.div
      className={`card-base card-prompt ${s.className} ${className}`}
      style={{
        fontSize: s.fontSize,
        padding: s.padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.75rem",
      }}
      initial={{ opacity: 0, y: -20, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      {/* Top label */}
      <div style={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.6, letterSpacing: "0.08em" }}>
        {card.edition === "decency" ? "CARDS VS DECENCY" : "CARDS VS SANSKAAR"}
      </div>

      {/* Card text */}
      <p style={{ flex: 1, lineHeight: 1.5, fontWeight: 700 }}>
        {formatText(card.text)}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            opacity: 0.6,
            letterSpacing: "0.05em",
          }}
        >
          {card.pick === 2 ? "PICK 2" : "PICK 1"}
        </span>
        <span style={{ fontSize: "0.9rem" }}>
          {card.edition === "decency" ? "🖤" : "🔴"}
        </span>
      </div>
    </motion.div>
  );
}
