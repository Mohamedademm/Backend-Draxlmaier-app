require('dotenv').config();
const mongoose = require('mongoose');
const { initializeDepartmentGroups } = require('../utils/initDepartmentGroups');

/**
 * Script to initialize department groups
 * Run with: node scripts/initGroups.js
 */

async function main() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/draxlmaier-app');
        console.log('✅ Connected to MongoDB\n');

        // Initialize department groups
        await initializeDepartmentGroups();

        // Disconnect
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
        console.log('✨ Script completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

main();
