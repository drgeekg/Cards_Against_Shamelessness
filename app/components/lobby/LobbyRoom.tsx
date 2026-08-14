"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, UserMinus, Settings } from "lucide-react";
import { PlayerChip } from "./PlayerChip";
import { RoomCode } from "./RoomCode";
import { Button } from "@/components/ui/Button";
import { getPackMeta } from "@/lib/pack-loader";
import type { GameSession } from "@/types/game";

interface LobbyRoomProps {
  session: GameSession;
  playerId: string;
  onSessionUpdate: (s: GameSession) => void;
}

export function LobbyRoom({ session, playerId, onSessionUpdate }: LobbyRoomProps) {
  const [starting, setStarting] = useState(false);
  const [kicking, setKicking] = useState<string | null>(null);
  const [targetScore, setTargetScore] = useState(session.targetScore);

  const isHost = session.players.find((p) => p.id === playerId)?.isHost ?? false;
  const judgePlayer = session.players[session.judgeIndex];
  const connectedPlayers = session.players.filter((p) => p.connected);
  const canStart = connectedPlayers.length >= 3;

  const packs = getPackMeta().filter((p) => p.edition === session.edition || p.edition === "both");

  const handleStartGame = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: session.code, hostId: playerId }),
      });
      if (res.ok) {
        const { session: updated } = await res.json();
        onSessionUpdate(updated);
      }
    } finally {
      setStarting(false);
    }
  };

  const handleKick = async (targetId: string) => {
    setKicking(targetId);
    try {
      await fetch("/api/rooms/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: session.code, hostId: playerId, targetPlayerId: targetId }),
      });
    } finally {
      setKicking(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Room code */}
      <RoomCode
        code={session.code}
        roomUrl={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* Player list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "var(--text)",
            }}
          >
            Players ({connectedPlayers.length}/50)
          </h2>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {canStart ? "Ready to play!" : "Need at least 3 players"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {session.players.map((player) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="flex items-center gap-1"
              >
                <PlayerChip
                  name={player.name}
                  avatarColor={player.avatarColor}
                  score={player.score}
                  isJudge={player.id === judgePlayer?.id}
                  isHost={player.isHost}
                  isConnected={player.connected}
                  isYou={player.id === playerId}
                  size="md"
                />
                {isHost && player.id !== playerId && (
                  <motion.button
                    onClick={() => handleKick(player.id)}
                    aria-label={`Kick ${player.name}`}
                    className="flex items-center justify-center w-7 h-7 rounded-lg opacity-40 hover:opacity-100"
                    style={{
                      backgroundColor: "var(--danger)",
                      color: "#fff",
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={kicking === player.id}
                  >
                    <UserMinus size={12} />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Host settings */}
      {isHost && (
        <motion.div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-strong)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} style={{ color: "var(--text-muted)" }} />
            <h3
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 700,
                color: "var(--text)",
                fontSize: "1rem",
              }}
            >
              Game Settings
            </h3>
          </div>

          {/* Target score */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                TARGET SCORE
              </label>
              <span
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  fontSize: "1.1rem",
                }}
              >
                {targetScore} pts
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={15}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--accent-primary)" }}
            />
            <div
              className="flex justify-between text-xs"
              style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}
            >
              <span>3 pts (quick)</span>
              <span>15 pts (long)</span>
            </div>
          </div>

          {/* Available packs */}
          <div className="flex flex-col gap-2">
            <label
              style={{
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
              }}
            >
              CARD PACKS
            </label>
            <div className="flex flex-wrap gap-2">
              {packs.map((pack) => {
                const isActive = session.activePacks.includes(pack.id);
                return (
                  <motion.div
                    key={pack.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold cursor-not-allowed"
                    style={{
                      backgroundColor: isActive ? "var(--accent-primary)" : "var(--surface-2)",
                      color: isActive ? "var(--accent-on-primary)" : "var(--text-muted)",
                      fontFamily: "Inter, sans-serif",
                      border: "1px solid var(--border-strong)",
                    }}
                    title={pack.nsfw ? "18+ content" : ""}
                  >
                    {pack.emoji} {pack.name}
                    {pack.nsfw && " 🔞"}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Start button */}
      {isHost && (
        <Button
          size="lg"
          variant="primary"
          loading={starting}
          disabled={!canStart}
          onClick={handleStartGame}
          className="w-full"
        >
          {canStart ? "🎲 Start Game →" : `Need ${3 - connectedPlayers.length} more player${3 - connectedPlayers.length !== 1 ? "s" : ""}`}
        </Button>
      )}

      {!isHost && (
        <motion.p
          className="text-center"
          style={{
            color: "var(--text-muted)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.9rem",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Waiting for the host to start the game...
        </motion.p>
      )}
    </div>
  );
}
