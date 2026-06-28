import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Coffee, Plus, Gift, User as UserIcon, LogOut, Navigation } from 'lucide-react';

const Navbar = ({ onOpenAddShop, onOpenAuth, onOpenRewards, onOpenProfile, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab('map')}>
        <div className="logo-icon">
          <Coffee size={24} />
        </div>
        <div className="logo-text">
          <h1>ChaiSpot</h1>
          <span className="logo-tag">Discovery & Rewards</span>
        </div>
      </div>

      <nav className="nav-links">
        <button 
          className={`nav-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <Navigation size={18} />
          <span>Explore Map</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Coffee size={18} />
          <span>Chai Spots</span>
        </button>
      </nav>

      <div className="nav-actions">
        {user && (
          <button className="add-spot-btn" onClick={onOpenAddShop}>
            <Plus size={18} />
            <span>Add Spot</span>
          </button>
        )}

        <button className="rewards-badge-btn" onClick={onOpenRewards}>
          <Gift size={18} className="gift-icon" />
          <span className="pts-count">{user ? user.points : 0} PTS</span>
        </button>

        {user ? (
          <div className="user-profile-menu">
            <button className="profile-btn" onClick={onOpenProfile} title="View Profile & Coupons">
              <UserIcon size={18} />
              <span className="user-name">{user.name.split(' ')[0]}</span>
            </button>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="auth-btn" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
