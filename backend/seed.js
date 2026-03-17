require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const Issue    = require('./models/Issue');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicconnect');
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Issue.deleteMany({});
  console.log('Cleared existing data');

  // Create users (plain-text passwords — the User model's pre-save hook hashes them)
  const admin = await User.create({
    name: 'Admin User', email: 'admin@civic.com',
    password: 'admin123', role: 'admin', reputationScore: 0
  });
  const citizen = await User.create({
    name: 'Priya Sharma', email: 'user@civic.com',
    password: 'user123', role: 'citizen', reputationScore: 40
  });
  const citizen2 = await User.create({
    name: 'Amit Singh', email: 'amit@civic.com',
    password: 'user123', role: 'citizen', reputationScore: 20
  });

  console.log('✅ Users created');
  console.log('   Admin:   admin@civic.com / admin123');
  console.log('   Citizen: user@civic.com  / user123');

  // Create sample issues
  const issues = [
    {
      title: 'Large pothole on MG Road', category: 'pothole', priority: 'high',
      status: 'PENDING_VERIFICATION', description: 'Dangerous 30cm deep pothole causing accidents near bus stop.',
      location: { type:'Point', coordinates:[77.2090, 28.6139], address:'MG Road, Sector 5' },
      reporter: citizen._id, upvotes: 24,
      aiPrediction: 'pothole', aiConfidence: 0.91, aiMatchedCategory: true,
      images: { before: '', after: '' }
    },
    {
      title: 'Overflowing garbage bin at City Park', category: 'garbage', priority: 'medium',
      status: 'IN_PROGRESS', description: 'Public bin overflowing for 3 days. Health hazard for park visitors.',
      location: { type:'Point', coordinates:[77.2150, 28.6200], address:'City Park, Block B' },
      reporter: citizen2._id, upvotes: 18,
      aiPrediction: 'garbage', aiConfidence: 0.85, aiMatchedCategory: true,
      blockchainTxHash: '0xmockseededhash001', complaintHash: 'sha256mockseeded001',
      images: { before: '', after: '' }
    },
    {
      title: 'Streetlights out on 5th Avenue', category: 'streetlight', priority: 'low',
      status: 'RESOLVED', description: 'Three consecutive streetlights non-functional for 2 weeks.',
      location: { type:'Point', coordinates:[77.2000, 28.6080], address:'5th Avenue, Block C' },
      reporter: citizen._id, upvotes: 9,
      aiPrediction: 'streetlight', aiConfidence: 0.78, aiMatchedCategory: true,
      blockchainTxHash: '0xmockseededhash002', complaintHash: 'sha256mockseeded002',
      images: { before: '', after: '' }, resolvedAt: new Date()
    },
    {
      title: 'Water pipe burst near Metro Station', category: 'water', priority: 'high',
      status: 'ASSIGNED', description: 'Major pipe burst causing flooding and traffic disruption.',
      location: { type:'Point', coordinates:[77.1950, 28.6100], address:'Station Road, Near Metro' },
      reporter: citizen2._id, upvotes: 41,
      aiPrediction: 'water', aiConfidence: 0.88, aiMatchedCategory: true,
      blockchainTxHash: '0xmockseededhash003', assignedWorker: 'Team Alpha',
      images: { before: '', after: '' }
    },
    {
      title: 'Road damage after monsoon', category: 'road', priority: 'high',
      status: 'SUSPICIOUS', description: 'Entire stretch cracked and subsiding. Risky for two-wheelers.',
      location: { type:'Point', coordinates:[77.2200, 28.6050], address:'Ring Road, Section 12' },
      reporter: citizen._id, upvotes: 32,
      aiPrediction: 'garbage', aiConfidence: 0.42, aiMatchedCategory: false,
      images: { before: '', after: '' }
    },
    {
      title: 'Drainage blockage causing street flooding', category: 'water', priority: 'medium',
      status: 'VERIFIED', description: 'Storm drain blocked with debris. Water backing into residential area.',
      location: { type:'Point', coordinates:[77.2050, 28.6180], address:'Civil Lines, Pocket 3' },
      reporter: citizen._id, upvotes: 15,
      aiPrediction: 'water', aiConfidence: 0.80, aiMatchedCategory: true,
      blockchainTxHash: '0xmockseededhash004', complaintHash: 'sha256mockseeded004',
      images: { before: '', after: '' }
    },
  ];

  for (const d of issues) {
    await Issue.create(d);
  }
  console.log(`✅ ${issues.length} sample issues created`);
  console.log('\n🚀 Seed complete! Start the server with: npm run dev');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
