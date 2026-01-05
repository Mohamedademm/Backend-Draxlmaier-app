const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function createTestMatricules() {
  try {
    console.log('🔐 Connexion admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    const config = {
      headers: { 'Authorization': `Bearer ${token}` }
    };
    
    console.log('✅ Connecté!\n');
    
    const testMatricules = [
      {
        matricule: '014',
        nom: 'Zidi',
        prenom: 'Mohamed',
        poste: 'MM admin',
        department: 'MM Shift A'
      },
      {
        matricule: 'TEST001',
        nom: 'TestNom',
        prenom: 'TestPrenom',
        poste: 'Testeur',
        department: 'Qualité'
      }
    ];
    
    for (const mat of testMatricules) {
      try {
        await axios.post(`${BASE_URL}/matricules/create`, mat, config);
        console.log(`✅ Matricule ${mat.matricule} créé: ${mat.prenom} ${mat.nom}`);
      } catch (error) {
        if (error.response?.data?.message?.includes('existe déjà')) {
          console.log(`⚠️  Matricule ${mat.matricule} existe déjà`);
        } else {
          console.log(`❌ Erreur ${mat.matricule}:`, error.response?.data?.message || error.message);
        }
      }
    }
    
    console.log('\n✅ Terminé!');
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

createTestMatricules();
