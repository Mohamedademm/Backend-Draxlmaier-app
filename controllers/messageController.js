const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Message Controller
 * Handles chat message operations
 */

/**
 * @route   GET /api/messages/history
 * @desc    Get chat history
 * @access  Private
 */
exports.getChatHistory = async (req, res, next) => {
  try {
    const { recipientId, groupId, limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;

    let query = {};

    if (recipientId) {
      // Get direct messages between two users
      query = {
        $or: [
          { senderId: userId, receiverId: recipientId },
          { senderId: recipientId, receiverId: userId }
        ]
      };
    } else if (groupId) {
      // Get group messages
      query = { groupId };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Either recipientId or groupId is required'
      });
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('senderId', 'firstname lastname email');

    res.status(200).json({
      status: 'success',
      count: messages.length,
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ],
          groupId: null // Only direct messages
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$timestamp' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate recipient details
    await User.populate(conversations, {
      path: '_id',
      select: 'firstname lastname email'
    });

    // Format response
    const formattedConversations = conversations.map(conv => ({
      recipientId: conv._id._id,
      recipientName: `${conv._id.firstname} ${conv._id.lastname}`,
      recipientEmail: conv._id.email,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      unreadCount: conv.unreadCount
    }));

    res.status(200).json({
      status: 'success',
      count: formattedConversations.length,
      conversations: formattedConversations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/messages/mark-read
 * @desc    Mark messages as read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { chatId, isGroup } = req.body;
    const userId = req.user._id;

    let query = {};

    if (isGroup) {
      query = {
        groupId: chatId,
        receiverId: userId
      };
    } else {
      query = {
        senderId: chatId,
        receiverId: userId
      };
    }

    await Message.updateMany(query, { status: 'read' });

    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/messages
 * @desc    Send a message (direct or group)
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, groupId, content, type } = req.body;
    const senderId = req.user._id;

    // Validate input
    if (!content || content.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Message content is required'
      });
    }

    if (!groupId && !receiverId) {
      return res.status(400).json({
        status: 'error',
        message: 'Either receiverId or groupId is required'
      });
    }

    // Create message
    const message = await Message.create({
      senderId,
      receiverId: groupId ? null : receiverId,
      groupId: groupId || null,
      content: content.trim(),
      type: type || (groupId ? 'group' : 'direct'),
      status: 'sent'
    });

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'firstname lastname email');

    res.status(201).json({
      success: true,
      status: 'success',
      message: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};
