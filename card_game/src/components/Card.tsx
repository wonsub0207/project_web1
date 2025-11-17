import React from 'react'
import './Card.css'

type Props = {
  index: number
  value: string
  isFlipped: boolean
  isMatched: boolean
  onClick: () => void
}

const Card: React.FC<Props> = ({ value, isFlipped, onClick }) => {
  return (
    <div className="card-wrapper">
      <button
        className={"card" + (isFlipped ? ' flipped' : '')}
        onClick={onClick}
        aria-label={isFlipped ? `card ${value}` : 'card back'}
      >
        <div className="front">{value}</div>
        <div className="back">?</div>
      </button>
    </div>
  )
}

export default Card
