const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');
const { strictRateLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstname
 *         - lastname
 *         - email
 *         - password
 *       properties:
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         role:
 *           type: string
 *           enum: [admin, manager, employee]
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or email already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
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
