import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './toast-context.js';

const TONES = {
  info: 'border-sky-500/60 bg-sky-950/95 text-sky-100',
  success: 'border-emerald-500/60 bg-emerald-950/95 text-emerald-100',
  error: 'border-rose-500/60 bg-rose-950/95 text-rose-100',
  gold: 'border-amber-500/60 bg-amber-950/95 text-amber-100'
};

const ICONS = { info: 'ℹ️', success: '✅', error: '⚠️', gold: '🪙' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const seq = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message, tone = 'info') => {
      if (!message) return;
      seq.current += 1;
      const id = seq.current;
      setToasts((list) => [...list.slice(-3), { id, message, tone: TONES[tone] ? tone : 'info' }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4200)
      );
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify, dismiss, toast: notify }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium shadow-2xl backdrop-blur ${TONES[t.tone]}`}
          >
            <span aria-hidden="true" className="mt-0.5 shrink-0">
              {ICONS[t.tone]}
            </span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 text-xs opacity-60 transition hover:opacity-100"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
