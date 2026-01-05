const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testRegistration() {
  console.log('🧪 Testing Employee Registration\n');

  const testUser = {
    firstname: 'Emma',
    lastname: 'Wilson',
    email: 'emma.wilson@company.com',
    password: 'SecurePass123',
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
    console.log('📝 Sending registration request...\n');
    
    const response = await axios.post(`${API_URL}/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Registration failed!');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received from server');
      console.log('Request was made but no response:', error.request);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRegistration();
