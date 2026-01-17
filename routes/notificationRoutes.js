const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');
const { notificationValidation } = require('../middleware/validation');

/**
 * Notification Routes
 */

// Get all notifications
router.get('/', authenticate, notificationController.getNotifications);

// Get admin notifications (filtered)
router.get('/admin', authenticate, notificationController.getAdminNotifications);

// Get unread count
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// Send notification (Admin/Manager only)
router.post(
  '/send',
  authenticate,
  authorize('admin', 'manager'),
  notificationValidation.send,
  notificationController.sendNotification
);

// Mark notification as read
router.post(
  '/:id/read',
  authenticate,
  notificationValidation.markRead,
  notificationController.markAsRead
);

module.exports = router;
