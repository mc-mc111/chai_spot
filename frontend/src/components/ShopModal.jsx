import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Navigation, MessageSquare, Edit, LogIn } from 'lucide-react';
import { reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReviewForm from './ReviewForm';

const ShopModal = ({ shop, onClose, onRequestDirections, onUpdateShopMetrics, onShowToast, onOpenAuth }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (shop) {
      fetchReviews();
    }
  }, [shop]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await reviewAPI.getShopReviews(shop._id);
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (!shop) return null;

  const existingUserReview = user ? reviews.find(r => (r.userId?._id || r.userId) === user._id) : null;

  const handleReviewSubmitted = (data) => {
    fetchReviews();
    if (data.shopMetrics && onUpdateShopMetrics) {
      onUpdateShopMetrics(shop._id, data.shopMetrics);
    }
    setIsEditing(false);
  };

  return (
    <div className="google-maps-side-panel">
      <button className="side-panel-close-btn" onClick={onClose} title="Close Panel">
        <X size={18} />
      </button>

      <div className="shop-modal-hero" style={{ backgroundImage: `url(${shop.photoUrl})` }}>
        <div className="hero-overlay">
          <h2 className="shop-modal-title">{shop.name}</h2>
          <p className="shop-modal-address">
            <MapPin size={15} />
            <span>{shop.address}</span>
          </p>
        </div>
      </div>

      <div className="shop-modal-body">
        <div className="shop-meta-bar">
          <div className="meta-item rating">
            <Star size={18} className="star-filled" />
            <span className="rating-num">{shop.averageRating ? shop.averageRating.toFixed(1) : 'New'}</span>
            <span className="rating-sub">({loadingReviews ? (shop.reviewCount || 0) : reviews.length} reviews)</span>
          </div>

          <button 
            className="directions-action-btn"
            onClick={() => {
              onRequestDirections(shop);
            }}
          >
            <Navigation size={15} />
            <span>Directions</span>
          </button>
        </div>

        {shop.description && (
          <div className="shop-description-box">
            <h3>About this Spot</h3>
            <p>{shop.description}</p>
          </div>
        )}

        <hr className="divider" />

        <div className="reviews-section">
          <div className="reviews-header">
            <h3>Community Reviews ({loadingReviews ? (shop.reviewCount || 0) : reviews.length})</h3>
            {existingUserReview && !isEditing && (
              <button className="edit-review-toggle" onClick={() => setIsEditing(true)}>
                <Edit size={14} />
                <span>Edit My Review</span>
              </button>
            )}
          </div>

          {!user ? (
            <div className="login-prompt-card">
              <p>Sign in to leave a review & earn up to <strong>+15 Chai Points</strong>!</p>
              <button className="auth-prompt-btn" onClick={onOpenAuth}>
                <LogIn size={16} />
                <span>Sign In / Register</span>
              </button>
            </div>
          ) : (
            (!existingUserReview || isEditing) && (
              <ReviewForm 
                shop={shop} 
                existingReview={existingUserReview}
                onReviewSubmitted={handleReviewSubmitted}
                onShowToast={onShowToast}
              />
            )
          )}

          {loadingReviews ? (
            <div className="reviews-loading">Loading community feedback...</div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">
              <MessageSquare size={28} />
              <p>No reviews yet! Be the first to discover this spot and earn +15 bonus points!</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((rev) => {
                const reviewerName = rev.userId?.name || 'Chai Lover';
                const isMyReview = user && (rev.userId?._id || rev.userId) === user._id;

                return (
                  <div key={rev._id} className={`review-card ${isMyReview ? 'my-review' : ''}`}>
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {reviewerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong className="reviewer-name">
                            {reviewerName} {isMyReview && <span className="you-badge">(You)</span>}
                          </strong>
                          <span className="review-date">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={14} 
                            className={s <= rev.rating ? 'star-filled' : 'star-empty'} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="review-comment">{rev.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
