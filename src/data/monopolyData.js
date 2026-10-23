export const CLASSES = [
  { id: 'fighter', name: 'Warriors', icon: '⚔️', hex: 0xb91c1c, desc: 'Chiến Binh Giáp Trụ & Song Kiếm' },
  { id: 'rogue', name: 'Rogue', icon: '🗡️', hex: 0x7e22ce, desc: 'Sát Thủ Bóng Đêm & Song Đoản Đao' },
  { id: 'wizard', name: 'Wizard', icon: '🔮', hex: 0x1d4ed8, desc: 'Đại Pháp Sư Nón Phù Thủy & Mana' },
  { id: 'cleric', name: 'Cleric', icon: '✝️', hex: 0xd97706, desc: 'Mục Sư Thánh Quang & Chén Thánh' },
  { id: 'paladin', name: 'Paladin', icon: '🛡️', hex: 0xfacc15, desc: 'Hiệp Sĩ Thánh Khiên Pháo Đài' },
  { id: 'barbarian', name: 'Barbarian', icon: '🪓', hex: 0xc2410c, desc: 'Chiến Tướng Cuồng Nộ Rìu Song Lưỡi' },
  { id: 'ranger', name: 'Ranger', icon: '🏹', hex: 0x047857, desc: 'Thiện Xạ Rừng Sâu Cung & Ống Tên' },
  { id: 'druid', name: 'Druid', icon: '🌿', hex: 0x15803d, desc: 'Hiền Triết Thiên Nhiên Sừng Hươu' },
  { id: 'warlock', name: 'Warlock', icon: '👁️', hex: 0x4338ca, desc: 'Thuật Sĩ Hư Không Mắt Quỷ' },
  { id: 'sorcerer', name: 'Sorcerer', icon: '⚡', hex: 0x0891b2, desc: 'Phù Thủy Long Tộc Sấm Sét' }
];

export const INSTANT_WIN_RELIC_IDS = [15, 28, 35];

// Helper tính toán các tầng tiền thuê đất
const makeRents = (base) => ({
  0: base,                        // Đất trống
  1: Math.round(base * 2.5),       // Trại Tiền Đồn ⛺
  2: Math.round(base * 5.0),       // Tháp Canh Đá 🏰
  3: Math.round(base * 10.0)       // Đại Pháo Đài 🏯
});

