export const CLASSES = [
  { id: 'fighter', name: 'Warrior', icon: '⚔️', hex: 0xb91c1c, desc: 'Chiến Binh Giáp Trụ & Song Kiếm' },
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

export const getClass = (classId) => CLASSES.find((c) => c.id === classId) || CLASSES[0];

export const hexToCss = (hex) => `#${hex.toString(16).padStart(6, '0')}`;

export const INSTANT_WIN_RELIC_IDS = [15, 28, 35];

export const GROUP_COLORS = {
  brown: '#92400e',
  sky: '#0284c7',
  green: '#15803d',
  purple: '#7e22ce',
  orange: '#ea580c',
  blue: '#2563eb',
  red: '#dc2626',
  yellow: '#ca8a04',
  relic: '#f59e0b'
};

export const TYPE_ACCENTS = {
  GO: '#10b981',
  EVENT: '#a855f7',
  BLESSING: '#eab308',
  TAX: '#e11d48',
  TELEPORT: '#06b6d4',
  JAIL: '#64748b',
  PARKING: '#14b8a6',
  GO_TO_JAIL: '#dc2626'
};

export const tileAccent = (tile) =>
  tile.type === 'RELIC' ? GROUP_COLORS.relic : GROUP_COLORS[tile.group] || TYPE_ACCENTS[tile.type] || '#57534e';

// Giá đất 50-260g quanh mốc 200g khởi đầu. Thuê gốc ~20% giá, tăng theo cấp tới 6x:
// đầu ván nhẹ nhàng, cuối ván đủ sức tạo đột phá nhưng không xóa sổ người còn sung túc.
const makeRents = (price) => {
  const base = Math.max(5, Math.round(price / 5));
  return [base, Math.round(base * 2.5), base * 4, base * 6];
};

// \u00AD = soft hyphen: lets long proper nouns break cleanly inside narrow tiles.
export const BOARD_TILES = [
  { id: 0, name: 'Cổng Khởi Hành', shortName: 'Khởi Hành', type: 'GO', price: 0, iconKey: 'go', desc: 'Điểm xuất phát vương quốc. Nhận trợ cấp mỗi khi đi qua.' },
  { id: 1, name: 'Trọ Rồng Béo', shortName: 'Trọ Rồng', type: 'PROPERTY', price: 50, upgradeCost: 25, rents: makeRents(50), iconKey: 'tavern', group: 'brown' },
  { id: 2, name: 'Sự Kiện D20', shortName: 'Sự Kiện', type: 'EVENT', price: 0, iconKey: 'event', desc: 'Gặp gỡ ngẫu nhiên. Chọn an toàn hoặc tung D20 kiểm định DC!' },
  { id: 3, name: 'Mỏ Quặng Sắt', shortName: 'Mỏ Sắt', type: 'PROPERTY', price: 60, upgradeCost: 30, rents: makeRents(60), iconKey: 'mine', group: 'brown' },
  { id: 4, name: 'Thuế Rồng', shortName: 'Thuế Rồng', type: 'TAX', price: 0, taxRate: 0.1, taxMin: 20, taxMax: 80, iconKey: 'tax', desc: 'Nộp thuế hoàng gia 10% vàng hiện có (tối thiểu 20g, tối đa 80g).' },
  { id: 5, name: 'Cổng Dịch Chuyển A', shortName: 'Cổng A', type: 'TELEPORT', price: 0, target: 25, iconKey: 'teleport', desc: 'Cổng không gian đưa bạn tức thì đến Cổng B (ô 25).' },
  { id: 6, name: 'Waterdeep', shortName: 'Water\u00ADdeep', type: 'PROPERTY', price: 70, upgradeCost: 35, rents: makeRents(70), iconKey: 'city', group: 'sky' },
  { id: 7, name: 'Phước Lành Thần', shortName: 'Phước Lành', type: 'BLESSING', price: 0, iconKey: 'blessing', desc: 'Cầu nguyện trước điện thờ thần linh với xúc xắc D20.' },
  { id: 8, name: 'Neverwinter', shortName: 'Never\u00ADwinter', type: 'PROPERTY', price: 80, upgradeCost: 40, rents: makeRents(80), iconKey: 'city', group: 'sky' },
  { id: 9, name: 'Skullport', shortName: 'Skull\u00ADport', type: 'PROPERTY', price: 90, upgradeCost: 45, rents: makeRents(90), iconKey: 'skull', group: 'sky' },
  { id: 10, name: 'Ngục Giam Tối', shortName: 'Ngục Giam', type: 'JAIL', price: 0, iconKey: 'jail', desc: 'Khu giam giữ. Nộp tiền bảo lãnh hoặc tung D20 để vượt ngục.' },
  { id: 11, name: 'Rừng Silvanus', shortName: 'Rừng Silvanus', type: 'PROPERTY', price: 100, upgradeCost: 50, rents: makeRents(100), iconKey: 'forest', group: 'green' },
  { id: 12, name: 'Sự Kiện D20', shortName: 'Sự Kiện', type: 'EVENT', price: 0, iconKey: 'event', desc: 'Gặp gỡ ngẫu nhiên. Chọn an toàn hoặc tung D20 kiểm định DC!' },
  { id: 13, name: 'Thung Lũng Băng', shortName: 'Thung Lũng Băng', type: 'PROPERTY', price: 110, upgradeCost: 55, rents: makeRents(110), iconKey: 'forest', group: 'green' },
  { id: 14, name: 'Hang Kobold', shortName: 'Hang Kobold', type: 'PROPERTY', price: 120, upgradeCost: 60, rents: makeRents(120), iconKey: 'forest', group: 'green' },
  { id: 15, name: 'Candlekeep', shortName: 'Candle\u00ADkeep', type: 'RELIC', price: 150, upgradeCost: 75, rents: makeRents(150), iconKey: 'relic', desc: 'THÁNH VẬT: Thu thập đủ 3 Thánh Vật để Chiến Thắng Tuyệt Đối!' },
  { id: 16, name: 'Tháp Szass', shortName: 'Tháp Szass', type: 'PROPERTY', price: 130, upgradeCost: 65, rents: makeRents(130), iconKey: 'city', group: 'purple' },
  { id: 17, name: 'Phước Lành Thần', shortName: 'Phước Lành', type: 'BLESSING', price: 0, iconKey: 'blessing', desc: 'Cầu nguyện trước điện thờ thần linh với xúc xắc D20.' },
  { id: 18, name: 'Đền Mystra', shortName: 'Đền Mystra', type: 'PROPERTY', price: 140, upgradeCost: 70, rents: makeRents(140), iconKey: 'city', group: 'purple' },
  { id: 19, name: 'Hầm Ngục Tối', shortName: 'Hầm Ngục', type: 'PROPERTY', price: 150, upgradeCost: 75, rents: makeRents(150), iconKey: 'dungeon', group: 'purple' },
  { id: 20, name: 'Nơi Nghỉ Chân', shortName: 'Cắm Trại', type: 'PARKING', price: 0, iconKey: 'camp', desc: 'Khu vực an toàn. Lều trại bình yên, không thuế, không tiền thuê.' },
  { id: 21, name: 'Đầm Lầy Độc', shortName: 'Đầm Lầy', type: 'PROPERTY', price: 160, upgradeCost: 80, rents: makeRents(160), iconKey: 'forest', group: 'orange' },
  { id: 22, name: 'Sự Kiện D20', shortName: 'Sự Kiện', type: 'EVENT', price: 0, iconKey: 'event', desc: 'Gặp gỡ ngẫu nhiên. Chọn an toàn hoặc tung D20 kiểm định DC!' },
  { id: 23, name: 'Nghĩa Địa Cổ', shortName: 'Nghĩa Địa', type: 'PROPERTY', price: 170, upgradeCost: 85, rents: makeRents(170), iconKey: 'skull', group: 'orange' },
  { id: 24, name: 'Thành Băng Giá', shortName: 'Thành Băng', type: 'PROPERTY', price: 180, upgradeCost: 90, rents: makeRents(180), iconKey: 'city', group: 'orange' },
  { id: 25, name: 'Cổng Dịch Chuyển B', shortName: 'Cổng B', type: 'TELEPORT', price: 0, target: 5, iconKey: 'teleport', desc: 'Cổng không gian đưa bạn tức thì đến Cổng A (ô 5).' },
  { id: 26, name: 'Tháp Helm', shortName: 'Tháp Helm', type: 'PROPERTY', price: 190, upgradeCost: 95, rents: makeRents(190), iconKey: 'city', group: 'blue' },
  { id: 27, name: 'Phước Lành Thần', shortName: 'Phước Lành', type: 'BLESSING', price: 0, iconKey: 'blessing', desc: 'Cầu nguyện trước điện thờ thần linh với xúc xắc D20.' },
  { id: 28, name: 'Undermountain', shortName: 'Under\u00ADmountain', type: 'RELIC', price: 175, upgradeCost: 85, rents: makeRents(175), iconKey: 'relic', desc: 'THÁNH VẬT: Thu thập đủ 3 Thánh Vật để Chiến Thắng Tuyệt Đối!' },
  { id: 29, name: 'Underdark', shortName: 'Under\u00ADdark', type: 'PROPERTY', price: 200, upgradeCost: 100, rents: makeRents(200), iconKey: 'dungeon', group: 'blue' },
  { id: 30, name: 'Vào Ngục!', shortName: 'Bắt Giam', type: 'GO_TO_JAIL', price: 0, iconKey: 'jail', desc: 'Bị lính canh bắt giữ và tống thẳng vào Ngục Giam (ô 10)!' },
  { id: 31, name: 'Hội Zhentarim', shortName: 'Zhen\u00ADtarim', type: 'PROPERTY', price: 210, upgradeCost: 105, rents: makeRents(210), iconKey: 'skull', group: 'red' },
  { id: 32, name: 'Ổ Beholder', shortName: 'Ổ Beholder', type: 'PROPERTY', price: 220, upgradeCost: 110, rents: makeRents(220), iconKey: 'dungeon', group: 'red' },
  { id: 33, name: 'Sự Kiện D20', shortName: 'Sự Kiện', type: 'EVENT', price: 0, iconKey: 'event', desc: 'Gặp gỡ ngẫu nhiên. Chọn an toàn hoặc tung D20 kiểm định DC!' },
  { id: 34, name: 'Hang Tiamat', shortName: 'Hang Tiamat', type: 'PROPERTY', price: 230, upgradeCost: 115, rents: makeRents(230), iconKey: 'dragon', group: 'red' },
  { id: 35, name: 'Ten Towns', shortName: 'Ten Towns', type: 'RELIC', price: 200, upgradeCost: 100, rents: makeRents(200), iconKey: 'relic', desc: 'THÁNH VẬT: Thu thập đủ 3 Thánh Vật để Chiến Thắng Tuyệt Đối!' },
  { id: 36, name: 'Phước Lành Thần', shortName: 'Phước Lành', type: 'BLESSING', price: 0, iconKey: 'blessing', desc: 'Cầu nguyện trước điện thờ thần linh với xúc xắc D20.' },
  { id: 37, name: 'Đền Lathander', shortName: 'Đền Lathander', type: 'PROPERTY', price: 240, upgradeCost: 120, rents: makeRents(240), iconKey: 'city', group: 'yellow' },
  { id: 38, name: 'Thuế Đại Điện', shortName: 'Đại Thuế', type: 'TAX', price: 0, taxRate: 0.15, taxMin: 30, taxMax: 120, iconKey: 'tax', desc: 'Nộp cống phẩm đền thánh 15% vàng hiện có (tối thiểu 30g, tối đa 120g).' },
  { id: 39, name: 'Đảo Rồng Đỏ', shortName: 'Đảo Rồng', type: 'PROPERTY', price: 260, upgradeCost: 130, rents: makeRents(260), iconKey: 'dragon', group: 'yellow' }
];

export const EVENTS = [
  {
    id: 1,
    speaker: "Lính Canh Baldur's Gate",
    title: 'Chốt Kiểm Soát Thành Cổ',
    desc: 'Lính gác chặn đường yêu cầu giấy phép thông hành hoặc lệ phí nhập thành.',
    safeLabel: 'Hối lộ 20g',
    safeCost: 20,
    rollLabel: 'Thuyết phục lính',
    dc: 10,
    passText: 'Lời lẽ đanh thép khiến lính gác nể sợ cho qua miễn phí.',
    passGold: 0,
    failText: 'Bị kết tội chống đối quan binh và tống giam vào ngục!',
    failJail: true
  },
  {
    id: 2,
    speaker: 'Chủ Sòng Bạc Ngầm',
    title: 'Sòng Bạc Hắc Ám Skullport',
    desc: 'Một ván xúc xắc sinh tử nơi quán rượu ngầm. Kẻ liều lĩnh sẽ có tất cả.',
    safeLabel: 'Lắc đầu bỏ qua',
    safeCost: 0,
    rollLabel: 'Đặt cược 30g',
    dc: 12,
    passText: 'Thần tài mỉm cười! Bạn thắng lớn và ẵm trọn 50 Gold!',
    passGold: 50,
    failCost: 30,
    failText: 'Thua sạch! Mất 30g tiền cược cho gã chủ sòng xảo quyệt.'
  },
  {
    id: 3,
    speaker: 'Kẻ Độc Tâm Mind Flayer',
    title: 'Ảo Ảnh Não Nuốt Chửng',
    desc: 'Sóng tâm linh tà ác xâm lấn tâm trí bạn. Mua bùa phòng hộ hoặc kháng cự?',
    safeLabel: 'Mua bùa hộ mệnh 25g',
    safeCost: 25,
    rollLabel: 'Kháng cự tâm linh',
    dc: 13,
    passText: 'Ý chí thép! Bạn phản pháo sóng não và cướp lấy 50 Gold tinh thể!',
    passGold: 50,
    failCost: 30,
    failText: 'Tâm trí choáng váng! Bạn đánh rơi 30 Gold trong cơn hoảng loạn.'
  },
  {
    id: 4,
    speaker: 'Rương Gỗ Răng Nhọn',
    title: 'Rương Ma Quỷ Mimic',
    desc: 'Một chiếc rương gỗ hoàng kim lấp lánh hé mở giữa góc ngục tối.',
    safeLabel: 'Cẩn thận lùi lại',
    safeCost: 0,
    rollLabel: 'Tấn công bất ngờ',
    dc: 11,
    passText: 'Chém đứt đôi quái Mimic trước khi nó kịp cắn! Thu về 60 Gold kho báu!',
    passGold: 60,
    failCost: 35,
    failText: 'Bị răng nhọn cắn xé! Mất 35 Gold tiền thuốc men chữa thương.'
  },
  {
    id: 5,
    speaker: 'Rồng Lửa Cổ Đại Tiamat',
    title: 'Cơn Thịnh Nộ Của Rồng',
    desc: 'Bóng đen che phủ bầu trời, hơi thở rực lửa yêu cầu cống phẩm hoàng gia.',
    safeLabel: 'Cống nạp 35g',
    safeCost: 35,
    rollLabel: 'Rút gươm khiêu chiến',
    dc: 15,
    passText: 'CHIẾN CÔNG HIỂN HÁCH! Đánh lui Rồng thiêng và đoạt lấy 100 Gold!',
    passGold: 100,
    failCost: 50,
    failText: 'Hơi thở rồng thiêu rụi áo giáp! Bạn thoát chết nhưng tổn thất 50 Gold.'
  },
  {
    id: 6,
    speaker: 'Thủ Lĩnh Hội Sát Thủ Zhentarim',
    title: 'Mật Phục Trong Ngõ Tối',
    desc: "Những lưỡi dao đen kề cổ yêu cầu nộp 'phí bảo hộ lãnh địa'.",
    safeLabel: 'Nộp 30g tiền xâu',
    safeCost: 30,
    rollLabel: 'Phản đòn chớp nhoáng',
    dc: 12,
    passText: 'Đánh gục toán sát thủ! Lục soát người chúng thu được 40 Gold!',
    passGold: 40,
    failCost: 35,
    failText: 'Bị đâm trúng sườn! Toán cướp lấy đi 35 Gold của bạn.'
  }
];

export const BLESSINGS = [
  { id: 1, god: 'Waukeen', title: 'Nữ Thần Tài Lộc', desc: 'Thần tiền tài ban phước cho những thương gia can trường.', dc: 9, passGold: 40, failCost: 10 },
  { id: 2, god: 'Tymora', title: 'Nữ Thần May Mắn', desc: 'Đồng xu định mệnh đang xoay trên ngón tay nữ thần.', dc: 10, passGold: 50, failCost: 15 },
  { id: 3, god: 'Mystra', title: 'Mẫu Thần Phép Thuật', desc: 'Tấm màn ma pháp cuộn trào quanh đền thánh cổ xưa.', dc: 11, passGold: 60, failCost: 20 },
  { id: 4, god: 'Lathander', title: 'Thần Bình Minh', desc: 'Ánh dương rạng ngời xua tan mọi tà khí và mỏi mệt.', dc: 8, passGold: 30, failCost: 0 },
  { id: 5, god: 'Helm', title: 'Thần Hộ Mệnh', desc: 'Tấm khiên thép bất hoại bảo bọc những kẻ chính trực.', dc: 10, passGold: 45, failCost: 15 },
  { id: 6, god: 'Shar', title: 'Nữ Thần Màn Đêm', desc: 'Bóng tối huyền bí mời gọi một canh bạc linh hồn.', dc: 14, passGold: 90, failCost: 30 }
];
