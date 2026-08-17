"use client";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, LogOut } from "lucide-react";

interface ExitWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  loading?: boolean;
}

export function ExitWarningModal({
  isOpen,
  onClose,
  onConfirmExit,
  loading = false,
}: ExitWarningModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={400}>
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--danger)",
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h3
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.35rem",
            color: "var(--text)",
            lineHeight: 1.2,
          }}
        >
          Leave Game Session?
        </h3>

        <p
          style={{
            color: "var(--text-muted)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.9rem",
            lineHeight: 1.45,
          }}
        >
          Leaving now will mark you as inactive in this room. You can return later and rejoin anytime with your saved hand and score!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="w-full order-2 sm:order-1 font-semibold touch-target"
          >
            Stay & Play
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirmExit}
            loading={loading}
            className="w-full order-1 sm:order-2 font-bold touch-target"
          >
            <span className="flex items-center justify-center gap-1.5">
              <LogOut size={16} /> Leave Room
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
