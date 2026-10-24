import { useEffect } from 'react';
import { BOARD_TILES, GROUP_COLORS, INSTANT_WIN_RELIC_IDS, getClass, hexToCss, tileAccent } from './data.js';
import { TIER_NAMES, getUpgradeCost } from './engine.js';
import { FantasyIcon } from '../../components/Monopoly/FantasyIcons.jsx';

const TYPE_LABEL = {
  GO: 'Cổng khởi hành',
  PROPERTY: 'Lãnh địa',
  RELIC: 'Thánh vật',
  EVENT: 'Sự kiện D20',
  BLESSING: 'Điện thờ',
  TAX: 'Thuế hoàng gia',
  TELEPORT: 'Cổng dịch chuyển',
  JAIL: 'Ngục giam',
  PARKING: 'Nghỉ chân',
  GO_TO_JAIL: 'Lệnh bắt giữ'
};

export default function TileInspector({ tile, room, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const prop = room.properties?.[tile.id];
  const owner = prop?.ownerId ? room.players.find((p) => p.id === prop.ownerId) : null;
  const ownerClass = owner ? getClass(owner.classId) : null;
  const ownerColor = ownerClass ? hexToCss(ownerClass.hex) : null;
  const accent = ownerColor || GROUP_COLORS[tile.group] || tileAccent(tile);
  const level = prop?.level ?? 0;
  const buyable = tile.price > 0;
  const relic = INSTANT_WIN_RELIC_IDS.includes(tile.id);
  const teleportTarget = tile.type === 'TELEPORT' ? BOARD_TILES[tile.target] : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 sm:p-3">
      <div
        role="dialog"
        aria-label={`Chi tiết ${tile.name}`}
        className="anim-rise pointer-events-auto max-h-[58dvh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-amber-800/60 bg-stone-900/98 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur"
      >
        <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-stone-800 bg-stone-950/95 px-3 py-2.5 backdrop-blur">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: `${accent}aa`, background: '#0c0a09' }}
          >
            <FantasyIcon name={tile.iconKey} className="h-7 w-7" glow={relic} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: accent }}>
              {TYPE_LABEL[tile.type] || 'Ô cờ'} · Ô {tile.id}
            </p>
            <h3 className="font-display truncate text-lg font-bold text-stone-100">{tile.name}</h3>
          </div>
          {relic && (
            <span className="shrink-0 rounded-full border border-amber-500/60 bg-amber-950/60 px-2 py-0.5 text-[9px] font-black text-amber-300 uppercase">
              Thánh vật
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-800 text-xs text-stone-300 transition hover:bg-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 p-3">
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
            {buyable && (
              <span className="rounded-full border border-amber-800/60 bg-stone-950 px-2 py-0.5 text-amber-300">
                Giá đất: {tile.price}g
              </span>
            )}
            {tile.upgradeCost && (
              <span className="rounded-full border border-stone-700 bg-stone-950 px-2 py-0.5 text-stone-300">
                Nâng cấp: {getUpgradeCost(tile)}g
              </span>
            )}
            <span
              className="rounded-full border px-2 py-0.5"
              style={{
                borderColor: ownerColor ? `${ownerColor}99` : '#3f3f46',
                color: ownerColor || '#a8a29e',
                background: ownerColor ? `${ownerColor}1a` : '#0c0a09'
              }}
            >
              {owner ? `Chủ sở hữu: ${owner.name}` : 'Chưa có chủ'}
            </span>
            {prop && (
              <span className="rounded-full border border-stone-700 bg-stone-950 px-2 py-0.5 text-stone-300">
                Cấp: {TIER_NAMES[level]}
              </span>
            )}
            {teleportTarget && (
              <span className="rounded-full border border-cyan-800 bg-stone-950 px-2 py-0.5 text-cyan-300">
                Điểm đến: {teleportTarget.name}
              </span>
            )}
            {tile.type === 'TAX' && (
              <span className="rounded-full border border-rose-800 bg-stone-950 px-2 py-0.5 text-rose-300">
                Phải nộp: {tile.price}g
              </span>
            )}
          </div>

          {tile.desc && <p className="text-xs leading-relaxed text-stone-400">{tile.desc}</p>}

          {tile.rents && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold tracking-[0.14em] text-stone-500 uppercase">Bảng tiền thuê</p>
              <div className="grid grid-cols-4 gap-1.5">
                {tile.rents.map((rent, i) => {
                  const isLevel = prop ? i === level : i === 0;
                  return (
                    <div
                      key={rent}
                      className={`rounded-lg border px-1 py-1.5 text-center transition ${
                        isLevel ? 'border-amber-500/70 bg-amber-950/40' : 'border-stone-800 bg-stone-950/60'
                      }`}
                    >
                      <p className="truncate text-[9px] font-semibold text-stone-500">{TIER_NAMES[i]}</p>
                      <p className={`text-xs font-black ${isLevel ? 'text-amber-300' : 'text-stone-300'}`}>{rent}g</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
