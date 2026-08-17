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
  totalRounds?: number;
  minCardsRefillThreshold?: number;
  refillCardCount?: number;
  allowCardRefresh?: boolean;
  maxShufflesPerRound?: number;
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
    totalRounds: opts.totalRounds ?? 10,
    minCardsRefillThreshold: opts.minCardsRefillThreshold ?? 2,
    refillCardCount: opts.refillCardCount ?? 3,
    allowCardRefresh: opts.allowCardRefresh ?? true,
    maxShufflesPerRound: opts.maxShufflesPerRound ?? 1,
    playerShuffleCounts: {},
    nsfw: opts.nsfw ?? false,
    roundTimer: opts.roundTimer ?? null,
    players: [opts.hostPlayer],
    judgeIndex: 0,
    round: 0,
    currentPrompt: null,
    submissions: [],
    votes: {},
    usedResponseIds: [],
    usedPromptIds: [],
    shuffledThisRound: [],
    tiebreakerPlayerIds: [],
    winningSubmissionId: null,
    gameStarted: false,
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

/**
 * Initial full deal: every connected player gets session.handSize cards.
 */
export function dealHandsFull(
  session: GameSession,
  allResponses: ResponseCard[]
): GameSession {
  const currentHandIds = new Set(session.players.flatMap((p) => p.hand));
  const permanentlyUsed = new Set([...currentHandIds, ...session.usedResponseIds]);
  let available = shuffle(allResponses.filter((r) => !permanentlyUsed.has(r.id)));
  
  if (available.length < session.players.length * session.handSize) {
    available = shuffle(allResponses.filter((r) => !currentHandIds.has(r.id)));
  }

  let cardIdx = 0;
  const players = session.players.map((player) => {
    const needed = Math.max(0, session.handSize - player.hand.length);
    const newCards = available.slice(cardIdx, cardIdx + needed).map((c) => c.id);
    cardIdx += needed;
    return { ...player, hand: [...player.hand, ...newCards] };
  });

  return { ...session, players };
}

/**
 * Subsequent round refill:
 * Hand is NOT refilled automatically every round.
 * Only players with < minCardsRefillThreshold (default 2) receive refillCardCount (default 3) new cards.
 */
export function refillHands(
  session: GameSession,
  allResponses: ResponseCard[]
): GameSession {
  const currentHandIds = new Set(session.players.flatMap((p) => p.hand));
  const permanentlyUsed = new Set([...currentHandIds, ...session.usedResponseIds]);
  let available = shuffle(allResponses.filter((r) => !permanentlyUsed.has(r.id)));

  if (available.length < session.players.length * (session.refillCardCount ?? 3)) {
    available = shuffle(allResponses.filter((r) => !currentHandIds.has(r.id)));
  }

  let cardIdx = 0;
  const players = session.players.map((player) => {
    if (!player.connected) return player;
    if (player.hand.length < (session.minCardsRefillThreshold ?? 2)) {
      const count = session.refillCardCount ?? 3;
      const newCards = available.slice(cardIdx, cardIdx + count).map((c) => c.id);
      cardIdx += count;
      return { ...player, hand: [...player.hand, ...newCards] };
    }
    return player;
  });

  return { ...session, players };
}

/**
 * Deal extra cards to specific players (used for tiebreakers).
 */
export function dealCardsToPlayers(
  session: GameSession,
  playerIds: string[],
  count: number,
  allResponses: ResponseCard[]
): GameSession {
  const currentHandIds = new Set(session.players.flatMap((p) => p.hand));
  const permanentlyUsed = new Set([...currentHandIds, ...session.usedResponseIds]);
  let available = shuffle(allResponses.filter((r) => !permanentlyUsed.has(r.id)));

  if (available.length < playerIds.length * count) {
    available = shuffle(allResponses.filter((r) => !currentHandIds.has(r.id)));
  }

  let cardIdx = 0;
  const targetSet = new Set(playerIds);
  const players = session.players.map((player) => {
    if (targetSet.has(player.id)) {
      const newCards = available.slice(cardIdx, cardIdx + count).map((c) => c.id);
      cardIdx += count;
      return { ...player, hand: [...player.hand, ...newCards] };
    }
    return player;
  });

  return { ...session, players };
}

/**
 * Shuffle hand: discards a player's current hand cards and replaces them with the exact same count of new cards.
 * Can be done once per round per player.
 */
