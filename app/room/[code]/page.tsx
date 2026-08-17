"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Users, AlertCircle, Sparkles } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { LobbyRoom } from "@/components/lobby/LobbyRoom";
import { GameBoard } from "@/components/game/GameBoard";
import { VotingView } from "@/components/game/VotingView";
import { TiebreakerView } from "@/components/game/TiebreakerView";
import { WinnerReveal } from "@/components/game/WinnerReveal";
import { FinalScoreboard } from "@/components/game/FinalScoreboard";
import { ExitWarningModal } from "@/components/ui/ExitWarningModal";
import { useGameStore } from "@/stores/gameStore";
import { usePlayerStore, getRandomColor } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code as string;
  const code = rawCode ? rawCode.toUpperCase() : "";

  const { session, setSession, setConnected } = useGameStore();
  const { playerId, name, avatarColor, setPlayer, setExitedRoom } = usePlayerStore();
  const { addToast } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const consecutiveFailures = useRef(0);
  const prevPlayersRef = useRef<Array<{ id: string; name: string; connected: boolean }>>([]);

  // Direct join form state
  const [joinName, setJoinName] = useState(name || "");
  const [selectedColor, setSelectedColor] = useState(avatarColor || getRandomColor());
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Sync stored name/color when rehydrated
  useEffect(() => {
    if (name && !joinName) {
      setJoinName(name);
    }
    if (avatarColor) {
      setSelectedColor(avatarColor);
    }
  }, [name, avatarColor, joinName]);

  // Load initial session with retry resilience for serverless/transient misses
  const fetchSession = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        consecutiveFailures.current += 1;
        setConnected(false);

        if (consecutiveFailures.current >= 4) {
          setError("Room not found. The game may have ended or the code is invalid.");
        }
        return;
      }

      const { session: data } = await res.json();
      consecutiveFailures.current = 0;
      setSession(data);
      setConnected(true);
      setError("");

      // Notify when players leave or join the room
      if (
        prevPlayersRef.current.length > 0 &&
        playerId &&
        data.players.some((p: { id: string }) => p.id === playerId)
      ) {
        // Departed/disconnected players (excluding self)
        const departed = prevPlayersRef.current.filter((prev) => {
          if (prev.id === playerId) return false;
          const curr = data.players.find((p: { id: string }) => p.id === prev.id);
          return prev.connected && (!curr || !curr.connected);
        });

        departed.forEach((p) => {
          addToast({
            type: "warning",
            message: `👋 ${p.name} left the room`,
          });
        });

        // Newly joined/reconnected players (excluding self)
        const joined = data.players.filter((curr: { id: string; name: string; connected: boolean }) => {
          if (curr.id === playerId) return false;
          const prev = prevPlayersRef.current.find((p) => p.id === curr.id);
          return curr.connected && (!prev || !prev.connected);
        });

        joined.forEach((p: { id: string; name: string }) => {
          addToast({
            type: "info",
            message: `🎉 ${p.name} joined the room!`,
          });
        });
      }

      prevPlayersRef.current = data.players.map((p: { id: string; name: string; connected: boolean }) => ({
        id: p.id,
        name: p.name,
        connected: p.connected,
      }));

      // If local player is marked disconnected on the server, auto-reconnect
      if (
        playerId &&
        data.players.some(
          (p: { id: string; connected: boolean }) => p.id === playerId && !p.connected
        )
      ) {
        await fetch("/api/rooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, playerId, name, avatarColor }),
        });
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

  // Tab unload warning before active exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session && session.phase !== "lobby" && session.phase !== "gameOver") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session]);

  // Poll room session
  useEffect(() => {
    if (!code) return;
    fetchSession();
    const interval = setInterval(fetchSession, 2500);
    return () => clearInterval(interval);
  }, [code, fetchSession]);

  const handleConfirmExit = async () => {
    setLeaving(true);
    try {
      if (code && playerId) {
        await fetch("/api/rooms/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, playerId }),
        });
        setExitedRoom(code);
      }
      addToast({ type: "info", message: `Left room ${code}. You can rejoin anytime!` });
      router.push("/");
    } catch {
      router.push("/");
    } finally {
      setLeaving(false);
      setShowExitModal(false);
    }
  };

  const handleDirectJoin = async (customName?: string, customReconnectId?: string) => {
    const playerNameToUse = (customName || joinName).trim();
    if (!playerNameToUse) {
      setJoinError("Please enter your name to join");
      return;
    }

    setJoining(true);
    setJoinError("");

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name: playerNameToUse,
          avatarColor: selectedColor,
          playerId: customReconnectId || (playerId && session?.players.some(p => p.id === playerId) ? playerId : undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not join room");
      }

      setPlayer({
        playerId: data.playerId,
        name: playerNameToUse,
        avatarColor: selectedColor,
        isHost: data.session?.players.find((p: { id: string }) => p.id === data.playerId)?.isHost ?? false,
      });

      if (data.session) {
        setSession(data.session);
      } else {
        await fetchSession();
      }

      setExitedRoom(null);
      addToast({ type: "success", message: `Joined room ${code}!` });
    } catch (e: any) {
      setJoinError(e.message || "Failed to join room. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // Loading screen
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

  // Error screen (e.g. invalid code or deleted room)
  if (error || !session) {
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
          {error || "Room not found."}
        </p>
        <Button
          variant="primary"
          onClick={() => router.push("/")}
        >
          <ArrowLeft size={16} /> Go Home
        </Button>
      </div>
    );
  }

  const isPlayerInRoom = Boolean(playerId && session.players.some((p) => p.id === playerId));
  const phase = session.phase;
  const isJudge = session.players[session.judgeIndex]?.id === playerId;
  const editionLocked = phase === "submitting" || phase === "judging" || phase === "voting" || phase === "tiebreaker" || phase === "reveal";

  // Check for disconnected player that could be reconnected
  const disconnectedPlayer = session.players.find(
    (p) => !p.connected && p.name.toLowerCase() === (joinName || name).trim().toLowerCase()
  );

  // If the user has not joined this room yet, show the join prompt instead of redirecting
  if (!isPlayerInRoom) {
    const connectedPlayers = session.players.filter((p) => p.connected);
    const isRoomFull = connectedPlayers.length >= 10;
    const isLobby = phase === "lobby";

    return (
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
        <Header editionLocked={false} showEditionToggle />

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col gap-6"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-strong)",
              boxShadow: "var(--card-shadow)",
            }}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            {/* Header / Room Badge */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "2rem" }}>🃏</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--accent-primary)",
                  }}
                >
                  Room: {code}
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.75rem",
                  color: "var(--text)",
                  lineHeight: 1.2,
                  marginTop: "0.25rem",
                }}
              >
                Join the Game
              </h1>

              <div
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}
              >
                <Users size={14} />
                <span>{connectedPlayers.length}/10 players in room</span>
              </div>
            </div>

            {/* Room full state */}
            {isRoomFull && (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div
                  className="p-3 rounded-2xl flex items-center gap-2 text-sm font-semibold"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "var(--danger)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <AlertCircle size={18} />
                  <span>This room is currently full (10 players maximum).</span>
                </div>
                <Button variant="secondary" onClick={() => router.push("/")} className="w-full">
                  <ArrowLeft size={16} /> Back to Home
                </Button>
              </div>
            )}

            {/* In-progress game state */}
            {!isLobby && !isRoomFull && (
              <div className="flex flex-col gap-4 py-2">
                {disconnectedPlayer ? (
                  <div className="flex flex-col gap-3">
                    <div
                      className="p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      <Sparkles size={16} className="text-amber-500 flex-shrink-0" />
                      <span>
                        Player <strong>{disconnectedPlayer.name}</strong> is currently disconnected. Reconnect as this player?
                      </span>
                    </div>

                    <Button
                      size="lg"
                      variant="primary"
                      loading={joining}
                      onClick={() => handleDirectJoin(disconnectedPlayer.name, disconnectedPlayer.id)}
                      className="w-full"
                    >
                      Rejoin as {disconnectedPlayer.name} →
                    </Button>
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-2xl flex flex-col items-center gap-2 text-center text-sm"
                    style={{
                      backgroundColor: "rgba(234, 179, 8, 0.1)",
                      color: "var(--text)",
                      border: "1px solid rgba(234, 179, 8, 0.3)",
                    }}
                  >
                    <p className="font-bold text-amber-500">Game Already in Progress</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      This room is actively playing a round ({phase}). You can join when they return to the lobby or start your own game.
                    </p>
                  </div>
                )}

                <Button variant="secondary" onClick={() => router.push("/")} className="w-full">
                  <ArrowLeft size={16} /> Back to Home
                </Button>
              </div>
            )}

            {/* Normal join form (Lobby phase) */}
            {isLobby && !isRoomFull && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDirectJoin();
                }}
                className="flex flex-col gap-5"
              >
                {/* Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="direct-player-name"
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    YOUR NAME
                  </label>
                  <input
                    id="direct-player-name"
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value.slice(0, 20))}
                    placeholder="Enter your name..."
                    maxLength={20}
                    autoFocus={!joinName}
                    className="rounded-xl px-4 py-3 text-sm w-full focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text)",
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                </div>

                {/* Color Picker */}
                <div className="flex flex-col gap-2">
                  <label
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    AVATAR COLOR
                  </label>
                  <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />
                </div>

                {/* Error */}
                {joinError && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ color: "var(--danger)", fontSize: "0.85rem", fontFamily: "Inter, sans-serif" }}
                  >
                    {joinError}
                  </motion.p>
                )}

                {/* Join Button */}
                <Button
                  size="lg"
                  variant="primary"
                  type="submit"
                  loading={joining}
                  className="w-full"
                >
                  {joining ? "Joining..." : "Join Game →"}
                </Button>

                {/* Back to home */}
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontFamily: "Inter, sans-serif",
                    textAlign: "center",
                  }}
                  className="hover:opacity-70 transition-opacity"
                >
                  ← Back to Home
                </button>
              </form>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  // User is registered in this room — render active game session
  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Header
        editionLocked={editionLocked}
        showEditionToggle
        onExit={() => setShowExitModal(true)}
      />

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
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              <VotingView session={session} playerId={playerId!} isJudge={isJudge} onSessionUpdate={setSession} />
            </motion.div>
          )}

          {phase === "tiebreaker" && (
            <motion.div
              key="tiebreaker"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <TiebreakerView session={session} playerId={playerId!} onSessionUpdate={setSession} />
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

      {/* Exit confirmation modal */}
      <ExitWarningModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={handleConfirmExit}
        loading={leaving}
      />
    </div>
  );
}
