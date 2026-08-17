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
  const [targetScore, setTargetScore] = useState(session.targetScore ?? 7);
  const [handSize, setHandSize] = useState(session.handSize ?? 7);
  const [totalRounds, setTotalRounds] = useState(session.totalRounds ?? 10);
  const [minRefillThreshold, setMinRefillThreshold] = useState(session.minCardsRefillThreshold ?? 2);
  const [refillCount, setRefillCount] = useState(session.refillCardCount ?? 3);
  const [allowRefresh, setAllowRefresh] = useState(session.allowCardRefresh ?? true);
  const [maxShuffles, setMaxShuffles] = useState(session.maxShufflesPerRound ?? 1);

  const isHost = session.players.find((p) => p.id === playerId)?.isHost ?? false;
  const connectedPlayers = session.players.filter((p) => p.connected);
  const canStart = connectedPlayers.length >= 3;

  const packs = getPackMeta().filter((p) => p.edition === session.edition || p.edition === "both");

  const syncSettings = async (newSettings: Partial<GameSession>) => {
    try {
      const res = await fetch("/api/rooms/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: session.code,
          hostId: playerId,
          settings: newSettings,
        }),
      });
      if (res.ok) {
        const { session: updated } = await res.json();
        onSessionUpdate(updated);
      }
    } catch (e) {
      console.error("Failed to sync settings", e);
    }
  };

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
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 pb-safe">
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
            Players ({connectedPlayers.length}/10)
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
                  isHost={player.isHost}
                  isConnected={player.connected}
                  isYou={player.id === playerId}
                  size="md"
                />
                {isHost && player.id !== playerId && (
                  <motion.button
                    onClick={() => handleKick(player.id)}
                    aria-label={`Kick ${player.name}`}
                    className="flex items-center justify-center w-7 h-7 rounded-lg opacity-40 hover:opacity-100 touch-target"
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
          className="rounded-2xl p-4 sm:p-5 flex flex-col gap-5"
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
              Game Configuration
            </h3>
          </div>

          {/* Target score slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                TARGET SCORE TO WIN
              </label>
              <span
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  fontSize: "1.05rem",
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
              onChange={(e) => {
                const val = Number(e.target.value);
                setTargetScore(val);
                syncSettings({ targetScore: val });
              }}
              className="w-full h-2 rounded-lg cursor-pointer"
              style={{ accentColor: "var(--accent-primary)" }}
            />
            <div className="flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span>3 pts (fast)</span>
              <span>15 pts (epic)</span>
            </div>
          </div>

          {/* Starting hand size slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                STARTING HAND SIZE
              </label>
              <span
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  fontSize: "1.05rem",
                }}
              >
                {handSize} cards
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              value={handSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setHandSize(val);
                syncSettings({ handSize: val });
              }}
              className="w-full h-2 rounded-lg cursor-pointer"
              style={{ accentColor: "var(--accent-primary)" }}
            />
            <div className="flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span>3 cards</span>
              <span>10 cards</span>
            </div>
          </div>

          {/* Total rounds slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                MAX ROUNDS LIMIT
              </label>
              <span
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  fontSize: "1.05rem",
                }}
              >
                {totalRounds} rounds
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={25}
              value={totalRounds}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalRounds(val);
                syncSettings({ totalRounds: val });
              }}
              className="w-full h-2 rounded-lg cursor-pointer"
              style={{ accentColor: "var(--accent-primary)" }}
            />
            <div className="flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span>3 rounds</span>
              <span>25 rounds</span>
            </div>
          </div>

          {/* Refill rule threshold */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                REFILL CARDS WHEN BELOW
              </label>
              <span
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  fontSize: "1.05rem",
                }}
              >
                {minRefillThreshold} cards (+{refillCount} cards)
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={minRefillThreshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinRefillThreshold(val);
                syncSettings({ minCardsRefillThreshold: val });
              }}
              className="w-full h-2 rounded-lg cursor-pointer"
              style={{ accentColor: "var(--accent-primary)" }}
            />
            <div className="flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span>When &lt; 1 card</span>
              <span>When &lt; 4 cards</span>
            </div>
          </div>

          {/* Card Refresh / Shuffle Settings */}
          <div
            className="flex flex-col gap-3 p-3.5 rounded-xl"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <label
                  style={{
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  ALLOW CARD REFRESH (SHUFFLE)
                </label>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Players can discard hand and redraw new cards
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => {
                  const val = !allowRefresh;
                  setAllowRefresh(val);
                  syncSettings({ allowCardRefresh: val });
                }}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors touch-target"
                style={{
                  backgroundColor: allowRefresh ? "var(--accent-primary)" : "var(--border-strong)",
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allowRefresh ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {allowRefresh && (
              <div className="flex flex-col gap-1.5 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <label
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    MAX REFRESHES PER ROUND
                  </label>
                  <span
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 700,
                      color: "var(--accent-primary)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {maxShuffles} time{maxShuffles > 1 ? "s" : ""}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={maxShuffles}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxShuffles(val);
                    syncSettings({ maxShufflesPerRound: val });
                  }}
                  className="w-full h-2 rounded-lg cursor-pointer"
                  style={{ accentColor: "var(--accent-primary)" }}
                />
                <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span>1 per round</span>
                  <span>5 per round</span>
                </div>
              </div>
            )}
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
              ACTIVE CARD PACKS
            </label>
            <div className="flex flex-wrap gap-2">
              {packs.map((pack) => {
                const isActive = session.activePacks.includes(pack.id);
                return (
                  <motion.div
                    key={pack.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold cursor-default"
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
