import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  History,
  Share,
  SlidersHorizontal,
  Trophy,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import { GamePhase } from '../types/game';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { BottomSheet } from './BottomSheet';
import { playTapSound } from '../utils/audio';

interface HeaderBarProps {
  phase: GamePhase;
  isPassLobby?: boolean;
  isOnlineRoom?: boolean;
  isMuted: boolean;
  scoreboardEnabled: boolean;
  hasScores: boolean;
  onToggleMute: () => void;
  onOpenScoreboard: () => void;
  onOpenChangelog: () => void;
  onOpenPassSettings?: () => void;
  onExitPassLobby?: () => void;
  onReturnToLobby: () => void;
}

const PHASE_TITLES: Record<GamePhase, string> = {
  lobby: 'Impostor',
  privacy_pass: 'Secret Roles',
  discussion: 'Discussion',
  voting: 'Cast Vote',
  elimination_reveal: 'Elimination',
  round_summary: 'Round Summary',
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  phase,
  isPassLobby = false,
  isOnlineRoom = false,
  isMuted,
  scoreboardEnabled,
  hasScores,
  onToggleMute,
  onOpenScoreboard,
  onOpenChangelog,
  onOpenPassSettings,
  onExitPassLobby,
  onReturnToLobby,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSInstall, setShowIOSInstall] = useState(false);

  // Online rooms render their own Finders Keepers-style top bar to prevent stacked headers
  if (isOnlineRoom) {
    return null;
  }

  const inActiveGame = phase !== 'lobby';

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#09090E]/90 backdrop-blur-xl border-b border-white/[0.06] pt-safe">
        <div className="mx-auto flex h-15 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left Zone */}
          {inActiveGame ? (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onReturnToLobby();
              }}
              aria-label="Exit to Lobby"
              className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 text-xs font-bold text-[#D6D6E6] hover:bg-white/[0.1] hover:text-white active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Lobby</span>
            </button>
          ) : isPassLobby ? (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onExitPassLobby?.();
              }}
              aria-label="Back to Home"
              className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 text-xs font-bold text-[#D6D6E6] hover:bg-white/[0.1] hover:text-white active:scale-[0.97] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl border border-cyan-400/30 bg-[#13131E] overflow-hidden shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
                <img
                  src="/pwa-192x192.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="block font-display text-sm sm:text-base font-extrabold tracking-[0.14em] uppercase text-[#F4F4F8] whitespace-nowrap">
                  IMPOSTOR
                </span>
                <span className="block text-[11px] font-medium text-[#7C7C98] whitespace-nowrap">
                  Social Deduction
                </span>
              </div>
            </div>
          )}

          {/* Center Title (only in Pass Lobby or Active Game) */}
          {(isPassLobby || inActiveGame) && (
            <span className="font-display text-sm sm:text-base font-extrabold text-[#F4F4F8] tracking-tight truncate">
              {inActiveGame ? PHASE_TITLES[phase] : 'Pass & Play'}
            </span>
          )}

          {/* Right Zone: Tactile Squircle Icon Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isOnline && (
              <span
                className="flex h-10 items-center gap-1.5 rounded-xl bg-amber-400/10 border border-amber-400/25 px-2.5 text-xs font-semibold text-amber-300 whitespace-nowrap"
                title="Playing offline"
              >
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}

            {!isInstalled && (isInstallable || isIOS) && !inActiveGame && !isPassLobby && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  if (isInstallable) {
                    install();
                  } else {
                    setShowIOSInstall(true);
                  }
                }}
                aria-label={isIOS ? 'Install on iPhone' : 'Install App'}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3 text-xs font-bold text-[#F4F4F8] hover:bg-white/[0.12] active:scale-[0.96] transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span>Install</span>
              </button>
            )}

            {isPassLobby && onOpenPassSettings && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onOpenPassSettings();
                }}
                aria-label="Open House Rules"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#C8C8DC] hover:bg-white/[0.12] hover:text-white active:scale-[0.96] transition-all cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              </button>
            )}

            {!isPassLobby && !inActiveGame && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onOpenChangelog();
                }}
                aria-label="Open Changelog"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#B8B8CE] hover:bg-white/[0.12] hover:text-white active:scale-[0.96] transition-all cursor-pointer"
              >
                <History className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {inActiveGame && scoreboardEnabled && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onOpenScoreboard();
                }}
                aria-label="Open Scoreboard"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#B8B8CE] hover:bg-white/[0.12] hover:text-white active:scale-[0.96] transition-all cursor-pointer"
              >
                <Trophy
                  className={`h-4 w-4 ${hasScores ? 'text-amber-400' : 'text-[#9898B0]'}`}
                  aria-hidden="true"
                />
              </button>
            )}

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              aria-pressed={isMuted}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#B8B8CE] hover:bg-white/[0.12] hover:text-white active:scale-[0.96] transition-all cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-rose-400" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* iOS Safari Add to Home Screen Bottom Sheet */}
      <BottomSheet
        isOpen={showIOSInstall}
        onClose={() => setShowIOSInstall(false)}
        title="Install Impostor on iOS"
        subtitle="Play fullscreen offline just like a native app"
        icon={<Download className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
        maxWidthClass="max-w-sm"
        footer={
          <button
            type="button"
            onClick={() => setShowIOSInstall(false)}
            className="w-full min-h-[48px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 transition-colors cursor-pointer"
          >
            Got It
          </button>
        }
      >
        <ol className="space-y-3.5 text-sm text-[#F4F4F8]">
          <li className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
              1
            </span>
            <span>
              Tap the{' '}
              <strong className="inline-flex items-center gap-1 text-white">
                <Share className="h-3.5 w-3.5 text-cyan-400" /> Share
              </strong>{' '}
              button in Safari’s toolbar.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
              2
            </span>
            <span>
              Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
              3
            </span>
            <span>Launch Impostor from your Home Screen anytime.</span>
          </li>
        </ol>
      </BottomSheet>
    </>
  );
};
