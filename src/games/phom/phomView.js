export const label = (card) => `${card.rankLabel}${card.suitSymbol}`;

const AVATAR_TONES = [
  'bg-amber-700/40 text-amber-200 border-amber-500/50',
  'bg-violet-700/40 text-violet-200 border-violet-500/50',
  'bg-emerald-700/40 text-emerald-200 border-emerald-500/50',
  'bg-sky-700/40 text-sky-200 border-sky-500/50'
];

export const initials = (name = '?') => name.trim().slice(0, 2).toUpperCase();

export const toneOf = (id) => AVATAR_TONES[id % AVATAR_TONES.length];
