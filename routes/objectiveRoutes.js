const express = require('express');
const router = express.Router();
const objectiveController = require('../controllers/objectiveController');
const statsController = require('../controllers/objectiveStatsController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Objective Routes
 */

// Employee routes
router.get('/my-objectives', authenticate, objectiveController.getMyObjectives);
router.get('/:id', authenticate, objectiveController.getObjectiveById);
router.put('/:id/status', authenticate, objectiveController.updateObjectiveStatus);
router.put('/:id/progress', authenticate, objectiveController.updateObjectiveProgress);
router.post('/:id/comments', authenticate, objectiveController.addComment);
router.post('/:id/files', authenticate, objectiveController.addFile);

// Manager/Admin routes
router.get('/stats/overview', authenticate, authorize('manager', 'admin'), statsController.getObjectiveStats);
router.get('/team/all', authenticate, authorize('manager', 'admin'), objectiveController.getTeamObjectives);
router.post('/create', authenticate, authorize('manager', 'admin'), objectiveController.createObjective);
router.put('/:id', authenticate, authorize('manager', 'admin'), objectiveController.updateObjective);
router.delete('/:id', authenticate, authorize('manager', 'admin'), objectiveController.deleteObjective);
router.post('/bulk-update', authenticate, authorize('manager', 'admin'), statsController.bulkUpdateObjectives);
router.post('/bulk-delete', authenticate, authorize('manager', 'admin'), statsController.bulkDeleteObjectives);

module.exports = router;
