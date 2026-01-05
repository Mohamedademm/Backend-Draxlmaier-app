const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function debugCreateUser() {
  try {
    // 1. Login
    console.log('🔐 Connexion admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token reçu:', token.substring(0, 30) + '...\n');
    
    // 2. Créer un utilisateur
    console.log('👤 Création d\'un utilisateur test...');
    console.log('URL:', `${API_URL}/users`);
    console.log('Headers:', {
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    });
    console.log('Body:', {
      firstname: 'testadmin',
      lastname: 'testadmin',
      email: 'admin1@gmail.com',
      password: '123456',
      role: 'admin'
    });
    console.log('');
    
    const createResponse = await axios.post(`${API_URL}/users`, {
      firstname: 'testadmin',
      lastname: 'testadmin',
      email: 'admin1@gmail.com',
      password: '123456',
      role: 'admin'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Utilisateur créé avec succès !');
    console.log('Réponse:', JSON.stringify(createResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else {
      console.error(error.message);
    }
  }
}

debugCreateUser();
