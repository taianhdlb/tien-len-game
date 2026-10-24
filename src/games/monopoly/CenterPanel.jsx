import { useEffect, useRef, useState } from 'react';
import { getClass } from './data.js';
import { countRelics } from './engine.js';
import { INSTANT_WIN_RELIC_IDS } from './data.js';
import { Dice3D } from '../../three/Dice3D.jsx';
import { PieceImage } from '../../three/Piece3D.jsx';

const T = {
  title: { fontSize: 'clamp(10px, 2cqw, 20px)' },
  body: { fontSize: 'clamp(7px, 1.35cqw, 13px)' },
  tiny: { fontSize: 'clamp(6px, 1.05cqw, 11px)' },
  button: { fontSize: 'clamp(8px, 1.5cqw, 14px)' }
};

export default function CenterPanel({ room, myId, isMyTurn, boardSize, onDispatch }) {
  const [locked, setLocked] = useState(false);
  const lockTimer = useRef(0);
  const host = room.players.find((p) => !p.left);
  const isHost = host?.id === myId;
  const current = room.status === 'PLAYING' ? room.players[room.currentTurn] : null;
  const currentClass = current ? getClass(current.classId) : null;
  const diceSize = Math.round(Math.max(30, Math.min(84, boardSize * 0.115)));

  useEffect(() => () => clearTimeout(lockTimer.current), []);

  const roll = () => {
    onDispatch({ type: 'ROLL' });
    setLocked(true);
    clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => setLocked(false), 1500);
  };

  if (room.status === 'WAITING') {
    const ready = room.players.filter((p) => !p.left);
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-[2%] text-center">
        <h2 className="font-display font-bold text-amber-400" style={{ fontSize: 'clamp(12px, 2.6cqw, 26px)' }}>
          Đang Tập Hợp Tổ Đội
        </h2>
        <p className="text-stone-400" style={T.tiny}>
          Chia sẻ mã phòng để bạn bè cùng tham gia
        </p>
        <div
          className="rounded-md border border-stone-700 bg-stone-900 px-2 py-0.5 font-mono font-black tracking-widest text-white"
          style={T.title}
        >
          {room.id}
        </div>
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1">
          {ready.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 rounded-full border border-stone-700 bg-stone-900/90 px-1.5 py-0.5 text-stone-200"
              style={T.tiny}
            >
              <span aria-hidden="true">{getClass(p.classId).icon}</span>
              {p.name}
              {p.id === myId && <span className="text-amber-400">(Bạn)</span>}
              {p.id === host?.id && <span className="text-amber-500">👑</span>}
            </span>
          ))}
        </div>

        {isHost ? (
          ready.length >= 2 ? (
            <button
              type="button"
              onClick={() => onDispatch({ type: 'START' })}
              className="rounded-lg bg-emerald-700 px-4 py-1.5 font-black text-white shadow-[0_0_18px_rgba(4,120,87,0.65)] transition hover:scale-105 hover:bg-emerald-600"
              style={T.button}
            >
              ⚔️ Bắt Đầu Cuộc Chinh Phạt
            </button>
          ) : (
            <p className="animate-pulse text-stone-500 italic" style={T.tiny}>
              Cần ít nhất 2 chiến binh ({ready.length}/4)…
            </p>
          )
        ) : (
          <p className="animate-pulse text-stone-400" style={T.tiny}>
            Đang chờ <strong className="text-amber-300">{host?.name || 'chủ phòng'}</strong> bắt đầu…
          </p>
        )}
      </div>
    );
  }

  if (room.status === 'FINISHED') {
    const winner = room.players.find((p) => p.id === room.winnerId);
    const mine = winner?.id === myId;
    return (
      <div className="anim-pop flex h-full w-full flex-col items-center justify-center gap-[2%] text-center">
        <span className="animate-bounce text-[clamp(20px,5cqw,52px)] leading-none" aria-hidden="true">
          👑
        </span>
        <h2 className="font-display font-black text-amber-400" style={{ fontSize: 'clamp(13px, 2.8cqw, 30px)' }}>
          {winner ? `${winner.name} Chiến Thắng!` : 'Ván Đấu Kết Thúc'}
        </h2>
        <p className="max-w-[85%] text-stone-300" style={T.tiny}>
          {room.winReason === 'RELICS'
            ? 'Thu thập đủ 3 Thánh Vật quyền năng và thống trị vương quốc!'
            : winner
              ? 'Là chiến binh cuối cùng trụ vững trên bàn cờ.'
              : 'Không còn chiến binh nào trên bàn cờ.'}
        </p>
        {winner && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-stone-900/90 px-2 py-0.5" style={T.tiny}>
            <PieceImage classId={winner.classId} hexColor={getClass(winner.classId).hex} size={Math.round(diceSize * 0.5)} />
            <span className="text-amber-300">{mine ? 'Bạn đã chinh phục vương quốc!' : `${winner.name} đăng quang.`}</span>
          </div>
        )}
        {isHost ? (
          <button
            type="button"
            onClick={() => onDispatch({ type: 'START' })}
            className="rounded-lg bg-amber-700 px-4 py-1.5 font-black text-white shadow transition hover:scale-105 hover:bg-amber-600"
            style={T.button}
          >
            🔄 Mở Ván Mới
          </button>
        ) : (
          <p className="text-stone-500" style={T.tiny}>
            Chờ chủ phòng mở ván mới…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[1.5%]">
      <div className="flex items-center gap-1.5 rounded-full border border-amber-900/50 bg-stone-900/80 px-2 py-0.5" style={T.tiny}>
        <span aria-hidden="true">{currentClass?.icon}</span>
        <span className="text-stone-400">Lượt của</span>
        <span className="max-w-[13cqw] truncate font-extrabold text-amber-300">{current?.name}</span>
        {current?.id === myId && <span className="text-emerald-400">(Bạn)</span>}
      </div>

      <div className="flex items-center justify-center gap-[clamp(6px,2.2cqw,28px)]">
        <Dice3D type="D6" value={room.dice?.[0] ?? 1} rollKey={room.rollSeq || 0} size={diceSize} theme="ivory" />
        <Dice3D type="D6" value={room.dice?.[1] ?? 1} rollKey={room.rollSeq || 0} size={diceSize} theme="ivory" />
      </div>

      <div
        className="rounded-full border border-stone-700/70 bg-stone-900/90 px-2 py-0.5 font-black text-amber-300 shadow"
        style={T.tiny}
      >
        {room.pending
          ? 'Sự kiện đang chờ xử lý…'
          : `Điểm: ${room.dice?.[0] ?? 0} + ${room.dice?.[1] ?? 0} = ${(room.dice?.[0] ?? 0) + (room.dice?.[1] ?? 0)}`}
      </div>

      {isMyTurn ? (
        <button
          type="button"
          onClick={roll}
          disabled={locked || !!room.pending}
          className="rounded-lg bg-amber-700 px-3 py-1.5 font-black text-white shadow-[0_0_18px_rgba(217,119,6,0.5)] transition hover:scale-105 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
          style={T.button}
        >
          🎲 Tung Xúc Xắc (2×D6)
        </button>
      ) : (
        <p className="animate-pulse text-stone-400" style={T.tiny}>
          {current && current.connected === false
            ? 'Chiến binh mất kết nối — đang chờ bỏ qua lượt…'
            : `Chờ ${current?.name || 'đối thủ'} thao tác…`}
        </p>
      )}

      <div className="flex items-center gap-1 text-amber-500/80" style={T.tiny} aria-hidden="true">
        {INSTANT_WIN_RELIC_IDS.map((id, i) => (
          <span key={id} className={i < (room.properties ? countRelics(room, current?.id) : 0) ? 'opacity-100' : 'opacity-30'}>
            🏆
          </span>
        ))}
      </div>
    </div>
  );
}
