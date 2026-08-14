"use client";
import { motion } from "framer-motion";
import { Crown, Wifi, WifiOff } from "lucide-react";

interface PlayerChipProps {
  name: string;
  avatarColor: string;
  score?: number;
  isJudge?: boolean;
  isHost?: boolean;
  isConnected?: boolean;
  isYou?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { avatar: 32, font: "0.75rem", gap: 8 },
  md: { avatar: 44, font: "0.875rem", gap: 10 },
  lg: { avatar: 56, font: "1rem", gap: 12 },
};

export function PlayerChip({
  name,
  avatarColor,
  score = 0,
  isJudge = false,
  isHost = false,
  isConnected = true,
  isYou = false,
  size = "md",
}: PlayerChipProps) {
  const s = sizes[size];

  return (
    <motion.div
      layout
      className="flex items-center rounded-2xl"
      style={{
        gap: s.gap,
        padding: "8px 12px",
        backgroundColor: isYou ? "var(--surface-2)" : "var(--surface)",
        border: isYou
          ? "1px solid var(--border-strong)"
          : "1px solid var(--border)",
        position: "relative",
      }}
    >
      {/* Avatar circle */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          className="flex items-center justify-center rounded-full font-bold"
          style={{
            width: s.avatar,
            height: s.avatar,
            backgroundColor: avatarColor,
            color: "#fff",
            fontSize: s.font,
            fontFamily: "Inter, sans-serif",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Judge crown */}
        {isJudge && (
          <motion.div
            layoutId="judge-crown"
            className="absolute -top-3 -right-2 text-base"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            👑
          </motion.div>
        )}

        {/* Connection indicator */}
        <div
          className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
          style={{
            width: 12,
            height: 12,
            backgroundColor: isConnected ? "#10AC84" : "#E63946",
            border: "2px solid var(--bg)",
          }}
        />
      </div>

      {/* Name + badges */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <span
            className="font-semibold truncate"
            style={{
              fontSize: s.font,
              color: "var(--text)",
              fontFamily: "Inter, sans-serif",
              maxWidth: 100,
            }}
          >
            {name}
          </span>
          {isYou && (
            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--text-muted)",
                fontFamily: "Inter, sans-serif",
                border: "1px solid var(--border-strong)",
                borderRadius: 4,
                padding: "0 4px",
                flexShrink: 0,
              }}
            >
              you
            </span>
          )}
          {isHost && (
            <span
              style={{
                fontSize: "0.6rem",
                color: "var(--accent-primary)",
                fontFamily: "Inter, sans-serif",
                border: "1px solid var(--accent-primary)",
                borderRadius: 4,
                padding: "0 4px",
                flexShrink: 0,
              }}
            >
              host
            </span>
          )}
        </div>

        {/* Score */}
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {score} {score === 1 ? "point" : "points"}
        </span>
      </div>
    </motion.div>
  );
}
