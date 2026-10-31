import { BOARD_TILES, INSTANT_WIN_RELIC_IDS, getClass, hexToCss } from './data.js';
import { PieceImage } from '../../three/Piece3D.jsx';

export default function PartyPanel({ room, myId }) {
  const host = room.players.find((p) => !p.left);
  const currentId = room.status === 'PLAYING' ? room.players[room.currentTurn]?.id : null;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950/80">
      <header className="flex shrink-0 items-center justify-between border-b border-stone-800 px-3 py-2">
        <h2 className="text-xs font-black tracking-[0.18em] text-stone-300 uppercase">Người chơi</h2>
        <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-stone-400">
          {room.players.filter((p) => !p.left).length}/4
        </span>
      </header>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {room.players.map((p) => {
          const cls = getClass(p.classId);
          const color = hexToCss(cls.hex);
          const tile = BOARD_TILES[p.position ?? 0];
          const relics = room.properties
            ? INSTANT_WIN_RELIC_IDS.filter((id) => room.properties[id]?.ownerId === p.id).length
            : 0;
          const active = p.id === currentId;
          const out = p.left || p.bankrupt;

          return (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition ${
                active
                  ? 'border-amber-500/70 bg-amber-950/30 shadow-[0_0_12px_rgba(245,158,11,0.18)]'
                  : 'border-stone-800 bg-stone-900/60'
              } ${out ? 'opacity-45' : ''}`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: `${color}aa`, background: `${color}22` }}
              >
                <PieceImage classId={p.classId} hexColor={cls.hex} size={30} alt={p.name} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-xs font-bold text-stone-100">
                  <span className="truncate">{p.name}</span>
                  {p.id === myId && <span className="shrink-0 text-[10px] font-black text-emerald-400">(Bạn)</span>}
                  {p.id === host?.id && <span title="Chủ phòng" aria-hidden="true" className="shrink-0 text-[11px]">👑</span>}
                  {p.inJail && <span title="Đang bị tạm giam" aria-hidden="true" className="shrink-0 text-[11px]">⛓️</span>}
                  {p.connected === false && !p.left && (
                    <span className="shrink-0 rounded bg-rose-950 px-1 text-[8px] font-black text-rose-300">MẤT KẾT NỐI</span>
                  )}
                  {p.left && (
                    <span className="shrink-0 rounded bg-stone-800 px-1 text-[8px] font-black text-stone-400">ĐÃ RỜI</span>
                  )}
                </p>
                <p className="flex items-center justify-between gap-2 text-[10px] text-stone-500">
                  <span className="truncate">
                    {cls.icon} {cls.name} · {tile?.name || 'Xuất Phát'}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 font-bold">
                    <span className="text-amber-300">{p.gold ?? 0}g</span>
                    {relics > 0 && <span className="text-amber-500">🏆{relics}</span>}
                  </span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
