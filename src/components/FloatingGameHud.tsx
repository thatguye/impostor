import React, { useState } from 'react';
import { BookOpen, Clock, Mic, ShieldAlert } from 'lucide-react';
import { GameMode } from '../types/game';
import { BottomSheet } from './BottomSheet';
import { playTapSound } from '../utils/audio';

interface FloatingGameHudProps {
  phaseLabel: string;
  roundNumber: number;
  mode: GameMode;
  categoryEmoji: string;
  categoryName: string;
  impostorLabel: string;
  isChaosHidden?: boolean;
  timerEnabled: boolean;
  secondsLeft: number;
  isPaused?: boolean;
  speakerName?: string | null;
  speakerEmoji?: string | null;
}

function formatClock(totalSec: number): string {
  const clamped = Math.max(0, totalSec);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const FloatingGameHud: React.FC<FloatingGameHudProps> = ({
  phaseLabel,
  roundNumber,
  mode,
  categoryEmoji,
  categoryName,
  impostorLabel,
  isChaosHidden = false,
  timerEnabled,
  secondsLeft,
  isPaused = false,
  speakerName,
  speakerEmoji,
}) => {
  const [showQuickRules, setShowQuickRules] = useState(false);

  const isLowTime = timerEnabled && secondsLeft > 0 && secondsLeft <= 15;
  const isTimeUp = timerEnabled && secondsLeft === 0;

  return (
    <>
      <div
        data-testid="floating-game-hud"
        className="sticky top-[calc(env(safe-area-inset-top)+68px)] z-20 mx-auto w-full max-w-2xl"
      >
        <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-[#13131E]/95 backdrop-blur-xl border border-white/[0.1] px-3.5 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.45)]">
          {/* Left: Phase + Timer */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-xs font-extrabold tabular-nums border ${
                isTimeUp || isLowTime
                  ? 'bg-rose-500/18 border-rose-500/45 text-rose-300'
                  : 'bg-[#09090E] border-white/[0.08] text-cyan-300'
              }`}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span data-testid="hud-timer-value">
                {timerEnabled ? formatClock(secondsLeft) : 'No Timer'}
              </span>
              {isPaused && timerEnabled && !isTimeUp && (
                <span className="text-[10px] font-sans font-bold text-amber-300">II</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#F4F4F8] truncate">
                  {phaseLabel}
                </span>
                <span className="font-mono text-[11px] text-[#787894] shrink-0">
                  R{roundNumber}
                </span>
              </div>
              {speakerName ? (
                <p className="flex items-center gap-1 text-[11px] text-[#9898B0] truncate">
                  <Mic className="h-3 w-3 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {speakerEmoji ? `${speakerEmoji} ` : ''}
                    {speakerName} first
                  </span>
                </p>
              ) : (
                <p
                  className={`text-[11px] truncate ${
                    isChaosHidden ? 'text-rose-300 font-semibold' : 'text-[#8D8DA8]'
                  }`}
                >
                  {impostorLabel}
                </p>
              )}
            </div>
          </div>

          {/* Right: Quick-Access Category & Rules Pill */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowQuickRules(true);
            }}
            data-testid="hud-rules-pill"
            aria-label="View Round Category and Rules"
            className="flex min-h-[38px] max-w-[44%] items-center gap-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3 text-xs font-semibold text-[#E4E4F2] hover:bg-white/[0.12] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <span aria-hidden="true" className="shrink-0">
              {categoryEmoji}
            </span>
            <span className="truncate">{categoryName}</span>
            <BookOpen className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Quick Round Info & Rules Bottom Sheet */}
      <BottomSheet
        isOpen={showQuickRules}
        onClose={() => setShowQuickRules(false)}
        title="Round Briefing"
        subtitle={`Round ${roundNumber} · ${mode === 'word' ? 'Word Game' : 'Question Game'}`}
        icon={<ShieldAlert className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-[#09090E] border border-white/[0.08] p-3.5">
              <p className="text-[11px] font-semibold text-[#8D8DA8]">Category</p>
              <p className="mt-1 font-display text-sm font-bold text-[#F4F4F8]">
                {categoryEmoji} {categoryName}
              </p>
            </div>
            <div className="rounded-2xl bg-[#09090E] border border-white/[0.08] p-3.5">
              <p className="text-[11px] font-semibold text-[#8D8DA8]">Impostors</p>
              <p
                className={`mt-1 font-display text-sm font-bold ${
                  isChaosHidden ? 'text-rose-300' : 'text-[#F4F4F8]'
                }`}
              >
                {impostorLabel}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#09090E] border border-white/[0.08] p-4 space-y-2 text-xs text-[#B8B8CE] leading-relaxed">
            <p className="font-bold text-[#F4F4F8]">
              {mode === 'word' ? 'Word Mode Rules' : 'Question Mode Rules'}
            </p>
            {mode === 'word' ? (
              <ul className="space-y-1.5 list-disc pl-4">
                <li>Go around giving a subtle clue without giving away the secret word.</li>
                <li>Impostors must blend in using only the category (and subtle hint if on).</li>
                <li>Vote out every Impostor to win immediately for Crewmates.</li>
              </ul>
            ) : (
              <ul className="space-y-1.5 list-disc pl-4">
                <li>Compare everyone’s revealed answers against the Real Question.</li>
                <li>Impostors answered a sneaky decoy question with a similar format.</li>
                <li>Expose the liar and vote them out!</li>
              </ul>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
