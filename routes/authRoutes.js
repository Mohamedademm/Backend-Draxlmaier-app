const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');
const { strictRateLimiter } = require('../middleware/rateLimiter');

/**
 * Authentication Routes
 */

// Register (public self-registration)
router.post('/register', strictRateLimiter, authValidation.register, authController.register);

// Create Manager (temporary route for testing)
router.post('/create-manager', authController.createManager);

// Create Employee (temporary route for testing)
router.post('/create-employee', authController.createEmployee);

// Login
router.post('/login', strictRateLimiter, authValidation.login, authController.login);

// Google Authentication
router.post('/google', strictRateLimiter, authController.googleAuth);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Update FCM token
router.post('/fcm-token', authenticate, authController.updateFcmToken);

module.exports = router;
