import React, { useEffect, useRef, useState, useCallback } from "react";
import './index.css';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";
const DEFAULT_W = 21;
const DEFAULT_H = 21;

export default function MazeGameExpress() {
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [goal, setGoal] = useState<{ x: number; y: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cellPx, setCellPx] = useState(24);
  const [seed, setSeed] = useState<string>("");
  const [width, setWidth] = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  const [status, setStatus] = useState("Ready");
  const [name, setName] = useState<string>(() => localStorage.getItem("maze_name") || "");
  const [board, setBoard] = useState<Array<{id:number; name:string|null; seed:string; steps:number; elapsed:number; created_at:string;}>>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dirty = useRef(true);
  const startTs = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  const fetchMaze = useCallback(async (w: number, h: number, s: string) => {
    const url = `${API_BASE}/maze?width=${w}&height=${h}&seed=${encodeURIComponent(s)}`;
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Maze API ${res.status}`);
    return (await res.json()) as { grid:number[][]; start:{x:number;y:number}; goal:{x:number;y:number} };
  }, []);

  const load = useCallback(async (opts?: { w?: number; h?: number; s?: string }) => {
    const w = opts?.w ?? width;
    const h = opts?.h ?? height;
    const s = opts?.s ?? `${Date.now()}`;
    setStatus("Loading maze…");
    try {
      const m = await fetchMaze(w, h, s);
      setGrid(m.grid);
      setStart(m.start);
      setGoal(m.goal);
      setPos({ ...m.start });
      setSteps(0);
      setElapsed(0);
      setSeed(s);
      setWidth(w);
      setHeight(h);
      setStatus("Ready. Press ▶");
      dirty.current = true;
    } catch (e:any) {
      setStatus(`Maze load failed: ${e?.message || e}`);
    }
  }, [fetchMaze, width, height]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!grid || !pos || !running) return;
      const map: Record<string, [number, number]> = {
        ArrowUp: [0,-1], w: [0,-1], W: [0,-1],
        ArrowDown: [0,1], s: [0,1], S: [0,1],
        ArrowLeft: [-1,0], a: [-1,0], A: [-1,0],
        ArrowRight: [1,0], d: [1,0], D: [1,0],
      };
      const mv = map[e.key];
      if (!mv) return;
      e.preventDefault();
      const nx = pos.x + mv[0];
      const ny = pos.y + mv[1];
      if (grid[ny] && grid[ny][nx] === 0) {
        setPos({ x: nx, y: ny });
        setSteps(s => s + 1);
        dirty.current = true;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grid, pos, running]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      if (!ctx || !grid || !pos || !start || !goal) return;
      const w = grid[0].length, h = grid.length;
      const cw = w * cellPx, ch = h * cellPx;
      if (canvasRef.current) {
        if (canvasRef.current.width !== cw) canvasRef.current.width = cw;
        if (canvasRef.current.height !== ch) canvasRef.current.height = ch;
        canvasRef.current.style.width = `${cw}px`;
        canvasRef.current.style.height = `${ch}px`;
      }
      ctx.clearRect(0, 0, cw, ch);
      for (let y=0;y<h;y++) {
        for (let x=0;x<w;x++) {
          const px = x * cellPx, py = y * cellPx;
          if (grid[y][x] === 1) {
            ctx.fillStyle = "#1e293b";
          } else {
            ctx.fillStyle = "#e2e8f0";
          }
          ctx.fillRect(px, py, cellPx, cellPx);
        }
      }
      const dot = (x:number,y:number,color:string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x*cellPx+cellPx/2, y*cellPx+cellPx/2, cellPx*0.35, 0, Math.PI*2);
        ctx.fill();
      };
      dot(start.x,start.y,"#22c55e");
      dot(goal.x,goal.y,"#ef4444");
      dot(pos.x,pos.y,"#60a5fa");
      dirty.current = false;
    };

    const tick = () => {
      if (running) {
        if (startTs.current == null) startTs.current = now();
        const ms = now() - (startTs.current || now());
        setElapsed(Math.floor(ms/1000));
      }
      if (dirty.current) paint();
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [grid, pos, start, goal, cellPx, running]);

  useEffect(() => {
    if (!running || !pos || !goal) return;
    if (pos.x === goal.x && pos.y === goal.y) {
      setRunning(false);
      setStatus("🎉 Goal! Submitting score…");
      (async () => {
        try {
          if (name) localStorage.setItem("maze_name", name);
          await fetch(`${API_BASE}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seed, steps, elapsed, name: name || null }),
            mode: "cors",
          });
          setStatus("Score submitted ✔");
          refreshBoard();
        } catch (e:any) {
          setStatus(`Goal! (submit failed: ${e?.message || e})`);
        }
      })();
    }
  }, [pos, goal, running, seed, steps, elapsed, name]);

  const refreshBoard = useCallback(async () => {
    try {
      setBoardLoading(true);
      const res = await fetch(`${API_BASE}/leaderboard?seed=${encodeURIComponent(seed)}&limit=20`,{mode:"cors"});
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setBoard(data.items || []);
    } catch (e) {
    } finally {
      setBoardLoading(false);
    }
  }, [seed]);

  useEffect(() => { if (seed) refreshBoard(); }, [seed]);

  const startGame = () => {
    if (!grid || !start) return;
    setPos({ ...start });
    setSteps(0);
    setElapsed(0);
    startTs.current = now();
    setRunning(true);
    setStatus("Find the red goal! (WASD/Arrows)");
    dirty.current = true;
  };
  const stopGame = () => { setRunning(false); setStatus("Paused"); };
  const newMaze = async () => {
    const w = Number(prompt("Width (odd)", String(width)) || width);
    const h = Number(prompt("Height (odd)", String(height)) || height);
    const s = String(prompt("Seed (any)", `${Date.now()}`) || `${Date.now()}`);
    await load({ w, h, s });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Maze Game (Express)</h1>
          <div className="flex gap-2 items-center">
            <input
              placeholder="Your name (optional)"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              className="px-3 py-1.5 rounded-2xl bg-slate-800 outline-none"
            />
            <button onClick={newMaze} className="px-3 py-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700">New Maze</button>
            {!running ? (
              <button onClick={startGame} className="px-3 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500">▶ Start</button>
            ) : (
              <button onClick={stopGame} className="px-3 py-1.5 rounded-2xl bg-amber-600 hover:bg-amber-500">⏸ Pause</button>
            )}
            <label className="px-3 py-1.5 rounded-2xl bg-slate-800 cursor-pointer">
              Cell {cellPx}px
              <input
                type="range"
                min={12}
                max={40}
                value={cellPx}
                onChange={(e) => { setCellPx(Number(e.target.value)); dirty.current = true; }}
                className="ml-2 align-middle"
              />
            </label>
          </div>
        </header>

        <section className="grid grid-cols-4 gap-4">
          <div className="col-span-3 space-y-3">
            <StatsBar seed={seed} steps={steps} elapsed={elapsed} />
            <div className="rounded-2xl overflow-auto shadow-lg ring-1 ring-white/5 bg-slate-900">
              <canvas ref={canvasRef} className="block" />
            </div>
            <p className="text-sm text-slate-300">{status}</p>
            <p className="text-xs text-slate-400">API: <code>{API_BASE}</code> — Controls: WASD / Arrows</p>
          </div>

          <aside className="col-span-1">
            <div className="p-3 rounded-2xl bg-slate-900 mb-2 flex items-center justify-between">
              <div className="font-semibold">Leaderboard</div>
              <button className="text-xs px-2 py-1 rounded bg-slate-800" onClick={refreshBoard} disabled={boardLoading}>
                {boardLoading ? "…" : "Refresh"}
              </button>
            </div>
            <div className="rounded-2xl bg-slate-900 max-h-[420px] overflow-auto">
              {board.length === 0 ? (
                <div className="text-sm text-slate-400 p-3">No scores yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-900/90 backdrop-blur">
                    <tr className="text-left text-slate-400">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Steps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((r, i) => (
                      <tr key={r.id} className="odd:bg-slate-800/30">
                        <td className="px-3 py-2">{i+1}</td>
                        <td className="px-3 py-2">{r.name ?? "-"}</td>
                        <td className="px-3 py-2">{r.elapsed}s</td>
                        <td className="px-3 py-2">{r.steps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function StatsBar({ seed, steps, elapsed }: { seed: string; steps: number; elapsed: number }) {
  return (
    <div className="rounded-xl bg-slate-900 ring-1 ring-white/5 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <StatBox label="Seed" value={<span className="font-mono">{seed || '-'} </span>} />
        <StatBox label="Steps" value={<span>{steps}</span>} />
        <StatBox label="Time" value={<span>{elapsed}s</span>} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 min-w-[120px]">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-100 truncate">{value}</span>
    </div>
  );
}
