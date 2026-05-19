import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './leaderboard.css';

interface Player {
  username: string;
  coins: number;
  total_played: number;
}

function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/stats/leaderboard');
        setPlayers(response.data);
      } catch (err) {
        console.error("Failed to load leaderboard");
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredPlayers = players.filter(p => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankDisplay = (index: number) => {
    if (index === 0) return '🥇 1st';
    if (index === 1) return '🥈 2nd';
    if (index === 2) return '🥉 3rd';
    return `${index + 1}th`;
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <div className="header-top">
          <h2>Global Leaderboard</h2>
          <Link to="/home" className="back-link">← Back to Home</Link>
        </div>
        
        <div className="search-section">
          <input 
            type="text" 
            id="search-input" 
            className="search-input" 
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="leaderboard-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank-col">Rank</th>
              <th className="name-col">Username</th>
              <th className="games-col">Games Played</th>
              <th className="coins-col">Coins</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player, index) => (
              <tr key={player.username} className={index === 0 ? "highlight" : ""}>
                <td className="rank">{getRankDisplay(index)}</td>
                <td className="username">{player.username}</td>
                <td className="games">{player.total_played || 0}</td>
                <td className="coins">{player.coins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="page-btn prev">← Previous</button>
        <span className="page-info">Page 1 of 1</span>
        <button className="page-btn next">Next →</button>
      </div>
    </div>
  );
}

export default Leaderboard;