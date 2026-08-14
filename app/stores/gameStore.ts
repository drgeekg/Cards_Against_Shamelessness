"use client";
import { create } from "zustand";
import type { GameSession, GamePhase, PromptCard, Submission } from "@/types/game";

interface GameState {
  session: GameSession | null;
  isConnected: boolean;
  submittedCardIds: string[];
  revealedIndices: number[];
  winnerSubmissionIndex: number | null;

  setSession: (session: GameSession) => void;
  updatePhase: (phase: GamePhase) => void;
  setSubmittedCards: (cardIds: string[]) => void;
  addRevealedIndex: (index: number) => void;
  setWinner: (index: number) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const defaultState = {
  session: null,
  isConnected: false,
  submittedCardIds: [],
  revealedIndices: [],
  winnerSubmissionIndex: null,
};

export const useGameStore = create<GameState>()((set) => ({
  ...defaultState,

  setSession: (session) => set({ session }),
  updatePhase: (phase) =>
    set((s) => s.session ? { session: { ...s.session, phase } } : {}),
  setSubmittedCards: (cardIds) => set({ submittedCardIds: cardIds }),
  addRevealedIndex: (index) =>
    set((s) => ({ revealedIndices: [...s.revealedIndices, index] })),
  setWinner: (index) => set({ winnerSubmissionIndex: index }),
  setConnected: (connected) => set({ isConnected: connected }),
  reset: () => set(defaultState),
}));
