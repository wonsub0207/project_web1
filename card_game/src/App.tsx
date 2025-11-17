import { useState, useEffect } from 'react'
import type { Card } from './types'
import { GameBoard } from './components/GameBoard'
import { GameStats } from './components/GameStats'
import { createCards, checkMatch } from './utils/gameUtils'
import './App.css'

function App() {
  const [cards, setCards] = useState<Card[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [firstCard, setFirstCard] = useState<Card | null>(null)
  const [secondCard, setSecondCard] = useState<Card | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  // 게임 초기화
  useEffect(() => {
    initializeGame()
  }, [])

  // 두 카드가 모두 선택되었을 때 처리
  useEffect(() => {
    if (firstCard && secondCard) {
      handleCardMatch()
    }
  }, [firstCard, secondCard])

  // 게임 완료 확인
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched) && cards.length > 0) {
      setGameOver(true)
    }
  }, [cards])

  function initializeGame() {
    const newCards = createCards()
    setCards(newCards)
    setMoves(0)
    setMatches(0)
    setFirstCard(null)
    setSecondCard(null)
    setIsLocked(false)
    setGameOver(false)
  }

  function handleCardClick(clickedCard: Card) {
    // 이미 매칭된 카드나 같은 카드를 클릭했다면 무시
    if (clickedCard.isMatched || isLocked || clickedCard === firstCard) return

    // 첫 번째 카드 선택
    if (!firstCard) {
      const updatedCards = cards.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
      setCards(updatedCards)
      setFirstCard(clickedCard)
      return
    }

    // 두 번째 카드 선택
    if (clickedCard.id !== firstCard.id) {
      const updatedCards = cards.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
      setCards(updatedCards)
      setSecondCard(clickedCard)
      setIsLocked(true)
    }
  }

  function handleCardMatch() {
    if (!firstCard || !secondCard) return

    const isMatch = checkMatch(firstCard.value, secondCard.value)

    if (isMatch) {
      // 매칭 성공
      const updatedCards = cards.map(card =>
        card.id === firstCard.id || card.id === secondCard.id
          ? { ...card, isMatched: true }
          : card
      )
      setCards(updatedCards)
      setMatches(matches + 1)
      resetCards()
    } else {
      // 매칭 실패
      setTimeout(() => {
        const updatedCards = cards.map(card =>
          card.id === firstCard.id || card.id === secondCard.id
            ? { ...card, isFlipped: false }
            : card
        )
        setCards(updatedCards)
        resetCards()
      }, 1000)
    }

    setMoves(moves + 1)
  }

  function resetCards() {
    setFirstCard(null)
    setSecondCard(null)
    setIsLocked(false)
  }

  return (
    <div className="app">
      <h1>🎮 카드 뒤집어 맞추기</h1>
      <GameStats 
        moves={moves}
        matches={matches}
        totalMatches={cards.length / 2}
      />
      <GameBoard cards={cards} onCardClick={handleCardClick} />
      
      {gameOver && (
        <div className="game-over">
          <div className="game-over-content">
            <h2>게임 완료!</h2>
            <p>{moves}번의 이동으로 완료했습니다!</p>
            <button onClick={initializeGame} className="restart-button">
              다시 시작
            </button>
          </div>
        </div>
      )}

      <button onClick={initializeGame} className="reset-button">
        게임 리셋
      </button>
    </div>
  )
}

export default App
