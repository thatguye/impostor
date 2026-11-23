export type GameMode = 'word' | 'question';

export type ImpostorCountMode = 'standard' | 'balanced' | 'chaos';

export type DiscussionTimerSeconds = 0 | 60 | 120 | 180 | 300;

export interface Player {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface PlayerGroup {
  id: string;
  name: string;
  players: Player[];
  updatedAt: number;
}

export interface WordEntry {
  id: string;
  word: string;
  description?: string;
  hints: [string] | [string, string];
}

export interface QuestionPair {
  id: string;
  main: string;
  decoy: string;
}

export interface CategoryDeck {
  id: string;
  name: string;
  emoji: string;
  accent: string;
  description: string;
  isCustom?: boolean;
  isSpicy?: boolean;
  isFamilyFriendly?: boolean;
  words: WordEntry[];
  questions: QuestionPair[];
}

export interface GameSettings {
  mode: GameMode;
  impostorCountMode: ImpostorCountMode;
  impostorCount: number;
  hideImpostorCountInChaos: boolean;
  impostorHints: boolean;
  impostorTeamMode: boolean;
  preventImpostorFirst: boolean;
  survivalMode: boolean;
  discussionTimer: DiscussionTimerSeconds;
  scoreboardEnabled: boolean;
}

export interface PlayerRoleAssignment {
  playerId: string;
  isImpostor: boolean;
  eliminated: boolean;
  /** Word mode: secret word for civilians, null for impostors */
  secretWord: string | null;
  /** Word mode: brief definition/context shown only to civilians, null for impostors */
  wordDescription: string | null;
  /** Word mode: optional hint for impostors if hints enabled */
  hintWord: string | null;
  /** Question mode: main question for civilians, decoy for impostors */
  promptQuestion: string | null;
  /** Teammate names if Impostor Team Mode is enabled and 2+ impostors exist */
  fellowImpostorNames: string[];
}

export type RoundWinner = 'civilians' | 'impostors' | 'chaos_draw' | null;

export interface RoundState {
  id: string;
  mode: GameMode;
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  promptId: string;
  /** Word mode fields */
  secretWord: string | null;
  secretWordDescription: string | null;
  allHints: string[];
  /** Question mode fields */
  mainQuestion: string | null;
  decoyQuestion: string | null;
  submittedAnswers: Record<string, string>;
  /** Roles & progression */
  impostorCount: number;
  hideImpostorCount: boolean;
  startingPlayerId: string;
  assignments: Record<string, PlayerRoleAssignment>;
  playerOrder: string[];
  eliminatedOrder: string[];
  lastEliminatedId: string | null;
  winner: RoundWinner;
  winReason: string | null;
  roundNumber: number;
}

export type GamePhase =
  | 'lobby'
  | 'privacy_pass'
  | 'discussion'
  | 'voting'
  | 'elimination_reveal'
  | 'round_summary';

export interface UsedHistory {
  word: string[];
  question: string[];
}
