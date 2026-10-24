import { useEffect, useRef } from 'react';

const TONE = {
  info: 'text-stone-300 border-stone-700',
  success: 'text-emerald-300 border-emerald-800/70',
  danger: 'text-rose-300 border-rose-900/70',
  gold: 'text-amber-300 border-amber-800/70',
  victory: 'text-amber-200 border-amber-500/60 bg-amber-950/30',
  muted: 'text-stone-500 border-stone-800'
};

export default function LogPanel({ logs = [] }) {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950/80">
      <header className="flex shrink-0 items-center justify-between border-b border-stone-800 px-3 py-2">
        <h2 className="text-xs font-black tracking-[0.18em] text-stone-300 uppercase">Nhật ký hành trình</h2>
        <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-stone-400">{logs.length}</span>
      </header>

      <ol ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2" aria-live="polite">
        {logs.length === 0 && <li className="px-1 py-4 text-center text-[11px] text-stone-600 italic">Chưa có sự kiện nào.</li>}
        {logs.map((entry) => (
          <li
            key={entry.id}
            className={`rounded-md border-l-2 bg-stone-900/40 px-2 py-1 text-[11px] leading-snug ${TONE[entry.tone] || TONE.info}`}
          >
            {entry.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
