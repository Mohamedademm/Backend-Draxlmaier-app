const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');
const { groupValidation } = require('../middleware/validation');

/**
 * Group Routes
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

module.exports = router;
