const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');
const { groupValidation } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Chat group management
 */

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups for current user
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 */

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - members
 *             properties:
 *               name:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Group created successfully
 */

// Get all groups
router.get('/', authenticate, groupController.getAllGroups);

// Get or create department group for current user
router.get('/department/my-group', authenticate, groupController.getDepartmentGroup);

// Get group by ID
router.get('/:id', authenticate, groupValidation.getById, groupController.getGroupById);

// Create group
router.post('/', authenticate, groupValidation.create, groupController.createGroup);

// Add members to group
router.post('/:id/members', authenticate, groupValidation.getById, groupController.addMembers);

// Remove member from group
router.delete('/:id/members/:memberId', authenticate, groupController.removeMember);

// Get all department groups (filtered by user role)
router.get('/department/all', authenticate, groupController.getAllDepartmentGroups);

// Create a department group (admin only)
router.post('/department/create', authenticate, groupController.createDepartmentGroup);

// Delete group (Admin only for departments)
router.delete('/:id', authenticate, groupController.deleteGroup);

// Clear group messages (Admin only)
router.delete('/:id/messages', authenticate, groupController.clearMessages);

module.exports = router;
