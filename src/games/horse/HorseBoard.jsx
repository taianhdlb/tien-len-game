import { useMemo } from 'react';
import { COLORS, COLOR_ORDER, HOME_SLOTS, TRACK, cellCenter, homeSlot, horsePoint, trackIndex, yardSlot } from './board.js';
import { HOME_FACES, isSatNut } from './engine.js';
import { boardTokenSnapshot } from '../../three/scenes.js';

const TRACK_DECOR = TRACK.map((cell, index) => {
  const start = COLOR_ORDER.find((id) => COLORS[id].start === index) ?? null;
  const gate = COLOR_ORDER.find((id) => COLORS[id].gate === index) ?? null;
  const angle = index <= 12 ? 0 : index <= 24 ? 90 : index <= 36 ? 180 : 270;
  return { cell, index, start, gate, angle };
});

const darkInk = (id) => (id === 'YELLOW' ? '#422006' : '#fffbeb');

function targetPoint(colorId, target) {
  if (target.status === 'TRACK') return cellCenter(TRACK[trackIndex(colorId, target.pos)]);
  if (target.status === 'HOME') return homeSlot(colorId, target.pos);
  return null;
}

const pct = (value) => `${(value / 13) * 100}%`;

export default function HorseBoard({ room, myId, isMyTurn, selectedHorse, onSelectHorse, onMove }) {
  const current = room.status === 'PLAYING' ? room.players[room.currentTurn] : null;
  const activeColors = new Set(room.players.filter((player) => !player.left).map((player) => player.color).filter(Boolean));

  const horseImages = useMemo(
    () =>
      Object.fromEntries(
        COLOR_ORDER.map((id) => [id, boardTokenSnapshot('horse', COLORS[id].hex, 192)])
      ),
    []
  );

  const allMoves = useMemo(() => {
    if (!isMyTurn || !room.pending) return [];
    return room.pending.moves.map((move, index) => ({ ...move, index }));
  }, [isMyTurn, room.pending]);

  const visibleMoves = useMemo(
    () => (selectedHorse ? allMoves.filter((move) => move.horseId === selectedHorse) : allMoves),
    [allMoves, selectedHorse]
  );

  const movableHorses = useMemo(() => new Set(allMoves.map((move) => move.horseId)), [allMoves]);

  const tokens = useMemo(() => {
    const list = [];
    room.players.forEach((player) => {
      if (player.left || !player.color) return;
      player.horses.forEach((horse, horseIndex) => {
        const point = horsePoint(player.color, horse, horse.slot ?? horseIndex);
        if (!point) return;
        list.push({ player, horse, horseIndex, point });
      });
    });

    const groups = new Map();
    for (const token of list) {
      const key = `${token.point.row.toFixed(3)}:${token.point.col.toFixed(3)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(token);
    }

    const stackScale = (count) => 1 / (1 + (count - 1) * 0.24);
    return list.map((token) => {
      const key = `${token.point.row.toFixed(3)}:${token.point.col.toFixed(3)}`;
      const group = groups.get(key);
      const slot = group.indexOf(token);
      let { row, col } = token.point;
      if (group.length > 1) {
        const angle = (slot / group.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 0.14 + Math.min(group.length, 4) * 0.025;
        row += Math.sin(angle) * radius;
        col += Math.cos(angle) * radius;
      }
      return {
        ...token,
        x: pct(col),
        y: pct(row),
        scale: stackScale(group.length),
        stacked: group.length
      };
    });
  }, [room.players]);

  const targets = useMemo(() => {
    const map = new Map();
    if (!current) return [];
    for (const move of visibleMoves) {
      const key = `${move.target.status}:${move.target.pos}`;
      if (!map.has(key)) {
        const point = targetPoint(current.color, move.target);
        if (!point) continue;
        map.set(key, {
          key,
          point,
          target: move.target,
          captures: move.captures.length,
          index: move.index,
          horseId: move.horseId,
          count: 0
        });
      }
      map.get(key).count += 1;
    }
    return [...map.values()];
  }, [visibleMoves, current]);

  const handleHorseClick = (horse) => {
    if (!isMyTurn) return;
    const options = allMoves.filter((move) => move.horseId === horse.id);
    if (options.length === 0) return;
    if (options.length === 1) {
      onSelectHorse(null);
      onMove(options[0].index);
      return;
    }
    onSelectHorse(selectedHorse === horse.id ? null : horse.id);
  };

  return (
    <div
      className="relative max-h-full max-w-full rounded-[1.4rem] border-[3px] border-amber-800/70 bg-gradient-to-br from-[#2a1d10] via-[#160f09] to-[#0a0705] p-[clamp(3px,0.55cqw,7px)] shadow-[0_0_70px_rgba(0,0,0,0.95),inset_0_0_40px_rgba(120,70,20,0.18)]"
      style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)', containerType: 'inline-size' }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[1.1rem]">
        <svg viewBox="0 0 13 13" className="absolute inset-0 h-full w-full" role="img" aria-label="Bàn cờ Cá Ngựa 48 ô">
          <defs>
            <radialGradient id="horse-board-bg" cx="50%" cy="42%" r="75%">
              <stop offset="0%" stopColor="#2c2115" />
              <stop offset="55%" stopColor="#1b130c" />
              <stop offset="100%" stopColor="#0b0805" />
            </radialGradient>
            <radialGradient id="horse-medallion" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#f5d78e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0b0805" stopOpacity="0" />
            </radialGradient>
            {COLOR_ORDER.map((id) => {
              const color = COLORS[id];
              return (
                <radialGradient key={id} id={`horse-yard-${id}`} cx="50%" cy="45%" r="70%">
                  <stop offset="0%" stopColor={color.css} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={color.dark} stopOpacity="0.5" />
                </radialGradient>
              );
            })}
          </defs>

          <rect width="13" height="13" rx="0.6" fill="url(#horse-board-bg)" />
          <rect x="0.08" y="0.08" width="12.84" height="12.84" rx="0.55" fill="none" stroke="#a97c34" strokeWidth="0.055" opacity="0.65" />

          {/* Cross-shaped courtyard beneath the tracks. */}
          <rect x="4.02" y="0.12" width="4.96" height="12.76" rx="0.3" fill="#3a2a19" opacity="0.42" />
          <rect x="0.12" y="4.02" width="12.76" height="4.96" rx="0.3" fill="#3a2a19" opacity="0.42" />

          {/* Four stables. */}
          {COLOR_ORDER.map((id) => {
            const color = COLORS[id];
            const { yard } = color;
            const active = activeColors.has(id);
            return (
              <g key={`yard-${id}`} opacity={active ? 1 : 0.32}>
                <rect
                  x={yard.col + 0.08}
                  y={yard.row + 0.08}
                  width={yard.size - 0.16}
                  height={yard.size - 0.16}
                  rx="0.42"
                  fill={`url(#horse-yard-${id})`}
                  stroke={color.css}
                  strokeWidth="0.06"
                  strokeOpacity="0.8"
                />
                <rect
                  x={yard.col + 0.19}
                  y={yard.row + 0.19}
                  width={yard.size - 0.38}
                  height={yard.size - 0.38}
                  rx="0.32"
                  fill="none"
                  stroke={color.light}
                  strokeWidth="0.025"
                  strokeOpacity="0.35"
                  strokeDasharray="0.16 0.1"
                />
                <text
                  x={yard.col + 1.5}
                  y={yard.row + 0.43}
                  textAnchor="middle"
                  fontSize="0.24"
                  fontWeight="800"
                  letterSpacing="0.06"
                  fill={color.light}
                >
                  {color.label.toUpperCase()}
                </text>
                {[0, 1, 2, 3].map((slot) => {
                  const point = yardSlot(id, slot);
                  return (
                    <circle
                      key={slot}
                      cx={point.col}
                      cy={point.row}
                      r="0.43"
                      fill="#090705"
                      fillOpacity="0.35"
                      stroke={color.css}
                      strokeWidth="0.025"
                      strokeOpacity="0.4"
                      strokeDasharray="0.1 0.08"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Home staircases. */}
          {COLOR_ORDER.map((id) => {
            const color = COLORS[id];
            const active = activeColors.has(id);
            return (
              <g key={`lane-${id}`} opacity={active ? 1 : 0.28}>
                {color.lane.map((cell, step) => {
                  const x = cell.col + 0.055;
                  const y = cell.row + 0.055;
                  const filled = (room.players.find((p) => p.color === id)?.horses || []).some(
                    (horse) => horse.status === 'HOME' && horse.pos === step + 1
                  );
                  return (
                    <g key={`${id}-${step}`}>
                      <rect
                        x={x}
                        y={y}
                        width="0.89"
                        height="0.89"
                        rx="0.13"
                        fill={color.css}
                        fillOpacity={0.55 + step * 0.045}
                        stroke={color.light}
                        strokeWidth="0.03"
                        strokeOpacity="0.7"
                      />
                      <text
                        x={cell.col + 0.5}
                        y={cell.row + 0.61}
                        textAnchor="middle"
                        fontSize="0.32"
                        fontWeight="800"
                        fill={darkInk(id)}
                        opacity={filled ? 0.35 : 0.92}
                      >
                        {HOME_FACES[step]}
                      </text>
                      {step === HOME_SLOTS - 1 && (
                        <circle
                          cx={cell.col + 0.5}
                          cy={cell.row + 0.5}
                          r="0.33"
                          fill="none"
                          stroke="#fde68a"
                          strokeWidth="0.045"
                          opacity="0.85"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Shared 48-cell track. */}
          {TRACK_DECOR.map(({ cell, index, start, gate, angle }) => {
            const startColor = start ? COLORS[start] : null;
            const gateColor = gate ? COLORS[gate] : null;
            const active = start ? activeColors.has(start) : gate ? activeColors.has(gate) : true;
            const x = cell.col + 0.055;
            const y = cell.row + 0.055;
            const cx = cell.col + 0.5;
            const cy = cell.row + 0.5;
            const fill = startColor ? startColor.css : gateColor ? '#2b2116' : index % 2 === 0 ? '#e9dfc8' : '#e3d6ba';
            return (
              <g key={`track-${index}`} opacity={!startColor && !gateColor ? 1 : active ? 1 : 0.4}>
                <rect
                  x={x}
                  y={y}
                  width="0.89"
                  height="0.89"
                  rx="0.13"
                  fill={fill}
                  stroke={startColor ? startColor.light : gateColor ? gateColor.css : '#9a7c48'}
                  strokeWidth={startColor || gateColor ? '0.05' : '0.025'}
                  strokeOpacity="0.9"
                />
                {!startColor && !gateColor && (
                  <g transform={`translate(${cx} ${cy}) rotate(${angle})`} opacity="0.28">
                    <path
                      d="M -0.14 -0.14 L 0.14 0 L -0.14 0.14"
                      fill="none"
                      stroke="#7c5d2e"
                      strokeWidth="0.06"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
                {startColor && (
                  <g transform={`translate(${cx} ${cy}) rotate(${angle})`} opacity="0.9">
                    <path
                      d="M -0.16 -0.15 L 0.08 0 L -0.16 0.15"
                      fill="none"
                      stroke={darkInk(start)}
                      strokeWidth="0.07"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="-0.24" cy="0" r="0.07" fill={darkInk(start)} />
                  </g>
                )}
                {gateColor && (
                  <g transform={`translate(${cx} ${cy})`} opacity="0.95">
                    <path
                      d="M -0.17 0.17 L -0.17 -0.02 A 0.17 0.17 0 0 1 0.17 -0.02 L 0.17 0.17"
                      fill="none"
                      stroke={gateColor.light}
                      strokeWidth="0.055"
                      strokeLinecap="round"
                    />
                    <path d="M 0 0.17 L 0 -0.08" stroke={gateColor.light} strokeWidth="0.04" strokeLinecap="round" opacity="0.7" />
                  </g>
                )}
              </g>
            );
          })}

          {/* Central medallion. */}
          <g>
            <rect x="5.06" y="5.06" width="2.88" height="2.88" rx="0.46" fill="#0d0a06" stroke="#8a6a2f" strokeWidth="0.06" opacity="0.98" />
            <circle cx="6.5" cy="6.5" r="1.25" fill="url(#horse-medallion)" />
            <path
              d="M 5.83 7.08 A 0.95 0.95 0 1 1 7.17 7.08"
              fill="none"
              stroke="#d4a843"
              strokeWidth="0.2"
              strokeLinecap="round"
            />
            <circle cx="5.83" cy="7.08" r="0.14" fill="#d4a843" />
            <circle cx="7.17" cy="7.08" r="0.14" fill="#d4a843" />
            {[
              [5.95, 6.56],
              [5.72, 6.12],
              [5.85, 5.66],
              [6.5, 5.44],
              [7.15, 5.66],
              [7.28, 6.12],
              [7.05, 6.56]
            ].map(([cx, cy], index) => (
              <circle key={index} cx={cx} cy={cy} r="0.032" fill="#3b2b12" />
            ))}
            <text x="6.5" y="7.78" textAnchor="middle" fontSize="0.21" fontWeight="800" letterSpacing="0.055" fill="#b08c48">
              CỜ CÁ NGỰA
            </text>
            {COLOR_ORDER.map((id, index) => {
              const positions = [
                [5.23, 5.23],
                [7.77, 5.23],
                [7.77, 7.77],
                [5.23, 7.77]
              ];
              const [cx, cy] = positions[index];
              return <circle key={id} cx={cx} cy={cy} r="0.085" fill={COLORS[id].css} opacity={activeColors.has(id) ? 0.95 : 0.3} />;
            })}
          </g>
        </svg>

        {/* Destination markers for the current selection. */}
        {targets.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => onMove(entry.index)}
            className={`absolute z-40 flex h-[7.6%] w-[7.6%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[clamp(9px,1.5cqw,15px)] font-black shadow-[0_0_18px_rgba(0,0,0,0.8)] transition hover:scale-125 ${
              entry.captures > 0
                ? 'border-rose-100 bg-rose-600/95 text-white'
                : entry.target.status === 'HOME'
                  ? 'border-amber-100 bg-amber-500/95 text-stone-950'
                  : 'border-emerald-100 bg-emerald-500/95 text-stone-950'
            } animate-pulse`}
            style={{ left: pct(entry.point.col), top: pct(entry.point.row) }}
            aria-label={
              entry.captures > 0
                ? `Đi tới và đá ${entry.captures} quân đối thủ`
                : entry.target.status === 'HOME'
                  ? `Vào chuồng bậc ${entry.target.pos}`
                  : `Đi tới ô đích`
            }
            title={entry.count > 1 ? `${entry.count} quân có thể tới ô này` : undefined}
          >
            {entry.captures > 0 ? '⚔' : entry.target.status === 'HOME' ? '⌂' : '•'}
            {entry.count > 1 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-stone-950 px-0.5 text-[8px] text-amber-200 ring-1 ring-amber-500/70">
                {entry.count}
              </span>
            )}
          </button>
        ))}

        {/* 3D-rendered horse tokens. */}
        {tokens.map(({ player, horse, horseIndex, x, y, scale, stacked }) => {
          const color = COLORS[player.color];
          const movable = movableHorses.has(horse.id);
          const selected = selectedHorse === horse.id;
          const isMyHorse = player.id === myId;
          const image = horseImages[player.color];
          return (
            <button
              key={horse.id}
              type="button"
              onClick={() => handleHorseClick(horse)}
              disabled={!isMyTurn || !movable}
              className={`absolute z-30 aspect-square w-[7%] -translate-x-1/2 -translate-y-1/2 ${
                isMyTurn && movable ? 'cursor-pointer' : 'cursor-default'
              } ${selected ? 'z-50' : ''}`}
              style={{ left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})` }}
              aria-label={`${color.label} · ${player.name} · Ngựa ${horseIndex + 1}${
                horse.status === 'HOME' ? ` · bậc ${horse.pos}` : horse.status === 'TRACK' ? ' · trên đường đua' : ' · trong chuồng'
              }${movable ? ' · có thể đi' : ''}`}
              title={`Ngựa ${horseIndex + 1}${horse.status === 'HOME' ? ` · bậc ${horse.pos}` : ' · ' + color.label}`}
            >
              <span
                className="absolute inset-[8%] rounded-full opacity-80 blur-[2px]"
                style={{ background: `radial-gradient(circle at 50% 60%, ${color.css}aa, transparent 68%)` }}
              />
              {image ? (
                <img
                  src={image}
                  alt=""
                  draggable={false}
                  className="relative h-full w-full select-none object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.85)]"
                />
              ) : (
                <span className="relative flex h-full w-full items-center justify-center text-[clamp(14px,2.5cqw,26px)]">🐴</span>
              )}
              <span
                className="absolute bottom-0 left-1/2 flex h-[26%] min-h-3 -translate-x-1/2 items-center justify-center rounded-full border px-1 text-[clamp(6px,0.8cqw,9px)] font-black shadow"
                style={{ background: color.dark, borderColor: color.light, color: '#fff' }}
              >
                {horseIndex + 1}
              </span>
              {stacked > 1 && (
                <span className="absolute right-0 top-0 flex h-[30%] min-h-3 min-w-3 items-center justify-center rounded-full bg-stone-950/90 px-0.5 text-[clamp(6px,0.7cqw,9px)] font-black text-amber-300 ring-1 ring-amber-500/60">
                  {stacked}
                </span>
              )}
              {isMyHorse && horse.status === 'HOME' && (
                <span className="absolute left-0 top-0 text-[clamp(7px,1cqw,11px)]">⭐</span>
              )}
              {isSatNut(room, player, horse) && (
                <span
                  className="absolute right-0 top-[38%] rounded-full bg-stone-950/90 px-1 text-[clamp(6px,0.75cqw,9px)] font-black text-amber-300 ring-1 ring-amber-500/70"
                  title="Sát nút: quân đối thủ đứng ngay ô trước mặt"
                >
                  SÁT
                </span>
              )}
              {movable && (
                <span
                  className={`pointer-events-none absolute inset-0 rounded-full ring-2 ${
                    selected ? 'ring-4 ring-amber-300' : 'animate-pulse ring-amber-300/90'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
