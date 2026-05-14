// backend/scripts/seed.js — Seed the database with sample data for testing
// Run: node scripts/seed.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load .env from backend root
require('dotenv').config();

const User = require('../models/User');
const Tournament = require('../models/Tournament');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB for seeding');
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([User.deleteMany(), Tournament.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // ─── Create Users ─────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@shuttlepro.com',
    password: 'admin123',
    role: 'admin',
    city: 'Indore',
    isActive: true,
  });

  const organizer = await User.create({
    name: 'Rahul Sharma',
    email: 'organizer@shuttlepro.com',
    password: 'organizer123',
    role: 'organizer',
    city: 'Mumbai',
    isActive: true,
  });

  const players = await User.insertMany([
    { name: 'Prakash Padukone', email: 'player@shuttlepro.com', password: await bcrypt.hash('player123', 12), role: 'player', city: 'Bengaluru', stats: { matchesPlayed: 10, matchesWon: 7, matchesLost: 3, winRate: 70 } },
    { name: 'Saina Nehwal',    email: 'saina@shuttlepro.com',   password: await bcrypt.hash('player123', 12), role: 'player', city: 'Hyderabad', stats: { matchesPlayed: 8, matchesWon: 6, matchesLost: 2, winRate: 75 } },
    { name: 'P.V. Sindhu',    email: 'sindhu@shuttlepro.com',  password: await bcrypt.hash('player123', 12), role: 'player', city: 'Hyderabad', stats: { matchesPlayed: 12, matchesWon: 9, matchesLost: 3, winRate: 75 } },
    { name: 'Kidambi Srikanth', email: 'srikanth@shuttlepro.com', password: await bcrypt.hash('player123', 12), role: 'player', city: 'Guntur', stats: { matchesPlayed: 15, matchesWon: 11, matchesLost: 4, winRate: 73 } },
    { name: 'H.S. Prannoy',   email: 'prannoy@shuttlepro.com', password: await bcrypt.hash('player123', 12), role: 'player', city: 'Kerala', stats: { matchesPlayed: 9, matchesWon: 5, matchesLost: 4, winRate: 55 } },
    { name: 'Lakshya Sen',    email: 'lakshya@shuttlepro.com', password: await bcrypt.hash('player123', 12), role: 'player', city: 'Almora', stats: { matchesPlayed: 7, matchesWon: 4, matchesLost: 3, winRate: 57 } },
    { name: 'Ashwini Ponnappa', email: 'ashwini@shuttlepro.com', password: await bcrypt.hash('player123', 12), role: 'player', city: 'Bengaluru', stats: { matchesPlayed: 6, matchesWon: 3, matchesLost: 3, winRate: 50 } },
    { name: 'Satwiksairaj',   email: 'satwik@shuttlepro.com',  password: await bcrypt.hash('player123', 12), role: 'player', city: 'Vijayawada', stats: { matchesPlayed: 11, matchesWon: 8, matchesLost: 3, winRate: 72 } },
  ]);

  console.log(`✅ Created ${players.length + 3} users`);

  // ─── Create Tournaments ────────────────────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const nextMonth = new Date(now.getTime() + 30 * 86400000);
  const lastWeek = new Date(now.getTime() - 7 * 86400000);

  const tournaments = await Tournament.insertMany([
    {
      name: 'Indore Open Badminton Championship 2026',
      description: 'The premier badminton tournament of Central India.',
      organizer: organizer._id,
      format: 'single_elimination',
      category: 'mens_singles',
      registrationDeadline: tomorrow,
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 2 * 86400000),
      venue: { name: 'Abhay Prashal', city: 'Indore', address: 'M.G. Road, Indore' },
      maxParticipants: 16,
      registeredCount: 8,
      entryFee: 500,
      prizeMoney: { first: 25000, second: 10000, third: 5000 },
      status: 'registration_open',
    },
    {
      name: 'Mumbai Masters Badminton 2026',
      description: 'Doubles badminton championship for mixed pairs.',
      organizer: organizer._id,
      format: 'round_robin',
      category: 'mixed_doubles',
      registrationDeadline: lastWeek,
      startDate: lastWeek,
      endDate: tomorrow,
      venue: { name: 'Shree Shivchhatrapati Sports Complex', city: 'Mumbai' },
      maxParticipants: 8,
      registeredCount: 8,
      entryFee: 0,
      prizeMoney: { first: 50000, second: 20000 },
      status: 'ongoing',
    },
    {
      name: 'Delhi Shuttle Cup 2026',
      description: "Women's singles competition for ranked players.",
      organizer: adminUser._id,
      format: 'double_elimination',
      category: 'womens_singles',
      registrationDeadline: new Date(nextMonth.getTime() - 7 * 86400000),
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 3 * 86400000),
      venue: { name: 'Siri Fort Sports Complex', city: 'New Delhi' },
      maxParticipants: 32,
      registeredCount: 0,
      entryFee: 1000,
      prizeMoney: { first: 100000, second: 50000, third: 25000 },
      status: 'upcoming',
    },
  ]);

  console.log(`✅ Created ${tournaments.length} tournaments`);
  console.log('\n🎉 Seeding complete! Demo accounts:');
  console.log('   Admin:     admin@shuttlepro.com     / admin123');
  console.log('   Organizer: organizer@shuttlepro.com / organizer123');
  console.log('   Player:    player@shuttlepro.com    / player123');

  mongoose.disconnect();
};

seedData().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
