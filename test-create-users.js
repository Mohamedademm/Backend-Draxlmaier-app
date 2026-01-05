require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

async function loginAsAdmin() {
  try {
    console.log(`\n${colors.blue}🔐 Connexion en tant qu'admin...${colors.reset}`);
    console.log(`URL: ${API_URL}/auth/login`);
    console.log(`Credentials: admin@gmail.com / admin`);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'admin'
    });

    const token = response.data.token;
    console.log(`${colors.green}✅ Connexion réussie !${colors.reset}`);
    console.log(`Token: ${token.substring(0, 20)}...`);
    
    return token;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur de connexion:${colors.reset}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Pas de réponse du serveur');
      console.error('Vérifiez que le serveur tourne sur http://localhost:3000');
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

async function createUser(token, userData) {
  try {
    console.log(`\n${colors.blue}👤 Création de l'utilisateur: ${userData.email}${colors.reset}`);
    
    const response = await axios.post(`${API_URL}/users`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`${colors.green}✅ Utilisateur créé avec succès !${colors.reset}`);
    console.log('Détails:', {
      email: response.data.user.email,
      role: response.data.user.role,
      firstname: response.data.user.firstname,
      lastname: response.data.user.lastname
    });
    
    return response.data.user;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur création:${colors.reset}`, error.response?.data || error.message);
    throw error;
  }
}

async function testCreateUsers() {
  try {
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}  TEST DE CRÉATION D'UTILISATEURS${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    // 1. Connexion en tant qu'admin
    const adminToken = await loginAsAdmin();

    // 2. Créer un employé
    const employee = {
      firstname: "adem",
      lastname: "adem",
      email: "ademuser@gmail.com",
      password: "123456",
      phone: "+33123456789",
      department: "Production",
      role: "employee"
    };
    await createUser(adminToken, employee);

    // 3. Créer un manager
    const manager = {
      firstname: "adem",
      lastname: "adem",
      email: "ademmanager@gmail.com",
      password: "123456",
      phone: "+33123456790",
      department: "Management",
      role: "manager"
    };
    await createUser(adminToken, manager);

    // 4. Test: Le manager peut-il créer un employé ?
    console.log(`\n${colors.blue}🔐 Connexion en tant que manager...${colors.reset}`);
    const managerLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'ademmanager@gmail.com',
      password: '123456'
    });
    const managerToken = managerLoginResponse.data.token;
    console.log(`${colors.green}✅ Manager connecté !${colors.reset}`);

    const employeeByManager = {
      firstname: "Test",
      lastname: "Employee",
      email: "testemployee@gmail.com",
      password: "123456",
      phone: "+33123456791",
      department: "Testing",
      role: "employee"
    };
    await createUser(managerToken, employeeByManager);

    // 5. Test: Le manager peut-il créer un admin ? (devrait échouer)
    console.log(`\n${colors.yellow}🧪 Test: Manager essaie de créer un admin (devrait échouer)...${colors.reset}`);
    try {
      const adminByManager = {
        firstname: "Test",
        lastname: "Admin",
        email: "testadmin@gmail.com",
        password: "123456",
        role: "admin"
      };
      await createUser(managerToken, adminByManager);
    } catch (error) {
      console.log(`${colors.green}✅ Correct ! Le manager ne peut pas créer d'admin${colors.reset}`);
      console.log(`Message: ${error.response?.data?.message || error.message}`);
    }

    console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✅ TOUS LES TESTS SONT RÉUSSIS !${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    console.log(`\n📋 COMPTES CRÉÉS :`);
    console.log(`   1. Employee: ademuser@gmail.com / 123456`);
    console.log(`   2. Manager: ademmanager@gmail.com / 123456`);
    console.log(`   3. Employee (by manager): testemployee@gmail.com / 123456`);

  } catch (error) {
    console.error(`\n${colors.red}❌ TEST ÉCHOUÉ:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Vérifier que le serveur est lancé
console.log(`${colors.blue}🔍 Vérification du serveur...${colors.reset}`);
console.log(`API URL: ${API_URL}`);
console.log(`Assurez-vous que le serveur backend est lancé sur le port 3000\n`);

testCreateUsers();
