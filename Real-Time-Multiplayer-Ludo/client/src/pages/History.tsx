import { Link } from 'react-router-dom';
import './history.css';

function History() {
  const pastGames = [
    { id: 101, date: "March 15, 2024 - 3:45 PM", players: "You (Red), Ali (Blue), Sara (Green), Zain (Yellow)", posClass: "position-1st", posText: "1st Place 🥇", coins: "+100" },
    { id: 100, date: "March 14, 2024 - 8:20 PM", players: "You (Blue), Pro_Player (Red), Master_Mind (Green)", posClass: "position-2nd", posText: "2nd Place 🥈", coins: "+25" },
    { id: 99, date: "March 13, 2024 - 6:15 PM", players: "You (Green), Thunder_Strike (Red), Nova_Star (Blue), Cosmic_King (Yellow)", posClass: "position-3rd", posText: "3rd Place 🥉", coins: "+0" },
    { id: 98, date: "March 12, 2024 - 9:00 PM", players: "You (Yellow), Elite_Gamer (Red), Swift_Fox (Blue)", posClass: "position-1st", posText: "1st Place 🥇", coins: "+50" },
    { id: 97, date: "March 11, 2024 - 5:30 PM", players: "You (Red), Blaze_Runner (Blue), Zen_Master (Green), Shadow_Player (Yellow)", posClass: "position-4th", posText: "4th Place", coins: "+0" }
  ];

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="header-top">
          <h2>Game History</h2>
          <Link to="/home" className="back-link">← Back to Home</Link>
        </div>
        <p className="header-subtitle">Review all your past matches</p>
      </div>

      <div className="history-list">
        {pastGames.map((game) => (
          <div className="history-item" key={game.id}>
            <div className="game-header">
              <span className="game-id">Game #{game.id}</span>
              <span className="game-date">{game.date}</span>
            </div>
            <div className="game-details">
              <div className="detail-row">
                <span className="label">Players:</span>
                <span className="value">{game.players}</span>
              </div>
              <div className="detail-row">
                <span className="label">Finish Position:</span>
                <span className={`value ${game.posClass}`}>{game.posText}</span>
              </div>
              <div className="detail-row">
                <span className="label">Coins Earned:</span>
                <span className="coins">{game.coins}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;