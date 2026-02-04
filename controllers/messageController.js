const Message = require('../models/Message');
const User = require('../models/User');

exports.getChatHistory = async (req, res, next) => {
  try {
    const { recipientId, groupId, limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;

    let query = {};

    if (recipientId) {
      query = {
        $or: [
          { senderId: userId, receiverId: recipientId },
          { senderId: recipientId, receiverId: userId }
        ]
      };
    } else if (groupId) {
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
      messages: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ],
          groupId: null
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

    await User.populate(conversations, {
      path: '_id',
      select: 'firstname lastname email'
    });

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

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, groupId, content, type } = req.body;
    const senderId = req.user._id;

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

    const message = await Message.create({
      senderId,
      receiverId: groupId ? null : receiverId,
      groupId: groupId || null,
      content: content.trim(),
      type: type || (groupId ? 'group' : 'direct'),
      status: 'sent'
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'firstname lastname email');

    try {
      const notificationService = require('../services/notificationService');
      const User = require('../models/User');

      let targetTokens = [];
      let notificationTitle = `New message from ${populatedMessage.senderId.firstname} ${populatedMessage.senderId.lastname}`;

      if (groupId) {
        const ChatGroup = require('../models/ChatGroup');
        const group = await ChatGroup.findById(groupId);
        if (group) {
          notificationTitle = `New message in ${group.name}`;
          const members = await User.find({
            _id: { $in: group.members, $ne: senderId },
            fcmToken: { $exists: true, $ne: null }
          });
          targetTokens = members.map(m => m.fcmToken);
        }
      } else if (receiverId) {
        const receiver = await User.findById(receiverId);
        if (receiver && receiver.fcmToken) {
          targetTokens.push(receiver.fcmToken);
        }
      }

      if (targetTokens.length > 0) {
        await notificationService.sendMulticast(
          targetTokens,
          notificationTitle,
          content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          {
            type: 'chat',
            chatId: groupId || senderId.toString(),
            isGroup: groupId ? 'true' : 'false'
          }
        );
      }
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    res.status(201).json({
      success: true,
      status: 'success',
      message: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};
