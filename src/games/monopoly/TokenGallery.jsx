import { useEffect, useState } from 'react';
import { PIECE_CATALOG } from '../../three/models.js';
import { Piece3D, PieceImage } from '../../three/Piece3D.jsx';
import { Dice3D } from '../../three/Dice3D.jsx';

const CATEGORIES = ['ALL', 'Cờ Tỷ Phú', 'Cờ Vua', 'Cờ Cá Ngựa'];

export default function TokenGallery({ isOpen, onClose }) {
  const [filter, setFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(PIECE_CATALOG[0].id);
  const [dice, setDice] = useState({ d6: 6, d20: 20, key: 0 });

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selected = PIECE_CATALOG.find((p) => p.id === selectedId) || PIECE_CATALOG[0];
  const filtered = filter === 'ALL' ? PIECE_CATALOG : PIECE_CATALOG.filter((p) => p.category === filter);

  const testRoll = () => {
    setDice((prev) => ({
      key: prev.key + 1,
      d6: Math.floor(Math.random() * 6) + 1,
      d20: Math.floor(Math.random() * 20) + 1
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bộ sưu tập quân cờ 3D"
        onClick={(e) => e.stopPropagation()}
        className="anim-pop flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-amber-700/70 bg-stone-900 shadow-[0_25px_80px_rgba(0,0,0,0.95)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-amber-900/50 bg-stone-950 p-3 sm:p-4">
          <div>
            <h2 className="font-display text-lg font-bold text-amber-400 sm:text-xl">🏛️ Tủ Quân Cờ 3D</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bộ sưu tập"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-800 text-stone-300 transition hover:bg-stone-700"
          >
            ✕
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-3 sm:p-4 md:grid-cols-12">
          <div className="flex flex-col items-center rounded-xl border border-stone-800 bg-stone-950/70 p-3 md:col-span-6 md:p-4">
            <div className="flex h-56 w-full items-center justify-center rounded-xl border border-amber-500/25 bg-gradient-to-b from-stone-900/70 to-black/80">
              <Piece3D classId={selected.id} hexColor={selected.color} size={208} active animated interactive />
            </div>
            <h3 className="mt-3 flex items-center gap-2 text-xl font-black text-stone-100">
              <span aria-hidden="true">{selected.icon}</span> {selected.name}
            </h3>
            <p className="text-xs font-semibold text-amber-400/90">{selected.category}</p>

            <div className="mt-4 w-full border-t border-stone-800 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase">Thử xúc xắc 3D</span>
                <button
                  type="button"
                  onClick={testRoll}
                  className="rounded-md bg-amber-700 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-amber-600"
                >
                  🎲 Tung thử
                </button>
              </div>
              <div className="flex items-center justify-around rounded-lg border border-stone-800 bg-stone-900/80 p-2">
                <Dice3D type="D6" value={dice.d6} rollKey={dice.key} size={88} theme="ivory" />
                <Dice3D type="D20" value={dice.d20} rollKey={dice.key} size={88} theme="amethyst" />
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col md:col-span-6">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`rounded-md px-3 py-1 text-[11px] font-bold transition ${
                    filter === cat ? 'bg-amber-600 text-white shadow' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid max-h-[48dvh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {filtered.map((piece) => {
                const active = piece.id === selected.id;
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => setSelectedId(piece.id)}
                    className={`flex flex-col items-center rounded-xl border p-2 transition ${
                      active
                        ? 'scale-[1.02] border-amber-500 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'border-stone-800 bg-stone-900/60 hover:border-stone-600'
                    }`}
                  >
                    <PieceImage classId={piece.id} hexColor={piece.color} size={52} />
                    <span className="mt-1 flex w-full items-center justify-center gap-1 truncate text-[10px] font-bold text-stone-200">
                      <span aria-hidden="true">{piece.icon}</span> {piece.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="flex justify-end border-t border-stone-800 bg-stone-950 p-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-stone-800 px-5 py-2 text-sm font-bold text-stone-200 transition hover:bg-stone-700"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
}
