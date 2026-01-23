const mongoose = require('mongoose');

/**
 * Team Schema
 * Represents a team within the organization
 */
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatGroup' // Refers to ChatGroup as Department source of truth
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team leader is required']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  avatar: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#2196F3' // Material Blue
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create unique index for name
teamSchema.index({ name: 1 }, { unique: true });

// Virtual for member count
teamSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

// Index for faster queries (name already has unique: true)
teamSchema.index({ department: 1 });
teamSchema.index({ isActive: 1 });

// Methods
teamSchema.methods.addMember = function (userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  return this.save();
};

teamSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(id => id.toString() !== userId.toString());
  return this.save();
};

teamSchema.methods.isMember = function (userId) {
  return this.members.some(id => id.toString() === userId.toString());
};

teamSchema.methods.isLeader = function (userId) {
  return this.leader && this.leader.toString() === userId.toString();
};

module.exports = mongoose.model('Team', teamSchema);
