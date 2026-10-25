import { lazy, Suspense, useCallback, useState } from 'react';
import { CARD_MODES } from './cardModes.js';

const TienLenGame = lazy(() => import('../tienlen/TienLenGame.jsx'));
const PhomGame = lazy(() => import('../phom/PhomGame.jsx'));

const STORAGE_KEY = 'cards.mode';

const readMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return CARD_MODES.some((m) => m.id === saved) ? saved : 'TIEN_LEN';
  } catch {
    return 'TIEN_LEN';
  }
};

function Loading() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-xs font-bold tracking-widest text-emerald-400 uppercase">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-700 border-t-emerald-300" />
      Đang trải chiếu bài…
    </div>
  );
}

export default function CardGames() {
  const [mode, setMode] = useState(readMode);
  const [session, setSession] = useState({ joined: false, inGame: false, leave: null });
  const [confirming, setConfirming] = useState(null);

  const onSession = useCallback((next) => setSession(next), []);

  const applyMode = (next) => {
    session.leave?.();
    setMode(next);
    setSession({ joined: false, inGame: false, leave: null });
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* chế độ chỉ là tuỳ chọn giao diện */
    }
  };

  const pickMode = (next) => {
    if (next === mode) return;
    if (!session.joined) {
      applyMode(next);
      return;
    }
    setConfirming(next);
  };

  const active = CARD_MODES.find((m) => m.id === mode);
  const target = confirming ? CARD_MODES.find((m) => m.id === confirming) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#031410]">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-emerald-900/60 bg-black/40 px-2 py-1.5 sm:px-4">
        <div
          className="flex items-center gap-1 rounded-xl border border-emerald-900/70 bg-emerald-950/60 p-0.5"
          role="tablist"
          aria-label="Chọn chế độ đánh bài"
        >
          {CARD_MODES.map((m) => {
            const on = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => pickMode(m.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black tracking-wide transition sm:px-3.5 sm:text-xs ${
                  on
                    ? 'bg-amber-600 text-white shadow-[0_0_16px_rgba(217,119,6,0.45)]'
                    : 'text-emerald-300/80 hover:bg-emerald-900/60 hover:text-amber-200'
                }`}
              >
                <span aria-hidden="true">{m.icon}</span>
                {m.label}
                {on && session.joined && session.inGame && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <p className="min-w-0 flex-1 truncate text-[10px] text-emerald-300/60 sm:text-[11px]">{active?.desc}</p>
      </div>

      <div className="relative min-h-0 flex-1">
        <Suspense fallback={<Loading />}>
          {mode === 'TIEN_LEN' ? <TienLenGame onSession={onSession} /> : <PhomGame onSession={onSession} />}
        </Suspense>
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="anim-pop w-full max-w-sm rounded-2xl border border-amber-700/60 bg-stone-900 p-4 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-amber-300">Rời chiếu {active?.label}?</h2>
            <p className="mt-1 text-xs leading-relaxed text-stone-300">
              Bạn đang ngồi ở phòng <span className="font-bold text-emerald-300">{active?.label}</span>.
              {session.inGame ? ' Ván đang đi sẽ tan và ghế của bạn bị bỏ trống.' : ' Chiếu này sẽ đóng nếu không còn ai ngồi.'} Chuyển sang{' '}
              <span className="font-bold text-amber-200">{target.label}</span> để mở chiếu mới.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="flex-1 rounded-xl border border-stone-700 py-2 text-xs font-black text-stone-300 transition hover:bg-stone-800"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={() => {
                  applyMode(target.id);
                  setConfirming(null);
                }}
                className="flex-1 rounded-xl bg-amber-600 py-2 text-xs font-black text-white transition hover:bg-amber-500"
              >
                Chuyển sang {target.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
