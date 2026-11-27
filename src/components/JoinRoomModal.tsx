import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, KeyRound, X } from 'lucide-react';
import { extractRoomCodeFromInput } from '../utils/invite';
import { playTapSound, triggerHaptic } from '../utils/audio';

interface JoinRoomModalProps {
  isOpen: boolean;
  code: string;
  playerName: string;
  loading: boolean;
  error: string | null;
  onChangeCode: (nextCode: string) => void;
  onChangePlayerName: (nextName: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  code,
  playerName,
  loading,
  error,
  onChangeCode,
  onChangePlayerName,
  onSubmit,
  onClose,
}) => {
  const hiddenCodeInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      if (!playerName.trim()) {
        nameInputRef.current?.focus();
      } else {
        hiddenCodeInputRef.current?.focus();
      }
    }, 140);
    return () => window.clearTimeout(t);
    // Only focus when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const cleanCode = extractRoomCodeFromInput(code);
  const slots = [0, 1, 2, 3];
  const canJoin = cleanCode.length === 4 && playerName.trim().length > 0 && !loading;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJoin) return;
    playTapSound();
    triggerHaptic(14);
    onSubmit();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-room-modal-title"
          data-testid="join-room-modal"
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[11vh] sm:pt-[15vh]"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Upper-middle Dialog (stays clear of mobile keyboard) */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="relative z-10 w-full max-w-md rounded-[28px] bg-[#13131E] border border-white/[0.12] p-5 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.75)]"
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/12 border border-cyan-400/25 text-cyan-300">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="join-room-modal-title"
                    className="font-display text-lg font-extrabold text-[#F4F4F8]"
                  >
                    Join with a code
                  </h2>
                  <p className="text-xs text-[#8D8DA8]">
                    Enter the 4-character room code from your host
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onClose();
                }}
                aria-label="Close Join with a code"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-[#9898B0] hover:bg-white/[0.12] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              {/* Callsign Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="join-player-name"
                  className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D8DA8]"
                >
                  Your Name
                </label>
                <input
                  id="join-player-name"
                  ref={nameInputRef}
                  type="text"
                  value={playerName}
                  onChange={(e) => onChangePlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={22}
                  autoComplete="nickname"
                  className="w-full min-h-[48px] rounded-2xl bg-[#09090E] border border-white/[0.12] px-4 text-base font-semibold text-[#F4F4F8] placeholder:text-[#666680] focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* 4-Slot Segmented Room Code Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="segmented-room-code-input"
                  className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D8DA8]"
                >
                  Room Code
                </label>

                <div
                  onClick={() => hiddenCodeInputRef.current?.focus()}
                  className="relative cursor-text"
                >
                  <input
                    id="segmented-room-code-input"
                    ref={hiddenCodeInputRef}
                    data-testid="online-join-code-input"
                    type="text"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={cleanCode}
                    onChange={(e) => onChangeCode(extractRoomCodeFromInput(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text');
                      onChangeCode(extractRoomCodeFromInput(pasted));
                    }}
                    aria-label="4-character room code"
                    className="peer absolute inset-0 z-10 h-full w-full opacity-0 cursor-text"
                  />

                  <div className="grid grid-cols-4 gap-2.5">
                    {slots.map((idx) => {
                      const char = cleanCode[idx] ?? '';
                      const isActive =
                        idx === Math.min(cleanCode.length, 3) && cleanCode.length < 4;
                      const isFilled = char.length > 0;
                      return (
                        <div
                          key={idx}
                          data-testid={`code-slot-${idx}`}
                          className={`flex h-16 items-center justify-center rounded-2xl border-2 font-mono text-3xl font-extrabold transition-all ${
                            isFilled
                              ? 'bg-[#0C1922] border-cyan-400/75 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.14)]'
                              : isActive
                              ? 'bg-[#09090E] border-cyan-400/60 text-white'
                              : 'bg-[#09090E] border-white/[0.1] text-[#4C4C63]'
                          }`}
                        >
                          {char || (isActive ? <span className="h-6 w-0.5 bg-cyan-400 animate-pulse" /> : '·')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-2xl bg-rose-500/12 border border-rose-500/35 px-3.5 py-2.5 text-xs font-semibold text-rose-300"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canJoin}
                data-testid="join-room-submit-btn"
                className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-cyan-400 font-display text-base font-extrabold text-[#061318] shadow-lg shadow-cyan-500/20 hover:bg-cyan-300 disabled:bg-white/[0.08] disabled:text-[#666680] disabled:shadow-none active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Joining Room...' : 'Join Room'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
