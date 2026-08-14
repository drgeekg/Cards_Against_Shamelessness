"use client";
import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";

// Syncs theme/edition preference to HTML data attributes on mount & store changes
export function ThemeInitializer() {
  const { theme, edition } = useUIStore();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("data-edition", edition);
    }
  }, [theme, edition]);

  return null;
}

