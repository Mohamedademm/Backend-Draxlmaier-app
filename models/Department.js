const mongoose = require('mongoose');

/**
 * Department Schema
 * Represents a department within the organization
 */
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Department manager is required']
  },
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatGroup'
  },
  location: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#4CAF50' // Material Green
  },
  budget: {
    type: Number,
    default: 0
  },
  employeeCount: {
    type: Number,
    default: 0
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
departmentSchema.index({ name: 1 }, { unique: true });

// Virtual to populate teams in this department
departmentSchema.virtual('teams', {
  ref: 'Team',
  localField: '_id',
  foreignField: 'department'
});

// Index for faster queries (name already has unique: true)
departmentSchema.index({ isActive: 1 });

// Methods
departmentSchema.methods.isManager = function(userId) {
  return this.manager && this.manager.toString() === userId.toString();
};

// Static methods
departmentSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('Department', departmentSchema);
