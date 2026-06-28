const express = require('express');
const router = express.Router({ mergeParams: true });
const { getShopReviews, addReview, updateReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getShopReviews);
router.post('/', protect, addReview);
router.put('/:reviewId', protect, updateReview);

module.exports = router;
