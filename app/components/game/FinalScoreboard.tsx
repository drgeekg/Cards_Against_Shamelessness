"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trophy, Star } from "lucide-react";
import { ScoreTick } from "@/components/animations/ScoreTick";
import { Button } from "@/components/ui/Button";
import type { GameSession } from "@/types/game";

interface FinalScoreboardProps {
  session: GameSession;
  playerId: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function FinalScoreboard({ session, playerId }: FinalScoreboardProps) {
  const router = useRouter();
  const sorted = [...session.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const isWinner = winner?.id === playerId;

  return (
    <div
      className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center px-4 py-10 gap-8"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Celebration header */}
      <motion.div
        className="text-center flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: -40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
      >
        <motion.span
          style={{ fontSize: "4rem" }}
          animate={{
            rotate: [0, -15, 15, -8, 8, 0],
            scale: [1, 1.1, 1, 1.05, 1],
          }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
        >
          🏆
        </motion.span>
        <h1
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "2.25rem",
            color: "var(--text)",
            lineHeight: 1.1,
          }}
        >
          {isWinner ? "You Won! 🎉" : `${winner?.name} Wins!`}
        </h1>
        {isWinner && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              color: "var(--accent-primary)",
              fontFamily: "Inter, sans-serif",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            You are a beautiful, horrible person. 🖤
          </motion.p>
        )}
      </motion.div>

      {/* Final scoreboard */}
      <motion.div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--card-shadow)",
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 240, damping: 22 }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Trophy size={18} style={{ color: "var(--accent-primary)" }} />
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Final Standings
          </h2>
        </div>

        {/* Players */}
        <div className="flex flex-col">
          {sorted.map((player, i) => (
            <motion.div
              key={player.id}
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none",
                backgroundColor:
                  player.id === playerId ? "var(--surface-2)" : "transparent",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: "1.3rem", width: 28, textAlign: "center" }}>
                  {MEDALS[i] ?? `${i + 1}.`}
                </span>
                <div
                  className="rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: player.avatarColor,
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {player.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        color: "var(--text)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {player.name}
                    </span>
                    {player.id === playerId && (
                      <span
                        style={{
                          fontSize: "0.6rem",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border-strong)",
                          borderRadius: 4,
                          padding: "0 4px",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        you
                      </span>
                    )}
                  </div>
                  {i === 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={10} style={{ color: "var(--accent-primary)" }} />
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--accent-primary)",
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        Winner
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-0.5">
                <ScoreTick
                  value={player.score}
                  className="text-xl"
                />
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  /{session.targetScore}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button size="lg" variant="primary" onClick={() => router.push("/")}>
          🏠 New Game
        </Button>
        <Button size="lg" variant="secondary" onClick={() => window.location.reload()}>
          Play Again (Same Players)
        </Button>
      </motion.div>
    </div>
  );
}
