import { useCallback, useEffect, useState } from 'react';
import { useSocketRoom } from '../../lib/useSocketRoom.js';
import { useToast } from '../../components/toast-context.js';
import { saveName } from '../../lib/player.js';
import { COLORS } from './board.js';
import { GameError, reduce } from './engine.js';
import HorseLobby from './HorseLobby.jsx';
import HorseWaitingRoom from './HorseWaitingRoom.jsx';
import HorseBoard from './HorseBoard.jsx';
import { HorsePlayers, TurnPanel } from './HorsePanel.jsx';
import HorseRules from './HorseRules.jsx';
import LogPanel from '../../components/LogPanel.jsx';
import { PieceImage } from '../../three/Piece3D.jsx';

const MOBILE_TABS = [
  { id: 'BOARD', label: 'Bàn cờ', icon: '🏇' },
  { id: 'TURN', label: 'Lượt chơi', icon: '🎲' },
  { id: 'LOGS', label: 'Nhật ký', icon: '📜' }
];

export default function HorseGame() {
  const { myId, room, setRoom, joined, connected, join, leave, emit } = useSocketRoom('horse', 'horse:state');
  const { notify } = useToast();
  const [mobileTab, setMobileTab] = useState('BOARD');
  const [selection, setSelection] = useState({ signature: null, horseId: null });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [dismissedFinish, setDismissedFinish] = useState(null);

  const me = room?.players.find((player) => player.id === myId);
  const myColor = me?.color ? COLORS[me.color] : null;
  const current = room?.status === 'PLAYING' ? room.players[room.currentTurn] : null;
  const currentColor = current?.color ? COLORS[current.color] : null;
  const isMyTurn = current?.id === myId;
  const hostId = room?.players.find((player) => !player.left)?.id;

  const dispatch = useCallback(
    (action) => {
      if (!room) return false;
      let next;
      try {
        next = reduce(room, myId, action);
      } catch (err) {
        if (err instanceof GameError) notify(err.message, 'error');
        else console.error(err);
        return false;
      }
      setRoom(next);
      emit('horse:submit', { state: next });
      return true;
    },
    [room, myId, notify, emit, setRoom]
  );

  const pendingSignature = room?.pending
    ? `${room.rollSeq}:${room.pending.moves.map((move) => `${move.horseId}:${move.die}:${move.target.status}:${move.target.pos}`).join('|')}`
    : null;
  const selectedHorse = selection.signature === pendingSignature ? selection.horseId : null;
  const setSelectedHorse = useCallback(
    (horseId) => setSelection({ signature: pendingSignature, horseId }),
    [pendingSignature]
  );

  const roomId = room?.id;
  const roomStatus = room?.status;
  const roomWinnerId = room?.winnerId;
  const finishKey = `${roomId ?? ''}:${roomStatus ?? ''}:${roomWinnerId ?? ''}`;
  const finishDismissed = dismissedFinish === finishKey;

  // The host clears stalled turns for players who dropped out so the race never locks up.
  useEffect(() => {
    if (!room || room.status !== 'PLAYING') return undefined;
    const active = room.players[room.currentTurn];
    if (!active || active.id === myId) return undefined;
    if (!active.left && active.connected !== false) return undefined;
    if (hostId !== myId) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'SKIP_TURN' }), 2500);
    return () => clearTimeout(timer);
  }, [room, myId, hostId, dispatch]);

  const handleJoin = useCallback(
    async (payload) => {
      saveName(payload.name);
      const result = await join(payload);
      if (result?.ok) setMobileTab('BOARD');
      return result;
    },
    [join]
  );

  const shareRoom = useCallback(async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.id);
      notify(`Đã sao chép mã phòng ${room.id}.`, 'success');
    } catch {
      notify(`Mã phòng: ${room.id}`, 'gold');
    }
  }, [room, notify]);

  const handleLeave = useCallback(() => {
    setSelection({ signature: null, horseId: null });
    setMobileTab('BOARD');
    leave();
  }, [leave]);

  const handleRoll = useCallback(() => dispatch({ type: 'ROLL' }), [dispatch]);
  const handleMove = useCallback(
    (index) => {
      dispatch({ type: 'MOVE', index });
      setSelection({ signature: null, horseId: null });
    },
    [dispatch]
  );
  const handleSkip = useCallback(() => dispatch({ type: 'SKIP_TURN' }), [dispatch]);
  const handleStart = useCallback(() => {
    if (dispatch({ type: 'START' })) setMobileTab('BOARD');
  }, [dispatch]);

  if (!joined || !room) {
    return <HorseLobby connected={connected} onJoin={handleJoin} />;
  }

  if (room.status === 'WAITING') {
    return (
      <HorseWaitingRoom
        room={room}
        myId={myId}
        onStart={handleStart}
        onLeave={handleLeave}
        onShare={shareRoom}
      />
    );
  }

  const winner = room.players.find((player) => player.id === room.winnerId);
  const winnerColor = winner?.color ? COLORS[winner.color] : null;
  const diceValue = Array.isArray(room.dice) ? room.dice : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/30 via-stone-950 to-black">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-amber-900/40 bg-stone-950/90 px-2 py-1.5 text-xs sm:gap-2 sm:px-3">
        <span className="font-display flex items-center gap-1 text-sm text-amber-400 sm:text-base">
          <span aria-hidden="true">🐴</span> Cờ Cá Ngựa
        </span>
        <button
          type="button"
          onClick={shareRoom}
          title="Sao chép mã phòng"
          className="flex items-center gap-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1 font-mono text-[11px] font-bold text-stone-200 transition hover:border-amber-600 hover:text-amber-300"
        >
          {room.id}
          <span aria-hidden="true" className="text-[10px] opacity-70">📋</span>
        </button>
        <span className="hidden text-stone-500 sm:inline">{room.players.filter((player) => !player.left).length}/4 kỵ sĩ</span>

        <span className="ml-auto flex items-center gap-1.5">
          {me && (
            <span
              className="flex items-center gap-1 rounded-full border px-2 py-1"
              style={{
                borderColor: myColor ? `${myColor.css}88` : '#44403c',
                background: myColor ? `${myColor.css}18` : '#1c1917'
              }}
            >
              <PieceImage classId="horse" hexColor={myColor?.hex ?? 0xd4a843} size={18} />
              <span className="hidden max-w-24 truncate font-semibold text-stone-200 sm:inline">{me.name}</span>
              <span className="text-[10px] font-black" style={{ color: myColor?.light ?? '#d6d3d1' }}>
                {myColor?.label ?? 'Chờ chia màu'}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="rounded-md border border-amber-700/50 bg-stone-900 px-2 py-1 text-[11px] font-bold text-amber-400 transition hover:bg-stone-800"
          >
            <span aria-hidden="true">📜</span>
            <span className="ml-1 hidden sm:inline">Luật chơi</span>
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1 text-[11px] font-bold text-stone-400 transition hover:border-rose-700 hover:text-rose-300"
          >
            Rời
          </button>
        </span>
      </div>

      <div className="flex shrink-0 justify-around gap-1 border-b border-stone-800 bg-stone-950/80 p-1 lg:hidden">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition ${
              mobileTab === tab.id ? 'bg-amber-700 text-white' : 'text-stone-400 hover:bg-stone-900'
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span> {tab.label}
            {tab.id === 'TURN' && room.pending && isMyTurn && (
              <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" />
            )}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          className={`flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-1 p-1 sm:p-2 ${
            mobileTab === 'BOARD' ? 'flex' : 'hidden'
          } lg:flex`}
        >
          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center" style={{ containerType: 'size' }}>
            <HorseBoard
              room={room}
              myId={myId}
              isMyTurn={isMyTurn}
              selectedHorse={selectedHorse}
              onSelectHorse={setSelectedHorse}
              onMove={handleMove}
            />
          </div>

          <div className="flex w-full shrink-0 items-center justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/90 px-2.5 py-1.5 lg:hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: currentColor?.css ?? '#a8a29e' }} />
              <span className="truncate text-[11px] font-bold text-stone-200">
                {isMyTurn ? 'Lượt của bạn' : `Lượt của ${current?.name ?? '—'}`}
              </span>
              {diceValue && (
                <span className="shrink-0 font-mono text-[10px] text-amber-300">
                  🎲 {diceValue[0]}+{diceValue[1]}
                </span>
              )}
            </div>
            {isMyTurn ? (
              room.pending ? (
                <button
                  type="button"
                  onClick={() => setMobileTab('TURN')}
                  className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white"
                >
                  Chọn nước đi ›
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRoll}
                  className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-black text-stone-950"
                >
                  🎲 Tung
                </button>
              )
            ) : (
              <span className="shrink-0 text-[10px] text-stone-500">Đang chờ…</span>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 w-full flex-col gap-2 border-stone-800 bg-stone-950/60 p-2 sm:p-3 lg:w-[23rem] lg:border-l xl:w-[25rem]">
          <div
            className={`${mobileTab === 'TURN' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col gap-2 overflow-y-auto lg:flex lg:max-h-[64%]`}
          >
            <TurnPanel
              room={room}
              myId={myId}
              isMyTurn={isMyTurn}
              selectedHorse={selectedHorse}
              onSelectHorse={setSelectedHorse}
              onRoll={handleRoll}
              onMove={handleMove}
              onSkip={handleSkip}
            />
            <HorsePlayers room={room} myId={myId} />
          </div>
          <div className={`${mobileTab === 'LOGS' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col lg:flex`}>
            <LogPanel logs={room.logs} />
          </div>
        </aside>
      </div>

      {room.status === 'FINISHED' && !finishDismissed && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="anim-pop w-full max-w-md overflow-hidden rounded-2xl border-2 border-amber-600/60 bg-stone-950 shadow-[0_0_80px_rgba(245,158,11,0.2)]">
            <div className="bg-gradient-to-b from-amber-950/50 to-transparent px-5 pt-5 text-center">
              <p className="text-[10px] font-black tracking-[0.25em] text-amber-400/80 uppercase">
                {room.winReason === 'LAST_STANDING' ? 'Trụ lại cuối cùng' : 'Về đích'}
              </p>
              <div className="mt-1 flex justify-center">
                <PieceImage classId="horse" hexColor={winnerColor?.hex ?? 0xd4a843} size={120} className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.8)]" />
              </div>
              <h2 className="font-display text-shadow-gold mt-1 text-2xl font-bold text-amber-300">
                {winner?.name ?? 'Ván đấu kết thúc'}
              </h2>
              {winnerColor && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-stone-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: winnerColor.css }} />
                  {winnerColor.label} · {room.winReason === 'LAST_STANDING' ? 'trụ lại cuối cùng' : '4 ngựa đã yên vị'}
                </p>
              )}
            </div>
            <div className="px-5 pb-5 pt-3">
              <p className="text-center text-[11px] leading-relaxed text-stone-400">
                {room.winReason === 'LAST_STANDING'
                  ? 'Tất cả đối thủ đã rời đường đua.'
                  : 'Chúc mừng! Bốn ngựa đã chiếm trọn các bậc 3 – 4 – 5 – 6.'}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDismissedFinish(finishKey)}
                  className="flex-1 rounded-xl border border-stone-700 bg-stone-900 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-stone-800"
                >
                  Xem bàn cờ
                </button>
                <button
                  type="button"
                  onClick={handleLeave}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-black text-stone-950 transition hover:bg-amber-500"
                >
                  Rời phòng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <HorseRules open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
