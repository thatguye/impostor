import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN_CATEGORIES } from '../data/gameData';

test('library includes at least 22 built-in unlocked categories', () => {
  assert.ok(
    BUILT_IN_CATEGORIES.length >= 22,
    `Expected >= 22 categories, found ${BUILT_IN_CATEGORIES.length}`
  );
});

test('every category has 100+ unique words with hints and 100+ unique paired questions', () => {
  const seenIds = new Set<string>();

  for (const cat of BUILT_IN_CATEGORIES) {
    assert.ok(
      cat.words.length >= 100,
      `Category "${cat.name}" has only ${cat.words.length} words (expected >= 100)`
    );
    assert.ok(
      cat.questions.length >= 100,
      `Category "${cat.name}" has only ${cat.questions.length} questions (expected >= 100)`
    );

    const wordSet = new Set<string>();
    for (const w of cat.words) {
      assert.ok(!seenIds.has(w.id), `Duplicate word ID: ${w.id}`);
      seenIds.add(w.id);

      const normalized = w.word.trim().toLowerCase();
      assert.ok(normalized.length > 0, `Empty word in ${cat.name}`);
      assert.ok(!wordSet.has(normalized), `Duplicate word "${w.word}" in ${cat.name}`);
      wordSet.add(normalized);

      assert.ok(w.hints.length >= 1 && w.hints.length <= 2, `Invalid hints count for ${w.word}`);
      for (const hint of w.hints) {
        assert.ok(hint.trim().length > 0, `Empty hint for ${w.word}`);
      }
    }

    const qMainSet = new Set<string>();
    const qDecoySet = new Set<string>();
    for (const q of cat.questions) {
      assert.ok(!seenIds.has(q.id), `Duplicate question ID: ${q.id}`);
      seenIds.add(q.id);

      const main = q.main.trim();
      const decoy = q.decoy.trim();
      assert.ok(main.length > 8, `Main question too short in ${cat.name}: ${main}`);
      assert.ok(decoy.length > 8, `Decoy question too short in ${cat.name}: ${decoy}`);
      assert.notEqual(
        main.toLowerCase(),
        decoy.toLowerCase(),
        `Identical main/decoy question in ${cat.name}: ${main}`
      );
      assert.ok(!qMainSet.has(main.toLowerCase()), `Duplicate main question in ${cat.name}: ${main}`);
      assert.ok(!qDecoySet.has(decoy.toLowerCase()), `Duplicate decoy question in ${cat.name}: ${decoy}`);
      qMainSet.add(main.toLowerCase());
      qDecoySet.add(decoy.toLowerCase());
    }
  }
});
