const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  passwordHash: String,
  role: String,
  active: Boolean,
  fcmToken: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createMike() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'mike@company.com';
    const password = 'mike123';
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log(`⚠️  User ${email} already exists. Updating password...`);
      user.passwordHash = passwordHash;
      user.firstname = 'Mike';
      user.lastname = 'Employee';
      user.role = 'employee';
      user.active = true;
      await user.save();
      console.log(`✅ Updated user: ${email}`);
    } else {
      console.log(`Creating new user: ${email}`);
      user = new User({
        firstname: 'Mike',
        lastname: 'Employee',
        email: email,
        passwordHash: passwordHash,
        role: 'employee',
        active: true
      });
      await user.save();
      console.log(`✅ Created user: ${email}`);
    }

    console.log('\n=== Login Credentials ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n✨ You can now login with this account!\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createMike();
