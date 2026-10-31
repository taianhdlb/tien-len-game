import { COLORS, HOME_SLOTS, trackIndex } from './board.js';
import { HOME_FACES, ROLL_AGAIN_FACE, homeCount, homeFaceFor } from './engine.js';
import { Dice3D } from '../../three/Dice3D.jsx';
import { PieceImage } from '../../three/Piece3D.jsx';

const moveLabel = (move, colorId) => {
  if (move.kind === 'DEPLOY') return 'Xuất chuồng';
  if (move.kind === 'HOME') return `Vào chuồng bậc ${move.target.pos}`;
  return `Tới ô ${trackIndex(colorId, move.target.pos) + 1}`;
};

export function TurnPanel({ room, myId, isMyTurn, onRoll, onMove, onSkip }) {
  const current = room.status === 'PLAYING' ? room.players[room.currentTurn] : null;
  const color = current ? COLORS[current.color] : null;
  const host = room.players.find((player) => !player.left);
  const canSkip = current && current.id !== myId && (current.left || current.connected === false) && host?.id === myId;
  const die = room.die ?? null;
  const pendingMoves = isMyTurn && room.pending ? room.pending.moves : [];
  const faceNeeded = current ? homeFaceFor(current) : null;

  if (room.status === 'FINISHED') {
    const winner = room.players.find((player) => player.id === room.winnerId);
    const winColor = winner ? COLORS[winner.color] : null;
    return (
      <section className="rounded-xl border border-amber-600/50 bg-gradient-to-br from-amber-950/60 to-stone-950 p-3 shadow-[0_0_30px_rgba(245,158,11,0.12)]">
        <p className="text-[10px] font-black tracking-[0.2em] text-amber-400/80 uppercase">Kết thúc</p>
        <p className="mt-1 font-display text-lg font-bold text-amber-200">
          {winner ? `${winner.name} chiến thắng!` : 'Ván đấu đã kết thúc'}
        </p>
        {winColor && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: winColor.css }} />
            {winColor.label} · {room.winReason === 'LAST_STANDING' ? 'trụ lại cuối cùng' : 'đủ 4 ngựa vào chuồng'}
          </p>
        )}
        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-400">
          {room.winReason === 'LAST_STANDING'
            ? 'Tất cả đối thủ đã rời đường đua.'
            : 'Bốn ngựa vào chuồng đúng thứ tự 6 – 5 – 4 – 3.'}
        </p>
      </section>
    );
  }

  if (!current) return null;

  return (
    <section
      className="rounded-xl border bg-stone-950/80 p-3 transition"
      style={{
        borderColor: isMyTurn ? '#f59e0b99' : `${color.css}55`,
        boxShadow: isMyTurn ? '0 0 26px rgba(245,158,11,0.18)' : undefined
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black tracking-[0.2em] text-stone-500 uppercase">Lượt hiện tại</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-black">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10" style={{ background: color.css }} />
            <span className={isMyTurn ? 'text-amber-200' : 'text-stone-100'}>{isMyTurn ? 'Bạn' : current.name}</span>
            <span className="text-[10px] font-bold" style={{ color: color.light }}>{color.label}</span>
            {current.connected === false && (
              <span className="rounded bg-rose-950 px-1 py-0.5 text-[8px] font-black text-rose-300 uppercase">Mất kết nối</span>
            )}
          </p>
        </div>
        {room.bonusRolls > 0 && (
          <span className="shrink-0 animate-pulse rounded-full border border-amber-500/60 bg-amber-950/70 px-2 py-0.5 text-[9px] font-black text-amber-300">
            tung tiếp ×{room.bonusRolls}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <div className={`relative transition ${die ? '' : 'opacity-30 grayscale'}`}>
          <Dice3D type="D6" value={die ?? 1} rollKey={room.rollSeq} size={78} theme="ivory" />
        </div>
        <div className="min-w-0">
          <span className="block text-[9px] font-black tracking-[0.18em] text-stone-500 uppercase">
            {die ? 'Vừa tung' : 'Chưa tung'}
          </span>
          <span className="font-display block text-3xl leading-none font-bold text-amber-300">{die ?? '–'}</span>
          {die === ROLL_AGAIN_FACE && (
            <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-black text-amber-300 uppercase">
              Được tung tiếp
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 rounded-lg border border-stone-800 bg-stone-900/60 px-2 py-1.5 text-center text-[10px] leading-relaxed text-stone-400">
        1 viên D6 · ra 1 hoặc 6 mới xuất chuồng và được tung thêm
        {faceNeeded ? ` · vào chuồng cần đúng ${faceNeeded}` : ''}
      </p>

      <button
        type="button"
        onClick={onRoll}
        disabled={!isMyTurn || pendingMoves.length > 0}
        className={`mt-3 w-full rounded-xl py-2.5 text-sm font-black transition ${
          isMyTurn && pendingMoves.length === 0
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.01] hover:from-amber-500 hover:to-amber-400'
            : 'cursor-not-allowed bg-stone-800 text-stone-500'
        }`}
      >
        {pendingMoves.length > 0
          ? 'Chọn một nước đi bên dưới'
          : isMyTurn
            ? '🎲 Tung xúc xắc'
            : `Chờ ${current.name}…`}
      </button>

      {canSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-2 w-full rounded-lg border border-rose-800/60 bg-rose-950/40 py-1.5 text-[11px] font-bold text-rose-300 transition hover:bg-rose-950/70"
        >
          Bỏ qua lượt của {current.name}
        </button>
      )}

      {pendingMoves.length > 0 && (
        <div className="mt-3 border-t border-stone-800 pt-2">
          <p className="mb-1.5 text-[10px] font-black tracking-[0.16em] text-emerald-400/90 uppercase">
            Chọn nước đi · {pendingMoves.length}
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-0.5">
            {pendingMoves.map((move, index) => {
              const horseNumber = current.horses.findIndex((horse) => horse.id === move.horseId) + 1;
              return (
                <button
                  key={`${move.horseId}-${move.target.status}-${move.target.pos}`}
                  type="button"
                  onClick={() => onMove(index)}
                  className="flex w-full items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/70 px-2 py-1.5 text-left transition hover:border-amber-600/70 hover:bg-stone-800"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black text-white"
                    style={{ background: color.dark, borderColor: color.light }}
                  >
                    {horseNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 truncate text-[11px] font-bold text-stone-100">
                      Ngựa {horseNumber} · {moveLabel(move, current.color)}
                      {move.captures.length > 0 && (
                        <span className="rounded bg-rose-950 px-1 text-[8px] font-black text-rose-300">
                          ⚔ {move.captures.length}
                        </span>
                      )}
                    </span>
                    <span className="block text-[9px] text-stone-500">
                      {move.kind === 'DEPLOY' ? 'Ra ô xuất phát · được tung tiếp' : `Đi đúng ${die} ô`}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-amber-500/80">›</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export function HorsePlayers({ room, myId }) {
  const currentId = room.status === 'PLAYING' ? room.players[room.currentTurn]?.id : null;
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950/80">
      <header className="flex shrink-0 items-center justify-between border-b border-stone-800 px-3 py-1.5">
        <h2 className="text-[10px] font-black tracking-[0.18em] text-stone-300 uppercase">Kỵ sĩ</h2>
        <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[9px] font-bold text-stone-400">
          {room.players.filter((player) => !player.left).length}/4
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {room.players.map((player) => {
          const color = COLORS[player.color] ?? COLORS.RED;
          const isCurrent = player.id === currentId;
          const isMe = player.id === myId;
          const horses = player.horses ?? [];
          const yard = horses.filter((horse) => horse.status === 'YARD').length;
          const track = horses.filter((horse) => horse.status === 'TRACK').length;
          const home = homeCount(player);
          const nextFace = homeFaceFor(player);
          return (
            <article
              key={player.id}
              className={`rounded-lg border p-2 transition ${
                isCurrent ? 'bg-stone-900 shadow-[inset_0_0_18px_rgba(245,158,11,0.08)]' : 'bg-stone-900/40'
              } ${player.left ? 'opacity-40' : ''}`}
              style={{ borderColor: isCurrent ? '#f59e0b99' : `${color.css}33` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                  style={{ borderColor: color.css, background: `${color.css}22` }}
                >
                  <PieceImage classId="horse" hexColor={color.hex} size={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-[11px] font-black text-stone-100">
                    {player.name}
                    {isMe && <span className="rounded bg-amber-900/70 px-1 text-[8px] text-amber-200">BẠN</span>}
                    {player.left && <span className="rounded bg-stone-800 px-1 text-[8px] text-stone-400">ĐÃ RỜI</span>}
                    {isCurrent && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />}
                  </p>
                  <p className="text-[9px] font-semibold" style={{ color: color.light }}>
                    {color.label} · Chuồng {yard} · Đua {track} · Về {home}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                    home >= HOME_SLOTS ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}
                  title="Số ngựa đã vào chuồng"
                >
                  ⭐ {home}/4
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                {HOME_FACES.map((face, step) => {
                  const filled = step < home;
                  return (
                    <span
                      key={face}
                      title={filled ? `Đã vào chuồng (cần ${face})` : `Cần tung đúng ${face}`}
                      className={`flex h-4 flex-1 items-center justify-center rounded-sm text-[8px] font-black ring-1 ring-amber-600/40 ${
                        filled ? 'text-stone-950' : 'bg-stone-800/80 text-stone-500'
                      }`}
                      style={filled ? { background: color.css } : undefined}
                    >
                      {face}
                    </span>
                  );
                })}
                {nextFace && isCurrent && (
                  <span className="shrink-0 rounded bg-stone-800 px-1 text-[8px] font-black text-amber-300">
                    cần {nextFace}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
