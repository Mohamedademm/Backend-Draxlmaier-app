const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin',
    department: 'Management',
    position: 'System Administrator'
  },
  {
    name: 'Manager User',
    email: 'manager@company.com',
    password: 'manager123',
    role: 'manager',
    department: 'Operations',
    position: 'Operations Manager'
  },
  {
    name: 'John Employee',
    email: 'john@company.com',
    password: 'john123',
    role: 'employee',
    department: 'IT',
    position: 'Software Developer'
  },
  {
    name: 'Sarah Employee',
    email: 'sarah@company.com',
    password: 'sarah123',
    role: 'employee',
    department: 'Marketing',
    position: 'Marketing Specialist'
  },
  {
    name: 'Mike Employee',
    email: 'mike@company.com',
    password: 'mike123',
    role: 'employee',
    department: 'Sales',
    position: 'Sales Representative'
  }
];

async function createTestUsers() {
  console.log('Creating test users...\n');
  
  for (const user of testUsers) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, user);
      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
      console.log(`   Password: ${user.password}`);
      console.log(`   User ID: ${response.data.user._id}\n`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`⚠️  User already exists: ${user.email}\n`);
      } else {
        console.error(`❌ Failed to create ${user.email}`);
        console.error(`   Error: ${error.message}`);
        if (error.code) console.error(`   Code: ${error.code}`);
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Data:`, error.response.data);
        }
        console.log('');
      }
    }
  }
  
  console.log('\n=== Test Accounts Summary ===');
  console.log('\n🔑 Admin Account:');
  console.log('   Email: admin@company.com');
  console.log('   Password: admin123');
  console.log('\n👔 Manager Account:');
  console.log('   Email: manager@company.com');
  console.log('   Password: manager123');
  console.log('\n👤 Employee Accounts:');
  console.log('   Email: john@company.com    | Password: john123');
  console.log('   Email: sarah@company.com   | Password: sarah123');
  console.log('   Email: mike@company.com    | Password: mike123');
  console.log('\n✨ You can now login with any of these accounts!\n');
}

createTestUsers().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
