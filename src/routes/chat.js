const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const openaiService = require('../services/openaiService');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../utils/logger');

// Mock chat history storage (replace with actual database in production)
let chatHistory = {};

// Validation rules
const chatValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message must be between 1 and 4000 characters'),
  body('threadId')
    .optional()
    .isString()
    .withMessage('ThreadId must be a string')
];

// POST /api/v1/chat - Send message to chat
router.post('/', chatValidation, handleValidationErrors, async (req, res) => {
  try {
    const { message, threadId, userId } = req.body;
    
    logger.info('Received chat request:', { threadId, userId, messageLength: message.length });
    
    const result = await openaiService.chatWithAssistant(message, threadId);
    
    // Store chat history
    if (!chatHistory[result.threadId]) {
      chatHistory[result.threadId] = [];
    }
    
    chatHistory[result.threadId].push({
      userMessage: message,
      assistantResponse: result.response,
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous'
    });
    
    res.json({
      success: true,
      data: {
        threadId: result.threadId,
        response: result.response,
        runId: result.runId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/v1/chat/history/:threadId - Get chat history for a thread
router.get('/history/:threadId', [
  param('threadId').notEmpty().withMessage('ThreadId is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { threadId } = req.params;
    
    if (!chatHistory[threadId]) {
      return res.status(404).json({
        success: false,
        error: 'Chat history not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        threadId,
        history: chatHistory[threadId]
      }
    });
  } catch (error) {
    logger.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history'
    });
  }
});

// GET /api/v1/chat/thread/:threadId - Get thread details and messages
router.get('/thread/:threadId', [
  param('threadId').notEmpty().withMessage('ThreadId is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { threadId } = req.params;
    
    // Get messages from OpenAI
    const messages = await openaiService.getMessages(threadId);
    
    res.json({
      success: true,
      data: {
        threadId,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content[0]?.text?.value || '',
          createdAt: new Date(msg.created_at * 1000).toISOString()
        }))
      }
    });
  } catch (error) {
    logger.error('Get thread error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get thread'
    });
  }
});

// POST /api/v1/chat/thread - Create new chat thread
router.post('/thread', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const thread = await openaiService.createThread();
    
    // Initialize chat history for new thread
    chatHistory[thread.id] = [];
    
    logger.info('Created new chat thread:', { threadId: thread.id, userId });
    
    res.status(201).json({
      success: true,
      data: {
        threadId: thread.id,
        userId: userId || 'anonymous',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Create thread error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create thread'
    });
  }
});

// DELETE /api/v1/chat/thread/:threadId - Delete chat thread
router.delete('/thread/:threadId', [
  param('threadId').notEmpty().withMessage('ThreadId is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { threadId } = req.params;
    
    // Remove from local chat history
    delete chatHistory[threadId];
    
    logger.info('Deleted chat thread:', threadId);
    
    res.json({
      success: true,
      data: {
        threadId,
        message: 'Thread deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Delete thread error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete thread'
    });
  }
});

module.exports = router;
