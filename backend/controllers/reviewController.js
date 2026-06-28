const Review = require('../models/Review');
const Shop = require('../models/Shop');
const User = require('../models/User');

// Helper to recalculate shop average rating & review count
const recalculateShopRating = async (shopId) => {
  const reviews = await Review.find({ shopId });
  const count = reviews.length;
  let average = 0;
  if (count > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    average = Math.round((sum / count) * 10) / 10; // 1 decimal place
  }
  await Shop.findByIdAndUpdate(shopId, {
    averageRating: average,
    reviewCount: count
  });
  return { average, count };
};

// @desc    Get all reviews for a specific shop
// @route   GET /api/shops/:shopId/reviews
const getShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;
    const reviews = await Review.find({ shopId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
};

// @desc    Add a review for a shop & earn points
// @route   POST /api/shops/:shopId/reviews
const addReview = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Chai shop not found.' });
    }

    // Check if user already reviewed this shop
    const existingReview = await Review.findOne({ shopId, userId: req.user._id });
    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already submitted a review for this shop. You can edit your existing review instead.' 
      });
    }

    // Determine points bonus: +15 if shop currently has zero reviews, else +10
    const currentReviewCount = await Review.countDocuments({ shopId });
    const pointsAwarded = currentReviewCount === 0 ? 15 : 10;

    // Create review
    const review = await Review.create({
      shopId,
      userId: req.user._id,
      rating: numericRating,
      comment
    });

    // Update user points
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { points: pointsAwarded } },
      { new: true }
    ).select('-password');

    // Recalculate shop metrics
    const shopMetrics = await recalculateShopRating(shopId);

    const populatedReview = await review.populate('userId', 'name email');

    res.status(201).json({
      review: populatedReview,
      pointsAwarded,
      userPoints: updatedUser.points,
      shopMetrics
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: error.message || 'Failed to add review.' });
  }
};

// @desc    Update an existing review
// @route   PUT /api/shops/:shopId/reviews/:reviewId
const updateReview = async (req, res) => {
  try {
    const { shopId, reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this review.' });
    }

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;

    await review.save();

    // Recalculate shop rating
    const shopMetrics = await recalculateShopRating(shopId);
    const populatedReview = await review.populate('userId', 'name email');

    res.json({
      review: populatedReview,
      shopMetrics
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: error.message || 'Failed to update review.' });
  }
};

module.exports = {
  getShopReviews,
  addReview,
  updateReview
};
