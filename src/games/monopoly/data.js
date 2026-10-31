export const CLASSES = [
  { id: 'fighter', name: 'Kiếm Sĩ', icon: '⚔️', hex: 0xb91c1c },
  { id: 'rogue', name: 'Đạo Tặc', icon: '🗡️', hex: 0x7e22ce },
  { id: 'wizard', name: 'Pháp Sư', icon: '🔮', hex: 0x1d4ed8 },
  { id: 'cleric', name: 'Thầy Cúng', icon: '✝️', hex: 0xd97706 },
  { id: 'paladin', name: 'Hiệp Sĩ', icon: '🛡️', hex: 0xfacc15 },
  { id: 'barbarian', name: 'Cuồng Sĩ', icon: '🪓', hex: 0xc2410c },
  { id: 'ranger', name: 'Xạ Thủ', icon: '🏹', hex: 0x047857 },
  { id: 'druid', name: 'Thầy Thuốc', icon: '🌿', hex: 0x15803d },
  { id: 'warlock', name: 'Thầy Bói', icon: '👁️', hex: 0x4338ca },
  { id: 'sorcerer', name: 'Long Tộc', icon: '⚡', hex: 0x0891b2 }
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

// Thuê gốc 20% giá đất, tăng theo cấp xây dựng tới 120%: đầu ván nhẹ nhàng, cuối ván đủ sức đổi vận.
const makeRents = (price) => {
  const base = Math.max(5, Math.round(price / 5));
  return [base, Math.round(base * 2.5), base * 4, base * 6];
};

const city = (id, name, price, group) => ({
  id,
  name,
  shortName: name,
  type: 'PROPERTY',
  price,
  upgradeCost: Math.round(price / 2),
  rents: makeRents(price),
  iconKey: 'city',
  group
});

const special = (id, type, name, extra) => ({ id, name, shortName: name, type, price: 0, ...extra });

export const BOARD_TILES = [
  special(0, 'GO', 'Xuất Phát', { iconKey: 'go' }),
  city(1, 'Hà Giang', 100, 'brown'),
  special(2, 'EVENT', 'Cơ Hội', { iconKey: 'event' }),
  city(3, 'Cao Bằng', 120, 'brown'),
  special(4, 'TAX', 'Thuế Thu Nhập', { iconKey: 'tax', taxRate: 0.1, taxMin: 50, taxMax: 200 }),
  special(5, 'TELEPORT', 'Bay Vào Nam', { iconKey: 'teleport', target: 25 }),
  city(6, 'Lạng Sơn', 140, 'sky'),
  special(7, 'BLESSING', 'Khí Vận', { iconKey: 'blessing' }),
  city(8, 'Quảng Ninh', 160, 'sky'),
  city(9, 'Hải Phòng', 180, 'sky'),
  special(10, 'JAIL', 'Tạm Giam', { iconKey: 'jail' }),
  city(11, 'Lào Cai', 200, 'green'),
  special(12, 'EVENT', 'Cơ Hội', { iconKey: 'event' }),
  city(13, 'Yên Bái', 220, 'green'),
  city(14, 'Sơn La', 240, 'green'),
  special(15, 'RELIC', 'Vịnh Hạ Long', {
    price: 300,
    upgradeCost: 150,
    rents: makeRents(300),
    iconKey: 'relic'
  }),
  city(16, 'Hà Nội', 260, 'purple'),
  special(17, 'BLESSING', 'Khí Vận', { iconKey: 'blessing' }),
  city(18, 'Hải Dương', 280, 'purple'),
  city(19, 'Nam Định', 300, 'purple'),
  special(20, 'PARKING', 'Bãi Đỗ Xe', { iconKey: 'camp' }),
  city(21, 'Thanh Hóa', 320, 'orange'),
  special(22, 'EVENT', 'Cơ Hội', { iconKey: 'event' }),
  city(23, 'Nghệ An', 340, 'orange'),
  city(24, 'Hà Tĩnh', 360, 'orange'),
  special(25, 'TELEPORT', 'Bay Ra Bắc', { iconKey: 'teleport', target: 5 }),
  city(26, 'Đà Nẵng', 380, 'blue'),
  special(27, 'BLESSING', 'Khí Vận', { iconKey: 'blessing' }),
  special(28, 'RELIC', 'Phố Cổ Hội An', {
    price: 400,
    upgradeCost: 200,
    rents: makeRents(400),
    iconKey: 'relic'
  }),
  city(29, 'Nha Trang', 400, 'blue'),
  special(30, 'GO_TO_JAIL', 'Về Tạm Giam', { iconKey: 'jail' }),
  city(31, 'Đà Lạt', 420, 'red'),
  city(32, 'Vũng Tàu', 450, 'red'),
  special(33, 'EVENT', 'Cơ Hội', { iconKey: 'event' }),
  city(34, 'Phan Thiết', 480, 'red'),
  special(35, 'RELIC', 'Đền Hùng', {
    price: 500,
    upgradeCost: 250,
    rents: makeRents(500),
    iconKey: 'relic'
  }),
  special(36, 'BLESSING', 'Khí Vận', { iconKey: 'blessing' }),
  city(37, 'Cần Thơ', 520, 'yellow'),
  special(38, 'TAX', 'Thuế Tài Sản', { iconKey: 'tax', taxRate: 0.15, taxMin: 80, taxMax: 350 }),
  city(39, 'Sài Gòn', 560, 'yellow')
];

export const EVENTS = [
  {
    id: 1,
    speaker: 'Nhân Viên Trạm Thu Phí',
    title: 'Trạm Thu Phí BOT',
    desc: 'Xe bạn vừa cán vạch, nhân viên chặn lại đòi kiểm tra vé tháng.',
    safeLabel: 'Mua vé 40g',
    safeCost: 40,
    rollLabel: 'Nài cho qua',
    dc: 10,
    passText: 'Bạn nói có lý, trạm mỉm cười cho qua không mất đồng nào.',
    passGold: 0,
    failText: 'Bị lập biên bản, phải về phường làm việc nên bị tạm giam!',
    failJail: true
  },
  {
    id: 2,
    speaker: 'Chủ Đề Đầu Ngõ',
    title: 'Canh Bạc Lô Đề',
    desc: 'Chiếu lô ngoài quán nước đang lên cơn, một ván ăn cả ngã về không.',
    safeLabel: 'Lắc đầu bỏ đi',
    safeCost: 0,
    rollLabel: 'Ôm số 60g',
    dc: 12,
    passText: 'Trúng độc đắc! Bạn ẵm 150g tiền thắng.',
    passGold: 150,
    failCost: 60,
    failText: 'Trật lất, mất 60g cho đám lô đề.'
  },
  {
    id: 3,
    speaker: 'Trưởng Nhóm Bán Hàng Online',
    title: 'Cơn Sốt Hàng Xách Tay',
    desc: 'Kèo sale sập sàn rủ bạn ôm một lô hàng về bán dịp Tết.',
    safeLabel: 'Rút vốn 50g',
    safeCost: 50,
    rollLabel: 'Liều ôm hàng',
    dc: 13,
    passText: 'Cháy hàng trong ba ngày, bạn lãi đậm 160g.',
    passGold: 160,
    failCost: 70,
    failText: 'Hàng nằm kho, bạn đốt 70g tiền vốn vào phí ship.'
  },
  {
    id: 4,
    speaker: 'Bà Ve Chai Đầu Xóm',
    title: 'Két Sắt Không Chủ',
    desc: 'Chiếc két sắt cũ bị đem đi ve chai, khóa chưa kịp bẻ.',
    safeLabel: 'Coi như không thấy',
    safeCost: 0,
    rollLabel: 'Thử mở két',
    dc: 11,
    passText: 'Két bật tung! Bên trong là xấp tiền 180g.',
    passGold: 180,
    failCost: 80,
    failText: 'Két rỗng không, lại còn bị chủ nhà bắt đền 80g.'
  },
  {
    id: 5,
    speaker: 'Ban Phòng Chống Thiên Tai',
    title: 'Bão Số 3 Sắp Về',
    desc: 'Loa phường phát lệnh khẩn: gia cố mái nhà hoặc đóng quỹ cứu hộ.',
    safeLabel: 'Ủng hộ cứu trợ 80g',
    safeCost: 80,
    rollLabel: 'Cùng làng chống bão',
    dc: 15,
    passText: 'Nhà bạn trụ vững, huyện cấp 250g hỗ trợ tái thiết!',
    passGold: 250,
    failCost: 120,
    failText: 'Bão tốc mái, bạn tốn 120g sửa lại nhà cửa.'
  },
  {
    id: 6,
    speaker: 'Chủ Tiệm Cầm Đồ',
    title: 'Cầm Đèn, Cầm Xe',
    desc: 'Tiền tiêu hết nhẵn, tiệm cầm đồ đầu phố mở cửa chào mời.',
    safeLabel: 'Cầm đồ, mất 60g',
    safeCost: 60,
    rollLabel: 'Đi vay bạn bè',
    dc: 12,
    passText: 'Bạn bè thương tình cho xoay 140g.',
    passGold: 140,
    failCost: 70,
    failText: 'Chủ tiệm xiết luôn chiếc xe, bạn lỗ 70g.'
  }
];

export const BLESSINGS = [
  {
    id: 1,
    god: 'Thần Tài',
    title: 'Ngày Vía Thần Tài',
    desc: 'Mùng 10 tháng Giêng, người người xếp hàng mua vàng lấy may.',
    dc: 9,
    passGold: 80,
    failCost: 20
  },
  {
    id: 2,
    god: 'Ông Địa',
    title: 'Khấn Ông Địa',
    desc: 'Bàn thờ ông Địa trước hiên nhà còn cắm ba nén nhang.',
    dc: 10,
    passGold: 100,
    failCost: 30
  },
  {
    id: 3,
    god: 'Bà Chúa Xứ',
    title: 'Cầu Tại Miếu Bà',
    desc: 'Lễ hội vía Bà Chúa Xứ, ai tin thành tâm thì cầu được ước thấy.',
    dc: 11,
    passGold: 140,
    failCost: 40
  },
  {
    id: 4,
    god: 'Ông Công Ông Táo',
    title: 'Cúng Ông Táo',
    desc: 'Hăm ba tháng Chạp, đưa ông Táo về trời tâu chuyện cả năm.',
    dc: 8,
    passGold: 60,
    failCost: 0
  },
  {
    id: 5,
    god: 'Quan Công',
    title: 'Xin Quan Công Độ Trì',
    desc: 'Dân buôn khấn Ông Vân Trường để giữ trọn chữ tín.',
    dc: 10,
    passGold: 110,
    failCost: 35
  },
  {
    id: 6,
    god: 'Cửu Thiên Huyền Nữ',
    title: 'Lá thăm Giải Hạn',
    desc: 'Thẻ bảo bạn đang gặp hạn, giải được thì đổi vận ngay.',
    dc: 14,
    passGold: 200,
    failCost: 60
  }
];
