const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load models
const User = require('./src/models/User');
const Base = require('./src/models/Base');
const Asset = require('./src/models/Asset');
const Purchase = require('./src/models/Purchase');
const Transfer = require('./src/models/Transfer');
const Assignment = require('./src/models/Assignment');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/military_assets';

const bases = [
  { name: 'Forward Operating Base Alpha', location: 'Nevada Desert' },
  { name: 'Naval Station Bravo', location: 'Pacific Coast' },
  { name: 'Air Base Charlie', location: 'Northern Highlands' }
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for Seeding');

    await Base.deleteMany();
    await User.deleteMany();
    await Asset.deleteMany();
    await Purchase.deleteMany();
    await Transfer.deleteMany();
    await Assignment.deleteMany();

    const createdBases = await Base.insertMany(bases);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = [
      {
        name: 'General Admin',
        email: 'admin@military.gov',
        password: passwordHash, // raw pass is password123 but schema doesn't pre-save insertMany out of the box... Wait, insertMany DOES NOT trigger pre-save!
        // So I must hash it manually here.
        role: 'admin'
      },
      {
        name: 'Commander Shepard',
        email: 'shepard@foba.gov',
        password: passwordHash,
        role: 'commander',
        base: createdBases[0]._id
      },
      {
        name: 'Officer Jenkins',
        email: 'jenkins@nsb.gov',
        password: passwordHash,
        role: 'logistics',
        base: createdBases[1]._id
      }
    ];

    const createdUsers = await User.insertMany(users);

    const assets = [
      { assetName: 'M1 Abrams Tank', type: 'vehicle', quantity: 15, base: createdBases[0]._id },
      { assetName: 'F-35 Fighter Jet', type: 'vehicle', quantity: 5, base: createdBases[2]._id },
      { assetName: 'M4 Carbine', type: 'weapon', quantity: 500, base: createdBases[0]._id },
      { assetName: '5.56mm Ammo', type: 'ammunition', quantity: 50000, base: createdBases[0]._id },
      { assetName: 'Patrol Boat', type: 'vehicle', quantity: 10, base: createdBases[1]._id },
      { assetName: 'Torpedo', type: 'ammunition', quantity: 100, base: createdBases[1]._id }
    ];

    await Asset.insertMany(assets);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

seedData();
