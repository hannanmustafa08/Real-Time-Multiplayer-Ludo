import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import Navbar from './components/NavBar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Leaderboard from './pages/Leaderboard';
import History from './pages/History';
import UpdateProfile from './pages/UpdateProfile';
import Game from './pages/Game';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="page"> 
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/newgame/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/update-profile" element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>} />
          <Route path="/newgame/:game_id" element={<ProtectedRoute><Game /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;