export interface ChangelogEntry {
  version: string;
  date: string;
  time: string;
  title: string;
  items: string[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: 'v1.6',
    date: 'Nov 22, 2026',
    time: '8:47 PM',
    title: 'Custom Player Icons',
    items: [
      'Added custom emojis, letters, and symbols for player icons.',
    ],
  },
  {
    version: 'v1.5',
    date: 'Nov 22, 2026',
    time: '8:22 PM',
    title: 'Word Context & Changelog',
    items: [
      'Added word descriptions.',
      'Added changelog.',
      'Refreshed category decks.',
    ],
  },
  {
    version: 'v1.4',
    date: 'Nov 22, 2026',
    time: '7:41 PM',
    title: 'Player Picker',
    items: [
      'Added tap-your-name player selection.',
    ],
  },
  {
    version: 'v1.3',
    date: 'Nov 22, 2026',
    time: '7:38 PM',
    title: 'App Icon',
    items: [
      'Added new app icon.',
    ],
  },
  {
    version: 'v1.2',
    date: 'Nov 22, 2026',
    time: '7:30 PM',
    title: 'Question Game',
    items: [
      'Added typed answers.',
    ],
  },
  {
    version: 'v1.1',
    date: 'Nov 22, 2026',
    time: '6:45 PM',
    title: 'Launch',
    items: [
      'Added Word Game and Question Game.',
      'Added custom decks, player groups, and scoreboard.',
    ],
  },
];
