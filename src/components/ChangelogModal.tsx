import React from 'react';
import { Clock, History } from 'lucide-react';
import { APP_VERSION, CHANGELOG_ENTRIES } from '../data/changelog';
import { BottomSheet } from './BottomSheet';
import { playTapSound } from '../utils/audio';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Changelog"
      subtitle={`Release history · ${APP_VERSION}`}
      icon={<History className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
      testId="changelog-modal"
      footer={
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="w-full min-h-[48px] rounded-2xl bg-cyan-400 font-display text-sm font-extrabold text-[#061318] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
        >
          Close
        </button>
      }
    >
      <div className="space-y-3.5">
        {CHANGELOG_ENTRIES.map((entry, idx) => (
          <article
            key={entry.version}
            className={`rounded-2xl border p-4 space-y-2.5 ${
              idx === 0
                ? 'bg-[#0D1A23] border-cyan-400/35'
                : 'bg-[#09090E] border-white/[0.07]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-extrabold ${
                    idx === 0 ? 'text-cyan-300' : 'text-[#9898B0]'
                  }`}
                >
                  {entry.version}
                </span>
                {idx === 0 && (
                  <span className="rounded-md bg-cyan-400/18 border border-cyan-400/35 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    LATEST
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8D8DA8] tabular-nums">
                <Clock className="h-3 w-3 text-[#6E6E88]" aria-hidden="true" />
                <span>
                  {entry.date} · {entry.time}
                </span>
              </div>
            </div>

            <h3 className="font-display text-sm font-bold text-[#F4F4F8]">{entry.title}</h3>

            <ul className="space-y-1.5 text-xs text-[#B8B8CE] leading-relaxed">
              {entry.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-cyan-400 shrink-0" aria-hidden="true">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </BottomSheet>
  );
};
