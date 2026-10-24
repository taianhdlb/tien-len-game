import { useState } from 'react';
import { COLORS, COLOR_SETS } from './board.js';
import { PieceImage } from '../../three/Piece3D.jsx';
import HorseRules from './HorseRules.jsx';

export default function HorseWaitingRoom({ room, myId, onStart, onLeave, onShare }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const seated = room.players.filter((player) => !player.left);
  const host = seated[0];
  const isHost = host?.id === myId;
  const palette = COLOR_SETS[seated.length] ?? [];
  const canStart = seated.length >= 2 && isHost;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/50 via-stone-950 to-black p-3 sm:p-6">
      <div className="anim-rise my-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-2xl border-2 border-amber-700/60 bg-stone-900/95 shadow-[0_0_70px_rgba(0,0,0,0.95)]">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-900/50 bg-gradient-to-r from-stone-900 to-stone-950 px-4 py-3 sm:px-5">
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] text-emerald-400/90 uppercase">Phòng chờ · Trường đua</p>
              <h1 className="font-display text-shadow-gold text-xl font-bold text-amber-400 sm:text-2xl">Cờ Cá Ngựa</h1>
              <p className="mt-0.5 text-[11px] text-stone-400">
                {seated.length}/4 kỵ sĩ · {seated.length < 2 ? 'Cần ít nhất 2 người để xuất phát' : 'Sẵn sàng xuất phát'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onShare}
                className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 font-mono text-[11px] font-bold text-amber-300 transition hover:border-amber-600"
                title="Sao chép mã phòng"
              >
                {room.id} <span aria-hidden="true" className="text-[10px] opacity-70">📋</span>
              </button>
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-[11px] font-bold text-stone-300 transition hover:border-amber-600 hover:text-amber-200"
              >
                📜 Luật
              </button>
              <button
                type="button"
                onClick={onLeave}
                className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-[11px] font-bold text-stone-400 transition hover:border-rose-700 hover:text-rose-300"
              >
                Rời
              </button>
            </div>
          </header>

          <div className="grid gap-2.5 p-3 sm:grid-cols-2 sm:p-5">
            {[0, 1, 2, 3].map((slot) => {
              const player = seated[slot];
              const previewColor = palette[slot] ? COLORS[palette[slot]] : null;
              const color = previewColor ?? { hex: 0xd4a843, css: '#d4a843', dark: '#3f2d0b', light: '#fde68a', label: 'Chờ chia màu' };
              return (
                <div
                  key={slot}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 transition ${
                    player ? 'bg-stone-900/80' : 'border-dashed bg-stone-950/40'
                  }`}
                  style={{ borderColor: player ? `${color.css}88` : '#3f3f46' }}
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: player ? color.css : '#3f3f46', background: player ? `${color.css}1c` : '#0c0a09' }}
                  >
                    <PieceImage
                      classId="horse"
                      hexColor={color.hex}
                      size={48}
                      className={player ? '' : 'opacity-25 grayscale'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {player ? (
                      <>
                        <p className="flex items-center gap-1.5 truncate text-sm font-black text-stone-100">
                          {player.name}
                          {player.id === myId && (
                            <span className="rounded bg-amber-900/70 px-1 py-0.5 text-[8px] text-amber-200">BẠN</span>
                          )}
                        </p>
                        <p className="text-[10px] font-semibold" style={{ color: color.light }}>
                          {color.label}
                          {player.id === host?.id && ' · Chủ phòng'}
                        </p>
                        <p className="text-[9px] text-stone-500">
                          {player.connected === false ? 'Đang mất kết nối…' : 'Đã vào chuồng ngựa'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-stone-500">Ghế trống</p>
                        <p className="text-[10px] text-stone-600">Chia sẻ mã phòng để mời thêm</p>
                      </>
                    )}
                  </div>
                  {player && <span aria-hidden="true" className="text-lg">{slot === 0 ? '👑' : '🐴'}</span>}
                </div>
              );
            })}
          </div>

          <footer className="border-t border-stone-800 bg-stone-950/60 px-3 py-3 sm:px-5">
            <div className="mb-2 flex items-center justify-center gap-2 text-[10px] text-stone-500">
              <span>Màu được chia tự động khi bắt đầu:</span>
              <span className="font-semibold text-rose-300">2 → Đỏ/Xanh lá</span>
              <span className="text-stone-700">·</span>
              <span className="font-semibold text-sky-300">3 → +Xanh dương</span>
              <span className="text-stone-700">·</span>
              <span className="font-semibold text-amber-300">4 → đủ 4 màu</span>
            </div>
            {isHost ? (
              <button
                type="button"
                onClick={onStart}
                disabled={!canStart}
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-black text-stone-950 shadow-[0_0_24px_rgba(245,158,11,0.3)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 sm:text-base"
              >
                {canStart ? '🏁 Bắt đầu trận đua' : 'Cần ít nhất 2 kỵ sĩ để bắt đầu'}
              </button>
            ) : (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900 py-3 text-sm font-bold text-stone-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                Chờ chủ phòng bắt đầu…
              </div>
            )}
          </footer>
        </div>

        <p className="mt-3 text-center text-[10px] text-stone-600">
          Mẹo: tối đa 4 người · mỗi người 4 ngựa · tung đôi hoặc 1–6 để xuất quân
        </p>
      </div>

      <HorseRules open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
