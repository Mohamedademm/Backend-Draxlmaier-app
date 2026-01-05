const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testMatriculeAPI() {
  try {
    console.log('🧪 Test 1: Login en tant qu\'admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login réussi! Token obtenu\n');
    
    // Configuration des headers avec le token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('🧪 Test 2: Récupérer les statistiques...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/matricules/stats`, config);
      console.log('✅ Stats:', statsResponse.data);
    } catch (error) {
      console.log('❌ Erreur stats:', error.response?.data || error.message);
    }
    
    console.log('\n🧪 Test 3: Récupérer tous les matricules...');
    try {
      const matriculesResponse = await axios.get(`${BASE_URL}/matricules`, config);
      console.log('✅ Matricules:', matriculesResponse.data);
    } catch (error) {
      console.log('❌ Erreur matricules:', error.response?.data || error.message);
    }
    
    console.log('\n🧪 Test 4: Créer un matricule de test...');
    try {
      const createResponse = await axios.post(`${BASE_URL}/matricules/create`, {
        matricule: 'TEST001',
        nom: 'TestNom',
        prenom: 'TestPrenom',
        poste: 'Testeur',
        department: 'Qualité'
      }, config);
      console.log('✅ Matricule créé:', createResponse.data);
    } catch (error) {
      console.log('❌ Erreur création:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testMatriculeAPI();
