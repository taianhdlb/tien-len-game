import { useCallback, useMemo, useState } from 'react';
import { useSocketRoom } from '../../lib/useSocketRoom.js';
import { useToast } from '../../components/toast-context.js';
import { getSavedName, saveName } from '../../lib/player.js';
import Card, { CardBack } from '../../components/Card.jsx';
import LogPanel from '../../components/LogPanel.jsx';

const COMBO_LABELS = {
  SINGLE: 'Rác',
  PAIR: 'Đôi',
  TRIPLE: 'Sám cô',
  FOUR_OF_A_KIND: 'Tứ quý',
  STRAIGHT: 'Sảnh',
  THREE_PAIRS_SERIES: '3 đôi thông',
  FOUR_PAIRS_SERIES: '4 đôi thông'
};

const MODES = {
  TLMN: {
    label: 'Miền Nam',
    short: 'TLMN',
    desc: 'Chặt 2 bằng tứ quý hoặc 3–4 đôi thông. Sảnh tự do.'
  },
  TLMB: {
    label: 'Miền Bắc',
    short: 'TLMB',
    desc: 'Đánh 1 lá phải cùng chất và lớn hơn. Chặt 2 bằng tứ quý.'
  }
};

const AVATAR_TONES = [
  'bg-amber-700/40 text-amber-200 border-amber-500/50',
  'bg-sky-700/40 text-sky-200 border-sky-500/50',
  'bg-emerald-700/40 text-emerald-200 border-emerald-500/50',
  'bg-fuchsia-700/40 text-fuchsia-200 border-fuchsia-500/50'
];

const initials = (name = '?') => name.trim().slice(0, 2).toUpperCase();

function Seat({ player, index, active, passed, winner }) {
  return (
    <div
      className={`flex min-w-28 shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-1.5 transition ${
        active ? 'border-amber-400/80 bg-amber-950/40 shadow-[0_0_16px_rgba(245,158,11,0.25)]' : 'border-emerald-800/60 bg-black/25'
      } ${player.connected === false ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${AVATAR_TONES[index % 4]}`}>
          {initials(player.name)}
        </span>
        <div className="min-w-0">
          <p className="max-w-24 truncate text-[11px] font-bold text-stone-100">
            {player.name}
            {winner && <span aria-hidden="true"> 🏆</span>}
          </p>
          <p className="text-[9px] font-semibold text-emerald-300/80">{player.cardCount} lá</p>
        </div>
      </div>
      <div className="flex -space-x-2">
        {Array.from({ length: Math.min(3, player.cardCount) }, (_, i) => (
          <CardBack key={i} size="sm" className="scale-90" />
        ))}
      </div>
      <div className="flex items-center gap-1">
        {active && <span className="rounded bg-amber-500 px-1 text-[8px] font-black text-black uppercase">Lượt</span>}
        {passed && <span className="rounded bg-rose-900/80 px-1 text-[8px] font-black text-rose-200 uppercase">Bỏ lượt</span>}
        {player.connected === false && (
          <span className="rounded bg-stone-800 px-1 text-[8px] font-black text-stone-300 uppercase">Offline</span>
        )}
      </div>
    </div>
  );
}

