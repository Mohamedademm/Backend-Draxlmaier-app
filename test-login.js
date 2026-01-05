require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azizboughanmi9:xS6jJ7kBXTXhzaAv@draxlmaier-cluster.b9282.mongodb.net/draxlmaier-app?retryWrites=true&w=majority';

async function testLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer l'admin
    const admin = await User.findOne({ email: 'admin@gmail.com' }).select('+passwordHash');
    
    if (!admin) {
      console.log('❌ Admin non trouvé');
      return;
    }

    console.log('📋 Admin trouvé:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Hash:', admin.passwordHash.substring(0, 30) + '...');

    // Test du mot de passe
    console.log('\n🔐 Test du mot de passe "admin"...');
    const isMatch = await admin.comparePassword('admin');
    
    if (isMatch) {
      console.log('✅ Mot de passe correct !');
    } else {
      console.log('❌ Mot de passe incorrect !');
      
      // Essayons de comparer directement avec bcrypt
      console.log('\n🔍 Test direct avec bcrypt...');
      const directMatch = await bcrypt.compare('admin', admin.passwordHash);
      console.log('   Résultat:', directMatch ? '✅ Match' : '❌ No match');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testLogin();
