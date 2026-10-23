import React, { useState } from 'react';
import MonopolyGame from './games/MonopolyGame';
import TienLenGame from './games/TienLenGame';

export default function App() {
  const [game, setGame] = useState('MONOPOLY');

  return (
    // Sửa ở đây: Dùng min-h-screen và bỏ overflow-hidden để có thể cuộn trang
    <div className="min-h-screen flex flex-col bg-black overflow-x-hidden font-sans">
      <div className="bg-stone-950 border-b-2 border-amber-900/60 p-3 flex gap-4 z-50 relative shadow-md">
        <button 
          onClick={() => setGame('MONOPOLY')} 
          className={`font-bold px-5 py-2 rounded-lg transition-all ${game === 'MONOPOLY' ? 'bg-amber-700 text-stone-100 shadow-[0_0_10px_rgba(180,83,9,0.6)]' : 'bg-stone-900 text-stone-400 hover:text-amber-500'}`}
        >
          🏰 Cờ Tỷ Phú D&D
        </button>
        <button 
          onClick={() => setGame('TIEN_LEN')} 
          className={`font-bold px-5 py-2 rounded-lg transition-all ${game === 'TIEN_LEN' ? 'bg-amber-700 text-stone-100 shadow-[0_0_10px_rgba(180,83,9,0.6)]' : 'bg-stone-900 text-stone-400 hover:text-amber-500'}`}
        >
          🃏 Tiến Lên Online
        </button>
      </div>
      
      <div className="flex-1 relative w-full h-full">
        {game === 'MONOPOLY' ? <MonopolyGame /> : <TienLenGame />}
      </div>
    </div>
  );
}