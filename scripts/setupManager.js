const mongoose = require('mongoose');
require('dotenv').config();

// Import du script de création
const createManagerUser = require('./createManager');

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    try {
      await mongoose.connect('mongodb://localhost:27017/draxlmaier-app');
      console.log('✅ MongoDB local connecté');
    } catch (localErr) {
      console.error('❌ Impossible de se connecter à MongoDB');
      process.exit(1);
    }
  }
};

// Exécution
const run = async () => {
  console.log('🚀 Création d\'un utilisateur Manager...\n');
  
  await connectDB();
  await createManagerUser();
  
  console.log('\n✅ Script terminé!');
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