export const BOARD_TILES = [
  { id: 0, name: "Khởi Hành", shortName: "Cổng Thành", type: "GO", price: 0, rent: 0, bg: "bg-emerald-950/80 border-emerald-500/60", iconKey: "go", desc: "Điểm xuất phát vương quốc. Nhận 200g trợ cấp mỗi khi đi qua." },
  { id: 1, name: "Trọ Rồng Béo", shortName: "Trọ Rồng", type: "PROPERTY", price: 60, rent: 10, upgradeCost: 40, rents: makeRents(10), bg: "bg-stone-900/90 border-amber-800/60", iconKey: "tavern", group: "brown" },
  { id: 2, name: "Sự Kiện D20", shortName: "Sự Kiện", type: "EVENT", price: 0, rent: 0, bg: "bg-purple-950/80 border-purple-500/60", iconKey: "event", desc: "Gặp gỡ ngẫu nhiên. Tung D20 kiểm định DC!" },
  { id: 3, name: "Mỏ Quặng Sắt", shortName: "Mỏ Sắt", type: "PROPERTY", price: 80, rent: 15, upgradeCost: 50, rents: makeRents(15), bg: "bg-stone-900/90 border-amber-800/60", iconKey: "mine", group: "brown" },
  { id: 4, name: "Thuế Rồng", shortName: "Thuế Rồng", type: "TAX", price: 100, rent: 0, bg: "bg-rose-950/80 border-rose-600/60", iconKey: "tax", desc: "Nộp thuế hoàng gia 100 Gold vào ngân khố." },
  { id: 5, name: "Cổng Dịch Chuyển A", shortName: "Teleport A", type: "TELEPORT", price: 0, target: 25, bg: "bg-cyan-950/80 border-cyan-500/60", iconKey: "teleport", desc: "Cổng không gian huyền bí đưa bạn tức thì đến Cổng B (ô 25)." },
  { id: 6, name: "Waterdeep", shortName: "Waterdeep", type: "PROPERTY", price: 100, rent: 20, upgradeCost: 60, rents: makeRents(20), bg: "bg-sky-950/90 border-sky-600/60", iconKey: "city", group: "sky" },
  { id: 7, name: "Phước Lành Thần", shortName: "Phước Lành", type: "BLESSING", price: 0, rent: 0, bg: "bg-amber-950/80 border-yellow-500/60", iconKey: "blessing", desc: "Cầu nguyện trước điện thờ thần linh với xúc xắc D20." },
  { id: 8, name: "Neverwinter", shortName: "Neverwinter", type: "PROPERTY", price: 120, rent: 25, upgradeCost: 70, rents: makeRents(25), bg: "bg-sky-950/90 border-sky-600/60", iconKey: "city", group: "sky" },
  { id: 9, name: "Skullport", shortName: "Skullport", type: "PROPERTY", price: 140, rent: 30, upgradeCost: 80, rents: makeRents(30), bg: "bg-sky-950/90 border-sky-600/60", iconKey: "skull", group: "sky" },
  { id: 10, name: "Ngục Giam Tối", shortName: "Ngục Giam", type: "JAIL", price: 0, rent: 0, bg: "bg-slate-900 border-slate-600/80", iconKey: "jail", desc: "Khu vực giam giữ phạm nhân. Trả 50g hoặc tung D20 (DC 12) để vượt ngục." },
  { id: 11, name: "Rừng Silvanus", shortName: "Rừng Rậm", type: "PROPERTY", price: 160, rent: 35, upgradeCost: 90, rents: makeRents(35), bg: "bg-emerald-950/90 border-emerald-600/60", iconKey: "forest", group: "green" },
  { id: 12, name: "Sự Kiện D20", shortName: "Sự Kiện", type: "EVENT", price: 0, rent: 0, bg: "bg-purple-950/80 border-purple-500/60", iconKey: "event", desc: "Gặp gỡ ngẫu nhiên. Tung D20 kiểm định DC!" },
  { id: 13, name: "Thung Lũng Băng", shortName: "Thung Lũng", type: "PROPERTY", price: 180, rent: 40, upgradeCost: 100, rents: makeRents(40), bg: "bg-emerald-950/90 border-emerald-600/60", iconKey: "forest", group: "green" },
  { id: 14, name: "Hang Kobold", shortName: "Hang Kobold", type: "PROPERTY", price: 200, rent: 45, upgradeCost: 110, rents: makeRents(45), bg: "bg-emerald-950/90 border-emerald-600/60", iconKey: "forest", group: "green" },
  { id: 15, name: "Candlekeep", shortName: "Candlekeep", type: "RELIC", price: 300, rent: 70, upgradeCost: 150, rents: makeRents(70), bg: "bg-amber-900/90 border-yellow-400/80", iconKey: "relic", desc: "👑 THÁNH VẬT: Thu thập đủ 3 Thánh Vật để Chiến Thắng Tuyệt Đối!" },
  { id: 16, name: "Tháp Szass", shortName: "Tháp Szass", type: "PROPERTY", price: 220, rent: 50, upgradeCost: 120, rents: makeRents(50), bg: "bg-indigo-950/90 border-indigo-500/60", iconKey: "city", group: "purple" },
  { id: 17, name: "Phước Lành Thần", shortName: "Phước Lành", type: "BLESSING", price: 0, rent: 0, bg: "bg-amber-950/80 border-yellow-500/60", iconKey: "blessing", desc: "Cầu nguyện trước điện thờ thần linh với xúc xắc D20." },
  { id: 18, name: "Đền Mystra", shortName: "Đền Mystra", type: "PROPERTY", price: 240, rent: 55, upgradeCost: 130, rents: makeRents(55), bg: "bg-indigo-950/90 border-indigo-500/60", iconKey: "city", group: "purple" },
  { id: 19, name: "Hầm Ngục Tối", shortName: "Hầm Ngục", type: "PROPERTY", price: 260, rent: 60, upgradeCost: 140, rents: makeRents(60), bg: "bg-indigo-950/90 border-indigo-500/60", iconKey: "dungeon", group: "purple" },
  { id: 20, name: "Nơi Nghỉ Chân", shortName: "Cắm Trại", type: "PARKING", price: 0, rent: 0, bg: "bg-teal-950/80 border-teal-500/60", iconKey: "camp", desc: "Khu vực an toàn. Lều trại bình yên, không bị đánh thuế hay trả tiền thuê." },
  { id: 21, name: "Đầm Lầy Độc", shortName: "Đầm Lầy", type: "PROPERTY", price: 280, rent: 65, upgradeCost: 150, rents: makeRents(65), bg: "bg-lime-950/90 border-lime-600/60", iconKey: "forest", group: "orange" },
  { id: 22, name: "Sự Kiện D20", shortName: "Sự Kiện", type: "EVENT", price: 0, rent: 0, bg: "bg-purple-950/80 border-purple-500/60", iconKey: "event", desc: "Gặp gỡ ngẫu nhiên. Tung D20 kiểm định DC!" },
  { id: 23, name: "Nghĩa Địa Cổ", shortName: "Nghĩa Địa", type: "PROPERTY", price: 300, rent: 70, upgradeCost: 160, rents: makeRents(70), bg: "bg-lime-950/90 border-lime-600/60", iconKey: "skull", group: "orange" },
  { id: 24, name: "Thành Băng Giá", shortName: "Thành Băng", type: "PROPERTY", price: 320, rent: 75, upgradeCost: 170, rents: makeRents(75), bg: "bg-lime-950/90 border-lime-600/60", iconKey: "city", group: "orange" },
  { id: 25, name: "Cổng Dịch Chuyển B", shortName: "Teleport B", type: "TELEPORT", price: 0, target: 5, bg: "bg-cyan-950/80 border-cyan-500/60", iconKey: "teleport", desc: "Cổng không gian huyền bí đưa bạn tức thì đến Cổng A (ô 5)." },
  { id: 26, name: "Tháp Helm", shortName: "Tháp Helm", type: "PROPERTY", price: 340, rent: 80, upgradeCost: 180, rents: makeRents(80), bg: "bg-blue-950/90 border-blue-500/60", iconKey: "city", group: "blue" },
  { id: 27, name: "Phước Lành Thần", shortName: "Phước Lành", type: "BLESSING", price: 0, rent: 0, bg: "bg-amber-950/80 border-yellow-500/60", iconKey: "blessing", desc: "Cầu nguyện trước điện thờ thần linh với xúc xắc D20." },
  { id: 28, name: "Undermountain", shortName: "Undermtn", type: "RELIC", price: 350, rent: 85, upgradeCost: 180, rents: makeRents(85), bg: "bg-amber-900/90 border-yellow-400/80", iconKey: "relic", desc: "👑 THÁNH VẬT: Thu thập đủ 3 Thánh Vật để Chiến Thắng Tuyệt Đối!" },
  { id: 29, name: "Underdark", shortName: "Underdark", type: "PROPERTY", price: 360, rent: 90, upgradeCost: 190, rents: makeRents(90), bg: "bg-blue-950/90 border-blue-500/60", iconKey: "dungeon", group: "blue" },
  { id: 30, name: "Vào Ngục!", shortName: "Bắt Giam", type: "GO_TO_JAIL", price: 0, rent: 0, bg: "bg-red-950/90 border-red-600/80", iconKey: "jail", desc: "Bạn bị lính canh bắt giữ và tống thẳng vào Ngục Giam (ô 10)!" },
  { id: 31, name: "Hội Zhentarim", shortName: "Zhentarim", type: "PROPERTY", price: 380, rent: 95, upgradeCost: 200, rents: makeRents(95), bg: "bg-rose-950/90 border-rose-500/60", iconKey: "skull", group: "red" },
  { id: 32, name: "Ổ Beholder", shortName: "Beholder", type: "PROPERTY", price: 400, rent: 100, upgradeCost: 210, rents: makeRents(100), bg: "bg-rose-950/90 border-rose-500/60", iconKey: "dungeon", group: "red" },
  { id: 33, name: "Sự Kiện D20", shortName: "Sự Kiện", type: "EVENT", price: 0, rent: 0, bg: "bg-purple-950/80 border-purple-500/60", iconKey: "event", desc: "Gặp gỡ ngẫu nhiên. Tung D20 kiểm định DC!" },
  { id: 34, name: "Hang Tiamat", shortName: "Tiamat", type: "PROPERTY", price: 420, rent: 110, upgradeCost: 220, rents: makeRents(110), bg: "bg-rose-950/90 border-rose-500/60", iconKey: "dragon", group: "red" },
  { id: 35, name: "Ten Towns", shortName: "Ten Towns", type: "RELIC", price: 400, rent: 100, upgradeCost: 200, rents: makeRents(100), bg: "bg-amber-900/90 border-yellow-400/80", iconKey: "relic", desc: "👑 THÁNH VẬT: Thu thập đủ 3 Thánh Vật để Chiến Thắng Tuyệt Đối!" },
  { id: 36, name: "Phước Lành Thần", shortName: "Phước Lành", type: "BLESSING", price: 0, rent: 0, bg: "bg-amber-950/80 border-yellow-500/60", iconKey: "blessing", desc: "Cầu nguyện trước điện thờ thần linh với xúc xắc D20." },
  { id: 37, name: "Đền Lathander", shortName: "Lathander", type: "PROPERTY", price: 450, rent: 120, upgradeCost: 240, rents: makeRents(120), bg: "bg-yellow-950/90 border-yellow-500/60", iconKey: "city", group: "yellow" },
  { id: 38, name: "Thuế Đại Điện", shortName: "Đại Thuế", type: "TAX", price: 200, rent: 0, bg: "bg-red-950/90 border-red-600/80", iconKey: "tax", desc: "Nộp cống phẩm đền thánh 200 Gold." },
  { id: 39, name: "Đảo Rồng Đỏ", shortName: "Đảo Rồng", type: "PROPERTY", price: 500, rent: 140, upgradeCost: 260, rents: makeRents(140), bg: "bg-yellow-950/90 border-yellow-500/60", iconKey: "dragon", group: "yellow" }
];