function PlayersPanel({ room, myId }) {
  const host = room.players.find((p) => !p.left);
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-emerald-900/60 bg-emerald-950/40">
      <header className="flex shrink-0 items-center justify-between border-b border-emerald-900/60 px-3 py-2">
        <h2 className="text-xs font-black tracking-[0.18em] text-emerald-200 uppercase">Người chơi</h2>
        <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{room.players.length}/4</span>
      </header>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {room.players.map((p, i) => {
          const active = room.status === 'PLAYING' && room.currentTurn === i;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                active ? 'border-amber-400/70 bg-amber-950/30' : 'border-emerald-900/50 bg-black/20'
              } ${p.left ? 'opacity-40' : ''}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${AVATAR_TONES[i % 4]}`}>
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-xs font-bold text-stone-100">
                  <span className="truncate">{p.name}</span>
                  {p.id === myId && <span className="text-[9px] text-emerald-400">(Bạn)</span>}
                  {p.id === host?.id && <span aria-hidden="true" className="text-[10px]">👑</span>}
                </p>
                <p className="text-[10px] text-emerald-300/70">
                  {p.cardCount} lá · {p.connected === false ? 'Mất kết nối' : 'Online'}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5 text-[9px] font-bold">
                {room.passed?.[p.id] && <span className="rounded bg-rose-900/70 px-1 text-rose-200">BỎ</span>}
                {active && <span className="rounded bg-amber-500 px-1 text-black">LƯỢT</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WaitingRoom({ room, myId, mode, setMode, onStart, onCopy }) {
  const host = room.players.find((p) => !p.left);
  const isHost = host?.id === myId;
  const ready = room.players.filter((p) => !p.left);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-3">
      <div className="anim-rise w-full max-w-lg rounded-2xl border border-emerald-800/70 bg-emerald-950/60 p-4 shadow-2xl sm:p-5">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase">Phòng chờ</p>
          <h2 className="font-display text-2xl font-bold text-amber-300">Tiến Lên Online</h2>
          <button
            type="button"
            onClick={onCopy}
            className="mt-2 rounded-lg border border-amber-500/50 bg-black/30 px-4 py-1.5 font-mono text-lg font-black tracking-widest text-amber-300 transition hover:bg-black/50"
          >
            {room.id} <span className="text-[10px] align-middle">📋</span>
          </button>
          <p className="mt-1 text-[11px] text-emerald-300/70">Chia sẻ mã phòng • tối đa 4 người • 13 lá/người</p>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2">
          {ready.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2 rounded-lg border border-emerald-900/60 bg-black/25 px-2 py-1.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${AVATAR_TONES[i % 4]}`}>
                {initials(p.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-stone-100">
                  {p.name} {p.id === myId && <span className="text-emerald-400">(Bạn)</span>}
                </p>
                <p className="text-[9px] text-emerald-300/60">{p.id === host?.id ? 'Chủ phòng' : 'Sẵn sàng'}</p>
              </div>
            </li>
          ))}
          {Array.from({ length: Math.max(0, 4 - ready.length) }, (_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center gap-2 rounded-lg border border-dashed border-emerald-900/50 px-2 py-1.5 text-[10px] text-emerald-700"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-emerald-900/60">+</span>
              Đang chờ…
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">Luật chơi</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MODES).map(([id, info]) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!isHost}
                  onClick={() => setMode(id)}
                  className={`rounded-xl border p-2 text-left transition disabled:cursor-default ${
                    active || (!isHost && room.mode === id)
                      ? 'border-amber-400/80 bg-amber-950/40'
                      : 'border-emerald-900/60 bg-black/20'
                  }`}
                >
                  <p className="text-xs font-black text-stone-100">
                    {info.label} <span className="text-[9px] font-bold text-emerald-400">{info.short}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-emerald-200/70">{info.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          {isHost ? (
            <button
              type="button"
              disabled={ready.length < 2}
              onClick={onStart}
              className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-black text-white shadow-[0_0_20px_rgba(217,119,6,0.35)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ready.length < 2 ? 'Cần ít nhất 2 người chơi…' : `🃏 Chia bài · ${MODES[mode]?.label}`}
            </button>
          ) : (
            <p className="animate-pulse text-center text-xs text-emerald-300/80">
              Đang chờ <strong className="text-amber-300">{host?.name || 'chủ phòng'}</strong> chia bài…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TienLenGame() {
  const { myId, room, joined, connected, join, leave, emit } = useSocketRoom('tienlen', 'tienlen:state');
  const { notify } = useToast();
  const [selection, setSelection] = useState({ turn: -1, ids: [] });
  const [mode, setMode] = useState('TLMN');
  const [logsOpen, setLogsOpen] = useState(false);

  const myIndex = room ? room.players.findIndex((p) => p.id === myId) : -1;
  const me = room && myIndex >= 0 ? room.players[myIndex] : null;
  const hand = me?.hand ?? [];
  const isMyTurn = Boolean(room && room.status === 'PLAYING' && room.currentTurn === myIndex);
  const current = room?.status === 'PLAYING' ? room.players[room.currentTurn] : null;
  const host = room?.players.find((p) => !p.left);
  const isHost = host?.id === myId;
  const selected = selection.turn === room?.currentTurn ? selection.ids : [];
  const winner = room?.players.find((p) => p.id === room?.winnerId);
  const opponents = useMemo(() => {
    if (!room) return [];
    return room.players.map((p, i) => ({ player: p, index: i })).filter(({ player }) => player.id !== myId && !player.left);
  }, [room, myId]);

  const handleJoin = useCallback(
    async (payload) => {
      saveName(payload.name);
      setSelection({ turn: -1, ids: [] });
      return join(payload);
    },
    [join]
  );

  const copyRoom = useCallback(async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.id);
      notify(`Đã sao chép mã phòng ${room.id}.`, 'success');
    } catch {
      notify(`Mã phòng: ${room.id}`, 'gold');
    }
  }, [room, notify]);

  const start = async () => {
    const res = await emit('tienlen:start', { mode });
    if (res?.ok) setSelection({ turn: -1, ids: [] });
  };

  const toggleCard = (card) => {
    if (!isMyTurn) return;
    setSelection((prev) => {
      const ids = prev.turn === room.currentTurn ? prev.ids : [];
      return {
        turn: room.currentTurn,
        ids: ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id]
      };
    });
  };

  const play = async () => {
    if (selected.length === 0) return;
    const res = await emit('tienlen:play', { cardIds: selected });
    if (res?.ok) setSelection({ turn: -1, ids: [] });
  };

  const passTurn = async () => {
    const res = await emit('tienlen:pass');
    if (res?.ok) setSelection({ turn: -1, ids: [] });
  };

  if (!joined || !room) {
    return <Lobby connected={connected} onJoin={handleJoin} />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#031410]">
      <div className="flex shrink-0 items-center gap-2 border-b border-emerald-900/60 bg-emerald-950/80 px-2 py-1.5 text-xs sm:px-3">
        <span className="font-display text-sm text-amber-300 sm:text-base">Tiến Lên</span>
        <button
          type="button"
          onClick={copyRoom}
          className="rounded-md border border-emerald-800 bg-black/25 px-2 py-1 font-mono text-[11px] font-bold text-emerald-100 transition hover:border-amber-500 hover:text-amber-300"
        >
          {room.id} <span className="text-[9px] opacity-70">📋</span>
        </button>
        <span className="rounded-full border border-emerald-800/70 bg-black/25 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-300">
          {MODES[room.mode]?.short || 'TLMN'}
        </span>
        <span className="ml-auto text-[10px] text-emerald-300/70">
          {room.players.filter((p) => !p.left).length}/4 · 13 lá
        </span>
        <button
          type="button"
          onClick={() => setLogsOpen(true)}
          className="rounded-md border border-emerald-800 bg-black/25 px-2 py-1 text-[11px] font-bold text-emerald-200 lg:hidden"
        >
          📜
        </button>
        <button
          type="button"
          onClick={leave}
          className="rounded-md border border-rose-900/60 bg-black/25 px-2 py-1 text-[11px] font-bold text-rose-300 transition hover:bg-rose-950/40"
        >
          Rời phòng
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b5c46_0%,#07382c_45%,#02120e_100%)]" />
          <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-emerald-400/10 sm:inset-4" />

          {room.status === 'WAITING' ? (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <WaitingRoom
                room={room}
                myId={myId}
                mode={mode}
                setMode={setMode}
                onStart={start}
                onCopy={copyRoom}
              />
            </div>
          ) : (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 gap-2 overflow-x-auto px-2 py-2 sm:justify-center sm:px-4">
                {opponents.map(({ player, index }) => (
                  <Seat
                    key={player.id}
                    player={player}
                    index={index}
                    active={room.status === 'PLAYING' && room.currentTurn === index}
                    passed={Boolean(room.passed?.[player.id])}
                    winner={player.id === room.winnerId}
                  />
                ))}
              </div>

              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-3 py-1">
                {room.status === 'FINISHED' ? (
                  <div className="anim-pop flex flex-col items-center gap-2 rounded-2xl border border-amber-500/50 bg-black/50 px-5 py-4 text-center shadow-2xl">
                    <span className="animate-bounce text-4xl" aria-hidden="true">🏆</span>
                    <h2 className="font-display text-xl font-black text-amber-300 sm:text-2xl">
                      {winner ? `${winner.name} thắng cuộc!` : 'Ván đấu kết thúc'}
                    </h2>
                    <p className="text-[11px] text-emerald-200/80">
                      {winner?.id === myId ? 'Bạn đã đánh hết bài đầu tiên!' : 'Chúc mừng người chiến thắng.'}
                    </p>
                    {isHost ? (
                      <button
                        type="button"
                        onClick={start}
                        className="mt-1 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-black text-white transition hover:bg-amber-500"
                      >
                        🔄 Ván mới
                      </button>
                    ) : (
                      <p className="text-[10px] text-emerald-300/60">Chờ chủ phòng mở ván mới…</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="min-h-16 rounded-2xl border border-emerald-400/15 bg-black/25 px-3 py-2 backdrop-blur-sm">
                      {room.lastPlayed ? (
                        <div className="flex flex-col items-center gap-1">
                          <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
                            <span className="text-amber-300">{room.lastPlayed.playerName}</span>
                            <span>·</span>
                            <span className="rounded bg-emerald-900/80 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-emerald-100 uppercase">
                              {COMBO_LABELS[room.lastPlayed.combo?.type] || 'Bài'}
                            </span>
                          </p>
                          <div className="flex justify-center -space-x-2">
                            {room.lastPlayed.cards.map((card) => (
                              <Card key={card.id} card={card} size="sm" />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2 text-center">
                          <p className="text-[10px] font-bold tracking-wider text-emerald-400/80 uppercase">Bàn trống</p>
                          <p className="text-xs text-emerald-100/90">
                            {current ? (
                              <>
                                <strong className="text-amber-300">{current.name}</strong> được đánh tự do
                              </>
                            ) : (
                              'Chuẩn bị ván mới…'
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className={`text-[11px] font-bold ${isMyTurn ? 'text-amber-300' : 'text-emerald-300/80'}`}>
                      {isMyTurn ? '👉 Đến lượt bạn đánh!' : `Đang chờ ${current?.name || 'đối thủ'}…`}
                    </p>
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-emerald-900/60 bg-black/35 px-2 pb-2 pt-1 backdrop-blur-sm sm:px-3">
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-bold text-emerald-200/80">
                    Bài của bạn <span className="text-emerald-400">({hand.length} lá)</span>
                    {selected.length > 0 && <span className="ml-2 text-amber-300">Đã chọn {selected.length}</span>}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={passTurn}
                      disabled={!isMyTurn || !room.lastPlayed}
                      className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-[11px] font-black text-stone-300 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Bỏ lượt
                    </button>
                    <button
                      type="button"
                      onClick={play}
                      disabled={!isMyTurn || selected.length === 0}
                      className="rounded-lg bg-amber-600 px-4 py-1.5 text-[11px] font-black text-white shadow transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Đánh bài
                    </button>
                  </div>
                </div>

                <div className="no-scrollbar flex items-end justify-start gap-1 overflow-x-auto px-1 pb-1 pt-4 sm:justify-center">
                  {hand.length === 0 ? (
                    <p className="w-full py-3 text-center text-xs text-emerald-300/70 italic">
                      {room.status === 'WAITING' ? 'Chờ chia bài…' : 'Bạn không còn lá bài nào.'}
                    </p>
                  ) : (
                    hand.map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        selected={selected.includes(card.id)}
                        onClick={() => toggleCard(card)}
                        disabled={!isMyTurn}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="hidden min-h-0 w-72 shrink-0 flex-col gap-2 border-l border-emerald-900/60 bg-emerald-950/30 p-2 xl:w-80 lg:flex">
          <PlayersPanel room={room} myId={myId} />
          <div className="flex min-h-0 flex-1 flex-col">
            <LogPanel logs={room.logs} />
          </div>
        </aside>
      </div>

      {logsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-2 lg:hidden" onClick={() => setLogsOpen(false)}>
          <div
            className="anim-rise flex max-h-[70dvh] w-full flex-col overflow-hidden rounded-2xl border border-emerald-800 bg-emerald-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-emerald-900 px-3 py-2">
              <span className="text-xs font-black tracking-wider text-emerald-200 uppercase">Nhật ký ván đấu</span>
              <button
                type="button"
                onClick={() => setLogsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-900 text-xs text-emerald-200"
                aria-label="Đóng nhật ký"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 p-2">
              <LogPanel logs={room.logs} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Lobby({ connected, onJoin }) {
  const [name, setName] = useState(getSavedName);
  const [roomId, setRoomId] = useState('TL_1');
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      notify('Hãy nhập tên hiển thị của bạn.', 'error');
      return;
    }
    if (!roomId.trim()) {
      notify('Hãy nhập mã phòng.', 'error');
      return;
    }
    setBusy(true);
    await onJoin({ name: clean, roomId: roomId.trim().toUpperCase() });
    setBusy(false);
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_center,_#064e3b_0%,#031d17_55%,#010806_100%)] p-3 sm:p-6">
      <form
        onSubmit={submit}
        className="anim-rise my-auto w-full max-w-md rounded-2xl border-2 border-emerald-700/60 bg-emerald-950/80 p-4 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur sm:p-6"
      >
        <div className="mb-4 text-center">
          <div className="mb-2 flex justify-center gap-1">
            <CardBack size="sm" className="-rotate-12" />
            <CardBack size="sm" className="-mt-1" />
            <CardBack size="sm" className="rotate-12" />
          </div>
          <h1 className="font-display text-2xl font-bold text-amber-300">Tiến Lên Online</h1>
          <p className="mt-1 text-[11px] text-emerald-300/80">
            Đánh hết 13 lá trước đối thủ · 2–4 người · Realtime
          </p>
        </div>

        <label className="mb-3 block text-xs font-semibold text-emerald-200">
          Tên hiển thị
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Nhập tên của bạn…"
            className="mt-1 w-full rounded-lg border border-emerald-800 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500"
          />
        </label>

        <label className="mb-4 block text-xs font-semibold text-emerald-200">
          Mã phòng
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
            maxLength={20}
            placeholder="TL_1"
            className="mt-1 w-full rounded-lg border border-emerald-800 bg-black/30 px-3 py-2 font-mono text-sm font-bold text-amber-300 outline-none transition focus:border-amber-500"
          />
        </label>

        <button
          type="submit"
          disabled={busy || !connected}
          className="w-full rounded-xl bg-amber-600 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(217,119,6,0.4)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!connected ? 'Đang kết nối máy chủ…' : busy ? 'Đang vào phòng…' : '🃏 Vào Phòng'}
        </button>

        <p className="mt-3 text-center text-[10px] text-emerald-400/60">
          Luật Miền Nam / Miền Bắc được chọn khi chủ phòng chia bài
        </p>
      </form>
    </div>
  );
}
