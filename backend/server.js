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

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Permissive CORS for deployed environments
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('ChaiSpot API Server is running...');
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
