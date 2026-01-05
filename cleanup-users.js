require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azizboughanmi9:xS6jJ7kBXTXhzaAv@draxlmaier-cluster.b9282.mongodb.net/draxlmaier-app?retryWrites=true&w=majority';

async function cleanupUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Supprimer tous les utilisateurs sauf l'admin principal
    const result = await User.deleteMany({ 
      email: { 
        $nin: ['admin@gmail.com'] // Garder seulement l'admin
      } 
    });

    console.log(`🗑️  ${result.deletedCount} utilisateur(s) supprimé(s)`);
    console.log('✅ Base de données nettoyée\n');
    
    // Afficher les utilisateurs restants
    const remainingUsers = await User.find();
    console.log('👥 Utilisateurs restants:');
    remainingUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupUsers();
