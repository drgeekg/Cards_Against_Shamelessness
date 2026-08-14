"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";

export function EditionToggle({ disabled = false }: { disabled?: boolean }) {
  const { edition, toggleEdition } = useUIStore();
  const isIndian = edition === "sanskaar";

  return (
    <motion.button
      onClick={() => !disabled && toggleEdition()}
      disabled={disabled}
      aria-label={`Switch to ${isIndian ? "International" : "Indian"} edition`}
      className="relative flex items-center gap-1 rounded-full border px-1 py-1 select-none focus:outline-none"
      style={{
        borderColor: "var(--border-strong)",
        backgroundColor: "var(--surface)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: 148,
      }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {/* Sliding pill background */}
      <motion.div
        layout
        layoutId="edition-pill"
        className="absolute rounded-full"
        style={{
          backgroundColor: "var(--accent-primary)",
          top: 4,
          bottom: 4,
          width: "calc(50% - 4px)",
          left: isIndian ? "calc(50%)" : 4,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {/* International option */}
      <span
        className="relative z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          color: !isIndian ? "var(--accent-on-primary)" : "var(--text-muted)",
          fontFamily: "Inter, sans-serif",
          flex: 1,
          justifyContent: "center",
          minWidth: 66,
        }}
      >
        🌍 <span>Global</span>
      </span>

      {/* Indian option */}
      <span
        className="relative z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          color: isIndian ? "var(--accent-on-primary)" : "var(--text-muted)",
          fontFamily: "Inter, sans-serif",
          flex: 1,
          justifyContent: "center",
          minWidth: 66,
        }}
      >
        🇮🇳 <span>Desi</span>
      </span>
    </motion.button>
  );
}
