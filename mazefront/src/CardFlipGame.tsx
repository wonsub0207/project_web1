// src/CardFlipGame.tsx
import { useState, useEffect } from "react";
import "./index.css";

type Card = {
  id: number;
  symbol: string;
  isMatched: boolean;
};

const EMOJIS = ["🍎", "🍌", "🍇", "🍉", "🍒", "🍋", "🥝", "🍑"]; // 8쌍 → 4x4

function createDeck(): Card[] {
  const base = EMOJIS.slice(0, 8);
  const doubled = [...base, ...base]; // 짝 맞추기 위해 2장씩
  const shuffled = [...doubled].sort(() => Math.random() - 0.5); // 섞기
  return shuffled.map((symbol, index) => ({
    id: index,
    symbol,
    isMatched: false,
  }));
}

export default function CardFlipGame() {
  const [cards, setCards] = useState<Card[]>(() => createDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [playerName, setPlayerName] = useState<string>(
    () => localStorage.getItem("card_name") || ""
  );
  const [cardPx, setCardPx] = useState(90); // 카드 한 변 길이(px)

  const totalPairs = cards.length / 2;

  // 타이머
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // 전부 맞추면 자동으로 타이머 정지
  useEffect(() => {
    if (matches === totalPairs && totalPairs > 0) {
      setRunning(false);
    }
  }, [matches, totalPairs]);

  const handleCardClick = (index: number) => {
    if (!running && matches === 0 && moves === 0) {
      setRunning(true); // 첫 클릭에서 타이머 시작
    }

    if (cards[index].isMatched) return;
    if (selected.includes(index)) return;
    if (selected.length === 2) return;

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [i1, i2] = newSelected;
      const c1 = cards[i1];
      const c2 = cards[i2];

      if (c1.symbol === c2.symbol) {
        // 매치 성공
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[i1] = { ...next[i1], isMatched: true };
            next[i2] = { ...next[i2], isMatched: true };
            return next;
          });
          setSelected([]);
          setMatches((m) => m + 1);
        }, 400);
      } else {
        // 실패 → 잠깐 보여주고 다시 뒤집기
        setTimeout(() => {
          setSelected([]);
        }, 650);
      }
    }
  };

  const resetGame = () => {
    setCards(createDeck());
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setSeconds(0);
    setRunning(false);
    if (playerName) {
      localStorage.setItem("card_name", playerName);
    }
  };

  const gameFinished = matches === totalPairs && totalPairs > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* 상단 헤더 / 컨트롤 영역 */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">카드 뒤집기 게임</h1>
            <p className="text-slate-300 text-sm">
              같은 이모지를 가진 카드 두 장을 찾아서 모두 맞춰 보세요!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              placeholder="이름 (선택)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="px-3 py-1.5 rounded-2xl bg-slate-800 outline-none text-sm"
            />
            <button
              onClick={resetGame}
              className="px-3 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
            >
              새 게임
            </button>
            <label className="px-3 py-1.5 rounded-2xl bg-slate-800 text-xs flex items-center gap-2 cursor-pointer">
              카드 크기 {cardPx}px
              <input
                type="range"
                min={60}
                max={120}
                value={cardPx}
                onChange={(e) => setCardPx(Number(e.target.value))}
                className="w-28 align-middle"
              />
            </label>
          </div>
        </header>

        {/* 상태 바 */}
        <div className="flex flex-wrap gap-3 text-sm">
          <InfoBox label="시간" value={`${seconds}s`} />
          <InfoBox label="이동 횟수" value={`${moves}번`} />
          <InfoBox label="맞춘 쌍" value={`${matches}/${totalPairs}`} />
          {gameFinished && (
            <span className="text-emerald-400 text-sm font-semibold">
              🎉 전부 맞췄어요! 새 게임 버튼으로 다시 시작해 보세요.
            </span>
          )}
        </div>

        {/* 카드 보드 영역 - 폭 제한 & 중앙 정렬 */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-slate-900 p-4 shadow-lg ring-1 ring-white/5 inline-block">
            <div className="grid grid-cols-4 gap-3">
              {cards.map((card, index) => {
                const isOpen = card.isMatched || selected.includes(index);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(index)}
                    style={{
                      width: cardPx,
                      height: cardPx,
                      fontSize: cardPx * 0.55,
                    }}
                    className={`rounded-xl flex items-center justify-center font-bold transition select-none
                      ${
                        isOpen
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                      } ${
                      card.isMatched ? "ring-2 ring-emerald-300 shadow-lg" : ""
                    }`}
                  >
                    {isOpen ? card.symbol : "?"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  );
}
