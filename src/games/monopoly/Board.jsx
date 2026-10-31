import { useEffect, useRef, useState } from 'react';
import {
  BOARD_TILES,
  GROUP_COLORS,
  INSTANT_WIN_RELIC_IDS,
  getClass,
  hexToCss,
  tileAccent
} from './data.js';
import { getTileGridArea, isCorner } from './boardLayout.js';
import { FantasyIcon } from '../../components/Monopoly/FantasyIcons.jsx';
import { BuildingImage, PieceImage } from '../../three/Piece3D.jsx';
import CenterPanel from './CenterPanel.jsx';
import { usePawnPositions } from './usePawnPositions.js';

function Tile({ tile, room, boardSize, onInspect }) {
  const { row, col, edge } = getTileGridArea(tile.id);
  const corner = isCorner(tile.id);
  const prop = room.properties?.[tile.id];
  const owner = prop?.ownerId ? room.players.find((p) => p.id === prop.ownerId) : null;
  const ownerHex = owner ? getClass(owner.classId).hex : null;
  const ownerColor = ownerHex ? hexToCss(ownerHex) : null;
  const accent = ownerColor || GROUP_COLORS[tile.group] || tileAccent(tile);
  const relic = INSTANT_WIN_RELIC_IDS.includes(tile.id);
  const rent = prop && tile.rents ? tile.rents[prop.level || 0] : tile.rent;
  const iconPx = Math.round(Math.max(15, Math.min(corner ? 38 : 28, boardSize * (corner ? 0.052 : 0.038))));
  const costLabel = tile.type === 'TAX' ? `${Math.round(tile.taxRate * 100)}%` : tile.price > 0 ? `${tile.price}g` : null;
  const costAria = tile.type === 'TAX' ? `thuế ${costLabel}` : `giá ${tile.price} vàng`;

  return (
    <button
      type="button"
      data-tile={tile.id}
      onClick={() => onInspect(tile)}
      style={{
        gridRow: row,
        gridColumn: col,
        backgroundColor: corner ? '#1c1917' : '#0c0a09',
        borderColor: ownerColor || (corner ? '#92400eb3' : '#44403c80'),
        boxShadow: ownerColor ? `inset 0 0 0 1px ${ownerColor}59` : undefined
      }}
      className="group relative flex min-h-0 min-w-0 flex-col items-center justify-between overflow-visible rounded-[3px] border p-[2px] transition hover:z-20 hover:brightness-125 focus:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      aria-label={`${tile.name}${costLabel ? `, ${costAria}` : ''}`}
    >
      {!corner && (
        <span
          className={`w-full shrink-0 rounded-full shadow-inner ${edge === 'top' ? 'order-3 mt-[1px]' : 'order-1 mb-[1px]'}`}
          style={{ height: 'clamp(2px, 0.55cqw, 5px)', backgroundColor: accent }}
        />
      )}

      <span className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden py-[1px] ${edge === 'top' ? 'order-2' : ''}`}>
        {prop?.ownerId ? (
          <BuildingImage tier={prop.level || 0} hexColor={ownerHex || 0xf59e0b} size={iconPx} />
        ) : (
          <FantasyIcon
            name={tile.iconKey}
            glow={relic}
            className={corner ? 'h-[4.2cqw] w-[4.2cqw] min-h-5 min-w-5' : 'h-[2.8cqw] w-[2.8cqw] min-h-3 min-w-3'}
          />
        )}
      </span>

      <span
        className={`flex w-full min-w-0 flex-col items-center justify-center overflow-hidden px-[1px] text-center ${
          edge === 'top' ? 'order-1' : 'order-3'
        }`}
      >
        <span
          className="line-clamp-2 w-full break-words font-extrabold leading-[1.15] text-stone-100"
          style={{ fontSize: corner ? 'clamp(6.5px, 1.35cqw, 11px)' : 'clamp(5px, 1.1cqw, 9.5px)' }}
        >
          {tile.shortName || tile.name}
        </span>
        {prop?.ownerId ? (
          <span
            className="w-full truncate font-black leading-[1.2] text-emerald-400"
            style={{ fontSize: 'clamp(4.5px, 0.95cqw, 8px)' }}
          >
            {rent}g
          </span>
        ) : (
          costLabel && (
            <span
              className={`w-full truncate font-black leading-[1.2] ${
                tile.type === 'TAX' ? 'text-rose-300/90' : 'text-amber-300/90'
              }`}
              style={{ fontSize: 'clamp(4.5px, 0.95cqw, 8px)' }}
            >
              {costLabel}
            </span>
          )
        )}
      </span>
    </button>
  );
}

export default function Board({ room, myId, isMyTurn, onInspect, onDispatch }) {
  const boardRef = useRef(null);
  const [metrics, setMetrics] = useState({ centers: [], size: 0 });
  const display = usePawnPositions(room);
  const currentId = room.status === 'PLAYING' ? room.players[room.currentTurn]?.id : null;

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return undefined;

    const measure = () => {
      const box = node.getBoundingClientRect();
      const centers = BOARD_TILES.map((tile) => {
        const el = node.querySelector(`[data-tile="${tile.id}"]`);
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
      });
      setMetrics((prev) =>
        prev.size === Math.round(box.width) && prev.centers.length === centers.length ? prev : { centers, size: box.width }
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const size = metrics.size || 560;
  const pawnPx = Math.round(Math.max(24, Math.min(54, size * 0.078)));
  const spread = Math.max(9, Math.min(20, size * 0.026));

  const pawns =
    metrics.centers.length === 0
      ? []
      : room.players
          .filter((p) => !p.left)
          .map((player) => {
            const pos = display[player.id] ?? player.position ?? 0;
            const center = metrics.centers[pos] || metrics.centers[0];
            if (!center) return null;
            const mates = room.players.filter(
              (p) => !p.left && (display[p.id] ?? p.position ?? 0) === pos
            );
            const slot = mates.findIndex((p) => p.id === player.id);
            return {
              player,
              pos,
              x: center.x + (slot - (mates.length - 1) / 2) * spread,
              y: center.y,
              active: player.id === currentId,
              moving: pos !== (player.position || 0)
            };
          })
          .filter(Boolean);

  return (
    <div
      ref={boardRef}
      className="relative max-h-full max-w-full rounded-xl border-[3px] border-amber-900/80 bg-stone-900/80 p-[clamp(2px,0.35cqw,5px)] shadow-[0_0_45px_rgba(0,0,0,0.9)]"
      style={{
        width: 'min(100cqw, 100cqh)',
        height: 'min(100cqw, 100cqh)',
        containerType: 'inline-size',
        display: 'grid',
        gridTemplateColumns: '1.45fr repeat(9, 1fr) 1.45fr',
        gridTemplateRows: '1.45fr repeat(9, 1fr) 1.45fr',
        gap: 'clamp(1px, 0.3cqw, 3px)'
      }}
    >
      {BOARD_TILES.map((tile) => (
        <Tile key={tile.id} tile={tile} room={room} boardSize={size} onInspect={onInspect} />
      ))}

      <div
        style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
        className="relative z-10 m-[1px] flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg border border-amber-900/50 bg-stone-950/95 p-1 shadow-inner backdrop-blur-sm sm:p-2"
      >
        <CenterPanel room={room} myId={myId} isMyTurn={isMyTurn} boardSize={size} onDispatch={onDispatch} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
        {pawns.map(({ player: p, x, y, active, moving }) => {
          const cls = getClass(p.classId);
          const ring = hexToCss(cls.hex);
          const lit = active || moving;
          return (
            <div
              key={p.id}
              className="absolute left-0 top-0 transition-transform duration-[150ms] ease-linear will-change-transform"
              style={{ transform: `translate3d(${x}px, ${y}px, 0)`, zIndex: lit ? 40 : 30 }}
            >
              <div
                className={`relative -translate-x-1/2 -translate-y-[62%] transition-transform duration-[150ms] ${lit ? 'scale-[1.18]' : ''}`}
              >
                {lit && (
                  <span
                    className="anim-glow absolute inset-x-0 -bottom-1 h-2.5 rounded-full blur-[4px]"
                    style={{ backgroundColor: ring }}
                  />
                )}
                <span
                  className="flex items-center justify-center rounded-full border-2 shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                  style={{
                    width: pawnPx + 10,
                    height: pawnPx + 10,
                    borderColor: ring,
                    background: `radial-gradient(circle, ${ring}33 0%, rgba(12,10,9,0.9) 65%)`
                  }}
                >
                  <PieceImage
                    classId={p.classId}
                    hexColor={cls.hex}
                    size={pawnPx}
                    alt={p.name}
                    className={lit ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.95)]' : ''}
                  />
                </span>
                {p.inJail && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 text-[10px] leading-none"
                    style={{ fontSize: Math.max(9, pawnPx * 0.36) }}
                  >
                    ⛓️
                  </span>
                )}
                {p.connected === false && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-1 -top-1 rounded-full bg-rose-950 px-1 text-[8px] font-black text-rose-300"
                  >
                    !
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
