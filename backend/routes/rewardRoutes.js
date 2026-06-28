const express = require('express');
const router = express.Router();
const { redeemCoupon } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.post('/redeem', protect, redeemCoupon);

module.exports = router;