export const EVENTS = [
  { 
    id: 1, 
    speaker: "Lính Canh Baldur's Gate", 
    title: "Chốt Kiểm Soát Thành Cổ", 
    desc: "Lính gác chặn đường yêu cầu giấy phép thông hành hoặc lệ phí nhập thành.", 
    safeLabel: "Hối lộ 50g an toàn", 
    safeCost: 50, 
    rollLabel: "Thuyết phục lính (Roll D20)", 
    dc: 10, 
    passText: "Thành công! Lời lẽ đanh thép khiến lính gác nể sợ cho qua miễn phí.",
    passGold: 0, 
    failText: "Thất bại! Bị kết tội chống đối quan binh và tống giam vào ngục!",
    failJail: true 
  },
  { 
    id: 2, 
    speaker: "Cung Thủ Rồng Đỏ", 
    title: "Sòng Bạc Hắc Ám Skullport", 
    desc: "Một ván xúc xắc sinh tử nơi quán rượu ngầm. Kẻ liều lĩnh sẽ có tất cả.", 
    safeLabel: "Lắc đầu bỏ qua", 
    safeCost: 0, 
    rollLabel: "Đặt cược 80g (Roll D20)", 
    dc: 12, 
    passText: "Thần tài mỉm cười! Bạn thắng lớn và ẵm trọn 180 Gold!",
    passGold: 180, 
    failCost: 80,
    failText: "Thua sạch! Mất 80g tiền cược cho gã chủ sòng xảo quyệt."
  },
  { 
    id: 3, 
    speaker: "Kẻ Độc Tâm Mind Flayer", 
    title: "Ảo Ảnh Não Nuốt Chửng", 
    desc: "Sóng tâm linh tà ác xâm lấn tâm trí bạn. Mua bùa phòng hộ hoặc kháng cự?", 
    safeLabel: "Mua bùa hộ mệnh 60g", 
    safeCost: 60, 
    rollLabel: "Kháng cự tâm linh (Roll D20)", 
    dc: 13, 
    passText: "Ý chí thép! Bạn phản pháo sóng não và cướp lấy 120 Gold tinh thể!",
    passGold: 120, 
    failCost: 70,
    failText: "Tâm trí choáng váng! Bạn đánh rơi 70 Gold trong cơn hoảng loạn."
  },
  { 
    id: 4, 
    speaker: "Rương Gỗ Răng Nhọn", 
    title: "Rương Ma Quỷ Mimic", 
    desc: "Một chiếc rương gỗ hoàng kim lấp lánh hé mở giữa góc ngục tối.", 
    safeLabel: "Cẩn thận lùi lại", 
    safeCost: 0, 
    rollLabel: "Tấn công bất ngờ (Roll D20)", 
    dc: 11, 
    passText: "Chém đứt đôi quái Mimic trước khi nó kịp cắn! Thu về 150 Gold kho báu!",
    passGold: 150, 
    failCost: 80,
    failText: "Bị răng nhọn cắn xé! Mất 80 Gold tiền thuốc men chữa thương."
  },
  { 
    id: 5, 
    speaker: "Rồng Lửa Cổ Đại Tiamat", 
    title: "Cơn Thịnh Nộ Của Rồng", 
    desc: "Bóng đen che phủ bầu trời, hơi thở rực lửa yêu cầu cống phẩm hoàng gia.", 
    safeLabel: "Cống nạp 120g bảo mệnh", 
    safeCost: 120, 
    rollLabel: "Rút gươm khiêu chiến (Roll D20)", 
    dc: 15, 
    passText: "CHIẾN CÔNG HIỂN HÁCH! Đánh lui Rồng thiêng và đoạt lấy 300 Gold rực rỡ!",
    passGold: 300, 
    failCost: 140,
    failText: "Hơi thở rồng thiêu rụi áo giáp! Bạn thoát chết nhưng tổn thất 140 Gold."
  },
  { 
    id: 6, 
    speaker: "Thủ Lĩnh Hội Sát Thủ Zhentarim", 
    title: "Mật Phục Trong Ngõ Tối", 
    desc: "Những lưỡi dao đen kề cổ yêu cầu nộp 'phí bảo hộ lãnh địa'.", 
    safeLabel: "Nộp 70g tiền xâu", 
    safeCost: 70, 
    rollLabel: "Phản đòn chớp nhoáng (Roll D20)", 
    dc: 12, 
    passText: "Đánh gục toán sát thủ! Lục soát người chúng thu được 130 Gold!",
    passGold: 130, 
    failCost: 90,
    failText: "Bị đâm trúng sườn! Toán cướp cướp đi 90 Gold của bạn."
  }
];

