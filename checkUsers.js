const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Aziz+123@clusteraziz.uifwd.mongodb.net/draxlmaier-app?retryWrites=true&w=majority&appName=clusteraziz';
const LOCAL_URI = 'mongodb://localhost:27017/draxlmaier-app';

async function checkUsers() {
  try {
    let connected = false;
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB Atlas');
      connected = true;
    } catch (err) {
      console.log('⚠️ Atlas connection failed, trying local...');
      await mongoose.connect(LOCAL_URI);
      console.log('✅ Connected to Local MongoDB');
      connected = true;
    }

    const users = await User.find({});
    console.log(`\n📊 Total users: ${users.length}\n`);

    const employees = users.filter(u => u.role === 'employee');
    const managers = users.filter(u => u.role === 'manager');
    const admins = users.filter(u => u.role === 'admin');

    console.log(`👥 Employees: ${employees.length}`);
    employees.forEach(emp => {
      console.log(`  - ${emp.firstname} ${emp.lastname} (${emp.email}) - Department: ${emp.department || 'N/A'}`);
    });

    console.log(`\n👔 Managers: ${managers.length}`);
    managers.forEach(mgr => {
      console.log(`  - ${mgr.firstname} ${mgr.lastname} (${mgr.email}) - Department: ${mgr.department || 'N/A'}`);
    });

    console.log(`\n⚙️ Admins: ${admins.length}`);
    admins.forEach(adm => {
      console.log(`  - ${adm.firstname} ${adm.lastname} (${adm.email})`);
    });

    // Create a test employee if none exists
    if (employees.length === 0) {
      console.log('\n⚠️ No employees found. Creating test employee...');
      
      const testEmployee = await User.create({
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean.dupont@draxlmaier.com',
        password: 'Employee123',
        role: 'employee',
        employeeId: 'EMP001',
        department: 'Production',
        position: 'Technicien',
        active: true,
        status: 'active'
      });

      console.log(`✅ Test employee created: ${testEmployee.firstname} ${testEmployee.lastname}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();
