const User = require('../models/User');
const Shop = require('../models/Shop');

// Helper to generate mock coupon code (e.g. CHAI-X7K2P9)
const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CHAI-${randomStr}`;
};

// @desc    Redeem points for a chai coupon
// @route   POST /api/rewards/redeem
const redeemCoupon = async (req, res) => {
  try {
    const { shopId, pointsCost = 50 } = req.body;

    const cost = Number(pointsCost);
    if (isNaN(cost) || cost <= 0) {
      return res.status(400).json({ message: 'Invalid points cost.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Edge Case handling: Server-side verification that user has sufficient points
    if (user.points < cost) {
      return res.status(400).json({ 
        message: `Insufficient point balance. You have ${user.points} points, but need ${cost} points.` 
      });
    }

    let shopName = 'All Participating Chai Spots';
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (shop) {
        shopName = shop.name;
      }
    }

    const couponCode = generateCouponCode();
    const newCoupon = {
      code: couponCode,
      shopName,
      pointsSpent: cost,
      redeemedAt: new Date()
    };

    // Deduct points and push coupon atomically
    user.points -= cost;
    user.coupons.push(newCoupon);
    await user.save();

    res.json({
      message: 'Coupon redeemed successfully!',
      coupon: newCoupon,
      remainingPoints: user.points,
      coupons: user.coupons
    });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    res.status(500).json({ message: error.message || 'Server error during redemption.' });
  }
};

module.exports = {
  redeemCoupon
};
