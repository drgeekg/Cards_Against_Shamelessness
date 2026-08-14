"use client";
import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--accent-primary)",
    color: "var(--accent-on-primary)",
    border: "1px solid transparent",
  },
  secondary: {
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border-strong)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-muted)",
    border: "1px solid transparent",
  },
  danger: {
    backgroundColor: "var(--danger)",
    color: "#ffffff",
    border: "1px solid transparent",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "0.8rem", borderRadius: "8px", minHeight: 32 },
  md: { padding: "10px 20px", fontSize: "0.9rem", borderRadius: "12px", minHeight: 44 },
  lg: { padding: "14px 28px", fontSize: "1rem", borderRadius: "14px", minHeight: 52 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  className = "",
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 font-semibold select-none focus:outline-none ${className}`}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        fontFamily: "Inter, sans-serif",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      whileHover={disabled || loading ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
    >
      {loading && (
        <svg
          className="animate-spin"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
