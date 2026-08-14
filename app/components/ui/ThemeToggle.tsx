"use client";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative flex items-center justify-center w-10 h-10 rounded-full focus:outline-none"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border-strong)",
        color: "var(--text)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        key={theme}
        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
        transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </motion.button>
  );
}
