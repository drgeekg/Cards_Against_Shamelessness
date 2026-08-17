"use client";
import React from "react";
import { motion } from "framer-motion";
import { AVATAR_COLORS } from "@/stores/playerStore";

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
  className?: string;
}

export function ColorPicker({ selected, onSelect, className = "" }: ColorPickerProps) {
  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {AVATAR_COLORS.map((color) => (
        <motion.button
          key={color}
          type="button"
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
