const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const openaiService = require('../services/openaiService');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../utils/logger');

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

// POST /api/openai/chat - Chat with OpenAI Assistant
router.post('/chat', chatValidation, handleValidationErrors, async (req, res) => {
  try {
    const { message, threadId } = req.body;
    
    logger.info('Received chat request:', { threadId, messageLength: message.length });
    
    const result = await openaiService.chatWithAssistant(message, threadId);
    
    res.json({
      success: true,
      data: {
        threadId: result.threadId,
        response: result.response,
        runId: result.runId
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

// POST /api/openai/thread - Create new thread
router.post('/thread', async (req, res) => {
  try {
    const thread = await openaiService.createThread();
    
    res.json({
      success: true,
      data: {
        threadId: thread.id
      }
    });
  } catch (error) {
    logger.error('Thread creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create thread'
    });
  }
});

// GET /api/openai/thread/:threadId/messages - Get thread messages
router.get('/thread/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params;
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
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get messages'
    });
  }
});

// POST /api/openai/thread/:threadId/message - Add message to thread
router.post('/thread/:threadId/message', [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Content must be between 1 and 4000 characters'),
  body('role')
    .optional()
    .isIn(['user', 'assistant'])
    .withMessage('Role must be either user or assistant')
], handleValidationErrors, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, role = 'user' } = req.body;
    
    const message = await openaiService.addMessage(threadId, content, role);
    
    res.json({
      success: true,
      data: {
        messageId: message.id,
        threadId,
        role: message.role,
        content: message.content[0]?.text?.value || ''
      }
    });
  } catch (error) {
    logger.error('Add message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add message'
    });
  }
});

module.exports = router;
