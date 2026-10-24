import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocketRoom } from '../../lib/useSocketRoom.js';
import { useToast } from '../../components/toast-context.js';
import { saveName } from '../../lib/player.js';
import { countRelics, GameError, reduce } from './engine.js';
import { getClass } from './data.js';
import Lobby from './Lobby.jsx';
import Board from './Board.jsx';
import PartyPanel from './PartyPanel.jsx';
import LogPanel from '../../components/LogPanel.jsx';
import PendingDialog from './PendingDialog.jsx';
import TileInspector from './TileInspector.jsx';
import TokenGallery from './TokenGallery.jsx';

const MOBILE_TABS = [
  { id: 'BOARD', label: 'Bàn cờ', icon: '🏰' },
  { id: 'PARTY', label: 'Tổ đội', icon: '👥' },
  { id: 'LOGS', label: 'Nhật ký', icon: '📜' }
];

export default function MonopolyGame() {
  const { myId, room, setRoom, joined, connected, join, leave, emit } = useSocketRoom('monopoly', 'monopoly:state');
  const { notify } = useToast();
  const [inspectedTile, setInspectedTile] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('BOARD');

  const me = room?.players.find((p) => p.id === myId);
  const current = room?.status === 'PLAYING' ? room.players[room.currentTurn] : null;
  const isMyTurn = current?.id === myId;
  const hostId = room?.players.find((p) => !p.left)?.id;
  const relics = room?.properties ? countRelics(room, myId) : 0;
  const skipTarget = current && current.id !== myId && (current.left || current.connected === false);

  const dispatch = useCallback(
    (action) => {
      if (!room) return;
      let next;
      try {
        next = reduce(room, myId, action);
      } catch (err) {
        if (err instanceof GameError) notify(err.message, 'error');
        else console.error(err);
        return;
      }
      setRoom(next);
      emit('monopoly:submit', { state: next });
    },
    [room, myId, notify, emit, setRoom]
  );

  // The host clears stalled turns for players who dropped out so the table never locks up.
  useEffect(() => {
    if (!room || room.status !== 'PLAYING' || !skipTarget || hostId !== myId) return;
    const timer = setTimeout(() => dispatch({ type: 'SKIP_TURN' }), 2500);
    return () => clearTimeout(timer);
  }, [room, skipTarget, hostId, myId, dispatch]);

  const handleJoin = useCallback(
    async (payload) => {
      saveName(payload.name);
      const res = await join(payload);
      if (res?.ok) setMobileTab('BOARD');
      return res;
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
    setInspectedTile(null);
    leave();
  }, [leave]);

  const myClass = useMemo(() => getClass(me?.classId), [me?.classId]);

  if (!joined || !room) {
    return (
      <>
        <Lobby connected={connected} onJoin={handleJoin} onOpenGallery={() => setGalleryOpen(true)} />
        <TokenGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black">
      <div className="flex shrink-0 items-center gap-2 border-b border-amber-900/40 bg-stone-950/90 px-2 py-1.5 text-xs sm:px-3">
        <span className="font-display text-sm text-amber-400 sm:text-base">Baldur&apos;s Gate</span>
        <button
          type="button"
          onClick={shareRoom}
          title="Sao chép mã phòng"
          className="flex items-center gap-1 rounded-md border border-stone-700 bg-stone-900 px-2 py-1 font-mono text-[11px] font-bold text-stone-200 transition hover:border-amber-600 hover:text-amber-300"
        >
          {room.id}
          <span aria-hidden="true" className="text-[10px] opacity-70">📋</span>
        </button>
        <span className="hidden text-stone-500 sm:inline">{room.players.filter((p) => !p.left).length}/4 chiến binh</span>

        <span className="ml-auto flex items-center gap-2 text-stone-300">
          {me && (
            <span className="flex items-center gap-1 rounded-full border border-amber-900/50 bg-stone-900/80 px-2 py-1">
              <span aria-hidden="true">{myClass.icon}</span>
              <span className="hidden max-w-24 truncate font-semibold sm:inline">{me.name}</span>
              <span className="font-bold text-amber-300">{me.gold ?? 0}g</span>
              <span aria-hidden="true" className="text-amber-500/80">🏆{relics}/3</span>
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          className="rounded-md border border-amber-700/50 bg-stone-900 px-2 py-1 text-[11px] font-bold text-amber-400 transition hover:bg-stone-800"
        >
          <span aria-hidden="true">🏛️</span>
          <span className="ml-1 hidden sm:inline">Bộ sưu tập 3D</span>
        </button>
        <button
          type="button"
          onClick={handleLeave}
          className="rounded-md border border-stone-700 bg-stone-900 px-2 py-1 text-[11px] font-bold text-stone-400 transition hover:border-rose-700 hover:text-rose-300"
        >
          Rời phòng
        </button>
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
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          className={`flex min-h-0 min-w-0 flex-1 items-center justify-center p-1 sm:p-2 ${mobileTab === 'BOARD' ? 'flex' : 'hidden'} lg:flex`}
          style={{ containerType: 'size' }}
        >
          <Board
            room={room}
            myId={myId}
            isMyTurn={isMyTurn}
            onInspect={setInspectedTile}
            onDispatch={dispatch}
            onOpenGallery={() => setGalleryOpen(true)}
          />
        </section>

        <aside className="flex min-h-0 w-full flex-col gap-2 border-stone-800 bg-stone-950/60 p-2 sm:p-3 lg:w-[22rem] lg:border-l xl:w-[24rem]">
          <div className={`${mobileTab === 'PARTY' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col lg:flex lg:max-h-[46%]`}>
            <PartyPanel room={room} myId={myId} />
          </div>
          <div className={`${mobileTab === 'LOGS' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col lg:flex`}>
            <LogPanel logs={room.logs} />
          </div>
        </aside>
      </div>

      {room.status === 'PLAYING' && room.pending && (
        <PendingDialog room={room} myId={myId} isMyTurn={isMyTurn} onDispatch={dispatch} />
      )}

      {inspectedTile && <TileInspector tile={inspectedTile} room={room} onClose={() => setInspectedTile(null)} />}
      <TokenGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
