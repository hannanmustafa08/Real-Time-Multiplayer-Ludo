import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import { Socket, Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";
import { app } from "./app.ts";

interface Player {
  id: string;
  username: string;
  color: string;
  isBot?: boolean;
}

interface GameState {
  players: Player[];
  currentTurnIndex: number;
  lastDiceRoll: number | null;
  tokens: Record<string, number[]>;
  startedAt: Date;
  turnStartedAt?: number;
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"], credentials: false },
});

const DB = process.env.MONGO_URI as string;
mongoose.connect(DB)
  .then(() => console.log("Database connection established."))
  .catch((err: Error) => console.error("Database connection failed:", err));

// Database Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date },
  coins: { type: Number, default: 100 },
  total_played: { type: Number, default: 0 },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const gameSchema = new mongoose.Schema({
  total_players: { type: Number, required: true },
  players: [{
    username: String,
    color: String,
    rank: Number,
    coins_earned: Number,
  }],
  status: { type: String, default: 'finished' },
  started_at: Date,
  finished_at: Date,
});
const GameRecord = mongoose.models.Game || mongoose.model('Game', gameSchema);

// Global State
const activePlayers: Player[] = [];
const colors = ["red", "blue", "green", "yellow"];
const activeGames: Record<string, GameState> = {};
const gameTimers: Record<string, NodeJS.Timeout> = {};

// Board mapping
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];
const getAbsolutePos = (color: string, relativePos: number): number => {
  if (relativePos < 0 || relativePos > 50) return -1;
  const offsets: Record<string, number> = { red: 0, blue: 13, yellow: 26, green: 39 };
  return (relativePos + offsets[color]) % 52;
};

// Turn Management & AI
function startTimer(gameId: string) {
  if (gameTimers[gameId]) clearTimeout(gameTimers[gameId]);
  const game = activeGames[gameId];
  if (!game) return;

  game.turnStartedAt = Date.now();
  io.to(gameId).emit("gameStateUpdate", game); 

  const currentPlayer = game.players[game.currentTurnIndex];
  const delay = currentPlayer.isBot ? 2000 : 20000;

  gameTimers[gameId] = setTimeout(() => {
    handleAITurn(gameId);
  }, delay);
}

function handleAITurn(gameId: string) {
  const game = activeGames[gameId];
  if (!game) return;
  const myColor = game.players[game.currentTurnIndex].color;

  if (game.lastDiceRoll === null) {
    const diceValue = Math.floor(Math.random() * 6) + 1;
    game.lastDiceRoll = diceValue;
    io.to(gameId).emit("diceRolled", { value: diceValue, playerColor: myColor });
    io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: myColor, text: `System: AI auto-rolled a ${diceValue}.` });
    setTimeout(() => executeAITokenMove(gameId, myColor, diceValue), 1000);
  } else {
    io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: myColor, text: `System: AI is selecting a token.` });
    executeAITokenMove(gameId, myColor, game.lastDiceRoll);
  }
}

function executeAITokenMove(gameId: string, color: string, diceValue: number) {
  const game = activeGames[gameId];
  if (!game) return;

  const validTokens: number[] = [];
  game.tokens[color].forEach((pos: number, idx: number) => {
    if (pos === -1 && diceValue === 6) validTokens.push(idx);
    if (pos !== -1 && pos + diceValue <= 57) validTokens.push(idx);
  });

  if (validTokens.length === 0) {
    game.lastDiceRoll = null;
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
    io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color, text: `${color} has no valid moves. Turn passed.` });
    startTimer(gameId); 
  } else {
    const randomToken = validTokens[Math.floor(Math.random() * validTokens.length)];
    processMove(gameId, color, randomToken);
  }
}

// Database Operations
async function saveGameToDatabase(gameId: string, winnerColor: string, winnerName: string) {
  try {
    const game = activeGames[gameId];
    if (!game) return;

    const coinsMap: Record<number, number[]> = { 4: [100, 50, 25, 0], 3: [50, 25, 0], 2: [25, 0] };
    const numPlayers = game.players.length;
    const rewards = coinsMap[numPlayers] || [0, 0, 0, 0];

    const playersData = game.players.map((p: Player) => {
      const isWinner = p.color === winnerColor;
      return { username: p.username, color: p.color, rank: isWinner ? 1 : 2, coins_earned: isWinner ? rewards[0] : 0 };
    });

    await GameRecord.create({
      total_players: numPlayers,
      players: playersData,
      status: 'finished',
      started_at: game.startedAt,
      finished_at: new Date()
    });

    for (const p of playersData) {
      await User.updateOne({ username: p.username }, { $inc: { coins: p.coins_earned, total_played: 1 } });
    }
    delete activeGames[gameId]; 
  } catch (error) {
    console.error("Database save error:", error);
  }
}

