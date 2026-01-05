require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azizboughanmi9:xS6jJ7kBXTXhzaAv@draxlmaier-cluster.b9282.mongodb.net/draxlmaier-app?retryWrites=true&w=majority';

async function checkAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const admin = await User.findOne({ email: 'admin@gmail.com' }).select('+passwordHash');
    
    if (!admin) {
      console.log('❌ Aucun admin trouvé avec cet email');
    } else {
      console.log('\n📋 Détails du compte admin:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Status:', admin.status);
      console.log('Firstname:', admin.firstname);
      console.log('Lastname:', admin.lastname);
      console.log('Password Hash:', admin.passwordHash ? 'Présent ✅' : 'Absent ❌');
      console.log('Hash début:', admin.passwordHash?.substring(0, 20));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
