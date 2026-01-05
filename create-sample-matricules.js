const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function createSampleMatricules() {
  try {
    console.log('🔐 Connexion en tant qu\'admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connecté!\n');
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('📝 Création de matricules d\'exemple...');
    
    const matricules = [
      {
        matricule: 'MAT001',
        nom: 'Dupont',
        prenom: 'Jean',
        poste: 'Technicien',
        department: 'Qualité'
      },
      {
        matricule: 'MAT002',
        nom: 'Martin',
        prenom: 'Sophie',
        poste: 'Ingénieur',
        department: 'Logistique'
      },
      {
        matricule: 'MAT003',
        nom: 'Bernard',
        prenom: 'Pierre',
        poste: 'Opérateur',
        department: 'MM Shift A'
      },
      {
        matricule: 'MAT004',
        nom: 'Dubois',
        prenom: 'Marie',
        poste: 'Opérateur',
        department: 'MM Shift B'
      },
      {
        matricule: 'MAT005',
        nom: 'Petit',
        prenom: 'Luc',
        poste: 'Technicien',
        department: 'SZB Shift A'
      }
    ];
    
    for (const mat of matricules) {
      try {
        const response = await axios.post(`${BASE_URL}/matricules/create`, mat, config);
        console.log(`✅ ${mat.matricule} créé: ${mat.prenom} ${mat.nom}`);
      } catch (error) {
        if (error.response?.data?.message?.includes('existe déjà')) {
          console.log(`⚠️  ${mat.matricule} existe déjà`);
        } else {
          console.log(`❌ Erreur ${mat.matricule}:`, error.response?.data?.message || error.message);
        }
      }
    }
    
    console.log('\n📊 Récupération des statistiques...');
    const statsResponse = await axios.get(`${BASE_URL}/matricules/stats`, config);
    console.log('Stats:', statsResponse.data.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

createSampleMatricules();