export function shuffleHand(
  session: GameSession,
  playerId: string,
  allResponses: ResponseCard[]
): { session: GameSession; success: boolean; error?: string } {
  if (session.phase !== "submitting" && session.phase !== "tiebreaker") {
    return { session, success: false, error: "Can only shuffle during submission" };
  }

  if (session.allowCardRefresh === false || (session.maxShufflesPerRound ?? 1) <= 0) {
    return { session, success: false, error: "Card refresh is disabled in this room" };
  }

  const currentCount = session.playerShuffleCounts?.[playerId] ?? 0;
  const maxAllowed = session.maxShufflesPerRound ?? 1;

  if (currentCount >= maxAllowed) {
    return {
      session,
      success: false,
      error: `You have reached the maximum card refreshes (${maxAllowed}) for this round`,
    };
  }

  if (session.submissions.some((s) => s.playerId === playerId)) {
    return { session, success: false, error: "Cannot shuffle after submitting cards" };
  }

  const player = session.players.find((p) => p.id === playerId);
  if (!player || player.hand.length === 0) {
    return { session, success: false, error: "No cards in hand to shuffle" };
  }

  const handCount = player.hand.length;
  const discardedIds = [...player.hand];

  const currentHandIds = new Set(
    session.players.flatMap((p) => (p.id === playerId ? [] : p.hand))
  );
  const permanentlyUsed = new Set([
    ...currentHandIds,
    ...session.usedResponseIds,
    ...discardedIds,
  ]);

  let available = shuffle(allResponses.filter((r) => !permanentlyUsed.has(r.id)));
  if (available.length < handCount) {
    available = shuffle(allResponses.filter((r) => !currentHandIds.has(r.id) && !discardedIds.includes(r.id)));
  }

  const newHand = available.slice(0, handCount).map((c) => c.id);

  const players = session.players.map((p) =>
    p.id === playerId ? { ...p, hand: newHand } : p
  );

  const newCount = currentCount + 1;
  const updatedCounts = { ...(session.playerShuffleCounts || {}), [playerId]: newCount };
  const updatedShuffledThisRound =
    newCount >= maxAllowed
      ? [...new Set([...session.shuffledThisRound, playerId])]
      : session.shuffledThisRound;

  const updatedSession: GameSession = {
    ...session,
    players,
    usedResponseIds: [...session.usedResponseIds, ...discardedIds],
    playerShuffleCounts: updatedCounts,
    shuffledThisRound: updatedShuffledThisRound,
  };

  return { session: updatedSession, success: true };
}

/**
 * Draw a prompt card while ensuring prompt cards never repeat during a session.
 */
export function drawPrompt(
  session: GameSession,
  allPrompts: PromptCard[]
): GameSession {
  const usedPromptSet = new Set(session.usedPromptIds || []);
  let available = shuffle(allPrompts.filter((p) => !usedPromptSet.has(p.id)));

  if (available.length === 0) {
    available = shuffle([...allPrompts]);
    if (available.length === 0) return session;
    const picked = available[0];
    return {
      ...session,
      currentPrompt: picked,
      usedPromptIds: [picked.id],
    };
  }

  const picked = available[0];
  return {
    ...session,
    currentPrompt: picked,
    usedPromptIds: [...(session.usedPromptIds || []), picked.id],
  };
}

// ── Game flow ─────────────────────────────────────────────────────────────────

export function startRound(
  session: GameSession,
  allPrompts: PromptCard[],
  allResponses: ResponseCard[]
): GameSession {
  let s: GameSession = {
    ...session,
    phase: "submitting",
    submissions: [],
    votes: {},
    winningSubmissionId: null,
    shuffledThisRound: [],
    playerShuffleCounts: {},
    tiebreakerPlayerIds: [],
    round: session.round + 1,
  };

  s = drawPrompt(s, allPrompts);

  if (!session.gameStarted) {
    s = dealHandsFull(s, allResponses);
    s.gameStarted = true;
  } else {
    s = refillHands(s, allResponses);
  }

  return s;
}

