const admin = require('firebase-admin');
const logger = require('../config/logger');

class NotificationService {
    constructor() {
        this.initialized = false;
        this.initialize();
    }

    initialize() {
        try {
            // Check if we have credentials
            // In a real production app, we would use environment variables or a secure file
            // For this demo, we check if the file exists or if env vars are set

            // If deployed on Render, we might put the JSON content in an ENV variable
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                this.initialized = true;
                logger.info('Firebase Admin initialized with ENV variable');
            } else {
                logger.warn('Firebase Service Account not found. Push notifications will be disabled.');
                // We don't throw error to allow server to start without notifications
            }
        } catch (error) {
            logger.error('Error initializing Firebase Admin:', error);
        }
    }

    /**
     * Send a push notification to a specific device
     * @param {string} token - FCM device token
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {Object} data - Custom data payload
     */
    async sendToDevice(token, title, body, data = {}) {
        if (!this.initialized || !token) return;

        try {
            const message = {
                notification: {
                    title,
                    body,
                },
                data: {
                    ...data,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                token: token,
            };

            const response = await admin.messaging().send(message);
            logger.info('Successfully sent message:', response);
            return response;
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Send a push notification to multiple devices (multicast)
     * @param {Array<string>} tokens - Array of FCM device tokens
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {Object} data - Custom data payload
     */
    async sendMulticast(tokens, title, body, data = {}) {
        if (!this.initialized || !tokens || tokens.length === 0) return;

        try {
            const message = {
                notification: {
                    title,
                    body,
                },
                data: {
                    ...data,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                tokens: tokens,
            };

            const response = await admin.messaging().sendMulticast(message);
            logger.info(`${response.successCount} messages were sent successfully`);

            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                logger.warn('List of tokens that caused failures:', failedTokens);
            }

            return response;
        } catch (error) {
            logger.error('Error sending multicast message:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
