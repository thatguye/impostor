import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Compass,
  FolderOpen,
  KeyRound,
  Layers,
  MessageCircleQuestion,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Trophy,
  Type,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  CategoryDeck,
  GameMode,
  GameSettings,
  ImpostorCountMode,
  OnlineProfile,
  Player,
  PlayerGroup,
  UsedHistory,
} from '../types/game';
import { APP_VERSION } from '../data/changelog';
import { PLAYER_AVATAR_COLORS, PLAYER_AVATAR_EMOJIS } from '../data/gameData';
import { calculateBalancedImpostorCount, extractSingleIcon } from '../game/engine';
import { CareerStats } from '../utils/storage';
import { BottomSheet } from './BottomSheet';
import { PlayerManager } from './PlayerManager';
import { CategoryBrowser } from './CategoryBrowser';
import { SettingsDrawer } from './SettingsDrawer';
import { playTapSound, triggerHaptic } from '../utils/audio';

export type HomeTab = 'play' | 'ranks' | 'you';

interface HomeHubProps {
  activeTab: HomeTab;
  isPassLobby: boolean;
  players: Player[];
  groups: PlayerGroup[];
  decks: CategoryDeck[];
  selectedDeckIds: string[];
  settings: GameSettings;
  usedHistory: UsedHistory;
  scores: Record<string, number>;
  careerStats: CareerStats;
  canStartError: string | null;
  onlineProfile: OnlineProfile;
  onlineLoading: boolean;
  onlineError: string | null;
  showPassSettingsSheet: boolean;
  onChangeTab: (tab: HomeTab) => void;
  onEnterPassLobby: () => void;
  onSetShowPassSettingsSheet: (open: boolean) => void;
  onOpenJoinModal: () => void;
  onHostOnlineRoom: () => void;
  onChangeOnlineProfile: (profile: OnlineProfile) => void;
  onChangePlayers: (players: Player[]) => void;
  onSaveGroup: (name: string) => void;
  onLoadGroup: (group: PlayerGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleDeck: (deckId: string) => void;
  onSelectAllDecks: () => void;
  onDeselectAllDecks: () => void;
  onResetHistory: () => void;
  onCreateCustomDeck: () => void;
  onEditCustomDeck: (deck: CategoryDeck) => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onResetScores: () => void;
  onStartPassGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenChangelog: () => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  activeTab,
  isPassLobby,
  players,
  groups,
  decks,
  selectedDeckIds,
  settings,
  usedHistory,
  scores,
  careerStats,
  canStartError,
  onlineProfile,
  onlineLoading,
  onlineError,
  showPassSettingsSheet,
  onChangeTab,
  onEnterPassLobby,
  onSetShowPassSettingsSheet,
  onOpenJoinModal,
  onHostOnlineRoom,
  onChangeOnlineProfile,
  onChangePlayers,
  onSaveGroup,
  onLoadGroup,
  onDeleteGroup,
  onToggleDeck,
  onSelectAllDecks,
  onDeselectAllDecks,
  onResetHistory,
  onCreateCustomDeck,
  onEditCustomDeck,
  onUpdateSettings,
  onResetScores,
  onStartPassGame,
  onOpenHowToPlay,
  onOpenChangelog,
}) => {
  // Pass & Play slide-up bottom sheets
  const [showPlayersSheet, setShowPlayersSheet] = useState(false);
  const [showDecksSheet, setShowDecksSheet] = useState(false);

  // Profile custom icon input (on You tab)
  const [showCustomProfileIcon, setShowCustomProfileIcon] = useState(false);
  const [customProfileIconDraft, setCustomProfileIconDraft] = useState('');
  const customIconInputRef = useRef<HTMLInputElement | null>(null);

  const selectedDecksForMode = useMemo(() => {
    const selectedSet = new Set(selectedDeckIds);
    return decks.filter(
      (d) =>
        selectedSet.has(d.id) &&
        (settings.mode === 'word' ? d.words.length > 0 : d.questions.length > 0)
    );
  }, [decks, selectedDeckIds, settings.mode]);

  const totalPromptsReady = useMemo(
    () =>
      selectedDecksForMode.reduce(
        (sum, d) => sum + (settings.mode === 'word' ? d.words.length : d.questions.length),
        0
      ),
    [selectedDecksForMode, settings.mode]
  );

  const rankedPlayers = useMemo(
    () =>
      [...players]
        .map((p) => ({ player: p, points: scores[p.id] ?? 0 }))
        .sort((a, b) => b.points - a.points),
    [players, scores]
  );

  const hasAnyScores = rankedPlayers.some((r) => r.points > 0);
  const displayName = onlineProfile.name.trim() || 'Agent';
  const winRate =
    careerStats.roundsPlayed > 0
      ? Math.round((careerStats.wins / careerStats.roundsPlayed) * 100)
      : 0;
  const balancedCount = calculateBalancedImpostorCount(players.length);

  /* ============================================================================
     SUB-VIEW: PASS & PLAY LOBBY (Modeled on Finders Keepers Lobby Screen)
     ============================================================================ */
  if (isPassLobby) {
    const handleModeSwitch = (mode: GameMode) => {
      if (settings.mode === mode) return;
      playTapSound();
      triggerHaptic(10);
      onUpdateSettings({ mode });
    };

    const impostorSummary =
      settings.impostorCountMode === 'standard'
        ? `${Math.min(Math.max(1, players.length - 1), settings.impostorCount)} Impostor${
            settings.impostorCount === 1 ? '' : 's'
          }`
        : settings.impostorCountMode === 'balanced'
        ? `Balanced (${balancedCount})`
        : 'Chaos Mystery';

    const timerSummary =
      settings.discussionTimer === 0 ? 'No Timer' : `${settings.discussionTimer / 60}m Timer`;

    return (
      <>
        <main
          data-testid="pass-play-lobby"
          className="relative mx-auto w-full max-w-2xl px-4 sm:px-6 pt-4 pb-36 space-y-3.5"
        >
          {/* GAME MODE CARD */}
          <section className="rounded-[24px] bg-[#13131E] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                Game Mode
              </span>
              <span className="text-xs font-semibold text-cyan-300">Single Phone</span>
            </div>

            <div
              role="tablist"
              aria-label="Pass and Play Game Mode"
              className="grid grid-cols-2 gap-2 rounded-2xl bg-[#09090E] p-1.5 border border-white/[0.06]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={settings.mode === 'word'}
                onClick={() => handleModeSwitch('word')}
                className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-[13px] sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  settings.mode === 'word'
                    ? 'bg-[#1B1B2A] text-cyan-300 border border-cyan-400/35 shadow-sm'
                    : 'text-[#8D8DA8] hover:text-[#F4F4F8]'
                }`}
              >
                <Type className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Word Game</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settings.mode === 'question'}
                onClick={() => handleModeSwitch('question')}
                className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-[13px] sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  settings.mode === 'question'
                    ? 'bg-[#1B1B2A] text-rose-300 border border-rose-500/35 shadow-sm'
                    : 'text-[#8D8DA8] hover:text-[#F4F4F8]'
                }`}
              >
                <MessageCircleQuestion className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Question Game</span>
              </button>
            </div>
          </section>

          {/* PLAYERS CARD */}
          <section className="rounded-[24px] bg-[#13131E] border border-white/[0.08] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                  Players ({players.length})
                </span>
              </div>
              <button
                type="button"
                data-testid="open-players-sheet-btn"
                onClick={() => {
                  playTapSound();
                  setShowPlayersSheet(true);
                }}
                className="flex min-h-[36px] items-center gap-1 rounded-xl bg-white/[0.07] border border-white/[0.08] px-3 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.13] active:scale-[0.97] transition-all cursor-pointer"
              >
                <span>Manage</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#9898B0]" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowPlayersSheet(true);
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-[#09090E] border border-white/[0.08] px-3 py-2 text-xs font-bold text-[#F4F4F8] hover:border-cyan-400/35 transition-colors cursor-pointer"
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-sm"
                    style={{
                      backgroundColor: `${p.color}22`,
                      border: `1px solid ${p.color}55`,
                    }}
                  >
                    {p.emoji}
                  </span>
                  <span className="max-w-[110px] truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* CATEGORY DECKS CARD */}
          <section className="rounded-[24px] bg-[#13131E] border border-white/[0.08] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                  Category Decks
                </span>
              </div>
              <button
                type="button"
                data-testid="open-decks-sheet-btn"
                onClick={() => {
                  playTapSound();
                  setShowDecksSheet(true);
                }}
                className="flex min-h-[36px] items-center gap-1 rounded-xl bg-white/[0.07] border border-white/[0.08] px-3 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.13] active:scale-[0.97] transition-all cursor-pointer"
              >
                <span>Change</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#9898B0]" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#09090E] border border-white/[0.07] px-4 py-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[#F4F4F8] truncate">
                  {selectedDecksForMode.length === 0
                    ? 'No decks selected'
                    : selectedDecksForMode
                        .slice(0, 3)
                        .map((d) => `${d.emoji} ${d.name}`)
                        .join(' · ')}
                  {selectedDecksForMode.length > 3
                    ? ` +${selectedDecksForMode.length - 3} more`
                    : ''}
                </p>
                <p className="mt-0.5 font-mono text-xs text-[#8D8DA8] tabular-nums">
                  {selectedDecksForMode.length} selected · {totalPromptsReady}{' '}
                  {settings.mode === 'word' ? 'words' : 'questions'} ready
                </p>
              </div>
            </div>
          </section>

          {/* HOUSE RULES CARD */}
          <section className="rounded-[24px] bg-[#13131E] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                  House Rules
                </span>
              </div>
              <button
                type="button"
                data-testid="open-rules-sheet-btn"
                onClick={() => {
                  playTapSound();
                  onSetShowPassSettingsSheet(true);
                }}
                className="flex min-h-[36px] items-center gap-1 rounded-xl bg-white/[0.07] border border-white/[0.08] px-3 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.13] active:scale-[0.97] transition-all cursor-pointer"
              >
                <span>Customize</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#9898B0]" aria-hidden="true" />
              </button>
            </div>

            {/* Quick Preset Strip (Matching Finders Keepers Lobby) */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#09090E] p-1 border border-white/[0.06]">
              {(
                [
                  { id: 'standard', label: 'Standard' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'chaos', label: 'Chaos' },
                ] as Array<{ id: ImpostorCountMode; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onUpdateSettings({ impostorCountMode: opt.id });
                  }}
                  aria-pressed={settings.impostorCountMode === opt.id}
                  className={`min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.impostorCountMode === opt.id
                      ? opt.id === 'chaos'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-[#1C1C2B] text-cyan-300 border border-cyan-400/30'
                      : 'text-[#8D8DA8] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#9898B0]">
              <span className="font-semibold text-[#D6D6E6]">{impostorSummary}</span>
              <span aria-hidden="true">·</span>
              <span>{timerSummary}</span>
              {settings.mode === 'word' && settings.impostorHints && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Hints On</span>
                </>
              )}
              {settings.mode === 'question' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{settings.blindLiarMode ? 'Blind Liar' : 'Labeled Impostor'}</span>
                </>
              )}
              {settings.survivalMode && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-300">Survival</span>
                </>
              )}
            </div>
          </section>
        </main>

        {/* Pinned Sticky Start CTA */}
        <div className="fixed inset-x-0 bottom-0 z-30 bg-[#09090E]/95 backdrop-blur-xl border-t border-white/[0.07] pt-3 pb-safe px-4">
          <div className="mx-auto max-w-2xl space-y-2">
            {canStartError && (
              <p role="alert" className="text-center text-xs font-semibold text-rose-400">
                {canStartError}
              </p>
            )}
            <button
              type="button"
              disabled={!!canStartError}
              data-testid="start-pass-game-btn"
              onClick={() => {
                triggerHaptic(16);
                onStartPassGame();
              }}
              className="flex w-full min-h-[56px] items-center justify-center gap-2.5 rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] shadow-[0_12px_36px_rgba(34,211,238,0.28)] hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-45 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
              <span>Start Game</span>
            </button>
          </div>
        </div>

        {/* Slide-Up Sheets for Pass & Play Lobby */}
        <BottomSheet
          isOpen={showPlayersSheet}
          onClose={() => setShowPlayersSheet(false)}
          title="Players & Crews"
          subtitle="Tap any avatar to customize icon or color"
          icon={<Users className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
          maxWidthClass="max-w-xl"
          testId="players-bottom-sheet"
          footer={
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowPlayersSheet(false);
              }}
              className="w-full min-h-[48px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 cursor-pointer"
            >
              Done ({players.length} Players)
            </button>
          }
        >
          <PlayerManager
            players={players}
            groups={groups}
            onChangePlayers={onChangePlayers}
            onSaveGroup={onSaveGroup}
            onLoadGroup={onLoadGroup}
            onDeleteGroup={onDeleteGroup}
            embedded
          />
        </BottomSheet>

        <BottomSheet
          isOpen={showDecksSheet}
          onClose={() => setShowDecksSheet(false)}
          title="Category Decks"
          subtitle={`${selectedDecksForMode.length} selected · ${totalPromptsReady} ready`}
          icon={<Layers className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
          maxWidthClass="max-w-2xl"
          testId="decks-bottom-sheet"
          footer={
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowDecksSheet(false);
              }}
              className="w-full min-h-[48px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 cursor-pointer"
            >
              Done
            </button>
          }
        >
          <CategoryBrowser
            decks={decks}
            selectedDeckIds={selectedDeckIds}
            mode={settings.mode}
            usedHistory={usedHistory}
            onToggleDeck={onToggleDeck}
            onSelectAll={onSelectAllDecks}
            onDeselectAll={onDeselectAllDecks}
            onChangeMode={(mode) => onUpdateSettings({ mode })}
            onResetHistory={onResetHistory}
            onCreateCustomDeck={() => {
              setShowDecksSheet(false);
              onCreateCustomDeck();
            }}
            onEditCustomDeck={(deck) => {
              setShowDecksSheet(false);
              onEditCustomDeck(deck);
            }}
            embedded
          />
        </BottomSheet>

        <BottomSheet
          isOpen={showPassSettingsSheet}
          onClose={() => onSetShowPassSettingsSheet(false)}
          title="House Rules"
          subtitle="Impostors, timer & round options"
          icon={<SlidersHorizontal className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
          maxWidthClass="max-w-lg"
          testId="rules-bottom-sheet"
          footer={
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onSetShowPassSettingsSheet(false);
              }}
              className="w-full min-h-[48px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 cursor-pointer"
            >
              Save Rules
            </button>
          }
        >
          <SettingsDrawer
            settings={settings}
            playerCount={players.length}
            onUpdateSettings={onUpdateSettings}
            embedded
          />
        </BottomSheet>
      </>
    );
  }

  /* ============================================================================
     MAIN HOME SCREEN WITH 3-TAB BOTTOM DOCK (Play · Ranks · You)
     ============================================================================ */
  return (
    <div className="relative flex-1 flex flex-col">
      {/* Subtle Tactical Concentric Radar Backdrop (Finders Keepers aesthetic in Obsidian/Cyan) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -right-28 top-16 h-[420px] w-[420px] rounded-full border border-cyan-400/[0.06]" />
        <div className="absolute -right-12 top-32 h-[290px] w-[290px] rounded-full border border-cyan-400/[0.08]" />
        <div className="absolute right-6 top-48 h-[160px] w-[160px] rounded-full border border-rose-500/[0.07]" />
        <div className="absolute -left-36 bottom-24 h-[340px] w-[340px] rounded-full border border-white/[0.04]" />
      </div>

      {/* Active Tab Content */}
      <main className="relative z-10 mx-auto w-full max-w-xl lg:max-w-3xl flex-1 px-4 sm:px-6 pt-5 pb-28">
        {activeTab === 'play' && (
          <div data-testid="home-play-tab" className="space-y-6">
            {/* Hero Greeting */}
            <section className="space-y-1.5 pt-1">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F4F4F8]">
                {onlineProfile.name.trim() ? `Hi, ${onlineProfile.name.trim()}.` : 'Ready to bluff?'}
              </h1>
              <p className="text-sm sm:text-base text-[#8D8DA8]">
                Host a live room on separate phones, or pass one device around.
              </p>
            </section>

            {/* Primary Entry Actions (Online Multiplayer + Pass & Play) */}
            <section aria-label="Play Modes" className="space-y-2.5">
              {/* 1. Primary Cyan CTA: Host Online Room */}
              <button
                type="button"
                disabled={onlineLoading}
                data-testid="home-host-online-btn"
                onClick={() => {
                  playTapSound();
                  triggerHaptic(14);
                  onHostOnlineRoom();
                }}
                className="flex w-full min-h-[58px] items-center justify-center gap-2.5 rounded-2xl bg-cyan-400 px-5 font-display text-base font-extrabold text-[#061318] shadow-[0_12px_34px_rgba(34,211,238,0.25)] hover:bg-cyan-300 active:scale-[0.985] disabled:opacity-60 transition-all cursor-pointer"
              >
                <Plus className="h-5 w-5 stroke-[2.75]" aria-hidden="true" />
                <span>{onlineLoading ? 'Creating Room...' : 'Host Online Room'}</span>
              </button>

              {/* 2. Secondary Row: Join with a code + Pass & Play */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  data-testid="home-join-code-btn"
                  onClick={() => {
                    playTapSound();
                    triggerHaptic(10);
                    onOpenJoinModal();
                  }}
                  className="flex w-full min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#13131E] border border-white/[0.1] px-4 font-display text-sm sm:text-base font-bold text-[#F4F4F8] hover:border-cyan-400/45 hover:bg-[#191928] active:scale-[0.985] transition-all cursor-pointer"
                >
                  <KeyRound className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>Join with a code</span>
                </button>

                <button
                  type="button"
                  data-testid="home-pass-play-btn"
                  onClick={() => {
                    playTapSound();
                    triggerHaptic(10);
                    onEnterPassLobby();
                  }}
                  className="flex w-full min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#13131E] border border-white/[0.1] px-4 font-display text-sm sm:text-base font-bold text-[#F4F4F8] hover:border-rose-400/45 hover:bg-[#191928] active:scale-[0.985] transition-all cursor-pointer"
                >
                  <Smartphone className="h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
                  <span>Pass & Play (1 Phone)</span>
                </button>
              </div>

              {onlineError && (
                <p
                  role="alert"
                  className="rounded-2xl bg-rose-500/12 border border-rose-500/35 px-4 py-2.5 text-xs font-semibold text-rose-300"
                >
                  {onlineError}
                </p>
              )}

              {/* Quiet Inline Quick Links (Matching Finders Keepers) */}
              <div className="flex items-center justify-center gap-3 pt-1 text-xs font-semibold text-[#8D8DA8]">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onOpenHowToPlay();
                  }}
                  className="py-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  How to play
                </button>
                <span aria-hidden="true" className="text-[#4B4B64]">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onCreateCustomDeck();
                  }}
                  className="py-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Custom decks
                </button>
                <span aria-hidden="true" className="text-[#4B4B64]">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onOpenChangelog();
                  }}
                  className="py-1.5 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  What’s new
                </button>
              </div>
            </section>

            {/* Profile & Stats Summary Card (Matching Finders Keepers Home Card) */}
            <section
              aria-label="Player Profile Summary"
              className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-4 shadow-[0_18px_48px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-display font-bold text-white"
                    style={{
                      backgroundColor: `${onlineProfile.color}22`,
                      border: `1.5px solid ${onlineProfile.color}66`,
                    }}
                  >
                    {onlineProfile.emoji}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-extrabold text-[#F4F4F8] truncate">
                      {displayName}
                    </h2>
                    <p className="text-xs text-[#8D8DA8] truncate">
                      FaceTime, Discord & local play
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onChangeTab('you');
                  }}
                  className="flex min-h-[36px] items-center rounded-xl bg-white/[0.07] border border-white/[0.08] px-3.5 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.14] active:scale-[0.97] transition-all cursor-pointer shrink-0"
                >
                  Edit
                </button>
              </div>

              {/* 3-Column Tabular Stats */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#09090E] border border-white/[0.06] p-3.5 text-center">
                <div>
                  <p className="font-mono text-xl font-extrabold text-[#F4F4F8] tabular-nums">
                    {careerStats.roundsPlayed}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                    Rounds
                  </p>
                </div>
                <div className="border-x border-white/[0.06]">
                  <p className="font-mono text-xl font-extrabold text-cyan-300 tabular-nums">
                    {careerStats.wins}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                    Wins
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xl font-extrabold text-[#F4F4F8] tabular-nums">
                    {careerStats.points}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                    Points
                  </p>
                </div>
              </div>

              {/* Card Footer Metadata + Subtle Build Version Badge */}
              <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] font-medium text-[#787894]">
                <span className="truncate">
                  {decks.filter((d) => d.words.length > 0).length} Word ·{' '}
                  {decks.filter((d) => d.questions.length > 0).length} Question Decks · Free
                </span>
                <span
                  data-testid="version-badge"
                  className="font-mono text-[11px] font-semibold text-[#64647E] shrink-0"
                >
                  {APP_VERSION}
                </span>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'ranks' && (
          <div data-testid="home-ranks-tab" className="space-y-5">
            <section className="space-y-1">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F4F8]">
                Climb the boards.
              </h1>
              <p className="text-sm text-[#8D8DA8]">
                Crewmates earn +1 pt for catching Impostors · Surviving Impostors earn +2 pts.
              </p>
            </section>

            {/* Scoreboard Toggle Row */}
            <section className="flex items-center justify-between gap-4 rounded-2xl bg-[#13131E] border border-white/[0.08] px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#F4F4F8]">Track Session Scores</p>
                <p className="text-xs text-[#8D8DA8]">
                  Automatically award points after each round
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.scoreboardEnabled}
                onClick={() => {
                  playTapSound();
                  onUpdateSettings({ scoreboardEnabled: !settings.scoreboardEnabled });
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  settings.scoreboardEnabled ? 'bg-cyan-400' : 'bg-white/15'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    settings.scoreboardEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </section>

            {/* Leaderboard Table */}
            <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                <div className="flex items-center gap-4">
                  <span className="w-7">Pos</span>
                  <span>Player</span>
                </div>
                <span>Pts</span>
              </div>

              <ul className="divide-y divide-white/[0.06]">
                {rankedPlayers.map(({ player, points }, idx) => (
                  <li
                    key={player.id}
                    className={`flex items-center justify-between px-5 py-3.5 ${
                      idx === 0 && points > 0 ? 'bg-cyan-400/[0.06]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-7 font-mono text-xs font-extrabold tabular-nums ${
                          idx === 0 && points > 0 ? 'text-amber-300' : 'text-[#8D8DA8]'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{
                          backgroundColor: `${player.color}22`,
                          border: `1px solid ${player.color}55`,
                        }}
                      >
                        {player.emoji}
                      </span>
                      <span className="text-sm font-bold text-[#F4F4F8] truncate">
                        {player.name}
                      </span>
                    </div>
                    <span className="font-mono text-base font-extrabold text-cyan-300 tabular-nums shrink-0">
                      {points}
                    </span>
                  </li>
                ))}
              </ul>

              {hasAnyScores && (
                <div className="p-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onResetScores();
                    }}
                    className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset Session Scores</span>
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'you' && (
          <div data-testid="home-you-tab" className="space-y-5">
            {/* Profile Hero */}
            <section className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-display font-bold text-white shadow-lg"
                style={{
                  backgroundColor: `${onlineProfile.color}22`,
                  border: `2px solid ${onlineProfile.color}88`,
                }}
              >
                {onlineProfile.emoji}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F4F4F8] truncate">
                  {displayName}
                </h1>
                <p className="text-xs text-[#8D8DA8]">
                  Used automatically when hosting or joining online rooms
                </p>
              </div>
            </section>

            {/* 2x2 Career Stats Grid */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-2xl bg-[#13131E] border border-white/[0.08] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                  Rounds
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold text-[#F4F4F8] tabular-nums">
                  {careerStats.roundsPlayed}
                </p>
              </div>
              <div className="rounded-2xl bg-[#13131E] border border-white/[0.08] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                  Wins
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold text-cyan-300 tabular-nums">
                  {careerStats.wins}
                </p>
              </div>
              <div className="rounded-2xl bg-[#13131E] border border-white/[0.08] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                  Win Rate
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold text-[#F4F4F8] tabular-nums">
                  {winRate}%
                </p>
              </div>
              <div className="rounded-2xl bg-[#13131E] border border-white/[0.08] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                  Points
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold text-amber-300 tabular-nums">
                  {careerStats.points}
                </p>
              </div>
            </section>

            {/* Profile Callsign & Looks Card */}
            <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-4">
              <div>
                <label
                  htmlFor="profile-callsign-input"
                  className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D8DA8] mb-2"
                >
                  Display Name
                </label>
                <input
                  id="profile-callsign-input"
                  type="text"
                  value={onlineProfile.name}
                  onChange={(e) =>
                    onChangeOnlineProfile({ ...onlineProfile, name: e.target.value })
                  }
                  placeholder="Your name..."
                  maxLength={22}
                  className="w-full min-h-[48px] rounded-2xl bg-[#09090E] border border-white/[0.1] px-4 text-sm font-semibold text-[#F4F4F8] placeholder:text-[#666680] focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D8DA8]">
                  Accent Color
                </span>
                <div className="flex flex-wrap gap-2">
                  {PLAYER_AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onChangeOnlineProfile({ ...onlineProfile, color: c });
                      }}
                      aria-label={`Set profile color ${c}`}
                      className={`h-8 w-8 rounded-full transition-transform cursor-pointer ${
                        onlineProfile.color === c
                          ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#13131E]'
                          : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D8DA8]">
                  Avatar Icon
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PLAYER_AVATAR_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onChangeOnlineProfile({ ...onlineProfile, emoji: em });
                        setShowCustomProfileIcon(false);
                      }}
                      aria-label={`Set profile icon ${em}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg cursor-pointer ${
                        onlineProfile.emoji === em
                          ? 'bg-white/15 ring-1 ring-cyan-400'
                          : 'bg-[#09090E] border border-white/[0.06] hover:bg-white/[0.08]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}

                  {!PLAYER_AVATAR_EMOJIS.includes(onlineProfile.emoji) && (
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setShowCustomProfileIcon(true);
                        setCustomProfileIconDraft(onlineProfile.emoji);
                        window.setTimeout(() => customIconInputRef.current?.focus(), 60);
                      }}
                      aria-label={`Current custom icon ${onlineProfile.emoji}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-cyan-400 font-display text-lg font-bold text-[#F4F4F8] cursor-pointer"
                    >
                      {onlineProfile.emoji}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setShowCustomProfileIcon((v) => !v);
                      setCustomProfileIconDraft(
                        PLAYER_AVATAR_EMOJIS.includes(onlineProfile.emoji)
                          ? ''
                          : onlineProfile.emoji
                      );
                      window.setTimeout(() => customIconInputRef.current?.focus(), 60);
                    }}
                    aria-label="Add custom emoji, letter, or symbol"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-cyan-400/50 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                {showCustomProfileIcon && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const icon = extractSingleIcon(customProfileIconDraft);
                      if (!icon) return;
                      playTapSound();
                      onChangeOnlineProfile({ ...onlineProfile, emoji: icon });
                      setShowCustomProfileIcon(false);
                      setCustomProfileIconDraft('');
                    }}
                    className="flex items-center gap-2 pt-1.5"
                  >
                    <input
                      ref={customIconInputRef}
                      type="text"
                      value={customProfileIconDraft}
                      onChange={(e) => setCustomProfileIconDraft(e.target.value)}
                      placeholder="Any emoji, letter, or symbol..."
                      className="flex-1 min-h-[42px] rounded-xl bg-[#09090E] border border-cyan-400/40 px-3 text-sm text-[#F4F4F8] placeholder:text-[#666680] focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!extractSingleIcon(customProfileIconDraft)}
                      className="flex min-h-[42px] items-center gap-1 rounded-xl bg-cyan-400 px-3.5 text-xs font-extrabold text-[#061318] disabled:opacity-40 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Set</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomProfileIcon(false)}
                      aria-label="Cancel custom icon"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9898B0] hover:bg-white/[0.08] cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>
            </section>

            {/* Quick Management Links */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onEnterPassLobby();
                  setShowPlayersSheet(true);
                }}
                className="flex min-h-[54px] items-center justify-between rounded-2xl bg-[#13131E] border border-white/[0.08] px-4 text-left hover:border-cyan-400/35 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-[#F4F4F8]">Saved Crews</p>
                    <p className="text-[11px] text-[#8D8DA8]">
                      {groups.length} saved · {players.length} active
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#787894]" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onCreateCustomDeck();
                }}
                className="flex min-h-[54px] items-center justify-between rounded-2xl bg-[#13131E] border border-white/[0.08] px-4 text-left hover:border-cyan-400/35 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-rose-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-[#F4F4F8]">Custom Word Packs</p>
                    <p className="text-[11px] text-[#8D8DA8]">Create or import decks</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#787894]" aria-hidden="true" />
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Fixed Bottom 3-Tab Glass Navigation Dock (Play · Ranks · You) */}
      <nav
        aria-label="Primary Navigation"
        data-testid="bottom-tab-bar"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-[#0D0D15]/92 backdrop-blur-xl pb-safe-tight"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1.5 px-3 py-2">
          {(
            [
              { id: 'play', label: 'Play', Icon: Compass },
              { id: 'ranks', label: 'Ranks', Icon: Trophy },
              { id: 'you', label: 'You', Icon: User },
            ] as Array<{ id: HomeTab; label: string; Icon: React.ComponentType<{ className?: string }> }>
          ).map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                data-testid={`nav-tab-${id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (activeTab === id) return;
                  playTapSound();
                  triggerHaptic(8);
                  onChangeTab(id);
                }}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-400/14 text-cyan-300 border border-cyan-400/25'
                    : 'text-[#8484A0] hover:text-[#D6D6E6]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="text-[11px] font-bold tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
