import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-title">🎲 LUDO</Link>
      </div>
      <div className="navbar-right">
        <div className="coin-display">
          <span className="coin-icon">💰</span>
          <span className="coin-amount">{user.coins} Coins</span>
        </div>
        <div className="user-dropdown">
          <button className="dropdown-btn">{user.username} ▼</button>
          <div className="dropdown-menu">
            <Link to="/update-profile" className="dropdown-item">Update Profile</Link>
            <button onClick={() => { logout(); navigate('/login'); }} className="dropdown-item logout-btn" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;