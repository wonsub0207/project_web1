import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <h1 className="text-4xl font-bold mb-6">🎮 Mini Game Portal</h1>
      <p className="text-slate-400 mb-8">Choose your game:</p>

      <div className="flex gap-4">
        <Link
          to="/maze"
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-lg font-semibold transition"
        >
          🌀 Maze Game
        </Link>
        <button
          disabled
          className="px-6 py-3 bg-slate-700 text-slate-400 rounded-2xl text-lg font-semibold cursor-not-allowed"
        >
          🧱 Coming Soon
        </button>
      </div>

      <footer className="mt-12 text-slate-500 text-sm">
        &copy; 2025 Maze Express Portal
      </footer>
    </div>
  );
}
