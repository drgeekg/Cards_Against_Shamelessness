"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Edition, Theme, Toast } from "@/types/game";

interface UIState {
  edition: Edition;
  theme: Theme;
  soundEnabled: boolean;
  toasts: Toast[];

  setEdition: (edition: Edition) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleEdition: () => void;
  toggleSound: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      edition: "decency",
      theme: "dark",
      soundEnabled: true,
      toasts: [],

      setEdition: (edition) => {
        set({ edition });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-edition", edition);
        }
      },
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },
      toggleEdition: () => {
        const next = get().edition === "decency" ? "sanskaar" : "decency";
        get().setEdition(next);
      },
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      addToast: (toast) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        const duration = toast.duration ?? 3000;
        setTimeout(() => get().removeToast(id), duration);
      },
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "cardsvs-ui",
      partialize: (s) => ({ edition: s.edition, theme: s.theme, soundEnabled: s.soundEnabled }),
    }
  )
);