export function submitCards(
  session: GameSession,
  playerId: string,
  cardIds: string[]
): { session: GameSession; allSubmitted: boolean; error?: string } {
  const player = session.players.find((p) => p.id === playerId && p.connected);
  if (!player) return { session, allSubmitted: false, error: "Player not found or disconnected" };

  if (session.phase === "tiebreaker") {
    if (!session.tiebreakerPlayerIds.includes(playerId)) {
      return { session, allSubmitted: false, error: "Only tied players submit in tiebreaker" };
    }
  } else if (session.phase !== "submitting") {
    return { session, allSubmitted: false, error: "Not in submission phase" };
  }

  if (session.submissions.some((s) => s.playerId === playerId)) {
    return { session, allSubmitted: false, error: "Cards already submitted" };
  }

  const players = session.players.map((p) =>
    p.id === playerId
      ? { ...p, hand: p.hand.filter((id) => !cardIds.includes(id)) }
      : p
  );

  const newSubmission: Submission = {
    id: generateId(),
    playerId,
    cardIds,
    revealed: false,
  };
  const submissions = shuffle([...session.submissions, newSubmission]);

  const expectedPlayerIds =
    session.phase === "tiebreaker"
      ? session.tiebreakerPlayerIds
      : session.players.filter((p) => p.connected).map((p) => p.id);

  const submittedPlayerIds = new Set(submissions.map((s) => s.playerId));
  const allSubmitted = expectedPlayerIds.every((id) => submittedPlayerIds.has(id));

  const newSession: GameSession = {
    ...session,
    players,
    submissions,
    phase: allSubmitted ? "voting" : session.phase,
    usedResponseIds: [...session.usedResponseIds, ...cardIds],
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

export function castVote(
  session: GameSession,
  voterId: string,
  submissionId: string
): { session: GameSession; complete: boolean; error?: string } {
  const voter = session.players.find((p) => p.id === voterId && p.connected);
  const submission = session.submissions.find((s) => s.id === submissionId);

  if (!voter || !submission) {
    return { session, complete: false, error: "Invalid voter or submission" };
  }

  const votes = { ...session.votes, [voterId]: submissionId };

  const eligibleVoters = session.players.filter((p) => p.connected);
  const complete = eligibleVoters.every((p) => !!votes[p.id]);

  const updatedSession: GameSession = {
    ...session,
    votes,
    phase: complete ? "reveal" : "voting",
  };

  return { session: updatedSession, complete };
}

export function resolveVotes(
  session: GameSession,
  allPrompts?: PromptCard[],
  allResponses?: ResponseCard[]
): GameSession {
  if (session.submissions.length === 0) return session;

  const counts = new Map<string, number>();
  Object.values(session.votes).forEach((id) =>
    counts.set(id, (counts.get(id) ?? 0) + 1)
  );

  let maxVotes = -1;
  const submissionsWithVotes = session.submissions.map((s) => {
    const voteCount = counts.get(s.id) ?? 0;
    if (voteCount > maxVotes) maxVotes = voteCount;
    return { submission: s, voteCount };
  });

  const topSubmissions = submissionsWithVotes.filter(
    (item) => item.voteCount === maxVotes
  );

  if (topSubmissions.length > 1 && session.submissions.length > 1) {
    const tiedPlayerIds = topSubmissions.map((item) => item.submission.playerId);

    let tieSession: GameSession = {
      ...session,
      phase: "tiebreaker",
      tiebreakerPlayerIds: tiedPlayerIds,
      submissions: [],
      votes: {},
      winningSubmissionId: null,
    };

    if (allResponses) {
      tieSession = dealCardsToPlayers(tieSession, tiedPlayerIds, 3, allResponses);
    }
    if (allPrompts) {
      tieSession = drawPrompt(tieSession, allPrompts);
    }

    return tieSession;
  }

  const winnerSubmission = (topSubmissions[0] || submissionsWithVotes[0])?.submission;
  if (!winnerSubmission) return session;

  const players = session.players.map((p) =>
    p.id === winnerSubmission.playerId ? { ...p, score: p.score + 1 } : p
  );

  return {
    ...session,
    players,
    winningSubmissionId: winnerSubmission.id,
    tiebreakerPlayerIds: [],
    phase: "reveal",
  };
}

export function checkWinCondition(session: GameSession): Player | null {
  const connectedPlayers = session.players.filter((p) => p.connected);
  if (connectedPlayers.length === 0) return null;

  const reachedScore = connectedPlayers.some((p) => p.score >= session.targetScore);
  const reachedRounds = session.totalRounds > 0 && session.round >= session.totalRounds;

  if (reachedScore || reachedRounds) {
    const sorted = [...connectedPlayers].sort((a, b) => b.score - a.score);
    const topScore = sorted[0]?.score ?? 0;
    const leaders = sorted.filter((p) => p.score === topScore);

    if (leaders.length === 1) {
      return leaders[0];
    }
    return null;
  }

  return null;
}

export function advanceRound(session: GameSession): GameSession {
  const nextJudgeIndex = (session.judgeIndex + 1) % Math.max(1, session.players.filter((p) => p.connected).length);
  return {
    ...session,
    judgeIndex: nextJudgeIndex,
    submissions: [],
    currentPrompt: null,
    phase: "submitting",
    votes: {},
    winningSubmissionId: null,
    shuffledThisRound: [],
    playerShuffleCounts: {},
    tiebreakerPlayerIds: [],
  };
}

export function judgePicksWinner(
  session: GameSession,
  judgeId: string,
  submissionIndex: number
): { session: GameSession; winnerId: string | null } {
  if (!session.players.find((p) => p.id === judgeId && p.connected)) return { session, winnerId: null };

  const winning = session.submissions[submissionIndex];
  if (!winning) return { session, winnerId: null };

  const players = session.players.map((p) =>
    p.id === winning.playerId ? { ...p, score: p.score + 1 } : p
  );

  const newSession: GameSession = {
    ...session,
    players,
    winningSubmissionId: winning.id,
    phase: "reveal",
  };
  return { session: newSession, winnerId: winning.playerId };
}

export function endGame(session: GameSession): GameSession {
  return { ...session, phase: "gameOver" };
}

