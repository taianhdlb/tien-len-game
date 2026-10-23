export const CLASSES = [
  { id: 'fighter', name: 'Warriors', icon: '⚔️', hex: 0xb91c1c }, // Đỏ
  { id: 'rogue', name: 'Rogue', icon: '🗡️', hex: 0x7e22ce }, // Tím
  { id: 'wizard', name: 'Wizard', icon: '🔮', hex: 0x1d4ed8 }, // Xanh dương
  { id: 'cleric', name: 'Cleric', icon: '✝️', hex: 0xd97706 }, // Vàng cam
  { id: 'paladin', name: 'Paladin', icon: '🛡️', hex: 0xfacc15 }, // Vàng sáng
  { id: 'barbarian', name: 'Barbarian', icon: '🪓', hex: 0xc2410c }, // Cam đậm
  { id: 'ranger', name: 'Ranger', icon: '🏹', hex: 0x047857 }, // Xanh lá đậm
  { id: 'druid', name: 'Druid', icon: '🌿', hex: 0x15803d }, // Xanh lá
  { id: 'warlock', name: 'Warlock', icon: '👁️', hex: 0x4338ca }, // Indigo
  { id: 'sorcerer', name: 'Sorcerer', icon: '⚡', hex: 0x0891b2 } // Cyan
];

export const INSTANT_WIN_RELIC_IDS = [15, 28, 35];

