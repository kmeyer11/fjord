// Mirrors the --color-fjord/glacier/moss/birch/clay/heather tokens in index.css.
// Stored as literal hex (rather than a var() reference) so the color travels
// intact outside the app shell — the .ics feed and any future clients.
export const PROJECT_PALETTE = [
  { name: 'Fjord', value: '#3c6e90' },
  { name: 'Glacier', value: '#2f8f89' },
  { name: 'Moss', value: '#57784a' },
  { name: 'Birch', value: '#a97e2e' },
  { name: 'Clay', value: '#9c4a34' },
  { name: 'Heather', value: '#75587f' },
]
