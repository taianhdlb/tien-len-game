export const CLASSES = [
  { id: 'fighter', name: 'Fighter', icon: '⚔️', color: 'bg-red-700', hex: 0xb91c1c },
  { id: 'wizard', name: 'Wizard', icon: '🔮', color: 'bg-blue-700', hex: 0x1d4ed8 },
  { id: 'rogue', name: 'Rogue', icon: '🗡️', color: 'bg-purple-700', hex: 0x7e22ce },
  { id: 'cleric', name: 'Cleric', icon: '✝️', color: 'bg-amber-600', hex: 0xd97706 },
];

export const BOARD_TILES = [
  { id: 0, name: "Khởi Hành", type: "GO", price: 0, bg: "bg-gradient-to-br from-emerald-800 to-emerald-950", icon: "🏰" },
  { id: 1, name: "Quán Trọ", type: "PROPERTY", price: 60, rent: 10, bg: "bg-gradient-to-br from-stone-700 to-stone-900", icon: "🍺" },
  { id: 2, name: "Sự Kiện", type: "EVENT", price: 0, bg: "bg-gradient-to-br from-indigo-800 to-purple-900", icon: "📜" },
  { id: 3, name: "Mỏ Quặng", type: "PROPERTY", price: 80, rent: 15, bg: "bg-gradient-to-br from-stone-700 to-stone-900", icon: "⛏️" },
  { id: 4, name: "Thuế", type: "TAX", price: 100, bg: "bg-gradient-to-br from-red-800 to-red-950", icon: "💰" },
  // ... (Tương tự cho đủ 40 ô, phối màu gradient sẫm, thêm icon đại diện)
  // Giả lập 40 ô ngắn gọn:
].concat(Array.from({ length: 35 }).map((_, i) => ({
  id: i + 5, name: `Khu vực ${i+5}`, type: "PROPERTY", price: 100 + i*10, rent: 20 + i*5, 
  bg: "bg-gradient-to-br from-stone-800 to-slate-900", icon: "🌲"
})));

export const EVENTS = [
  { id: 1, title: "Lính canh Baldur's Gate", desc: "Bạn bị chặn lại ở cổng thành. Hối lộ 50g hoặc Roll D20 (DC 10) để qua.", safeCost: 50, dc: 10, passGold: 0, failJail: true },
];