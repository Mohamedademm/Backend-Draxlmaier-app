const ChatGroup = require('../models/ChatGroup');
const User = require('../models/User');

/**
 * Initialize Department Groups
 * Creates a chat group for each of the 6 allowed departments
 */
async function initializeDepartmentGroups() {
    const allowedDepartments = [
        'Qualité',
        'Logistique',
        'MM shift A',
        'MM shift B',
        'SZB shift A',
        'SZB shift B'
    ];

    console.log('🚀 Starting department groups initialization...\n');

    try {
        // Get admin user to set as creator
        const adminUser = await User.findOne({ role: 'admin' });

        if (!adminUser) {
            console.error('❌ No admin user found. Please create an admin user first.');
            return;
        }

        console.log(`✅ Found admin user: ${adminUser.firstname} ${adminUser.lastname}\n`);

        for (const department of allowedDepartments) {
            console.log(`📋 Processing department: ${department}`);

            // Check if group already exists
            const existingGroup = await ChatGroup.findOne({
                type: 'department',
                department: department
            });

            if (existingGroup) {
                console.log(`   ⚠️  Group already exists for ${department}`);
                console.log(`   👥 Members: ${existingGroup.members.length}`);
                continue;
            }

            // Get all users from this department
            const departmentUsers = await User.find({
                department: department,
                active: true
            }).select('_id firstname lastname');

            if (departmentUsers.length === 0) {
                console.log(`   ⚠️  No users found for ${department}, creating group with admin only`);
            } else {
                console.log(`   👥 Found ${departmentUsers.length} users`);
            }

            const memberIds = departmentUsers.map(u => u._id);

            // Always include admin in members if not already there
            if (!memberIds.some(id => id.toString() === adminUser._id.toString())) {
                memberIds.push(adminUser._id);
            }

            // Create the group
            const group = await ChatGroup.create({
                name: `Groupe ${department}`,
                description: `Chat de groupe pour le département ${department}`,
                department: department,
                type: 'department',
                members: memberIds,
                admins: [adminUser._id],
                createdBy: adminUser._id,
                isActive: true
            });

            console.log(`   ✅ Created group: ${group.name}`);
            console.log(`   📊 Group ID: ${group._id}`);
            console.log(`   👥 Members added: ${memberIds.length}\n`);
        }

        console.log('✨ Department groups initialization completed!\n');

        // Display summary
        const allGroups = await ChatGroup.find({ type: 'department' });
        console.log('📊 Summary:');
        console.log(`   Total department groups: ${allGroups.length}`);
        for (const group of allGroups) {
            console.log(`   - ${group.name}: ${group.members.length} members`);
        }

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        throw error;
    }
}

/**
 * Auto-add users to their department group when they register
 */
async function addUserToDepartmentGroup(userId, department) {
    try {
        if (!department) {
            console.log('⚠️  User has no department assigned');
            return;
        }

        // Find the department group
        const group = await ChatGroup.findOne({
            type: 'department',
            department: department
        });

        if (!group) {
            console.log(`⚠️  No group found for department: ${department}`);
            return;
        }

        // Check if user is already a member
        if (group.members.some(id => id.toString() === userId.toString())) {
            console.log(`ℹ️  User already in group ${group.name}`);
            return;
        }

        // Add user to group
        group.members.push(userId);
        await group.save();

        console.log(`✅ Added user to ${group.name}`);
    } catch (error) {
        console.error('❌ Error adding user to department group:', error);
    }
}

module.exports = {
    initializeDepartmentGroups,
    addUserToDepartmentGroup
};
