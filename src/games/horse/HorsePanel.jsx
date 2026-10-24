import { COLORS, trackIndex } from './board.js';
import { MAX_BONUS_ROLLS, diceSum, isDeployRoll, isDoubles } from './engine.js';
import { Dice3D } from '../../three/Dice3D.jsx';
import { PieceImage } from '../../three/Piece3D.jsx';

const dieLabel = (move) => {
  if (move.die === 'DEPLOY') return 'Xuất quân';
  if (move.die === 'D1') return `Xúc xắc 1 · ${move.value}`;
  if (move.die === 'D2') return `Xúc xắc 2 · ${move.value}`;
  return `Tổng · ${move.value}`;
};

function moveTitle(move, colorId) {
  if (move.kind === 'DEPLOY') return 'Xuất quân';
  if (move.target.status === 'HOME') return `Lên bậc ${move.target.pos}`;
  return `Tới ô ${trackIndex(colorId, move.target.pos) + 1}`;
}

export function TurnPanel({
  room,
  myId,
  isMyTurn,
  selectedHorse,
  onSelectHorse,
  onRoll,
  onMove,
  onSkip
}) {
  const current = room.status === 'PLAYING' ? room.players[room.currentTurn] : null;
  const color = current ? COLORS[current.color] : null;
  const host = room.players.find((player) => !player.left);
  const isHost = host?.id === myId;
  const canSkip = current && current.id !== myId && (current.left || current.connected === false) && isHost;
  const hasDice = Array.isArray(room.dice);
  const dice = hasDice ? room.dice : [1, 1];
  const pendingMoves = isMyTurn && room.pending ? room.pending.moves.map((move, index) => ({ ...move, index })) : [];
  const filteredMoves = selectedHorse ? pendingMoves.filter((move) => move.horseId === selectedHorse) : pendingMoves;
  const horseIndex = (horseId) => Math.max(0, current?.horses.findIndex((horse) => horse.id === horseId) ?? 0);
  const special = hasDice && isDeployRoll(dice);

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
            {winColor.label} · {room.winReason === 'LAST_STANDING' ? 'trụ lại cuối cùng' : '4 ngựa đã về đích'}
          </p>
        )}
        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-400">
          {room.winReason === 'LAST_STANDING'
            ? 'Tất cả đối thủ đã rời đường đua.'
            : 'Bốn ngựa đã yên vị trên bậc 3 – 4 – 5 – 6.'}
        </p>
      </section>
    );
  }

  if (!current) return null;

  return (
    <section
      className={`rounded-xl border bg-stone-950/80 p-3 transition ${isMyTurn ? 'shadow-[0_0_26px_rgba(245,158,11,0.18)]' : ''}`}
      style={{ borderColor: isMyTurn ? '#f59e0b99' : `${color.css}55` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black tracking-[0.2em] text-stone-500 uppercase">Lượt hiện tại</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-black">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10" style={{ background: color.css }} />
            <span className={isMyTurn ? 'text-amber-200' : 'text-stone-100'}>
              {isMyTurn ? 'Bạn' : current.name}
            </span>
            <span className="text-[10px] font-bold" style={{ color: color.light }}>{color.label}</span>
            {current.connected === false && (
              <span className="rounded bg-rose-950 px-1 py-0.5 text-[8px] font-black text-rose-300 uppercase">Mất kết nối</span>
            )}
          </p>
        </div>
        {room.bonusRolls > 0 && (
          <span className="shrink-0 animate-pulse rounded-full border border-amber-500/60 bg-amber-950/70 px-2 py-0.5 text-[9px] font-black text-amber-300">
            +{room.bonusRolls}/{MAX_BONUS_ROLLS} lượt
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <div className={`relative transition ${hasDice ? '' : 'opacity-30 grayscale'}`}>
          <Dice3D type="D6" value={dice[0]} rollKey={room.rollSeq} size={74} theme="ivory" />
        </div>
        <div className={`relative transition ${hasDice ? '' : 'opacity-30 grayscale'}`}>
          <Dice3D type="D6" value={dice[1]} rollKey={room.rollSeq} size={74} theme="ivory" />
        </div>
        <div className="flex min-w-14 flex-col items-center justify-center">
          <span className="text-[9px] font-black tracking-[0.18em] text-stone-500 uppercase">{hasDice ? 'Tổng' : 'Chưa tung'}</span>
          <span className="font-display text-3xl leading-none font-bold text-amber-300">{hasDice ? diceSum(dice) : '–'}</span>
          {hasDice && (
            <span className={`mt-1 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase ${
              special ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-800 text-stone-400'
            }`}>
              {isDoubles(dice) ? 'Đôi' : special ? '1 · 6' : 'Thường'}
            </span>
          )}
        </div>
      </div>

      {hasDice && (
        <p className="mt-1 text-center text-[9px] text-stone-600">
          {room.pending ? 'Kết quả lượt này' : 'Lần tung gần nhất'}
          {special ? ' · đặc biệt: có thể xuất quân' : ''}
        </p>
      )}

      <button
        type="button"
        onClick={onRoll}
        disabled={!isMyTurn || Boolean(room.pending)}
        className={`mt-3 w-full rounded-xl py-2.5 text-sm font-black transition ${
          isMyTurn && !room.pending
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.01] hover:from-amber-500 hover:to-amber-400'
            : 'cursor-not-allowed bg-stone-800 text-stone-500'
        }`}
      >
        {room.pending
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
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black tracking-[0.16em] text-emerald-400/90 uppercase">
              Chọn nước đi · {filteredMoves.length}
            </p>
            {selectedHorse && (
              <button
                type="button"
                onClick={() => onSelectHorse(null)}
                className="rounded bg-stone-800 px-1.5 py-0.5 text-[9px] font-bold text-stone-300 transition hover:bg-stone-700"
              >
                Hiện tất cả
              </button>
            )}
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-0.5">
            {filteredMoves.map((move) => {
              const index = horseIndex(move.horseId);
              const capturing = move.captures.length > 0;
              return (
                <button
                  key={`${move.horseId}-${move.die}-${move.target.status}-${move.target.pos}`}
                  type="button"
                  onClick={() => onMove(move.index)}
                  className="flex w-full items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/70 px-2 py-1.5 text-left transition hover:border-amber-600/70 hover:bg-stone-800"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black text-white"
                    style={{ background: color.dark, borderColor: color.light }}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 truncate text-[11px] font-bold text-stone-100">
                      Ngựa {index + 1} · {moveTitle(move, current.color)}
                      {capturing && (
                        <span className="rounded bg-rose-950 px-1 text-[8px] font-black text-rose-300">
                          ⚔ {move.captures.length}
                        </span>
                      )}
                    </span>
                    <span className="block text-[9px] text-stone-500">{dieLabel(move)}</span>
                  </span>
                  <span aria-hidden="true" className="text-amber-500/80">›</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isMyTurn && !room.pending && room.bonusRolls > 0 && (
        <p className="mt-2 rounded-lg border border-amber-800/50 bg-amber-950/30 px-2 py-1.5 text-center text-[10px] font-semibold text-amber-300">
          Bạn được tung thêm! Hãy tận dụng lượt thưởng.
        </p>
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
          const yard = player.horses?.filter((horse) => horse.status === 'YARD').length ?? 0;
          const track = player.horses?.filter((horse) => horse.status === 'TRACK').length ?? 0;
          const home = player.horses?.filter((horse) => horse.status === 'HOME').length ?? 0;
          const topHome = player.horses?.filter((horse) => horse.status === 'HOME' && horse.pos >= 3).length ?? 0;
          const stepMap = new Map(
            (player.horses ?? [])
              .filter((horse) => horse.status === 'HOME')
              .map((horse) => [horse.pos, horse])
          );
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
                    {color.label} · Chuồng {yard} · Đua {track} · Đích {home}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                    topHome >= 4 ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}
                  title="Số ngựa đã vào bậc 3–6"
                >
                  ⭐ {topHome}/4
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6].map((step) => {
                  const filled = stepMap.has(step);
                  return (
                    <span
                      key={step}
                      title={filled ? `Bậc ${step} có ngựa` : `Bậc ${step} trống`}
                      className={`flex h-4 flex-1 items-center justify-center rounded-sm text-[7px] font-black ${
                        step >= 3 ? 'ring-1 ring-amber-600/40' : ''
                      } ${filled ? 'text-stone-950' : 'bg-stone-800/80 text-stone-600'}`}
                      style={filled ? { background: color.css } : undefined}
                    >
                      {step}
                    </span>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