export const BOARD_TILES = [
  { id: 0, name: "Khởi Hành", type: "GO", price: 0, bg: "bg-gradient-to-br from-emerald-800 to-emerald-950", icon: "🏰" },
  { id: 1, name: "Trọ Rồng Béo", type: "PROPERTY", price: 60, rent: 10, bg: "bg-gradient-to-br from-stone-700 to-stone-900", icon: "🍺" },
  { id: 2, name: "Sự Kiện D20", type: "EVENT", price: 0, bg: "bg-gradient-to-br from-indigo-800 to-purple-900", icon: "📜" },
  { id: 3, name: "Mỏ Quặng", type: "PROPERTY", price: 80, rent: 15, bg: "bg-gradient-to-br from-stone-700 to-stone-900", icon: "⛏️" },
  { id: 4, name: "Thuế", type: "TAX", price: 100, bg: "bg-gradient-to-br from-red-800 to-red-950", icon: "💰" },
  { id: 5, name: "Teleport A", type: "TELEPORT", price: 0, target: 25, bg: "bg-gradient-to-br from-cyan-800 to-cyan-950", icon: "🌀" },
  { id: 6, name: "Waterdeep", type: "PROPERTY", price: 100, rent: 20, bg: "bg-gradient-to-br from-sky-800 to-slate-900", icon: "🏙️" },
  { id: 7, name: "Phước Lành", type: "BLESSING", price: 0, bg: "bg-gradient-to-br from-amber-600 to-amber-900", icon: "✨" },
  { id: 8, name: "Neverwinter", type: "PROPERTY", price: 120, rent: 25, bg: "bg-gradient-to-br from-sky-800 to-slate-900", icon: "❄️" },
  { id: 9, name: "Skullport", type: "PROPERTY", price: 140, rent: 30, bg: "bg-gradient-to-br from-sky-800 to-slate-900", icon: "☠️" },
  { id: 10, name: "Ngục Giam", type: "JAIL", price: 0, bg: "bg-gradient-to-br from-slate-700 to-slate-900", icon: "⛓️" },
  { id: 11, name: "Rừng Silvanus", type: "PROPERTY", price: 160, rent: 35, bg: "bg-gradient-to-br from-green-800 to-green-950", icon: "🌲" },
  { id: 12, name: "Sự Kiện D20", type: "EVENT", price: 0, bg: "bg-gradient-to-br from-indigo-800 to-purple-900", icon: "📜" },
  { id: 13, name: "Thung Lũng", type: "PROPERTY", price: 180, rent: 40, bg: "bg-gradient-to-br from-green-800 to-green-950", icon: "🏔️" },
  { id: 14, name: "Hang Kobold", type: "PROPERTY", price: 200, rent: 45, bg: "bg-gradient-to-br from-green-800 to-green-950", icon: "🦎" },
  { id: 15, name: "Candlekeep", type: "RELIC", price: 300, rent: 70, bg: "bg-gradient-to-br from-yellow-500 to-amber-700", icon: "👑" },
  { id: 16, name: "Tháp Szass", type: "PROPERTY", price: 220, rent: 50, bg: "bg-gradient-to-br from-purple-800 to-indigo-950", icon: "🦹" },
  { id: 17, name: "Phước Lành", type: "BLESSING", price: 0, bg: "bg-gradient-to-br from-amber-600 to-amber-900", icon: "✨" },
  { id: 18, name: "Đền Mystra", type: "PROPERTY", price: 240, rent: 55, bg: "bg-gradient-to-br from-purple-800 to-indigo-950", icon: "📖" },
  { id: 19, name: "Hầm Ngục", type: "PROPERTY", price: 260, rent: 60, bg: "bg-gradient-to-br from-purple-800 to-indigo-950", icon: "💀" },
  { id: 20, name: "Cắm Trại", type: "PARKING", price: 0, bg: "bg-gradient-to-br from-teal-700 to-teal-950", icon: "⛺" },
  { id: 21, name: "Đầm Lầy", type: "PROPERTY", price: 280, rent: 65, bg: "bg-gradient-to-br from-lime-800 to-green-950", icon: "🐸" },
  { id: 22, name: "Sự Kiện D20", type: "EVENT", price: 0, bg: "bg-gradient-to-br from-indigo-800 to-purple-900", icon: "📜" },
  { id: 23, name: "Nghĩa Địa", type: "PROPERTY", price: 300, rent: 70, bg: "bg-gradient-to-br from-lime-800 to-green-950", icon: "🪦" },
  { id: 24, name: "Thành Băng", type: "PROPERTY", price: 320, rent: 75, bg: "bg-gradient-to-br from-lime-800 to-green-950", icon: "🧊" },
  { id: 25, name: "Teleport B", type: "TELEPORT", price: 0, target: 5, bg: "bg-gradient-to-br from-cyan-800 to-cyan-950", icon: "🌀" },
  { id: 26, name: "Tháp Helm", type: "PROPERTY", price: 340, rent: 80, bg: "bg-gradient-to-br from-blue-800 to-blue-950", icon: "👁️" },
  { id: 27, name: "Phước Lành", type: "BLESSING", price: 0, bg: "bg-gradient-to-br from-amber-600 to-amber-900", icon: "✨" },
  { id: 28, name: "Undermountain", type: "RELIC", price: 350, rent: 85, bg: "bg-gradient-to-br from-yellow-500 to-amber-700", icon: "👑" },
  { id: 29, name: "Underdark", type: "PROPERTY", price: 360, rent: 90, bg: "bg-gradient-to-br from-blue-800 to-blue-950", icon: "🕷️" },
  { id: 30, name: "Vào Ngục!", type: "GO_TO_JAIL", price: 0, bg: "bg-gradient-to-br from-red-700 to-red-950", icon: "🚔" },
  { id: 31, name: "Zhentarim", type: "PROPERTY", price: 380, rent: 95, bg: "bg-gradient-to-br from-rose-800 to-rose-950", icon: "🗡️" },
  { id: 32, name: "Ổ Beholder", type: "PROPERTY", price: 400, rent: 100, bg: "bg-gradient-to-br from-rose-800 to-rose-950", icon: "🧿" },
  { id: 33, name: "Sự Kiện D20", type: "EVENT", price: 0, bg: "bg-gradient-to-br from-indigo-800 to-purple-900", icon: "📜" },
  { id: 34, name: "Hang Tiamat", type: "PROPERTY", price: 420, rent: 110, bg: "bg-gradient-to-br from-rose-800 to-rose-950", icon: "🐉" },
  { id: 35, name: "Ten Towns", type: "RELIC", price: 400, rent: 100, bg: "bg-gradient-to-br from-yellow-500 to-amber-700", icon: "👑" },
  { id: 36, name: "Phước Lành", type: "BLESSING", price: 0, bg: "bg-gradient-to-br from-amber-600 to-amber-900", icon: "✨" },
  { id: 37, name: "Lathander", type: "PROPERTY", price: 450, rent: 120, bg: "bg-gradient-to-br from-yellow-700 to-yellow-900", icon: "🌅" },
  { id: 38, name: "Thuế Đền", type: "TAX", price: 200, bg: "bg-gradient-to-br from-red-800 to-red-950", icon: "💰" },
  { id: 39, name: "Đảo Rồng Đỏ", type: "PROPERTY", price: 500, rent: 140, bg: "bg-gradient-to-br from-yellow-700 to-yellow-900", icon: "🌋" }
];

