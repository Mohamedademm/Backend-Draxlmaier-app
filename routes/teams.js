const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all routes - authentication required
router.use(authenticate);

/**
 * @route   GET /api/teams
 * @route   POST /api/teams
 */
router
  .route('/')
  .get(teamController.getTeams)
  .post(authorize('admin', 'manager'), teamController.createTeam);

/**
 * @route   GET /api/teams/:id
 * @route   PUT /api/teams/:id
 * @route   DELETE /api/teams/:id
 */
router
  .route('/:id')
  .get(teamController.getTeam)
  .put(authorize('admin', 'manager'), teamController.updateTeam)
  .delete(authorize('admin'), teamController.deleteTeam);

/**
 * @route   GET /api/teams/:id/members
 * @route   POST /api/teams/:id/members
 */
router
  .route('/:id/members')
  .get(teamController.getTeamMembers)
  .post(authorize('admin', 'manager'), teamController.addMember);

/**
 * @route   DELETE /api/teams/:id/members/:userId
 */
router
  .route('/:id/members/:userId')
  .delete(authorize('admin', 'manager'), teamController.removeMember);

module.exports = router;
