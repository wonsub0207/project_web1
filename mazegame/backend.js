// server.mjs (Express + CORS + MySQL backend)
// Run: pnpm add express cors mysql2 dotenv
//      node server.mjs

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

// ---- Config ----
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",");

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "maze",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---- App ----
const app = express();
app.use(cors({ origin: ORIGINS, credentials: false }));
app.use(express.json());

// ---- Utilities ----
function seededRand(seed) {
  // xorshift32 (deterministic) from string seed
  let x = [...String(seed)].reduce((a, c) => (a + c.charCodeAt(0)) >>> 0, 1337) || 1337;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

function genMaze(width = 21, height = 21, seed = "") {
  const W = width | 1;
  const H = height | 1;
  const grid = Array.from({ length: H }, () => Array(W).fill(1));
  const rand = seededRand(seed || Date.now());
  const stack = [[1, 1]];
  grid[1][1] = 0;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors = [];
    // shuffle dirs by random comparator
    const order = [...dirs].sort(() => rand() - 0.5);
    for (const [dx, dy] of order) {
      const nx = cx + dx * 2;
      const ny = cy + dy * 2;
      if (nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1 && grid[ny][nx] === 1) {
        neighbors.push([nx, ny, dx, dy]);
      }
    }
    if (neighbors.length) {
      const [nx, ny, dx, dy] = neighbors[(rand() * neighbors.length) | 0];
      grid[cy + dy][cx + dx] = 0;
      grid[ny][nx] = 0;
      stack.push([nx, ny]);
    } else {
      stack.pop();
    }
  }
  // goal near bottom-right
  let gx = W - 2, gy = H - 2;
  outer: for (let y = H - 2; y >= 1; y--) {
    for (let x = W - 2; x >= 1; x--) {
      if (grid[y][x] === 0) { gx = x; gy = y; break outer; }
    }
  }
  return { grid, start: { x: 1, y: 1 }, goal: { x: gx, y: gy } };
}

// ---- Routes ----
// GET /health
app.get("/health", (_, res) => res.json({ ok: true }));

// GET /maze?width=21&height=21&seed=abc
app.get("/maze", (req, res) => {
  const width = Math.max(5, Math.min(199, Number(req.query.width ?? 21)));
  const height = Math.max(5, Math.min(199, Number(req.query.height ?? 21)));
  const seed = String(req.query.seed ?? "");
  const maze = genMaze(width, height, seed);
  res.json(maze);
});

// POST /score { seed, steps, elapsed, name? }
app.post("/score", async (req, res) => {
  try {
    const { seed = "", steps, elapsed, name = null } = req.body || {};
    if (!Number.isFinite(steps) || !Number.isFinite(elapsed)) {
      return res.status(400).json({ ok: false, error: "Invalid steps/elapsed" });
    }
    const [result] = await pool.execute(
      `INSERT INTO scores (seed, steps, elapsed, player_name) VALUES (?, ?, ?, ?)`,
      [String(seed), Number(steps), Number(elapsed), name]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB error" });
  }
});

// GET /leaderboard?seed=abc&limit=20
app.get("/leaderboard", async (req, res) => {
  try {
    const seed = String(req.query.seed ?? "");
    const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 20)));
    const [rows] = await pool.execute(
      `SELECT id, player_name AS name, seed, steps, elapsed, created_at
       FROM scores
       WHERE (? = '' OR seed = ?)
       ORDER BY elapsed ASC, steps ASC, id ASC
       LIMIT ?`,
      [seed, seed, limit]
    );
    res.json({ ok: true, items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB error" });
  }
});

app.listen(PORT, () => {
  console.log(`Maze backend listening on http://localhost:${PORT}`);
});

/*
.env example
-------------
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=maze

MySQL schema
-------------
CREATE DATABASE IF NOT EXISTS maze CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE maze;
CREATE TABLE IF NOT EXISTS scores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  seed VARCHAR(191) NOT NULL,
  steps INT NOT NULL,
  elapsed INT NOT NULL,
  player_name VARCHAR(191) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_seed_time (seed, elapsed, steps)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
*/
