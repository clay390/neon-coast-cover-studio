// Caption presets: one tap fills title + subtitle + badge with a punchy,
// poster-ready tagline. All lines are invented for this app — no Rockstar
// copy, no borrowed slogans.

export const CAPTIONS = [
  { id: 'neon-shore', label: 'Neon Shore', title: 'Neon Shore', subtitle: 'one last ride down the coast', badge: 'VICE COAST • 2026' },
  { id: 'pier-pressure', label: 'Pier Pressure', title: 'Pier Pressure', subtitle: 'golden hour on the pier', badge: 'VICE COAST • 2026' },
  { id: 'midnight-run', label: 'Midnight Run', title: 'Midnight Run', subtitle: 'the city never sleeps, neither do we', badge: 'NIGHT SHIFT' },
  { id: 'salt-air', label: 'Salt Air', title: 'Salt Air', subtitle: 'neon nights, salt air', badge: 'VICE COAST • 2026' },
  { id: 'last-exit', label: 'Last Exit', title: 'Last Exit', subtitle: 'take the coast road home', badge: 'ROUTE 27' },
  { id: 'sunset-strip', label: 'Sunset Strip', title: 'Sunset Strip', subtitle: 'every light is a promise', badge: 'VICE COAST • 2026' },
  { id: 'high-tide', label: 'High Tide', title: 'High Tide', subtitle: 'chase the sun, outrun the tide', badge: 'SUMMER 2026' },
  { id: 'vice-royale', label: 'Vice Royale', title: 'Vice Royale', subtitle: 'play it loud, drive it faster', badge: 'EST. 2026' },
];

/** Picks a random caption preset (never the one already in use, if possible). */
export function randomCaption(currentId, rnd = Math.random) {
  const pool = CAPTIONS.filter((c) => c.id !== currentId);
  return pool[Math.floor(rnd() * pool.length)];
}
