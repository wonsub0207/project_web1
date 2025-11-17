import './GameStats.css';

interface GameStatsProps {
  moves: number;
  matches: number;
  totalMatches: number;
}

export function GameStats({ moves, matches, totalMatches }: GameStatsProps) {
  return (
    <div className="game-stats">
      <div className="stat">
        <span className="stat-label">이동 횟수:</span>
        <span className="stat-value">{moves}</span>
      </div>
      <div className="stat">
        <span className="stat-label">매칭:</span>
        <span className="stat-value">{matches}/{totalMatches}</span>
      </div>
    </div>
  );
}
