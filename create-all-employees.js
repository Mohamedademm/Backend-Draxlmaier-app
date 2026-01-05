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

const employees = [
  { firstname: 'John', lastname: 'Employee', email: 'john@company.com', password: 'john123', role: 'employee' },
  { firstname: 'Sarah', lastname: 'Employee', email: 'sarah@company.com', password: 'sarah123', role: 'employee' },
  { firstname: 'Mike', lastname: 'Employee', email: 'mike@company.com', password: 'mike123', role: 'employee' }
];

async function createEmployees() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    for (const emp of employees) {
      const { firstname, lastname, email, password, role } = emp;
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        console.log(`⚠️  User ${email} already exists. Updating password...`);
        user.passwordHash = passwordHash;
        user.firstname = firstname;
        user.lastname = lastname;
        user.role = role;
        user.active = true;
        await user.save();
        console.log(`✅ Updated: ${email}`);
      } else {
        console.log(`Creating: ${email}`);
        user = new User({
          firstname,
          lastname,
          email,
          passwordHash,
          role,
          active: true
        });
        await user.save();
        console.log(`✅ Created: ${email}`);
      }
    }

    console.log('\n=== Employee Login Credentials ===');
    employees.forEach(emp => {
      console.log(`📧 ${emp.email} | 🔑 ${emp.password}`);
    });
    console.log('\n✨ All employees ready to login!\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createEmployees();
