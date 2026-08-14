"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: "#10AC84",
  error: "#E63946",
  info: "#54A0FF",
  warning: "#FECA57",
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div
      className="fixed bottom-6 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: 360 }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-strong)",
                backdropFilter: "blur(16px)",
              }}
            >
              <Icon size={18} color={colors[toast.type]} style={{ flexShrink: 0, marginTop: 1 }} />
              <p
                className="flex-1 text-sm leading-snug"
                style={{ color: "var(--text)", fontFamily: "Inter, sans-serif" }}
              >
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss"
                style={{ color: "var(--text-muted)" }}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
