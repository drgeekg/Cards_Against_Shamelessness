"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 480 }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "var(--overlay)" }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="w-full rounded-2xl p-6 shadow-2xl"
              style={{
                maxWidth,
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-strong)",
              }}
            >
              {title && (
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="text-lg font-bold"
                    style={{ fontFamily: "'Baloo 2', sans-serif", color: "var(--text)" }}
                  >
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="rounded-lg p-1.5 hover:opacity-70 transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
