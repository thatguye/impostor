import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Home,
  Layers,
  Link2,
  MessageCircleQuestion,
  MessageSquare,
  MessageSquareQuote,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Trophy,
  Type,
  Users,
  Volume2,
  VolumeX,
  Vote,
} from 'lucide-react';
import {
  CategoryDeck,
  GameMode,
  GameSettings,
  ImpostorCountMode,
  OnlineRoomState,
} from '../types/game';
import { ZERO_IMPOSTORS_VOTE, getAlivePlayerIds } from '../game/online';
import { calculateBalancedImpostorCount } from '../game/engine';
import { buildInviteUrl, formatSpacedCode } from '../utils/invite';
import { BottomSheet } from './BottomSheet';
import { SettingsDrawer } from './SettingsDrawer';
import { CategoryBrowser } from './CategoryBrowser';
import { QRCodeModal } from './QRCodeModal';
import { HoldToRevealCard } from './HoldToRevealCard';
import { FloatingGameHud } from './FloatingGameHud';
import { playCardFlipSound, playTapSound, triggerHaptic } from '../utils/audio';

interface OnlineRoomViewProps {
  room: OnlineRoomState;
  myPlayerId: string;
  allDecks: CategoryDeck[];
  isSyncing: boolean;
  realtimeStatus: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onForceSync: () => void;
  onLeaveRoom: () => void;
  onUpdateLobbyConfig: (patch: {
    settings?: GameSettings;
    selectedDeckIds?: string[];
  }) => void;
  onKickPlayer: (playerId: string) => void;
  onCreateCustomDeck: () => void;
  onEditCustomDeck: (deck: CategoryDeck) => void;
  onResetHistory: () => void;
  onStartRound: () => void;
  onWordReady: () => void;
  onForceDiscussion: () => void;
  onSubmitAnswer: (answer: string) => void;
  onTimerAction: (action: 'pause' | 'resume' | 'add30') => void;
  onStartVoting: () => void;
  onBackToDiscussion: () => void;
  onCastVote: (targetId: string) => void;
  onForceRevealVotes: () => void;
  onAdvanceAfterVote: () => void;
  onRevealAllRoles: () => void;
  onResetScores: () => void;
  onReturnToLobby: () => void;
}

const PHASE_HEADER_LABEL: Record<OnlineRoomState['phase'], string> = {
  lobby: 'Lobby',
  role_reveal: 'Secret Roles',
  discussion: 'Discussion',
  voting: 'Secret Vote',
  vote_results: 'Vote Results',
  round_summary: 'Summary',
};

