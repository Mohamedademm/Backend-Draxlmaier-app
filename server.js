const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const teamRoutes = require('./routes/teams');

const objectiveRoutes = require('./routes/objectiveRoutes');
const matriculeRoutes = require('./routes/matriculeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);


app.set('trust proxy', 1);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(' MongoDB Atlas connected successfully');
  } catch (err) {
    console.error(' MongoDB Atlas connection failed:', err.message);
    console.log(' Trying local MongoDB...');
    try {
      await mongoose.connect('mongodb://localhost:27017/draxlmaier-app');
      console.log(' Local MongoDB connected successfully');
    } catch (localErr) {
      console.error(' Local MongoDB connection failed:', localErr.message);
      console.log('  Server running without database. Please check MongoDB connection.');
    }
  }
};

connectDB();

app.use(helmet());

app.use(cors({
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api/', rateLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/matricules', matriculeRoutes);
app.use('/api', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

app.use(errorHandler);

const logger = require('./config/logger');

socketHandler(io);


const PORT = process.env.PORT || 3000;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error('Server error:', error);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  logger.info(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`✅ Server is listening on port ${PORT}`);
  logger.info(`✅ Health check: http://localhost:${PORT}/health`);

  const address = server.address();
  logger.info(`✅ Server address: ${JSON.stringify(address)}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;
