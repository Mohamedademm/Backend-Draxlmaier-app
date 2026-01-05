require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azizboughanmi9:xS6jJ7kBXTXhzaAv@draxlmaier-cluster.b9282.mongodb.net/draxlmaier-app?retryWrites=true&w=majority';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer l'admin existant s'il existe
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('⚠️  Un admin existe déjà, suppression...');
      await User.deleteOne({ email: 'admin@gmail.com' });
      console.log('✅ Ancien admin supprimé\n');
    }

    // Créer le compte admin (le mot de passe sera hashé par le hook pre-save)
    const admin = new User({
      firstname: 'Admin',
      lastname: 'System',
      email: 'admin@gmail.com',
      passwordHash: 'admin', // Le pre-save hook va le hasher
      phone: '+1234567890',
      role: 'admin',
      department: 'IT',
      status: 'active',
      profileImage: 'https://ui-avatars.com/api/?name=Admin+System&background=1976d2&color=fff'
    });

    await admin.save();
    
    console.log('\n✅ Compte admin créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Mot de passe: admin');
    console.log('👤 Rôle: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 Permissions Admin:');
    console.log('   ✓ Créer des admins');
    console.log('   ✓ Créer des managers');
    console.log('   ✓ Créer des employees');
    console.log('   ✓ Accès complet au système');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');
  }
}

createAdmin();
