# Real-Time Multiplayer Ludo Game

A full-stack, browser-based multiplayer Ludo game designed for 2–4 players. This application features real-time state synchronization, server-authoritative game logic, persistent user accounts, and an in-game live chat system. 

It was developed to demonstrate advanced proficiency in WebSocket communication, React component architecture, and comprehensive backend engineering.

## 🛠️ Tech Stack

### Frontend (Client)
* **Framework:** React (built with Vite)
* **Routing:** React Router DOM
* **Real-Time Communication:** Socket.IO-Client
* **State Management:** React Context API (`AuthContext`, `GameContext`)

### Backend (Server)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Real-Time Communication:** Socket.IO
* **Database:** MongoDB (managed via Mongoose ODM)

## 🚀 Key Features

* **Server-Authoritative Logic:** To prevent client-side manipulation, all critical game mechanics—including dice generation, move validation, and capture detection—are processed exclusively on the Node.js backend. The server acts as the single source of truth, broadcasting the updated `game:state` to all clients.
* **Real-Time Synchronization:** Utilizes Socket.IO rooms to synchronize the 15x15 board state, dice rolls, and turn order across multiple clients instantly without HTTP polling.
* **Robust Disconnect Handling:** If a player disconnects mid-game, a server-side AI automatically takes over their turn, rolling and moving valid tokens to ensure the game continues seamlessly for the remaining players.
* **Turn Enforcement:** Implements a strict 20-second turn timer. If a player fails to act, the server forces an auto-roll and executes a random valid move.
* **Live In-Game Chat:** Features a real-time messaging system integrated into the game lobby, complete with automated system broadcasts for critical events (e.g., token captures, player finishes).
* **Persistent Leaderboards & History:** Tracks user coin balances and match history using MongoDB. The global leaderboard ranks players by total wealth, utilizing a games-played tiebreaker algorithm. 

## 🏗️ Architecture & Component Design

The frontend is highly modularized to ensure maintainability:
* `LudoBoard`: Renders the grid, safe zones, and home stretches.
* `Token`: Manages individual piece rendering and click-to-move interactions.
* `DicePanel`: Handles roll requests and displays recent roll history.
* `ChatBox`: Manages socket emissions for text communication.

## 💻 Setup & Execution

### Prerequisites
* Node.js (v18+)
* MongoDB (Local instance or Atlas cluster)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/hannanmustafa08/Real-Time-Multiplayer-Ludo.git]

- **Backend Setup**  
  - `cd server`  
  - `npm install`  
  - Create a `config.env` file in the server directory with:  
    - `PORT=8000`  
    - `MONGO_URI=your_mongodb_connection_string`  
    - `NODE_ENV=development`  
  - Start Backend Server: `npm run dev`  

- **Frontend Setup**  
  - `cd ../client`  
  - `npm install`  
  - `npm run dev`  

- **Run the Application**  
  - Navigate to: `http://localhost:5173`
