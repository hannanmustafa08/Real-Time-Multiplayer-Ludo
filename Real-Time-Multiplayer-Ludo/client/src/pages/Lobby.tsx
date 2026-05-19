import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import './lobby.css';

interface LobbyPlayer {
  id: string;
  username: string;
  color: string;
}

function Lobby() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    if (user) {
      newSocket.emit('joinLobby', { username: user.username });
    }

    newSocket.on('lobbyUpdate', (currentPlayers: LobbyPlayer[]) => {
      setPlayers(currentPlayers);
    });

    //Listen for the backend telling us the game has started
    newSocket.on('gameStarted', (gameId: string) => {
      navigate(`/newgame/${gameId}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, navigate]);

  const handleStartGame = () => {
    if (players.length >= 2 && socket) {
      //tell the backend to trigger it for everyone!
      socket.emit('startGameRequest', 'LUDO-4821'); 
    }
  };

  const renderSlot = (index: number) => {
    const player = players[index];
    if (player) {
      return (
        <div key={index} className="player-slot filled">
          <div className="player-slot-label">Player {index + 1}</div>
          <div className="player-slot-name">{player.username === user?.username ? 'You' : player.username}</div>
          <div className={`player-slot-color ${player.color}`}></div>
        </div>
      );
    }
    return (
      <div key={index} className="player-slot empty">
        <div className="player-slot-label">Player {index + 1}</div>
        <div className="player-slot-name">Waiting...</div>
        <div className="player-slot-color none"></div>
      </div>
    );
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1 className="lobby-title">🎲 LUDO</h1>
        <p className="lobby-subtitle">Classic Board Game Experience</p>
      </div>

      <div className="lobby-card">
        <h2>Game Lobby</h2>
        
        <div className="players-grid">
          {[0, 1, 2, 3].map(renderSlot)}
        </div>

        <button 
          className="start-button" 
          id="start-btn" 
          disabled={players.length < 2}
          onClick={handleStartGame}
        >
          {players.length < 2 ? 'Start Game (Need 2+ Players)' : `Start Game (${players.length}/4 Players)`}
        </button>

        <div className="lobby-footer">
          <button className="back-button" onClick={() => navigate('/home')}>Go Back</button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;