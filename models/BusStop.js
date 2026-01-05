const mongoose = require('mongoose');

/**
 * BusStop Schema
 * Represents a bus stop for employee transportation
 */
const busStopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bus stop name is required'],
    trim: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180
    }
  },
  address: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    default: 50,
    min: 1
  },
  schedule: [{
    time: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    direction: {
      type: String,
      enum: ['toWork', 'fromWork']
    }
  }],
  active: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

// Create unique index for name
busStopSchema.index({ name: 1 }, { unique: true });

// Index for geospatial queries
busStopSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
busStopSchema.index({ active: 1 });

// Virtual to get employees count
busStopSchema.virtual('employeeCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'location.busStop.stopId',
  count: true
});

// Transform output
busStopSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('BusStop', busStopSchema);
