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

const vijayawadaShops = [
  {
    name: 'Prakasam Barrage View Chai Spot',
    address: 'Prakasam Barrage Road, Seetharampuram, Vijayawada, Andhra Pradesh 520002',
    location: {
      type: 'Point',
      coordinates: [80.6186, 16.5062] // [lng, lat]
    },
    description: 'Famous for hot ginger chai with a breezy sunset view of Krishna river and Kanaka Durga Temple.',
    photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.8,
    reviewCount: 12
  },
  {
    name: 'Benz Circle Irani Chai Cafe',
    address: 'Benz Circle, Ring Road, Vijayawada, Andhra Pradesh 520010',
    location: {
      type: 'Point',
      coordinates: [80.6500, 16.5000]
    },
    description: 'Authentic Dum Chai served with fresh Osmania biscuits and warm Bun Maska.',
    photoUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.6,
    reviewCount: 8
  },
  {
    name: 'MG Road Kulhad Masala Chai',
    address: 'MG Road, Governorpet, Vijayawada, Andhra Pradesh 520002',
    location: {
      type: 'Point',
      coordinates: [80.6300, 16.5100]
    },
    description: 'Rich kulhad chai brewed with fresh cardamom, cinnamon, and whole authentic spices.',
    photoUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.9,
    reviewCount: 15
  },
  {
    name: 'Babai Hotel Heritage Tea Spot',
    address: 'Nageswara Rao Pantulu Road, Gandhinagar, Vijayawada, Andhra Pradesh 520003',
    location: {
      type: 'Point',
      coordinates: [80.6230, 16.5170]
    },
    description: 'Iconic heritage spot serving legendary South Indian Filter Coffee and Strong Kadak Tea.',
    photoUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    averageRating: 4.7,
    reviewCount: 20
  }
];

const seedData = async () => {
  await connectDB();

  try {
    // Create or find dummy admin user for createdBy reference
    let adminUser = await User.findOne({ email: 'admin@chaispot.app' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'ChaiSpot Admin',
        email: 'admin@chaispot.app',
        password: '$2a$10$X1z...hashedpasswordplaceholder...',
        points: 100
      });
    }

    // Insert shops if database is empty or update existing
    for (const s of vijayawadaShops) {
      const existing = await Shop.findOne({ name: s.name });
      if (!existing) {
        await Shop.create({
          ...s,
          createdBy: adminUser._id
        });
        console.log(`Added shop: ${s.name}`);
      } else {
        console.log(`Shop already exists: ${s.name}`);
      }
    }

    console.log('✅ Vijayawada predefined spots seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
