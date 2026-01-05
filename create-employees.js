const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://benamaraadem299_db_user:Gmdua6t1YDCwb8Gg@draxlmaier-cluster.k7i0t19.mongodb.net/draxlmaier-app?retryWrites=true&w=majority';

// User Schema (inline for this script)
const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
  active: { type: Boolean, default: true },
  fcmToken: String,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    return false;
  }
};

const User = mongoose.model('User', userSchema);

async function createEmployeeUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Users to create
    const employees = [
      {
        firstname: 'Adem',
        lastname: 'Benamara',
        email: 'adem@gamil.com',
        passwordHash: 'adem123', // Will be hashed by pre-save hook
        role: 'employee',
        active: true
      },
      {
        firstname: 'Sarah',
        lastname: 'Martin',
        email: 'sarah.martin@company.com',
        passwordHash: 'sarah123',
        role: 'employee',
        active: true
      },
      {
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean.dupont@company.com',
        passwordHash: 'jean123',
        role: 'manager',
        active: true
      },
      {
        firstname: 'Marie',
        lastname: 'Dubois',
        email: 'marie.dubois@company.com',
        passwordHash: 'marie123',
        role: 'employee',
        active: true
      }
    ];

    console.log('Creating employee users...\n');

    for (const employeeData of employees) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: employeeData.email });
        
        if (existingUser) {
          console.log(`⚠️  User ${employeeData.email} already exists. Updating...`);
          
          // Update password (will be hashed by pre-save hook)
          existingUser.passwordHash = employeeData.passwordHash;
          existingUser.firstname = employeeData.firstname;
          existingUser.lastname = employeeData.lastname;
          existingUser.role = employeeData.role;
          existingUser.active = employeeData.active;
          
          await existingUser.save();
          console.log(`✅ Updated: ${employeeData.email} (${employeeData.role})\n`);
        } else {
          // Create new user
          const user = new User(employeeData);
          await user.save();
          console.log(`✅ Created: ${employeeData.email} (${employeeData.role})`);
          console.log(`   Name: ${employeeData.firstname} ${employeeData.lastname}`);
          console.log(`   Password: ${employeeData.passwordHash.replace(/./g, '*')}\n`);
        }
      } catch (error) {
        console.error(`❌ Error with ${employeeData.email}:`, error.message);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log('Employee accounts ready for login:\n');
    
    for (const emp of employees) {
      console.log(`📧 ${emp.email}`);
      console.log(`   Password: ${emp.passwordHash}`);
      console.log(`   Role: ${emp.role}`);
      console.log(`   Name: ${emp.firstname} ${emp.lastname}\n`);
    }

    console.log('✅ All users created/updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createEmployeeUsers();
