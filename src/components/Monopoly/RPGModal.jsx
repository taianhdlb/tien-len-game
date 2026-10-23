import React, { useState } from 'react';
import { Dice3D } from './Models3D';
import { FantasyIcon } from './FantasyIcons';

// ============================================================================
// BALDUR'S GATE 3 ENCOUNTER & DIALOGUE CARD
// Does NOT darken or blur the entire screen; renders cleanly over center console
// ============================================================================

export default function RPGModal({
  title,
  speaker = "Người Dẫn Chuyện",
  content,
  icon = "📜",
  iconKey = "event",
  dc = null,
  onRollD20 = null,
  actions = [],
  onClose
}) {
  const [isRollingD20, setIsRollingD20] = useState(false);
  const [d20RollResult, setD20RollResult] = useState(null);
  const [rollOutcome, setRollOutcome] = useState(null); // 'SUCCESS' | 'FAIL' | 'CRIT_SUCCESS' | 'CRIT_FAIL'

  const handlePerformD20Roll = () => {
    if (isRollingD20 || !dc) return;
    setIsRollingD20(true);
    setD20RollResult(null);
    setRollOutcome(null);

    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 20) + 1;
      setD20RollResult(rolled);
      setIsRollingD20(false);

      let outcome = 'FAIL';
      if (rolled === 20) outcome = 'CRIT_SUCCESS';
      else if (rolled === 1) outcome = 'CRIT_FAIL';
      else if (rolled >= dc) outcome = 'SUCCESS';

      setRollOutcome(outcome);
      if (onRollD20) onRollD20(rolled, outcome);
    }, 1200);
  };

  return (
    <div className="absolute inset-x-2 md:inset-x-8 bottom-3 md:bottom-8 z-40 flex items-center justify-center pointer-events-auto">
      <div className="w-full max-w-xl bg-gradient-to-b from-stone-900/98 to-stone-950/98 border-2 border-amber-600/80 rounded-xl p-3 sm:p-5 shadow-[0_15px_50px_rgba(0,0,0,0.95)] backdrop-blur-md relative font-sans text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Filigree Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-amber-900/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-sm shadow">
              <FantasyIcon name={iconKey} className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest">{speaker}</div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 drop-shadow truncate">{title}</h3>
            </div>
          </div>

          {dc && (
            <div className="flex items-center gap-1.5 bg-stone-900 px-2.5 py-1 rounded-full border border-purple-500/50 shadow">
              <span className="text-[10px] text-purple-300 font-bold uppercase">Độ Khó (DC):</span>
              <span className="text-xs sm:text-sm font-black text-purple-400">{dc}</span>
            </div>
          )}
        </div>

        {/* Narrative Dialogue Body */}
        <div className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif italic mb-3 sm:mb-4 bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
          "{content}"
        </div>

        {/* Interactive D20 Roll Stage (If Encounter has DC Check) */}
        {dc && (
          <div className="flex items-center justify-around bg-stone-900/90 rounded-lg p-2 sm:p-3 mb-3 border border-amber-900/40">
            <div className="flex flex-col items-center">
              <Dice3D type="D20" isRolling={isRollingD20} result={d20RollResult || 20} size={75} theme="amethyst" />
              <span className="text-[10px] text-stone-400 mt-1 font-bold">Xúc Xắc Định Mệnh D20</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              {!d20RollResult && !isRollingD20 ? (
                <button
                  type="button"
                  onClick={handlePerformD20Roll}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-lg border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition hover:scale-105"
                >
                  🎲 Tung D20 Kiểm Định DC {dc}
                </button>
              ) : isRollingD20 ? (
                <div className="text-purple-400 font-bold text-xs sm:text-sm animate-pulse">
                  Vận mệnh đang xoay vần...
                </div>
              ) : (
                <div className="text-center">
                  <div className={`text-base sm:text-lg font-black tracking-wider ${
                    rollOutcome === 'CRIT_SUCCESS' ? 'text-yellow-300 animate-bounce' :
                    rollOutcome === 'SUCCESS' ? 'text-emerald-400' :
                    rollOutcome === 'CRIT_FAIL' ? 'text-rose-500 animate-pulse' : 'text-red-400'
                  }`}>
                    {rollOutcome === 'CRIT_SUCCESS' ? '👑 ĐÒN CHÍ MẠNG (NAT 20)!' :
                     rollOutcome === 'SUCCESS' ? `🎉 THÀNH CÔNG (${d20RollResult} >= ${dc})!` :
                     rollOutcome === 'CRIT_FAIL' ? '💀 THẢM HỌA (NAT 1)!' : `💥 THẤT BẠI (${d20RollResult} < ${dc})!`}
                  </div>
                  <div className="text-[11px] text-stone-300 mt-0.5">
                    {rollOutcome === 'SUCCESS' || rollOutcome === 'CRIT_SUCCESS' ? 'Vượt qua thử thách ngoạn mục!' : 'Chấp nhận hậu quả định mệnh.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Choice Buttons */}
        <div className="flex gap-2 sm:gap-3 justify-end flex-wrap">
          {actions.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm border transition shadow flex items-center gap-1.5 ${
                btn.primary
                  ? 'bg-amber-700 hover:bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_rgba(217,119,6,0.5)]'
                  : btn.danger
                  ? 'bg-rose-900 hover:bg-rose-800 text-rose-200 border-rose-600'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-600'
              } disabled:opacity-50`}
            >
              {btn.icon && <span>{btn.icon}</span>}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
