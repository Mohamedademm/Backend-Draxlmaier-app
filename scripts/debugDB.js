require('dotenv').config();
const mongoose = require('mongoose');

async function debugDB() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/draxlmaier-app';
        await mongoose.connect(uri);

        console.log('✅ Connected to DB:', mongoose.connection.name);
        console.log('✅ Host:', mongoose.connection.host);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📚 Collections found:');
        for (const coll of collections) {
            const count = await mongoose.connection.db.collection(coll.name).countDocuments();
            console.log(` - ${coll.name}: ${count} documents`);
        }

        if (mongoose.connection.db.collection('chatgroups')) {
            const groups = await mongoose.connection.db.collection('chatgroups').find({}).toArray();
            console.log('\n💬 All Chat Groups:');
            groups.forEach(g => {
                console.log(` - [${g.type || 'no-type'}] ${g.name} (Dept: ${g.department || 'N/A'}) - ID: ${g._id}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

debugDB();
