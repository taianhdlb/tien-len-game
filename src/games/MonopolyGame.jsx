import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BOARD_TILES, CLASSES, EVENTS, BLESSINGS, INSTANT_WIN_RELIC_IDS } from '../data/monopolyData';
import { PawnSVG, Piece3D, Dice3D, TokenGalleryModal, Building3D } from '../components/Monopoly/Models3D';
import { FantasyIcon } from '../components/Monopoly/FantasyIcons';
import RPGModal from '../components/Monopoly/RPGModal';

const BACKEND_URL = "https://tien-len-backend.onrender.com";
const socket = io(BACKEND_URL);

// Tính toán tọa độ ô cờ trong lưới CSS Grid 11x11 (Chuẩn 100% theo chiều kim đồng hồ)
export function getTileGridArea(pos) {
  if (pos >= 0 && pos <= 10) {
    return { row: 11, col: 11 - pos, edge: 'bottom' }; // Hàng dưới: từ phải (cột 11) sang trái (cột 1)
  }
  if (pos >= 11 && pos <= 20) {
    return { row: 11 - (pos - 10), col: 1, edge: 'left' }; // Cột trái: từ dưới (hàng 11) lên trên (hàng 1)
  }
  if (pos >= 21 && pos <= 30) {
    return { row: 1, col: pos - 20 + 1, edge: 'top' }; // Hàng trên: từ trái (cột 1) sang phải (cột 11)
  }
  if (pos >= 31 && pos <= 39) {
    return { row: pos - 30 + 1, col: 11, edge: 'right' }; // Cột phải: từ trên (hàng 1) xuống dưới (hàng 10)
  }
  return { row: 11, col: 11, edge: 'bottom' };
}

// Bảng màu nhóm đất chuẩn Monopoly D&D
const GROUP_COLORS = {
  brown: '#78350f',
  sky: '#0284c7',
  green: '#15803d',
  purple: '#7e22ce',
  orange: '#ea580c',
  blue: '#2563eb',
  red: '#dc2626',
  yellow: '#ca8a04'
};

