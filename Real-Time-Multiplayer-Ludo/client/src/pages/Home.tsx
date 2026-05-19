import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './home.css';

function Home() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  // Calculate win rate 
  const winRate = user.total_played > 0 
    ? Math.round(((user.wins || 0) / user.total_played) * 100) 
    : 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome, {user.username}!</h2>
        <p>Choose an option below to continue</p>
      </div>

      <div className="dashboard-grid">
        {/* Play Card */}
        <div className="dashboard-card play-card">
          <div className="card-icon">🎮</div>
          <h3>Play Game</h3>
          <p>Join a lobby and play with other players</p>
          <Link to="/newgame/lobby" className="card-button">Start Playing</Link>
        </div>

        {/* Leaderboard Card */}
        <div className="dashboard-card leaderboard-card">
          <div className="card-icon">🏆</div>
          <h3>Leaderboard</h3>
          <p>Check global rankings and player stats</p>
          <Link to="/leaderboard" className="card-button">View Rankings</Link>
        </div>

        {/* History Card */}
        <div className="dashboard-card history-card">
          <div className="card-icon">📊</div>
          <h3>Game History</h3>
          <p>Review your past matches and results</p>
          <Link to="/history" className="card-button">View History</Link>
        </div>
      </div>

      <div className="stats-section">
        <h3>Your Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Games</span>
            <span className="stat-value">{user.total_played || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Wins</span>
            <span className="stat-value">{user.wins || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{winRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Coins</span>
            <span className="stat-value">{user.coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;