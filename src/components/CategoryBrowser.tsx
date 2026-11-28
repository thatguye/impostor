import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Layers,
  MessageCircleQuestion,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Type,
  X,
} from 'lucide-react';
import { CategoryDeck, GameMode, UsedHistory } from '../types/game';
import { playTapSound } from '../utils/audio';

interface CategoryBrowserProps {
  decks: CategoryDeck[];
  selectedDeckIds: string[];
  mode: GameMode;
  usedHistory: UsedHistory;
  onToggleDeck: (deckId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onResetHistory: () => void;
  onCreateCustomDeck: () => void;
  onEditCustomDeck: (deck: CategoryDeck) => void;
  onChangeMode?: (mode: GameMode) => void;
  embedded?: boolean;
}

export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  decks,
  selectedDeckIds,
  mode,
  usedHistory,
  onToggleDeck,
  onSelectAll,
  onDeselectAll,
  onResetHistory,
  onCreateCustomDeck,
  onEditCustomDeck,
  onChangeMode,
  embedded = false,
}) => {
  const [query, setQuery] = useState('');
  const [previewDeckId, setPreviewDeckId] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedDeckIds), [selectedDeckIds]);
  const usedSet = useMemo(
    () => new Set(mode === 'word' ? usedHistory.word : usedHistory.question),
    [mode, usedHistory]
  );

  const wordDecksCount = useMemo(
    () => decks.filter((d) => d.words.length > 0).length,
    [decks]
  );
  const questionDecksCount = useMemo(
    () => decks.filter((d) => d.questions.length > 0).length,
    [decks]
  );

  const modeDecks = useMemo(
    () =>
      decks.filter((d) =>
        mode === 'word' ? d.words.length > 0 : d.questions.length > 0
      ),
    [decks, mode]
  );

  const filteredDecks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modeDecks;
    return modeDecks.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [modeDecks, query]);

  const selectedModeDecksCount = useMemo(
    () => modeDecks.filter((d) => selectedSet.has(d.id)).length,
    [modeDecks, selectedSet]
  );

  const totalSelectedPrompts = useMemo(() => {
    return modeDecks
      .filter((d) => selectedSet.has(d.id))
      .reduce((sum, d) => sum + (mode === 'word' ? d.words.length : d.questions.length), 0);
  }, [modeDecks, selectedSet, mode]);

  const totalUsedInMode = mode === 'word' ? usedHistory.word.length : usedHistory.question.length;

  return (
    <section
      aria-labelledby={embedded ? undefined : 'categories-heading'}
      className={
        embedded
          ? 'space-y-3.5'
          : 'rounded-3xl bg-[#14141F] border border-white/[0.08] p-5 space-y-4'
      }
    >
      {/* Header Row (standalone mode only) */}
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <h2 id="categories-heading" className="font-display text-base font-bold text-[#F4F4F8]">
                Category Decks
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#9898B0] font-mono tabular-nums">
              {selectedModeDecksCount} of {modeDecks.length} selected · {totalSelectedPrompts}{' '}
              {mode === 'word' ? 'words' : 'questions'} ready
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onCreateCustomDeck();
            }}
            className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-cyan-400/15 border border-cyan-400/30 px-3.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Custom Deck</span>
          </button>
        </div>
      )}

      {/* Mode Filter Switcher (Word Decks vs Question Decks) */}
      {onChangeMode && (
        <div
          role="tablist"
          aria-label="Filter decks by game mode"
          className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#09090E] p-1 border border-white/[0.06]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'word'}
            onClick={() => {
              if (mode === 'word') return;
              playTapSound();
              setPreviewDeckId(null);
              setQuery('');
              onChangeMode('word');
            }}
            className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              mode === 'word'
                ? 'bg-[#1C1C2B] text-cyan-300 border border-cyan-400/30'
                : 'text-[#8D8DA8] hover:text-[#F4F4F8]'
            }`}
          >
            <Type className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Word Decks ({wordDecksCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'question'}
            onClick={() => {
              if (mode === 'question') return;
              playTapSound();
              setPreviewDeckId(null);
              setQuery('');
              onChangeMode('question');
            }}
            className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              mode === 'question'
                ? 'bg-[#1C1C2B] text-rose-300 border border-rose-500/35'
                : 'text-[#8D8DA8] hover:text-[#F4F4F8]'
            }`}
          >
            <MessageCircleQuestion className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Question Decks ({questionDecksCount})</span>
          </button>
        </div>
      )}

      {/* Search & Bulk Select Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#75758E]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${modeDecks.length} ${mode === 'word' ? 'word' : 'question'} decks...`}
              aria-label="Search category decks"
              className="w-full min-h-[44px] rounded-2xl bg-[#09090E] border border-white/10 pl-10 pr-9 text-sm text-[#F4F4F8] placeholder:text-[#666680] focus:border-cyan-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[#9898B0] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {embedded && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onCreateCustomDeck();
              }}
              className="flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 px-3.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Custom</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onSelectAll();
              }}
              className="min-h-[38px] rounded-xl bg-white/[0.06] px-3 text-xs font-semibold text-[#D6D6E6] hover:bg-white/[0.12] transition-colors whitespace-nowrap cursor-pointer"
            >
              Mix All ({modeDecks.length})
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onDeselectAll();
              }}
              className="min-h-[38px] rounded-xl bg-white/[0.06] px-3 text-xs font-semibold text-[#9898B0] hover:bg-white/[0.12] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              Clear
            </button>
            {totalUsedInMode > 0 && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onResetHistory();
                }}
                aria-label="Reset played history"
                title={`Reset ${totalUsedInMode} played prompts`}
                className="flex min-h-[38px] items-center gap-1 rounded-xl bg-white/[0.06] px-3 text-xs font-semibold text-amber-300 hover:bg-amber-400/15 transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Used</span>
              </button>
            )}
          </div>
          <span className="text-[11px] font-medium text-[#787894]">
            Tap any deck to mix · Arrow to preview
          </span>
        </div>
      </div>

      {/* Category Grid */}
      {filteredDecks.length === 0 ? (
        <div className="rounded-2xl bg-[#09090E] border border-white/[0.06] p-8 text-center">
          <p className="text-sm font-semibold text-[#F4F4F8]">No matching decks</p>
          <p className="mt-1 text-xs text-[#9898B0]">
            Try another keyword or create your own custom deck.
          </p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${
            embedded ? '' : 'max-h-[560px] lg:max-h-[680px] overflow-y-auto pr-0.5'
          }`}
        >
          {filteredDecks.map((deck) => {
            const isSelected = selectedSet.has(deck.id);
            const isPreviewOpen = previewDeckId === deck.id;
            const items = mode === 'word' ? deck.words : deck.questions;
            const totalCount = items.length;
            const usedCount = items.filter((item) => usedSet.has(item.id)).length;
            const remaining = Math.max(0, totalCount - usedCount);

            return (
              <div
                key={deck.id}
                className={`relative flex flex-col rounded-2xl border transition-all ${
                  isSelected
                    ? mode === 'question'
                      ? 'bg-[#1F1522] border-rose-400/55'
                      : 'bg-[#181C2E] border-cyan-400/60'
                    : 'bg-[#0E0E17] border-white/[0.07] hover:border-white/[0.16]'
                }`}
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onToggleDeck(deck.id);
                    }}
                    aria-pressed={isSelected}
                    className="flex flex-1 items-center gap-3 p-3.5 text-left min-w-0 cursor-pointer"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl bg-white/[0.05]"
                      aria-hidden="true"
                    >
                      {deck.emoji}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#F4F4F8] truncate">
                          {deck.name}
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isSelected
                              ? mode === 'question'
                                ? 'bg-rose-400 border-rose-400 text-[#18070D]'
                                : 'bg-cyan-400 border-cyan-400 text-[#061318]'
                              : 'border-white/20 bg-transparent'
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#9898B0] font-mono tabular-nums">
                        <span>
                          {remaining}/{totalCount}{' '}
                          {mode === 'word' ? 'words' : 'pairs'}
                        </span>
                        {deck.isCustom && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-sans text-cyan-300 font-medium">Custom</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Preview Sample Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setPreviewDeckId((curr) => (curr === deck.id ? null : deck.id));
                    }}
                    aria-expanded={isPreviewOpen}
                    aria-label={`Preview ${deck.name}`}
                    className={`flex w-10 shrink-0 items-center justify-center border-l border-white/[0.06] text-[#8D8DA8] hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer ${
                      deck.isCustom ? '' : 'rounded-r-2xl'
                    }`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isPreviewOpen ? 'rotate-180 text-cyan-300' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {deck.isCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onEditCustomDeck(deck);
                      }}
                      aria-label={`Edit custom deck ${deck.name}`}
                      className="flex w-10 shrink-0 items-center justify-center border-l border-white/[0.06] text-[#9898B0] hover:bg-white/[0.06] hover:text-cyan-300 rounded-r-2xl cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Expandable Sample Preview */}
                {isPreviewOpen && (
                  <div className="border-t border-white/[0.07] bg-[#09090E]/70 px-3.5 py-3 rounded-b-2xl space-y-2.5">
                    <p className="text-xs text-[#9898B0] leading-relaxed">{deck.description}</p>
                    {mode === 'word' ? (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                          Sample Words
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {deck.words.slice(0, 5).map((item) => (
                            <span
                              key={item.id}
                              className="rounded-lg bg-white/[0.06] border border-white/[0.07] px-2 py-1 text-[11px] font-semibold text-[#E8E8F4]"
                            >
                              {item.word}
                            </span>
                          ))}
                          {deck.words.length > 5 && (
                            <span className="px-1 py-1 text-[11px] font-mono text-[#787894]">
                              +{deck.words.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#787894]">
                          Sample Pair
                        </p>
                        {deck.questions[0] && (
                          <div className="space-y-1 text-xs">
                            <p className="text-[#E8E8F4]">
                              <span className="font-bold text-cyan-300">Crew: </span>“
                              {deck.questions[0].main}”
                            </p>
                            <p className="text-[#C8C8DC]">
                              <span className="font-bold text-rose-400">Impostor: </span>“
                              {deck.questions[0].decoy}”
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