export default function MonopolyGame() {
  const [isJoined, setIsJoined] = useState(false);
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyRoomId, setLobbyRoomId] = useState('DND_1');
  const [lobbyClass, setLobbyClass] = useState('fighter');

  const [room, setRoom] = useState(null);
  const [modal, setModal] = useState(null);
  const [inspectedTile, setInspectedTile] = useState(null);

  // Xúc xắc D6 chỉ dùng để Di chuyển
  const [isRollingD6, setIsRollingD6] = useState(false);
  const [d6Val1, setD6Val1] = useState(3);
  const [d6Val2, setD6Val2] = useState(4);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('BOARD'); // 'BOARD' | 'PARTY' | 'LOGS'
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detector
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (!lobbyName.trim()) return alert("Hãy nhập danh tính của bạn, dũng sĩ!");
    if (!lobbyRoomId.trim()) return alert("Hãy nhập mã phòng!");

    socket.emit('monopoly_join', {
      roomId: lobbyRoomId,
      playerName: lobbyName.trim(),
      classId: lobbyClass
    });
  };

  const handleStartGame = () => {
    if (room.players[0].id !== socket.id) return alert("Chỉ chủ phòng mới có thể bắt đầu!");
    const initialProps = room.properties || {};
    socket.emit('monopoly_action', {
      roomId: room.id,
      roomState: { ...room, status: 'PLAYING', properties: initialProps }
    });
  };

  const me = room?.players?.find((p) => p.id === socket.id);
  const isMyTurn = room?.status === 'PLAYING' && room?.players[room?.currentTurn]?.id === socket.id;

  // Hàm đồng bộ chuyển lượt nguyên tử
  const commitRoomStateAndNextTurn = (updatedRoomState) => {
    const nextIdx = (updatedRoomState.currentTurn + 1) % updatedRoomState.players.length;
    const finalState = {
      ...updatedRoomState,
      currentTurn: nextIdx
    };
    setRoom(finalState);
    socket.emit('monopoly_action', {
      roomId: room.id,
      roomState: finalState
    });
  };

  // ----------------------------------------------------
  // DI CHUYỂN BẰNG XÚC XẮC D6
  // ----------------------------------------------------
  const handleRollMovement = () => {
    if (!isMyTurn || isRollingD6) return;
    setIsRollingD6(true);

    setTimeout(() => {
      const r1 = Math.floor(Math.random() * 6) + 1;
      const r2 = Math.floor(Math.random() * 6) + 1;
      const totalMove = r1 + r2;

      setD6Val1(r1);
      setD6Val2(r2);
      setIsRollingD6(false);

      const oldPos = me.position || 0;
      const newPos = (oldPos + totalMove) % 40;
      const passedGo = oldPos + totalMove >= 40;

      const newPlayers = [...room.players];
      const playerIdx = room.currentTurn;
      newPlayers[playerIdx].position = newPos;

      let logMsg = `${me.name} gieo 2 xúc xắc [${r1} + ${r2} = ${totalMove}] điểm, tiến vào ${BOARD_TILES[newPos].name}`;

      if (passedGo && newPos !== 0) {
        newPlayers[playerIdx].gold += 200;
        logMsg += ` (Đi qua Cổng Khởi Hành nhận +200g)`;
      } else if (newPos === 0) {
        newPlayers[playerIdx].gold += 200;
        logMsg += ` (Vào Cổng Khởi Hành nhận +200g)`;
      }

      const updatedState = {
        ...room,
        players: newPlayers,
        logs: [...(room.logs || []), logMsg]
      };

      setRoom(updatedState);
      socket.emit('monopoly_action', {
        roomId: room.id,
        roomState: updatedState
      });

      handleLanding(newPos, updatedState);
    }, 1200);
  };

  // ----------------------------------------------------
  // XỬ LÝ TƯƠNG TÁC Ô TIẾP ĐẤT
  // ----------------------------------------------------
  const handleLanding = (pos, currentState) => {
    const tile = BOARD_TILES[pos];
    const properties = currentState.properties || {};
    const propData = properties[pos];
    const currentPlayer = currentState.players[currentState.currentTurn];

    // 1. ĐẤT HOẶC THÁNH VẬT (PROPERTY / RELIC)
    if (tile.type === 'PROPERTY' || tile.type === 'RELIC') {
      const isRelic = tile.type === 'RELIC';

      // Chưa ai sở hữu -> Mua
      if (!propData || !propData.ownerId) {
        const canAfford = currentPlayer.gold >= tile.price;
        setModal({
          title: tile.name,
          speaker: isRelic ? "Thánh Vật Cổ Xưa" : "Lãnh Địa Hoang Sơ",
          iconKey: tile.iconKey,
          content: isRelic
            ? `Bạn tìm thấy Thánh Vật [${tile.name}]. Thu thập đủ 3 Thánh Vật sẽ Chiến Thắng Ngay Lập Tức! Giá sở hữu: ${tile.price} Gold.`
            : `Vùng đất trù phú [${tile.name}] chưa có chủ quyền. Bạn có muốn chi ${tile.price} Gold để xác lập lãnh địa và cắm cờ chủ quyền?`,
          actions: [
            {
              label: `Mua Đất (${tile.price}g)`,
              primary: true,
              disabled: !canAfford,
              icon: '🪙',
              onClick: () => {
                const newPlayers = [...currentState.players];
                newPlayers[currentState.currentTurn].gold -= tile.price;
                const newProps = {
                  ...properties,
                  [pos]: { ownerId: currentPlayer.id, level: 0 }
                };

                const ownedRelics = INSTANT_WIN_RELIC_IDS.filter((rId) => newProps[rId]?.ownerId === currentPlayer.id);
                let logs = [...currentState.logs, `${currentPlayer.name} đã mua thành công ${tile.name} (${tile.price}g).`];

                let nextStatus = currentState.status;
                if (ownedRelics.length === 3) {
                  logs.push(`👑 CHIẾN THẮNG TUYỆT ĐỐI! ${currentPlayer.name} ĐÃ THU THẬP ĐỦ 3 THÁNH VẬT!`);
                  nextStatus = 'VICTORY';
                }

                const finalState = {
                  ...currentState,
                  status: nextStatus,
                  players: newPlayers,
                  properties: newProps,
                  logs
                };
                setModal(null);
                commitRoomStateAndNextTurn(finalState);
              }
            },
            {
              label: 'Bỏ Qua',
              onClick: () => {
                setModal(null);
                commitRoomStateAndNextTurn(currentState);
              }
            }
          ]
        });
        return;
      }

      // Đất của đối thủ -> Nộp tiền thuê
      if (propData.ownerId !== currentPlayer.id) {
        const owner = currentState.players.find((p) => p.id === propData.ownerId) || { name: 'Chủ Đất' };
        const tier = propData.level || 0;
        const rentAmount = tile.rents ? tile.rents[tier] : tile.rent;
        const tierNames = ['Đất Khảo Sát 🚩', 'Trại Tiền Đồn ⛺', 'Tháp Canh Đá 🏰', 'Đại Pháo Đài 🏯'];

        setModal({
          title: `Thu Phí Lãnh Địa: ${tile.name}`,
          speaker: `Lính Thuế (${owner.name})`,
          iconKey: 'tax',
          content: `Lãnh địa thuộc quyền của ${owner.name} (Kiến trúc: ${tierNames[tier]}). Bạn phải nộp lệ phí thuê đất là ${rentAmount} Gold!`,
          actions: [
            {
              label: `Nộp ${rentAmount}g và Tiếp Tục`,
              primary: true,
              danger: true,
              icon: '💸',
              onClick: () => {
                const newPlayers = [...currentState.players];
                const myIdx = currentState.currentTurn;
                const ownerIdx = newPlayers.findIndex((p) => p.id === propData.ownerId);

                newPlayers[myIdx].gold -= rentAmount;
                if (ownerIdx !== -1) newPlayers[ownerIdx].gold += rentAmount;

                const logMsg = `${currentPlayer.name} trả ${rentAmount}g tiền thuê ${tile.name} cho ${owner.name}.`;
                const finalState = {
                  ...currentState,
                  players: newPlayers,
                  logs: [...currentState.logs, logMsg]
                };
                setModal(null);
                commitRoomStateAndNextTurn(finalState);
              }
            }
          ]
        });
        return;
      }

      // Đất của chính mình -> Nâng cấp
      if (propData.ownerId === currentPlayer.id) {
        const curLevel = propData.level || 0;
        const upgradeCost = tile.upgradeCost || Math.round(tile.price * 0.6);
        const canUpgrade = curLevel < 3 && currentPlayer.gold >= upgradeCost;
        const nextLevels = ['Trại Tiền Đồn ⛺', 'Tháp Canh Đá 🏰', 'Đại Pháo Đài 🏯'];

        if (curLevel < 3) {
          setModal({
            title: `Lãnh Địa Của Bạn: ${tile.name}`,
            speaker: 'Kiến Trúc Sư Hoàng Gia',
            iconKey: 'castle',
            content: `Bạn đang thị sát lãnh địa của mình. Nâng cấp lên [${nextLevels[curLevel]}] để tăng gấp bội tiền thuê đất thu từ đối thủ! Phí nâng cấp: ${upgradeCost} Gold.`,
            actions: [
              {
                label: `Nâng Cấp Kiến Trúc (${upgradeCost}g)`,
                primary: true,
                disabled: !canUpgrade,
                icon: '🏗️',
                onClick: () => {
                  const newPlayers = [...currentState.players];
                  newPlayers[currentState.currentTurn].gold -= upgradeCost;
                  const newProps = {
                    ...properties,
                    [pos]: { ...propData, level: curLevel + 1 }
                  };
                  const logMsg = `${currentPlayer.name} nâng cấp ${tile.name} lên ${nextLevels[curLevel]} (${upgradeCost}g)!`;
                  const finalState = {
                    ...currentState,
                    players: newPlayers,
                    properties: newProps,
                    logs: [...currentState.logs, logMsg]
                  };
                  setModal(null);
                  commitRoomStateAndNextTurn(finalState);
                }
              },
              {
                label: 'Giữ Hiện Trạng',
                onClick: () => {
                  setModal(null);
                  commitRoomStateAndNextTurn(currentState);
                }
              }
            ]
          });
        } else {
          setTimeout(() => commitRoomStateAndNextTurn(currentState), 800);
        }
        return;
      }
    }

    // 2. SỰ KIỆN D20
    else if (tile.type === 'EVENT') {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setModal({
        title: ev.title,
        speaker: ev.speaker,
        iconKey: 'event',
        content: ev.desc,
        dc: ev.dc,
        onRollD20: (rolled, outcome) => {
          setTimeout(() => {
            const newPlayers = [...currentState.players];
            let outcomeLogs = [...currentState.logs];

            if (outcome === 'SUCCESS' || outcome === 'CRIT_SUCCESS') {
              if (ev.passGold) {
                newPlayers[currentState.currentTurn].gold += ev.passGold;
                outcomeLogs.push(`${currentPlayer.name} kiểm định D20 thắng (${rolled} >= ${ev.dc}), nhận +${ev.passGold} Gold!`);
              }
            } else {
              if (ev.failCost) {
                newPlayers[currentState.currentTurn].gold = Math.max(0, newPlayers[currentState.currentTurn].gold - ev.failCost);
                outcomeLogs.push(`${currentPlayer.name} kiểm định D20 bại (${rolled} < ${ev.dc}), mất ${ev.failCost} Gold.`);
              }
              if (ev.failJail) {
                newPlayers[currentState.currentTurn].position = 10;
                newPlayers[currentState.currentTurn].inJail = true;
                outcomeLogs.push(`${currentPlayer.name} bị tống giam vào Ngục!`);
              }
            }

            const finalState = { ...currentState, players: newPlayers, logs: outcomeLogs };
            setRoom(finalState);
            socket.emit('monopoly_action', { roomId: room.id, roomState: finalState });
          }, 1500);
        },
        actions: [
          {
            label: ev.safeLabel,
            onClick: () => {
              if (ev.safeCost > 0) {
                const newPlayers = [...currentState.players];
                newPlayers[currentState.currentTurn].gold = Math.max(0, newPlayers[currentState.currentTurn].gold - ev.safeCost);
                const finalState = {
                  ...currentState,
                  players: newPlayers,
                  logs: [...currentState.logs, `${currentPlayer.name} chọn nộp ${ev.safeCost}g an toàn.`]
                };
                setModal(null);
                commitRoomStateAndNextTurn(finalState);
              } else {
                setModal(null);
                commitRoomStateAndNextTurn(currentState);
              }
            }
          },
          {
            label: 'Xác Nhận & Tiếp Tục',
            primary: true,
            onClick: () => {
              setModal(null);
              commitRoomStateAndNextTurn(currentState);
            }
          }
        ]
      });
      return;
    }

    // 3. PHƯỚC LÀNH
    else if (tile.type === 'BLESSING') {
      const bl = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
      setModal({
        title: `Điện Thờ ${bl.title} (${bl.god})`,
        speaker: 'Tiếng Thì Thầm Thần Thánh',
        iconKey: 'blessing',
        content: `${bl.desc} Hãy gieo xúc xắc D20 để cầu nguyện phước lành (DC: ${bl.dc}).`,
        dc: bl.dc,
        onRollD20: (rolled, outcome) => {
          setTimeout(() => {
            const newPlayers = [...currentState.players];
            let outcomeLogs = [...currentState.logs];

            if (outcome === 'SUCCESS' || outcome === 'CRIT_SUCCESS') {
              newPlayers[currentState.currentTurn].gold += bl.passGold;
              outcomeLogs.push(`${currentPlayer.name} được Thần ${bl.god} ban phước (${rolled} >= ${bl.dc}), nhận +${bl.passGold} Gold!`);
            } else {
              if (bl.failCost > 0) {
                newPlayers[currentState.currentTurn].gold = Math.max(0, newPlayers[currentState.currentTurn].gold - bl.failCost);
                outcomeLogs.push(`${currentPlayer.name} thất bại trước Thần ${bl.god}, bị phạt ${bl.failCost} Gold.`);
              }
            }

            const finalState = { ...currentState, players: newPlayers, logs: outcomeLogs };
            setRoom(finalState);
            socket.emit('monopoly_action', { roomId: room.id, roomState: finalState });
          }, 1500);
        },
        actions: [
          {
            label: 'Tạ Ơn & Tiếp Tục',
            primary: true,
            onClick: () => {
              setModal(null);
              commitRoomStateAndNextTurn(currentState);
            }
          }
        ]
      });
      return;
    }

    // 4. THUẾ
    else if (tile.type === 'TAX') {
      const taxAmount = tile.price || 100;
      setModal({
        title: tile.name,
        speaker: 'Quan Thu Thuế',
        iconKey: 'tax',
        content: `Nộp ${taxAmount} Gold vào ngân khố vương quốc.`,
        actions: [
          {
            label: `Nộp ${taxAmount}g vào Ngân Khố`,
            primary: true,
            danger: true,
            onClick: () => {
              const newPlayers = [...currentState.players];
              newPlayers[currentState.currentTurn].gold = Math.max(0, newPlayers[currentState.currentTurn].gold - taxAmount);
              const finalState = {
                ...currentState,
                players: newPlayers,
                logs: [...currentState.logs, `${currentPlayer.name} nộp ${taxAmount}g thuế.`]
              };
              setModal(null);
              commitRoomStateAndNextTurn(finalState);
            }
          }
        ]
      });
      return;
    }

    // 5. CỔNG DỊCH CHUYỂN
    else if (tile.type === 'TELEPORT') {
      const targetPos = tile.target || 5;
      setModal({
        title: tile.name,
        speaker: 'Vết Rách Không Gian',
        iconKey: 'teleport',
        content: `Cổng không gian huyền bí đưa bạn tức thì đến ô [${BOARD_TILES[targetPos].name}]!`,
        actions: [
          {
            label: 'Bước Qua Cổng Không Gian',
            primary: true,
            onClick: () => {
              const newPlayers = [...currentState.players];
              newPlayers[currentState.currentTurn].position = targetPos;
              const finalState = {
                ...currentState,
                players: newPlayers,
                logs: [...currentState.logs, `${currentPlayer.name} dịch chuyển không gian đến ${BOARD_TILES[targetPos].name}!`]
              };
              setModal(null);
              commitRoomStateAndNextTurn(finalState);
            }
          }
        ]
      });
      return;
    }

    // 6. VÀO NGỤC
    else if (tile.type === 'GO_TO_JAIL') {
      setModal({
        title: 'Bắt Giữ Khẩn Cấp!',
        speaker: 'Đội Vệ Binh',
        iconKey: 'jail',
        content: 'Bạn bị bắt quả tang vi phạm luật lệ và bị áp giải ngay lập tức vào Ngục Giam!',
        actions: [
          {
            label: 'Chấp Nhận Vào Ngục',
            danger: true,
            primary: true,
            onClick: () => {
              const newPlayers = [...currentState.players];
              newPlayers[currentState.currentTurn].position = 10;
              newPlayers[currentState.currentTurn].inJail = true;
              const finalState = {
                ...currentState,
                players: newPlayers,
                logs: [...currentState.logs, `${currentPlayer.name} bị tống giam vào Ngục!`]
              };
              setModal(null);
              commitRoomStateAndNextTurn(finalState);
            }
          }
        ]
      });
      return;
    }

    setTimeout(() => commitRoomStateAndNextTurn(currentState), 1000);
  };

  // ----------------------------------------------------
  // SẢNH CHỜ (LOBBY FORM)
  // ----------------------------------------------------
  if (!isJoined || !room) {
    const selectedClassData = CLASSES.find((c) => c.id === lobbyClass) || CLASSES[0];
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black p-3 sm:p-6 text-stone-100 font-sans">
        <form onSubmit={handleJoin} className="bg-stone-900/95 border-2 border-amber-600/70 p-4 sm:p-7 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] w-full max-w-lg relative z-10 backdrop-blur-md">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-amber-900/60">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-amber-400 drop-shadow flex items-center gap-2">
                <span>🏰</span> Vương Quốc Baldur's Gate
              </h1>
              <p className="text-stone-400 text-xs mt-0.5">Cờ Tỷ Phú Nhập Vai D&D 3D Phong Cách Fantasy</p>
            </div>
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-600/50 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow"
            >
              <span>🏛️</span> Model 3D
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-stone-300 font-bold mb-1 block text-xs">Tên nhân vật:</label>
              <input
                type="text"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                placeholder="Tài Anh..."
              />
            </div>
            <div>
              <label className="text-stone-300 font-bold mb-1 block text-xs">Mã Phòng:</label>
              <input
                type="text"
                value={lobbyRoomId}
                onChange={(e) => setLobbyRoomId(e.target.value.toUpperCase())}
                className="w-full bg-stone-950 border border-stone-700 text-amber-400 font-bold px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                placeholder="DND_1"
              />
            </div>
          </div>

          <div className="mb-4 bg-stone-950/80 border border-stone-800 rounded-xl p-3 flex items-center justify-between shadow-inner">
            <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
              <Piece3D classId={lobbyClass} hexColor={selectedClassData.hex} size={isMobile ? 64 : 76} animated={true} interactive={true} isCurrentTurn={true} />
            </div>
            <div className="flex-1 pl-3">
              <div className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
                <span>{selectedClassData.icon}</span> {selectedClassData.name}
              </div>
              <p className="text-stone-400 text-xs mt-1 leading-snug">{selectedClassData.desc}</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-stone-300 font-bold mb-2 block text-xs">Chọn Class Nhân Vật:</label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {CLASSES.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setLobbyClass(c.id)}
                  className={`cursor-pointer border rounded-lg flex flex-col items-center p-1.5 sm:p-2 transition-all ${
                    lobbyClass === c.id
                      ? 'border-amber-500 bg-amber-950/60 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'border-stone-800 hover:border-stone-600 bg-stone-950/60'
                  }`}
                >
                  <span className="text-lg sm:text-xl mb-0.5">{c.icon}</span>
                  <span className="text-[9px] text-stone-300 font-bold truncate w-full text-center leading-tight">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-700 hover:bg-amber-600 text-stone-100 font-black py-3 rounded-xl text-base shadow-[0_0_20px_rgba(217,119,6,0.5)] transition hover:scale-[1.02]"
          >
            Vào Bàn Chơi
          </button>
        </form>

        <TokenGalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
      </div>
    );
  }

  // ----------------------------------------------------
  // GIAO DIỆN BÀN CỜ MONOPOLY & ĐIỀU KHIỂN CHÍNH
  // ----------------------------------------------------
  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-black font-sans text-stone-100 overflow-hidden select-none">
      
      {/* Mobile Top Navigation Tabs */}
      <div className="lg:hidden flex bg-stone-950 border-b border-amber-900/50 p-1.5 justify-around z-40">
        <button
          onClick={() => setActiveMobileTab('BOARD')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${activeMobileTab === 'BOARD' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}
        >
          🏰 Bàn Cờ
        </button>
        <button
          onClick={() => setActiveMobileTab('PARTY')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${activeMobileTab === 'PARTY' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}
        >
          👥 Tổ Đội ({room.players.length})
        </button>
        <button
          onClick={() => setActiveMobileTab('LOGS')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${activeMobileTab === 'LOGS' ? 'bg-amber-700 text-white' : 'text-stone-400'}`}
        >
          📜 Nhật Ký
        </button>
        <button
          onClick={() => setGalleryOpen(true)}
          className="px-2 py-1 text-xs font-bold text-amber-400 bg-stone-900 rounded-lg border border-amber-600/40"
        >
          🏛️ 3D
        </button>
      </div>

      {/* Main Board View Container */}
      <div className={`flex-1 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black p-1 sm:p-2.5 relative h-full overflow-hidden ${
        activeMobileTab !== 'BOARD' && 'hidden lg:flex'
      }`}>
        
        {/* Nút mở Bảo tàng 3D trên Desktop */}
        <div className="absolute top-3 right-3 z-30 hidden lg:block">
          <button
            onClick={() => setGalleryOpen(true)}
            className="bg-stone-900/90 hover:bg-stone-800 text-amber-400 border border-amber-600/60 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xl backdrop-blur-sm"
          >
            <span>🏛️</span> Bộ Sưu Tập Quân Cờ 3D
          </button>
        </div>

        {/* BÀN CỜ MONOPOLY TỶ LỆ CHUẨN (CÁC GÓC 1.45fr, CẠNH 1.0fr) */}
        <div
          className="relative w-full max-w-[min(96vw,84vh,760px)] aspect-square bg-stone-950 border-4 sm:border-8 border-amber-900/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] my-auto mx-auto select-none overflow-visible p-1 sm:p-1.5"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.45fr repeat(9, 1fr) 1.45fr',
            gridTemplateRows: '1.45fr repeat(9, 1fr) 1.45fr',
            gap: isMobile ? '2px' : '3.5px'
          }}
        >
          {/* 40 BOARD TILES */}
          {BOARD_TILES.map((tile) => {
            const gridPos = getTileGridArea(tile.id);
            const propState = room.properties?.[tile.id];
            const ownerPlayer = propState?.ownerId ? room.players.find((p) => p.id === propState.ownerId) : null;
            const ownerClass = ownerPlayer ? CLASSES.find((c) => c.id === ownerPlayer.classId) : null;
            const ownerColorHex = ownerClass ? ownerClass.hex : 0xfbbf24;
            const ownerColorStr = `#${ownerColorHex.toString(16).padStart(6, '0')}`;
            const groupColor = GROUP_COLORS[tile.group] || tile.colorHex || '#475569';
            const isCorner = tile.id === 0 || tile.id === 10 || tile.id === 20 || tile.id === 30;
            const isRelic = INSTANT_WIN_RELIC_IDS.includes(tile.id);
            const tierNames = ['Cờ Lãnh Địa', 'Trại Tiền Đồn', 'Tháp Canh Đá', 'Đại Pháo Đài'];

            // Xác định hướng dải màu hướng về trung tâm bàn cờ
            const edge = gridPos.edge;

            return (
              <div
                key={tile.id}
                style={{ gridRow: gridPos.row, gridColumn: gridPos.col }}
                onClick={() => setInspectedTile(tile)}
                className={`relative flex flex-col justify-between items-center rounded-sm border border-stone-800/90 cursor-pointer transition-all hover:brightness-125 hover:z-20 overflow-visible p-0.5 sm:p-1 bg-stone-950/80`}
              >
                {/* 1. HUY HIỆU TÊN CHỦ NHÂN NỔI BẬT NẰM Ở VIỀN Ô CỜ */}
                {ownerPlayer && (
                  <div
                    className={`absolute z-30 flex items-center gap-1 bg-stone-950 border-2 rounded-full px-1.5 py-0.5 shadow-2xl whitespace-nowrap pointer-events-none ${
                      edge === 'bottom' ? '-top-3 left-1/2 -translate-x-1/2' :
                      edge === 'top' ? '-bottom-3 left-1/2 -translate-x-1/2' :
                      edge === 'left' ? '-right-3 top-1/2 -translate-y-1/2' :
                      '-left-3 top-1/2 -translate-y-1/2'
                    }`}
                    style={{ borderColor: ownerColorStr }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ownerColorStr }} />
                    <span className="text-[6.5px] sm:text-[8px] font-black text-amber-200">
                      {ownerPlayer.name}
                    </span>
                  </div>
                )}

                {/* 2. DẢI MÀU NHÓM ĐẤT (HƯỚNG VỀ TRUNG TÂM BÀN CỜ) */}
                {!isCorner && (
                  <div
                    className={`w-full rounded-full shadow-inner ${edge === 'top' ? 'order-last mt-0.5 h-1 sm:h-1.5' : 'mb-0.5 h-1 sm:h-1.5'}`}
                    style={{ backgroundColor: ownerPlayer ? ownerColorStr : groupColor }}
                  />
                )}

                {/* 3. TRUNG TÂM: MÔ HÌNH 3D KHI ĐÃ XÂY DỰNG HOẶC FANTASY ICON */}
                <div className="flex-1 flex items-center justify-center py-0.5 w-full">
                  {propState?.ownerId ? (
                    <Building3D
                      tier={propState.level || 0}
                      colorHex={ownerColorHex}
                      size={isMobile ? 22 : 32}
                    />
                  ) : (
                    <FantasyIcon name={tile.iconKey} className={isCorner ? "w-6 h-6 sm:w-8 sm:h-8" : "w-4 h-4 sm:w-5 sm:h-5"} glow={isRelic} />
                  )}
                </div>

                {/* 4. CHÂN Ô: TÊN Ô CỜ & GIÁ TIỀN (CHUẨN LINE-HEIGHT, RÕ RÀNG KHÔNG CẮT CHỮ) */}
                <div className={`w-full flex flex-col items-center justify-center text-center overflow-hidden px-0.5 ${edge === 'top' ? 'order-first' : ''}`}>
                  <div className="text-[7px] sm:text-[8.5px] md:text-[9.5px] font-extrabold text-stone-100 truncate w-full leading-[1.3] drop-shadow">
                    {tile.shortName || tile.name}
                  </div>
                  {tile.price > 0 && !propState?.ownerId && (
                    <div className="text-[6.5px] sm:text-[8px] md:text-[8.5px] font-black text-amber-300 leading-[1.2]">
                      {tile.price}g
                    </div>
                  )}
                  {propState?.ownerId && (
                    <div className="text-[6px] sm:text-[7.5px] md:text-[8px] font-black text-emerald-400 leading-[1.2]">
                      Thuê: {tile.rents ? tile.rents[propState.level || 0] : tile.rent}g
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* QUÂN CỜ 3D CỦA TỪNG NGƯỜI CHƠI TRÊN CSS GRID */}
          {room.players.map((p, idx) => {
            const pGrid = getTileGridArea(p.position || 0);
            const classData = CLASSES.find((c) => c.id === p.classId);
            const sameTilePlayers = room.players.filter((other) => (other.position || 0) === (p.position || 0));
            const myIdxOnTile = sameTilePlayers.indexOf(p);
            const xOffset = (myIdxOnTile - (sameTilePlayers.length - 1) / 2) * (isMobile ? 4 : 8);

            return (
              <div
                key={p.id}
                style={{
                  gridRow: pGrid.row,
                  gridColumn: pGrid.col,
                  transform: `translateX(${xOffset}px)`,
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                className="flex items-center justify-center z-30 pointer-events-none p-0.5"
              >
                <div className="relative flex items-center justify-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] animate-bounce">
                  <PawnSVG
                    classId={p.classId}
                    hexColor={classData?.hex || 0xb91c1c}
                    size={isMobile ? 24 : 36}
                    isCurrentTurn={room.currentTurn === idx}
                  />
                </div>
              </div>
            );
          })}

          {/* KHU VỰC TRUNG TÂM BÀN CỜ (CHIẾM Ô GRID TỪ 2 ĐẾN 10 TRONG 11X11) */}
          <div
            style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
            className="bg-stone-950/92 rounded-xl border border-amber-900/60 flex flex-col items-center justify-center backdrop-blur-md p-2 sm:p-5 shadow-inner z-10 m-0.5 sm:m-1 overflow-hidden relative"
          >
            {room.status === 'WAITING' ? (
              // 1. Sảnh chờ
              <div className="text-center p-2">
                <h2 className="text-xl sm:text-3xl font-black text-amber-500 mb-2">Đang Tập Hợp Tổ Đội...</h2>
                <p className="text-stone-300 text-xs sm:text-base mb-3">
                  Mã phòng: <span className="font-mono text-base sm:text-xl text-white bg-stone-900 px-3 py-1 rounded border border-stone-700">{room.id}</span>
                </p>
                <p className="text-stone-400 text-xs mb-5">Chia sẻ mã này để bạn bè cùng tham gia ({room.players.length}/4)</p>

                {room.players.length >= 2 ? (
                  <button
                    onClick={handleStartGame}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold py-2.5 px-8 rounded-xl shadow-[0_0_20px_rgba(4,120,87,0.7)] text-sm sm:text-lg transition cursor-pointer"
                  >
                    Bắt Đầu Cuộc Chinh Phạt
                  </button>
                ) : (
                  <div className="text-stone-500 italic text-xs animate-pulse">Cần ít nhất 2 chiến binh để bắt đầu...</div>
                )}
              </div>
            ) : room.status === 'VICTORY' ? (
              // 2. Màn hình Chiến Thắng Tuyệt Đối
              <div className="text-center p-3 animate-in fade-in zoom-in duration-300">
                <div className="text-4xl sm:text-6xl mb-2 animate-bounce">👑</div>
                <h2 className="text-2xl sm:text-4xl font-black text-amber-400 mb-2">CHIẾN THẮNG TUYỆT ĐỐI!</h2>
                <p className="text-stone-300 text-sm sm:text-base max-w-sm mx-auto">
                  Vương quốc Baldur's Gate đã tìm thấy vị chúa tể mới nắm giữ toàn bộ 3 Thánh Vật quyền năng!
                </p>
              </div>
            ) : (
              // 3. Trong trận đấu: CHỈ HIỂN THỊ XÚC XẮC D6 ĐỂ DI CHUYỂN
              <div className="flex flex-col items-center justify-center w-full">
                <div className="text-[10px] sm:text-xs text-amber-500 uppercase font-bold tracking-widest mb-2">
                  Lượt của: <span className="text-stone-100 font-extrabold">{room.players[room.currentTurn]?.name}</span>
                </div>

                {/* 2 Viên Xúc Xắc D6 Monopoly */}
                <div className="flex gap-4 sm:gap-8 items-center my-1 sm:my-3">
                  <Dice3D type="D6" isRolling={isRollingD6} result={d6Val1} size={isMobile ? 65 : 90} theme="ivory" />
                  <Dice3D type="D6" isRolling={isRollingD6} result={d6Val2} size={isMobile ? 65 : 90} theme="ivory" />
                </div>

                <div className="text-xs sm:text-sm font-black text-amber-400 mb-3 bg-stone-900/80 px-3 py-1 rounded-full border border-amber-900/60 shadow">
                  {isRollingD6 ? 'Đang gieo xúc xắc...' : `Điểm di chuyển: [${d6Val1} + ${d6Val2} = ${d6Val1 + d6Val2}]`}
                </div>

                {isMyTurn ? (
                  <button
                    onClick={handleRollMovement}
                    disabled={isRollingD6 || !!modal}
                    className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-2.5 sm:py-3 px-6 sm:px-10 rounded-xl shadow-[0_0_20px_rgba(217,119,6,0.6)] text-xs sm:text-base transition hover:scale-105 cursor-pointer z-30"
                  >
                    {isRollingD6 ? 'Vận Mệnh Đang Lăn...' : '🎲 Tung Xúc Xắc Di Chuyển (2x D6)'}
                  </button>
                ) : (
                  <div className="text-stone-400 text-xs sm:text-sm italic animate-pulse">
                    Đang chờ dũng sĩ <strong>{room.players[room.currentTurn]?.name}</strong> thao tác...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỬA SỔ EVENT BG3 & DIALOGUE (KHÔNG CHE MỜ TOÀN BỘ BÀN CỜ) */}
          {modal && <RPGModal {...modal} />}
        </div>
      </div>

      {/* Drawer: Xem Chi Tiết Ô Đất Được Nhấp Vào (Tile Inspector) */}
      {inspectedTile && (
        <div className="fixed inset-x-2 bottom-3 sm:bottom-6 z-50 flex items-center justify-center pointer-events-auto">
          <div className="w-full max-w-md bg-stone-900/98 border-2 border-amber-500 rounded-xl p-3 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.95)] backdrop-blur-md">
            <div className="flex justify-between items-center pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2">
                <FantasyIcon name={inspectedTile.iconKey} className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-amber-300 text-sm sm:text-base">{inspectedTile.name}</h4>
              </div>
              <button
                onClick={() => setInspectedTile(null)}
                className="w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 text-xs text-stone-300 leading-relaxed">
              <p className="mb-2 italic text-stone-400">{inspectedTile.desc || 'Bất động sản thương mại vương quốc.'}</p>
              
              {inspectedTile.price > 0 && (
                <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Giá mua lãnh địa:</span>
                    <span className="text-amber-400 font-bold">{inspectedTile.price} Gold</span>
                  </div>
                  {inspectedTile.rents && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Thuế Đất Khảo Sát (🚩):</span>
                        <span className="text-stone-200">{inspectedTile.rents[0]}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Thuế Trại Tiền Đồn (⛺):</span>
                        <span className="text-stone-200">{inspectedTile.rents[1]}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Thuế Tháp Canh Đá (🏰):</span>
                        <span className="text-stone-200">{inspectedTile.rents[2]}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Thuế Đại Pháo Đài (🏯):</span>
                        <span className="text-amber-300 font-bold">{inspectedTile.rents[3]}g</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR TỔ ĐỘI & NHẬT KÝ */}
      <div className={`w-full lg:w-80 bg-stone-950 border-t lg:border-t-0 lg:border-l border-stone-800 flex flex-col h-full z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.6)] ${
        activeMobileTab === 'BOARD' ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* TAB TỔ ĐỘI */}
        {(activeMobileTab === 'PARTY' || !isMobile) && (
          <div className="p-3 sm:p-4 bg-stone-900 border-b border-amber-900/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-amber-500 font-black uppercase tracking-widest text-xs flex items-center gap-1.5">
                <span>👥</span> Tổ Đội Chiến Binh
              </h3>
              <span className="text-[10px] text-stone-400 font-bold">{room.players.length}/4 Người</span>
            </div>

            <div className="space-y-2 max-h-[40vh] lg:max-h-none overflow-y-auto pr-1">
              {room.players.map((p, i) => {
                const cData = CLASSES.find((c) => c.id === p.classId);
                const isTurn = room.currentTurn === i && room.status === 'PLAYING';
                return (
                  <div
                    key={p.id}
                    className={`p-2 sm:p-2.5 rounded-xl border transition flex justify-between items-center ${
                      isTurn
                        ? 'bg-amber-950/50 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-stone-950/70 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-lg border border-stone-700">
                        {cData?.icon}
                      </div>
                      <div>
                        <div className="text-stone-200 font-extrabold text-xs sm:text-sm flex items-center gap-1">
                          {p.name} {p.id === socket.id && <span className="text-[9px] text-amber-400 font-normal">(Bạn)</span>}
                        </div>
                        <div className="text-[10px] text-amber-500/90 font-medium">
                          {cData?.name} {p.inJail && <span className="text-rose-400 font-bold ml-1">⛓️ Trong Ngục</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-black text-sm sm:text-base">{p.gold}g</div>
                      <div className="text-[9px] text-stone-400">Vị trí: ô {p.position || 0}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB NHẬT KÝ CHIẾN TRƯỜNG */}
        {(activeMobileTab === 'LOGS' || !isMobile) && (
          <div className="flex-1 p-3 overflow-y-auto text-xs text-stone-400 font-mono leading-relaxed bg-stone-950/90">
            <div className="text-[10px] uppercase font-bold text-amber-600 mb-2 tracking-wider flex items-center gap-1">
              <span>📜</span> Diễn Biến Vương Quốc
            </div>
            <div className="space-y-1.5">
              {room.logs?.map((l, i) => (
                <div key={i} className="border-b border-stone-900/80 pb-1 flex gap-1.5 text-[11px]">
                  <span className="text-amber-500 font-bold select-none">{">"}</span>
                  <span className="text-stone-300">{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TokenGalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
