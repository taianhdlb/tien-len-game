import React from 'react';

export default function RPGModal({ title, content, actions, icon }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="bg-stone-900 border-double border-8 border-amber-800 p-6 rounded-xl w-[400px] shadow-2xl text-stone-200 font-serif transform transition-all scale-105">
        <div className="text-center text-4xl mb-2 drop-shadow-md">{icon}</div>
        <h2 className="text-2xl font-bold text-amber-400 text-center border-b border-amber-900 pb-2 mb-4">{title}</h2>
        <div className="text-sm mb-6 text-center leading-relaxed">{content}</div>
        <div className="flex gap-3 justify-center">
          {actions.map((btn, idx) => (
            <button key={idx} onClick={btn.onClick} className={`px-4 py-2 rounded font-bold border-2 transition hover:scale-105 ${btn.primary ? 'bg-amber-700 border-amber-500 text-white' : 'bg-stone-800 border-stone-600 text-stone-300'}`}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}