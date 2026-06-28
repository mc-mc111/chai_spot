const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true },
  shopName: { type: String, required: true },
  pointsSpent: { type: Number, required: true },
  redeemedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0, min: 0 },
  coupons: [CouponSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
