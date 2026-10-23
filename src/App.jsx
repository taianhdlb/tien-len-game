import React, { useState } from 'react';
import MonopolyGame from './games/MonopolyGame';
import TienLenGame from './games/TienLenGame'; // Đảm bảo file này tồn tại từ mã Tiến Lên cũ

export default function App() {
  const [game, setGame] = useState('MONOPOLY');

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden font-sans">
      {/* Thanh Menu điều hướng */}
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
      
      {/* Hiển thị Game */}
      <div className="flex-1 relative w-full h-full">
        {game === 'MONOPOLY' ? <MonopolyGame /> : <TienLenGame />}
      </div>
    </div>
  );
}