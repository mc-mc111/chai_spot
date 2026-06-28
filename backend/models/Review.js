const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true }
}, { timestamps: true });

// Enforce unique review per user per shop
ReviewSchema.index({ shopId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
