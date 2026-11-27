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

export const HoldToRevealCard: React.FC<HoldToRevealCardProps> = ({
  assignment,
  categoryEmoji,
  categoryName,
  subtitle = 'Press and hold anywhere on this card. Release to hide it instantly.',
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
    triggerHaptic(14);
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
        aria-label="Hold to Reveal Role"
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
        className="no-select-touch touch-none relative block w-full h-[min(390px,56dvh)] sm:h-[min(420px,58dvh)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-3xl cursor-pointer"
      >
        <div
          className={`card-flip-inner preserve-3d relative h-full w-full ${
            isHolding ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE (Original Clean Hidden Role Card) */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-[#14141F] border-2 border-white/[0.1] p-7 text-center shadow-2xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.05] border border-white/[0.1] text-cyan-400 mb-5">
              <Fingerprint className="h-10 w-10" aria-hidden="true" />
            </div>

            <h2 className="font-display text-2xl font-extrabold text-[#F4F4F8]">
              Hold to Reveal Role
            </h2>
            <p className="mt-2 max-w-xs text-sm text-[#9898B0]">{subtitle}</p>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#75758E]">
              <EyeOff className="h-4 w-4" aria-hidden="true" />
              <span>{hasPeeked ? 'Role viewed · Safe to pass' : 'Card is hidden'}</span>
            </div>
          </div>

          {/* BACK FACE (Original Clean Revealed Secret Role) */}
          <div
            className={`backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-between rounded-3xl border-2 p-7 text-center shadow-2xl ${
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
              <div className="space-y-4 my-auto w-full">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/45 text-rose-400">
                  <ShieldAlert className="h-8 w-8" aria-hidden="true" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
                  YOU ARE THE IMPOSTOR
                </h2>

                {assignment.hintWord && (
                  <div className="mx-auto max-w-xs rounded-2xl bg-black/35 border border-rose-400/30 px-4 py-3">
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
                  Secret Word
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
                    Give a clever clue that proves you know it without giving it away.
                  </p>
                )}
              </div>
            )}

            <p className="text-xs font-medium text-[#9898B0]">
              Release finger to hide immediately
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};
