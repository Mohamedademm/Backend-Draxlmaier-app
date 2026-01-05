const mongoose = require('mongoose');

/**
 * Group Schema
 * Represents chat groups (department-based or custom)
 */
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['department', 'custom'],
      default: 'custom',
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for department-based groups
groupSchema.index({ type: 1, department: 1 });

// Index for faster member lookups
groupSchema.index({ members: 1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Method to add member
groupSchema.methods.addMember = function (userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  return this.save();
};

// Method to remove member
groupSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(
    (memberId) => memberId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function (userId) {
  return this.admins.some(
    (adminId) => adminId.toString() === userId.toString()
  );
};

// Method to check if user is member
groupSchema.methods.isMember = function (userId) {
  return this.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
};

// Static method to find or create department group
groupSchema.statics.findOrCreateDepartmentGroup = async function (department) {
  let group = await this.findOne({
    type: 'department',
    department: department,
  });

  if (!group) {
    // Get all users from this department
    const User = mongoose.model('User');
    const users = await User.find({ department: department, active: true });

    // Get managers of this department
    const managers = users.filter((user) => user.role === 'manager');

    group = await this.create({
      name: `${department} - Équipe`,
      description: `Groupe de discussion pour le département ${department}`,
      type: 'department',
      department: department,
      members: users.map((user) => user._id),
      admins: managers.map((manager) => manager._id),
      createdBy: managers.length > 0 ? managers[0]._id : users[0]._id,
    });
  }

  return group;
};

module.exports = mongoose.model('Group', groupSchema);
