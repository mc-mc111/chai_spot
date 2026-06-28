import React, { useState, useEffect } from 'react';
import { Star, Send, Edit3 } from 'lucide-react';
import { reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReviewForm = ({ shop, existingReview, onReviewSubmitted, onShowToast }) => {
  const { user, updateUserPointsAndCoupons } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(5);
      setComment('');
    }
  }, [existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) {
      setError('Please write a short comment about your chai experience.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (existingReview) {
        // Edit review
        const res = await reviewAPI.updateReview(shop._id, existingReview._id, { rating, comment });
        onShowToast('Review updated successfully!', 'success');
        onReviewSubmitted(res.data);
      } else {
        // Create review
        const res = await reviewAPI.addReview(shop._id, { rating, comment });
        const { pointsAwarded, userPoints, shopMetrics } = res.data;
        
        // Update global user points state
        updateUserPointsAndCoupons(userPoints);

        const isBonus = pointsAwarded === 15;
        onShowToast(`🎉 Review submitted! Earned +${pointsAwarded} PTS ${isBonus ? '(First spot discoverer bonus!)' : ''}`, 'success');
        onReviewSubmitted(res.data);
      }
    } catch (err) {
      console.error('Submit review error:', err);
      const msg = err.response?.data?.message || 'Failed to submit review.';
      setError(msg);
      onShowToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="review-login-prompt">
        <p>Please log in or sign up to leave a review and earn chai reward points! ☕</p>
      </div>
    );
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h4>{existingReview ? 'Edit Your Review' : 'Write a Review & Earn Points'}</h4>
      
      {error && <div className="form-error">{error}</div>}

      <div className="star-rating-picker">
        <label>Rating:</label>
        <div className="stars-row">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className={`star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star size={22} />
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <textarea
          rows={3}
          placeholder="How was the chai? (e.g. Perfectly spiced Kadak Chai, great ambiance!)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button type="submit" className="submit-review-btn" disabled={submitting}>
        {existingReview ? <Edit3 size={16} /> : <Send size={16} />}
        <span>{submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review (+Points)'}</span>
      </button>
    </form>
  );
};

export default ReviewForm;
