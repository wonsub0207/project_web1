export interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameState {
  cards: Card[];
  moves: number;
  matches: number;
  firstCard: Card | null;
  secondCard: Card | null;
  isLocked: boolean;
  gameOver: boolean;
}
