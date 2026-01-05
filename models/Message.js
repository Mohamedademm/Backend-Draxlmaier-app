const mongoose = require('mongoose');

/**
 * Message Schema
 * Represents a chat message between users or in a group
 */
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatGroup',
    default: null
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
messageSchema.index({ groupId: 1, timestamp: -1 });
messageSchema.index({ timestamp: -1 });

// Validation: Must have either receiverId or groupId
messageSchema.pre('validate', function(next) {
  if (!this.receiverId && !this.groupId) {
    next(new Error('Message must have either receiverId or groupId'));
  } else if (this.receiverId && this.groupId) {
    next(new Error('Message cannot have both receiverId and groupId'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Message', messageSchema);
