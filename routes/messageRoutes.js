const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

/**
 * Message Routes
 */

// Get chat history
router.get('/history', authenticate, messageController.getChatHistory);

// Get all conversations
router.get('/conversations', authenticate, messageController.getConversations);

// Mark messages as read
router.post('/mark-read', authenticate, messageController.markAsRead);

// Send message (HTTP alternative to socket)
router.post('/', authenticate, messageController.sendMessage);

module.exports = router;
