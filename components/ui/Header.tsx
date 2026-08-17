"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { EditionToggle } from "./EditionToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useUIStore } from "@/stores/uiStore";

interface HeaderProps {
  editionLocked?: boolean;
  showEditionToggle?: boolean;
  onExit?: () => void;
}

export function Header({
  editionLocked = false,
  showEditionToggle = true,
  onExit,
}: HeaderProps) {
  const { edition, soundEnabled, toggleSound } = useUIStore();
  const isIndian = edition === "sanskaar";

  return (
    <motion.header
      className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3"
      style={{
        backgroundColor: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        {onExit ? (
          <button
            onClick={onExit}
            aria-label="Exit room"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all touch-target"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              color: "var(--danger)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            ← Exit
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2 no-underline">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              style={{ fontSize: "1.4rem" }}
            >
              🃏
            </motion.div>
            <span
              className="hidden sm:inline"
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {isIndian ? "Cards Against Shamelessness (Sanskaar)" : "Cards Against Shamelessness"}
            </span>
            <span
              className="sm:hidden font-extrabold text-sm"
              style={{ fontFamily: "'Baloo 2', sans-serif", color: "var(--text)" }}
            >
              CAS {isIndian ? "🇮🇳" : "🖤"}
            </span>
          </Link>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {showEditionToggle && (
          <EditionToggle disabled={editionLocked} />
        )}

        {/* Sound toggle */}
        <motion.button
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full touch-target"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-muted)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </motion.button>

        <ThemeToggle />
      </div>
    </motion.header>
  );
}
