const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['general', 'address_change', 'department_update', 'system'],
    default: 'general'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

notificationSchema.index({ targetUsers: 1, timestamp: -1 });
notificationSchema.index({ senderId: 1, timestamp: -1 });
notificationSchema.index({ timestamp: -1 });

notificationSchema.pre('validate', function(next) {
  if (!this.targetUsers || this.targetUsers.length === 0) {
    next(new Error('Notification must have at least one target user'));
  } else {
    next();
  }
});

notificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(id => id.toString() === userId.toString());
};

notificationSchema.methods.markAsReadBy = async function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push(userId);
    await this.save();
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
