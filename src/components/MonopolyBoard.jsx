import React from 'react';
import { BOARD_TILES, INSTANT_WIN_RELIC_IDS } from '../data/monopolyData';

function getGridPosition(tileId) {
  if (tileId >= 0 && tileId <= 10) return { gridRow: 11, gridColumn: 11 - tileId };
  if (tileId >= 10 && tileId <= 20) return { gridRow: 11 - (tileId - 10), gridColumn: 1 };
  if (tileId >= 20 && tileId <= 30) return { gridRow: 1, gridColumn: tileId - 20 + 1 };
  if (tileId >= 30 && tileId <= 39) return { gridRow: tileId - 30 + 1, gridColumn: 11 };
  return {};
}

export default function MonopolyBoard({ players, properties, children }) {
  return (
    <div className="relative w-full max-w-[850px] aspect-square bg-slate-900 border-4 border-amber-600/60 rounded-2xl p-1 shadow-2xl grid grid-cols-11 grid-rows-11 gap-1">
      {BOARD_TILES.map((tile) => {
        const gridPos = getGridPosition(tile.id);
        const propState = properties[tile.id];
        const isRelic = INSTANT_WIN_RELIC_IDS.includes(tile.id);

        return (
          <div
            key={tile.id}
            style={gridPos}
            className={`
              relative flex flex-col justify-between p-1 rounded border border-slate-700/80 text-[8px] sm:text-[10px] leading-tight select-none overflow-hidden
              ${tile.color} text-white shadow-inner
            `}
          >
            <div className="font-extrabold truncate text-center drop-shadow">
              {tile.name}
            </div>

            {isRelic && (
              <div className="text-center text-[9px] animate-bounce font-bold text-yellow-300">
                👑 Thánh Vật
              </div>
            )}

            {propState && propState.owner !== null && propState.owner !== undefined && (
              <div className="bg-black/70 rounded px-0.5 text-center font-bold text-amber-300 flex justify-between items-center text-[8px]">
                <span>P{propState.owner + 1}</span>
                <span>{propState.level === 2 ? '🏰 Tháp' : propState.level === 1 ? '⛺ Trại' : '🚩 Đất'}</span>
              </div>
            )}

            {tile.price > 0 && (!propState || propState.owner === null) && (
              <div className="text-center text-amber-200 font-semibold opacity-90">
                {tile.price}g
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0.5 flex justify-center items-center gap-0.5 z-10 flex-wrap">
              {players.map((p, pIdx) => {
                if (p.position === tile.id) {
                  return (
                    <span
                      key={p.id}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[9px] shadow-lg animate-pulse"
                      title={`${p.name} (${p.classInfo.name})`}
                    >
                      {p.classInfo.icon}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })}

      <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-slate-950/90 rounded-xl p-3 sm:p-5 flex flex-col justify-between border border-amber-500/30">
        {children}
      </div>
    </div>
  );
}