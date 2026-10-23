import { sortCards } from './deck';

export const COMBO_TYPES = {
  INVALID: 'INVALID',
  SINGLE: 'SINGLE',
  PAIR: 'PAIR',
  TRIPLE: 'TRIPLE',
  FOUR_OF_A_KIND: 'FOUR_OF_A_KIND',
  STRAIGHT: 'STRAIGHT',
  THREE_PAIRS_SERIES: 'THREE_PAIRS_SERIES',
  FOUR_PAIRS_SERIES: 'FOUR_PAIRS_SERIES'
};

// Phân tích bộ bài người chơi vừa chọn
export function detectCombo(rawCards, mode = 'TLMN') {
  if (!rawCards || rawCards.length === 0) return { type: COMBO_TYPES.INVALID };
  const cards = sortCards(rawCards);
  const len = cards.length;

  // 1. Cốc / Rác
  if (len === 1) {
    return { type: COMBO_TYPES.SINGLE, highest: cards[0], count: 1 };
  }

  // 2. Đôi
  if (len === 2) {
    if (cards[0].rankValue === cards[1].rankValue) {
      // Miền Bắc: Đôi phải đồng màu (Cùng đỏ hoặc Cùng đen)
      if (mode === 'TLMB' && cards[0].suitColor !== cards[1].suitColor) {
        return { type: COMBO_TYPES.INVALID };
      }
      return { type: COMBO_TYPES.PAIR, highest: cards[1], count: 2 };
    }
    return { type: COMBO_TYPES.INVALID };
  }

  // 3. Sám cô (Ba lá cùng giá trị)
  if (len === 3 && cards[0].rankValue === cards[1].rankValue && cards[1].rankValue === cards[2].rankValue) {
    return { type: COMBO_TYPES.TRIPLE, highest: cards[2], count: 3 };
  }

  // 4. Tứ quý
  if (len === 4 && cards[0].rankValue === cards[1].rankValue && cards[1].rankValue === cards[2].rankValue && cards[2].rankValue === cards[3].rankValue) {
    return { type: COMBO_TYPES.FOUR_OF_A_KIND, highest: cards[3], count: 4 };
  }

  // 5. Sảnh (3 lá trở lên liên tiếp, không chứa lá 2)
  const containsTwo = cards.some(c => c.rankValue === 15);
  if (!containsTwo && len >= 3) {
    let isSequence = true;
    for (let i = 0; i < len - 1; i++) {
      if (cards[i + 1].rankValue !== cards[i].rankValue + 1) {
        isSequence = false;
        break;
      }
    }

    if (isSequence) {
      // Miền Bắc: Sảnh phải ĐỒNG CHẤT (cùng ♠, ♣, ♦, hoặc ♥)
      if (mode === 'TLMB') {
        const firstSuit = cards[0].suitSymbol;
        const sameSuit = cards.every(c => c.suitSymbol === firstSuit);
        if (!sameSuit) return { type: COMBO_TYPES.INVALID };
      }
      return { type: COMBO_TYPES.STRAIGHT, highest: cards[len - 1], count: len };
    }
  }

  // Các bộ Hàng (Chỉ áp dụng đầy đủ ở TLMN)
  if (mode === 'TLMN') {
    // 3 Đôi thông (6 lá)
    if (len === 6 && isPairsSeries(cards, 3)) {
      return { type: COMBO_TYPES.THREE_PAIRS_SERIES, highest: cards[5], count: 6 };
    }
    // 4 Đôi thông (8 lá)
    if (len === 8 && isPairsSeries(cards, 4)) {
      return { type: COMBO_TYPES.FOUR_PAIRS_SERIES, highest: cards[7], count: 8 };
    }
  }

  return { type: COMBO_TYPES.INVALID };
}

