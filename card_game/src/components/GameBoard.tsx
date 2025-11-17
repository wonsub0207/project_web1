import type { Card } from '../types';
import { Card as CardComponent } from './Card';
import './GameBoard.css';

interface GameBoardProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
}

export function GameBoard({ cards, onCardClick }: GameBoardProps) {
  return (
    <div className="game-board">
      {cards.map((card) => (
        <CardComponent
          key={card.id}
          card={card}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
