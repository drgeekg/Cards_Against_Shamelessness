"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { LobbyRoom } from "@/components/lobby/LobbyRoom";
import { GameBoard } from "@/components/game/GameBoard";
import { JudgeView } from "@/components/game/JudgeView";
import { WinnerReveal } from "@/components/game/WinnerReveal";
import { FinalScoreboard } from "@/components/game/FinalScoreboard";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";
import type { GameSession } from "@/types/game";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const { session, setSession, isConnected, setConnected } = useGameStore();
  const { playerId, name, avatarColor } = usePlayerStore();
  const { addToast } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const consecutiveFailures = useRef(0);

  // Load initial session with retry resilience for serverless/transient misses
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        consecutiveFailures.current += 1;
        setConnected(false);

        // Require 4 consecutive failures before declaring the room as lost
        if (consecutiveFailures.current >= 4) {
          setError("Room not found. The game may have ended.");
        }
        return;
      }

      const { session: data } = await res.json();
      consecutiveFailures.current = 0;
      setSession(data);
      setConnected(true);
      if (playerId && data.players.some((p: { id: string; connected: boolean }) => p.id === playerId && !p.connected)) {
        await fetch("/api/rooms/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, playerId, name, avatarColor }) });
      }
    } catch {
      consecutiveFailures.current += 1;
      setConnected(false);
      if (consecutiveFailures.current >= 4) {
        setError("Room not found. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [code, playerId, name, avatarColor, setSession, setConnected]);

  useEffect(() => {
    if (!code) return;
    if (!playerId || !name) {
      router.push("/");
      return;
    }
    fetchSession();
    // Poll every 2.5s for real-time updates (prevents hitting Redis rate limits)
    const interval = setInterval(fetchSession, 2500);
    return () => clearInterval(interval);
  }, [code, playerId, name, router, fetchSession]);

  if (loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ fontSize: "2.5rem" }}
        >
          🃏
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4 p-4"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <span style={{ fontSize: "3rem" }}>😕</span>
        <p
          style={{
            color: "var(--text)",
            fontFamily: "'Baloo 2', sans-serif",
            fontSize: "1.25rem",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {error}
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            color: "var(--accent-primary)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.9rem",
            textDecoration: "underline",
          }}
        >
          Go home
        </button>
      </div>
    );
  }

  if (!session) return null;

  const phase = session.phase;
  const isJudge = session.players[session.judgeIndex]?.id === playerId;
  const editionLocked = phase === "submitting" || phase === "judging" || phase === "reveal";

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Header editionLocked={editionLocked} showEditionToggle />

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {phase === "lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              <LobbyRoom session={session} playerId={playerId!} onSessionUpdate={setSession} />
            </motion.div>
          )}

          {phase === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              <GameBoard session={session} playerId={playerId!} isJudge={isJudge} onSessionUpdate={setSession} />
            </motion.div>
          )}

          {(phase === "judging" || phase === "voting") && (
            <motion.div
              key="judging"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              <JudgeView session={session} playerId={playerId!} isJudge={isJudge} onSessionUpdate={setSession} />
            </motion.div>
          )}

          {phase === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <WinnerReveal session={session} playerId={playerId!} isHost={session.players.find(p => p.id === playerId)?.isHost ?? false} onNextRound={() => fetchSession()} />
            </motion.div>
          )}

          {phase === "gameOver" && (
            <motion.div
              key="gameOver"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex-1"
            >
              <FinalScoreboard session={session} playerId={playerId!} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
