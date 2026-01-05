const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification Controller
 * Handles notification operations
 */

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find notifications where:
    // 1. user is in targetUsers array
    // 2. OR user is the sender (so they can see what they sent)
    const notifications = await Notification.find({
      $or: [
        { targetUsers: userId },
        { senderId: userId }
      ]
    })
      .populate('senderId', 'firstname lastname email')
      .sort({ timestamp: -1 });

    console.log(`Found ${notifications.length} notifications for user ${userId}`);

    res.status(200).json({
      status: 'success',
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    next(error);
  }
};

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification
 * @access  Private (Admin/Manager)
 */
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, targetUsers, targetDepartment, sendToAll } = req.body;
    const senderId = req.user._id;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and message are required'
      });
    }

    let recipients = [];

    if (sendToAll) {
      // Send to all active users except sender
      const users = await User.find({ active: true, _id: { $ne: senderId } });
      recipients = users.map(user => user._id);
    } else if (targetDepartment) {
      // Send to all users in a specific department
      const users = await User.find({ department: targetDepartment, active: true, _id: { $ne: senderId } });
      recipients = users.map(user => user._id);
    } else if (targetUsers && targetUsers.length > 0) {
      // Send to specific users
      recipients = targetUsers;
    } else {
      // Default: send to all if nothing specified (compatible with old logic)
      const users = await User.find({ active: true, _id: { $ne: senderId } });
      recipients = users.map(user => user._id);
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No recipients found for this notification'
      });
    }

    const notification = await Notification.create({
      title,
      message,
      senderId,
      targetUsers: recipients
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('senderId', 'firstname lastname email');

    res.status(201).json({
      status: 'success',
      message: 'Notification sent successfully',
      notification: populatedNotification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    // Check if user is a target
    if (!notification.targetUsers.includes(userId)) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to access this notification'
      });
    }

    // Mark as read
    await notification.markAsReadBy(userId);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      targetUsers: userId,
      readBy: { $ne: userId }
    });

    res.status(200).json({
      status: 'success',
      count
    });
  } catch (error) {
    next(error);
  }
};
