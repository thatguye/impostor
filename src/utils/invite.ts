import { normalizeRoomCode } from '../game/online';

export function buildInviteUrl(origin: string, roomCode: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanCode = normalizeRoomCode(roomCode);
  return `${cleanOrigin}/?room=${encodeURIComponent(cleanCode)}`;
}

/**
 * Extracts a 4-character room code from either raw typed input ("k9xp", "K 9 X P")
 * or a pasted invite URL ("https://example.com/?room=K9XP").
 */
export function extractRoomCodeFromInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const roomMatch = trimmed.match(/[?&]room=([A-Za-z0-9]+)/i);
  if (roomMatch?.[1]) {
    return normalizeRoomCode(roomMatch[1]);
  }

  return normalizeRoomCode(trimmed);
}

export function formatSpacedCode(code: string): string {
  return normalizeRoomCode(code).split('').join(' ');
}
