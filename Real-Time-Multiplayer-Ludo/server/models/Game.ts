import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  players: [{ type: String }], // Array of usernames
  positions: { type: Map, of: String }, // e.g., { "Player1": "1st Place 🥇" }
  coinsEarned: { type: Map, of: Number } // e.g., { "Player1": 100 }
});

export default mongoose.model('Game', gameSchema);