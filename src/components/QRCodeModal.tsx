import React, { useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Link2, QrCode } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { buildInviteUrl, formatSpacedCode } from '../utils/invite';
import { playTapSound, triggerHaptic } from '../utils/audio';

interface QRCodeModalProps {
  isOpen: boolean;
  roomCode: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  roomCode,
  onClose,
}) => {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const inviteUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://impostor.app';
    return buildInviteUrl(origin, roomCode);
  }, [roomCode]);

  const qrMatrix = useMemo(() => {
    if (!roomCode) return null;
    try {
      const qr = QRCode.create(inviteUrl, { errorCorrectionLevel: 'M' });
      const size = qr.modules.size;
      const cells: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (qr.modules.get(x, y)) {
            cells.push({ x, y });
          }
        }
      }
      return { size, cells };
    } catch {
      return null;
    }
  }, [inviteUrl, roomCode]);

  const handleCopy = async (kind: 'code' | 'link') => {
    playTapSound();
    triggerHaptic(10);
    try {
      await navigator.clipboard.writeText(kind === 'code' ? roomCode : inviteUrl);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Scan to Join Room"
      subtitle="Point any camera to join this room"
      icon={<QrCode className="h-5 w-5 text-cyan-400" aria-hidden="true" />}
      maxWidthClass="max-w-sm"
      testId="qr-code-modal"
      footer={
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="w-full min-h-[48px] rounded-2xl bg-white/[0.08] font-display text-sm font-bold text-[#F4F4F8] hover:bg-white/[0.14] transition-colors cursor-pointer"
        >
          Done
        </button>
      }
    >
      <div className="flex flex-col items-center space-y-5 py-1">
        {/* Crisp Scannable SVG QR Code */}
        <div className="rounded-3xl bg-white p-4 shadow-[0_0_40px_rgba(34,211,238,0.16)]">
          {qrMatrix ? (
            <svg
              data-testid="qr-code-svg"
              viewBox={`-2 -2 ${qrMatrix.size + 4} ${qrMatrix.size + 4}`}
              className="h-52 w-52 sm:h-56 sm:w-56 block"
              role="img"
              aria-label={`QR code to join room ${roomCode}`}
              shapeRendering="crispEdges"
            >
              <rect
                x={-2}
                y={-2}
                width={qrMatrix.size + 4}
                height={qrMatrix.size + 4}
                fill="#FFFFFF"
              />
              {qrMatrix.cells.map((cell) => (
                <rect
                  key={`${cell.x}-${cell.y}`}
                  x={cell.x}
                  y={cell.y}
                  width={1}
                  height={1}
                  fill="#09090E"
                />
              ))}
            </svg>
          ) : (
            <div className="flex h-52 w-52 items-center justify-center text-xs text-slate-600">
              Generating QR...
            </div>
          )}
        </div>

        {/* Spaced Room Code */}
        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8D8DA8]">
            Room Code
          </p>
          <p className="font-mono text-3xl font-extrabold tracking-[0.22em] text-cyan-300 pl-[0.22em]">
            {formatSpacedCode(roomCode)}
          </p>
        </div>

        {/* Quick Copy Row */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={() => void handleCopy('code')}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#09090E] border border-white/[0.1] px-3 text-xs font-bold text-[#F4F4F8] hover:border-cyan-400/40 active:scale-[0.98] transition-all cursor-pointer"
          >
            {copied === 'code' ? (
              <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            )}
            <span>{copied === 'code' ? 'Code Copied' : 'Copy Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleCopy('link')}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-3 text-xs font-extrabold text-[#061318] hover:bg-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
          >
            {copied === 'link' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{copied === 'link' ? 'Link Copied' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
