import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { APP_VERSION } from '../data/changelog';
import { playSplashChime, triggerHaptic, unlockIOSAudio } from '../utils/audio';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const dismissedRef = useRef(false);

  const finish = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const chimeTimer = window.setTimeout(() => {
      playSplashChime();
    }, 180);

    const autoTimer = window.setTimeout(finish, prefersReduced ? 450 : 1320);

    return () => {
      window.clearTimeout(chimeTimer);
      window.clearTimeout(autoTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      data-testid="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => {
        unlockIOSAudio();
        triggerHaptic(10);
        finish();
      }}
      role="button"
      tabIndex={0}
      aria-label="Skip launch splash"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          unlockIOSAudio();
          finish();
        }
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#07070C] px-6 py-10 pt-safe pb-safe select-none cursor-pointer overflow-hidden"
    >
      {/* Subtle Ambient Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(34,211,238,0.12),transparent_56%)]"
      />

      {/* Top spacer */}
      <div className="h-6" />

      {/* Center Tactical Radar Emblem + Brand Lockup */}
      <div className="relative flex flex-col items-center">
        {/* Radar Container */}
        <div className="relative flex h-56 w-56 items-center justify-center">
          {/* Concentric Radar Rings */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-cyan-400/[0.08]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-6 rounded-full border border-cyan-400/[0.12]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-12 rounded-full border border-white/[0.08]"
          />

          {/* Rotating Subtle Radar Sweep Wedge */}
          <div
            aria-hidden="true"
            className="animate-radar-spin absolute inset-3 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(34,211,238,0.22) 0deg, rgba(34,211,238,0.03) 48deg, transparent 78deg, transparent 360deg)',
              maskImage: 'radial-gradient(circle, transparent 34%, black 35%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 34%, black 35%)',
            }}
          />

          {/* Expanding Pulse Ring */}
          <div
            aria-hidden="true"
            className="animate-pulse-ring absolute h-24 w-24 rounded-3xl border border-cyan-400/55"
          />

          {/* 4 Corner Tactical Reticle Brackets */}
          <div aria-hidden="true" className="absolute h-28 w-28">
            <span className="absolute top-0 left-0 h-4 w-4 rounded-tl-md border-t-2 border-l-2 border-cyan-400/70" />
            <span className="absolute top-0 right-0 h-4 w-4 rounded-tr-md border-t-2 border-r-2 border-cyan-400/70" />
            <span className="absolute bottom-0 left-0 h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-rose-500/65" />
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-br-md border-b-2 border-r-2 border-rose-500/65" />
          </div>

          {/* Hooded Emblem Tile */}
          <motion.div
            initial={{ scale: 0.72, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#13131E] border border-cyan-400/35 shadow-[0_0_38px_rgba(34,211,238,0.22)] overflow-hidden"
          >
            <img
              src="/pwa-192x192.png"
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>

        {/* Staggered Brand Typography */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-display text-4xl font-extrabold tracking-[0.22em] text-white pl-[0.22em]"
        >
          IMPOSTOR
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-1.5 text-[11px] font-semibold tracking-[0.34em] uppercase text-[#8A8AA6] pl-[0.34em]"
        >
          SOCIAL DEDUCTION
        </motion.p>

        {/* Sleek Horizontal Progress Bar */}
        <div className="mt-7 h-1 w-44 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.12, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'left center' }}
            className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-rose-400"
          />
        </div>
      </div>

      {/* Bottom Quiet Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="flex flex-col items-center gap-1 text-center"
      >
        <p className="text-xs font-medium text-[#6C6C86]">Tap anywhere to continue</p>
        <span className="font-mono text-[10px] text-[#4E4E64]">{APP_VERSION}</span>
      </motion.div>
    </motion.div>
  );
};
