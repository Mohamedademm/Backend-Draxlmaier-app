require('dotenv').config();
const mongoose = require('mongoose');

async function checkConnection() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Environment MONGODB_URI starts with:', uri ? uri.substring(0, 20) + '...' : 'UNDEFINED');

        await mongoose.connect(uri || 'mongodb://localhost:27017/draxlmaier-app');
        console.log('✅ Connected to:', mongoose.connection.name);
        console.log('✅ Host:', mongoose.connection.host);

        const ChatGroup = require('../models/ChatGroup');
        const count = await ChatGroup.countDocuments({ type: 'department' });
        console.log('📊 Department groups found:', count);

        const groups = await ChatGroup.find({ type: 'department' }).select('name department members');
        groups.forEach(g => {
            console.log(` - ${g.name} (${g.department}): ${g.members.length} members`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkConnection();
