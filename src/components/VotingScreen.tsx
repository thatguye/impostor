import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserX,
  Users,
  Vote,
} from 'lucide-react';
import { Player, RoundState } from '../types/game';
import { playTapSound, triggerHaptic } from '../utils/audio';

interface VotingScreenProps {
  round: RoundState;
  players: Player[];
  showEliminationReveal: boolean;
  onEliminatePlayer: (playerId: string) => void;
  onCallZeroImpostors: () => void;
  onBackToDiscussion: () => void;
  onContinueSurvival: () => void;
  onGoToSummary: () => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({
  round,
  players,
  showEliminationReveal,
  onEliminatePlayer,
  onCallZeroImpostors,
  onBackToDiscussion,
  onContinueSurvival,
  onGoToSummary,
}) => {
  const [voteStyle, setVoteStyle] = useState<'group' | 'ballot'>('group');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pass-and-play Secret Ballot state
  const [activeVoterId, setActiveVoterId] = useState<string | null>(null);
  const [ballotVotes, setBallotVotes] = useState<Record<string, string>>({});
  const [ballotDraft, setBallotDraft] = useState<string | null>(null);
  const [showBallotTally, setShowBallotTally] = useState(false);

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const activePlayers = round.playerOrder
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => !!p && !round.assignments[p.id]?.eliminated);

