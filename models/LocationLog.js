const mongoose = require('mongoose');

/**
 * LocationLog Schema
 * Tracks employee location history for monitoring and safety
 */
const locationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
locationLogSchema.index({ userId: 1, timestamp: -1 });
locationLogSchema.index({ timestamp: -1 });
locationLogSchema.index({ userId: 1, timestamp: 1 }); // For getting latest location

// Static method to get latest location for a user
locationLogSchema.statics.getLatestLocation = async function(userId) {
  return await this.findOne({ userId })
    .sort({ timestamp: -1 })
    .populate('userId', 'firstname lastname email');
};

// Static method to get latest locations for multiple users
locationLogSchema.statics.getLatestLocations = async function(userIds) {
  const locations = await this.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$userId',
        latestLocation: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$latestLocation' }
    }
  ]);
  
  return await this.populate(locations, { path: 'userId', select: 'firstname lastname email' });
};

module.exports = mongoose.model('LocationLog', locationLogSchema);
