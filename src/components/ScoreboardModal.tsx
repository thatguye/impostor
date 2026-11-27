import React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { Player } from '../types/game';
import { BottomSheet } from './BottomSheet';
import { playTapSound } from '../utils/audio';

interface ScoreboardModalProps {
  isOpen: boolean;
  players: Player[];
  scores: Record<string, number>;
  onResetScores: () => void;
  onClose: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  isOpen,
  players,
  scores,
  onResetScores,
  onClose,
}) => {
  const ranked = [...players]
    .map((p) => ({ player: p, points: scores[p.id] ?? 0 }))
    .sort((a, b) => b.points - a.points);

  const hasAnyPoints = ranked.some((r) => r.points > 0);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Scoreboard"
      subtitle="Crewmates +1 pt · Surviving Impostors +2 pts"
      icon={<Trophy className="h-5 w-5 text-amber-400" aria-hidden="true" />}
      maxWidthClass="max-w-md"
      testId="scoreboard-modal"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={!hasAnyPoints}
            onClick={() => {
              playTapSound();
              onResetScores();
            }}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] text-sm font-semibold text-rose-300 hover:bg-rose-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="min-h-[48px] flex-1 rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      <ul className="divide-y divide-white/[0.06]">
        {ranked.map(({ player, points }, idx) => (
          <li key={player.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-6 text-center font-mono text-xs font-extrabold tabular-nums ${
                  idx === 0 && points > 0 ? 'text-amber-300' : 'text-[#8D8DA8]'
                }`}
              >
                #{idx + 1}
              </span>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                style={{
                  backgroundColor: `${player.color}22`,
                  border: `1px solid ${player.color}55`,
                }}
              >
                {player.emoji}
              </span>
              <span className="truncate text-sm font-semibold text-[#F4F4F8]">{player.name}</span>
            </div>
            <span className="font-mono text-base font-bold text-cyan-300 tabular-nums shrink-0">
              {points} {points === 1 ? 'pt' : 'pts'}
            </span>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
};
