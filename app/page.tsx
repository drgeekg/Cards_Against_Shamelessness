"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Users, Zap, Globe, Loader2 } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";
import { usePlayerStore, AVATAR_COLORS, getRandomColor } from "@/stores/playerStore";

// ── Floating card background ──────────────────────────────────────────────────
const FLOAT_CARDS = [
  { text: "My therapist says the root of my anxiety is ___.", x: "8%", y: "15%", rot: -12, delay: 0 },
  { text: "a group chat that won't stop buzzing.", x: "78%", y: "8%", rot: 8, delay: 0.4 },
  { text: "Papa ne rishta reject kar diya kyunki ladka ___ nikla.", x: "4%", y: "65%", rot: 6, delay: 0.8 },
  { text: "engineering degree se zyada Instagram followers rakhta hai.", x: "80%", y: "70%", rot: -7, delay: 1.2 },
  { text: "The real reason I quit my job was ___.", x: "60%", y: "30%", rot: 12, delay: 0.6 },
  { text: "My sleep schedule, my bank balance, and ___.", x: "20%", y: "82%", rot: -5, delay: 1.0 },
];

function FloatingCard({ text, x, y, rot, delay }: { text: string; x: string; y: string; rot: number; delay: number }) {
  return (
    <motion.div
      className="absolute hidden lg:block"
      style={{ left: x, top: y, width: 160, pointerEvents: "none" }}
      initial={{ opacity: 0, y: 30, rotate: rot }}
      animate={{
        opacity: [0, 0.15, 0.15, 0],
        y: [30, 0, -12, -20],
        rotate: rot,
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        repeatDelay: 4,
        ease: "easeInOut",
      }}
    >
      <div
        className="rounded-2xl p-3 text-xs font-semibold leading-snug"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-strong)",
          color: "var(--text)",
          fontFamily: "'Baloo 2', sans-serif",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

// ── Color picker ──────────────────────────────────────────────────────────────
function ColorPicker({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {AVATAR_COLORS.map((color) => (
        <motion.button
          key={color}
          onClick={() => onSelect(color)}
          aria-label={`Select color ${color}`}
          className="rounded-full focus:outline-none"
          style={{
            width: 28,
            height: 28,
            backgroundColor: color,
            border: selected === color ? "3px solid var(--text)" : "3px solid transparent",
            boxShadow: selected === color ? "0 0 0 2px var(--bg), 0 0 0 4px var(--text)" : "none",
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        />
      ))}
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { edition } = useUIStore();
  const { name, avatarColor, exitedRoomCode, setPlayer, setExitedRoom } = usePlayerStore();

  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [inputName, setInputName] = useState(name || "");
  const [joinCode, setJoinCode] = useState("");
  const [selectedColor, setSelectedColor] = useState(avatarColor || getRandomColor());
  const [loading, setLoading] = useState(false);
  const [rejoining, setRejoining] = useState(false);
  const [error, setError] = useState("");

  const isIndian = edition === "sanskaar";
  const gameTitle = isIndian ? "Cards Against Shamelessness (Sanskaar)" : "Cards Against Shamelessness";
  const tagline = isIndian
    ? "The desi party game with zero chill and maximum cringe"
    : "The party game for horrible people with excellent taste";

  const handleRejoin = async () => {
    if (!exitedRoomCode) return;
    setRejoining(true);
    setError("");
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: exitedRoomCode,
          name: inputName.trim() || name || "Player",
          avatarColor: selectedColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Room no longer available");
      }
      setPlayer({
        playerId: data.playerId,
        name: inputName.trim() || name || "Player",
        avatarColor: selectedColor,
        isHost: false,
      });
      const targetCode = exitedRoomCode;
      setExitedRoom(null);
      router.push(`/room/${targetCode}`);
    } catch (e: any) {
      setError(e.message || "Could not rejoin room.");
      setExitedRoom(null);
    } finally {
      setRejoining(false);
    }
  };

  const handleCreate = async () => {
    if (!inputName.trim()) { setError("Please enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edition, hostName: inputName.trim(), avatarColor: selectedColor }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      const { code, playerId } = await res.json();
      setPlayer({ playerId, name: inputName.trim(), avatarColor: selectedColor, isHost: true });
      setExitedRoom(null);
      router.push(`/room/${code}`);
    } catch {
      setError("Could not create room. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inputName.trim()) { setError("Please enter your name"); return; }
    if (joinCode.trim().length !== 4) { setError("Room codes are 4 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: joinCode.trim().toUpperCase(),
          name: inputName.trim(),
          avatarColor: selectedColor,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not join room");
      }
      const { playerId } = await res.json();
      setPlayer({ playerId, name: inputName.trim(), avatarColor: selectedColor, isHost: false });
      setExitedRoom(null);
      router.push(`/room/${joinCode.trim().toUpperCase()}`);
    } catch (e: any) {
      setError(e.message || "Could not join room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <Header editionLocked={false} showEditionToggle />

      {/* Floating background cards */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {FLOAT_CARDS.map((card, i) => (
          <FloatingCard key={i} {...card} />
        ))}
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-12 gap-10">
        {/* Hero */}
        <motion.div
          className="text-center max-w-xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
        >
          <motion.div
            style={{ fontSize: "4rem", lineHeight: 1 }}
            animate={{ rotate: [0, -4, 4, -2, 2, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            🃏
          </motion.div>

          <motion.h1
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              color: "var(--text)",
              lineHeight: 1.1,
              marginTop: "0.5rem",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {gameTitle}
          </motion.h1>

          <motion.p
            style={{
              color: "var(--text-muted)",
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              marginTop: "0.75rem",
              lineHeight: 1.5,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {tagline}
          </motion.p>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap gap-2 justify-center mt-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            {[
              { icon: Users, label: "3–10 players" },
              { icon: Zap, label: "Real-time" },
              { icon: Globe, label: "No account needed" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-muted)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <Icon size={12} />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* CTA panel */}
        <AnimatePresence mode="wait">
          {mode === "idle" && (
            <motion.div
              key="idle"
              className="flex flex-col items-center gap-4 w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.5 }}
            >
              {/* Rejoin Prompt Banner */}
              {exitedRoomCode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full rounded-2xl p-4 flex items-center justify-between shadow-lg"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1.5px solid var(--accent-primary)",
                  }}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--accent-primary)]">
                      Active Game Session
                    </span>
                    <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                      Rejoin Room {exitedRoomCode}?
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={rejoining}
                      onClick={handleRejoin}
                      className="font-bold text-xs px-3 py-1.5"
                    >
                      Rejoin →
                    </Button>
                    <button
                      onClick={() => setExitedRoom(null)}
                      className="p-1 rounded-full text-xs opacity-60 hover:opacity-100"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Dismiss rejoin"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => setMode("create")}
                  className="w-full sm:w-auto"
                >
                  Create Room <ArrowRight size={18} />
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setMode("join")}
                  className="w-full sm:w-auto"
                >
                  Join Room
                </Button>
              </div>
            </motion.div>
          )}

          {(mode === "create" || mode === "join") && (
            <motion.div
              key="form"
              className="w-full max-w-md rounded-3xl p-6 flex flex-col gap-5"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--card-shadow)",
              }}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="flex items-center justify-between">
                <h2
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "var(--text)",
                  }}
                >
                  {mode === "create" ? "🎲 Create a Room" : "🚀 Join a Room"}
                </h2>
                <button
                  onClick={() => { setMode("idle"); setError(""); }}
                  style={{ color: "var(--text-muted)", fontSize: "1.25rem", lineHeight: 1 }}
                  className="hover:opacity-60"
                >
                  ×
                </button>
              </div>

              {/* Name input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="player-name"
                  style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                >
                  YOUR NAME
                </label>
                <input
                  id="player-name"
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value.slice(0, 20))}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="rounded-xl px-4 py-3 text-sm w-full focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border-strong)",
                    color: "var(--text)",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") mode === "create" ? handleCreate() : handleJoin();
                  }}
                />
              </div>

              {/* Color picker */}
              <div className="flex flex-col gap-2">
                <label
                  style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                >
                  AVATAR COLOR
                </label>
                <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />
              </div>

              {/* Join code (join mode only) */}
              {mode === "join" && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="room-code"
                    style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                  >
                    ROOM CODE
                  </label>
                  <input
                    id="room-code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="e.g. F9K2"
                    maxLength={4}
                    className="rounded-xl px-4 py-3 w-full focus:outline-none text-center text-2xl tracking-widest font-bold uppercase"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--accent-primary)",
                      fontFamily: "'Baloo 2', sans-serif",
                      letterSpacing: "0.3em",
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ color: "var(--danger)", fontSize: "0.85rem", fontFamily: "Inter, sans-serif" }}
                >
                  {error}
                </motion.p>
              )}

              {/* Action button */}
              <Button
                size="lg"
                variant="primary"
                loading={loading}
                onClick={mode === "create" ? handleCreate : handleJoin}
                className="w-full"
              >
                {loading
                  ? mode === "create" ? "Creating..." : "Joining..."
                  : mode === "create" ? "Create Room →" : "Join Room →"}
              </Button>

              {/* Switch mode */}
              <button
                onClick={() => { setMode(mode === "create" ? "join" : "create"); setError(""); }}
                style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "Inter, sans-serif", textAlign: "center" }}
                className="hover:opacity-70"
              >
                {mode === "create" ? "Have a room code? Join instead →" : "No code? Create a room →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom note */}
        <motion.p
          className="text-center text-xs"
          style={{ color: "var(--text-subtle)", fontFamily: "Inter, sans-serif", maxWidth: 320 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          No account needed. Just share the room code with your friends and play.
        </motion.p>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-4 text-xs"
        style={{ color: "var(--text-subtle)", fontFamily: "Inter, sans-serif", borderTop: "1px solid var(--border)" }}
      >
        Original card content — not affiliated with Cards Against Humanity®
      </footer>
    </div>
  );
}
