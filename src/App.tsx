import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CategoryDeck,
  GamePhase,
  GameSettings,
  Player,
  PlayerGroup,
  RoundState,
  UsedHistory,
} from './types/game';
import { BUILT_IN_CATEGORIES, DEFAULT_SELECTED_DECK_IDS } from './data/gameData';
import {
  calculateRoundScoreDeltas,
  callZeroImpostors,
  createRound,
  eliminatePlayer,
  submitPlayerAnswer,
} from './game/engine';
import {
  loadCustomDecks,
  loadMuted,
  loadPlayerGroups,
  loadPlayers,
  loadScores,
  loadSelectedDeckIds,
  loadSettings,
  loadUsedHistory,
  saveCustomDecks,
  saveMuted,
  savePlayerGroups,
  savePlayers,
  saveScores,
  saveSelectedDeckIds,
  saveSettings,
  saveUsedHistory,
} from './utils/storage';
import {
  playDramaticRevealSound,
  playTapSound,
  playVictoryFanfare,
  setAudioMuted,
  unlockIOSAudio,
} from './utils/audio';
import { HeaderBar } from './components/HeaderBar';
import { SetupHub } from './components/SetupHub';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ScoreboardModal } from './components/ScoreboardModal';
import { ChangelogModal } from './components/ChangelogModal';
import { CustomDeckModal } from './components/CustomDeckModal';
import { PrivacyPassScreen } from './components/PrivacyPassScreen';
import { DiscussionScreen } from './components/DiscussionScreen';
import { VotingScreen } from './components/VotingScreen';
import { RoundSummaryScreen } from './components/RoundSummaryScreen';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [groups, setGroups] = useState<PlayerGroup[]>(() => loadPlayerGroups());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [customDecks, setCustomDecks] = useState<CategoryDeck[]>(() => loadCustomDecks());
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(() =>
    loadSelectedDeckIds(DEFAULT_SELECTED_DECK_IDS)
  );
  const [usedHistory, setUsedHistory] = useState<UsedHistory>(() => loadUsedHistory());
  const [scores, setScores] = useState<Record<string, number>>(() => loadScores());
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const m = loadMuted();
    setAudioMuted(m);
    return m;
  });

  // Active Game State
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [round, setRound] = useState<RoundState | null>(null);
  const [roundCount, setRoundCount] = useState<number>(0);
  const [roundScoreDeltas, setRoundScoreDeltas] = useState<Record<string, number>>({});
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showCustomDeckModal, setShowCustomDeckModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<CategoryDeck | null>(null);

  // Unlock iOS silent-switch audio on first user interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockIOSAudio();
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Persist to localStorage
  useEffect(() => savePlayers(players), [players]);
  useEffect(() => savePlayerGroups(groups), [groups]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveCustomDecks(customDecks), [customDecks]);
  useEffect(() => saveSelectedDeckIds(selectedDeckIds), [selectedDeckIds]);
  useEffect(() => saveUsedHistory(usedHistory), [usedHistory]);
  useEffect(() => saveScores(scores), [scores]);

  // Lock page scrolling during Word/Question pass-and-reveal screens so touch drags never scroll
  const isPassLocked = phase === 'privacy_pass';
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (isPassLocked) {
      window.scrollTo(0, 0);
      html.classList.add('scroll-locked');
      body.classList.add('scroll-locked');
    } else {
      html.classList.remove('scroll-locked');
      body.classList.remove('scroll-locked');
    }
    return () => {
      html.classList.remove('scroll-locked');
      body.classList.remove('scroll-locked');
    };
  }, [isPassLocked]);

  const allDecks = useMemo(
    () => [...customDecks, ...BUILT_IN_CATEGORIES],
    [customDecks]
  );

  const selectedDecksForMode = useMemo(() => {
    const selectedSet = new Set(selectedDeckIds);
    return allDecks.filter((d) => {
      if (!selectedSet.has(d.id)) return false;
      return settings.mode === 'word' ? d.words.length > 0 : d.questions.length > 0;
    });
  }, [allDecks, selectedDeckIds, settings.mode]);

  const canStartError = useMemo(() => {
    if (players.length < 3) return 'Add at least 3 players to start.';
    if (selectedDecksForMode.length === 0) {
      return `Select at least one deck with ${
        settings.mode === 'word' ? 'words' : 'questions'
      }.`;
    }
    return null;
  }, [players.length, selectedDecksForMode.length, settings.mode]);

  const showNotice = useCallback((msg: string) => {
    setNoticeBanner(msg);
    window.setTimeout(() => {
      setNoticeBanner((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const handleToggleMute = () => {
    unlockIOSAudio();
    const next = !isMuted;
    setIsMuted(next);
    setAudioMuted(next);
    saveMuted(next);
    if (!next) {
      playTapSound();
    }
  };

  const handleUpdateSettings = (patch: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleSaveGroup = (name: string) => {
    const newGroup: PlayerGroup = {
      id: `grp-${Date.now()}`,
      name,
      players: players.map((p) => ({ ...p })),
      updatedAt: Date.now(),
    };
    setGroups((prev) => [newGroup, ...prev]);
  };

  const handleLoadGroup = (group: PlayerGroup) => {
    if (group.players.length >= 3) {
      setPlayers(group.players.map((p) => ({ ...p })));
      showNotice(`Loaded "${group.name}" (${group.players.length} players)`);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleToggleDeck = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
    );
  };

  const handleSelectAllDecks = () => {
    const validIds = allDecks
      .filter((d) => (settings.mode === 'word' ? d.words.length > 0 : d.questions.length > 0))
      .map((d) => d.id);
    setSelectedDeckIds(validIds);
  };

  const handleDeselectAllDecks = () => {
    setSelectedDeckIds([]);
  };

  const handleResetHistory = () => {
    setUsedHistory((prev) =>
      settings.mode === 'word' ? { ...prev, word: [] } : { ...prev, question: [] }
    );
    showNotice(`Reset played ${settings.mode === 'word' ? 'words' : 'questions'} history.`);
  };

  const handleSaveCustomDeck = (deck: CategoryDeck) => {
    setCustomDecks((prev) => {
      const exists = prev.some((d) => d.id === deck.id);
      if (exists) {
        return prev.map((d) => (d.id === deck.id ? deck : d));
      }
      return [deck, ...prev];
    });
    setSelectedDeckIds((prev) => (prev.includes(deck.id) ? prev : [...prev, deck.id]));
    showNotice(`Saved custom deck "${deck.name}"`);
  };

  const handleDeleteCustomDeck = (deckId: string) => {
    setCustomDecks((prev) => prev.filter((d) => d.id !== deckId));
    setSelectedDeckIds((prev) => prev.filter((id) => id !== deckId));
  };

  const handleResetScores = () => {
    setScores({});
    setRoundScoreDeltas({});
    showNotice('Scoreboard reset to 0.');
  };

  const applyRoundScores = useCallback(
    (finishedRound: RoundState) => {
      if (!settings.scoreboardEnabled) {
        setRoundScoreDeltas({});
        return;
      }
      const deltas = calculateRoundScoreDeltas(finishedRound);
      setRoundScoreDeltas(deltas);
      if (Object.keys(deltas).length > 0) {
        setScores((prev) => {
          const next = { ...prev };
          for (const [pid, pts] of Object.entries(deltas)) {
            next[pid] = (next[pid] ?? 0) + pts;
          }
          return next;
        });
      }
    },
    [settings.scoreboardEnabled]
  );

  const startNewRound = useCallback(() => {
    unlockIOSAudio();
    playTapSound();
    if (canStartError) return;

    const nextRoundNumber = roundCount + 1;
    const created = createRound(
      players,
      selectedDecksForMode,
      settings,
      usedHistory,
      nextRoundNumber
    );
    if (!created) return;

    setRound(created.round);
    setRoundCount(nextRoundNumber);
    setUsedHistory(created.updatedHistory);
    setRoundScoreDeltas({});
    setPhase('privacy_pass');

    if (created.deckHistoryReset) {
      showNotice('All prompts played in selected decks — reshuffled fresh!');
    }
  }, [canStartError, players, roundCount, selectedDecksForMode, settings, showNotice, usedHistory]);

  // Support ?autostart=1 for automated testing / quick launch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && phase === 'lobby' && !round) {
      startNewRound();
    }
  }, [phase, round, startNewRound]);

  const handleEliminatePlayer = (targetPlayerId: string) => {
    if (!round) return;
    const updated = eliminatePlayer(round, targetPlayerId, settings.survivalMode);
    const wasImpostor = !!updated.assignments[targetPlayerId]?.isImpostor;
    playDramaticRevealSound(wasImpostor);
    setRound(updated);
    setPhase('elimination_reveal');

    if (updated.winner) {
      applyRoundScores(updated);
    }
  };

  const handleCallZeroImpostors = () => {
    if (!round) return;
    const updated = callZeroImpostors(round);
    setRound(updated);
    applyRoundScores(updated);
    playVictoryFanfare(updated.winner === 'civilians');
    setPhase('round_summary');
  };

  const handleRevealAllRoles = () => {
    if (!round) return;
    const revealedRound: RoundState = {
      ...round,
      winner: 'chaos_draw',
      winReason: 'All roles were revealed early.',
    };
    setRound(revealedRound);
    setRoundScoreDeltas({});
    setPhase('round_summary');
  };

  const handleGoToSummary = () => {
    if (round?.winner === 'civilians' || round?.winner === 'impostors') {
      playVictoryFanfare(round.winner === 'civilians');
    }
    setPhase('round_summary');
  };

  const hasAnyScores = Object.values(scores).some((v) => v > 0);

  return (
    <div
      className={`${
        isPassLocked ? 'h-[100dvh] overflow-hidden overscroll-none' : 'min-h-[100dvh]'
      } bg-[#09090E] text-[#F4F4F8] flex flex-col`}
      data-game-phase={phase}
    >
      <HeaderBar
        phase={phase}
        isMuted={isMuted}
        scoreboardEnabled={settings.scoreboardEnabled}
        hasScores={hasAnyScores}
        onToggleMute={handleToggleMute}
        onOpenScoreboard={() => setShowScoreboard(true)}
        onOpenChangelog={() => setShowChangelog(true)}
        onReturnToLobby={() => {
          setPhase('lobby');
          setRound(null);
        }}
      />

      {/* Subtle transient notice banner */}
      {noticeBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-2xl bg-[#1C1C2B] border border-cyan-400/35 px-4 py-2.5 text-xs font-semibold text-cyan-200 shadow-xl whitespace-nowrap"
        >
          {noticeBanner}
        </div>
      )}

      {/* Screens */}
      {phase === 'lobby' && (
        <SetupHub
          players={players}
          groups={groups}
          decks={allDecks}
          selectedDeckIds={selectedDeckIds}
          settings={settings}
          usedHistory={usedHistory}
          canStartError={canStartError}
          onChangePlayers={setPlayers}
          onSaveGroup={handleSaveGroup}
          onLoadGroup={handleLoadGroup}
          onDeleteGroup={handleDeleteGroup}
          onToggleDeck={handleToggleDeck}
          onSelectAllDecks={handleSelectAllDecks}
          onDeselectAllDecks={handleDeselectAllDecks}
          onResetHistory={handleResetHistory}
          onCreateCustomDeck={() => {
            setEditingDeck(null);
            setShowCustomDeckModal(true);
          }}
          onEditCustomDeck={(deck) => {
            setEditingDeck(deck);
            setShowCustomDeckModal(true);
          }}
          onUpdateSettings={handleUpdateSettings}
          onStartGame={startNewRound}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
        />
      )}

      {phase === 'privacy_pass' && round && (
        <PrivacyPassScreen
          round={round}
          players={players}
          onSubmitAnswer={(playerId, answer) =>
            setRound((prev) => (prev ? submitPlayerAnswer(prev, playerId, answer) : prev))
          }
          onCompletePassLoop={() => setPhase('discussion')}
        />
      )}

      {phase === 'discussion' && round && (
        <DiscussionScreen
          round={round}
          players={players}
          initialTimerSeconds={settings.discussionTimer}
          onStartVoting={() => setPhase('voting')}
          onRevealAllRoles={handleRevealAllRoles}
        />
      )}

      {(phase === 'voting' || phase === 'elimination_reveal') && round && (
        <VotingScreen
          round={round}
          players={players}
          showEliminationReveal={phase === 'elimination_reveal'}
          onEliminatePlayer={handleEliminatePlayer}
          onCallZeroImpostors={handleCallZeroImpostors}
          onBackToDiscussion={() => setPhase('discussion')}
          onContinueSurvival={() => setPhase('discussion')}
          onGoToSummary={handleGoToSummary}
        />
      )}

      {phase === 'round_summary' && round && (
        <RoundSummaryScreen
          round={round}
          players={players}
          scores={scores}
          roundScoreDeltas={roundScoreDeltas}
          scoreboardEnabled={settings.scoreboardEnabled}
          onResetScores={handleResetScores}
          onPlayAgain={startNewRound}
          onBackToLobby={() => {
            setPhase('lobby');
            setRound(null);
          }}
        />
      )}

      {/* Modals */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        initialMode={settings.mode}
        onClose={() => setShowHowToPlay(false)}
      />

      <ScoreboardModal
        isOpen={showScoreboard}
        players={players}
        scores={scores}
        onResetScores={handleResetScores}
        onClose={() => setShowScoreboard(false)}
      />

      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />

      <CustomDeckModal
        isOpen={showCustomDeckModal}
        initialMode={settings.mode}
        editingDeck={editingDeck}
        onSave={handleSaveCustomDeck}
        onDelete={handleDeleteCustomDeck}
        onClose={() => {
          setShowCustomDeckModal(false);
          setEditingDeck(null);
        }}
      />
    </div>
  );
}
