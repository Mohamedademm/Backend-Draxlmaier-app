const mongoose = require('mongoose');

/**
 * Objective Schema
 * Represents a work objective/task assigned to an employee
 */
const objectiveSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Objective title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned user is required']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigner is required']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatGroup' // Refers to ChatGroup as Department source of truth
  },

  // Status & Priority
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'completed', 'blocked'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Dates
  startDate: Date,
  dueDate: Date,
  completedAt: Date,

  // Progress
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Workspace
  files: [{
    filename: String,
    url: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  links: [{
    title: String,
    url: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: String,

  // Comments
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Block reason
  blockReason: String
}, {
  timestamps: true
});

// Indexes
objectiveSchema.index({ assignedTo: 1, status: 1 });
objectiveSchema.index({ assignedBy: 1 });
objectiveSchema.index({ team: 1 });
objectiveSchema.index({ department: 1 });
objectiveSchema.index({ dueDate: 1 });
objectiveSchema.index({ priority: 1 });

// Auto-set completedAt when status changes to completed
objectiveSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  next();
});

// Transform output
objectiveSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Objective', objectiveSchema);
