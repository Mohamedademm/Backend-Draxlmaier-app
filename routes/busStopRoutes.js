const express = require('express');
const router = express.Router();
const busStopController = require('../controllers/busStopController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Bus Stop Routes
 */

// Public routes
router.get('/', busStopController.getAllBusStops);
router.get('/nearby', busStopController.getNearbyBusStops);
router.get('/:id', busStopController.getBusStopById);

// Protected routes (Manager/Admin)
router.get('/:id/employees', authenticate, authorize(['manager', 'admin']), busStopController.getBusStopEmployees);

// Admin only routes
router.post('/', authenticate, authorize(['admin']), busStopController.createBusStop);
router.put('/:id', authenticate, authorize(['admin']), busStopController.updateBusStop);
router.delete('/:id', authenticate, authorize(['admin']), busStopController.deleteBusStop);

module.exports = router;
