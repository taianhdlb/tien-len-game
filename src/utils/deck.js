export const SUITS = [
  { symbol: '♠', name: 'spades', color: 'black', rank: 1 },
  { symbol: '♣', name: 'clubs', color: 'black', rank: 2 },
  { symbol: '♦', name: 'diamonds', color: 'red', rank: 3 },
  { symbol: '♥', name: 'hearts', color: 'red', rank: 4 }
];

export const RANKS = [
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: 'J', value: 11 },
  { label: 'Q', value: 12 },
  { label: 'K', value: 13 },
  { label: 'A', value: 14 },
  { label: '2', value: 15 }
];

export function createDeck() {
  const deck = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({
        id: `${rank.label}-${suit.symbol}`,
        rankLabel: rank.label,
        rankValue: rank.value,
        suitSymbol: suit.symbol,
        suitColor: suit.color,
        suitRank: suit.rank,
        // Tổng điểm dùng để so sánh tuyệt đối (VD: 3♠ = 3*4 + 1 = 13, 2♥ = 15*4 + 4 = 64)
        totalValue: rank.value * 4 + suit.rank
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortCards(cards) {
  return [...cards].sort((a, b) => a.totalValue - b.totalValue);
}