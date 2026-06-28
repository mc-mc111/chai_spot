require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const rewardRoutes = require('./routes/rewardRoutes');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middleware - Permissive CORS to support all Vercel domains and local dev
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Health check and keep-alive ping endpoints (ultra-lightweight for cron-job.org)
app.get(['/', '/ping', '/health', '/api/health'], (req, res) => {
  res.status(200).send('OK');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/shops/:shopId/reviews', reviewRoutes);
app.use('/api/rewards', rewardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'An unexpected server error occurred.'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ChaiSpot Backend running on port ${PORT}`);
});