  const ballotTallies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const target of Object.values(ballotVotes)) {
      counts[target] = (counts[target] ?? 0) + 1;
    }
    const entries = activePlayers
      .map((p) => ({ player: p, votes: counts[p.id] ?? 0 }))
      .sort((a, b) => b.votes - a.votes);
    const maxVotes = entries[0]?.votes ?? 0;
    const leaders = entries.filter((e) => e.votes === maxVotes && maxVotes > 0);
    return {
      entries,
      maxVotes,
      isTie: leaders.length !== 1,
      topSuspect: leaders.length === 1 ? leaders[0].player : null,
    };
  }, [activePlayers, ballotVotes]);

  // Dramatic Elimination Reveal Step
  if (showEliminationReveal && round.lastEliminatedId) {
    const eliminatedPlayer = playerMap.get(round.lastEliminatedId);
    const eliminatedAssignment = round.assignments[round.lastEliminatedId];
    const wasImpostor = !!eliminatedAssignment?.isImpostor;

    return (
      <main className="mx-auto flex min-h-[calc(100dvh-60px)] w-full max-w-lg flex-col items-center justify-center px-5 py-8 pb-safe">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className={`w-full rounded-[28px] border-2 p-7 sm:p-8 text-center space-y-6 shadow-2xl ${
            wasImpostor
              ? 'bg-[#210D16] border-rose-500/75'
              : 'bg-[#0C1C26] border-cyan-400/65'
          }`}
        >
          <div className="flex justify-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-lg"
              style={{
                backgroundColor: eliminatedPlayer ? `${eliminatedPlayer.color}22` : '#14141F',
                border: `2px solid ${wasImpostor ? '#F43F5E' : '#22D3EE'}`,
              }}
            >
              {eliminatedPlayer?.emoji}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#D6D6E6]">
              {eliminatedPlayer?.name} was voted out...
            </p>
            <div className="flex items-center justify-center gap-2">
              {wasImpostor ? (
                <ShieldAlert className="h-7 w-7 text-rose-400 shrink-0" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-cyan-400 shrink-0" aria-hidden="true" />
              )}
              <h1
                className={`font-display text-3xl font-extrabold tracking-tight ${
                  wasImpostor ? 'text-rose-400' : 'text-cyan-300'
                }`}
              >
                {wasImpostor ? 'IMPOSTOR!' : 'INNOCENT CREWMATE'}
              </h1>
            </div>

            {round.winner ? (
              <p className="pt-2 text-sm text-[#D6D6E6] leading-relaxed">{round.winReason}</p>
            ) : (
              <p className="pt-2 text-sm text-[#B8B8CE] leading-relaxed">
                The round continues — Impostors are still hiding among the{' '}
                <strong className="text-white">{activePlayers.length}</strong> remaining players!
              </p>
            )}
          </div>

          {round.winner ? (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onGoToSummary();
              }}
              className="w-full min-h-[56px] rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
            >
              See Round Summary
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setSelectedId(null);
                setBallotVotes({});
                setShowBallotTally(false);
                onContinueSurvival();
              }}
              className="w-full min-h-[54px] rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
            >
              Continue Discussion
            </button>
          )}
        </motion.div>
      </main>
    );
  }

  // Animated Secret Ballot Tally Breakdown
  if (voteStyle === 'ballot' && showBallotTally) {
    const totalCast = Object.keys(ballotVotes).length;
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-60px)] w-full max-w-2xl flex-col justify-between px-4 sm:px-6 py-5 pb-safe gap-5">
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400">
              Secret Ballot Results
            </p>
            <h1 className="font-display text-3xl font-extrabold text-[#F4F4F8]">
              {ballotTallies.isTie
                ? 'It’s a Tie!'
                : `${ballotTallies.topSuspect?.name} Leads the Vote`}
            </h1>
            <p className="text-xs text-[#8D8DA8]">
              {totalCast} secret {totalCast === 1 ? 'vote' : 'votes'} counted
            </p>
          </div>

          <section className="rounded-[26px] bg-[#13131E] border border-white/[0.08] p-4 sm:p-5 space-y-3">
            {ballotTallies.entries.map(({ player, votes }, idx) => {
              const pct = totalCast > 0 ? Math.round((votes / totalCast) * 100) : 0;
              const isLeader = votes > 0 && votes === ballotTallies.maxVotes;
              return (
                <div key={player.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#F4F4F8]">
                      <span>{player.emoji}</span>
                      <span>{player.name}</span>
                    </div>
                    <span
                      className={`font-mono font-extrabold tabular-nums ${
                        isLeader ? 'text-rose-400' : 'text-[#8D8DA8]'
                      }`}
                    >
                      {votes} {votes === 1 ? 'vote' : 'votes'}
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
                        isLeader ? 'bg-rose-500' : 'bg-cyan-400/55'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        <div className="space-y-2.5">
          {ballotTallies.topSuspect ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(18);
                onEliminatePlayer(ballotTallies.topSuspect!.id);
              }}
              className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-rose-500 font-display text-base font-extrabold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400 active:scale-[0.98] transition-all cursor-pointer"
            >
              <UserX className="h-5 w-5" aria-hidden="true" />
              <span>Reveal {ballotTallies.topSuspect.name}’s Role</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setBallotVotes({});
                setShowBallotTally(false);
                setActiveVoterId(null);
              }}
              className="w-full min-h-[54px] rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] hover:bg-cyan-300 cursor-pointer"
            >
              Revote Tie-Breaker
            </button>
          )}
        </div>
      </main>
    );
  }

  const votedCount = Object.keys(ballotVotes).length;
  const activeVoter = activeVoterId ? playerMap.get(activeVoterId) : null;
  const selectedPlayer = selectedId ? playerMap.get(selectedId) : null;

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-60px)] w-full max-w-2xl flex-col justify-between px-4 sm:px-6 py-4 pb-safe gap-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onBackToDiscussion();
            }}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 text-xs font-bold text-[#D6D6E6] hover:bg-white/[0.1] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Discussion</span>
          </button>

          {/* Group Vote vs Secret Ballot Toggle */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#13131E] p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setVoteStyle('group');
                setActiveVoterId(null);
              }}
              className={`min-h-[34px] rounded-lg px-2.5 text-xs font-bold transition-colors cursor-pointer ${
                voteStyle === 'group'
                  ? 'bg-cyan-400/18 text-cyan-300'
                  : 'text-[#8D8DA8] hover:text-white'
              }`}
            >
              Group Vote
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setVoteStyle('ballot');
                setActiveVoterId(null);
                setBallotDraft(null);
              }}
              className={`min-h-[34px] rounded-lg px-2.5 text-xs font-bold transition-colors cursor-pointer ${
                voteStyle === 'ballot'
                  ? 'bg-cyan-400/18 text-cyan-300'
                  : 'text-[#8D8DA8] hover:text-white'
              }`}
            >
              Secret Ballot
            </button>
          </div>
        </div>

        {voteStyle === 'group' ? (
          <>
            <div className="text-center space-y-1">
              <h1 className="font-display text-3xl font-extrabold text-[#F4F4F8] tracking-tight">
                Vote Out a Suspect
              </h1>
              <p className="text-sm text-[#8D8DA8]">
                Agree as a group, then tap the accused player to eliminate them.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activePlayers.map((player) => {
                const isSelected = selectedId === player.id;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      triggerHaptic(10);
                      setSelectedId(isSelected ? null : player.id);
                    }}
                    aria-pressed={isSelected}
                    className={`flex min-h-[70px] items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.985] cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-500/10'
                        : 'bg-[#13131E] border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
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
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
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
          </>
        ) : !activeVoter ? (
          /* SECRET BALLOT: Pick Your Name to Cast Secret Vote */
          <div className="space-y-4">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400/12 border border-cyan-400/30 px-3 py-1 font-mono text-xs font-bold text-cyan-300 tabular-nums">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {votedCount} / {activePlayers.length} voted
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F4F4F8]">
                Secret Ballot
              </h1>
              <p className="text-xs sm:text-sm text-[#8D8DA8]">
                Tap your name to cast a hidden vote, then pass the phone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {activePlayers.map((p) => {
                const hasVoted = !!ballotVotes[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={hasVoted}
                    onClick={() => {
                      playTapSound();
                      setActiveVoterId(p.id);
                      setBallotDraft(null);
                    }}
                    className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 min-h-[104px] transition-all ${
                      hasVoted
                        ? 'bg-[#10161D] border-emerald-400/25 opacity-60 cursor-default'
                        : 'bg-[#13131E] border-white/[0.1] hover:border-cyan-400/45 active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    {hasVoted && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="font-display text-sm font-bold text-[#F4F4F8] truncate max-w-full">
                      {p.name}
                    </span>
                    <span className="text-[11px] font-semibold text-[#8D8DA8]">
                      {hasVoted ? 'Voted' : 'Tap to vote'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* SECRET BALLOT: Active Voter Picks Suspect */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {activeVoter.emoji} {activeVoter.name}’s Secret Vote
                </span>
              </p>
              <h1 className="font-display text-2xl font-extrabold text-[#F4F4F8]">
                Who is the Impostor?
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activePlayers.map((suspect) => {
                const picked = ballotDraft === suspect.id;
                return (
                  <button
                    key={suspect.id}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setBallotDraft(suspect.id);
                    }}
                    className={`flex min-h-[64px] items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      picked
                        ? 'bg-rose-500/15 border-rose-500'
                        : 'bg-[#13131E] border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{suspect.emoji}</span>
                      <span className="font-display text-sm font-bold text-[#F4F4F8] truncate">
                        {suspect.name}
                      </span>
                    </div>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        picked ? 'bg-rose-500 border-rose-500 text-white' : 'border-white/25'
                      }`}
                    >
                      {picked && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="space-y-2.5 pt-2">
        {voteStyle === 'group' ? (
          <>
            <button
              type="button"
              disabled={!selectedPlayer}
              onClick={() => {
                if (!selectedPlayer) return;
                triggerHaptic(18);
                onEliminatePlayer(selectedPlayer.id);
              }}
              className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-rose-500 font-display text-base font-extrabold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400 disabled:bg-white/[0.08] disabled:text-[#666680] disabled:shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <UserX className="h-5 w-5" aria-hidden="true" />
              <span>
                {selectedPlayer
                  ? `Eliminate ${selectedPlayer.name}`
                  : 'Select a Player to Eliminate'}
              </span>
            </button>

            {round.hideImpostorCount && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onCallZeroImpostors();
                }}
                className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-colors cursor-pointer"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Chaos Call: Nobody is an Impostor!</span>
              </button>
            )}
          </>
        ) : activeVoter ? (
          <button
            type="button"
            disabled={!ballotDraft}
            onClick={() => {
              if (!ballotDraft) return;
              playTapSound();
              triggerHaptic(14);
              const nextVotes = { ...ballotVotes, [activeVoter.id]: ballotDraft };
              setBallotVotes(nextVotes);
              setActiveVoterId(null);
              setBallotDraft(null);
              if (Object.keys(nextVotes).length >= activePlayers.length) {
                setShowBallotTally(true);
              }
            }}
            className="flex w-full min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] disabled:bg-white/[0.08] disabled:text-[#666680] cursor-pointer"
          >
            <Vote className="h-5 w-5" aria-hidden="true" />
            <span>Lock In Secret Vote</span>
          </button>
        ) : (
          votedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowBallotTally(true);
              }}
              className="w-full min-h-[52px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 cursor-pointer"
            >
              Reveal Tally ({votedCount}/{activePlayers.length} Voted)
            </button>
          )
        )}
      </div>
    </main>
  );
};
