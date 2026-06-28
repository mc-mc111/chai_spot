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

const reviewedShops = [
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

const unreviewedShops = [
  {
    name: 'Guruswamy Tiffin & Chai Corner',
    address: 'Bhavanipuram Main Road, Vijayawada, Andhra Pradesh 520012',
    location: { type: 'Point', coordinates: [80.5950, 16.5250] },
    description: 'Local favorite for quick morning elachi chai and piping hot crisp samosas.',
    photoUrl: 'https://images.unsplash.com/photo-1571934811356-5cc531a6821f?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Satyanarayanapuram Lemon Tea Point',
    address: 'Railway Station Road, Satyanarayanapuram, Vijayawada, Andhra Pradesh 520011',
    location: { type: 'Point', coordinates: [80.6280, 16.5210] },
    description: 'Refreshing honey lemon tea and mint herbal brews perfect for train travelers.',
    photoUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Kanaka Durga Temple Hillside Chai Stop',
    address: 'Ghat Road, Indrakeeladri, Vijayawada, Andhra Pradesh 520001',
    location: { type: 'Point', coordinates: [80.6080, 16.5150] },
    description: 'Scenic tea spot serving strong ginger tea to pilgrims ascending the temple hill.',
    photoUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Autonagar Industrial Kadak Chai Stall',
    address: '100 Feet Road, Autonagar, Vijayawada, Andhra Pradesh 520007',
    location: { type: 'Point', coordinates: [80.6750, 16.4920] },
    description: 'Famous among workers for extra strong jaggery (bellam) chai served in traditional steel glasses.',
    photoUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Labbipet Tandoori Chai Hub',
    address: 'Tikka Road, Labbipet, Vijayawada, Andhra Pradesh 520010',
    location: { type: 'Point', coordinates: [80.6380, 16.5020] },
    description: 'Specialty tandoori chai infused with smoky clay pot flavors and aromatic spices.',
    photoUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Gunadala Mary Matha Tea Corner',
    address: 'Eluru Road, Gunadala, Vijayawada, Andhra Pradesh 520004',
    location: { type: 'Point', coordinates: [80.6620, 16.5280] },
    description: 'Cozy roadside stall offering hot badam milk and special green cardamom tea.',
    photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'One Town Heritage Dum Tea House',
    address: 'Kaleswara Rao Market, One Town, Vijayawada, Andhra Pradesh 520001',
    location: { type: 'Point', coordinates: [80.6120, 16.5110] },
    description: 'Vibrant heritage tea house serving classic Hyderabadi style Dum Chai since 1985.',
    photoUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Vijayawada Junction Night Chai Adda',
    address: 'Platform Road, Railway Station Zone, Vijayawada, Andhra Pradesh 520001',
    location: { type: 'Point', coordinates: [80.6210, 16.5090] },
    description: '24/7 energetic tea hub known for midnight cutting chai and fresh onion samosas.',
    photoUrl: 'https://images.unsplash.com/photo-1571934811356-5cc531a6821f?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Patamata High School Road Chai Counter',
    address: 'Pantakaluva Road, Patamata, Vijayawada, Andhra Pradesh 520010',
    location: { type: 'Point', coordinates: [80.6550, 16.4950] },
    description: 'Popular youth hangout spot serving chocolate chai, ice tea, and quick snacks.',
    photoUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Tadepalli Bypass Tea & Coffee Lounge',
    address: 'NH 16 Bypass Road, Tadepalli, Vijayawada region, Andhra Pradesh 522501',
    location: { type: 'Point', coordinates: [80.6050, 16.4850] },
    description: 'Spacious highway break stop offering filter coffee, ginger tea, and ample parking.',
    photoUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'
  }
];

const seedData = async () => {
  await connectDB();

  try {
    let adminUser = await User.findOne({ email: 'admin@chaispot.app' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'ChaiSpot Admin',
        email: 'admin@chaispot.app',
        password: '$2a$10$X1z...hashedpasswordplaceholder...',
        points: 100
      });
    }

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

    // 1. Seed shops with initial reviews
    for (const s of reviewedShops) {
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

      const existingReviews = await Review.find({ shopId: shop._id });
      if (existingReviews.length === 0) {
        let sumRating = 0;
        for (let i = 0; i < reviewers.length; i++) {
          const rating = 4 + (i % 2);
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

    // 2. Seed 10 new shops WITHOUT any reviews
    for (const s of unreviewedShops) {
      let shop = await Shop.findOne({ name: s.name });
      if (!shop) {
        shop = await Shop.create({
          ...s,
          createdBy: adminUser._id,
          averageRating: 0,
          reviewCount: 0
        });
        console.log(`Added unreviewed shop: ${shop.name}`);
      } else {
        // Ensure no reviews exist and metrics are 0
        await Review.deleteMany({ shopId: shop._id });
        await Shop.findByIdAndUpdate(shop._id, {
          averageRating: 0,
          reviewCount: 0
        });
        console.log(`Reset unreviewed shop: ${shop.name}`);
      }
    }

    console.log('✅ 10 unreviewed Vijayawada chai spots seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
