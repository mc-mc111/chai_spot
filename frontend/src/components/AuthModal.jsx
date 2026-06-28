import React, { useState } from 'react';
import { X, Lock, Mail, User, Coffee, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ onClose, onShowToast }) => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isSignup && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        await signup(name, email, password);
        onShowToast('🎉 Welcome to ChaiSpot! Signup successful.', 'success');
      } else {
        await login(email, password);
        onShowToast('👋 Welcome back! Logged in successfully.', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      const msg = err.response?.data?.message || 'Authentication failed. Please check your details.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <div className="auth-logo">
            <Coffee size={28} />
          </div>
          <h2>{isSignup ? 'Create ChaiSpot Account' : 'Welcome Back'}</h2>
          <p>{isSignup ? 'Join the community, discover spots, and earn points.' : 'Log in to leave reviews and redeem rewards.'}</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${!isSignup ? 'active' : ''}`}
            onClick={() => { setIsSignup(false); setError(''); }}
          >
            Log In
          </button>
          <button 
            type="button"
            className={`auth-tab ${isSignup ? 'active' : ''}`}
            onClick={() => { setIsSignup(true); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <div className="form-group">
              <label><User size={14} /> Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Rahul Sharma" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignup}
              />
            </div>
          )}

          <div className="form-group">
            <label><Mail size={14} /> Email Address</label>
            <input 
              type="email" 
              placeholder="e.g. rahul@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label><Lock size={14} /> Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            <span>{loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
