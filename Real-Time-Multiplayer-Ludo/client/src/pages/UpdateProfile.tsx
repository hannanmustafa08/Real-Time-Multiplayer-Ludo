import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './update-profile.css';

function UpdateProfile() {
  const { user } = useContext(AuthContext);
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const winRate = user && user.total_played > 0 
    ? Math.round(((user.wins || 0) / user.total_played) * 100) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("New passwords do not match!");
      return;
    }

    try {
      await axios.put('http://localhost:8000/api/auth/update', {
        username: user?.username, // Send username to identify the user
        dob,
        currentPassword,
        newPassword
      });
      setMessage("Profile updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Update Profile</h2>
        <p>Edit your account information</p>
      </div>

      <div className="profile-card">
        <form id="update-profile-form" onSubmit={handleSubmit}>
          {message && <p style={{ textAlign: 'center', color: '#f9a825', fontWeight: 'bold' }}>{message}</p>}
          
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              className="form-input"
              value={user.username}
              readOnly
            />
            <span className="form-hint">Cannot be changed after account creation</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dob">Date of Birth</label>
            <input 
              type="date" 
              id="dob" 
              className="form-input"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          <div className="form-divider">
            <span>Change Password (Optional)</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="current-password">Current Password</label>
            <input 
              type="password" 
              id="current-password" 
              className="form-input"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-password">New Password</label>
            <input 
              type="password" 
              id="new-password" 
              className="form-input"
              placeholder="Enter a new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-new-password">Confirm New Password</label>
            <input 
              type="password" 
              id="confirm-new-password" 
              className="form-input"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">Save Changes</button>
            <Link to="/home" className="btn-cancel" style={{ display: 'inline-block', textAlign: 'center' }}>Cancel</Link>
          </div>
        </form>
      </div>

      <div className="profile-info">
        <h3>Account Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Member Since</span>
            <span className="info-value">Active Player</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Games</span>
            <span className="info-value">{user.total_played || 0}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Coin Balance</span>
            <span className="info-value">{user.coins} Coins</span>
          </div>
          <div className="info-item">
            <span className="info-label">Win Rate</span>
            <span className="info-value">{winRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateProfile;