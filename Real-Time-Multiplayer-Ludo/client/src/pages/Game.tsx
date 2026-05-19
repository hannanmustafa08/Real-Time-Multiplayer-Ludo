import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import './game.css';

interface Player {
  id?: string;
  username: string;
  color: string;
}

interface GameState {
  players: Player[];
  currentTurnIndex: number;
  lastDiceRoll: number | null;
  tokens: Record<string, number[]>;
  turnStartedAt?: number;
}

interface ChatMessage { message: string; sender: string; color: string; time: string; }
interface GameLog { time: string; color: string; text: string; }
interface CellMap { p: number | string; c: string; }
interface TokenPosition { p: number; i: number; }

function Game() {
  const navigate = useNavigate();
  const { game_id } = useParams<{ game_id: string }>();
  const { user } = useContext(AuthContext);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [diceValue, setDiceValue] = useState<number>(6);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [winner, setWinner] = useState<{color: string, username: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    if (user && game_id) {
      newSocket.emit('joinGame', { gameId: game_id, user });
    }

    newSocket.on('serverRestarted', () => {
      alert("Session ended. Returning to lobby.");
      navigate('/home');
    });

    newSocket.on('gameStateUpdate', (state: GameState) => setGameState(state));

    newSocket.on('diceRolled', ({ value }: { value: number }) => {
      setIsRolling(true);
      setTimeout(() => {
        setDiceValue(value);
        setIsRolling(false);
      }, 500);
    });

    newSocket.on('receiveMessage', (msg: ChatMessage) => setMessages((prev) => [...prev, msg]));
    newSocket.on('receiveLog', (log: GameLog) => setLogs((prev) => [log, ...prev].slice(0, 15)));
    
    newSocket.on('gameOver', (data: {color: string, username: string}) => {
      setWinner(data);
    });

    return () => { newSocket.disconnect(); };
  }, [user, game_id, navigate]);

  // Turn timer synchronization
  useEffect(() => {
    if (!gameState?.turnStartedAt) return;
    
    const updateTimer = () => {
       const elapsed = Math.floor((Date.now() - gameState.turnStartedAt!) / 1000);
       let remaining = 20 - elapsed;
       if (remaining < 0) remaining = 0;
       setTimeLeft(remaining);
    };

    updateTimer(); 
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [gameState?.turnStartedAt]);

  const handleRollDice = () => {
    if (socket && game_id && gameState && !winner) {
      const myPlayer = gameState.players.find((p: Player) => p.username === user?.username);
      const currentPlayer = gameState.players[gameState.currentTurnIndex];
      if (myPlayer?.color === currentPlayer?.color && !gameState.lastDiceRoll) {
        socket.emit('rollDice', { gameId: game_id });
      }
    }
  };

  const handleTokenClick = (tokenIndex: number) => {
    if (socket && game_id && gameState?.lastDiceRoll && !winner) {
      const myPlayer = gameState.players.find((p: Player) => p.username === user?.username);
      if (myPlayer) socket.emit('moveToken', { gameId: game_id, color: myPlayer.color, tokenIndex });
    }
  };

  const handleLeaveGame = () => {
    if (socket && game_id && user) {
      socket.emit('leaveGame', { gameId: game_id, username: user.username });
    }
    navigate('/home');
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (chatInput.trim() && socket && game_id && user) {
      const myPlayer = gameState?.players?.find((p: Player) => p.username === user.username);
      socket.emit('sendMessage', { gameId: game_id, message: chatInput, sender: user.username, color: myPlayer?.color || 'gray' });
      setChatInput('');
    }
  };

  // Board path coordinates
  const leftTrackMap: CellMap[] = [
    { p: 51, c: '' }, { p: 0, c: 'sq--start-red sq--safe' }, { p: 1, c: '' }, { p: 2, c: '' }, { p: 3, c: '' }, { p: 4, c: '' },
    { p: 50, c: '' }, { p: 'red-51', c: 'sq--home-red' }, { p: 'red-52', c: 'sq--home-red' }, { p: 'red-53', c: 'sq--home-red' }, { p: 'red-54', c: 'sq--home-red' }, { p: 'red-55', c: 'sq--home-red' },
    { p: 49, c: '' }, { p: 48, c: '' }, { p: 47, c: 'sq--safe' }, { p: 46, c: '' }, { p: 45, c: '' }, { p: 44, c: '' }
  ];
  const topTrackMap: CellMap[] = [
    { p: 10, c: '' }, { p: 11, c: '' }, { p: 12, c: '' },
    { p: 9, c: '' }, { p: 'blue-51', c: 'sq--home-blue' }, { p: 13, c: 'sq--start-blue sq--safe' },
    { p: 8, c: 'sq--safe' }, { p: 'blue-52', c: 'sq--home-blue' }, { p: 14, c: '' },
    { p: 7, c: '' }, { p: 'blue-53', c: 'sq--home-blue' }, { p: 15, c: '' },
    { p: 6, c: '' }, { p: 'blue-54', c: 'sq--home-blue' }, { p: 16, c: '' },
    { p: 5, c: '' }, { p: 'blue-55', c: 'sq--home-blue' }, { p: 17, c: '' }
  ];
  const rightTrackMap: CellMap[] = [
    { p: 18, c: '' }, { p: 19, c: '' }, { p: 20, c: '' }, { p: 21, c: 'sq--safe' }, { p: 22, c: '' }, { p: 23, c: '' },
    { p: 'yellow-55', c: 'sq--home-yellow' }, { p: 'yellow-54', c: 'sq--home-yellow' }, { p: 'yellow-53', c: 'sq--home-yellow' }, { p: 'yellow-52', c: 'sq--home-yellow' }, { p: 'yellow-51', c: 'sq--home-yellow' }, { p: 24, c: '' },
    { p: 30, c: '' }, { p: 29, c: '' }, { p: 28, c: '' }, { p: 27, c: '' }, { p: 26, c: 'sq--start-yellow sq--safe' }, { p: 25, c: '' }
  ];
  const botTrackMap: CellMap[] = [
    { p: 43, c: '' }, { p: 'green-55', c: 'sq--home-green' }, { p: 31, c: '' },
    { p: 42, c: '' }, { p: 'green-54', c: 'sq--home-green' }, { p: 32, c: '' },
    { p: 41, c: '' }, { p: 'green-53', c: 'sq--home-green' }, { p: 33, c: '' },
    { p: 40, c: '' }, { p: 'green-52', c: 'sq--home-green' }, { p: 34, c: 'sq--safe' },
    { p: 39, c: 'sq--start-green sq--safe' }, { p: 'green-51', c: 'sq--home-green' }, { p: 35, c: '' },
    { p: 38, c: '' }, { p: 37, c: '' }, { p: 36, c: '' }
  ];

  const getAbsolutePos = (color: string, relativePos: number): number => {
    if (relativePos < 0 || relativePos > 50) return -1;
    const offsets: Record<string, number> = { red: 0, blue: 13, yellow: 26, green: 39 };
    return (relativePos + offsets[color]) % 52;
  };

  const renderSquare = (cell: CellMap, idx: number) => {
    if (!gameState) return <div key={idx} className={`sq ${cell.c}`}></div>;

    const tokensHere: Array<{color: string, tIdx: number, id: string, canMove: boolean}> = [];
    ['red', 'blue', 'green', 'yellow'].forEach(color => {
      if (gameState.tokens[color]) {
        gameState.tokens[color].forEach((pos: number, tIdx: number) => {
          let isMatch = false;
          if (typeof cell.p === 'number' && pos >= 0 && pos <= 50) {
            if (getAbsolutePos(color, pos) === cell.p) isMatch = true;
          } else if (typeof cell.p === 'string' && `${color}-${pos}` === cell.p) {
            isMatch = true;
          }

          if (isMatch) {
            const isMyTurn = gameState.players[gameState.currentTurnIndex]?.username === user?.username;
            const isMyToken = gameState.players.find((p: Player) => p.username === user?.username)?.color === color;
            const roll = gameState.lastDiceRoll;
            const newPos = pos + (roll || 0);
            const canMove = isMyTurn && isMyToken && roll !== null && newPos <= 57;
            
            tokensHere.push({ color, tIdx, id: `${color[0].toUpperCase()}${tIdx+1}`, canMove });
          }
        });
      }
    });

    return (
      <div key={idx} className={`sq ${cell.c}`} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {tokensHere.map((t, i) => (
          <div 
            key={t.id}
            className={`token token--${t.color === 'yellow' ? 'yel' : t.color} ${t.canMove ? 'clickable-pulse' : ''}`}
            onClick={() => t.canMove ? handleTokenClick(t.tIdx) : undefined}
            style={{ 
              position: tokensHere.length > 1 ? 'absolute' : 'relative',
              transform: tokensHere.length > 1 ? `translate(${i * 4 - 6}px, ${i * 4 - 6}px) scale(0.85)` : 'none',
              zIndex: t.canMove ? 10 : 1,
              cursor: t.canMove ? 'pointer' : 'default',
              boxShadow: tokensHere.length > 1 ? '0 0 3px black' : '' 
            }}
          >
            {t.id}
            <span className="token-tip">{t.id}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderBaseToken = (color: string, tokenIndex: number, label: string) => {
    if (!gameState || !gameState.tokens[color] || gameState.tokens[color][tokenIndex] !== -1) return null;
    const isMyTurn = gameState.players[gameState.currentTurnIndex]?.username === user?.username;
    const amIThisColor = gameState.players.find((p: Player) => p.username === user?.username)?.color === color;
    const canMove = isMyTurn && amIThisColor && gameState.lastDiceRoll === 6;

    return (
      <div 
        className={`token token--${color === 'yellow' ? 'yel' : color} ${canMove ? 'clickable-pulse' : ''}`}
        onClick={() => canMove ? handleTokenClick(tokenIndex) : undefined}
        style={{ cursor: canMove ? 'pointer' : 'default' }}
      >
        {label}
        <span className="token-tip">{label} - Base</span>
      </div>
    );
  };

  const renderFinished = (triColor: string) => {
    if (!gameState) return null;
    const colorMap: Record<string, string> = { top: 'blue', right: 'yellow', bot: 'green', left: 'red' };
    const color = colorMap[triColor];
    if (!gameState.tokens[color]) return null;

    const finished = gameState.tokens[color]
      .map((p: number, i: number) => ({ p, i }))
      .filter((t: TokenPosition) => t.p >= 57); 
    
    return finished.map((t: TokenPosition, i: number) => (
      <div key={t.i} className={`token token--${color === 'yellow' ? 'yel' : color}`} style={{ position: 'absolute', transform: 'scale(0.5)', marginTop: `${i*10 - 10}px` }}>
         {color[0].toUpperCase()}{t.i+1}
      </div>
    ));
  };

  return (
    <div className="game-page-wrapper">
      <div className="topbar">
        <div className="topbar-info">
          <div><span>Room: </span><strong>#{game_id}</strong></div>
          <div><span>Mode: </span><strong>Classic (4 players)</strong></div>
        </div>
        
        <div className={`timer ${timeLeft <= 5 ? 'text-danger' : ''}`}>
          00:{timeLeft.toString().padStart(2, '0')}
        </div>

        <div className="flex-row gap-8px">
          <button className="btn btn-muted">&#9654; Spectate</button>
          <button className="btn btn-danger" onClick={handleLeaveGame}>&#x2715; Leave Game</button>
        </div>
      </div>

      <div className="layout">
        <aside>
          <div className="panel">
            <div className="panel-hd">Your Turn - Roll Dice</div>
            <div className="panel-bd">
              <div className={`die-number ${isRolling ? 'rolling' : ''}`}>{diceValue}</div>
              <button 
                className="roll-btn" 
                onClick={handleRollDice} 
                disabled={isRolling || (gameState && gameState.lastDiceRoll !== null) || winner !== null}
                style={{ opacity: (gameState && gameState.lastDiceRoll !== null) ? 0.5 : 1 }}
              >
                {(gameState && gameState.lastDiceRoll !== null) ? 'Select a Token' : 'Roll!'}
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd">Players</div>
            <div className="panel-bd">
              {gameState?.players?.map((p: Player, idx: number) => {
                const pTokens = gameState.tokens[p.color] || [-1,-1,-1,-1];
                const home = pTokens.filter((t: number) => t === -1).length;
                const fin = pTokens.filter((t: number) => t >= 57).length;
                const onBoard = 4 - home - fin;
                const isTurn = gameState.currentTurnIndex === idx;

                return (
                  <div key={p.username} className={`player-card ${isTurn ? 'active' : ''}`}>
                    {isTurn && <span className="active-badge">Turn</span>}
                    <div className="p-name"><div className={`p-dot dot-${p.color}`}></div>{p.username === user?.username ? 'You' : p.username} ({p.color})</div>
                    <div className="p-stats">Board: {onBoard} &nbsp;|&nbsp; Home: {home} &nbsp;|&nbsp; Fin: {fin}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="board-area">
          <div className="ludo-board">
            
            <div className="board-row board-row--top">
              <div className="home home--red">
                <div className="yard">
                  <div className="token-slot">{renderBaseToken('red', 0, 'R1')}</div>
                  <div className="token-slot">{renderBaseToken('red', 1, 'R2')}</div>
                  <div className="token-slot">{renderBaseToken('red', 2, 'R3')}</div>
                  <div className="token-slot">{renderBaseToken('red', 3, 'R4')}</div>
                </div>
              </div>
              <div className="track-col track-col--top">{topTrackMap.map((cell, i) => renderSquare(cell, i))}</div>
              <div className="home home--blue">
                <div className="yard">
                  <div className="token-slot">{renderBaseToken('blue', 0, 'B1')}</div>
                  <div className="token-slot">{renderBaseToken('blue', 1, 'B2')}</div>
                  <div className="token-slot">{renderBaseToken('blue', 2, 'B3')}</div>
                  <div className="token-slot">{renderBaseToken('blue', 3, 'B4')}</div>
                </div>
              </div>
            </div>

            <div className="board-row board-row--mid">
              <div className="track-col track-col--left">{leftTrackMap.map((cell, i) => renderSquare(cell, i))}</div>
              <div className="centre" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="tri tri--top" style={{ display: 'flex', justifyContent: 'center' }}>{renderFinished('top')}</div>
                <div className="tri tri--right" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{renderFinished('right')}</div>
                <div className="tri tri--bot" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>{renderFinished('bot')}</div>
                <div className="tri tri--left" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{renderFinished('left')}</div>
                <span className="centre-star" style={{ zIndex: 10 }}>★</span>
              </div>
              <div className="track-col track-col--right">{rightTrackMap.map((cell, i) => renderSquare(cell, i))}</div>
            </div>

            <div className="board-row board-row--bot">
              <div className="home home--green">
                <div className="yard">
                  <div className="token-slot">{renderBaseToken('green', 0, 'G1')}</div>
                  <div className="token-slot">{renderBaseToken('green', 1, 'G2')}</div>
                  <div className="token-slot">{renderBaseToken('green', 2, 'G3')}</div>
                  <div className="token-slot">{renderBaseToken('green', 3, 'G4')}</div>
                </div>
              </div>
              <div className="track-col track-col--bot">{botTrackMap.map((cell, i) => renderSquare(cell, i))}</div>
              <div className="home home--yellow">
                <div className="yard">
                  <div className="token-slot">{renderBaseToken('yellow', 0, 'Y1')}</div>
                  <div className="token-slot">{renderBaseToken('yellow', 1, 'Y2')}</div>
                  <div className="token-slot">{renderBaseToken('yellow', 2, 'Y3')}</div>
                  <div className="token-slot">{renderBaseToken('yellow', 3, 'Y4')}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <aside>
          <div className="panel">
            <div className="panel-hd">Live Chat</div>
            <div className="chat-window">
              <div className="chat-messages" style={{ overflowY: 'auto', maxHeight: '200px' }}>
                <div className="chat-msg sys"><div className="msg-bubble">Game started.</div></div>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chat-msg ${msg.sender === user?.username ? 'mine' : ''}`}>
                    <div className={`msg-meta ${msg.sender === user?.username ? 'flex-end-justify' : ''}`}>
                      {msg.sender !== user?.username && <span className={`msg-sender msg-sender-${msg.color}`}>{msg.sender}</span>}
                      <span className="msg-time">{msg.time}</span>
                      {msg.sender === user?.username && <span className={`msg-sender msg-sender-${msg.color}`}>You</span>}
                    </div>
                    <div className="msg-bubble">{msg.message}</div>
                  </div>
                ))}
              </div>
              <form className="chat-input-row" onSubmit={handleSendMessage}>
                <input type="text" placeholder="Type a message…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                <button type="submit">Send</button>
              </form>
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd">Live Game Log</div>
            <div className="game-log" style={{ overflowY: 'auto', maxHeight: '250px' }}>
              {logs.map((log, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-time">{log.time}</span>
                  <div className={`log-dot log-dot-${log.color}`}></div>
                  <span className="log-text">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div> 

      {winner && (
        <div className="victory-overlay" id="victory-overlay" style={{ display: 'flex' }}>
          <div className="victory-card">
            <h2>Victory</h2>
            <div className={`vc-winner color-${winner.color}`}>
              {winner.username === user?.username ? 'You' : winner.username} ({winner.color}) won the game.
            </div>
            <div className="vc-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-muted" onClick={() => navigate('/home')}>Return to Menu</button>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}

export default Game;