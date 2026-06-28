# ChaiSpot ☕ — Chai Shop Discovery & Rewards Platform

ChaiSpot is a full-stack MERN platform designed for tea lovers to discover nearby chai spots on an interactive map, obtain driving directions, write community reviews, and earn reward points redeemable for chai discount coupon codes.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (Vite), Mapbox GL JS, Lucide Icons, CSS3 (Vanilla design system with dark glassmorphism).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (Mongoose ORM).
- **Geospatial & Navigation**: Mapbox Geocoding API & Mapbox Directions API.
- **Authentication**: JSON Web Tokens (JWT) + bcrypt password hashing.

---

## 🚀 Deployment Guide (Render & Vercel)

### 1. Backend Deployment on Render
1. Connect your GitHub repository (`https://github.com/mc-mc111/chai_spot.git`) to **Render**.
2. Select **Web Service** and set the **Root Directory** to `backend`.
3. Set Build Command: `npm install`
4. Set Start Command: `node server.js`
5. Add Environment Variables in Render Dashboard:
   - `MONGODB_URI`: `mongodb+srv://vijaymanicharan7920_db_user:1rmsn97Cl1JbOOAr@cluster0.sliz6jn.mongodb.net/chaispot?retryWrites=true&w=majority`
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

## 🧠 Design Decisions & Data Modeling

### 1. Data Schemas
- **User Schema**: Stores authentication credentials, point balance, and an array of redeemed coupon objects (`{ code, shopName, pointsSpent, redeemedAt }`).
- **Shop Schema**: Stores shop metadata, formatted address, GeoJSON coordinates (`[longitude, latitude]`), average rating, and total review count. Includes a 2dsphere index for spatial queries.
- **Review Schema**: Maps `shopId` and `userId` with rating (1-5) and comment. Uses a **compound unique index** (`{ shopId: 1, userId: 1 }`) to strictly block duplicate review creation server-side while permitting edits.

### 2. API & Edge Cases Handled
- **Server-Side Geocoding**: Address geocoding is executed strictly on the server via Mapbox Geocoding API before database insertion. If geocoding returns 0 results, a clean 400 error is returned.
- **Points & First Discoverer Bonus**: Users receive +10 points for reviewing a shop. If a shop has 0 existing reviews, the user earns a +15 points "First Discoverer Bonus".
- **Atomic Points & Coupon Redemption**: Points redemption is validated server-side (`user.points >= pointsCost`). Redemptions deduct points and push generated codes (`CHAI-XXXXXX`) atomically.
- **Dual-Mode Directions**: Supports browser GPS geolocation and manual start address geocoding. Draws exact route geometry on the Mapbox map.

---

## 🔮 Future Improvements with More Time
1. **Caching & Redis**: Cache Mapbox geocoding results and popular shop queries to minimize external API rate limits.
2. **Photo Uploads**: Integrate Cloudinary / S3 for direct image uploads instead of image URLs.
3. **Geo-Fencing Verification**: Require users to be within a 1km radius of a chai shop (via GPS) before posting a review to prevent review spamming.
