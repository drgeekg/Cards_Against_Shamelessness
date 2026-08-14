"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface RoomCodeProps {
  code: string;
  roomUrl?: string;
}

export function RoomCode({ code, roomUrl }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const url = roomUrl || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        textarea.style.top = "-999999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Big code display */}
      <motion.div
        className="flex items-center gap-3 rounded-2xl px-6 py-4"
        style={{
          backgroundColor: "var(--surface-2)",
          border: "1px solid var(--border-strong)",
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
      >
        {code.split("").map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
            style={{
              fontFamily: "'Baloo 2', monospace",
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "var(--accent-primary)",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            {char}
          </motion.span>
        ))}
      </motion.div>

      {/* Share label */}
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Share this code with your friends
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-strong)",
            color: copied ? "#10AC84" : "var(--text)",
            fontFamily: "Inter, sans-serif",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy link"}
        </motion.button>

        <motion.button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          style={{
            backgroundColor: showQR ? "var(--accent-primary)" : "var(--surface)",
            border: "1px solid var(--border-strong)",
            color: showQR ? "var(--accent-on-primary)" : "var(--text)",
            fontFamily: "Inter, sans-serif",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <QrCode size={14} />
          QR code
        </motion.button>
      </div>

      {/* QR code panel */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="rounded-2xl p-4"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <QRCodeSVG value={url} size={160} fgColor="#0B0B0B" />
        </motion.div>
      )}
    </div>
  );
}
