import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidthClass = 'max-w-lg',
  footer,
  children,
  testId,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const titleId = `sheet-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-testid={testId}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sheet Surface */}
          <motion.div
            initial={{ y: '100%', opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.85 }}
            transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.35 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 110 || info.velocity.y > 520) {
                playTapSound();
                onClose();
              }
            }}
            className={`relative z-10 flex max-h-[90dvh] w-full ${maxWidthClass} flex-col rounded-t-[28px] sm:rounded-[28px] bg-[#13131E] border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.75)] overflow-hidden`}
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="h-1.5 w-11 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-3.5 sm:pt-5 pb-3.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 min-w-0">
                {icon && <span className="shrink-0">{icon}</span>}
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="font-display text-lg sm:text-xl font-extrabold text-[#F4F4F8] tracking-tight truncate"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-[#8D8DA8] truncate">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onClose();
                }}
                aria-label={`Close ${title}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#9898B0] hover:bg-white/[0.12] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4">
              {children}
            </div>

            {/* Optional Pinned Footer */}
            {footer && (
              <div className="border-t border-white/[0.08] bg-[#13131E] px-5 sm:px-6 py-3.5 pb-safe">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
