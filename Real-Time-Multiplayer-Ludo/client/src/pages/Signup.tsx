import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';
import './signup.css';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', dob: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      await axios.post('http://localhost:8000/api/auth/signup', {
        username: formData.username,
        password: formData.password,
        dob: formData.dob
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating account');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">🎲 LUDO</h1>
        <p className="auth-subtitle">Create a new account</p>
        
        {error && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              type="text" id="username" className="form-input" placeholder="Choose a username" required minLength={2} maxLength={20}
              value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dob">Date of Birth</label>
            <input 
              type="date" id="dob" className="form-input" required
              value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              type="password" id="password" className="form-input" placeholder="Create a password" required minLength={6}
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <input 
              type="password" id="confirm-password" className="form-input" placeholder="Repeat your password" required minLength={6}
              value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>

          <button type="submit" className="auth-btn">Sign Up</button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;