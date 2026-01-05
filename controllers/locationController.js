const LocationLog = require('../models/LocationLog');
const User = require('../models/User');

/**
 * Location Controller
 * Handles location tracking operations
 */

/**
 * @route   POST /api/location/update
 * @desc    Update user location
 * @access  Private
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;

    const location = await LocationLog.create({
      userId,
      latitude,
      longitude
    });

    res.status(201).json({
      status: 'success',
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/location/team
 * @desc    Get team member locations (Admin/Manager only)
 * @access  Private (Admin/Manager)
 */
exports.getTeamLocations = async (req, res, next) => {
  try {
    // Get all active users
    const users = await User.find({ active: true });
    const userIds = users.map(user => user._id);

    // Get latest locations for all users
    const locations = await LocationLog.getLatestLocations(userIds);

    res.status(200).json({
      status: 'success',
      count: locations.length,
      locations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/location/my-history
 * @desc    Get user's own location history
 * @access  Private
 */
exports.getMyLocationHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit = 100 } = req.query;

    const locations = await LocationLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      count: locations.length,
      locations
    });
  } catch (error) {
    next(error);
  }
};