export const BLESSINGS = [
  { id: 1, god: "Waukeen", title: "Nữ Thần Tài Lộc", desc: "Thần tiền tài ban phước cho những thương gia can trường.", dc: 9, passGold: 140, failCost: 30 },
  { id: 2, god: "Tymora", title: "Nữ Thần May Mắn", desc: "Đồng xu định mệnh đang xoay trên ngón tay nữ thần.", dc: 10, passGold: 160, failCost: 40 },
  { id: 3, god: "Mystra", title: "Mẫu Thần Phép Thuật", desc: "Tấm màn ma pháp cuộn trào quanh đền thánh cổ xưa.", dc: 11, passGold: 180, failCost: 50 },
  { id: 4, god: "Lathander", title: "Thần Bình Minh", desc: "Ánh dương rạng ngời xua tan mọi tà khí và mỏi mệt.", dc: 8, passGold: 120, failCost: 0 },
  { id: 5, god: "Helm", title: "Thần Hộ Mệnh", desc: "Tấm khiên thép bất hoại bảo bọc những kẻ chính trực.", dc: 10, passGold: 150, failCost: 40 },
  { id: 6, god: "Shar", title: "Nữ Thần Màn Đêm", desc: "Bóng tối huyền bí mời gọi một canh bạc linh hồn.", dc: 14, passGold: 260, failCost: 120 }
];
