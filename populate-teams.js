const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('./models/Department');
const Team = require('./models/Team');
const User = require('./models/User');

/**
 * Script to populate database with test departments and teams
 * Run: node backend/populate-teams.js
 */

const populateTeamsAndDepartments = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find existing users
    const admin = await User.findOne({ email: 'admin@company.com' });
    const jean = await User.findOne({ email: 'jean.dupont@company.com' });
    const sarah = await User.findOne({ email: 'sarah.martin@company.com' });
    const marie = await User.findOne({ email: 'marie.dubois@company.com' });
    const adem = await User.findOne({ email: 'adem@gamil.com' });

    if (!admin || !jean || !sarah || !marie || !adem) {
      console.error('❌ Missing required users. Please run create-employees.js first.');
      process.exit(1);
    }

    console.log('\n📊 Found users:');
    console.log(`- Admin: ${admin.firstname} ${admin.lastname}`);
    console.log(`- Manager: ${jean.firstname} ${jean.lastname}`);
    console.log(`- Employees: ${sarah.firstname}, ${marie.firstname}, ${adem.firstname}`);

    // Clear existing departments and teams
    console.log('\n🗑️  Clearing existing data...');
    await Department.deleteMany({});
    await Team.deleteMany({});
    console.log('✅ Cleared existing departments and teams');

    // Create Departments
    console.log('\n🏢 Creating departments...');
    
    const itDepartment = await Department.create({
      name: 'IT & Technology',
      description: 'Information Technology and Software Development',
      manager: jean._id,
      location: 'Building A, Floor 3',
      budget: 500000,
      employeeCount: 3,
      color: '#2196F3',
      createdBy: admin._id
    });
    console.log(`✅ Created: ${itDepartment.name}`);

    const hrDepartment = await Department.create({
      name: 'Human Resources',
      description: 'HR Management and Employee Relations',
      manager: sarah._id,
      location: 'Building B, Floor 1',
      budget: 200000,
      employeeCount: 2,
      color: '#4CAF50',
      createdBy: admin._id
    });
    console.log(`✅ Created: ${hrDepartment.name}`);

    const salesDepartment = await Department.create({
      name: 'Sales & Marketing',
      description: 'Sales Operations and Marketing Strategy',
      manager: marie._id,
      location: 'Building A, Floor 2',
      budget: 350000,
      employeeCount: 1,
      color: '#FF9800',
      createdBy: admin._id
    });
    console.log(`✅ Created: ${salesDepartment.name}`);

    // Create Teams
    console.log('\n👥 Creating teams...');

    const devTeam = await Team.create({
      name: 'Development Team',
      description: 'Core software development and engineering',
      department: itDepartment._id,
      leader: jean._id,
      members: [jean._id, adem._id],
      color: '#2196F3',
      createdBy: admin._id
    });
    console.log(`✅ Created: ${devTeam.name} (${devTeam.members.length} members)`);

    const hrTeam = await Team.create({
      name: 'HR Operations',
      description: 'Employee onboarding, training, and benefits',
      department: hrDepartment._id,
      leader: sarah._id,
      members: [sarah._id],
      color: '#4CAF50',
      createdBy: admin._id
    });
    console.log(`✅ Created: ${hrTeam.name} (${hrTeam.members.length} members)`);

    const salesTeam = await Team.create({
      name: 'Sales Team',
      description: 'Customer acquisition and account management',
      department: salesDepartment._id,
      leader: marie._id,
      members: [marie._id],
      color: '#FF9800',
      createdBy: admin._id
    });
    console.log(`✅ Created: ${salesTeam.name} (${salesTeam.members.length} members)`);

    const supportTeam = await Team.create({
      name: 'Technical Support',
      description: 'Customer technical support and troubleshooting',
      department: itDepartment._id,
      leader: adem._id,
      members: [adem._id],
      color: '#9C27B0',
      createdBy: admin._id
    });
    console.log(`✅ Created: ${supportTeam.name} (${supportTeam.members.length} members)`);

    // Summary
    console.log('\n📈 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Departments created: 3`);
    console.log(`   - ${itDepartment.name} (Manager: ${jean.firstname} ${jean.lastname})`);
    console.log(`   - ${hrDepartment.name} (Manager: ${sarah.firstname} ${sarah.lastname})`);
    console.log(`   - ${salesDepartment.name} (Manager: ${marie.firstname} ${marie.lastname})`);
    console.log('\n✅ Teams created: 4');
    console.log(`   - ${devTeam.name} (Leader: ${jean.firstname}, Members: ${devTeam.members.length})`);
    console.log(`   - ${hrTeam.name} (Leader: ${sarah.firstname}, Members: ${hrTeam.members.length})`);
    console.log(`   - ${salesTeam.name} (Leader: ${marie.firstname}, Members: ${salesTeam.members.length})`);
    console.log(`   - ${supportTeam.name} (Leader: ${adem.firstname}, Members: ${supportTeam.members.length})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🎉 Population completed successfully!');
    console.log('\n📝 Test the API endpoints:');
    console.log('   GET    http://localhost:3000/api/departments');
    console.log('   GET    http://localhost:3000/api/teams');
    console.log('   GET    http://localhost:3000/api/teams/:id/members');
    console.log('   POST   http://localhost:3000/api/teams/:id/members');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

// Run the script
populateTeamsAndDepartments();
