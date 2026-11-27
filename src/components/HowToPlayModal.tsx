import React, { useState } from 'react';
import { HelpCircle, MessageSquareText, ShieldAlert, Sparkles } from 'lucide-react';
import { GameMode } from '../types/game';
import { BottomSheet } from './BottomSheet';
import { playTapSound } from '../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  initialMode: GameMode;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  initialMode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GameMode>(initialMode);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="How to Play"
      subtitle="Master both Word Mode & Question Mode"
      icon={<HelpCircle className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
      testId="how-to-play-modal"
      footer={
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="w-full min-h-[48px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
        >
          Got It
        </button>
      }
    >
      <div className="space-y-5">
        {/* Mode Tabs */}
        <div
          role="tablist"
          aria-label="Game Mode Instructions"
          className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#09090E] p-1.5 border border-white/[0.06]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'word'}
            onClick={() => {
              playTapSound();
              setActiveTab('word');
            }}
            className={`min-h-[44px] rounded-xl px-3 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'word'
                ? 'bg-[#1B1B2A] text-cyan-300 border border-cyan-400/30 shadow-sm'
                : 'text-[#9898B0] hover:text-[#F4F4F8]'
            }`}
          >
            Word Game
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'question'}
            onClick={() => {
              playTapSound();
              setActiveTab('question');
            }}
            className={`min-h-[44px] rounded-xl px-3 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'question'
                ? 'bg-[#1B1B2A] text-rose-300 border border-rose-500/35 shadow-sm'
                : 'text-[#9898B0] hover:text-[#F4F4F8]'
            }`}
          >
            Question Game
          </button>
        </div>

        {activeTab === 'word' ? (
          <>
            <p className="text-sm text-[#B8B8CE] leading-relaxed">
              Everyone secretly gets the same{' '}
              <strong className="text-cyan-300">Secret Word</strong>—except the{' '}
              <strong className="text-rose-400">Impostor(s)</strong>, who must bluff their way
              through without knowing it.
            </p>

            <ol className="space-y-4">
              <li className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
                  1
                </span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F4F4F8]">Hold to Reveal Your Role</h3>
                  <p className="text-xs sm:text-sm text-[#9898B0] leading-relaxed">
                    Press and hold the card to privately see your role. Crewmates see the Category,
                    Secret Word, and quick context; Impostors see an alert (plus a subtle Hint if
                    enabled).
                  </p>
                </div>
              </li>

              <li className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
                  2
                </span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F4F4F8]">Give Subtle Clues</h3>
                  <p className="text-xs sm:text-sm text-[#9898B0] leading-relaxed">
                    Starting with the announced speaker, go around giving a one-word or short clue.
                    Be specific enough to prove you know it—without handing it to the Impostor.
                  </p>
                </div>
              </li>

              <li className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
                  3
                </span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F4F4F8]">Debate & Vote Out the Liar</h3>
                  <p className="text-xs sm:text-sm text-[#9898B0] leading-relaxed">
                    Cast your vote before time runs out.{' '}
                    <strong className="text-[#F4F4F8]">
                      Once all Impostors are voted out, Crewmates win immediately.
                    </strong>
                  </p>
                </div>
              </li>
            </ol>
          </>
        ) : (
          <>
            <p className="text-sm text-[#B8B8CE] leading-relaxed">
              Also known as <strong className="text-[#F4F4F8]">Find the Liar</strong>. Crewmates
              answer the <strong className="text-cyan-300">Main Question</strong>, while Impostors
              secretly answer a clever <strong className="text-rose-400">Decoy Question</strong>{' '}
              with the same answer format.
            </p>

            <ol className="space-y-4">
              <li className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-400/15 font-mono text-xs font-bold text-rose-300">
                  1
                </span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F4F4F8]">Tap to Reveal & Type Answer</h3>
                  <p className="text-xs sm:text-sm text-[#9898B0] leading-relaxed">
                    Open your private question card, type your answer, and submit to lock it in
                    secretly.
                  </p>
                </div>
              </li>

              <li className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-400/15 font-mono text-xs font-bold text-rose-300">
                  2
                </span>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#F4F4F8]">Reveal Everyone’s Answers</h3>
                  <p className="text-xs sm:text-sm text-[#9898B0] leading-relaxed">
                    Once everyone submits, the{' '}
                    <strong className="text-[#F4F4F8]">Real Question</strong> and everyone’s answers
                    appear together. Spot whose answer looks weirdly off and vote them out!
                  </p>
                </div>
              </li>
            </ol>

            <div className="rounded-2xl bg-[#09090E] border border-white/[0.08] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9898B0]">
                <MessageSquareText className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span>Example Paired Prompt</span>
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-semibold text-cyan-300">Crewmates: </span>
                <span className="text-[#F4F4F8]">
                  “What is a food you would refuse to eat even for $100?”
                </span>
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-semibold text-rose-400">Impostor: </span>
                <span className="text-[#F4F4F8]">
                  “What is a food you could eat every single day?”
                </span>
              </div>
            </div>
          </>
        )}

        <div className="border-t border-white/[0.08] pt-4 space-y-2.5">
          <h3 className="text-xs font-bold text-[#9898B0] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>Bonus Rules</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#9898B0]">
            <div className="rounded-xl bg-[#09090E] p-3 border border-white/[0.06]">
              <strong className="text-[#F4F4F8] block mb-0.5">Chaos Mode</strong>
              Mystery impostor count—could be 0 Impostors, several, or everyone!
            </div>
            <div className="rounded-xl bg-[#09090E] p-3 border border-white/[0.06]">
              <strong className="text-[#F4F4F8] block mb-0.5">Survival Mode</strong>
              Voting out an innocent eliminates them and continues the round.
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-[#9898B0] pt-1">
            <ShieldAlert className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
            <span>Play online with separate phones or offline Pass & Play on one device.</span>
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};
