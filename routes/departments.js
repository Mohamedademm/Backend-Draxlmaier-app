const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all routes - authentication required
router.use(authenticate);

/**
 * @route   GET /api/departments
 * @route   POST /api/departments
 */
router
  .route('/')
  .get(departmentController.getDepartments)
  .post(authorize('admin'), departmentController.createDepartment);

/**
 * @route   GET /api/departments/:id
 * @route   PUT /api/departments/:id
 * @route   DELETE /api/departments/:id
 */
router
  .route('/:id')
  .get(departmentController.getDepartment)
  .put(authorize('admin', 'manager'), departmentController.updateDepartment)
  .delete(authorize('admin'), departmentController.deleteDepartment);

/**
 * @route   GET /api/departments/:id/teams
 */
router
  .route('/:id/teams')
  .get(departmentController.getDepartmentTeams);

/**
 * @route   GET /api/departments/:id/stats
 */
router
  .route('/:id/stats')
  .get(departmentController.getDepartmentStats);

module.exports = router;
