const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Socket.io Event Handler
 * Handles real-time socket events
 */

const userSockets = new Map(); // Store user socket connections: userId -> socketId

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    /**
     * User authentication
     * Store user-socket mapping
     */
    socket.on('authenticate', (userId) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        socket.join(userId); // Join user's personal room
        console.log(`User ${userId} authenticated with socket ${socket.id}`);

        // Broadcast online status
        socket.broadcast.emit('userOnline', { userId });
      }
    });

    /**
     * Join a chat room
     * @param {string} roomId - Chat room ID (recipientId for DM, groupId for group)
     */
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    /**
     * Leave a chat room
     * @param {string} roomId - Chat room ID
     */
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    /**
     * Send message
     * @param {object} messageData - Message data
     */
    socket.on('sendMessage', async (messageData) => {
      try {
        const { senderId, receiverId, groupId, content } = messageData;

        // Validate sender
        if (!socket.userId || socket.userId !== senderId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Create message in database
        const message = await Message.create({
          senderId,
          receiverId: groupId ? null : receiverId,
          groupId: groupId || null,
          content,
          status: 'sent'
        });

        // Populate sender info
        await message.populate('senderId', 'firstname lastname email');

        const messageResponse = {
          id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          groupId: message.groupId,
          content: message.content,
          status: message.status,
          timestamp: message.timestamp
        };

        if (groupId) {
          // Emit to group room
          io.to(groupId).emit('receiveMessage', messageResponse);
        } else {
          // Emit to recipient's personal room
          io.to(receiverId).emit('receiveMessage', messageResponse);
          // Confirm to sender
          socket.emit('messageSent', messageResponse);
        }

        console.log(`Message sent from ${senderId} to ${receiverId || groupId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     * @param {object} typingData - Typing data
     */
    socket.on('typing', (typingData) => {
      const { senderId, receiverId, groupId, isTyping } = typingData;

      const typingResponse = {
        senderId,
        isTyping
      };

      if (groupId) {
        // Broadcast to group room (except sender)
        socket.to(groupId).emit('userTyping', typingResponse);
      } else {
        // Send to recipient's personal room
        io.to(receiverId).emit('userTyping', typingResponse);
      }
    });

    /**
     * Message read status
     * @param {object} readData - Read status data
     */
    socket.on('messageRead', async (readData) => {
      try {
        const { messageId, readerId } = readData;

        // Update message status
        const message = await Message.findByIdAndUpdate(
          messageId,
          { status: 'read' },
          { new: true }
        );

        if (message) {
          // Notify sender
          io.to(message.senderId.toString()).emit('messageStatusUpdate', {
            messageId,
            status: 'read'
          });
        }
      } catch (error) {
        console.error('Error updating message status:', error);
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      if (socket.userId) {
        userSockets.delete(socket.userId);
        // Broadcast offline status
        socket.broadcast.emit('userOffline', { userId: socket.userId });
      }
    });
  });

  // Return helper function to emit to specific user
  return {
    emitToUser: (userId, event, data) => {
      const socketId = userSockets.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    },
    emitToRoom: (roomId, event, data) => {
      io.to(roomId).emit(event, data);
    }
  };
};
