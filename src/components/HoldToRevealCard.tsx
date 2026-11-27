import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Fingerprint, ShieldAlert, Users } from 'lucide-react';
import { PlayerRoleAssignment } from '../types/game';
import { playCardFlipSound, triggerHaptic } from '../utils/audio';

interface HoldToRevealCardProps {
  assignment: PlayerRoleAssignment;
  categoryEmoji: string;
  categoryName: string;
  subtitle?: string;
  testId?: string;
  onHoldingChange?: (holding: boolean) => void;
  onPeeked?: () => void;
}

const RING_RADIUS = 38;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const HoldToRevealCard: React.FC<HoldToRevealCardProps> = ({
  assignment,
  categoryEmoji,
  categoryName,
  subtitle = 'Hold your thumb down to flip. Letting go hides it instantly.',
  testId = 'hold-reveal-card',
  onHoldingChange,
  onPeeked,
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [hasPeeked, setHasPeeked] = useState(false);
  const holdingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Reset if assignment/player changes
  useEffect(() => {
    holdingRef.current = false;
    activePointerIdRef.current = null;
    setIsHolding(false);
    setHasPeeked(false);
    onHoldingChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.playerId, assignment.secretWord, assignment.hintWord, assignment.isImpostor]);

  const startHold = () => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    setIsHolding(true);
    setHasPeeked(true);
    onHoldingChange?.(true);
    onPeeked?.();
    triggerHaptic(15);
    playCardFlipSound(true);
  };

  const endHold = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    activePointerIdRef.current = null;
    setIsHolding(false);
    onHoldingChange?.(false);
    triggerHaptic(8);
    playCardFlipSound(false);
  };

  useEffect(() => {
    const handleGlobalRelease = (e?: PointerEvent) => {
      if (
        e &&
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      if (holdingRef.current) {
        endHold();
      }
    };
    const handleBlur = () => handleGlobalRelease();
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('blur', handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showImpostorAlert = assignment.isImpostor;

  return (
    <div className="perspective-1200 w-full touch-none">
      <button
        type="button"
        data-testid={testId}
        aria-label="Press and Hold to Reveal Role"
        aria-pressed={isHolding}
        onPointerDown={(e) => {
          e.preventDefault();
          activePointerIdRef.current = e.pointerId;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Ignore synthetic capture errors
          }
          startHold();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          if (
            activePointerIdRef.current !== null &&
            e.pointerId !== activePointerIdRef.current
          ) {
            return;
          }
          try {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
          } catch {
            // Ignore release errors
          }
          endHold();
        }}
        onPointerCancel={(e) => {
          if (
            activePointerIdRef.current !== null &&
            e.pointerId !== activePointerIdRef.current
          ) {
            return;
          }
          endHold();
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            startHold();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            endHold();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="no-select-touch touch-none relative block w-full h-[min(350px,50dvh)] sm:h-[min(370px,52dvh)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-[28px] cursor-pointer"
      >
        <div
          className={`card-flip-inner preserve-3d relative h-full w-full ${
            isHolding ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE (Hidden / Progress Ring Hold Surface) */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-[28px] bg-[#13131E] border-2 border-white/[0.1] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden">
            {/* Subtle corner tactical brackets */}
            <span
              aria-hidden="true"
              className="absolute top-4 left-4 h-4 w-4 rounded-tl-md border-t-2 border-l-2 border-white/[0.12]"
            />
            <span
              aria-hidden="true"
              className="absolute top-4 right-4 h-4 w-4 rounded-tr-md border-t-2 border-r-2 border-white/[0.12]"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-4 left-4 h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-white/[0.12]"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-4 right-4 h-4 w-4 rounded-br-md border-b-2 border-r-2 border-white/[0.12]"
            />

            {/* Animated Hold Progress Ring */}
            <div className="relative flex h-24 w-24 items-center justify-center mb-4">
              <svg
                className="absolute inset-0 h-full w-full -rotate-90"
                viewBox="0 0 88 88"
                aria-hidden="true"
              >
                <circle
                  cx="44"
                  cy="44"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="4"
                />
                <circle
                  cx="44"
                  cy="44"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={hasPeeked ? '#34D399' : '#22D3EE'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={
                    isHolding ? 0 : hasPeeked ? 0 : RING_CIRCUMFERENCE * 0.72
                  }
                  style={{
                    transition: 'stroke-dashoffset 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.1] text-cyan-400">
                <Fingerprint className="h-9 w-9" aria-hidden="true" />
              </div>
            </div>

            <h2 className="font-display text-2xl font-extrabold text-[#F4F4F8] tracking-tight">
              Press & Hold to Reveal
            </h2>
            <p className="mt-1.5 max-w-xs text-xs sm:text-sm text-[#9898B0]">
              {subtitle}
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#75758E]">
              <EyeOff className="h-4 w-4" aria-hidden="true" />
              <span>{hasPeeked ? 'Role viewed · Safe to continue' : 'Card is hidden'}</span>
            </div>
          </div>

          {/* BACK FACE (Revealed Secret Role) */}
          <div
            className={`backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-between rounded-[28px] border-2 p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.65)] ${
              showImpostorAlert
                ? 'bg-[#200D16] border-rose-500/75'
                : 'bg-[#0C1C26] border-cyan-400/75'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#B4B4CC]">
              <Eye
                className={`h-4 w-4 ${showImpostorAlert ? 'text-rose-400' : 'text-cyan-400'}`}
                aria-hidden="true"
              />
              <span>
                {categoryEmoji} {categoryName}
              </span>
            </div>

            {assignment.isImpostor ? (
              <div className="space-y-3.5 my-auto w-full">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/45 text-rose-400">
                  <ShieldAlert className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
                  YOU ARE THE IMPOSTOR
                </h2>

                {assignment.hintWord && (
                  <div className="mx-auto max-w-xs rounded-2xl bg-black/35 border border-rose-400/30 px-4 py-2.5">
                    <p className="text-[11px] font-semibold text-rose-200/80">Subtle Hint</p>
                    <p className="mt-0.5 font-display text-lg sm:text-xl font-bold text-white">
                      {assignment.hintWord}
                    </p>
                  </div>
                )}

                {assignment.fellowImpostorNames.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-200">
                    <Users className="h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
                    <span>
                      Partner{assignment.fellowImpostorNames.length > 1 ? 's' : ''}:{' '}
                      <strong className="text-white">
                        {assignment.fellowImpostorNames.join(', ')}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 my-auto w-full">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                  Crewmate · Secret Word
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight break-words">
                  {assignment.secretWord}
                </h2>
                {assignment.wordDescription ? (
                  <div
                    data-testid="civilian-word-description"
                    className="mx-auto max-w-xs rounded-2xl bg-black/30 border border-cyan-400/25 px-4 py-2.5"
                  >
                    <p className="text-xs text-cyan-50/90 leading-relaxed">
                      {assignment.wordDescription}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-cyan-100/70 max-w-xs mx-auto pt-1">
                    Give a clever clue that proves you know it without handing it to the Impostor.
                  </p>
                )}
              </div>
            )}

            <p className="text-[11px] font-medium text-[#9898B0]">
              Release finger to hide immediately
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};
