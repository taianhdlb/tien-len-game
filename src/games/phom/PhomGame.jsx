import { useCallback, useState } from 'react';
import { useSocketRoom } from '../../lib/useSocketRoom.js';
import { useToast } from '../../components/toast-context.js';
import { getSavedName, saveName } from '../../lib/player.js';
import LogPanel from '../../components/LogPanel.jsx';
import Card, { CardBack } from '../../components/Card.jsx';
import PhomTable from './PhomTable.jsx';
import { initials, toneOf } from './phomView.js';
import PhomActionBar from './PhomActionBar.jsx';
import PhomRules from './PhomRules.jsx';

const RANK_MEDAL = ['🥇', '🥈', '🥉', '🏴'];
const FOUL_LABEL = {
  EAT: 'bị ăn bài',
  CHOT: 'ăn quân chốt',
  WIN: 'Ù',
  DEN_WIN: 'đền ù cho cả bàn',
  RANK: 'chênh hạng'
};

function SeatCard({ player, index, active, hostId, myId }) {
  return (
    <li
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
        active ? 'border-amber-400/70 bg-amber-950/30' : 'border-violet-900/50 bg-black/20'
      } ${player.left ? 'opacity-40' : ''}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${toneOf(index)}`}>
        {initials(player.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-xs font-bold text-stone-100">
          <span className="truncate">{player.name}</span>
          {player.id === myId && <span className="text-[9px] text-violet-400">(Bạn)</span>}
          {player.id === hostId && <span aria-hidden="true" className="text-[10px]">👑</span>}
        </p>
        <p className="text-[10px] text-violet-300/70">
          {player.cardCount} lá · hạ {player.melds?.length ?? 0} phỏm · {player.connected === false ? 'mất kết nối' : 'online'}
        </p>
      </div>
      {active && <span className="rounded bg-amber-500 px-1 text-[9px] font-black text-black">LƯỢT</span>}
    </li>
  );
}

function Results({ room, myId, isHost, onStart, onDismiss }) {
  const rows = room.results?.rows ?? [];
  const winner = rows.find((r) => r.rank === 1);
  const den = room.results?.denPlayerId ? rows.find((r) => r.playerId === room.results.denPlayerId) : null;
  const fouls = room.fouls ?? [];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm">
      <div className="anim-pop my-auto w-full max-w-md rounded-2xl border border-amber-600/60 bg-stone-950 p-4 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        <div className="text-center">
          <p className="text-[10px] font-black tracking-[0.2em] text-violet-400 uppercase">
            {room.results?.type === 'WIN' ? 'Ù tuyệt đối' : 'Hết 4 vòng · tính điểm rác'}
          </p>
          <h2 className="font-display mt-0.5 text-2xl font-bold text-amber-300">
            {winner ? `${winner.name} về nhất` : 'Chiếu đã kết thúc'}
          </h2>
          {den && (
            <p className="mt-1 text-[11px] font-bold text-rose-300">
              {den.name} đền bài cho cả bàn vì để đối thủ ăn 3 lá / quân chốt rồi ù.
            </p>
          )}
        </div>

        <table className="mt-3 w-full text-left text-[11px]">
          <thead>
            <tr className="text-[9px] tracking-wider text-violet-400 uppercase">
              <th className="py-1">Hạng</th>
              <th className="py-1">Người chơi</th>
              <th className="py-1 text-center">Điểm</th>
              <th className="py-1 text-center">Phỏm</th>
              <th className="py-1 text-right">Cược</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.playerId} className={`border-t border-violet-900/40 ${row.playerId === myId ? 'bg-violet-950/40' : ''}`}>
                <td className="py-1.5 font-black text-amber-300">
                  {RANK_MEDAL[row.rank - 1] ?? row.rank}
                </td>
                <td className="py-1.5 font-bold text-stone-100">
                  <span className="truncate">{row.name}</span>
                  {row.playerId === myId && <span className="ml-1 text-[9px] text-violet-400">(Bạn)</span>}
                  {row.isMom && <span className="ml-1 rounded bg-rose-950 px-1 text-[9px] font-black text-rose-300">MÓM</span>}
                </td>
                <td className="py-1.5 text-center font-mono font-bold text-stone-200">{row.score}</td>
                <td className="py-1.5 text-center font-mono text-stone-400">
                  {row.melds}
                  {row.sent > 0 && <span className="text-violet-300"> +{row.sent}</span>}
                </td>
                <td
                  className={`py-1.5 text-right font-mono font-black ${
                    row.net > 0 ? 'text-emerald-400' : row.net < 0 ? 'text-rose-400' : 'text-stone-500'
                  }`}
                >
                  {row.net > 0 ? `+${row.net}` : row.net}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fouls.length > 0 && (
          <details className="mt-2 rounded-lg border border-violet-900/50 bg-black/30 px-2 py-1.5">
            <summary className="cursor-pointer text-[10px] font-black tracking-wider text-violet-300 uppercase">
              Bảng phạt ({fouls.length})
            </summary>
            <ul className="mt-1 space-y-0.5 text-[10px] text-stone-400">
              {fouls.map((foul, i) => (
                <li key={i}>
                  <span className="text-rose-300">{room.players.find((p) => p.id === foul.payerId)?.name}</span> →{' '}
                  <span className="text-emerald-300">{room.players.find((p) => p.id === foul.playerId)?.name}</span> ·{' '}
                  {foul.amount} cược · {FOUL_LABEL[foul.reason] ?? foul.reason}
                </li>
              ))}
            </ul>
          </details>
        )}

        <p className="mt-2 text-center text-[9px] text-stone-600">Cược chỉ là điểm tham khảo, không quy đổi ra tiền thật.</p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-xl border border-violet-800 py-2 text-xs font-black text-violet-200 transition hover:bg-violet-950/50"
          >
            Xem chiếu
          </button>
          {isHost && (
            <button
              type="button"
              onClick={onStart}
              className="flex-1 rounded-xl bg-amber-600 py-2 text-xs font-black text-white transition hover:bg-amber-500"
            >
              🔄 Ván mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitingRoom({ room, myId, onStart, onCopy }) {
  const host = room.players.find((p) => !p.left);
  const isHost = host?.id === myId;
  const ready = room.players.filter((p) => !p.left);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-3">
      <div className="anim-rise w-full max-w-lg rounded-2xl border border-violet-800/70 bg-violet-950/40 p-4 shadow-2xl sm:p-5">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-violet-400 uppercase">Chiếu chờ</p>
          <h2 className="font-display text-2xl font-bold text-amber-300">Phỏm · Tá Lả</h2>
          <button
            type="button"
            onClick={onCopy}
            className="mt-2 rounded-lg border border-amber-500/50 bg-black/30 px-4 py-1.5 font-mono text-lg font-black tracking-widest text-amber-300 transition hover:bg-black/50"
          >
            {room.id} <span className="align-middle text-[10px]">📋</span>
          </button>
          <p className="mt-1 text-[11px] text-violet-300/70">Chia sẻ mã chiếu • 2–4 người • 4 vòng đánh</p>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2">
          {ready.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2 rounded-lg border border-violet-900/60 bg-black/25 px-2 py-1.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${toneOf(i)}`}>
                {initials(p.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-stone-100">
                  {p.name} {p.id === myId && <span className="text-violet-400">(Bạn)</span>}
                </p>
                <p className="text-[9px] text-violet-300/60">{p.id === host?.id ? 'Chủ chiếu · chia bài' : 'Sẵn sàng'}</p>
              </div>
            </li>
          ))}
          {Array.from({ length: Math.max(0, 4 - ready.length) }, (_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center gap-2 rounded-lg border border-dashed border-violet-900/50 px-2 py-1.5 text-[10px] text-violet-600"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-violet-900/60">+</span>
              Đang chờ…
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl border border-violet-900/60 bg-black/25 p-3 text-[11px] leading-relaxed text-violet-200/80">
          <p>• Người chia bài trước nhận <strong className="text-amber-300">10 lá</strong>, những người còn lại <strong className="text-amber-300">9 lá</strong>.</p>
          <p>• Mỗi lượt: <em>ăn</em> lá vừa đánh hoặc <em>bốc</em> 1 lá, rồi bắt buộc đánh ra 1 lá rác.</p>
          <p>• Đủ 4 vòng thì hạ hết phỏm, gửi bài và mở chiếu tính điểm.</p>
        </div>

        <div className="mt-4">
          {isHost ? (
            <button
              type="button"
              disabled={ready.length < 2}
              onClick={onStart}
              className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-black text-white shadow-[0_0_20px_rgba(217,119,6,0.35)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ready.length < 2 ? 'Cần ít nhất 2 người…' : `🀄 Chia bài · ${ready.length} người`}
            </button>
          ) : (
            <p className="animate-pulse text-center text-xs text-violet-300/80">
              Đang chờ <strong className="text-amber-300">{host?.name || 'chủ chiếu'}</strong> chia bài…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Lobby({ connected, onJoin }) {
  const [name, setName] = useState(getSavedName);
  const [roomId, setRoomId] = useState('PHOM_1');
  const [busy, setBusy] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { notify } = useToast();

  const submit = async (event) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) {
      notify('Hãy nhập tên của bạn.', 'error');
      return;
    }
    if (!roomId.trim()) {
      notify('Hãy nhập mã chiếu.', 'error');
      return;
    }
    setBusy(true);
    await onJoin({ name: clean, roomId: roomId.trim().toUpperCase() });
    setBusy(false);
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_center,_#1e1b4b_0%,#0d0a1f_55%,#05030c_100%)] p-3 sm:p-6">
      <form
        onSubmit={submit}
        className="anim-rise my-auto w-full max-w-md rounded-2xl border-2 border-violet-700/60 bg-violet-950/70 p-4 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur sm:p-6"
      >
        <div className="mb-4 text-center">
          <div className="mb-2 flex justify-center">
            <CardBack size="sm" className="-rotate-12" />
            <CardBack size="sm" className="-mt-1" />
            <CardBack size="sm" className="rotate-12" />
          </div>
          <h1 className="font-display text-2xl font-bold text-amber-300">Phỏm · Tá Lả Online</h1>
          <p className="mt-1 text-[11px] text-violet-300/80">Bốc – ăn – hạ – gửi · 4 vòng · 2–4 người · Realtime</p>
        </div>

        <div className="mb-4 flex justify-center gap-1.5">
          {['A-♠', '2-♠', '3-♠'].map((id, i) => (
            <span key={id} className={i === 1 ? '-translate-y-1' : ''}>
              <Card
                card={{ id, rankLabel: id.split('-')[0], suitSymbol: '♠', suitColor: 'black' }}
                size="sm"
              />
            </span>
          ))}
          <span className="ml-1 self-center text-[10px] font-bold text-violet-300">Sảnh A‑2‑3 ♠</span>
        </div>

        <label className="mb-3 block text-xs font-semibold text-violet-200">
          Tên hiển thị
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Nhập tên của bạn…"
            className="mt-1 w-full rounded-lg border border-violet-800 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500"
          />
        </label>

        <label className="mb-4 block text-xs font-semibold text-violet-200">
          Mã chiếu
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
            maxLength={20}
            placeholder="PHOM_1"
            className="mt-1 w-full rounded-lg border border-violet-800 bg-black/30 px-3 py-2 font-mono text-sm font-bold text-amber-300 outline-none transition focus:border-amber-500"
          />
        </label>

        <button
          type="submit"
          disabled={busy || !connected}
          className="w-full rounded-xl bg-amber-600 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(217,119,6,0.4)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!connected ? 'Đang kết nối máy chủ…' : busy ? 'Đang vào chiếu…' : '🀄 Ngồi chiếu'}
        </button>

        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="mt-2 w-full rounded-xl border border-violet-800 py-2 text-xs font-black text-violet-200 transition hover:bg-violet-950/60"
        >
          📜 Luật Phỏm &amp; bảng phạt
        </button>

        <p className="mt-3 text-center text-[10px] text-violet-400/60">
          Mã chiếu của Phỏm không dùng chung với Tiến Lên — hãy chọn đúng chế độ ở thanh phía trên.
        </p>
      </form>

      <PhomRules open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}

export default function PhomGame({ onSession }) {
  const { myId, room, joined, connected, join, leave, emit } = useSocketRoom('phom', 'phom:state', { onSession });
  const { notify } = useToast();
  const [selection, setSelection] = useState({ sig: null, ids: [] });
  const [logsOpen, setLogsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [dismissed, setDismissed] = useState(null);

  const signature = room ? `${room.turn}:${room.phase}:${room.round}:${room.meldSeq}:${room.status}` : null;
  const selected = selection.sig === signature ? selection.ids : [];
  const setSelected = useCallback(
    (ids) => setSelection({ sig: signature, ids }),
    [signature]
  );

  const legal = room?.myTurn ? room.legal : null;
  const waitingFor = room && room.status === 'PLAYING' ? room.players[room.turn]?.name : null;
  const host = room?.players.find((p) => !p.left);
  const isHost = host?.id === myId;
  const finishKey = room ? `${room.status}:${room.results?.winnerId ?? ''}:${room.turnCount}` : null;
  const showResults = Boolean(room?.status === 'FINISHED' && room.results && dismissed !== finishKey);

  const handleJoin = useCallback(
    async (payload) => {
      saveName(payload.name);
      setSelection({ sig: null, ids: [] });
      return join(payload);
    },
    [join]
  );

  const copyRoom = useCallback(async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.id);
      notify(`Đã sao chép mã chiếu ${room.id}.`, 'success');
    } catch {
      notify(`Mã chiếu: ${room.id}`, 'gold');
    }
  }, [room, notify]);

  const start = async () => {
    const res = await emit('phom:start', {});
    if (res?.ok) setSelected([]);
  };

  const act = async (action) => {
    if (action.op === 'AUTO_MELD') {
      for (const group of legal?.suggestion ?? []) {
        const res = await emit('phom:action', { op: 'MELD', cards: group });
        if (!res?.ok) break;
      }
      setSelected([]);
      return;
    }
    const res = await emit('phom:action', action);
    if (res?.ok) setSelected([]);
  };

  const toggleCard = (card) => {
    if (!room.myTurn) return;
    setSelected(selected.includes(card.id) ? selected.filter((id) => id !== card.id) : [...selected, card.id]);
  };

  if (!joined || !room) {
    return <Lobby connected={connected} onJoin={handleJoin} />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0a0718]">
      <div className="flex shrink-0 items-center gap-2 border-b border-violet-900/60 bg-violet-950/70 px-2 py-1.5 text-xs sm:px-3">
        <span className="font-display text-sm text-amber-300 sm:text-base">Phỏm</span>
        <button
          type="button"
          onClick={copyRoom}
          className="rounded-md border border-violet-800 bg-black/25 px-2 py-1 font-mono text-[11px] font-bold text-violet-100 transition hover:border-amber-500 hover:text-amber-300"
        >
          {room.id} <span className="text-[9px] opacity-70">📋</span>
        </button>
        <span className="rounded-full border border-violet-800/70 bg-black/25 px-2 py-0.5 text-[9px] font-black tracking-wider text-violet-300">
          VÒNG {room.round}/4
        </span>
        <span className="hidden rounded-full border border-violet-800/70 bg-black/25 px-2 py-0.5 text-[9px] font-black tracking-wider text-violet-300 sm:inline">
          NỌC {room.stockCount}
        </span>
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="ml-auto rounded-md border border-violet-800 bg-black/25 px-2 py-1 text-[11px] font-bold text-violet-200 transition hover:border-amber-500 hover:text-amber-300"
        >
          Luật
        </button>
        <button
          type="button"
          onClick={() => setLogsOpen(true)}
          className="rounded-md border border-violet-800 bg-black/25 px-2 py-1 text-[11px] font-bold text-violet-200 lg:hidden"
        >
          📜
        </button>
        <button
          type="button"
          onClick={leave}
          className="rounded-md border border-rose-900/60 bg-black/25 px-2 py-1 text-[11px] font-bold text-rose-300 transition hover:bg-rose-950/40"
        >
          Rời chiếu
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#241a4d_0%,#140f2c_45%,#070512_100%)]" />
          <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-violet-400/10 sm:inset-4" />

          {room.status === 'WAITING' ? (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <WaitingRoom room={room} myId={myId} onStart={start} onCopy={copyRoom} />
            </div>
          ) : (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <PhomTable
                room={room}
                myId={myId}
                selected={selected}
                onToggleCard={toggleCard}
                disabled={!room.myTurn}
              />
              <PhomActionBar
                room={room}
                myId={myId}
                legal={legal}
                selected={selected}
                waitingFor={waitingFor}
                onAct={act}
              />
            </div>
          )}

          {showResults && (
            <Results
              room={room}
              myId={myId}
              isHost={isHost}
              onStart={start}
              onDismiss={() => setDismissed(finishKey)}
            />
          )}
        </main>

        <aside className="hidden min-h-0 w-72 shrink-0 flex-col gap-2 border-l border-violet-900/60 bg-violet-950/30 p-2 lg:flex xl:w-80">
          <section className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-violet-900/60 bg-violet-950/40">
            <header className="flex items-center justify-between border-b border-violet-900/60 px-3 py-2">
              <h2 className="text-xs font-black tracking-[0.18em] text-violet-200 uppercase">Chiếu bài</h2>
              <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold text-violet-300">{room.players.length}/4</span>
            </header>
            <ul className="max-h-64 space-y-1.5 overflow-y-auto p-2">
              {room.players.map((p, i) => (
                <SeatCard
                  key={p.id}
                  player={p}
                  index={i}
                  hostId={host?.id}
                  myId={myId}
                  active={room.status === 'PLAYING' && room.turn === i}
                />
              ))}
            </ul>
          </section>
          <div className="flex min-h-0 flex-1 flex-col">
            <LogPanel logs={room.logs} />
          </div>
        </aside>
      </div>

      {logsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-2 lg:hidden" onClick={() => setLogsOpen(false)}>
          <div
            className="anim-rise flex max-h-[70dvh] w-full flex-col overflow-hidden rounded-2xl border border-violet-800 bg-violet-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-violet-900 px-3 py-2">
              <span className="text-xs font-black tracking-wider text-violet-200 uppercase">Nhật ký chiếu</span>
              <button
                type="button"
                onClick={() => setLogsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-900 text-xs text-violet-200"
                aria-label="Đóng nhật ký"
              >
                ✕
              </button>
            </div>
            <div className="flex min-h-0 flex-1 p-2">
              <LogPanel logs={room.logs} />
            </div>
          </div>
        </div>
      )}

      <PhomRules open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
