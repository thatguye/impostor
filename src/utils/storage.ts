import {
  CategoryDeck,
  GameSettings,
  OnlineProfile,
  OnlineSessionIdentity,
  Player,
  PlayerGroup,
  SupabaseCredentials,
  UsedHistory,
} from '../types/game';

const KEYS = {
  PLAYERS: 'impostor_players_v1',
  GROUPS: 'impostor_groups_v1',
  SETTINGS: 'impostor_settings_v1',
  SELECTED_DECKS: 'impostor_selected_decks_v1',
  CUSTOM_DECKS: 'impostor_custom_decks_v1',
  USED_HISTORY: 'impostor_used_history_v1',
  SCORES: 'impostor_scores_v1',
  MUTED: 'impostor_muted_v1',
  ONLINE_SESSION: 'impostor_online_session_v1',
  ONLINE_PROFILE: 'impostor_online_profile_v1',
  SUPABASE_CREDS: 'impostor_supabase_creds_v1',
} as const;

export const DEFAULT_PLAYERS: Player[] = [
  { id: 'p-1', name: 'Alex', emoji: '🦊', color: '#22D3EE' },
  { id: 'p-2', name: 'Maya', emoji: '🐙', color: '#F43F5E' },
  { id: 'p-3', name: 'Jordan', emoji: '🦁', color: '#A78BFA' },
  { id: 'p-4', name: 'Sam', emoji: '🐼', color: '#34D399' },
];

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'word',
  impostorCountMode: 'balanced',
  impostorCount: 1,
  hideImpostorCountInChaos: true,
  impostorHints: true,
  impostorTeamMode: true,
  blindLiarMode: true,
  preventImpostorFirst: false,
  survivalMode: false,
  discussionTimer: 120,
  scoreboardEnabled: true,
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadPlayers(): Player[] {
  const loaded = readJSON<Player[]>(KEYS.PLAYERS, DEFAULT_PLAYERS);
  return Array.isArray(loaded) && loaded.length >= 3 ? loaded : DEFAULT_PLAYERS;
}

export function savePlayers(players: Player[]): void {
  writeJSON(KEYS.PLAYERS, players);
}

export function loadPlayerGroups(): PlayerGroup[] {
  const loaded = readJSON<PlayerGroup[]>(KEYS.GROUPS, []);
  return Array.isArray(loaded) ? loaded : [];
}

export function savePlayerGroups(groups: PlayerGroup[]): void {
  writeJSON(KEYS.GROUPS, groups);
}

export function loadSettings(): GameSettings {
  const loaded = readJSON<Partial<GameSettings>>(KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...loaded };
}

export function saveSettings(settings: GameSettings): void {
  writeJSON(KEYS.SETTINGS, settings);
}

export function loadSelectedDeckIds(
  defaultIds: string[],
  validDecks?: CategoryDeck[]
): string[] {
  const loaded = readJSON<string[] | null>(KEYS.SELECTED_DECKS, null);
  if (!Array.isArray(loaded) || loaded.length === 0) {
    return defaultIds;
  }
  if (!validDecks || validDecks.length === 0) {
    return loaded;
  }
  const validSet = new Set(validDecks.map((d) => d.id));
  const filtered = loaded.filter((id) => validSet.has(id));
  if (filtered.length === 0) {
    return defaultIds;
  }
  const hasWordDeck = validDecks.some((d) => filtered.includes(d.id) && d.words.length > 0);
  const hasQuestionDeck = validDecks.some((d) => filtered.includes(d.id) && d.questions.length > 0);
  const merged = new Set(filtered);
  if (!hasWordDeck) {
    for (const d of validDecks) {
      if (d.words.length > 0 && defaultIds.includes(d.id)) merged.add(d.id);
    }
  }
  if (!hasQuestionDeck) {
    for (const d of validDecks) {
      if (d.questions.length > 0 && defaultIds.includes(d.id)) merged.add(d.id);
    }
  }
  return Array.from(merged);
}

export function saveSelectedDeckIds(ids: string[]): void {
  writeJSON(KEYS.SELECTED_DECKS, ids);
}

export function loadCustomDecks(): CategoryDeck[] {
  const loaded = readJSON<CategoryDeck[]>(KEYS.CUSTOM_DECKS, []);
  return Array.isArray(loaded) ? loaded : [];
}

