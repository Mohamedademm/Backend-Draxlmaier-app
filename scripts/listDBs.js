require('dotenv').config();
const mongoose = require('mongoose');

async function listDatabases() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/draxlmaier-app';
        await mongoose.connect(uri);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        console.log('\n🗄️ Databases available in this cluster:');
        for (const db of dbs.databases) {
            console.log(` - ${db.name} (${db.sizeOnDisk} bytes)`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

listDatabases();
