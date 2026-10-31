import { useState } from 'react';
import { CLASSES, getClass, hexToCss } from './data.js';
import { STARTING_GOLD, MAX_ROUNDS } from './engine.js';
import { getSavedName } from '../../lib/player.js';
import { useToast } from '../../components/toast-context.js';
import { Piece3D } from '../../three/Piece3D.jsx';
import { FantasyIcon } from '../../components/Monopoly/FantasyIcons.jsx';

export default function Lobby({ connected, onJoin, onOpenGallery }) {
  const [name, setName] = useState(getSavedName);
  const [roomId, setRoomId] = useState('VN_1');
  const [classId, setClassId] = useState('fighter');
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();

  const selected = getClass(classId);

  const submit = async (event) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) {
      notify('Hãy nhập tên nhân vật của bạn.', 'error');
      return;
    }
    if (!roomId.trim()) {
      notify('Hãy nhập mã phòng.', 'error');
      return;
    }
    setBusy(true);
    await onJoin({ name: clean, roomId: roomId.trim().toUpperCase(), classId });
    setBusy(false);
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black p-3 sm:p-6">
      <form
        onSubmit={submit}
        className="anim-rise my-auto w-full max-w-xl rounded-2xl border-2 border-amber-700/60 bg-stone-900/95 p-4 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-amber-900/50 pb-3">
          <div>
            <h1 className="font-display text-xl font-bold text-amber-400 text-shadow-gold sm:text-2xl">
              Cờ Tỷ Phú Việt Nam
            </h1>
            <p className="mt-0.5 text-[11px] text-stone-400 sm:text-xs">
              Nhà đất toàn quốc · 2–4 người chơi · Realtime
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenGallery}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-700/50 bg-stone-800 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-stone-700"
          >
            <span aria-hidden="true">🏛️</span> Quân Cờ
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-stone-300">
            Tên nhân vật
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="Tài Anh…"
              className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500"
            />
          </label>
          <label className="block text-xs font-semibold text-stone-300">
            Mã phòng
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              maxLength={20}
              placeholder="VN_1"
              className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 font-mono text-sm font-bold text-amber-300 outline-none transition focus:border-amber-500"
            />
          </label>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/80 p-3 shadow-inner">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: `${hexToCss(selected.hex)}66`, background: `${hexToCss(selected.hex)}18` }}
          >
            <Piece3D classId={classId} hexColor={selected.hex} size={72} active animated interactive />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
              <span aria-hidden="true">{selected.icon}</span> {selected.name}
            </p>
            <p className="mt-1 text-[10px] font-semibold tracking-wide text-emerald-400/90 uppercase">
              {STARTING_GOLD}g vốn · 3 Kỳ Quan · tối đa {MAX_ROUNDS} vòng
            </p>
          </div>
        </div>

        <fieldset className="mb-4">
          <legend className="mb-2 text-xs font-semibold text-stone-300">Chọn quân cờ của bạn</legend>
          <div className="grid grid-cols-5 gap-1.5">
            {CLASSES.map((c) => {
              const active = c.id === classId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClassId(c.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition ${
                    active
                      ? 'scale-[1.04] border-amber-500 bg-amber-950/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'border-stone-800 bg-stone-950/60 hover:border-stone-600'
                  }`}
                >
                  <span aria-hidden="true" className="text-lg leading-none">{c.icon}</span>
                  <span className="w-full truncate text-center text-[9px] font-bold text-stone-300">{c.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={busy || !connected}
          className="w-full rounded-xl bg-amber-700 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(217,119,6,0.45)] transition hover:scale-[1.01] hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        >
          {!connected ? 'Đang kết nối máy chủ…' : busy ? 'Đang vào phòng…' : '🎲 Ngồi Vào Bàn Cờ'}
        </button>

        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] text-stone-500">
          <FantasyIcon name="relic" className="h-4 w-4" />
          Cùng nhập một mã phòng để chơi chung · Tối đa 4 người
        </p>
      </form>
    </div>
  );
}
