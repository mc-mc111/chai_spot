import React, { useState } from 'react';
import { X, Gift, Copy, Check, Award, ShieldCheck, Ticket, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { rewardAPI } from '../services/api';

const UserProfile = ({ shops, onClose, onShowToast }) => {
  const { user, updateUserPointsAndCoupons } = useAuth();
  const [selectedShopId, setSelectedShopId] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [error, setError] = useState('');

  if (!user) return null;

  const pointsThreshold = 50;
  const progressPercent = Math.min(100, Math.round((user.points / pointsThreshold) * 100));
  const canRedeem = user.points >= pointsThreshold;

  const handleRedeem = async () => {
    if (!canRedeem) {
      setError(`You need at least ${pointsThreshold} points to redeem a coupon code.`);
      return;
    }

    setRedeeming(true);
    setError('');

    try {
      const res = await rewardAPI.redeemCoupon(selectedShopId || null, pointsThreshold);
      const { coupon, remainingPoints, coupons } = res.data;

      updateUserPointsAndCoupons(remainingPoints, coupons);
      onShowToast(`🎉 Coupon ${coupon.code} generated successfully!`, 'success');
    } catch (err) {
      console.error('Redeem coupon error:', err);
      const msg = err.response?.data?.message || 'Failed to redeem coupon.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onShowToast(`Copied code ${code} to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content profile-rewards-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="profile-header">
          <div className="user-avatar-large">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user.name}</h2>
            <p className="user-email">{user.email}</p>
          </div>
        </div>

        <div className="points-status-card">
          <div className="points-top">
            <div className="points-badge">
              <Sparkles size={20} className="sparkle-icon" />
              <div>
                <span className="pts-val">{user.points}</span>
                <span className="pts-lbl">Total Chai Points</span>
              </div>
            </div>
            <div className="tier-badge">Chai Connoisseur</div>
          </div>

          <div className="redemption-progress">
            <div className="progress-label-row">
              <span>Next Coupon Reward (50 PTS)</span>
              <span>{user.points} / 50 PTS</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="redeem-section">
          <h3><Gift size={18} /> Redeem Coupon Code</h3>
          <p className="section-desc">Earn +10 points for reviewing spots (+15 for discovering new ones!). Reach 50 points to unlock exclusive chai discount codes.</p>

          <div className="redeem-form-row">
            <select 
              className="shop-select"
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
            >
              <option value="">Any Participating Chai Spot</option>
              {shops.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            <button 
              className="redeem-btn" 
              onClick={handleRedeem}
              disabled={!canRedeem || redeeming}
            >
              <Ticket size={16} />
              <span>{redeeming ? 'Unlocking...' : 'Redeem 50 PTS'}</span>
            </button>
          </div>
        </div>

        <hr className="divider" />

        <div className="coupons-section">
          <h3><Ticket size={18} /> Your Active Coupons ({user.coupons?.length || 0})</h3>

          {!user.coupons || user.coupons.length === 0 ? (
            <div className="no-coupons">
              <Ticket size={32} />
              <p>You haven't redeemed any coupons yet. Add reviews to earn points!</p>
            </div>
          ) : (
            <div className="coupons-grid">
              {user.coupons.map((c, idx) => (
                <div key={idx} className="coupon-card">
                  <div className="coupon-left">
                    <div className="coupon-code-display">{c.code}</div>
                    <div className="coupon-shop">{c.shopName}</div>
                    <div className="coupon-date">Redeemed on {new Date(c.redeemedAt).toLocaleDateString()}</div>
                  </div>
                  <button className="copy-code-btn" onClick={() => handleCopy(c.code)}>
                    {copiedCode === c.code ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
