# ChaiSpot ☕ — Chai Shop Discovery & Rewards Platform

ChaiSpot is a full-stack MERN platform designed for tea lovers to discover nearby chai spots on an interactive map, obtain driving directions, write community reviews, and earn reward points redeemable for chai discount coupon codes.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (Vite), Mapbox GL JS / Leaflet, Lucide Icons, CSS3 (Vanilla design system with dark glassmorphism).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (Mongoose ORM).
- **Geospatial & Navigation**: Mapbox Geocoding API & Mapbox Directions API / OSRM.
- **Authentication**: JSON Web Tokens (JWT) + bcrypt password hashing.

---

## 🚀 Deployment Guide (Render & Vercel)

### 1. Backend Deployment on Render
1. Connect your GitHub repository (`https://github.com/mc-mc111/chai_spot.git`) to **Render**.
2. Select **Web Service** and set the **Root Directory** to `backend`.
3. Set Build Command: `npm install`
4. Set Start Command: `node server.js`
5. Add Environment Variables in Render Dashboard:
   - `MONGODB_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_secure_jwt_secret_key`
   - `MAPBOX_ACCESS_TOKEN`: `your_mapbox_access_token`
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app`

### 2. Frontend Deployment on Vercel
1. Import the repository in **Vercel**.
2. Set Framework Preset to **Vite**.
3. Set Root Directory to `frontend`.
4. Add Environment Variables in Vercel Dashboard:
   - `VITE_API_BASE_URL`: `https://your-backend-app.onrender.com/api`
   - `VITE_MAPBOX_TOKEN`: `your_mapbox_public_token`

---

## ⚙️ Local Setup Instructions

### Backend Setup
```bash
cd backend
npm install
# Create a .env file (refer to .env.example)
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Create a .env file (refer to .env.example)
npm run dev
```

---

## 🗄️ Database Models (Mongoose Schemas)

### 1. User Model (`User.js`)
Stores user authentication credentials, accumulated point balance, and array of redeemed coupons.
- `name` (String, required): Full name of the user.
- `email` (String, required, unique, lowercase): User login email.
- `password` (String, required): Bcrypt hashed password.
- `points` (Number, default: 0): Total reward points balance.
- `redeemedCoupons` (Array of Embedded Objects): Stores coupon redemption logs:
  - `code` (String): Generated mock coupon code (e.g. `CHAI-X7K2P9`).
  - `shopName` (String): Name of shop coupon was redeemed for.
  - `pointsSpent` (Number): Points cost deducted (e.g. 50).
  - `redeemedAt` (Date, default: `Date.now`): Timestamp of redemption.
- `createdAt`, `updatedAt` (Date): Automatic Mongoose timestamps.

### 2. Shop Model (`Shop.js`)
Stores shop metadata and GeoJSON location coordinates.
- `name` (String, required): Name of the chai spot.
- `address` (String, required): Human-readable street address.
- `location` (GeoJSON Point Object, indexed `2dsphere`):
  - `type` (String, enum: `['Point']`, default: `'Point'`).
  - `coordinates` (Array of Numbers: `[longitude, latitude]`).
- `description` (String): Short description of tea specialties and atmosphere.
- `photoUrl` (String): Image URL for shop header card.
- `averageRating` (Number, default: 0): Dynamically updated average star rating.
- `reviewCount` (Number, default: 0): Total number of community reviews.
- `createdBy` (ObjectId, ref: `'User'`): User ID of shop creator.
- `createdAt`, `updatedAt` (Date): Automatic Mongoose timestamps.

### 3. Review Model (`Review.js`)
Stores individual ratings and feedback.
- `shopId` (ObjectId, ref: `'Shop'`, required): Target shop ID.
- `userId` (ObjectId, ref: `'User'`, required): Author user ID.
- `rating` (Number, required, min: 1, max: 5): Star rating.
- `comment` (String, required): Review comment text.
- `createdAt`, `updatedAt` (Date): Automatic Mongoose timestamps.
- **Compound Unique Index**: `{ shopId: 1, userId: 1 }` — strictly prevents duplicate reviews for the same shop by the same user.

---

## 📡 Complete System API Routes

### 🔐 Authentication Routes (`/api/auth`)
- `POST /api/auth/register`: Register a new user account (returns JWT token + user profile).
- `POST /api/auth/login`: Authenticate existing user (returns JWT token + user profile).
- `GET /api/auth/me`: Fetch authenticated user profile and current point balance (Protected by JWT middleware).

### ☕ Shop Management & Navigation Routes (`/api/shops`)
- `GET /api/shops`: Retrieve all chai spots with average ratings and location coordinates.
- `POST /api/shops`: Create a new chai spot with server-side address geocoding (Protected by JWT middleware).
- `GET /api/shops/directions`: Calculate driving route geometry and turn-by-turn steps between start and destination coordinates.
- `GET /api/shops/geocode-start`: Forward geocode a starting address text string into coordinates.
- `GET /api/shops/autocomplete`: Fetch live address autocomplete suggestions as user types a start location.

### ⭐ Community Review Routes (`/api/shops/:shopId/reviews`)
- `GET /api/shops/:shopId/reviews`: Fetch all community reviews for a specific shop with user author populates.
- `POST /api/shops/:shopId/reviews`: Submit a review. Awards +10 standard points or +15 bonus points for discovering a 0-review shop (Protected by JWT middleware).
- `PUT /api/shops/:shopId/reviews/:reviewId`: Edit an existing review (Protected by JWT middleware).
- `DELETE /api/shops/:shopId/reviews/:reviewId`: Delete a review and recalculate shop rating metrics (Protected by JWT middleware).

### 🎁 Rewards & Coupon Routes (`/api/rewards`)
- `POST /api/rewards/redeem`: Deduct 50 points and generate a unique mock discount coupon code (Protected by JWT middleware).
- `GET /api/rewards/history`: Fetch user's active and historical redeemed coupon codes (Protected by JWT middleware).

---

## 🧠 Design Decisions & Edge Cases Handled

- **Server-Side Geocoding**: Address geocoding is executed strictly on the server via Mapbox/OSM Geocoding API before database insertion. If geocoding returns 0 results, a clean 400 error is returned.
- **Points & First Discoverer Bonus**: Users receive +10 points for reviewing a shop. If a shop has 0 existing reviews, the user earns a +15 points "First Discoverer Bonus".
- **Atomic Points & Coupon Redemption**: Points redemption is validated server-side (`user.points >= pointsCost`). Redemptions deduct points and push generated codes (`CHAI-XXXXXX`) atomically.
- **Dual-Mode Directions**: Supports browser GPS geolocation, manual start address geocoding, and map location picking. Draws exact route geometry with live driving simulation.

---

## 🔮 Future Improvements with More Time
1. **Caching & Redis**: Cache geocoding results and popular shop queries to minimize external API rate limits.
2. **Photo Uploads**: Integrate Cloudinary / S3 for direct image uploads instead of image URLs.
3. **Geo-Fencing Verification**: Require users to be within a 1km radius of a chai shop (via GPS) before posting a review to prevent review spamming.
