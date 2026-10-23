import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { sortCards } from '../utils/deck';
import { canBeat } from '../utils/rules';
import Card from '../components/Card';

const BACKEND_URL = "https://tien-len-backend.onrender.com";
const socket = io(BACKEND_URL);

export default function TienLenGame() {
  const [roomId, setRoomId] = useState('PHONG_1');
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    socket.on('room_updated', (data) => setRoomData(data));
    socket.on('game_started', (data) => {
      setRoomData(data);
      setWinner(null);
      setLogs(['Ván mới đã bắt đầu!']);
    });
    socket.on('state_changed', (data) => setRoomData(data));
    socket.on('game_over', ({ winnerName }) => setWinner(winnerName));
    socket.on('error_msg', (msg) => alert(msg));

    return () => {
      socket.off('room_updated');
      socket.off('game_started');
      socket.off('state_changed');
      socket.off('game_over');
      socket.off('error_msg');
    };
  }, []);

  const handleJoin = () => {
    if (!playerName.trim()) return alert('Vui lòng nhập tên của bạn!');
    socket.emit('join_room', { roomId, playerName });
    setIsJoined(true);
  };

  const handleStartGame = (mode) => {
    socket.emit('start_game', { roomId, mode });
  };

  const myIndex = roomData?.players?.findIndex(p => p.id === socket.id);
  const isMyTurn = roomData?.currentTurn === myIndex;
  const myHand = myIndex !== -1 && roomData?.players ? roomData.players[myIndex]?.hand || [] : [];

  const toggleSelectCard = (card) => {
    if (!isMyTurn) return;
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handlePlayCards = () => {
    if (selectedCards.length === 0) return;
    if (!canBeat(selectedCards, roomData.lastPlayed, roomData.mode)) {
      alert('Bài không đúng luật hoặc không đè được bài trên bàn!');
      return;
    }
    socket.emit('play_cards', { roomId, cards: selectedCards });
    setSelectedCards([]);
  };

  const handlePass = () => {
    socket.emit('pass_turn', { roomId });
    setSelectedCards([]);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-emerald-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-emerald-950 p-6 rounded-2xl border border-emerald-700 w-full max-w-md shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 text-center text-amber-400">Tiến Lên Co-op Online</h1>
          <label className="text-xs text-gray-300 mb-1 block">Tên hiển thị:</label>
          <input
            type="text"
            placeholder="Nhập tên..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-3 rounded-lg bg-emerald-900 border border-emerald-700 mb-4 text-white focus:outline-none focus:border-amber-400"
          />
          <label className="text-xs text-gray-300 mb-1 block">Mã phòng chơi:</label>
          <input
            type="text"
            placeholder="Mã phòng (VD: PHONG_1)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 rounded-lg bg-emerald-900 border border-emerald-700 mb-6 text-white focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={handleJoin}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-lg shadow-lg transition"
          >
            Vào Phòng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-900 text-white flex flex-col justify-between p-2 sm:p-4 font-sans select-none">
      <div className="flex justify-between items-center bg-emerald-950 p-3 rounded-xl border border-emerald-700">
        <div>
          <span className="font-bold text-amber-400">Mã phòng: {roomId}</span>
          <span className="text-xs text-gray-400 ml-3">({roomData?.players?.length || 0}/4 người)</span>
        </div>

        {roomData?.status === 'WAITING' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleStartGame('TLMN')}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              Chia bài Miền Nam
            </button>
            <button
              onClick={() => handleStartGame('TLMB')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              Chia bài Miền Bắc
            </button>
          </div>
        )}
      </div>

      <div className="relative my-4 flex-1 bg-emerald-800 rounded-3xl border-4 border-emerald-950 p-4 flex flex-col justify-between shadow-2xl overflow-hidden min-h-[350px]">
        <div className="flex justify-around items-center w-full">
          {roomData?.players?.map((p, idx) => (
            <div
              key={p.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center ${
                roomData?.currentTurn === idx ? 'bg-yellow-400 text-black animate-pulse' : 'bg-black/40 text-white'
              }`}
            >
              <span>{p.name} {idx === myIndex && '(Bạn)'}</span>
              <span className="text-[10px] opacity-80">{p.hand?.length || 0} lá</span>
              {roomData?.passedPlayers?.[idx] && <span className="text-red-400 font-extrabold text-[10px]">Đã bỏ lượt</span>}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center bg-emerald-950/40 p-4 rounded-2xl border border-emerald-600/30 self-center w-full max-w-xs my-auto">
          <span className="text-xs text-emerald-300 mb-2">Bài vừa đánh</span>
          <div className="flex -space-x-4">
            {roomData?.lastPlayed?.cards ? (
              roomData.lastPlayed.cards.map((card) => (
                <Card key={card.id} card={card} disabled />
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">Bàn trống</span>
            )}
          </div>
          {roomData?.lastPlayed && (
            <span className="text-[11px] text-amber-300 mt-2">Bởi: {roomData.lastPlayed.playerName}</span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 z-20">
          <button
            onClick={() => setShowLog(!showLog)}
            className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg border border-emerald-600/50"
          >
            📜 {showLog ? 'Đóng nhật ký' : 'Nhật ký'}
          </button>
          {showLog && (
            <div className="absolute bottom-10 left-0 w-60 max-h-40 overflow-y-auto bg-black/90 p-3 rounded-xl text-xs border border-emerald-500/40">
              {logs.map((log, i) => (
                <div key={i} className="text-gray-200 text-[11px]">{log}</div>
              ))}
            </div>
          )}
        </div>

        {winner && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
            <h1 className="text-2xl font-bold text-yellow-400 mb-4">🎉 {winner} ĐÃ THẮNG CỘC! 🎉</h1>
          </div>
        )}
      </div>

      <div className="bg-emerald-950 p-3 rounded-2xl border border-emerald-800">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs font-bold ${isMyTurn ? 'text-yellow-400' : 'text-gray-400'}`}>
            {isMyTurn ? '👉 Đến lượt bạn đánh!' : 'Đang chờ người khác...'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCards(sortCards(selectedCards))}
              className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold"
            >
              Xếp bài
            </button>
            <button
              onClick={handlePass}
              disabled={!isMyTurn || !roomData?.lastPlayed}
              className="bg-gray-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg font-bold"
            >
              Bỏ lượt
            </button>
            <button
              onClick={handlePlayCards}
              disabled={!isMyTurn || selectedCards.length === 0}
              className="bg-amber-500 disabled:opacity-40 text-black text-xs px-4 py-1.5 rounded-lg font-extrabold"
            >
              Đánh bài
            </button>
          </div>
        </div>

        <div className="flex justify-center -space-x-5 sm:-space-x-8 overflow-x-auto py-3">
          {myHand.map((card) => (
            <Card
              key={card.id}
              card={card}
              isSelected={selectedCards.some(c => c.id === card.id)}
              onClick={() => toggleSelectCard(card)}
              disabled={!isMyTurn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}