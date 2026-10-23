import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { BOARD_TILES, CLASSES, EVENTS, BLESSINGS, INSTANT_WIN_RELIC_IDS } from '../data/monopolyData';
import { PawnSVG, Piece3D, Dice3D, TokenGalleryModal } from '../components/Monopoly/Models3D';
import { FantasyIcon, BuildingBadge } from '../components/Monopoly/FantasyIcons';
import RPGModal from '../components/Monopoly/RPGModal';

const BACKEND_URL = "https://tien-len-backend.onrender.com";
const socket = io(BACKEND_URL);

// Tính toán vị trí phần trăm theo 4 cạnh bàn cờ 11x11
const getPosPercent = (pos) => {
  const step = 9.0909;
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
    if (room.players[0].id !== socket.id) return alert("Chỉ chủ phòng (người vào đầu tiên) mới có thể bắt đầu!");
    socket.emit('monopoly_action', {
      roomId: room.id,
      roomState: { ...room, status: 'PLAYING', properties: room.properties || {} }
    });
  };

  const me = room?.players?.find((p) => p.id === socket.id);
  const isMyTurn = room?.status === 'PLAYING' && room?.players[room?.currentTurn]?.id === socket.id;

  // ----------------------------------------------------
  // DI CHUYỂN BẰNG XÚC XẮC D6 (CHỈ ROLL D6 KHI DI CHUYỂN)
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

      let logMsg = `${me.name} tung 2 xúc xắc được [${r1} + ${r2} = ${totalMove}] điểm, tiến đến ${BOARD_TILES[newPos].name}`;

      // Thưởng 200g khi đi qua hoặc vào Khởi Hành (GO)
      if (passedGo && newPos !== 0) {
        newPlayers[playerIdx].gold += 200;
        logMsg += ` (Đi qua Khởi Hành nhận +200g trợ cấp)`;
      } else if (newPos === 0) {
        newPlayers[playerIdx].gold += 200;
        logMsg += ` (Vào Cổng Khởi Hành nhận +200g trợ cấp)`;
      }

      const updatedState = {
        ...room,
        players: newPlayers,
        logs: [...(room.logs || []), logMsg]
      };

      socket.emit('monopoly_action', {
        roomId: room.id,
        roomState: updatedState
      });

      // Kích hoạt tương tác ô tiếp đất
      handleLanding(newPos, updatedState);
    }, 1200);
  };

  // ----------------------------------------------------
  // XỬ LÝ TƯƠNG TÁC TẠI Ô TIẾP ĐẤT (RPG DIALOGUE ENCOUNTER)
  // ----------------------------------------------------
  const handleLanding = (pos, currentState) => {
    const tile = BOARD_TILES[pos];
    const properties = currentState.properties || {};
    const propData = properties[pos];
    const currentPlayer = currentState.players[currentState.currentTurn];

    // 1. ĐẤT HOẶC THÁNH VẬT (PROPERTY / RELIC)
    if (tile.type === 'PROPERTY' || tile.type === 'RELIC') {
      const isRelic = tile.type === 'RELIC';

      // Trường hợp 1: Chưa ai sở hữu -> Hỏi Mua Đất
      if (!propData || !propData.ownerId) {
        const canAfford = currentPlayer.gold >= tile.price;
        setModal({
          title: tile.name,
          speaker: isRelic ? "Thánh Vật Cổ Xưa" : "Vùng Đất Hoang Sơ",
          iconKey: tile.iconKey,
          content: isRelic
            ? `Bạn tìm thấy Thánh Vật [${tile.name}]. Thu thập đủ 3 Thánh Vật sẽ Chiến Thắng Ngay Lập Tức! Giá sở hữu: ${tile.price} Gold.`
            : `Vùng đất trù phú [${tile.name}] chưa có chủ quyền. Bạn có muốn chi ${tile.price} Gold để cắm cờ xác lập lãnh địa?`,
          actions: [
            {
              label: `Mua Quyền Sở Hữu (${tile.price}g)`,
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

                // Kiểm tra điều kiện Thắng Tuyệt Đối bằng 3 Thánh Vật
                const ownedRelics = INSTANT_WIN_RELIC_IDS.filter((rId) => newProps[rId]?.ownerId === currentPlayer.id);
                let logs = [...currentState.logs, `${currentPlayer.name} đã mua thành công ${tile.name} với giá ${tile.price}g.`];

                if (ownedRelics.length === 3) {
                  logs.push(`👑 CHIẾN THẮNG TUYỆT ĐỐI! ${currentPlayer.name} ĐÃ THU THẬP ĐỦ 3 THÁNH VẬT CỦA VƯƠNG QUỐC!`);
                  currentState.status = 'VICTORY';
                }

                socket.emit('monopoly_action', {
                  roomId: room.id,
                  roomState: { ...currentState, players: newPlayers, properties: newProps, logs }
                });
                setModal(null);
                nextTurn(currentState);
              }
            },
            {
              label: 'Bỏ Qua Lãnh Địa',
              onClick: () => {
                setModal(null);
                nextTurn(currentState);
              }
            }
          ]
        });
        return;
      }

      // Trường hợp 2: Đất của đối thủ -> Nộp tiền thuê đất!
      if (propData.ownerId !== currentPlayer.id) {
        const owner = currentState.players.find((p) => p.id === propData.ownerId) || { name: 'Chủ Đất' };
        const tier = propData.level || 0;
        const rentAmount = tile.rents ? tile.rents[tier] : tile.rent;
        const tierNames = ['Đất Khảo Sát', 'Trại Tiền Đồn ⛺', 'Tháp Canh Đá 🏰', 'Đại Pháo Đài 🏯'];

        setModal({
          title: `Thu Phí Lãnh Địa: ${tile.name}`,
          speaker: `Lính Canh Thuế (${owner.name})`,
          iconKey: 'tax',
          content: `Vùng đất này thuộc chủ quyền của ${owner.name} (Cấp độ: ${tierNames[tier]}). Bạn phải nộp lệ phí thuê đất là ${rentAmount} Gold!`,
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

                const logMsg = `${currentPlayer.name} trả ${rentAmount}g tiền thuê đất ${tile.name} cho ${owner.name}.`;
                socket.emit('monopoly_action', {
                  roomId: room.id,
                  roomState: { ...currentState, players: newPlayers, logs: [...currentState.logs, logMsg] }
                });
                setModal(null);
                nextTurn(currentState);
              }
            }
          ]
        });
        return;
      }

      // Trường hợp 3: Đất của chính mình -> Nâng cấp kiến trúc
      if (propData.ownerId === currentPlayer.id) {
        const curLevel = propData.level || 0;
        const upgradeCost = tile.upgradeCost || Math.round(tile.price * 0.6);
        const canUpgrade = curLevel < 3 && currentPlayer.gold >= upgradeCost;
        const nextLevels = ['Trại Tiền Đồn ⛺', 'Tháp Canh Đá 🏰', 'Đại Pháo Đài 🏯'];

        if (curLevel < 3) {
          setModal({
            title: `Lãnh Thổ Của Bạn: ${tile.name}`,
            speaker: 'Kiến Trúc Sư Hoàng Gia',
            iconKey: 'castle',
            content: `Bạn đang thị sát lãnh địa của mình. Nâng cấp lên [${nextLevels[curLevel]}] để tăng gấp bội tiền thuê thu từ đối thủ! Phí xây dựng: ${upgradeCost} Gold.`,
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
                  const logMsg = `${currentPlayer.name} nâng cấp ${tile.name} lên ${nextLevels[curLevel]} với giá ${upgradeCost}g!`;
                  socket.emit('monopoly_action', {
                    roomId: room.id,
                    roomState: { ...currentState, players: newPlayers, properties: newProps, logs: [...currentState.logs, logMsg] }
                  });
                  setModal(null);
                  nextTurn(currentState);
                }
              },
              {
                label: 'Giữ Nguyên Hiện Trạng',
                onClick: () => {
                  setModal(null);
                  nextTurn(currentState);
                }
              }
            ]
          });
        } else {
          // Đã đạt cấp tối đa
          setTimeout(() => nextTurn(currentState), 800);
        }
        return;
      }
    }

    // 2. SỰ KIỆN D20 (EVENT) - THỬ THÁCH D&D KIỂM ĐỊNH DC
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
                outcomeLogs.push(`${currentPlayer.name} kiểm định D20 thắng lợi (${rolled} >= ${ev.dc}), nhận +${ev.passGold} Gold!`);
              }
            } else {
              if (ev.failCost) {
                newPlayers[currentState.currentTurn].gold = Math.max(0, newPlayers[currentState.currentTurn].gold - ev.failCost);
                outcomeLogs.push(`${currentPlayer.name} kiểm định D20 thất bại (${rolled} < ${ev.dc}), mất ${ev.failCost} Gold.`);
              }
              if (ev.failJail) {
                newPlayers[currentState.currentTurn].position = 10;
                newPlayers[currentState.currentTurn].inJail = true;
                outcomeLogs.push(`${currentPlayer.name} bị áp giải vào Ngục Giam tối tăm!`);
              }
            }

            socket.emit('monopoly_action', {
              roomId: room.id,
              roomState: { ...currentState, players: newPlayers, logs: outcomeLogs }
            });
          }, 1500);
        },
        actions: [
          {
            label: ev.safeLabel,
            onClick: () => {
              if (ev.safeCost > 0) {
                const newPlayers = [...currentState.players];
                newPlayers[currentState.currentTurn].gold = Math.max(0, newPlayers[currentState.currentTurn].gold - ev.safeCost);
                socket.emit('monopoly_action', {
                  roomId: room.id,
                  roomState: { ...currentState, players: newPlayers, logs: [...currentState.logs, `${currentPlayer.name} chọn nộp ${ev.safeCost}g an toàn.`] }
                });
              }
              setModal(null);
              nextTurn(currentState);
            }
          },
          {
            label: 'Xác Nhận & Tiếp Tục',
            primary: true,
            onClick: () => {
              setModal(null);
              nextTurn(currentState);
            }
          }
        ]
      });
      return;
    }

    // 3. PHƯỚC LÀNH THẦN LINH (BLESSING) - KIỂM ĐỊNH D20
    else if (tile.type === 'BLESSING') {
      const bl = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
      setModal({
        title: `Điện Thờ ${bl.title} (${bl.god})`,
        speaker: 'Tiếng Thì Thầm Thần Thánh',
        iconKey: 'blessing',
        content: `${bl.desc} Hãy gieo xúc xắc D20 để cầu nguyện phước lành hoàng kim (Độ khó DC: ${bl.dc}).`,
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
                outcomeLogs.push(`${currentPlayer.name} thiếu thành tâm trước Thần ${bl.god}, bị phạt ${bl.failCost} Gold.`);
              }
            }

            socket.emit('monopoly_action', {
              roomId: room.id,
              roomState: { ...currentState, players: newPlayers, logs: outcomeLogs }
            });
          }, 1500);
        },
        actions: [
          {
            label: 'Tạ Ơn Thần Linh & Tiếp Tục',
            primary: true,
            onClick: () => {
              setModal(null);
              nextTurn(currentState);
            }
          }
        ]
      });
      return;
    }

    // 4. THUẾ HOÀNG GIA (TAX)
    else if (tile.type === 'TAX') {
      const taxAmount = tile.price || 100;
      setModal({
        title: tile.name,
        speaker: 'Quan Thu Thuế Vương Triều',
        iconKey: 'tax',
        content: `Chiến phí quốc gia yêu cầu mọi dũng sĩ qua đây nộp ${taxAmount} Gold vào ngân khố.`,
        actions: [
          {
            label: `Nộp ${taxAmount}g vào Ngân Khố`,
            primary: true,
            danger: true,
            onClick: () => {
              const newPlayers = [...currentState.players];
              newPlayers[currentState.currentTurn].gold = Math.max(0, newPlayers[currentState.currentTurn].gold - taxAmount);
              socket.emit('monopoly_action', {
                roomId: room.id,
                roomState: { ...currentState, players: newPlayers, logs: [...currentState.logs, `${currentPlayer.name} nộp ${taxAmount}g thuế.`] }
              });
              setModal(null);
              nextTurn(currentState);
            }
          }
        ]
      });
      return;
    }

    // 5. CỔNG DỊCH CHUYỂN (TELEPORT)
    else if (tile.type === 'TELEPORT') {
      const targetPos = tile.target || 5;
      setModal({
        title: tile.name,
        speaker: 'Vết Rách Không Gian',
        iconKey: 'teleport',
        content: `Một luồng ánh sáng chói lòa hút bạn qua cổng không gian bí ẩn đến ngay ô [${BOARD_TILES[targetPos].name}]!`,
        actions: [
          {
            label: 'Bước Qua Cổng Không Gian',
            primary: true,
            onClick: () => {
              const newPlayers = [...currentState.players];
              newPlayers[currentState.currentTurn].position = targetPos;
              socket.emit('monopoly_action', {
                roomId: room.id,
                roomState: { ...currentState, players: newPlayers, logs: [...currentState.logs, `${currentPlayer.name} dịch chuyển không gian đến ${BOARD_TILES[targetPos].name}!`] }
              });
              setModal(null);
              nextTurn(currentState);
            }
          }
        ]
      });
      return;
    }

    // 6. VÀO NGỤC (GO_TO_JAIL)
    else if (tile.type === 'GO_TO_JAIL') {
      setModal({
        title: 'Bắt Giữ Khẩn Cấp!',
        speaker: 'Đội Trưởng Đội Vệ Binh',
        iconKey: 'jail',
        content: 'Bạn bị bắt quả tang vi phạm luật lệ thành phố và bị áp giải ngay lập tức vào Ngục Giam!',
        actions: [
          {
            label: 'Chấp Nhận Vào Ngục',
            danger: true,
            primary: true,
            onClick: () => {
              const newPlayers = [...currentState.players];
              newPlayers[currentState.currentTurn].position = 10;
              newPlayers[currentState.currentTurn].inJail = true;
              socket.emit('monopoly_action', {
                roomId: room.id,
                roomState: { ...currentState, players: newPlayers, logs: [...currentState.logs, `${currentPlayer.name} bị tống giam vào Ngục!`] }
              });
              setModal(null);
              nextTurn(currentState);
            }
          }
        ]
      });
      return;
    }

    // Mặc định chuyển lượt sau 1 giây
    setTimeout(() => nextTurn(currentState), 1000);
  };

  const nextTurn = (currentState) => {
    const nextIdx = (currentState.currentTurn + 1) % currentState.players.length;
    socket.emit('monopoly_action', {
      roomId: room.id,
      roomState: { ...currentState, currentTurn: nextIdx }
    });
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

          {/* Xem trước mô hình 3D nhân vật */}
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
      <div className="lg:hidden flex bg-stone-950 border-b border-amber-900/50 p-1.5 justify-around z-30">
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
      <div className={`flex-1 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black p-1 sm:p-3 relative h-full overflow-hidden ${
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

        {/* 11x11 RESPONSIVE MONOPOLY BOARD */}
        <div className="relative w-full max-w-[min(96vw,84vh,800px)] aspect-square bg-stone-950 border-4 sm:border-8 border-double border-amber-800/80 shadow-[0_0_50px_rgba(0,0,0,0.95)] rounded-xl overflow-hidden my-auto mx-auto">
          
          {/* 40 BOARD TILES */}
          {BOARD_TILES.map((tile, i) => {
            const propState = room.properties?.[tile.id];
            const ownerPlayer = propState ? room.players.find((p) => p.id === propState.ownerId) : null;
            const ownerClass = ownerPlayer ? CLASSES.find((c) => c.id === ownerPlayer.classId) : null;
            const isRelic = INSTANT_WIN_RELIC_IDS.includes(tile.id);

            return (
              <div
                key={i}
                style={getPosPercent(i)}
                onClick={() => setInspectedTile(tile)}
                className={`absolute w-[9.09%] h-[9.09%] border border-stone-800/90 flex flex-col items-center justify-between p-0.5 sm:p-1 cursor-pointer transition-all hover:brightness-125 hover:z-20 ${tile.bg}`}
              >
                {/* Dải màu quyền sở hữu hoặc nhóm đất */}
                {ownerPlayer ? (
                  <div
                    className="w-full h-1 sm:h-1.5 rounded-sm"
                    style={{ backgroundColor: ownerClass ? `#${ownerClass.hex.toString(16).padStart(6, '0')}` : '#fbbf24' }}
                    title={`Chủ sở hữu: ${ownerPlayer.name}`}
                  />
                ) : (
                  <div className="w-full h-0.5 sm:h-1 bg-stone-800/50 rounded-sm" />
                )}

                {/* Icon ô cờ Fantasy chuyên nghiệp */}
                <div className="my-auto flex items-center justify-center">
                  <FantasyIcon name={tile.iconKey} className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6" glow={isRelic} />
                </div>

                {/* Tên ô cờ (Tự động co nhỏ, KHÔNG BAO GIỜ TRÀN CHỮ TRÊN ĐIỆN THOẠI) */}
                <span className="text-[6px] sm:text-[7.5px] md:text-[9px] font-bold text-stone-200 truncate w-full text-center px-0.5 leading-none">
                  {tile.shortName || tile.name}
                </span>

                {/* Huy hiệu nhà đất hoặc giá tiền */}
                <div className="flex items-center justify-center w-full min-h-[9px]">
                  {propState && propState.ownerId ? (
                    <BuildingBadge
                      tier={propState.level || 0}
                      colorHex={ownerClass ? ownerClass.hex : 0xfbbf24}
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                  ) : tile.price > 0 ? (
                    <span className="text-[5.5px] sm:text-[7.5px] font-extrabold text-amber-300/90 leading-none">
                      {tile.price}g
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* QUÂN CỜ 3D CỦA TỪNG NGƯỜI CHƠI (TỰ ĐỘNG THU PHÓNG THEO MÀN HÌNH) */}
          {room.players.map((p, idx) => {
            const posCss = getPosPercent(p.position || 0);
            const classData = CLASSES.find((c) => c.id === p.classId);
            return (
              <div
                key={p.id}
                style={{ ...posCss, transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                className="absolute w-[9.09%] h-[9.09%] flex items-center justify-center z-20 pointer-events-none"
              >
                <PawnSVG
                  classId={p.classId}
                  hexColor={classData?.hex || 0xb91c1c}
                  size={isMobile ? 28 : 46}
                  isCurrentTurn={room.currentTurn === idx}
                />
              </div>
            );
          })}

          {/* KHU VỰC TRUNG TÂM BÀN CỜ (CENTER STAGE) */}
          <div className="absolute inset-[13%] bg-stone-950/85 rounded-xl border border-amber-900/60 flex flex-col items-center justify-center backdrop-blur-md p-2 sm:p-5 shadow-inner">
            
            {room.status === 'WAITING' ? (
              // 1. Sảnh chờ khi chưa đủ người
              <div className="text-center p-2">
                <h2 className="text-xl sm:text-3xl font-black text-amber-500 mb-2">Đang Tập Hợp Tổ Đội...</h2>
                <p className="text-stone-300 text-xs sm:text-base mb-3">
                  Mã phòng: <span className="font-mono text-base sm:text-xl text-white bg-stone-900 px-3 py-1 rounded border border-stone-700">{room.id}</span>
                </p>
                <p className="text-stone-400 text-xs mb-5">Chia sẻ mã này để bạn bè cùng tham gia ({room.players.length}/4)</p>

                {room.players.length >= 2 ? (
                  <button
                    onClick={handleStartGame}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold py-2.5 px-8 rounded-xl shadow-[0_0_20px_rgba(4,120,87,0.7)] text-sm sm:text-lg transition"
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

                {/* 2 Viên Xúc Xắc D6 chuyên nghiệp của Monopoly */}
                <div className="flex gap-4 sm:gap-8 items-center my-1 sm:my-3">
                  <Dice3D type="D6" isRolling={isRollingD6} result={d6Val1} size={isMobile ? 70 : 95} theme="ivory" />
                  <Dice3D type="D6" isRolling={isRollingD6} result={d6Val2} size={isMobile ? 70 : 95} theme="ivory" />
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

      {/* Mobile / Desktop Drawer: Xem Chi Tiết Ô Đất Được Nhấp Vào (Tile Inspector) */}
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
                className="w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 text-xs text-stone-300 leading-relaxed">
              <p className="mb-2 italic text-stone-400">{inspectedTile.desc || 'Bất động sản thương mại vương quốc.'}</p>
              
              {inspectedTile.price > 0 && (
                <div className="bg-stone-950 p-2 rounded-lg border border-stone-800 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Giá mua lãnh địa:</span>
                    <span className="text-amber-400 font-bold">{inspectedTile.price} Gold</span>
                  </div>
                  {inspectedTile.rents && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Thuế Đất Khảo Sát:</span>
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

      {/* SIDEBAR TỔ ĐỘI & NHẬT KÝ (HIỆN TRÊN DESKTOP HOẶC CHUYỂN TAB TRÊN MOBILE) */}
      <div className={`w-full lg:w-80 bg-stone-950 border-t lg:border-t-0 lg:border-l border-stone-800 flex flex-col h-full z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.6)] ${
        activeMobileTab === 'BOARD' ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* TAB TỔ ĐỘI (PARTY STATS) */}
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

        {/* TAB NHẬT KÝ CHIẾN TRƯỜNG (LOGS) */}
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