// Token Movement
function processMove(gameId: string, color: string, tokenIndex: number) {
  const game = activeGames[gameId];
  if (!game || !game.lastDiceRoll) return;

  const roll = game.lastDiceRoll;
  const currentPos = game.tokens[color][tokenIndex];

  if (currentPos === -1) {
    if (roll === 6) {
      game.tokens[color][tokenIndex] = 0;
      game.lastDiceRoll = null; 
      io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color, text: `${color} moved Token ${tokenIndex + 1} to start.` });
      startTimer(gameId);
    }
    return; 
  }

  const newPos = currentPos + roll;
  if (newPos > 57) return; 

  game.tokens[color][tokenIndex] = newPos;
  let extraTurn = (roll === 6 || newPos === 57);

  const absPos = getAbsolutePos(color, newPos);
  if (absPos !== -1 && !SAFE_SPOTS.includes(absPos)) {
    Object.keys(game.tokens).forEach(oppColor => {
      if (oppColor !== color) {
        game.tokens[oppColor].forEach((oppPos: number, oppIdx: number) => {
          if (getAbsolutePos(oppColor, oppPos) === absPos) {
            game.tokens[oppColor][oppIdx] = -1; 
            extraTurn = true;
            io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color, text: `${color} captured ${oppColor}'s token.` });
          }
        });
      }
    });
  }

  game.lastDiceRoll = null;
  if (!extraTurn) game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
  io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color, text: `${color} advanced Token ${tokenIndex + 1} by ${roll}.` });

  // Win condition check
  const hasWon = game.tokens[color].every((pos: number) => pos >= 57);
  if (hasWon) {
    if (gameTimers[gameId]) clearTimeout(gameTimers[gameId]);
    const winnerName = game.players.find((p: Player) => p.color === color)?.username || "Unknown";
    io.to(gameId).emit("gameOver", { color: color, username: winnerName });
    io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color, text: `Game Over. ${winnerName} wins.` });
    saveGameToDatabase(gameId, color, winnerName);
  } else {
    startTimer(gameId); 
  }
}

// Socket Listeners
io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinLobby", (user: { username: string }) => {
    // Reconnection handling for active matches
    for (const [gameId, game] of Object.entries(activeGames)) {
      const p = game.players.find(p => p.username === user.username);
      if (p && !p.isBot) {
         socket.emit("gameStarted", gameId); 
         return;
      }
    }

    const exists = activePlayers.find(p => p.username === user.username);
    if (!exists && activePlayers.length < 4) {
      activePlayers.push({ id: socket.id, username: user.username, color: colors[activePlayers.length] });
    }
    io.emit("lobbyUpdate", activePlayers);
  });

  socket.on("startGameRequest", (gameId: string) => {
    if (!activeGames[gameId]) {
      activeGames[gameId] = {
        players: JSON.parse(JSON.stringify(activePlayers)), 
        currentTurnIndex: 0,
        lastDiceRoll: null,
        startedAt: new Date(),
        tokens: {
          red: [-1, -1, -1, -1], blue: [-1, -1, -1, -1],
          green: [-1, -1, -1, -1], yellow: [-1, -1, -1, -1]
        }
      };
      io.emit("gameStarted", gameId);
      startTimer(gameId); 
    }
  });

  socket.on("joinGame", ({ gameId, user }: { gameId: string, user: { username: string } }) => {
    socket.join(gameId);
    if (!activeGames[gameId]) {
      socket.emit("serverRestarted");
      return;
    }
    const player = activeGames[gameId].players.find((p: Player) => p.username === user.username);
    if (player) {
      if (player.isBot) {
        socket.emit("serverRestarted"); 
        return;
      }
      player.id = socket.id;
      io.to(gameId).emit("gameStateUpdate", activeGames[gameId]);
    }
  });

  // Manual disconnect handling
  socket.on("leaveGame", ({ gameId, username }: { gameId: string, username: string }) => {
    const game = activeGames[gameId];
    if (game) {
      const player = game.players.find(p => p.username === username);
      if (player) {
        player.isBot = true; 
        io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: player.color, text: `${username} left the game. AI active.`});
        if (game.players[game.currentTurnIndex].username === username) {
          startTimer(gameId); 
        }
      }
    }
  });

  socket.on("rollDice", ({ gameId }: { gameId: string }) => {
    if (gameTimers[gameId]) clearTimeout(gameTimers[gameId]); 

    const game = activeGames[gameId];
    if (!game || !game.players || game.players.length === 0) return; 

    const diceValue = Math.floor(Math.random() * 6) + 1;
    game.lastDiceRoll = diceValue;
    const myColor = game.players[game.currentTurnIndex].color;

    io.to(gameId).emit("diceRolled", { value: diceValue, playerColor: myColor });

    const hasValidMove = game.tokens[myColor].some((pos: number) => {
      if (pos === -1 && diceValue === 6) return true;
      if (pos !== -1 && pos + diceValue <= 57) return true;
      return false;
    });

    if (!hasValidMove) {
      game.lastDiceRoll = null; 
      game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
      setTimeout(() => {
        io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: myColor, text: `${myColor} rolled ${diceValue}. No valid moves.` });
        startTimer(gameId); 
      }, 1000);
    } else {
      setTimeout(() => {
        io.to(gameId).emit("receiveLog", { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: myColor, text: `${myColor} rolled ${diceValue}.` });
        startTimer(gameId); 
      }, 500);
    }
  });

  socket.on("moveToken", ({ gameId, color, tokenIndex }: { gameId: string, color: string, tokenIndex: number }) => {
    if (gameTimers[gameId]) clearTimeout(gameTimers[gameId]); 
    processMove(gameId, color, tokenIndex);
  });

  socket.on("sendMessage", ({ gameId, message, sender, color }: { gameId: string, message: string, sender: string, color: string }) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    io.to(gameId).emit("receiveMessage", { message, sender, color, time });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const index = activePlayers.findIndex(p => p.id === socket.id);
    if (index !== -1) {
      activePlayers.splice(index, 1);
      activePlayers.forEach((p, i) => p.color = colors[i]);
      io.emit("lobbyUpdate", activePlayers);
    }
  });
});

server.listen(8000, () => {
  console.log("Server listening on port 8000");
});