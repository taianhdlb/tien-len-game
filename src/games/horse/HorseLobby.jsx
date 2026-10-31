import { useState } from 'react';
import { COLORS, COLOR_ORDER } from './board.js';
import { getSavedName } from '../../lib/player.js';
import { useToast } from '../../components/toast-context.js';
import { Piece3D, PieceImage } from '../../three/Piece3D.jsx';
import HorseRules from './HorseRules.jsx';

export default function HorseLobby({ connected, onJoin }) {
  const [name, setName] = useState(getSavedName);
  const [roomId, setRoomId] = useState('NGUA_1');
  const [busy, setBusy] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { notify } = useToast();

  const submit = async (event) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) {
      notify('Hãy nhập tên kỵ sĩ của bạn.', 'error');
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
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/70 via-stone-950 to-black p-3 sm:p-6">
      <form
        onSubmit={submit}
        className="anim-rise my-auto w-full max-w-2xl rounded-2xl border-2 border-amber-700/60 bg-stone-900/95 p-4 shadow-[0_0_70px_rgba(0,0,0,0.95)] backdrop-blur sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-amber-900/50 pb-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.22em] text-emerald-400/90 uppercase">Trường đua Hoàng gia</p>
            <h1 className="font-display text-shadow-gold mt-0.5 text-2xl font-bold text-amber-400 sm:text-3xl">
              Cờ Cá Ngựa
            </h1>
            <p className="mt-1 text-[11px] text-stone-400 sm:text-xs">
              Bàn cờ 48 ô · 4 chú ngựa · 1 viên xúc xắc D6 · 2–4 kỵ sĩ realtime
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-700/50 bg-stone-800 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-stone-700"
          >
            <span aria-hidden="true">📜</span> Luật chơi
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/80 p-3 shadow-inner">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-amber-700/30 bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.16),transparent_70%)]">
            <Piece3D classId="horse" hexColor={COLORS.RED.hex} size={92} active animated interactive />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-black text-amber-300">
              <span aria-hidden="true">🐴</span> Chiến mã bờm vàng
            </p>
            <p className="mt-0.5 text-xs leading-snug text-stone-400">
              Mỗi kỵ sĩ nhận 4 chú ngựa cùng màu. Đưa đủ 4 ngựa vào chuồng theo thứ tự 6 – 5 – 4 – 3 để chiến thắng.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COLOR_ORDER.map((id) => (
                <span
                  key={id}
                  className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ borderColor: `${COLORS[id].css}88`, background: `${COLORS[id].css}18`, color: COLORS[id].light }}
                >
                  <PieceImage classId="horse" hexColor={COLORS[id].hex} size={18} className="drop-shadow" />
                  {COLORS[id].label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-stone-300">
            Tên kỵ sĩ
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={20}
              placeholder="Tài Anh…"
              className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500"
            />
          </label>
          <label className="block text-xs font-semibold text-stone-300">
            Mã phòng
            <input
              value={roomId}
              onChange={(event) => setRoomId(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              maxLength={20}
              placeholder="NGUA_1"
              className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 font-mono text-sm font-bold text-amber-300 outline-none transition focus:border-amber-500"
            />
          </label>
        </div>

        <div className="mb-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3">
          <p className="text-[10px] font-black tracking-[0.16em] text-emerald-300/80 uppercase">Chia màu tự động</p>
          <div className="mt-1.5 grid gap-1 text-[11px] leading-relaxed text-stone-300 sm:grid-cols-3">
            <p><span className="font-bold text-rose-300">2 người:</span> Đỏ ↔ Xanh lá</p>
            <p><span className="font-bold text-sky-300">3 người:</span> thêm Xanh dương</p>
            <p><span className="font-bold text-amber-300">4 người:</span> đủ bốn màu</p>
          </div>
          <p className="mt-1 text-[10px] text-stone-500">Tối đa 4 người chơi mỗi phòng.</p>
        </div>

        <button
          type="submit"
          disabled={busy || !connected}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:scale-[1.01] hover:from-emerald-600 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        >
          {!connected ? 'Đang kết nối máy chủ…' : busy ? 'Đang vào chuồng…' : '🐴 Vào trường đua'}
        </button>

        <p className="mt-3 text-center text-[10px] text-stone-500">
          Chia sẻ mã phòng để bạn bè cùng tham gia · Xúc xắc và ngựa được dựng 3D ngay trong trình duyệt
        </p>
      </form>

      <HorseRules open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
