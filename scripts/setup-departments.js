const mongoose = require('mongoose');
const Department = require('../models/Department');
const ChatGroup = require('../models/ChatGroup');
const User = require('../models/User');

/**
 * Script pour créer les 6 départements avec leurs chatrooms
 * À exécuter une seule fois
 */

const DEPARTMENTS = [
  {
    name: 'Qualité',
    code: 'QUA',
    description: 'Département Qualité',
    color: '#2196F3' // Bleu
  },
  {
    name: 'Logistique',
    code: 'LOG',
    description: 'Département Logistique',
    color: '#FF9800' // Orange
  },
  {
    name: 'MM Shift A',
    code: 'MMA',
    description: 'MM - Équipe A',
    color: '#4CAF50' // Vert
  },
  {
    name: 'MM Shift B',
    code: 'MMB',
    description: 'MM - Équipe B',
    color: '#8BC34A' // Vert clair
  },
  {
    name: 'SZB Shift A',
    code: 'SZBA',
    description: 'SZB - Équipe A',
    color: '#9C27B0' // Violet
  },
  {
    name: 'SZB Shift B',
    code: 'SZBB',
    description: 'SZB - Équipe B',
    color: '#673AB7' // Violet foncé
  }
];

async function setupDepartments() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/draxlmaier-app');
    console.log('✅ Connecté à MongoDB');

    // Trouver un admin pour être le manager par défaut
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('❌ Aucun utilisateur admin trouvé. Créez d\'abord un admin.');
      process.exit(1);
    }

    console.log(`📋 Admin trouvé: ${adminUser.firstname} ${adminUser.lastname}`);

    for (const deptData of DEPARTMENTS) {
      console.log(`\n🔄 Création du département: ${deptData.name}...`);

      // Vérifier si le département existe déjà
      let department = await Department.findOne({ code: deptData.code });

      if (department) {
        console.log(`⚠️  Le département ${deptData.name} existe déjà`);
        continue;
      }

      // Créer le chatroom pour ce département
      const chatRoom = await ChatGroup.create({
        name: `Chat ${deptData.name}`,
        description: `Chatroom du département ${deptData.name}`,
        type: 'department',
        members: [adminUser._id],
        admins: [adminUser._id],
        createdBy: adminUser._id,
        isActive: true
      });

      console.log(`  ✅ Chatroom créé: ${chatRoom.name}`);

      // Créer le département
      department = await Department.create({
        name: deptData.name,
        code: deptData.code,
        description: deptData.description,
        color: deptData.color,
        manager: adminUser._id,
        adminUser: adminUser._id,
        chatRoomId: chatRoom._id,
        isActive: true,
        createdBy: adminUser._id
      });

      console.log(`  ✅ Département créé: ${department.name} (${department.code})`);
    }

    console.log('\n🎉 Tous les départements ont été créés avec succès!');
    console.log('\n📊 Récapitulatif:');
    
    const allDepts = await Department.find().populate('chatRoomId', 'name');
    allDepts.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.code}) → ChatRoom: ${dept.chatRoomId?.name || 'N/A'}`);
    });

    console.log('\n✅ Configuration terminée!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
setupDepartments();
