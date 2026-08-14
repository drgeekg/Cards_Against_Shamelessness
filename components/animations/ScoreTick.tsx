"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface ScoreTickProps {
  value: number;
  className?: string;
}

export function ScoreTick({ value, className = "" }: ScoreTickProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(value);
  const [bouncing, setBouncing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setBouncing(true);
      animate(count, value, { duration: 0.6, ease: "easeOut" });
      prevValue.current = value;
      setTimeout(() => setBouncing(false), 600);
    }
  }, [value, count]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", setDisplayValue);
    return unsubscribe;
  }, [rounded]);

  return (
    <motion.span
      className={`inline-block font-bold tabular-nums ${className}`}
      animate={bouncing ? { scale: [1, 1.5, 0.9, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ fontFamily: "'Baloo 2', sans-serif" }}
    >
      {displayValue}
    </motion.span>
  );
}
