const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */

// Get all users (Admin/Manager only)
router.get('/', authenticate, authorize('admin', 'manager'), userController.getAllUsers);

// Get pending registrations (Manager/Admin only)
router.get('/pending', authenticate, authorize('admin', 'manager'), userController.getPendingUsers);

// Search users
router.get('/search', authenticate, userController.searchUsers);

// Get user by ID
router.get('/:id', authenticate, userValidation.getById, userController.getUserById);

// Create user (Admin/Manager)
router.post('/', authenticate, authorize('admin', 'manager'), userValidation.create, userController.createUser);

// Update user (Admin/Manager)
router.put('/:id', authenticate, authorize('admin', 'manager'), userValidation.update, userController.updateUser);

// Delete user (Admin/Manager)
router.delete('/:id', authenticate, authorize('admin', 'manager'), userValidation.getById, userController.deleteUser);

// Activate user (Admin/Manager)
router.post('/:id/activate', authenticate, authorize('admin', 'manager'), userValidation.getById, userController.activateUser);

// Deactivate user (Admin/Manager)
router.post('/:id/deactivate', authenticate, authorize('admin', 'manager'), userValidation.getById, userController.deactivateUser);

// Validate pending user (Manager/Admin)
router.post('/:id/validate', authenticate, authorize('admin', 'manager'), userController.validateUser);

// Reject pending user (Manager/Admin)
router.put('/:id/reject', authenticate, authorize('admin', 'manager'), userController.rejectUser);

// Update user position (Manager/Admin)
router.put('/:id/position', authenticate, authorize('admin', 'manager'), userController.updateUserPosition);

// Update my location (Employee)
router.put('/me/location', authenticate, userController.updateMyLocation);

// Update user profile (own profile or admin/manager)
router.put('/:id/profile', authenticate, userController.updateProfile);

module.exports = router;
