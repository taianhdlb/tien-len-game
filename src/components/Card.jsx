import React from 'react';

export default function Card({ card, isSelected, onClick, disabled }) {
  if (!card) return null;

  const isRed = card.suitColor === 'red';

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 bg-white rounded-lg border-2 shadow-md 
        select-none cursor-pointer transition-transform duration-150 flex flex-col justify-between p-1 sm:p-2
        ${isSelected ? '-translate-y-5 border-yellow-400 ring-2 ring-yellow-300' : 'border-gray-300 hover:-translate-y-1'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Góc trên trái */}
      <div className={`text-xs sm:text-sm font-bold leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rankLabel}</div>
        <div>{card.suitSymbol}</div>
      </div>

      {/* Biểu tượng trung tâm */}
      <div className={`text-xl sm:text-2xl md:text-3xl text-center font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.suitSymbol}
      </div>

      {/* Góc dưới phải */}
      <div className={`text-xs sm:text-sm font-bold leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rankLabel}</div>
        <div>{card.suitSymbol}</div>
      </div>
    </div>
  );
}