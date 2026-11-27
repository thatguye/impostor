import React, { useEffect, useState } from 'react';
import {
  Eye,
  MessageSquare,
  MessageSquareQuote,
  Pause,
  Play,
  Plus,
  Users,
  Vote,
} from 'lucide-react';
import { DiscussionTimerSeconds, Player, RoundState } from '../types/game';
import { FloatingGameHud } from './FloatingGameHud';
import {
  playTapSound,
  playTimerExpiredSound,
  playTimerTickSound,
  triggerHaptic,
} from '../utils/audio';

interface DiscussionScreenProps {
  round: RoundState;
  players: Player[];
  initialTimerSeconds: DiscussionTimerSeconds;
  onStartVoting: () => void;
  onRevealAllRoles: () => void;
}

export const DiscussionScreen: React.FC<DiscussionScreenProps> = ({
  round,
  players,
  initialTimerSeconds,
  onStartVoting,
  onRevealAllRoles,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialTimerSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [confirmRevealAll, setConfirmRevealAll] = useState(false);

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const startingPlayer = playerMap.get(round.startingPlayerId);

  const activePlayers = round.playerOrder
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => !!p && !round.assignments[p.id]?.eliminated);

  const eliminatedPlayers = round.eliminatedOrder
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => !!p);

  const timerEnabled = initialTimerSeconds > 0;

  useEffect(() => {
    if (!timerEnabled || isPaused || secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next === 0) {
          playTimerExpiredSound();
          triggerHaptic([30, 50, 30]);
        } else if (next <= 5) {
          playTimerTickSound(true);
        } else if (next <= 10) {
          playTimerTickSound(false);
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerEnabled, isPaused, secondsLeft]);

  const isTimeUp = timerEnabled && secondsLeft === 0;
  const impostorLabel = round.hideImpostorCount
    ? 'Chaos Mystery Impostors'
    : `${round.impostorCount} ${round.impostorCount === 1 ? 'Impostor' : 'Impostors'}`;

  return (
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

        {/* Compact Timer Controls Strip (when timer is enabled) */}
        {timerEnabled && (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#13131E] border border-white/[0.08] px-3.5 py-2.5">
            <span className="text-xs font-semibold text-[#9898B0]">
              {isTimeUp ? 'Time is up — Ready to vote!' : isPaused ? 'Timer paused' : 'Live round timer'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isTimeUp}
                onClick={() => {
                  playTapSound();
                  setIsPaused((p) => !p);
                }}
                className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-white/[0.08] px-3.5 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.14] disabled:opacity-40 transition-colors cursor-pointer"
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
                  setSecondsLeft((prev) => prev + 30);
                }}
                className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-cyan-400/12 border border-cyan-400/25 px-3 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>30s</span>
              </button>
            </div>
          </div>
        )}

        {/* Word Mode Starting Speaker Card */}
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
                  {startingPlayer.name} goes first
                </p>
              </div>
            </div>
            <MessageSquare className="h-4 w-4 text-[#75758E] shrink-0" aria-hidden="true" />
          </section>
        )}

        {/* Question Mode: Main Question + Everyone's Revealed Answers */}
        {round.mode === 'question' && (
          <>
            <section
              aria-label="The Real Question"
              className="rounded-[26px] bg-[#13131E] border border-cyan-400/35 p-5 text-center space-y-2"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400">
                The Real Question
              </p>
              <p className="font-display text-xl sm:text-2xl font-extrabold text-white leading-snug">
                “{round.mainQuestion}”
              </p>
              <p className="text-xs text-[#8D8DA8]">
                Whose answer looks weirdly off? Debate and expose the Impostor!
              </p>
            </section>

            <section
              aria-label="Everyone's Answers"
              data-testid="revealed-answers-list"
              className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs text-[#9898B0] px-1">
                <span className="flex items-center gap-1.5 font-semibold text-[#D6D6E6]">
                  <MessageSquareQuote className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                  <span>Everyone’s Answers ({activePlayers.length})</span>
                </span>
                {eliminatedPlayers.length > 0 && (
                  <span className="text-rose-300 font-medium">
                    {eliminatedPlayers.length} eliminated
                  </span>
                )}
              </div>

              <ul className="space-y-2">
                {activePlayers.map((p) => {
                  const ans = round.submittedAnswers[p.id];
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#09090E] border border-white/[0.07] px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-base shrink-0"
                          style={{
                            backgroundColor: `${p.color}22`,
                            border: `1px solid ${p.color}55`,
                          }}
                          aria-hidden="true"
                        >
                          {p.emoji}
                        </span>
                        <span className="text-sm font-bold text-[#D6D6E6] truncate max-w-[115px] sm:max-w-[160px]">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white text-right break-words min-w-0">
                        “{ans || '—'}”
                      </p>
                    </li>
                  );
                })}

                {eliminatedPlayers.map((p) => {
                  const ans = round.submittedAnswers[p.id];
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-2 opacity-60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                        <span className="text-base" aria-hidden="true">
                          {p.emoji}
                        </span>
                        <span className="text-xs font-medium text-[#7C7C96] line-through truncate max-w-[115px]">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#7C7C96] line-through text-right break-words min-w-0">
                        “{ans || '—'}”
                      </p>
                    </li>
                  );
                })}
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
                  <span aria-hidden="true">{p.emoji}</span>
                  <span>{p.name}</span>
                </div>
              ))}
              {eliminatedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#666680] line-through"
                >
                  <span aria-hidden="true">{p.emoji}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="space-y-2.5 pt-2">
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
          <span>Start Voting</span>
        </button>

        {!confirmRevealAll ? (
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setConfirmRevealAll(true);
            }}
            className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm font-semibold text-[#9898B0] hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>Reveal All Roles</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmRevealAll(false)}
              className="min-h-[46px] flex-1 rounded-2xl bg-white/[0.06] text-xs font-semibold text-[#D6D6E6] hover:bg-white/[0.12] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onRevealAllRoles();
              }}
              className="min-h-[46px] flex-1 rounded-2xl bg-rose-500 text-xs font-bold text-white hover:bg-rose-400 cursor-pointer"
            >
              Confirm Reveal All
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