export const OnlineRoomView: React.FC<OnlineRoomViewProps> = ({
  room,
  myPlayerId,
  allDecks,
  isSyncing,
  realtimeStatus,
  isMuted,
  onToggleMute,
  onForceSync,
  onLeaveRoom,
  onUpdateLobbyConfig,
  onKickPlayer,
  onCreateCustomDeck,
  onEditCustomDeck,
  onResetHistory,
  onStartRound,
  onWordReady,
  onForceDiscussion,
  onSubmitAnswer,
  onTimerAction,
  onStartVoting,
  onBackToDiscussion,
  onCastVote,
  onForceRevealVotes,
  onAdvanceAfterVote,
  onRevealAllRoles,
  onResetScores,
  onReturnToLobby,
}) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDecksSheet, setShowDecksSheet] = useState(false);
  const [showRulesSheet, setShowRulesSheet] = useState(false);
  const [confirmRevealAll, setConfirmRevealAll] = useState(false);

  // Word Mode local hold tracking
  const [isHoldingWord, setIsHoldingWord] = useState(false);
  const [hasPeekedWord, setHasPeekedWord] = useState(false);

  // Question Mode reveal + answer draft
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [answerDraft, setAnswerDraft] = useState('');
  const answerInputRef = useRef<HTMLInputElement | null>(null);

  // Secret voting draft
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);

  // Synced live countdown derived from authoritative room.timerEndsAt
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Reset per-round local card state when round changes
  useEffect(() => {
    setIsHoldingWord(false);
    setHasPeekedWord(false);
    setIsQuestionOpen(false);
    setAnswerDraft('');
    setSelectedVoteTarget(null);
    setConfirmRevealAll(false);
  }, [room.round?.id]);

  useEffect(() => {
    setSelectedVoteTarget(null);
    setConfirmRevealAll(false);
  }, [room.phase, room.voteOutcome?.revealedAt]);

  // Prevent accidental touchmove scrolling while viewing private card
  useEffect(() => {
    if (room.phase !== 'role_reveal') return;
    const preventTouchScroll = (e: TouchEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventTouchScroll);
    };
  }, [room.phase]);

  // Auto-focus question input
  useEffect(() => {
    if (room.phase === 'role_reveal' && room.round?.mode === 'question' && isQuestionOpen) {
      const t = window.setTimeout(() => answerInputRef.current?.focus(), 220);
      return () => window.clearTimeout(t);
    }
  }, [room.phase, room.round?.mode, isQuestionOpen]);

  // Compute remaining seconds from authoritative epoch timerEndsAt so backgrounding never drifts
  useEffect(() => {
    if (room.phase !== 'discussion' || room.settings.discussionTimer <= 0) {
      setSecondsLeft(0);
      return;
    }

    const compute = () => {
      if (room.timerPausedRemainingSec !== null) {
        setSecondsLeft(room.timerPausedRemainingSec);
      } else if (room.timerEndsAt) {
        setSecondsLeft(Math.max(0, Math.ceil((room.timerEndsAt - Date.now()) / 1000)));
      } else {
        setSecondsLeft(room.settings.discussionTimer);
      }
    };

    compute();
    const interval = window.setInterval(compute, 250);
    return () => window.clearInterval(interval);
  }, [
    room.phase,
    room.settings.discussionTimer,
    room.timerEndsAt,
    room.timerPausedRemainingSec,
  ]);

  const me = room.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost || room.hostId === myPlayerId;
  const playerMap = useMemo(() => new Map(room.players.map((p) => [p.id, p])), [room.players]);

  const effectiveDecks = useMemo(() => {
    const map = new Map<string, CategoryDeck>();
    for (const d of allDecks) map.set(d.id, d);
    for (const d of room.customDecks) map.set(d.id, d);
    return Array.from(map.values());
  }, [allDecks, room.customDecks]);

  const handleCopy = async (kind: 'code' | 'link') => {
    playTapSound();
    triggerHaptic(10);
    try {
      const text =
        kind === 'code'
          ? room.code
          : buildInviteUrl(window.location.origin, room.code);
      await navigator.clipboard.writeText(text);
      setCopiedType(kind);
      window.setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  /* ============================================================================
     UNIFIED FINDERS KEEPERS-STYLE TOP BAR
     ============================================================================ */
  const topBar = (
    <header className="sticky top-0 z-30 w-full bg-[#09090E]/92 backdrop-blur-xl border-b border-white/[0.06] pt-safe">
      <div className="mx-auto flex h-15 max-w-4xl items-center justify-between gap-2 px-4 sm:px-6">
        {/* Left: Back / Leave */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onLeaveRoom();
          }}
          aria-label="Leave Online Room"
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 text-xs font-bold text-[#D6D6E6] hover:bg-rose-500/15 hover:border-rose-500/35 hover:text-rose-200 active:scale-[0.97] transition-all shrink-0 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Leave</span>
        </button>

        {/* Center: Phase Title + Live Dot */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
            }`}
            title={realtimeStatus === 'SUBSCRIBED' ? 'Live Sync Active' : 'Reconnecting...'}
          />
          <span className="font-display text-sm sm:text-base font-extrabold text-[#F4F4F8] truncate">
            {PHASE_HEADER_LABEL[room.phase]}
          </span>
          <span
            data-testid="online-room-code"
            className="hidden sm:inline font-mono text-xs font-bold text-cyan-300 tracking-wider"
          >
            · {room.code}
          </span>
        </div>

        {/* Right: QR, Sync, Mute */}
        <div className="flex items-center gap-1.5 shrink-0">
          {room.phase === 'lobby' && (
            <button
              type="button"
              data-testid="open-qr-modal-btn"
              onClick={() => {
                playTapSound();
                setShowQRModal(true);
              }}
              aria-label="Show Room QR Code"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-cyan-300 hover:bg-white/[0.12] active:scale-[0.96] transition-all cursor-pointer"
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onForceSync();
            }}
            aria-label="Sync Room State"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#C8C8DC] hover:bg-white/[0.12] active:scale-[0.96] transition-all cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#C8C8DC] hover:bg-white/[0.12] active:scale-[0.96] transition-all cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-rose-400" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );

  /* ============================================================================
     PHASE 1: ONLINE ROOM LOBBY (Finders Keepers Card Architecture)
     ============================================================================ */
  if (room.phase === 'lobby') {
    const selectedSet = new Set(room.selectedDeckIds);
    const validDecksForMode = effectiveDecks.filter(
      (d) =>
        selectedSet.has(d.id) &&
        (room.settings.mode === 'word' ? d.words.length > 0 : d.questions.length > 0)
    );
    const totalPrompts = validDecksForMode.reduce(
      (sum, d) => sum + (room.settings.mode === 'word' ? d.words.length : d.questions.length),
      0
    );

    const canStartError =
      room.players.length < 3
        ? `Need at least 3 players in the room (${room.players.length}/3).`
        : validDecksForMode.length === 0
        ? `Select at least one deck with ${room.settings.mode === 'word' ? 'words' : 'questions'}.`
        : null;

    const handleModeSwitch = (mode: GameMode) => {
      if (!isHost || room.settings.mode === mode) return;
      playTapSound();
      triggerHaptic(10);
      onUpdateLobbyConfig({ settings: { ...room.settings, mode } });
    };

    const handleToggleDeck = (deckId: string) => {
      if (!isHost) return;
      const next = selectedSet.has(deckId)
        ? room.selectedDeckIds.filter((id) => id !== deckId)
        : [...room.selectedDeckIds, deckId];
      onUpdateLobbyConfig({ selectedDeckIds: next });
    };

    const handleSelectAllDecks = () => {
      if (!isHost) return;
      const validIds = effectiveDecks
        .filter((d) => (room.settings.mode === 'word' ? d.words.length > 0 : d.questions.length > 0))
        .map((d) => d.id);
      onUpdateLobbyConfig({ selectedDeckIds: validIds });
    };

    const balancedCount = calculateBalancedImpostorCount(Math.max(3, room.players.length));
    const impostorSummary =
      room.settings.impostorCountMode === 'standard'
        ? `${room.settings.impostorCount} Impostor${room.settings.impostorCount === 1 ? '' : 's'}`
        : room.settings.impostorCountMode === 'balanced'
        ? `Balanced (${balancedCount})`
        : 'Chaos Mystery';

    return (
      <>
        {topBar}
        <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-4 pb-36 space-y-3.5">
          {/* 1. ROOM CODE & INVITE CARD */}
          <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-4 shadow-[0_14px_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400">
                  Room Code · {isHost ? 'Hosting' : 'Joined'}
                </p>
                <h1
                  data-testid="lobby-spaced-room-code"
                  className="mt-1 font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.2em] text-white"
                >
                  {formatSpacedCode(room.code)}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setShowQRModal(true);
                }}
                data-testid="lobby-show-qr-btn"
                className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-white/[0.07] border border-white/[0.1] px-3 text-xs font-bold text-[#F4F4F8] hover:border-cyan-400/45 hover:bg-white/[0.12] active:scale-[0.97] transition-all cursor-pointer shrink-0"
              >
                <QrCode className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span>QR Code</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => void handleCopy('code')}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#09090E] border border-white/[0.09] px-3 text-xs font-bold text-[#F4F4F8] hover:border-cyan-400/40 active:scale-[0.98] transition-all cursor-pointer"
              >
                {copiedType === 'code' ? (
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                )}
                <span>{copiedType === 'code' ? 'Code Copied' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopy('link')}
                data-testid="copy-invite-link-btn"
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-cyan-400/14 border border-cyan-400/35 px-3 text-xs font-bold text-cyan-300 hover:bg-cyan-400/22 active:scale-[0.98] transition-all cursor-pointer"
              >
                {copiedType === 'link' ? (
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{copiedType === 'link' ? 'Link Copied' : 'Copy Invite Link'}</span>
              </button>
            </div>
          </section>

          {/* 2. LIVE PLAYERS CARD */}
          <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                  Players ({room.players.length})
                </h2>
              </div>
              <span className="text-xs text-[#787894]">
                {room.players.length < 3 ? `Need ${3 - room.players.length} more` : 'Ready'}
              </span>
            </div>

            <ul className="divide-y divide-white/[0.06]">
              <AnimatePresence initial={false}>
                {room.players.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold text-[#F4F4F8]"
                        style={{
                          backgroundColor: `${p.color}22`,
                          border: `1.5px solid ${p.color}66`,
                        }}
                      >
                        {p.emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#F4F4F8] truncate">
                            {p.name}
                          </span>
                          {p.id === myPlayerId && (
                            <span className="text-[11px] font-semibold text-cyan-400">(You)</span>
                          )}
                        </div>
                        {p.isHost && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                            <Crown className="h-3 w-3" aria-hidden="true" />
                            <span>Host</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {isHost && p.id !== myPlayerId && (
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          onKickPlayer(p.id);
                        }}
                        aria-label={`Remove ${p.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7C7C96] hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>

          {/* 3. GAME MODE CARD */}
          <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                Game Mode
              </span>
              {!isHost && <span className="text-[11px] text-[#787894]">Host controlled</span>}
            </div>

            <div
              role="tablist"
              aria-label="Online Game Mode"
              className="grid grid-cols-2 gap-2 rounded-2xl bg-[#09090E] p-1.5 border border-white/[0.06]"
            >
              <button
                type="button"
                role="tab"
                disabled={!isHost}
                aria-selected={room.settings.mode === 'word'}
                onClick={() => handleModeSwitch('word')}
                className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-[13px] sm:text-sm font-bold whitespace-nowrap transition-all ${
                  room.settings.mode === 'word'
                    ? 'bg-[#1B1B2A] text-cyan-300 border border-cyan-400/35 shadow-sm'
                    : 'text-[#8D8DA8]'
                } ${isHost ? 'cursor-pointer hover:text-[#F4F4F8]' : 'cursor-default'}`}
              >
                <Type className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Word Game</span>
              </button>
              <button
                type="button"
                role="tab"
                disabled={!isHost}
                aria-selected={room.settings.mode === 'question'}
                onClick={() => handleModeSwitch('question')}
                className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-[13px] sm:text-sm font-bold whitespace-nowrap transition-all ${
                  room.settings.mode === 'question'
                    ? 'bg-[#1B1B2A] text-rose-300 border border-rose-500/35 shadow-sm'
                    : 'text-[#8D8DA8]'
                } ${isHost ? 'cursor-pointer hover:text-[#F4F4F8]' : 'cursor-default'}`}
              >
                <MessageCircleQuestion className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Question Game</span>
              </button>
            </div>
          </section>

          {/* 4. CATEGORY DECKS CARD */}
          <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                  Category Decks
                </span>
              </div>
              {isHost && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowDecksSheet(true);
                  }}
                  className="flex min-h-[36px] items-center gap-1 rounded-xl bg-white/[0.07] border border-white/[0.08] px-3 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.13] cursor-pointer"
                >
                  <span>Change</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#9898B0]" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="rounded-2xl bg-[#09090E] border border-white/[0.07] px-4 py-3">
              <p className="font-display text-sm font-bold text-[#F4F4F8] truncate">
                {validDecksForMode.length === 0
                  ? 'No decks selected'
                  : validDecksForMode
                      .slice(0, 3)
                      .map((d) => `${d.emoji} ${d.name}`)
                      .join(' · ')}
                {validDecksForMode.length > 3 ? ` +${validDecksForMode.length - 3} more` : ''}
              </p>
              <p className="mt-0.5 font-mono text-xs text-[#8D8DA8] tabular-nums">
                {validDecksForMode.length} selected · {totalPrompts}{' '}
                {room.settings.mode === 'word' ? 'words' : 'questions'} ready
              </p>
            </div>
          </section>

          {/* 5. HOUSE RULES CARD */}
          <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                  House Rules
                </span>
              </div>
              {isHost && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowRulesSheet(true);
                  }}
                  className="flex min-h-[36px] items-center gap-1 rounded-xl bg-white/[0.07] border border-white/[0.08] px-3 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.13] cursor-pointer"
                >
                  <span>Customize</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#9898B0]" aria-hidden="true" />
                </button>
              )}
            </div>

            {isHost && (
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
                      onUpdateLobbyConfig({
                        settings: { ...room.settings, impostorCountMode: opt.id },
                      });
                    }}
                    aria-pressed={room.settings.impostorCountMode === opt.id}
                    className={`min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      room.settings.impostorCountMode === opt.id
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
            )}

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#9898B0]">
              <span className="font-semibold text-[#D6D6E6]">{impostorSummary}</span>
              <span aria-hidden="true">·</span>
              <span>
                {room.settings.discussionTimer === 0
                  ? 'No Timer'
                  : `${room.settings.discussionTimer / 60}m Timer`}
              </span>
              {room.settings.mode === 'word' && room.settings.impostorHints && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Hints On</span>
                </>
              )}
              {room.settings.survivalMode && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-300">Survival</span>
                </>
              )}
            </div>
          </section>
        </main>

        {/* Sticky Bottom Start CTA / Guest Waiting Pill */}
        <div className="fixed inset-x-0 bottom-0 z-30 bg-[#09090E]/95 backdrop-blur-xl border-t border-white/[0.07] pt-3 pb-safe px-4">
          <div className="mx-auto max-w-2xl space-y-2">
            {isHost ? (
              <>
                {canStartError && (
                  <p role="alert" className="text-center text-xs font-semibold text-rose-400">
                    {canStartError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={!!canStartError}
                  onClick={() => {
                    playTapSound();
                    triggerHaptic(16);
                    onStartRound();
                  }}
                  className="flex w-full min-h-[56px] items-center justify-center gap-2.5 rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] shadow-[0_12px_36px_rgba(34,211,238,0.28)] hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-45 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                  <span>Start Game</span>
                </button>
              </>
            ) : (
              <div className="rounded-2xl bg-[#13131E] border border-cyan-400/30 px-4 py-3.5 text-center shadow-lg">
                <p className="text-xs font-bold text-cyan-300">
                  Waiting for {room.players.find((p) => p.isHost)?.name ?? 'Host'} to start the
                  round...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modals & Slide-Up Sheets */}
        <QRCodeModal
          isOpen={showQRModal}
          roomCode={room.code}
          onClose={() => setShowQRModal(false)}
        />

        {isHost && (
          <>
            <BottomSheet
              isOpen={showDecksSheet}
              onClose={() => setShowDecksSheet(false)}
              title="Category Decks"
              subtitle={`${validDecksForMode.length} selected · ${totalPrompts} ready`}
              icon={<Layers className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
              maxWidthClass="max-w-2xl"
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
                decks={effectiveDecks}
                selectedDeckIds={room.selectedDeckIds}
                mode={room.settings.mode}
                usedHistory={room.usedHistory}
                onToggleDeck={handleToggleDeck}
                onSelectAll={handleSelectAllDecks}
                onDeselectAll={() => onUpdateLobbyConfig({ selectedDeckIds: [] })}
                onResetHistory={onResetHistory}
                onCreateCustomDeck={() => {
                  setShowDecksSheet(false);
                  onCreateCustomDeck();
                }}
                onEditCustomDeck={(deck) => {
                  setShowDecksSheet(false);
                  onEditCustomDeck(deck);
                }}
              />
            </BottomSheet>

            <BottomSheet
              isOpen={showRulesSheet}
              onClose={() => setShowRulesSheet(false)}
              title="House Rules"
              subtitle="Live-synced with everyone in the room"
              icon={<SlidersHorizontal className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
              maxWidthClass="max-w-lg"
              footer={
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowRulesSheet(false);
                  }}
                  className="w-full min-h-[48px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 cursor-pointer"
                >
                  Save Rules
                </button>
              }
            >
              <SettingsDrawer
                settings={room.settings}
                playerCount={Math.max(3, room.players.length)}
                onUpdateSettings={(patch) =>
                  onUpdateLobbyConfig({ settings: { ...room.settings, ...patch } })
                }
                embedded
              />
            </BottomSheet>
          </>
        )}
      </>
    );
  }

  const round = room.round;
  if (!round) return null;

  /* ============================================================================
     PHASE 2: PRIVATE PER-DEVICE ROLE / QUESTION REVEAL
     ============================================================================ */
  if (room.phase === 'role_reveal') {
    const myAssignment = round.assignments[myPlayerId];
    const isWordMode = round.mode === 'word';
    const readySet = new Set(room.readyPlayerIds);
    const isMeReady = readySet.has(myPlayerId);
    const hasMyAnswer = (round.submittedAnswers[myPlayerId] ?? '').trim().length > 0;
    const totalPlayers = round.playerOrder.length;
    const readyCount = isWordMode
      ? room.readyPlayerIds.length
      : round.playerOrder.filter((id) => (round.submittedAnswers[id] ?? '').trim().length > 0)
          .length;

    return (
      <>
        {topBar}
        <main className="mx-auto flex flex-1 min-h-0 w-full max-w-lg flex-col items-center justify-between overflow-hidden overscroll-none px-5 py-3 pb-safe touch-none">
          {/* Top Progress */}
          <div className="w-full shrink-0 space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#9898B0]">
              <span>
                {round.categoryEmoji} {round.categoryName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {readyCount} / {totalPlayers} {isWordMode ? 'Ready' : 'Answered'}
              </span>
            </div>

            <div className="flex gap-1.5" aria-hidden="true">
              {round.playerOrder.map((pid) => {
                const done = isWordMode
                  ? readySet.has(pid)
                  : (round.submittedAnswers[pid] ?? '').trim().length > 0;
                return (
                  <div
                    key={pid}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      done ? 'bg-cyan-400' : 'bg-white/15'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Center Private Card */}
          <div className="my-2 flex w-full flex-1 min-h-0 flex-col items-center justify-center overflow-hidden">
            {!myAssignment ? (
              <div className="rounded-3xl bg-[#13131E] border border-white/10 p-6 text-center space-y-2">
                <p className="text-sm font-bold text-[#F4F4F8]">Spectating This Round</p>
                <p className="text-xs text-[#9898B0]">
                  Waiting for players to finish viewing their roles...
                </p>
              </div>
            ) : isWordMode ? (
              <div className="w-full space-y-3 touch-none">
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-[#F4F4F8]">
                    {me?.emoji} Your Secret Card
                  </p>
                  <p className="text-xs text-[#9898B0]">
                    {isHoldingWord
                      ? 'Release immediately to hide your role.'
                      : 'Press and hold on your screen to peek privately.'}
                  </p>
                </div>

                <HoldToRevealCard
                  assignment={myAssignment}
                  categoryEmoji={round.categoryEmoji}
                  categoryName={round.categoryName}
                  subtitle="Only visible on your device while holding."
                  testId="online-hold-reveal-card"
                  onHoldingChange={setIsHoldingWord}
                  onPeeked={() => setHasPeekedWord(true)}
                />
              </div>
            ) : (
              /* QUESTION MODE ON OWN DEVICE */
              <div className="w-full space-y-3">
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-[#F4F4F8]">
                    {me?.emoji} Your Secret Question
                  </p>
                  <p className="text-xs text-[#9898B0]">
                    {hasMyAnswer
                      ? 'Answer locked in! Waiting for everyone else...'
                      : isQuestionOpen
                      ? 'Type your answer privately below.'
                      : 'Tap the card below to reveal your prompt and submit your answer.'}
                  </p>
                </div>

                {hasMyAnswer ? (
                  <div className="rounded-[28px] bg-[#0F1D24] border border-cyan-400/40 p-7 text-center space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                      <Check className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-white">Answer Submitted!</h2>
                    <p className="text-xs text-[#9898B0]">
                      All answers reveal simultaneously once everyone submits ({readyCount}/
                      {totalPlayers}).
                    </p>
                  </div>
                ) : (
                  <div className="perspective-1200 w-full">
                    <div
                      className={`card-flip-inner preserve-3d relative w-full h-[min(380px,52dvh)] ${
                        isQuestionOpen ? 'rotate-y-180' : ''
                      }`}
                    >
                      <div
                        aria-hidden={isQuestionOpen}
                        className={`backface-hidden absolute inset-0 ${
                          isQuestionOpen ? 'pointer-events-none' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(14);
                            playCardFlipSound(true);
                            setIsQuestionOpen(true);
                          }}
                          className="flex h-full w-full flex-col items-center justify-center rounded-[28px] bg-[#13131E] border-2 border-white/[0.1] p-6 text-center shadow-2xl hover:border-cyan-400/40 cursor-pointer"
                        >
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.1] text-cyan-400 mb-4">
                            <MessageSquareText className="h-9 w-9" aria-hidden="true" />
                          </div>
                          <h2 className="font-display text-2xl font-extrabold text-[#F4F4F8]">
                            Tap to Reveal Question
                          </h2>
                          <p className="mt-2 max-w-xs text-xs text-[#9898B0]">
                            Your prompt & answer stay private on your screen.
                          </p>
                        </button>
                      </div>

                      <div
                        aria-hidden={!isQuestionOpen}
                        className={`backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-[28px] bg-[#0C1C26] border-2 border-cyan-400/75 p-5 shadow-2xl ${
                          !isQuestionOpen ? 'pointer-events-none' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#9898B0] truncate">
                            {round.categoryEmoji} {round.categoryName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              playCardFlipSound(false);
                              setIsQuestionOpen(false);
                            }}
                            className="flex min-h-[34px] items-center gap-1.5 rounded-xl bg-white/[0.08] px-3 text-xs font-semibold text-[#D6D6E6] cursor-pointer"
                          >
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Hide</span>
                          </button>
                        </div>

                        <div className="my-auto space-y-2 text-center py-2">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
                            Your Secret Question
                          </p>
                          <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                            “{myAssignment.promptQuestion}”
                          </h2>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = answerDraft.trim();
                            if (!trimmed) return;
                            triggerHaptic(14);
                            playCardFlipSound(false);
                            onSubmitAnswer(trimmed);
                            setIsQuestionOpen(false);
                            setAnswerDraft('');
                          }}
                          className="space-y-2.5"
                        >
                          <input
                            ref={answerInputRef}
                            type="text"
                            value={answerDraft}
                            onChange={(e) => setAnswerDraft(e.target.value)}
                            placeholder="Type your answer..."
                            maxLength={80}
                            autoComplete="off"
                            className="w-full min-h-[48px] rounded-2xl bg-[#09090E] border border-white/[0.14] px-4 text-base text-[#F4F4F8] placeholder:text-[#75758E] focus:border-cyan-400 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!answerDraft.trim()}
                            className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 disabled:bg-white/[0.08] disabled:text-[#666680] cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
                            <span>Lock In Secret Answer</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Ready & Waiting Status */}
          <div className="w-full shrink-0 space-y-2 pt-1">
            {isWordMode && myAssignment && (
              <button
                type="button"
                disabled={!hasPeekedWord || isHoldingWord || isMeReady}
                onClick={() => {
                  playTapSound();
                  triggerHaptic(12);
                  onWordReady();
                }}
                className={`w-full min-h-[52px] rounded-2xl font-display text-sm font-extrabold transition-all cursor-pointer disabled:cursor-not-allowed ${
                  isMeReady
                    ? 'bg-emerald-400/18 border border-emerald-400/40 text-emerald-300'
                    : 'bg-cyan-400 text-[#061318] hover:bg-cyan-300 disabled:bg-white/[0.08] disabled:text-[#666680]'
                }`}
              >
                {isMeReady ? `Ready ✓ (${readyCount}/${totalPlayers})` : 'I’m Ready for Discussion'}
              </button>
            )}

            {isHost && readyCount < totalPlayers && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onForceDiscussion();
                }}
                className="w-full min-h-[40px] rounded-xl text-xs font-semibold text-[#8D8DA8] hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                Host: Skip Wait & Start Discussion ({readyCount}/{totalPlayers})
              </button>
            )}
          </div>
        </main>
      </>
    );
  }

  /* ============================================================================
     PHASE 3: LIVE SYNCED DISCUSSION WITH FLOATING GAME HUD
     ============================================================================ */
  if (room.phase === 'discussion') {
    const startingPlayer = playerMap.get(round.startingPlayerId);
    const aliveIds = getAlivePlayerIds(room);
    const activePlayers = aliveIds
      .map((id) => playerMap.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p);
    const eliminatedPlayers = round.eliminatedOrder
      .map((id) => playerMap.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p);
    const timerEnabled = room.settings.discussionTimer > 0;
    const isPaused = room.timerPausedRemainingSec !== null;
    const isTimeUp = timerEnabled && secondsLeft === 0;
    const impostorLabel = round.hideImpostorCount
      ? 'Chaos Mystery Impostors'
      : `${round.impostorCount} ${round.impostorCount === 1 ? 'Impostor' : 'Impostors'}`;

    return (
      <>
        {topBar}
        <main className="mx-auto flex min-h-[calc(100dvh-60px)] w-full max-w-2xl flex-col justify-between px-4 sm:px-6 py-3 pb-safe gap-4">
          <div className="space-y-4">
            {/* Floating Top Status Pill HUD */}
            <FloatingGameHud
              phaseLabel={round.mode === 'question' ? 'Answers' : 'Clues'}
              roundNumber={round.roundNumber}
              mode={round.mode}
              categoryEmoji={round.categoryEmoji}
              categoryName={round.categoryName}
              impostorLabel={impostorLabel}
              isChaosHidden={round.hideImpostorCount}
              timerEnabled={timerEnabled}
              secondsLeft={secondsLeft}
              isPaused={isPaused}
              speakerName={
                round.mode === 'word' && round.eliminatedOrder.length === 0
                  ? startingPlayer?.name ?? null
                  : null
              }
              speakerEmoji={
                round.mode === 'word' && round.eliminatedOrder.length === 0
                  ? startingPlayer?.emoji ?? null
                  : null
              }
            />

            {/* Host Timer Controls */}
            {timerEnabled && isHost && (
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#13131E] border border-white/[0.08] px-3.5 py-2.5">
                <span className="text-xs font-semibold text-[#9898B0]">
                  {isTimeUp
                    ? 'Time is up — Start voting!'
                    : isPaused
                    ? 'Synced timer paused'
                    : 'Synced room timer'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTimeUp}
                    onClick={() => {
                      playTapSound();
                      onTimerAction(isPaused ? 'resume' : 'pause');
                    }}
                    className="flex min-h-[38px] items-center gap-1.5 rounded-xl bg-white/[0.08] px-3.5 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.14] disabled:opacity-40 cursor-pointer"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onTimerAction('add30');
                    }}
                    className="flex min-h-[38px] items-center gap-1 rounded-xl bg-cyan-400/12 border border-cyan-400/25 px-3 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>30s</span>
                  </button>
                </div>
              </div>
            )}

            {/* Word Mode Starting Speaker */}
            {round.mode === 'word' && startingPlayer && round.eliminatedOrder.length === 0 && (
              <section className="flex items-center justify-between gap-4 rounded-[24px] bg-[#13131E] border border-white/[0.08] px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{
                      backgroundColor: `${startingPlayer.color}22`,
                      border: `1.5px solid ${startingPlayer.color}66`,
                    }}
                  >
                    {startingPlayer.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-400">
                      Speaking Order
                    </p>
                    <p className="font-display text-base font-extrabold text-[#F4F4F8] truncate">
                      {startingPlayer.name} speaks first
                    </p>
                  </div>
                </div>
                <MessageSquare className="h-4 w-4 text-[#75758E] shrink-0" aria-hidden="true" />
              </section>
            )}

            {/* Question Mode Answers */}
            {round.mode === 'question' && (
              <>
                <section className="rounded-[26px] bg-[#13131E] border border-cyan-400/35 p-5 text-center space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400">
                    The Real Question
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-extrabold text-white leading-snug">
                    “{round.mainQuestion}”
                  </p>
                </section>

                <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#9898B0] px-1">
                    <span className="flex items-center gap-1.5 font-semibold text-[#D6D6E6]">
                      <MessageSquareQuote className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                      <span>Everyone’s Answers ({activePlayers.length})</span>
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {activePlayers.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-[#09090E] border border-white/[0.07] px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                          <span className="text-lg">{p.emoji}</span>
                          <span className="text-sm font-bold text-[#D6D6E6] truncate max-w-[120px]">
                            {p.name}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white text-right break-words min-w-0">
                          “{round.submittedAnswers[p.id] || '—'}”
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {/* Word Mode Active Roster */}
            {round.mode === 'word' && (
              <section className="rounded-[24px] bg-[#13131E] border border-white/[0.08] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#9898B0]">
                  <span className="flex items-center gap-1.5 font-semibold text-[#D6D6E6]">
                    <Users className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                    <span>In the Round ({activePlayers.length})</span>
                  </span>
                  {eliminatedPlayers.length > 0 && (
                    <span className="text-rose-300 font-medium">
                      {eliminatedPlayers.length} eliminated
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activePlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-xl bg-[#09090E] border border-white/[0.08] px-3 py-1.5 text-xs font-bold text-[#F4F4F8]"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                  {eliminatedPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#666680] line-through"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Bottom Host Actions */}
          <div className="space-y-2.5 pt-2">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    triggerHaptic(14);
                    onStartVoting();
                  }}
                  className="flex w-full min-h-[56px] items-center justify-center gap-2.5 rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] shadow-[0_12px_34px_rgba(34,211,238,0.24)] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Vote className="h-5 w-5" aria-hidden="true" />
                  <span>Start Secret Voting</span>
                </button>

                {!confirmRevealAll ? (
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setConfirmRevealAll(true);
                    }}
                    className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-[#9898B0] hover:bg-white/[0.1] hover:text-white cursor-pointer"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    <span>Reveal All Roles</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmRevealAll(false)}
                      className="min-h-[46px] flex-1 rounded-2xl bg-white/[0.06] text-xs font-semibold text-[#D6D6E6] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onRevealAllRoles();
                      }}
                      className="min-h-[46px] flex-1 rounded-2xl bg-rose-500 text-xs font-bold text-white cursor-pointer"
                    >
                      Confirm Reveal All
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl bg-[#13131E] border border-white/[0.08] px-4 py-3.5 text-center">
                <p className="text-xs font-semibold text-[#9898B0]">
                  Discuss with your group! Host will open secret voting when ready.
                </p>
              </div>
            )}
          </div>
        </main>
      </>
    );
  }

  /* ============================================================================
     PHASE 4: SYNCED SECRET VOTING ON OWN DEVICE
     ============================================================================ */
  if (room.phase === 'voting') {
    const aliveIds = getAlivePlayerIds(room);
    const activePlayers = aliveIds
      .map((id) => playerMap.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p);
    const isMeAlive = aliveIds.includes(myPlayerId);
    const myLockedVote = room.votes[myPlayerId] ?? null;
    const votedCount = aliveIds.filter((id) => !!room.votes[id]).length;

    return (
      <>
        {topBar}
        <main className="mx-auto flex min-h-[calc(100dvh-60px)] w-full max-w-2xl flex-col justify-between px-4 sm:px-6 py-4 pb-safe gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              {isHost ? (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onBackToDiscussion();
                  }}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 text-xs font-bold text-[#D6D6E6] hover:bg-white/[0.1] cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Discussion</span>
                </button>
              ) : (
                <span />
              )}

              {/* Live X / Y Voted Indicator */}
              <div
                data-testid="online-vote-progress"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400/12 border border-cyan-400/30 px-3 py-1.5 font-mono text-xs font-extrabold text-cyan-300 tabular-nums"
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {votedCount} / {aliveIds.length} voted
                </span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h1 className="font-display text-3xl font-extrabold text-[#F4F4F8] tracking-tight">
                Cast Your Secret Vote
              </h1>
              <p className="text-sm text-[#8D8DA8]">
                {myLockedVote
                  ? 'Vote locked! Results reveal simultaneously once everyone votes.'
                  : isMeAlive
                  ? 'Votes stay hidden until everyone submits.'
                  : 'You were eliminated — watching live vote progress.'}
              </p>
            </div>

            {myLockedVote ? (
              <div className="rounded-[28px] bg-[#0F1D24] border border-cyan-400/40 p-7 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                  <Check className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="font-display text-xl font-bold text-white">Secret Vote Cast</h2>
                <p className="text-xs text-[#9898B0]">
                  Waiting for {Math.max(0, aliveIds.length - votedCount)} remaining{' '}
                  {aliveIds.length - votedCount === 1 ? 'player' : 'players'}...
                </p>
              </div>
            ) : isMeAlive ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activePlayers.map((player) => {
                    const isSelected = selectedVoteTarget === player.id;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          triggerHaptic(10);
                          setSelectedVoteTarget(isSelected ? null : player.id);
                        }}
                        aria-pressed={isSelected}
                        className={`flex min-h-[70px] items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.985] cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-500/10'
                            : 'bg-[#13131E] border-white/[0.08] hover:border-white/[0.2]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
                            style={{
                              backgroundColor: `${player.color}22`,
                              border: `1px solid ${player.color}55`,
                            }}
                          >
                            {player.emoji}
                          </span>
                          <span className="font-display text-base font-bold text-[#F4F4F8] truncate">
                            {player.name}
                          </span>
                        </div>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'border-white/25'
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {round.hideImpostorCount && (
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedVoteTarget(
                        selectedVoteTarget === ZERO_IMPOSTORS_VOTE ? null : ZERO_IMPOSTORS_VOTE
                      );
                    }}
                    className={`flex w-full min-h-[50px] items-center justify-center gap-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedVoteTarget === ZERO_IMPOSTORS_VOTE
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                        : 'bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400/15'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Vote: Nobody is an Impostor (Chaos Call)</span>
                  </button>
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-2.5 pt-2">
            {isMeAlive && !myLockedVote && (
              <button
                type="button"
                disabled={!selectedVoteTarget}
                onClick={() => {
                  if (!selectedVoteTarget) return;
                  playTapSound();
                  triggerHaptic(16);
                  onCastVote(selectedVoteTarget);
                }}
                className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-rose-500 font-display text-base font-extrabold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400 disabled:bg-white/[0.08] disabled:text-[#666680] active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Vote className="h-5 w-5" aria-hidden="true" />
                <span>Lock In Secret Vote</span>
              </button>
            )}

            {isHost && votedCount > 0 && votedCount < aliveIds.length && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onForceRevealVotes();
                }}
                className="w-full min-h-[42px] rounded-xl text-xs font-semibold text-[#8D8DA8] hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                Host: Reveal Votes Now ({votedCount}/{aliveIds.length})
              </button>
            )}
          </div>
        </main>
      </>
    );
  }

  /* ============================================================================
     PHASE 5: SIMULTANEOUS ANIMATED VOTE RESULTS & ELIMINATION REVEAL
     ============================================================================ */
  if (room.phase === 'vote_results' && room.voteOutcome) {
    const outcome = room.voteOutcome;
    const eliminatedPlayer = outcome.eliminatedPlayerId
      ? playerMap.get(outcome.eliminatedPlayerId)
      : null;
    const eliminatedAssignment = outcome.eliminatedPlayerId
      ? round.assignments[outcome.eliminatedPlayerId]
      : null;
    const wasImpostor = !!eliminatedAssignment?.isImpostor;

    const totalCastVotes = Object.values(outcome.tallies).reduce((acc, n) => acc + n, 0);
    const tallyEntries = Object.entries(outcome.tallies).sort((a, b) => b[1] - a[1]);

    return (
      <>
        {topBar}
        <main className="mx-auto flex min-h-[calc(100dvh-60px)] w-full max-w-2xl flex-col justify-between px-4 sm:px-6 py-5 pb-safe gap-5">
          <div className="space-y-4">
            {/* Outcome Hero Banner */}
            <motion.section
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className={`rounded-[28px] border-2 p-6 text-center space-y-3 shadow-2xl ${
                outcome.isTie
                  ? 'bg-[#171625] border-amber-400/50'
                  : wasImpostor
                  ? 'bg-[#210D16] border-rose-500/75'
                  : 'bg-[#0C1C26] border-cyan-400/65'
              }`}
            >
              {outcome.isTie ? (
                <>
                  <h1 className="font-display text-3xl font-extrabold text-amber-300">
                    Tie Vote — Nobody Eliminated!
                  </h1>
                  <p className="text-sm text-[#D6D6E6]">
                    Debate again and break the tie on the next vote.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
                      style={{
                        backgroundColor: eliminatedPlayer
                          ? `${eliminatedPlayer.color}22`
                          : '#14141F',
                        border: `2px solid ${wasImpostor ? '#F43F5E' : '#22D3EE'}`,
                      }}
                    >
                      {eliminatedPlayer?.emoji}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#D6D6E6]">
                    {eliminatedPlayer?.name} was voted out...
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {wasImpostor ? (
                      <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-6 w-6 text-cyan-400 shrink-0" aria-hidden="true" />
                    )}
                    <h1
                      className={`font-display text-3xl font-extrabold tracking-tight ${
                        wasImpostor ? 'text-rose-400' : 'text-cyan-300'
                      }`}
                    >
                      {wasImpostor ? 'IMPOSTOR!' : 'INNOCENT CREWMATE'}
                    </h1>
                  </div>
                  {round.winReason && (
                    <p className="text-sm text-[#D6D6E6] leading-relaxed">{round.winReason}</p>
                  )}
                </>
              )}
            </motion.section>

            {/* Animated Vote Tally Breakdown */}
            <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-3.5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D8DA8]">
                Vote Tally Breakdown
              </h2>

              <div className="space-y-3">
                {tallyEntries.map(([targetId, count], idx) => {
                  const isZeroVote = targetId === ZERO_IMPOSTORS_VOTE;
                  const target = isZeroVote ? null : playerMap.get(targetId);
                  const pct = totalCastVotes > 0 ? Math.round((count / totalCastVotes) * 100) : 0;
                  const voters = Object.entries(room.votes)
                    .filter(([, votedFor]) => votedFor === targetId)
                    .map(([voterId]) => playerMap.get(voterId)?.name)
                    .filter(Boolean);
                  const isEliminatedTarget = outcome.eliminatedPlayerId === targetId;

                  return (
                    <div key={targetId} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#F4F4F8] truncate">
                          {isZeroVote
                            ? '✨ Nobody is an Impostor'
                            : `${target?.emoji ?? ''} ${target?.name ?? 'Player'}`}
                        </span>
                        <span
                          className={`font-mono font-extrabold tabular-nums shrink-0 ${
                            isEliminatedTarget ? 'text-rose-400' : 'text-cyan-300'
                          }`}
                        >
                          {count} {count === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.55,
                            delay: idx * 0.08,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className={`h-full rounded-full ${
                            isEliminatedTarget ? 'bg-rose-500' : 'bg-cyan-400/60'
                          }`}
                        />
                      </div>

                      {voters.length > 0 && (
                        <p className="text-[11px] text-[#8D8DA8]">
                          Voted by: {voters.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="pt-2">
            {isHost ? (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  triggerHaptic(14);
                  onAdvanceAfterVote();
                }}
                className="w-full min-h-[56px] rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                {round.winner ? 'See Round Summary' : 'Continue Discussion'}
              </button>
            ) : (
              <div className="rounded-2xl bg-[#13131E] border border-white/[0.08] px-4 py-3.5 text-center">
                <p className="text-xs font-semibold text-[#9898B0]">
                  Waiting for Host to continue...
                </p>
              </div>
            )}
          </div>
        </main>
      </>
    );
  }

  /* ============================================================================
     PHASE 6: ONLINE ROUND SUMMARY
     ============================================================================ */
  const impostors = round.playerOrder
    .map((id) => playerMap.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p && !!round.assignments[p.id]?.isImpostor);
  const civiliansWon = round.winner === 'civilians';
  const impostorsWon = round.winner === 'impostors';

  const rankedScores = [...room.players]
    .map((p) => ({
      player: p,
      total: room.scores[p.id] ?? 0,
      delta: room.roundScoreDeltas[p.id] ?? 0,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <>
      {topBar}
      <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-5 pb-12 pb-safe space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className={`rounded-[28px] border-2 p-6 text-center space-y-3 shadow-2xl ${
            civiliansWon
              ? 'bg-[#0C1E26] border-cyan-400/65'
              : impostorsWon
              ? 'bg-[#220D16] border-rose-500/65'
              : 'bg-[#1B1726] border-amber-400/50'
          }`}
        >
          <div className="flex justify-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                civiliansWon
                  ? 'bg-cyan-400/20 text-cyan-300'
                  : impostorsWon
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-amber-400/20 text-amber-300'
              }`}
            >
              {civiliansWon ? (
                <Trophy className="h-8 w-8" aria-hidden="true" />
              ) : impostorsWon ? (
                <Flame className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Sparkles className="h-8 w-8" aria-hidden="true" />
              )}
            </div>
          </div>

          <h1
            className={`font-display text-3xl font-extrabold tracking-tight ${
              civiliansWon
                ? 'text-cyan-300'
                : impostorsWon
                ? 'text-rose-400'
                : 'text-amber-300'
            }`}
          >
            {civiliansWon
              ? 'Crewmates Win!'
              : impostorsWon
              ? 'Impostors Win!'
              : 'Round Revealed'}
          </h1>

          {round.winReason && (
            <p className="text-sm text-[#D6D6E6] max-w-md mx-auto leading-relaxed">
              {round.winReason}
            </p>
          )}
        </motion.section>

        {/* Secret Word / Questions */}
        <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8D8DA8]">
            <span>
              {round.categoryEmoji} {round.categoryName}
            </span>
            <span>{round.mode === 'word' ? 'Word Game' : 'Question Game'}</span>
          </div>

          {round.mode === 'word' ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#09090E] border border-cyan-400/25 p-4 text-center space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-400">
                  Secret Word
                </p>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  {round.secretWord}
                </p>
                {round.secretWordDescription && (
                  <p className="text-xs text-[#B8B8CE] max-w-md mx-auto leading-relaxed">
                    {round.secretWordDescription}
                  </p>
                )}
              </div>
              {round.allHints.length > 0 && (
                <p className="text-center text-xs text-[#8D8DA8]">
                  Impostor Hints:{' '}
                  <span className="font-semibold text-[#D6D6E6]">
                    {round.allHints.join(' · ')}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#09090E] border border-cyan-400/25 p-4 space-y-1.5">
                  <p className="text-xs font-bold text-cyan-400">Main Question (Crewmates)</p>
                  <p className="text-sm font-semibold text-white">“{round.mainQuestion}”</p>
                </div>
                <div className="rounded-2xl bg-[#09090E] border border-rose-500/30 p-4 space-y-1.5">
                  <p className="text-xs font-bold text-rose-400">Decoy Question (Impostor)</p>
                  <p className="text-sm font-semibold text-white">“{round.decoyQuestion}”</p>
                </div>
              </div>

              {Object.keys(round.submittedAnswers).length > 0 && (
                <ul className="space-y-1.5">
                  {round.playerOrder.map((pid) => {
                    const player = playerMap.get(pid);
                    const assigned = round.assignments[pid];
                    if (!player || !assigned) return null;
                    return (
                      <li
                        key={pid}
                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 border ${
                          assigned.isImpostor
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : 'bg-[#09090E] border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{player.emoji}</span>
                          <span className="text-xs font-bold text-[#F4F4F8] truncate">
                            {player.name}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              assigned.isImpostor ? 'text-rose-400' : 'text-cyan-400'
                            }`}
                          >
                            {assigned.isImpostor ? 'Impostor' : 'Crewmate'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-white text-right">
                          “{round.submittedAnswers[pid] || '—'}”
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Impostors Reveal */}
        <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-[#F4F4F8]">
              {impostors.length === 0
                ? 'Zero Impostors'
                : impostors.length === 1
                ? 'The Impostor Was'
                : 'The Impostors Were'}
            </h2>
          </div>

          {impostors.length === 0 ? (
            <p className="text-sm text-[#8D8DA8]">
              Chaos Mode twist — every player was an innocent Crewmate!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {impostors.map((imp) => (
                <div
                  key={imp.id}
                  className="flex items-center gap-2.5 rounded-2xl bg-rose-500/12 border border-rose-500/35 px-3.5 py-2.5"
                >
                  <span className="text-xl">{imp.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{imp.name}</p>
                    {round.assignments[imp.id]?.hintWord && (
                      <p className="text-[11px] text-rose-200/80">
                        Hint: {round.assignments[imp.id].hintWord}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Room Scoreboard */}
        {room.settings.scoreboardEnabled && (
          <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <h2 className="font-display text-base font-bold text-[#F4F4F8]">
                  Room Scoreboard
                </h2>
              </div>
              {isHost && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onResetScores();
                  }}
                  className="flex min-h-[34px] items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <ul className="divide-y divide-white/[0.06]">
              {rankedScores.map(({ player, total, delta }, index) => (
                <li key={player.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 text-center font-mono text-xs font-bold text-[#8D8DA8] tabular-nums">
                      #{index + 1}
                    </span>
                    <span>{player.emoji}</span>
                    <span className="text-sm font-semibold text-[#F4F4F8] truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                    {delta > 0 && (
                      <span className="text-xs font-bold text-emerald-400">+{delta}</span>
                    )}
                    <span className="text-sm font-bold text-cyan-300">{total} pts</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Host Replay / Back to Lobby */}
        {isHost ? (
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                triggerHaptic(14);
                onStartRound();
              }}
              className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] shadow-[0_12px_34px_rgba(34,211,238,0.24)] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onReturnToLobby();
              }}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white/[0.06] border border-white/[0.08] font-display text-sm font-bold text-[#D6D6E6] hover:bg-white/[0.12] hover:text-white cursor-pointer"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Back to Room Lobby</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#13131E] border border-white/[0.08] px-4 py-3.5 text-center">
            <p className="text-xs font-semibold text-[#9898B0]">
              Waiting for Host to start the next round or return to lobby...
            </p>
          </div>
        )}
      </main>
    </>
  );
};
