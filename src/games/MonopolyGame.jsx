import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BOARD_TILES, CLASSES, EVENTS } from '../data/monopolyData';
import { PawnSVG, Piece3D, Dice3D, TokenGalleryModal } from '../components/Monopoly/Models3D';
import RPGModal from '../components/Monopoly/RPGModal';

const BACKEND_URL = "https://tien-len-backend.onrender.com"; 
const socket = io(BACKEND_URL);

const getPosPercent = (pos) => {
  const step = 9.09; 
  if (pos <= 10) return { bottom: 0, right: `${pos * step}%` };
  if (pos <= 20) return { bottom: `${(pos - 10) * step}%`, left: 0 };
  if (pos <= 30) return { top: 0, left: `${(pos - 20) * step}%` };
  return { top: `${(pos - 30) * step}%`, right: 0 };
};

export default function MonopolyGame() {
  const [isJoined, setIsJoined] = useState(false);
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyRoomId, setLobbyRoomId] = useState('DND_1');
  const [lobbyClass, setLobbyClass] = useState('fighter');
  
  const [room, setRoom] = useState(null);
  const [modal, setModal] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollD6, setRollD6] = useState(6);
  const [rollD20, setRollD20] = useState(20);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    socket.on('monopoly_updated', (data) => {
      setRoom(data);
      setIsJoined(true);
    });
    socket.on('error_msg', (msg) => alert(msg));
    return () => {
      socket.off('monopoly_updated');
      socket.off('error_msg');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!lobbyName.trim()) return alert("Nhập tên đi dũng sĩ!");
    if (!lobbyRoomId.trim()) return alert("Nhập mã phòng!");
    
    socket.emit('monopoly_join', { 
      roomId: lobbyRoomId, 
      playerName: lobbyName, 
      classId: lobbyClass 
    });
  };

  const handleStartGame = () => {
    if (room.players[0].id !== socket.id) return alert("Chỉ chủ phòng (người vào đầu tiên) mới có thể bắt đầu!");
    socket.emit('monopoly_action', { 
      roomId: room.id, 
      roomState: { ...room, status: 'PLAYING' } 
    });
  };

  // ----------------------------------------------------
  // 1. MÀN HÌNH LOBBY CHỜ
  // ----------------------------------------------------
  if (!isJoined || !room) {
    const selectedClassData = CLASSES.find(c => c.id === lobbyClass) || CLASSES[0];
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 to-black p-4 text-white">
        <form onSubmit={handleJoin} className="bg-stone-900 border-2 border-amber-900 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-amber-500 drop-shadow-md">Tạo Nhân Vật D&D</h1>
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-600/50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <span>🏛️</span> Xem Model 3D
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-stone-300 font-bold mb-2 block text-sm">Tên hiển thị:</label>
              <input 
                type="text" value={lobbyName} onChange={e => setLobbyName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-white px-4 py-2 rounded focus:outline-none focus:border-amber-500"
                placeholder="Tài Anh..."
              />
            </div>
            <div>
              <label className="text-stone-300 font-bold mb-2 block text-sm">Mã Phòng:</label>
              <input 
                type="text" value={lobbyRoomId} onChange={e => setLobbyRoomId(e.target.value.toUpperCase())}
                className="w-full bg-stone-950 border border-stone-700 text-amber-400 font-bold px-4 py-2 rounded focus:outline-none focus:border-amber-500"
                placeholder="DND_1"
              />
            </div>
          </div>

          {/* 3D Preview of Selected Class */}
          <div className="mb-4 bg-stone-950/70 border border-stone-800 rounded-xl p-3 flex items-center justify-between shadow-inner">
            <div className="w-20 h-20 flex items-center justify-center">
              <Piece3D classId={lobbyClass} hexColor={selectedClassData.hex} size={76} animated={true} interactive={true} isCurrentTurn={true} />
            </div>
            <div className="flex-1 pl-4">
              <div className="text-amber-400 font-bold text-sm flex items-center gap-2">
                <span>{selectedClassData.icon}</span> {selectedClassData.name} (Model 3D)
              </div>
              <p className="text-stone-400 text-xs mt-1">Quân cờ 3D procedural đại diện cho nhân vật trên bàn cờ Monopoly.</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-stone-300 font-bold mb-2 block text-sm">Chọn Class Nhân Vật:</label>
            <div className="grid grid-cols-5 gap-2">
              {CLASSES.map(c => (
                <div 
                  key={c.id} onClick={() => setLobbyClass(c.id)}
                  className={`cursor-pointer border-2 rounded-lg flex flex-col items-center p-2 transition-all ${lobbyClass === c.id ? 'border-amber-500 bg-amber-900/40 scale-105 shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'border-stone-700 hover:border-stone-500 bg-stone-800'}`}
                >
                  <span className="text-xl mb-1">{c.icon}</span>
                  <span className="text-[10px] text-stone-300 font-bold truncate w-full text-center">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded-lg text-lg shadow-[0_0_15px_rgba(180,83,9,0.5)] transition">
            Tham Gia Vương Quốc
          </button>
        </form>

        <TokenGalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. MÀN HÌNH BÀN CỜ
  // ----------------------------------------------------
  const me = room.players.find(p => p.id === socket.id);
  const isMyTurn = room.players[room.currentTurn]?.id === socket.id;

  const handleRoll = () => {
    if (!isMyTurn || isRolling) return;
    setIsRolling(true);
    
    setTimeout(() => {
      setIsRolling(false);
      const d6Val = Math.floor(Math.random() * 6) + 1;
      const d20Val = Math.floor(Math.random() * 20) + 1;
      setRollD6(d6Val);
      setRollD20(d20Val);

      const move = d6Val + Math.floor(Math.random() * 6) + 1;
      const newPos = (me.position + move) % 40;
      
      const newPlayers = [...room.players];
      newPlayers[room.currentTurn].position = newPos;
      
      socket.emit('monopoly_action', { 
        roomId: room.id, 
        roomState: { ...room, players: newPlayers, logs: [...room.logs, `${me.name} tung xúc xắc được ${move} điểm, tiến đến ${BOARD_TILES[newPos].name}`] } 
      });
      handleLanding(newPos);
    }, 1500);
  };

  const handleLanding = (pos) => {
    const tile = BOARD_TILES[pos];
    
    if (tile.type === 'PROPERTY') {
      setModal({
        title: tile.name, icon: tile.icon, content: `Bạn tìm thấy một mảnh đất trống. Giá mua: ${tile.price} Gold.`,
        actions: [
          { label: `Mua (${tile.price}g)`, primary: true, onClick: () => { setModal(null); nextTurn(); } },
          { label: 'Bỏ qua', onClick: () => { setModal(null); nextTurn(); } }
        ]
      });
    } else if (tile.type === 'EVENT') {
      setModal({
        title: EVENTS[0]?.title || "Sự kiện", icon: '📜', content: EVENTS[0]?.desc || "Có điều gì đó xảy ra...",
        actions: [
          { label: `Trả ${EVENTS[0]?.safeCost || 50}g an toàn`, onClick: () => { setModal(null); nextTurn(); } },
          { label: 'Tung D20 thử vận may', primary: true, onClick: () => { setModal(null); nextTurn(); } }
        ]
      });
    } else {
      setTimeout(nextTurn, 1000);
    }
  };

  const nextTurn = () => {
    socket.emit('monopoly_action', { 
      roomId: room.id, 
      roomState: { ...room, currentTurn: (room.currentTurn + 1) % room.players.length } 
    });
  };

  return (
    <div className="flex w-full h-full bg-black font-sans text-white">
      <div className="flex-1 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 to-black p-2 md:p-4 relative h-full">
        
        {/* Nút Xem Mô Hình 3D Trong Trận */}
        <div className="absolute top-4 right-4 z-40 hidden sm:block">
          <button
            onClick={() => setGalleryOpen(true)}
            className="bg-stone-900/90 hover:bg-stone-800 text-amber-400 border border-amber-600/60 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xl backdrop-blur-sm"
          >
            <span>🏛️</span> Bộ Sưu Tập Quân Cờ 3D
          </button>
        </div>

        <div className="relative w-full max-w-[800px] max-h-[85vh] aspect-square bg-stone-900 border-[8px] md:border-[12px] border-double border-amber-900 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden my-auto mx-auto">
          
          {BOARD_TILES.map((tile, i) => (
            <div key={i} style={getPosPercent(i)} className={`absolute w-[9.09%] h-[9.09%] border border-stone-800 flex flex-col items-center justify-center ${tile.bg}`}>
              <span className="text-lg md:text-3xl drop-shadow-lg">{tile.icon}</span>
              <span className="text-[5px] md:text-[8px] font-bold text-stone-200 mt-1 uppercase text-center leading-tight px-0.5">{tile.name}</span>
            </div>
          ))}

          {/* 3D PAWN TOKENS FOR EACH PLAYER */}
          {room.players.map((p, idx) => {
            const posCss = getPosPercent(p.position);
            const classData = CLASSES.find(c => c.id === p.classId);
            return (
              <div 
                key={p.id} 
                style={{ ...posCss, transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }} 
                className="absolute w-[9.09%] h-[9.09%] flex items-center justify-center z-20 pointer-events-none"
              >
                <PawnSVG 
                  classId={p.classId} 
                  hexColor={classData?.hex || 0xb91c1c} 
                  size={50} 
                  isCurrentTurn={room.currentTurn === idx} 
                />
              </div>
            );
          })}

          <div className="absolute inset-[16%] bg-stone-950/85 rounded-xl border border-amber-900/60 flex flex-col items-center justify-center backdrop-blur-md p-4 shadow-inner">
             {room.status === 'WAITING' ? (
               // SẢNH CHỜ
               <div className="text-center">
                 <h2 className="text-3xl font-bold text-amber-500 mb-2">Đang tập hợp Tổ Đội...</h2>
                 <p className="text-stone-300 text-lg mb-6">Mã phòng: <span className="font-mono text-2xl text-white bg-stone-800 px-3 py-1 rounded border border-stone-600">{room.id}</span></p>
                 <p className="text-stone-400 mb-8">Hãy gửi mã phòng này cho bạn bè để cùng tham gia ({room.players.length}/4)</p>
                 
                 {room.players.length >= 2 ? (
                   <button onClick={handleStartGame} className="bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-400 font-bold py-3 px-10 rounded shadow-[0_0_15px_rgba(4,120,87,0.6)] transition text-xl">
                     Bắt Đầu Hành Trình
                   </button>
                 ) : (
                   <div className="text-stone-500 italic animate-pulse">Cần ít nhất 2 người để bắt đầu...</div>
                 )}
               </div>
             ) : (
               // TRONG TRẬN ĐẤU - 3D DICE & ACTIONS
               <>
                 <div className="flex gap-8 md:gap-14 mb-6 items-center">
                    <Dice3D type="D6" isRolling={isRolling} result={rollD6} size={110} theme="ivory" />
                    <Dice3D type="D20" isRolling={isRolling} result={rollD20} size={110} theme="amethyst" />
                 </div>
                 
                 {isMyTurn ? (
                   <button onClick={handleRoll} disabled={isRolling} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-stone-100 border-2 border-amber-400 font-bold py-3 px-6 md:px-10 rounded shadow-[0_0_15px_rgba(217,119,6,0.5)] transition text-base md:text-xl z-50 cursor-pointer">
                     {isRolling ? 'Vận Mệnh Đang Xoay...' : '🎲 Tung Xúc Xắc Di Chuyển'}
                   </button>
                 ) : (
                   <div className="text-amber-500 font-serif text-base md:text-xl animate-pulse text-center">
                     Đang chờ <strong>{room.players[room.currentTurn]?.name}</strong> thao tác...
                   </div>
                 )}
               </>
             )}
          </div>
          
          {modal && <RPGModal {...modal} />}
        </div>

        <TokenGalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
      </div>

      <div className="hidden lg:flex w-80 bg-stone-950 border-l border-stone-800 flex-col h-full z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-5 bg-stone-900 border-b border-amber-900/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-amber-500 font-bold uppercase tracking-widest text-sm">Tổ Đội (Party)</h2>
            <button
              onClick={() => setGalleryOpen(true)}
              className="text-stone-400 hover:text-amber-400 text-xs font-bold transition flex items-center gap-1"
              title="Xem tất cả quân cờ 3D"
            >
              <span>🏛️</span> Models 3D
            </button>
          </div>
          {room.players.map((p, i) => (
            <div key={p.id} className={`p-3 mb-3 rounded-lg border ${room.currentTurn === i && room.status !== 'WAITING' ? 'bg-amber-900/30 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.3)]' : 'bg-stone-800 border-stone-700'} flex justify-between items-center transition-all`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CLASSES.find(c=>c.id===p.classId)?.icon}</span>
                <div>
                  <div className="text-stone-200 font-bold text-sm">{p.name}</div>
                  <div className="text-[10px] text-amber-500">{CLASSES.find(c=>c.id===p.classId)?.name}</div>
                </div>
              </div>
              <span className="text-yellow-400 font-extrabold text-lg">{p.gold}g</span>
            </div>
          ))}
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto text-xs text-stone-400 font-mono leading-relaxed">
          {room.logs?.map((l, i) => (
            <div key={i} className="mb-2 border-b border-stone-800 pb-1">
              <span className="text-amber-600 mr-2">{">"}</span> {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
