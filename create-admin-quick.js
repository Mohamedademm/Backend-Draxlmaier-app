const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: String,
  status: String,
  active: Boolean,
  department: String,
  position: String,
  phone: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@draxlmaier.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Un compte admin existe déjà\n');
      console.log('📧 Email: admin@draxlmaier.com');
      console.log('🔑 Mot de passe: admin123\n');
      
      // Mettre à jour le mot de passe au cas où
      const salt = await bcrypt.genSalt(10);
      existingAdmin.passwordHash = await bcrypt.hash('admin123', salt);
      existingAdmin.status = 'active';
      existingAdmin.active = true;
      await existingAdmin.save();
      
      console.log('✅ Mot de passe admin réinitialisé à: admin123');
    } else {
      // Créer le compte admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const admin = new User({
        firstname: 'Admin',
        lastname: 'Dräxlmaier',
        email: 'admin@draxlmaier.com',
        passwordHash: hashedPassword,
        role: 'admin',
        status: 'active',
        active: true,
        department: 'Management',
        position: 'Administrateur Système',
        phone: '0600000000'
      });

      await admin.save();
      
      console.log('✅ Compte administrateur créé avec succès!\n');
      console.log('═══════════════════════════════════════');
      console.log('📧 Email: admin@draxlmaier.com');
      console.log('🔑 Mot de passe: admin123');
      console.log('👤 Rôle: admin');
      console.log('═══════════════════════════════════════\n');
    }

    // Créer aussi un manager de test
    const existingManager = await User.findOne({ email: 'manager@draxlmaier.com' });
    
    if (!existingManager) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('manager123', salt);

      const manager = new User({
        firstname: 'Manager',
        lastname: 'Test',
        email: 'manager@draxlmaier.com',
        passwordHash: hashedPassword,
        role: 'manager',
        status: 'active',
        active: true,
        department: 'Production',
        position: 'Manager Production',
        phone: '0611111111'
      });

      await manager.save();
      
      console.log('✅ Compte manager créé:\n');
      console.log('📧 Email: manager@draxlmaier.com');
      console.log('🔑 Mot de passe: manager123\n');
    }

    // Créer un employé de test
    const existingEmployee = await User.findOne({ email: 'employee@draxlmaier.com' });
    
    if (!existingEmployee) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('employee123', salt);

      const employee = new User({
        firstname: 'Employee',
        lastname: 'Test',
        email: 'employee@draxlmaier.com',
        passwordHash: hashedPassword,
        role: 'employee',
        status: 'active',
        active: true,
        department: 'Production',
        position: 'Technicien',
        phone: '0622222222'
      });

      await employee.save();
      
      console.log('✅ Compte employé créé:\n');
      console.log('📧 Email: employee@draxlmaier.com');
      console.log('🔑 Mot de passe: employee123\n');
    }

    console.log('═══════════════════════════════════════');
    console.log('🎉 Tous les comptes de test sont prêts!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

createAdminUser();
