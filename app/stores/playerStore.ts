"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  playerId: string | null;
  name: string;
  avatarColor: string;
  hand: string[];          // response card ids in hand
  isHost: boolean;

  setPlayer: (opts: { playerId: string; name: string; avatarColor: string; isHost: boolean }) => void;
  setHand: (hand: string[]) => void;
  removeFromHand: (cardId: string) => void;
  clearPlayer: () => void;
}

const AVATAR_COLORS = [
  "#FF6B6B", "#FF9F43", "#FECA57", "#48DBFB",
  "#FF9FF3", "#54A0FF", "#5F27CD", "#01ABC9",
  "#10AC84", "#EE5A24", "#C0392B", "#8E44AD",
];

export const getRandomColor = () =>
  AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      playerId: null,
      name: "",
      avatarColor: getRandomColor(),
      hand: [],
      isHost: false,

      setPlayer: ({ playerId, name, avatarColor, isHost }) =>
        set({ playerId, name, avatarColor, isHost }),
      setHand: (hand) => set({ hand }),
      removeFromHand: (cardId) =>
        set((s) => ({ hand: s.hand.filter((id) => id !== cardId) })),
      clearPlayer: () =>
        set({ playerId: null, name: "", hand: [], isHost: false }),
    }),
    {
      name: "cardsvs-player",
      partialize: (s) => ({
        playerId: s.playerId,
        name: s.name,
        avatarColor: s.avatarColor,
      }),
    }
  )
);

export { AVATAR_COLORS };