// Kiểm tra xem bài ra có đè được bài trên bàn hay không
export function canBeat(playedCards, lastPlayed, mode = 'TLMN') {
  const newCombo = detectCombo(playedCards, mode);
  if (newCombo.type === COMBO_TYPES.INVALID) return false;

  // Bàn ăn chưa có bài -> Đánh tự do
  if (!lastPlayed || !lastPlayed.combo || lastPlayed.cards.length === 0) return true;

  const oldCombo = lastPlayed.combo;

  // --- CƠ CHẾ CHẶT (CHOPPING) CỦA TIẾN LÊN MIỀN NAM ---
  if (mode === 'TLMN') {
    // Chặt 1 Heo (2)
    if (oldCombo.type === COMBO_TYPES.SINGLE && oldCombo.highest.rankValue === 15) {
      if (newCombo.type === COMBO_TYPES.THREE_PAIRS_SERIES) return true;
      if (newCombo.type === COMBO_TYPES.FOUR_OF_A_KIND) return true;
      if (newCombo.type === COMBO_TYPES.FOUR_PAIRS_SERIES) return true;
    }
    // Chặt Đôi Heo (Đôi 2)
    if (oldCombo.type === COMBO_TYPES.PAIR && oldCombo.highest.rankValue === 15) {
      if (newCombo.type === COMBO_TYPES.FOUR_OF_A_KIND) return true;
      if (newCombo.type === COMBO_TYPES.FOUR_PAIRS_SERIES) return true;
    }
    // Chặt 3 Đôi thông
    if (oldCombo.type === COMBO_TYPES.THREE_PAIRS_SERIES) {
      if (newCombo.type === COMBO_TYPES.THREE_PAIRS_SERIES && newCombo.highest.totalValue > oldCombo.highest.totalValue) return true;
      if (newCombo.type === COMBO_TYPES.FOUR_OF_A_KIND) return true;
      if (newCombo.type === COMBO_TYPES.FOUR_PAIRS_SERIES) return true;
    }
    // Chặt Tứ quý
    if (oldCombo.type === COMBO_TYPES.FOUR_OF_A_KIND) {
      if (newCombo.type === COMBO_TYPES.FOUR_OF_A_KIND && newCombo.highest.totalValue > oldCombo.highest.totalValue) return true;
      if (newCombo.type === COMBO_TYPES.FOUR_PAIRS_SERIES) return true;
    }
  }

  // --- CƠ CHẾ CHẶT CỦA TIẾN LÊN MIỀN BẮC ---
  if (mode === 'TLMB') {
    // Miền Bắc: Tứ quý chặt được 1 Heo hoặc Tứ quý nhỏ hơn
    if (oldCombo.type === COMBO_TYPES.SINGLE && oldCombo.highest.rankValue === 15) {
      if (newCombo.type === COMBO_TYPES.FOUR_OF_A_KIND) return true;
    }
    if (oldCombo.type === COMBO_TYPES.FOUR_OF_A_KIND && newCombo.type === COMBO_TYPES.FOUR_OF_A_KIND) {
      return newCombo.highest.totalValue > oldCombo.highest.totalValue;
    }
  }

  // --- QUY TẮC ĐÈ THÔNG THƯỜNG (CÙNG KÍCH THƯỚC & CÙNG LOẠI) ---
  if (newCombo.type !== oldCombo.type || newCombo.count !== oldCombo.count) {
    return false;
  }

  // Quy tắc Miền Bắc bổ sung: Đánh rác/sảnh phải CÙNG CHẤT với lá đè
  if (mode === 'TLMB') {
    if (newCombo.type === COMBO_TYPES.SINGLE) {
      // Đè rác trong TLMB bắt buộc phải cùng chất (trừ trường hợp dùng Heo đè lá thường)
      if (oldCombo.highest.rankValue !== 15 && newCombo.highest.rankValue !== 15) {
        if (newCombo.highest.suitSymbol !== oldCombo.highest.suitSymbol) return false;
      }
    }
  }

  // So sánh lá bài cao nhất
  return newCombo.highest.totalValue > oldCombo.highest.totalValue;
}

function isPairsSeries(cards, numPairs) {
  if (cards.length !== numPairs * 2) return false;
  for (let i = 0; i < numPairs; i++) {
    const card1 = cards[i * 2];
    const card2 = cards[i * 2 + 1];
    if (card1.rankValue !== card2.rankValue) return false; // Không tạo thành đôi
    if (card1.rankValue === 15) return false; // Hàng không chứa 2
    if (i > 0) {
      const prevCard = cards[(i - 1) * 2];
      if (card1.rankValue !== prevCard.rankValue + 1) return false; // Không liên tiếp
    }
  }
  return true;
}