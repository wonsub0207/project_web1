// src/Game2048.tsx
import { useEffect, useState } from "react";
import "./index.css";

type Grid = number[][];

const SIZE = 4;

function createEmptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function getRandomEmptyCell(grid: Grid): [number, number] | null {
  const empty: [number, number][] = [];
  grid.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v === 0) empty.push([x, y]);
    })
  );
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

function addRandomTile(grid: Grid): Grid {
  const pos = getRandomEmptyCell(grid);
  if (!pos) return grid;
  const [x, y] = pos;
  const value = Math.random() < 0.9 ? 2 : 4;
  const next = grid.map((row) => [...row]);
  next[y][x] = value;
  return next;
}

type MoveResult = {
  grid: Grid;
  scoreDelta: number;
  moved: boolean;
};

function compressRow(row: number[]): { row: number[]; scoreDelta: number } {
  // 0 제거 후 왼쪽으로 붙이기
  const filtered = row.filter((v) => v !== 0);
  const result: number[] = [];
  let scoreDelta = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      scoreDelta += merged;
      i++; // 다음 것 스킵
    } else {
      result.push(filtered[i]);
    }
  }

  while (result.length < SIZE) result.push(0);
  return { row: result, scoreDelta };
}

function moveLeft(grid: Grid): MoveResult {
  let moved = false;
  let totalDelta = 0;
  const next: Grid = grid.map((row) => {
    const { row: newRow, scoreDelta } = compressRow(row);
    if (!moved && newRow.some((v, i) => v !== row[i])) moved = true;
    totalDelta += scoreDelta;
    return newRow;
  });
  return { grid: next, scoreDelta: totalDelta, moved };
}

function reverseRow(row: number[]) {
  return [...row].reverse();
}

function transpose(g: Grid): Grid {
  const res: Grid = createEmptyGrid();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      res[x][y] = g[y][x];
    }
  }
  return res;
}

function moveRight(grid: Grid): MoveResult {
  const reversed = grid.map(reverseRow);
  const { grid: movedGrid, scoreDelta, moved } = moveLeft(reversed);
  return {
    grid: movedGrid.map(reverseRow),
    scoreDelta,
    moved,
  };
}

function moveUp(grid: Grid): MoveResult {
  const t = transpose(grid);
  const { grid: movedT, scoreDelta, moved } = moveLeft(t);
  return { grid: transpose(movedT), scoreDelta, moved };
}

function moveDown(grid: Grid): MoveResult {
  const t = transpose(grid);
  const { grid: movedT, scoreDelta, moved } = moveRight(t);
  return { grid: transpose(movedT), scoreDelta, moved };
}

function hasMoves(grid: Grid): boolean {
  // 빈 칸 있으면 가능
  if (grid.some((row) => row.some((v) => v === 0))) return true;

  // 인접한 같은 숫자 있으면 가능
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = grid[y][x];
      if (x + 1 < SIZE && grid[y][x + 1] === v) return true;
      if (y + 1 < SIZE && grid[y + 1][x] === v) return true;
    }
  }
  return false;
}

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(() =>
    addRandomTile(addRandomTile(createEmptyGrid()))
  );
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => {
    const stored = localStorage.getItem("best_2048");
    return stored ? Number(stored) || 0 : 0;
  });
  const [status, setStatus] = useState<"playing" | "won" | "over">("playing");
  const [cellPx, setCellPx] = useState(80); // 화면 크기 조절용

  useEffect(() => {
    localStorage.setItem("best_2048", String(best));
  }, [best]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (status !== "playing") return;

      let result: MoveResult | null = null;
      if (["ArrowLeft", "a", "A"].includes(e.key)) result = moveLeft(grid);
      else if (["ArrowRight", "d", "D"].includes(e.key)) result = moveRight(grid);
      else if (["ArrowUp", "w", "W"].includes(e.key)) result = moveUp(grid);
      else if (["ArrowDown", "s", "S"].includes(e.key)) result = moveDown(grid);

      if (!result) return;
      e.preventDefault();

      if (result.moved) {
        const withNewTile = addRandomTile(result.grid);
        setGrid(withNewTile);
        setScore((s) => {
          const next = s + result!.scoreDelta;
          if (next > best) setBest(next);
          return next;
        });

        if (!hasMoves(withNewTile)) {
          setStatus("over");
        } else if (
          withNewTile.some((row) => row.some((v) => v >= 2048)) &&
          status === "playing"
        ) {
          setStatus("won");
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [grid, status, best]);

  const reset = () => {
    setGrid(addRandomTile(addRandomTile(createEmptyGrid())));
    setScore(0);
    setStatus("playing");
  };

  return (
    <div className="min-h-[70vh] flex flex-col gap-4">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">2048 게임</h2>
          <p className="text-slate-300 text-sm">
            같은 숫자 타일을 합쳐서 <span className="font-semibold">2048</span>을
            만들어 보세요. (WASD / 방향키)
          </p>
          {status === "won" && (
            <p className="mt-2 text-emerald-400 text-sm font-semibold">
              🎉 2048 달성! 계속 플레이하거나 새 게임을 시작할 수 있어요.
            </p>
          )}
          {status === "over" && (
            <p className="mt-2 text-rose-400 text-sm font-semibold">
              💀 더 이상 움직일 수 없어요. 새 게임으로 다시 도전!
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <ScoreBox label="SCORE" value={score} />
            <ScoreBox label="BEST" value={best} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-300 flex items-center gap-2">
              타일 크기
              <input
                type="range"
                min={60}
                max={110}
                value={cellPx}
                onChange={(e) => setCellPx(Number(e.target.value))}
              />
            </label>
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
            >
              새 게임
            </button>
          </div>
        </div>
      </header>

      {/* 보드 컨테이너 */}
      <div className="inline-block rounded-2xl bg-slate-900 p-4 shadow-lg ring-1 ring-white/5">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${SIZE}, ${cellPx}px)`,
          }}
        >
          {grid.map((row, y) =>
            row.map((value, x) => (
              <div
                key={`${x}-${y}`}
                className={`flex items-center justify-center rounded-xl font-bold text-2xl transition-all
                ${
                  value === 0
                    ? "bg-slate-800 text-slate-600"
                    : value <= 4
                    ? "bg-amber-100 text-amber-800"
                    : value <= 16
                    ? "bg-amber-300 text-amber-900"
                    : value <= 64
                    ? "bg-orange-400 text-white"
                    : value <= 256
                    ? "bg-orange-500 text-white"
                    : value <= 1024
                    ? "bg-rose-500 text-white"
                    : "bg-emerald-500 text-white"
                }`}
                style={{ width: cellPx, height: cellPx }}
              >
                {value === 0 ? "" : value}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Controls: 방향키 / WASD — 같은 숫자를 합치면 점수가 올라가요.
      </p>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-slate-800 text-right min-w-[90px]">
      <div className="text-[10px] tracking-wide text-slate-400 font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold text-slate-50">{value}</div>
    </div>
  );
}
