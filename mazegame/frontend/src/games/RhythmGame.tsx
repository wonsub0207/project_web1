import React, { useEffect, useRef, useState } from "react";

type NoteStatus = "pending" | "hit" | "miss";

type Note = {
  id: number;
  lane: 0 | 1 | 2;
  y: number;
  status: NoteStatus;
};

const LANES = ["←", "↓", "→"] as const;

const NOTE_SPEED = 320;
const HIT_LINE_Y = 340;
const SPAWN_INTERVAL = 650;
const PERFECT_WINDOW = 28;
const GOOD_WINDOW = 90;
const AUTO_MISS_MARGIN = 40;

const keyToLane: Record<string, 0 | 1 | 2 | null> = {
  ArrowLeft: 0,
  ArrowDown: 1,
  ArrowRight: 2,
};

const RhythmGame: React.FC = () => {
  const [gameState, setGameState] = useState<"menu" | "playing">("menu");
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [judgement, setJudgement] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const lastTimeRef = useRef<number | null>(null);
  const spawnElapsedRef = useRef<number>(0);
  const idRef = useRef(0);

  // -----------------------
  // 게임 시작 함수
  // -----------------------
  const startGame = () => {
    setGameState("playing");
    setNotes([]);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setJudgement("");
    setIsPlaying(true);
    lastTimeRef.current = null;
    spawnElapsedRef.current = 0;
  };

  // -----------------------
  // 메인 루프
  // -----------------------
  useEffect(() => {
    if (!isPlaying) return;
    if (gameState !== "playing") return;

    const frame = (time: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
        requestAnimationFrame(frame);
        return;
      }

      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      spawnElapsedRef.current += dt * 1000;

      // 노트 이동 & MISS
      setNotes((prev) =>
        prev.map((note) => {
          if (note.status !== "pending") return note;
          const newY = note.y + NOTE_SPEED * dt;

          if (newY > HIT_LINE_Y + GOOD_WINDOW + AUTO_MISS_MARGIN) {
            setCombo(0);
            setJudgement("MISS");
            return { ...note, y: newY, status: "miss" };
          }
          return { ...note, y: newY };
        })
      );

      // 노트 생성
      if (spawnElapsedRef.current >= SPAWN_INTERVAL) {
        spawnElapsedRef.current = 0;
        setNotes((prev) => [
          ...prev,
          {
            id: idRef.current++,
            lane: Math.floor(Math.random() * 3) as any,
            y: -40,
            status: "pending",
          },
        ]);
      }

      requestAnimationFrame(frame);
    };

    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, gameState]);

  // -----------------------
  // 키 입력
  // -----------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      const lane = keyToLane[e.key];
      if (lane === null) return;

      setNotes((prev) => {
        const idx = prev.findIndex(
          (n) => n.lane === lane && n.status === "pending"
        );
        if (idx === -1) return prev;

        const target = prev[idx];
        const diff = Math.abs(target.y - HIT_LINE_Y);

        if (diff > GOOD_WINDOW) return prev;

        let judge = "";
        let scoreAdd = 0;

        if (diff <= PERFECT_WINDOW) {
          judge = "PERFECT";
          scoreAdd = 300;
        } else {
          judge = "GOOD";
          scoreAdd = 150;
        }

        const updated = [...prev];
        updated[idx] = { ...target, status: "hit" };

        setJudgement(judge);
        setScore((s) => s + scoreAdd);
        setCombo((c) => {
          const nc = c + 1;
          setMaxCombo((m) => Math.max(m, nc));
          return nc;
        });

        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // -----------------------
  // 다시 시작 버튼 → 메뉴 화면으로
  // -----------------------
  const returnToMenu = () => {
    setGameState("menu");
    setIsPlaying(false);
  };

  // -----------------------
  // 시작 화면 (MENU)
  // -----------------------
  if (gameState === "menu") {
    return (
      <div className="rg-root">
        <h1 className="rg-title">🎵 Rhythm Game</h1>
        <p className="rg-sub">방향키로 즐기는 간단한 리듬게임!</p>

        <button className="rg-button" onClick={startGame}>
          게임 시작
        </button>
      </div>
    );
  }

  // -----------------------
  // 게임 화면
  // -----------------------
  return (
    <div className="rg-root">
      <h1 className="rg-title">🎵 Rhythm Game</h1>

      {/* 상단 정보 */}
      <div className="rg-info-row">
        <div className="rg-info-box"><div className="rg-info-label">Score</div><div className="rg-info-value">{score}</div></div>
        <div className="rg-info-box"><div className="rg-info-label">Combo</div><div className="rg-info-value">{combo}</div></div>
        <div className="rg-info-box"><div className="rg-info-label">Max</div><div className="rg-info-value">{maxCombo}</div></div>
        <div className="rg-info-box">
          <div className="rg-info-label">Judge</div>
          <div className={`rg-judgement rg-judgement-${judgement.toLowerCase()}`}>
            {judgement || "-"}
          </div>
        </div>
      </div>

      {/* 게임 영역 */}
      <div className="rg-play-area">
        <div className="rg-hit-line" style={{ top: HIT_LINE_Y }} />

        <div className="rg-lanes">
          {LANES.map((label, laneIndex) => (
            <div key={laneIndex} className="rg-lane">
              {notes
                .filter((n) => n.lane === laneIndex)
                .map((note) => (
                  <div
                    key={note.id}
                    className={`rg-note rg-note-${note.status}`}
                    style={{ top: note.y }}
                  >
                    ♪
                  </div>
                ))}
              <div className="rg-key-indicator">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rg-bottom">
        <button className="rg-button" onClick={returnToMenu}>
          다시 시작 (처음 화면으로)
        </button>
      </div>
    </div>
  );
};

export default RhythmGame;