const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, authorize } = require('../middleware/auth');
const { locationValidation } = require('../middleware/validation');

/**
 * Location Routes
 */

// Update location
router.post('/update', authenticate, locationValidation.update, locationController.updateLocation);

// Get team locations (Admin/Manager only)
router.get('/team', authenticate, authorize('admin', 'manager'), locationController.getTeamLocations);

// Get my location history
router.get('/my-history', authenticate, locationController.getMyLocationHistory);

module.exports = router;
