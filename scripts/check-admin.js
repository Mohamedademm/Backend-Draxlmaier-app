const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://azizbenalaya32:12345@cluster0.hfczk.mongodb.net/employee_communication?retryWrites=true&w=majority&appName=Cluster0');
    
    const admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      console.log('✅ Admin found:', admin.email);
    } else {
      console.log('❌ No admin found');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
