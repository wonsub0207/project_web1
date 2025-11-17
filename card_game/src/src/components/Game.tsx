import React, { useEffect, useState } from 'react'
import './Game.css'
import Card from './Card.tsx'

type CardType = {
  uid: number
  value: string
  isMatched: boolean
}

const EMOJIS = ['🍎', '🍊', '🍇', '🍓', '🍌', '🥝', '🍍', '🍑']

function shuffle<T>(array: T[]) {
  const a = array.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function createDeck(): CardType[] {
  const deck: CardType[] = []
  EMOJIS.forEach((emoji, i) => {
    deck.push({ uid: i * 2, value: emoji, isMatched: false })
    deck.push({ uid: i * 2 + 1, value: emoji, isMatched: false })
  })
  return shuffle(deck)
}

const Game: React.FC = () => {
  const [cards, setCards] = useState<CardType[]>(() => createDeck())
  const [flipped, setFlipped] = useState<number[]>([])
  const [disabled, setDisabled] = useState(false)
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)

  useEffect(() => {
    if (matches === EMOJIS.length) {
      // all matched
    }
  }, [matches])

  const handleClick = (index: number) => {
    if (disabled) return
    if (flipped.includes(index)) return
    if (cards[index].isMatched) return

    if (flipped.length === 0) {
      setFlipped([index])
      return
    }

    if (flipped.length === 1) {
      const firstIndex = flipped[0]
      const secondIndex = index
      setFlipped([firstIndex, secondIndex])
      setDisabled(true)

      setTimeout(() => {
        const firstCard = cards[firstIndex]
        const secondCard = cards[secondIndex]
        if (firstCard.value === secondCard.value) {
          const newCards = cards.map((c, idx) =>
            idx === firstIndex || idx === secondIndex ? { ...c, isMatched: true } : c
          )
          setCards(newCards)
          setMatches((m) => m + 1)
        }
        setFlipped([])
        setDisabled(false)
        setMoves((m) => m + 1)
      }, 700)
    }
  }

  const handleRestart = () => {
    setCards(createDeck())
    setFlipped([])
    setDisabled(false)
    setMoves(0)
    setMatches(0)
  }

  return (
    <div className="game-container">
      <div className="controls">
        <div>Moves: {moves}</div>
        <div>Matches: {matches} / {EMOJIS.length}</div>
        <button onClick={handleRestart}>Restart</button>
      </div>

      <div className="grid">
        {cards.map((c, idx) => (
          <Card
            key={c.uid}
            index={idx}
            value={c.value}
            isFlipped={flipped.includes(idx) || c.isMatched}
            isMatched={c.isMatched}
            onClick={() => handleClick(idx)}
          />
        ))}
      </div>

      {matches === EMOJIS.length && (
        <div className="win">🎉 모두 맞추셨습니다! Moves: {moves}</div>
      )}
    </div>
  )
}

export default Game
