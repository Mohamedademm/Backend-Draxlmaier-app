const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://benamaraadem299_db_user:Gmdua6t1YDCwb8Gg@draxlmaier-cluster.k7i0t19.mongodb.net/draxlmaier-app?retryWrites=true&w=majority';

async function createTestUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing user if exists
    await User.deleteOne({ email: 'admin@company.com' });
    console.log('🗑️  Deleted existing user if any');

    // Create user with plain password (will be hashed by pre-save hook)
    const user = new User({
      firstname: 'Admin',
      lastname: 'User',
      email: 'admin@company.com',
      passwordHash: 'admin123',  // Will be hashed by pre-save hook
      role: 'admin'
    });

    await user.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@company.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