export const EVENTS = [
  { id: 1, title: "Lính canh Baldur's Gate", desc: "Trả 50g hối lộ hoặc Roll D20 DC 10 để qua cửa.", safeCost: 50, dc: 10, passGold: 0, failJail: true },
  { id: 2, title: "Tài xỉu Skullport", desc: "Bỏ qua hoặc Roll D20 DC 12 ăn 150 Gold.", safeCost: 0, dc: 12, passGold: 150, failCost: 80 },
  { id: 3, title: "Ảo ảnh Mind Flayer", desc: "Trả 60g mua bùa hoặc Roll D20 DC 13 cướp 60g của người giàu nhất.", safeCost: 60, dc: 13, passSteal: 60, failRandomMove: true },
  { id: 4, title: "Rương kho báu Mimic", desc: "Bỏ qua hoặc Roll D20 DC 10 diệt Mimic lấy 120 Gold.", safeCost: 0, dc: 10, passGold: 120, failCost: 70 },
  { id: 5, title: "Rồng Đỏ Tiamat", desc: "Trả 150g cống nạp hoặc Roll D20 DC 15 diệt Rồng lấy 300g.", safeCost: 150, dc: 15, passGold: 300, failCost: 150 },
  { id: 6, title: "Cướp hội Zhentarim", desc: "Trả 80g tiền xâu hoặc Roll D20 DC 12 đánh lui cướp lấy 100g.", safeCost: 80, dc: 12, passGold: 100, failCost: 100 },
  { id: 7, title: "Tháp Pháp sư Szass", desc: "Mất 100g học phí hoặc Roll D20 DC 13 nhận 150 Gold.", safeCost: 100, dc: 13, passGold: 150, failCost: 100 },
  { id: 8, title: "Tòa án Waterdeep", desc: "Trả 100g tiền phạt hoặc Roll D20 DC 11 chứng minh vô tội.", safeCost: 100, dc: 11, passGold: 0, failJail: true },
  { id: 9, title: "Giao kèo Quỷ Fiend", desc: "Bỏ qua hoặc Roll D20 DC 14 lừa Quỷ nhận 200g.", safeCost: 0, dc: 14, passGold: 200, failCost: 100 },
  { id: 10, title: "Mê cung Underdark", desc: "Trả 70g thuê dẫn đường hoặc Roll D20 DC 12 nhận 120g.", safeCost: 70, dc: 12, passGold: 120, failCost: 50 },
  { id: 11, title: "Dịch bệnh Talona", desc: "Trả 60g mua bùa chữa lành hoặc Roll D20 DC 10 để bình phục.", safeCost: 60, dc: 10, passGold: 50, failCost: 80 },
  { id: 12, title: "Đua xe quỷ Avernus", desc: "Bỏ qua hoặc Roll D20 DC 13 về nhất nhận 180 Gold.", safeCost: 0, dc: 13, passGold: 180, failJail: true },
  { id: 13, title: "Ổ quái Beholder", desc: "Trả 70g hối lộ hoặc Roll D20 DC 12 nhận 160g.", safeCost: 70, dc: 12, passGold: 160, failCost: 90 },
  { id: 14, title: "Bão tuyết Icewind", desc: "Trả 50g mua đồ ấm hoặc Roll D20 DC 12 nhận 100g.", safeCost: 50, dc: 12, passGold: 100, failCost: 50 },
  { id: 15, title: "Cạm bẫy hầm ngục", desc: "Trả 50g gỡ bẫy hoặc Roll D20 DC 11 né bẫy nhặt 60g.", safeCost: 50, dc: 11, passGold: 60, failJail: true },
  { id: 16, title: "Pháp sư Elminster", desc: "Mất 40g thỉnh giáo hoặc Roll D20 DC 14 nhận 150g.", safeCost: 40, dc: 14, passGold: 150, failCost: 50 }
];

export const BLESSINGS = [
  { id: 1, god: "Waukeen", dc: 8, passGold: 100, failCost: 30 },
  { id: 2, god: "Tymora", dc: 10, passGold: 120, failCost: 50 },
  { id: 3, god: "Beshaba", dc: 14, passGold: 200, failJail: true },
  { id: 4, god: "Mystra", dc: 11, passGold: 150, failCost: 60 },
  { id: 5, god: "Helm", dc: 9, passGold: 90, failCost: 40 },
  { id: 6, god: "Shar", dc: 15, passGold: 250, failCost: 150 },
  { id: 7, god: "Lathander", dc: 8, passGold: 150, failCost: 0 },
  { id: 8, god: "Kelemvor", dc: 10, passGold: 110, failCost: 50 },
  { id: 9, god: "Bhaal", dc: 15, passGold: 220, failJail: true },
  { id: 10, god: "Silvanus", dc: 9, passGold: 100, failCost: 50 },
  { id: 11, god: "Tempus", dc: 11, passGold: 140, failCost: 70 },
  { id: 12, god: "Oghma", dc: 10, passGold: 80, failCost: 40 },
  { id: 13, god: "Cyric", dc: 14, passGold: 180, failJail: true },
  { id: 14, god: "Sune", dc: 7, passGold: 70, failCost: 20 },
  { id: 15, god: "Talos", dc: 13, passGold: 160, failCost: 80 },
  { id: 16, god: "Ilmater", dc: 6, passGold: 120, failCost: 0 }
];