import React from 'react';
import { HelpCircle, MessageCircleQuestion, Play, Type } from 'lucide-react';
import {
  CategoryDeck,
  GameMode,
  GameSettings,
  Player,
  PlayerGroup,
  UsedHistory,
} from '../types/game';
import { PlayerManager } from './PlayerManager';
import { CategoryBrowser } from './CategoryBrowser';
import { SettingsDrawer } from './SettingsDrawer';
import { playTapSound } from '../utils/audio';

interface SetupHubProps {
  players: Player[];
  groups: PlayerGroup[];
  decks: CategoryDeck[];
  selectedDeckIds: string[];
  settings: GameSettings;
  usedHistory: UsedHistory;
  canStartError: string | null;
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
  onStartGame: () => void;
  onOpenHowToPlay: () => void;
}

export const SetupHub: React.FC<SetupHubProps> = ({
  players,
  groups,
  decks,
  selectedDeckIds,
  settings,
  usedHistory,
  canStartError,
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
  onStartGame,
  onOpenHowToPlay,
}) => {
  const handleModeSwitch = (mode: GameMode) => {
    if (settings.mode === mode) return;
    playTapSound();
    onUpdateSettings({ mode });
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-5 pb-12 pb-safe">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Mode Switcher, Play + How to Play, Players, Settings */}
        <div className="lg:col-span-5 space-y-5">
          {/* Hero Mode Card & Primary Actions */}
          <section className="rounded-3xl bg-[#14141F] border border-white/[0.08] p-5 space-y-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F4F8]">
                Pass, Bluff & Catch the Liar
              </h1>
              <p className="text-sm text-[#9898B0]">
                {settings.mode === 'word'
                  ? 'Everyone sees the secret word except the Impostor. Give clues and vote them out.'
                  : 'Everyone secretly types their answer to a prompt—while the Impostor answers a sneaky decoy.'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div
              role="tablist"
              aria-label="Game Mode"
              className="grid grid-cols-2 gap-2 rounded-2xl bg-[#09090E] p-1.5 border border-white/[0.06]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={settings.mode === 'word'}
                onClick={() => handleModeSwitch('word')}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  settings.mode === 'word'
                    ? 'bg-[#1C1C2B] text-cyan-300 border border-cyan-400/35 shadow-sm'
                    : 'text-[#9898B0] hover:text-[#F4F4F8]'
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
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  settings.mode === 'question'
                    ? 'bg-[#1C1C2B] text-rose-300 border border-rose-400/35 shadow-sm'
                    : 'text-[#9898B0] hover:text-[#F4F4F8]'
                }`}
              >
                <MessageCircleQuestion className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Question Game</span>
              </button>
            </div>

            {/* Primary Play Button & How to Play directly underneath */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={!!canStartError}
                onClick={onStartGame}
                className="flex w-full min-h-[56px] items-center justify-center gap-2.5 rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] shadow-lg shadow-cyan-500/20 hover:bg-cyan-300 active:scale-[0.99] disabled:opacity-45 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                <span>Play</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onOpenHowToPlay();
                }}
                className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white/[0.05] border border-white/[0.09] font-display text-sm font-semibold text-[#D6D6E6] hover:bg-white/[0.1] hover:text-white active:scale-[0.99] transition-all cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span>How to Play</span>
              </button>

              {canStartError && (
                <p role="alert" className="text-center text-xs font-medium text-rose-400 pt-0.5">
                  {canStartError}
                </p>
              )}
            </div>
          </section>

          <PlayerManager
            players={players}
            groups={groups}
            onChangePlayers={onChangePlayers}
            onSaveGroup={onSaveGroup}
            onLoadGroup={onLoadGroup}
            onDeleteGroup={onDeleteGroup}
          />

          <SettingsDrawer
            settings={settings}
            playerCount={players.length}
            onUpdateSettings={onUpdateSettings}
          />
        </div>

        {/* Right Column: 22+ Category Decks & Custom Deck Studio */}
        <div className="lg:col-span-7">
          <CategoryBrowser
            decks={decks}
            selectedDeckIds={selectedDeckIds}
            mode={settings.mode}
            usedHistory={usedHistory}
            onToggleDeck={onToggleDeck}
            onSelectAll={onSelectAllDecks}
            onDeselectAll={onDeselectAllDecks}
            onResetHistory={onResetHistory}
            onCreateCustomDeck={onCreateCustomDeck}
            onEditCustomDeck={onEditCustomDeck}
          />
        </div>
      </div>
    </main>
  );
};
