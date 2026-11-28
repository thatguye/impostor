import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILT_IN_CATEGORIES,
  BUILT_IN_QUESTION_DECKS,
  BUILT_IN_WORD_DECKS,
  DEFAULT_SELECTED_DECK_IDS,
} from '../data/gameData';

const BANNED_WORDS = new Set([
  'defenestration',
  'astrolabe',
  'thing',
  'stuff',
  'object',
  'place',
]);

test('library includes all 14 unlocked Word Decks and 9 unlocked Question Decks (23 total)', () => {
  assert.equal(BUILT_IN_WORD_DECKS.length, 14, 'Expected 14 built-in Word Decks');
  assert.equal(BUILT_IN_QUESTION_DECKS.length, 9, 'Expected 9 built-in Question Decks');
  assert.equal(BUILT_IN_CATEGORIES.length, 23, 'Expected 23 total built-in decks');
  assert.equal(
    DEFAULT_SELECTED_DECK_IDS.length,
    BUILT_IN_CATEGORIES.length,
    'Every built-in deck must be unlocked and selectable by default'
  );

  for (const deck of BUILT_IN_CATEGORIES) {
    assert.ok(!deck.isCustom, `Built-in deck "${deck.name}" should not be marked custom`);
    assert.ok(deck.name.trim().length > 0, `Deck ${deck.id} missing name`);
    assert.ok(deck.description.trim().length > 8, `Deck ${deck.id} missing description`);
  }
});

test('all 14 Word Decks have 700+ curated words, descriptions, and 3 distinct calibrated hints each', () => {
  const seenIds = new Set<string>();
  let totalWords = 0;

  for (const deck of BUILT_IN_WORD_DECKS) {
    assert.ok(
      deck.words.length >= 45 && deck.words.length <= 65,
      `Word deck "${deck.name}" has ${deck.words.length} words (expected 45-65)`
    );
    totalWords += deck.words.length;

    const wordSet = new Set<string>();
    for (const w of deck.words) {
      assert.ok(!seenIds.has(w.id), `Duplicate word ID: ${w.id}`);
      seenIds.add(w.id);

      const normalized = w.word.trim().toLowerCase();
      assert.ok(normalized.length > 0, `Empty word in ${deck.name}`);
      assert.ok(!BANNED_WORDS.has(normalized), `Banned vague/archaic word "${w.word}" in ${deck.name}`);
      assert.ok(!wordSet.has(normalized), `Duplicate word "${w.word}" in ${deck.name}`);
      wordSet.add(normalized);

      assert.ok(
        typeof w.description === 'string' && w.description.trim().length >= 12,
        `Missing or too-short description for "${w.word}" in ${deck.name}`
      );

      assert.equal(
        w.hints.length,
        3,
        `Word "${w.word}" in "${deck.name}" has ${w.hints.length} hints (expected exactly 3)`
      );

      const hintSet = new Set<string>();
      for (const hint of w.hints) {
        const cleanHint = hint.trim();
        assert.ok(cleanHint.length >= 5, `Hint too short for "${w.word}": "${hint}"`);
        assert.ok(
          !hintSet.has(cleanHint.toLowerCase()),
          `Duplicate hint "${hint}" on "${w.word}" in ${deck.name}`
        );
        hintSet.add(cleanHint.toLowerCase());
      }
    }
  }

  assert.ok(totalWords >= 700, `Expected at least 700 curated words, found ${totalWords}`);
});

test('all 9 Question Decks have 450+ unique format-matched question pairs', () => {
  const seenIds = new Set<string>();
  let totalQuestions = 0;

  for (const deck of BUILT_IN_QUESTION_DECKS) {
    assert.ok(
      deck.questions.length >= 45 && deck.questions.length <= 65,
      `Question deck "${deck.name}" has ${deck.questions.length} pairs (expected 45-65)`
    );
    totalQuestions += deck.questions.length;

    const qMainSet = new Set<string>();
    const qDecoySet = new Set<string>();
    for (const q of deck.questions) {
      assert.ok(!seenIds.has(q.id), `Duplicate question ID: ${q.id}`);
      seenIds.add(q.id);

      const main = q.main.trim();
      const decoy = q.decoy.trim();
      assert.ok(main.length > 8, `Main question too short in ${deck.name}: ${main}`);
      assert.ok(decoy.length > 8, `Decoy question too short in ${deck.name}: ${decoy}`);
      assert.notEqual(
        main.toLowerCase(),
        decoy.toLowerCase(),
        `Identical main/decoy question in ${deck.name}: ${main}`
      );
      assert.ok(!qMainSet.has(main.toLowerCase()), `Duplicate main question in ${deck.name}: ${main}`);
      assert.ok(!qDecoySet.has(decoy.toLowerCase()), `Duplicate decoy question in ${deck.name}: ${decoy}`);
      qMainSet.add(main.toLowerCase());
      qDecoySet.add(decoy.toLowerCase());
    }
  }

  assert.ok(totalQuestions >= 450, `Expected at least 450 question pairs, found ${totalQuestions}`);
});
