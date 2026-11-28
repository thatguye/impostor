import { CategoryDeck } from '../types/game';
import { WORD_DECKS_01_03 } from './decks/words_01_03';
import { WORD_DECKS_04_06 } from './decks/words_04_06';
import { WORD_DECKS_07_09 } from './decks/words_07_09';
import { WORD_DECKS_10_12 } from './decks/words_10_12';
import { WORD_DECKS_13_14 } from './decks/words_13_14';
import { QUESTION_DECKS_01_03 } from './decks/questions_01_03';
import { QUESTION_DECKS_04_06 } from './decks/questions_04_06';
import { QUESTION_DECKS_07_09 } from './decks/questions_07_09';

export const BUILT_IN_WORD_DECKS: CategoryDeck[] = [
  ...WORD_DECKS_01_03,
  ...WORD_DECKS_04_06,
  ...WORD_DECKS_07_09,
  ...WORD_DECKS_10_12,
  ...WORD_DECKS_13_14,
];

export const BUILT_IN_QUESTION_DECKS: CategoryDeck[] = [
  ...QUESTION_DECKS_01_03,
  ...QUESTION_DECKS_04_06,
  ...QUESTION_DECKS_07_09,
];

export const BUILT_IN_CATEGORIES: CategoryDeck[] = [
  ...BUILT_IN_WORD_DECKS,
  ...BUILT_IN_QUESTION_DECKS,
];

export const PLAYER_AVATAR_EMOJIS = [
  '🦊', '🐙', '🦁', '🐼', '🐸', '🦉', '🦄', '🐯',
  '🐨', '🐺', '🦋', '🦖', '🦈', '🐝', '🦩', '🦝',
  '👾', '🤖', '👻', '🎭', '🔥', '⚡', '🌙', '🍄',
];

export const PLAYER_AVATAR_COLORS = [
  '#22D3EE', // Cyan
  '#F43F5E', // Crimson Rose
  '#A78BFA', // Electric Violet
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#FB923C', // Tangerine
  '#60A5FA', // Sky Blue
  '#E879F9', // Fuchsia
  '#2DD4BF', // Teal
  '#FB7185', // Coral Pink
];

export const DECK_EMOJIS = [
  '🎯', '🔥', '🎲', '🧠', '🍕', '🎬', '🎧', '⚽',
  '🌍', '🚀', '🎭', '👾', '🥂', '🎈', '💎', '⚡',
];

export const DEFAULT_SELECTED_DECK_IDS = BUILT_IN_CATEGORIES.map((d) => d.id);
