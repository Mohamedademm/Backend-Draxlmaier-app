const User = require('../models/User');
const { generateToken } = require('../config/jwt');

/**
 * Script pour créer un utilisateur Manager
 * À exécuter une seule fois pour créer un compte manager de test
 */

const createManagerUser = async () => {
  try {
    // Configuration du manager
    const managerData = {
      firstname: 'Manager',
      lastname: 'Test',
      email: 'manager@draxlmaier.com',
      passwordHash: 'Manager123',
      role: 'manager',
      status: 'active',
      active: true,
      phone: '+33612345678',
      position: 'Chef de département',
      department: 'Direction',
      employeeId: 'MGR001'
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: managerData.email });
    if (existingUser) {
      console.log('❌ Manager déjà existant:', existingUser.email);
      return existingUser;
    }

    // Créer le manager
    const manager = new User(managerData);
    await manager.save();

    console.log('✅ Manager créé avec succès!');
    console.log('📧 Email:', managerData.email);
    console.log('🔑 Password:', 'Manager123');
    console.log('👤 Rôle:', manager.role);
    console.log('🆔 ID:', manager._id);

    return manager;
  } catch (error) {
    console.error('❌ Erreur lors de la création du manager:', error);
    throw error;
  }
};

module.exports = createManagerUser;