export function saveCustomDecks(decks: CategoryDeck[]): void {
  writeJSON(KEYS.CUSTOM_DECKS, decks);
}

export function loadUsedHistory(): UsedHistory {
  const loaded = readJSON<Partial<UsedHistory>>(KEYS.USED_HISTORY, {});
  return {
    word: Array.isArray(loaded.word) ? loaded.word : [],
    question: Array.isArray(loaded.question) ? loaded.question : [],
  };
}

export function saveUsedHistory(history: UsedHistory): void {
  writeJSON(KEYS.USED_HISTORY, history);
}

export function loadScores(): Record<string, number> {
  return readJSON<Record<string, number>>(KEYS.SCORES, {});
}

export function saveScores(scores: Record<string, number>): void {
  writeJSON(KEYS.SCORES, scores);
}

export function loadMuted(): boolean {
  return readJSON<boolean>(KEYS.MUTED, false);
}

export function saveMuted(muted: boolean): void {
  writeJSON(KEYS.MUTED, muted);
}

export interface CareerStats {
  roundsPlayed: number;
  wins: number;
  points: number;
}

const CAREER_STATS_KEY = 'impostor_career_stats_v1';

export function loadCareerStats(): CareerStats {
  const loaded = readJSON<Partial<CareerStats>>(CAREER_STATS_KEY, {});
  return {
    roundsPlayed: typeof loaded.roundsPlayed === 'number' && loaded.roundsPlayed >= 0 ? loaded.roundsPlayed : 0,
    wins: typeof loaded.wins === 'number' && loaded.wins >= 0 ? loaded.wins : 0,
    points: typeof loaded.points === 'number' && loaded.points >= 0 ? loaded.points : 0,
  };
}

export function saveCareerStats(stats: CareerStats): void {
  writeJSON(CAREER_STATS_KEY, stats);
}

export function loadOnlineSession(): OnlineSessionIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEYS.ONLINE_SESSION);
    if (!raw) return null;
    const loaded = JSON.parse(raw) as OnlineSessionIdentity | null;
    if (
      loaded &&
      typeof loaded.roomCode === 'string' &&
      loaded.roomCode.trim().length >= 4 &&
      typeof loaded.playerId === 'string' &&
      loaded.playerId.trim().length > 0
    ) {
      return {
        roomCode: loaded.roomCode.trim().toUpperCase(),
        playerId: loaded.playerId.trim(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveOnlineSession(session: OnlineSessionIdentity | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.sessionStorage.removeItem(KEYS.ONLINE_SESSION);
    } else {
      window.sessionStorage.setItem(KEYS.ONLINE_SESSION, JSON.stringify(session));
    }
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadOnlineProfile(): OnlineProfile {
  const loaded = readJSON<Partial<OnlineProfile>>(KEYS.ONLINE_PROFILE, {});
  return {
    name: typeof loaded.name === 'string' ? loaded.name : '',
    emoji: typeof loaded.emoji === 'string' && loaded.emoji ? loaded.emoji : '🦊',
    color: typeof loaded.color === 'string' && loaded.color ? loaded.color : '#22D3EE',
  };
}

export function saveOnlineProfile(profile: OnlineProfile): void {
  writeJSON(KEYS.ONLINE_PROFILE, profile);
}

export function loadSupabaseCredentials(): SupabaseCredentials | null {
  const loaded = readJSON<Partial<SupabaseCredentials> | null>(KEYS.SUPABASE_CREDS, null);
  if (
    loaded &&
    typeof loaded.url === 'string' &&
    loaded.url.trim().length > 0 &&
    typeof loaded.anonKey === 'string' &&
    loaded.anonKey.trim().length > 0
  ) {
    return {
      url: loaded.url.trim().replace(/\/+$/, ''),
      anonKey: loaded.anonKey.trim(),
    };
  }
  return null;
}

export function saveSupabaseCredentials(creds: SupabaseCredentials | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!creds || !creds.url.trim() || !creds.anonKey.trim()) {
      window.localStorage.removeItem(KEYS.SUPABASE_CREDS);
    } else {
      window.localStorage.setItem(
        KEYS.SUPABASE_CREDS,
        JSON.stringify({
          url: creds.url.trim().replace(/\/+$/, ''),
          anonKey: creds.anonKey.trim(),
        })
      );
    }
  } catch {
    // Ignore storage quota errors gracefully
  }
}
