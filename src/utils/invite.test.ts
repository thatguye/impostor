import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInviteUrl,
  extractRoomCodeFromInput,
  formatSpacedCode,
} from './invite.ts';

test('buildInviteUrl creates clean ?room=XXXX invite URLs', () => {
  assert.equal(
    buildInviteUrl('https://impostor.pages.dev/', 'k9xp'),
    'https://impostor.pages.dev/?room=K9XP'
  );
  assert.equal(
    buildInviteUrl('http://localhost:3000', 'ab23'),
    'http://localhost:3000/?room=AB23'
  );
});

test('extractRoomCodeFromInput handles raw codes, spaced codes, and full invite URLs', () => {
  assert.equal(extractRoomCodeFromInput('k9xp'), 'K9XP');
  assert.equal(extractRoomCodeFromInput(' k 9 x p '), 'K9XP');
  assert.equal(
    extractRoomCodeFromInput('https://impostor.pages.dev/?room=m4zt&utm=share'),
    'M4ZT'
  );
  assert.equal(extractRoomCodeFromInput(''), '');
});

test('formatSpacedCode formats 4-character codes with spaces for readability', () => {
  assert.equal(formatSpacedCode('k9xp'), 'K 9 X P');
});
