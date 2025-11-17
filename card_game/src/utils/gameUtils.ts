import type { Card } from '../types';

export function createCards(): Card[] {
  const pairs = ['🍎', '🍌', '🍊', '🍋', '🍒', '🍓', '🍑', '🍉'];
  const allCards: Card[] = [];

  // 각 쌍을 2번 반복해서 16개의 카드 생성
  pairs.forEach((value, index) => {
    allCards.push({
      id: index * 2,
      value,
      isFlipped: false,
      isMatched: false,
    });
    allCards.push({
      id: index * 2 + 1,
      value,
      isFlipped: false,
      isMatched: false,
    });
  });

  // 카드 섞기
  return shuffleCards(allCards);
}

export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function checkMatch(firstValue: string, secondValue: string): boolean {
  return firstValue === secondValue;
}
