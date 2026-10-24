const SIZES = {
  sm: { box: 'h-10 w-7 rounded-[4px] text-[9px]', suit: 'text-sm' },
  md: { box: 'h-14 w-10 rounded-md text-[11px] sm:h-16 sm:w-11 sm:text-xs', suit: 'text-lg sm:text-xl' },
  lg: { box: 'h-[4.5rem] w-12 rounded-lg text-xs sm:h-20 sm:w-14', suit: 'text-xl sm:text-2xl' }
};

export default function Card({ card, selected = false, onClick, disabled = false, size = 'md' }) {
  if (!card) return null;
  const red = card.suitColor === 'red';
  const tone = red ? 'text-rose-600' : 'text-stone-900';
  const s = SIZES[size] || SIZES.md;
  const clickable = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-pressed={onClick ? selected : undefined}
      aria-label={`${card.rankLabel} ${card.suitSymbol}`}
      className={`relative flex shrink-0 select-none flex-col justify-between border bg-gradient-to-b from-white to-stone-100 p-1 font-bold shadow-md transition-all duration-150 disabled:opacity-100 enabled:hover:-translate-y-1 ${s.box} ${
        selected
          ? '-translate-y-3 border-amber-400 ring-2 ring-amber-300 shadow-[0_8px_18px_rgba(0,0,0,0.45)]'
          : 'border-stone-300/90'
      } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`leading-none ${tone}`}>
        <span className="block">{card.rankLabel}</span>
        <span className="block">{card.suitSymbol}</span>
      </span>
      <span className={`self-center leading-none ${tone} ${s.suit}`} aria-hidden="true">
        {card.suitSymbol}
      </span>
      <span className={`rotate-180 self-end leading-none ${tone}`} aria-hidden="true">
        <span className="block">{card.rankLabel}</span>
        <span className="block">{card.suitSymbol}</span>
      </span>
    </button>
  );
}

export function CardBack({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 overflow-hidden border-2 border-amber-100/40 bg-[repeating-linear-gradient(45deg,#065f46_0px,#065f46_4px,#064e3b_4px,#064e3b_8px)] shadow-md ${s.box} ${className}`}
    >
      <span className="absolute inset-0 flex items-center justify-center text-amber-300/80">
        <span className="rounded-full border border-amber-300/40 px-1 py-0.5 text-[8px] leading-none">♠</span>
      </span>
    </span>
  );
}
