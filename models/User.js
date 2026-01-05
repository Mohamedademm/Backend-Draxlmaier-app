const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Represents an employee in the system with authentication and role management
 */
const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastname: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'rejected'],
    default: 'pending'
  },
  active: {
    type: Boolean,
    default: true
  },
  
  // Professional information
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  matricule: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
    index: true
  },
  position: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  
  // Contact
  phone: {
    type: String,
    trim: true
  },
  
  // Profile Image (stored as base64 or URL)
  profileImage: {
    type: String,
    trim: true
  },
  
  // Address fields
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  
  // Legacy location field (kept for backward compatibility)
  location: {
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    busStop: {
      name: String,
      stopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusStop'
      }
    }
  },
  
  // Validation info
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: Date,
  rejectionReason: String,
  
  // Security
  fcmToken: {
    type: String,
    default: null
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Index for faster queries (email already has unique: true)
userSchema.index({ role: 1 });
userSchema.index({ active: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Create unique index for email
userSchema.index({ email: 1 }, { unique: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstname} ${this.lastname}`;
});

// Transform output to remove sensitive data
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
