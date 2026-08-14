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
}

export function Header({ editionLocked = false, showEditionToggle = true }: HeaderProps) {
  const { edition, soundEnabled, toggleSound } = useUIStore();
  const isIndian = edition === "sanskaar";

  return (
    <motion.header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
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
      <Link href="/" className="flex items-center gap-2 no-underline">
        <motion.div
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.4 }}
          style={{ fontSize: "1.5rem" }}
        >
          🃏
        </motion.div>
        <span
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "var(--text)",
            letterSpacing: "-0.01em",
          }}
        >
          {isIndian ? "Cards Vs Sanskaar" : "Cards Vs Decency"}
        </span>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {showEditionToggle && (
          <EditionToggle disabled={editionLocked} />
        )}

        {/* Sound toggle */}
        <motion.button
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-muted)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </motion.button>

        <ThemeToggle />
      </div>
    </motion.header>
  );
}
