const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testRegistration() {
  console.log('🧪 Testing Employee Registration\n');

  const testUser = {
    firstname: 'Emma',
    lastname: 'Wilson',
    email: 'emma.wilson@company.com',
    password: 'SecurePass123!',
    position: 'Marketing Specialist',
    phone: '+33612345678',
    location: {
      address: '45 Avenue des Champs-Élysées, 75008 Paris',
      coordinates: {
        latitude: 48.8698,
        longitude: 2.3078
      },
      busStop: {
        name: 'Champs-Élysées'
      }
    }
  };

  try {
    console.log('📝 Attempting registration with data:');
    console.log(JSON.stringify(testUser, null, 2));
    console.log('\n⏳ Sending request...\n');

    const response = await axios.post(`${API_URL}/auth/register`, testUser);

    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log(`\n📧 User created with status: ${response.data.user.status}`);
    console.log('✋ Account is pending manager approval\n');

  } catch (error) {
    if (error.response) {
      console.log('❌ Registration failed!');
      console.log(`Status: ${error.response.status}`);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network error:', error.message);
    }
  }

  // Try to login with pending account
  console.log('\n🔐 Attempting login with pending account...\n');
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    console.log('✅ Login successful:', loginResponse.data.message);
  } catch (error) {
    if (error.response) {
      console.log('❌ Login failed (expected):');
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data.message}`);
      console.log('\n✓ This is correct behavior! Account needs manager approval.\n');
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testRegistration().catch(console.error);
