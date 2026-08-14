import type { GameSession, Player, PromptCard, ResponseCard, Submission } from "@/types/game";

// ── Helpers ──────────────────────────────────────────────────────────────────

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/I/1
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Session creation ──────────────────────────────────────────────────────────

export interface CreateSessionOpts {
  code: string;
  edition: "decency" | "sanskaar";
  hostPlayer: Player;
  activePacks?: string[];
  targetScore?: number;
  handSize?: number;
  nsfw?: boolean;
  roundTimer?: number | null;
}

export function createSession(opts: CreateSessionOpts): GameSession {
  return {
    code: opts.code,
    edition: opts.edition,
    activePacks: opts.activePacks ?? [`${opts.edition}-base`],
    targetScore: opts.targetScore ?? 7,
    handSize: opts.handSize ?? 7,
    nsfw: opts.nsfw ?? false,
    roundTimer: opts.roundTimer ?? null,
    players: [opts.hostPlayer],
    judgeIndex: 0,
    round: 0,
    currentPrompt: null,
    submissions: [],
    phase: "lobby",
    createdAt: Date.now(),
  };
}

// ── Player management ─────────────────────────────────────────────────────────

export function addPlayer(session: GameSession, player: Player): GameSession {
  if (session.players.find((p) => p.id === player.id)) return session;
  return { ...session, players: [...session.players, player] };
}

export function removePlayer(session: GameSession, playerId: string): GameSession {
  return {
    ...session,
    players: session.players.map((p) =>
      p.id === playerId ? { ...p, connected: false } : p
    ),
  };
}

export function reconnectPlayer(session: GameSession, playerId: string): GameSession {
  return {
    ...session,
    players: session.players.map((p) =>
      p.id === playerId ? { ...p, connected: true } : p
    ),
  };
}

export function kickPlayer(session: GameSession, playerId: string): GameSession {
  return {
    ...session,
    players: session.players.filter((p) => p.id !== playerId),
  };
}

// ── Card management ───────────────────────────────────────────────────────────

export function dealHands(
  session: GameSession,
  allResponses: ResponseCard[]
): GameSession {
  const usedIds = new Set(session.players.flatMap((p) => p.hand));
  const available = shuffle(allResponses.filter((r) => !usedIds.has(r.id)));
  let cardIdx = 0;

  const players = session.players.map((player) => {
    const needed = session.handSize - player.hand.length;
    const newCards = available.slice(cardIdx, cardIdx + needed).map((c) => c.id);
    cardIdx += needed;
    return { ...player, hand: [...player.hand, ...newCards] };
  });

  return { ...session, players };
}

export function drawPrompt(
  session: GameSession,
  allPrompts: PromptCard[]
): GameSession {
  const usedPromptIds = new Set<string>(); // track across session ideally
  const available = shuffle(allPrompts.filter((p) => !usedPromptIds.has(p.id)));
  if (!available.length) return session;
  return { ...session, currentPrompt: available[0] };
}

// ── Game flow ─────────────────────────────────────────────────────────────────

export function startRound(
  session: GameSession,
  allPrompts: PromptCard[],
  allResponses: ResponseCard[]
): GameSession {
  let s: GameSession = { ...session, phase: "submitting", submissions: [], round: session.round + 1 };
  s = drawPrompt(s, allPrompts);
  s = dealHands(s, allResponses);
  return s;
}

export function submitCards(
  session: GameSession,
  playerId: string,
  cardIds: string[]
): { session: GameSession; allSubmitted: boolean } {
  // Validate: player exists, isn't judge, cards are in their hand
  const judgeId = session.players[session.judgeIndex]?.id;
  if (playerId === judgeId) {
    return { session, allSubmitted: false };
  }

  const player = session.players.find((p) => p.id === playerId);
  if (!player) return { session, allSubmitted: false };

  // Check already submitted
  if (session.submissions.find((s) => s.playerId === playerId)) {
    return { session, allSubmitted: false };
  }

  // Remove cards from hand
  const players = session.players.map((p) =>
    p.id === playerId ? { ...p, hand: p.hand.filter((id) => !cardIds.includes(id)) } : p
  );

  const newSubmission: Submission = { playerId, cardIds, revealed: false };
  const submissions = shuffle([...session.submissions, newSubmission]);

  const activePlayers = session.players.filter(
    (p) => p.id !== judgeId && p.connected
  );
  const allSubmitted = submissions.length >= activePlayers.length;

  const newSession: GameSession = {
    ...session,
    players,
    submissions,
    phase: allSubmitted ? "judging" : "submitting",
  };

  return { session: newSession, allSubmitted };
}

export function revealSubmission(
  session: GameSession,
  submissionIndex: number
): GameSession {
  const submissions = session.submissions.map((s, i) =>
    i === submissionIndex ? { ...s, revealed: true } : s
  );
  return { ...session, submissions };
}

export function judgePicksWinner(
  session: GameSession,
  judgeId: string,
  submissionIndex: number
): { session: GameSession; winnerId: string | null } {
  if (session.players[session.judgeIndex]?.id !== judgeId) {
    return { session, winnerId: null };
  }

  const winning = session.submissions[submissionIndex];
  if (!winning) return { session, winnerId: null };

  const players = session.players.map((p) =>
    p.id === winning.playerId ? { ...p, score: p.score + 1 } : p
  );

  const newSession: GameSession = { ...session, players, phase: "reveal" };
  return { session: newSession, winnerId: winning.playerId };
}

export function checkWinCondition(session: GameSession): Player | null {
  return (
    session.players.find((p) => p.score >= session.targetScore) ?? null
  );
}

export function advanceRound(session: GameSession): GameSession {
  const nextJudgeIndex = (session.judgeIndex + 1) % session.players.filter((p) => p.connected).length;
  return {
    ...session,
    judgeIndex: nextJudgeIndex,
    submissions: [],
    currentPrompt: null,
    phase: "submitting",
  };
}

export function endGame(session: GameSession): GameSession {
  return { ...session, phase: "gameOver" };
}
