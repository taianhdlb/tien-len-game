import { lazy, Suspense, useState } from 'react';

const MonopolyGame = lazy(() => import('./games/monopoly/MonopolyGame.jsx'));
const HorseGame = lazy(() => import('./games/horse/HorseGame.jsx'));
const CardGames = lazy(() => import('./games/cards/CardGames.jsx'));

const TABS = [
  { id: 'MONOPOLY', label: 'Cờ Tỷ Phú Việt Nam', short: 'Tỷ Phú', icon: '🎡' },
  { id: 'HORSE', label: 'Cờ Cá Ngựa', short: 'Cá Ngựa', icon: '🐴' },
  { id: 'CARDS', label: 'Đánh Bài Online', short: 'Đánh Bài', icon: '🃏' }
];

function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-amber-400">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
      <p className="text-xs font-semibold tracking-widest uppercase">Đang mở cổng vương quốc…</p>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState('MONOPOLY');

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#08070a] text-stone-100">
      <header className="z-40 flex shrink-0 items-center gap-2 border-b border-amber-900/50 bg-stone-950/95 px-2 py-1.5 shadow-lg sm:gap-4 sm:px-4 sm:py-2">
        <div className="hidden min-w-0 sm:block">
          <h1 className="font-display truncate text-lg font-bold text-amber-400 sm:text-xl">Bàn Cờ Việt</h1>
          <p className="text-[10px] font-medium tracking-wider text-stone-500 uppercase">Board game realtime 2–4 người</p>
        </div>

        <nav className="flex flex-1 items-center gap-1.5 sm:flex-none" aria-label="Chọn trò chơi">
          {TABS.map((tab) => {
            const active = game === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGame(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition sm:flex-none sm:px-4 sm:text-sm ${
                  active
                    ? 'bg-amber-700 text-white shadow-[0_0_18px_rgba(180,83,9,0.45)]'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-amber-300'
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-300 uppercase md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Online
        </span>
      </header>

      <main className="relative min-h-0 flex-1">
        <Suspense fallback={<Loading />}>
          {game === 'MONOPOLY' ? <MonopolyGame /> : game === 'HORSE' ? <HorseGame /> : <CardGames />}
        </Suspense>
      </main>
    </div>
  );
}
