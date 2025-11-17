import type { Card as CardType } from '../types';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick: (card: CardType) => void;
}

export function Card({ card, onClick }: CardProps) {
  return (
    <button
      className={`card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
      onClick={() => onClick(card)}
      disabled={card.isMatched || card.isFlipped}
    >
      <div className="card-inner">
        <div className="card-front">?</div>
        <div className="card-back">{card.value}</div>
      </div>
    </button>
  );
}
