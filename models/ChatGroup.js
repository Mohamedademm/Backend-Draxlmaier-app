const mongoose = require('mongoose');

/**
 * ChatGroup Schema
 * Represents a group chat with multiple members
 */
const chatGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['department', 'custom'],
    default: 'custom'
  },
  department: {
    type: String,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
chatGroupSchema.index({ members: 1 });
chatGroupSchema.index({ createdBy: 1 });
chatGroupSchema.index({ type: 1, department: 1 });

// Validation: Must have at least 2 members (except for department groups)
chatGroupSchema.pre('validate', function(next) {
  if (this.type === 'department') {
    // Department groups can have any number of members
    next();
  } else if (this.members && this.members.length < 2) {
    next(new Error('Group must have at least 2 members'));
  } else {
    next();
  }
});

// Virtual for member count
chatGroupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Method to add member
chatGroupSchema.methods.addMember = function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  return this.save();
};

// Method to remove member
chatGroupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(
    memberId => memberId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to check if user is admin
chatGroupSchema.methods.isAdmin = function(userId) {
  return this.admins.some(
    adminId => adminId.toString() === userId.toString()
  );
};

// Method to check if user is member
chatGroupSchema.methods.isMember = function(userId) {
  return this.members.some(
    memberId => memberId.toString() === userId.toString()
  );
};

// Static method to find or create department group
chatGroupSchema.statics.findOrCreateDepartmentGroup = async function(department) {
  let group = await this.findOne({
    type: 'department',
    department: department,
    isActive: true
  });

  if (!group) {
    // Get all users from this department
    const User = mongoose.model('User');
    const users = await User.find({ department: department, active: true });

    if (users.length === 0) {
      throw new Error('No users found in this department');
    }

    // Get managers of this department
    const managers = users.filter(user => user.role === 'manager');

    group = await this.create({
      name: `${department} - Équipe`,
      description: `Groupe de discussion pour le département ${department}`,
      type: 'department',
      department: department,
      members: users.map(user => user._id),
      admins: managers.map(manager => manager._id),
      createdBy: managers.length > 0 ? managers[0]._id : users[0]._id,
      isActive: true
    });
  }

  return group;
};

// Transform output
chatGroupSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ChatGroup', chatGroupSchema);
