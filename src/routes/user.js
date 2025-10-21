const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../utils/logger');

// Mock user data (replace with actual database in production)
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }
];

// Validation rules
const createUserValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

const updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

// GET /api/v1/users - Get all users
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.length / limit),
          totalUsers: users.length,
          hasNext: endIndex < users.length,
          hasPrev: startIndex > 0
        }
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const user = users.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

// POST /api/v1/users - Create new user
router.post('/', createUserValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    
    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      name,
      email,
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    logger.info('Created new user:', newUser);
    
    res.status(201).json({
      success: true,
      data: { user: newUser }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

// PUT /api/v1/users/:id - Update user
router.put('/:id', updateUserValidation, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if email already exists (excluding current user)
    if (email) {
      const existingUser = users.find(u => u.email === email && u.id !== parseInt(id));
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }
    
    // Update user
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    users[userIndex].updatedAt = new Date();
    
    logger.info('Updated user:', users[userIndex]);
    
    res.json({
      success: true,
      data: { user: users[userIndex] }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    logger.info('Deleted user:', deletedUser);
    
    res.json({
      success: true,
      data: { user: deletedUser }
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

module.exports = router;
