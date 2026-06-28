require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('./models/Shop');
const User = require('./models/User');
const Review = require('./models/Review');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
};

const sampleReviewTexts = [
  "Best chai in Vijayawada! Perfect spices and super refreshing.",
  "Loved the authentic flavor and prompt service. Must visit for chai lovers!",
  "Great atmosphere and delicious snacks. Highly recommended!",
  "Strong kadak tea that immediately boosts your mood. 5 stars!",
  "Amazing sunset view while sipping hot ginger tea. Unforgettable experience."
];

const vijayawadaShops = [
  {
    name: 'Prakasam Barrage View Chai Spot',
    address: 'Prakasam Barrage Road, Seetharampuram, Vijayawada, Andhra Pradesh 520002',
    location: { type: 'Point', coordinates: [80.6186, 16.5062] },
    description: 'Famous for hot ginger chai with a breezy sunset view of Krishna river and Kanaka Durga Temple.',
    photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Benz Circle Irani Chai Cafe',
    address: 'Benz Circle, Ring Road, Vijayawada, Andhra Pradesh 520010',
    location: { type: 'Point', coordinates: [80.6500, 16.5000] },
    description: 'Authentic Dum Chai served with fresh Osmania biscuits and warm Bun Maska.',
    photoUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'MG Road Kulhad Masala Chai',
    address: 'MG Road, Governorpet, Vijayawada, Andhra Pradesh 520002',
    location: { type: 'Point', coordinates: [80.6300, 16.5100] },
    description: 'Rich kulhad chai brewed with fresh cardamom, cinnamon, and whole authentic spices.',
    photoUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Babai Hotel Heritage Tea Spot',
    address: 'Nageswara Rao Pantulu Road, Gandhinagar, Vijayawada, Andhra Pradesh 520003',
    location: { type: 'Point', coordinates: [80.6230, 16.5170] },
    description: 'Iconic heritage spot serving legendary South Indian Filter Coffee and Strong Kadak Tea.',
    photoUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'
  }
];

const seedData = async () => {
  await connectDB();

  try {
    // Create dummy admin user
    let adminUser = await User.findOne({ email: 'admin@chaispot.app' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'ChaiSpot Admin',
        email: 'admin@chaispot.app',
        password: '$2a$10$X1z...hashedpasswordplaceholder...',
        points: 100
      });
    }

    // Create 3 community reviewer accounts for realistic seed reviews
    const reviewers = [];
    const reviewerData = [
      { name: 'Ravi Kumar', email: 'ravi@example.com' },
      { name: 'Sridevi P.', email: 'sridevi@example.com' },
      { name: 'Anil Teja', email: 'anil@example.com' }
    ];

    for (const rData of reviewerData) {
      let u = await User.findOne({ email: rData.email });
      if (!u) {
        u = await User.create({
          ...rData,
          password: '$2a$10$X1z...hashedpasswordplaceholder...',
          points: 50
        });
      }
      reviewers.push(u);
    }

    for (const s of vijayawadaShops) {
      let shop = await Shop.findOne({ name: s.name });
      if (!shop) {
        shop = await Shop.create({
          ...s,
          createdBy: adminUser._id,
          averageRating: 5.0,
          reviewCount: 0
        });
        console.log(`Added shop: ${shop.name}`);
      }

      // Add sample reviews for each shop if none exist
      const existingReviews = await Review.find({ shopId: shop._id });
      if (existingReviews.length === 0) {
        let sumRating = 0;
        for (let i = 0; i < reviewers.length; i++) {
          const rating = 4 + (i % 2); // 4 or 5 star ratings
          sumRating += rating;
          await Review.create({
            shopId: shop._id,
            userId: reviewers[i]._id,
            rating,
            comment: sampleReviewTexts[i % sampleReviewTexts.length]
          });
        }
        const avg = Math.round((sumRating / reviewers.length) * 10) / 10;
        await Shop.findByIdAndUpdate(shop._id, {
          averageRating: avg,
          reviewCount: reviewers.length
        });
        console.log(`Seeded ${reviewers.length} reviews for ${shop.name}`);
      }
    }

    console.log('✅ Predefined Vijayawada shops and reviews seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
