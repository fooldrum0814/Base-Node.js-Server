const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./user');
const chatRoutes = require('./chat');

// API version prefix
const API_VERSION = '/v1';

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route modules
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/chat`, chatRoutes);

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    endpoints: {
      health: 'GET /api/health',
      users: {
        create: 'POST /api/v1/users',
        get: 'GET /api/v1/users/:id',
        update: 'PUT /api/v1/users/:id',
        delete: 'DELETE /api/v1/users/:id'
      },
      chat: {
        create: 'POST /api/v1/chat',
        getHistory: 'GET /api/v1/chat/history/:threadId',
        getThread: 'GET /api/v1/chat/thread/:threadId'
      }
    }
  });
});

module.exports = router;
