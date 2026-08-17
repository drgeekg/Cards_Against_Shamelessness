// ─── CARD TYPES ──────────────────────────────────────────────────────────────

export type PromptCard = {
  id: string;
  edition: "decency" | "sanskaar";
  pack: string;
  text: string;      // uses "___" for blank(s)
  pick: 1 | 2;
};

export type ResponseCard = {
  id: string;
  edition: "decency" | "sanskaar";
  pack: string;
  text: string;
};

// ─── PLAYER TYPES ────────────────────────────────────────────────────────────

export type Player = {
  id: string;
  name: string;
  avatarColor: string;
  hand: string[];           // response card ids
  score: number;
  connected: boolean;
  isHost: boolean;
};

// ─── GAME SESSION ─────────────────────────────────────────────────────────────

export type GamePhase =
  | "lobby"
  | "submitting"
  | "judging"
  | "voting"
  | "reveal"
  | "tiebreaker"
  | "gameOver";

export type GameSession = {
  code: string;             // 4-char room code e.g. "F9K2"
  edition: "decency" | "sanskaar";
  activePacks: string[];
  targetScore: number;      // default 7
  handSize: number;         // default 7 (initial deal size)
  totalRounds: number;      // host-selected number of rounds
  minCardsRefillThreshold: number; // default 2: if cards < this, refill
  refillCardCount: number;         // default 3: cards dealt on refill
  nsfw: boolean;            // default false
  roundTimer: number | null; // seconds, null = off
  players: Player[];
  judgeIndex: number;
  round: number;
  currentPrompt: PromptCard | null;
  submissions: Submission[];
  votes: Record<string, string>; // voter id -> submission id
  usedResponseIds: string[];      // submitted cards are never dealt again
  usedPromptIds: string[];        // tracked prompt IDs to prevent repeats
  shuffledThisRound: string[];    // player IDs who already shuffled this round
  tiebreakerPlayerIds: string[];  // player IDs involved in an active tiebreaker
  winningSubmissionId: string | null;
  gameStarted: boolean;
  phase: GamePhase;
  createdAt: number;
};

export type Submission = {
  id: string;
  playerId: string;
  cardIds: string[];
  revealed: boolean;
};

// ─── PACK METADATA ────────────────────────────────────────────────────────────

export type Pack = {
  id: string;
  name: string;
  edition: "decency" | "sanskaar" | "both";
  description: string;
  nsfw: boolean;
  promptCount: number;
  responseCount: number;
  emoji: string;
};

// ─── PARTYKIT MESSAGES ───────────────────────────────────────────────────────

export type ServerMessage =
  | { type: "ROOM_STATE"; session: GameSession }
  | { type: "ROUND_START"; promptCard: PromptCard; judgeId: string; round: number }
  | { type: "PLAYER_JOINED"; player: Player }
  | { type: "PLAYER_LEFT"; playerId: string }
  | { type: "PLAYER_RECONNECTED"; playerId: string }
  | { type: "SUBMISSION_COUNT"; count: number; total: number }
  | { type: "ALL_SUBMITTED" }
  | { type: "CARD_REVEALED"; submissionIndex: number }
  | { type: "WINNER_REVEALED"; winnerId: string; winningCardIds: string[] }
  | { type: "SCORE_UPDATE"; scores: { playerId: string; score: number }[] }
  | { type: "GAME_OVER"; finalScores: { playerId: string; score: number }[] }
  | { type: "PLAYER_KICKED"; playerId: string }
  | { type: "TIMER_TICK"; secondsLeft: number }
  | { type: "ERROR"; message: string };

export type ClientMessage =
  | { type: "JOIN"; name: string; avatarColor: string; isHost: boolean }
  | { type: "RECONNECT"; playerId: string }
  | { type: "SUBMIT_CARD"; cardIds: string[] }
  | { type: "JUDGE_PICK"; submissionIndex: number }
  | { type: "REVEAL_CARD"; submissionIndex: number }
  | { type: "HOST_START_GAME" }
  | { type: "HOST_NEXT_ROUND" }
  | { type: "HOST_KICK"; targetPlayerId: string }
  | { type: "HOST_SETTINGS"; settings: Partial<GameSession> };

// ─── UI TYPES ─────────────────────────────────────────────────────────────────

export type Edition = "decency" | "sanskaar";
export type Theme = "dark" | "light";

export type ToastType = "success" | "error" | "info" | "warning";
export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};
