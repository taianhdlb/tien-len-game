import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BOARD_TILES, CLASSES, EVENTS } from '../data/monopolyData';
import { Pawn3D, Dice3D } from '../components/Monopoly/Models3D';
import RPGModal from '../components/Monopoly/RPGModal';

const BACKEND_URL = "https://tien-len-backend.onrender.com";
const socket = io(BACKEND_URL);

// Hàm tính tọa độ % để quân cờ di chuyển mượt mà trên khung viền
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
  const [lobbyClass, setLobbyClass] = useState('fighter');
  
  const [room, setRoom] = useState(null);
  const [modal, setModal] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    // SỬA Ở ĐÂY: Khớp với sự kiện monopoly_room_updated của Backend
    socket.on('monopoly_room_updated', (data) => {
      setRoom(data);
      setIsJoined(true);
    });
    
    socket.on('error_msg', (msg) => alert(msg));
    
    return () => {
      socket.off('monopoly_room_updated');
      socket.off('error_msg');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!lobbyName.trim()) return alert("Nhập tên đi dũng sĩ!");
    
    // SỬA Ở ĐÂY: Khớp với sự kiện monopoly_join_room của Backend
    socket.emit('monopoly_join', { 
      roomId: 'DND_MAIN', 
      playerName: lobbyName, 
      classId: lobbyClass 
    });
  };

  // ----------------------------------------------------
  // 1. MÀN HÌNH LOBBY (Sẽ hiển thị ngay lập tức)
  // ----------------------------------------------------
  if (!isJoined || !room) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 to-black p-4 text-white">
        <form onSubmit={handleJoin} className="bg-stone-900 border-2 border-amber-900 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-amber-500 text-center mb-6 drop-shadow-md">Tạo Nhân Vật D&D</h1>
          <div className="mb-4">
            <label className="text-stone-300 font-bold mb-2 block text-sm">Tên hiển thị:</label>
            <input 
              type="text" value={lobbyName} onChange={e => setLobbyName(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-amber-500"
              placeholder="Ví dụ: Tài Anh..."
            />
          </div>
          <div className="mb-8">
            <label className="text-stone-300 font-bold mb-2 block text-sm">Chọn Class (Model 3D):</label>
            <div className="grid grid-cols-4 gap-2">
              {CLASSES.map(c => (
                <div 
                  key={c.id} onClick={() => setLobbyClass(c.id)}
                  className={`cursor-pointer border-2 rounded-lg flex flex-col items-center p-2 transition-all ${lobbyClass === c.id ? 'border-amber-500 bg-amber-900/40 scale-105 shadow-[0_0_10px_rgba(217,119,6,0.5)]' : 'border-stone-700 hover:border-stone-500 bg-stone-800'}`}
                >
                  <span className="text-2xl mb-1">{c.icon}</span>
                  <span className="text-[10px] text-stone-300 font-bold">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3.5 rounded-lg text-lg shadow-[0_0_15px_rgba(180,83,9,0.5)] transition">
            Tham Gia Vương Quốc
          </button>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. MÀN HÌNH CHƠI GAME CHÍNH (Sau khi đã join)
  // ----------------------------------------------------
  const me = room.players.find(p => p.id === socket.id);
  const isMyTurn = room.players[room.currentTurn]?.id === socket.id;

  const handleRoll = () => {
    if (!isMyTurn) return;
    setIsRolling(true);
    
    setTimeout(() => {
      setIsRolling(false);
      const move = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
      const newPos = (me.position + move) % 40;
      
      const newPlayers = [...room.players];
      newPlayers[room.currentTurn].position = newPos;
      
      // SỬA Ở ĐÂY: Truyền biến updatedRoomState cho khớp Backend
      socket.emit('monopoly_action', { 
        roomId: room.id, 
        updatedRoomState: { ...room, players: newPlayers } 
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
        title: EVENTS[0].title, icon: '📜', content: EVENTS[0].desc,
        actions: [
          { label: `Trả ${EVENTS[0].safeCost}g an toàn`, onClick: () => { setModal(null); nextTurn(); } },
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
      updatedRoomState: { ...room, currentTurn: (room.currentTurn + 1) % room.players.length } 
    });
  };

  return (
    <div className="flex w-full h-full bg-black font-sans text-white">
      <div className="flex-1 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 to-black p-2 md:p-4 relative h-full">
        <div className="relative w-[95vmin] max-w-[800px] aspect-square bg-stone-900 border-[8px] md:border-[12px] border-double border-amber-900 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden">
          
          {BOARD_TILES.map((tile, i) => (
            <div key={i} style={getPosPercent(i)} className={`absolute w-[9.09%] h-[9.09%] border border-stone-800 flex flex-col items-center justify-center ${tile.bg}`}>
              <span className="text-lg md:text-3xl drop-shadow-lg">{tile.icon}</span>
              <span className="text-[5px] md:text-[8px] font-bold text-stone-200 mt-1 uppercase text-center leading-tight px-0.5">{tile.name}</span>
            </div>
          ))}

          {room.players.map(p => {
            const posCss = getPosPercent(p.position);
            const classData = CLASSES.find(c => c.id === p.classId);
            return (
              <div key={p.id} style={{ ...posCss, transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }} className="absolute w-[9.09%] h-[9.09%] flex items-center justify-center z-20 pointer-events-none">
                <Pawn3D hexColor={classData?.hex || 0xb91c1c} size={45} />
              </div>
            );
          })}

          <div className="absolute inset-[16%] bg-stone-950/85 rounded-xl border border-amber-900/60 flex flex-col items-center justify-center backdrop-blur-md p-4 shadow-inner">
             <div className="flex gap-4 md:gap-8 mb-6">
                <Dice3D type="D6" isRolling={isRolling} />
                <Dice3D type="D20" isRolling={isRolling} />
             </div>
             
             {isMyTurn ? (
               <button onClick={handleRoll} disabled={isRolling} className="bg-amber-700 hover:bg-amber-600 text-stone-100 border-2 border-amber-400 font-bold py-3 px-6 md:px-10 rounded shadow-[0_0_15px_rgba(217,119,6,0.5)] transition text-base md:text-xl z-50">
                 {isRolling ? 'Đang tung...' : 'Tung Xúc Xắc Di Chuyển'}
               </button>
             ) : (
               <div className="text-amber-500 font-serif text-base md:text-xl animate-pulse text-center">
                 Đang chờ <strong>{room.players[room.currentTurn]?.name}</strong> thực hiện nước đi...
               </div>
             )}
          </div>
          
          {modal && <RPGModal {...modal} />}
        </div>
      </div>

      <div className="hidden lg:flex w-80 bg-stone-950 border-l border-stone-800 flex-col h-full z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
        <div className="p-5 bg-stone-900 border-b border-amber-900/50">
          <h2 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4">Tổ Đội (Party)</h2>
          {room.players.map((p, i) => (
            <div key={p.id} className={`p-3 mb-3 rounded-lg border ${room.currentTurn === i ? 'bg-amber-900/30 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.3)]' : 'bg-stone-800 border-stone-700'} flex justify-between items-center transition-all`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CLASSES.find(c=>c.id===p.classId)?.icon}</span>
                <span className="text-stone-200 font-bold">{p.name}</span>
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