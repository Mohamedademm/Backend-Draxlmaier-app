const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }

    next();
  };
};

const userValidation = {
  create: validate([
    body('firstname')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastname')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 1 }).withMessage('Password is required'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'employee']).withMessage('Invalid role')
  ]),

  update: validate([
    param('id')
      .isMongoId().withMessage('Invalid user ID'),
    body('firstname')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastname')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
    body('active')
      .optional()
      .isBoolean().withMessage('Active must be boolean')
  ]),

  getById: validate([
    param('id')
      .isMongoId().withMessage('Invalid user ID')
  ])
};

const messageValidation = {
  send: validate([
    body('content')
      .trim()
      .notEmpty().withMessage('Message content is required')
      .isLength({ max: 5000 }).withMessage('Message cannot exceed 5000 characters'),
    body('receiverId')
      .optional()
      .isMongoId().withMessage('Invalid receiver ID'),
    body('groupId')
      .optional()
      .isMongoId().withMessage('Invalid group ID')
  ])
};

/**
 * Group validation rules
 */
const groupValidation = {
  // Create group
  create: validate([
    body('name')
      .trim()
      .notEmpty().withMessage('Group name is required')
      .isLength({ max: 100 }).withMessage('Group name cannot exceed 100 characters'),
    body('members')
      .isArray({ min: 1 }).withMessage('At least one member is required')
      .custom((members) => {
        return members.every(id => /^[0-9a-fA-F]{24}$/.test(id));
      }).withMessage('Invalid member IDs')
  ]),

  // Get by ID
  getById: validate([
    param('id')
      .isMongoId().withMessage('Invalid group ID')
  ])
};

/**
 * Notification validation rules
 */
const notificationValidation = {
  // Send notification
  send: validate([
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
    body('targetUsers')
      .optional()
      .isArray().withMessage('Target users must be an array')
      .custom((users) => {
        if (!users || users.length === 0) return true; // Allow empty array for "all users"
        return users.every(id => /^[0-9a-fA-F]{24}$/.test(id));
      }).withMessage('Invalid user IDs')
  ]),

  // Mark as read
  markRead: validate([
    param('id')
      .isMongoId().withMessage('Invalid notification ID')
  ])
};

/**
 * Location validation rules
 */
const locationValidation = {
  // Update location
  update: validate([
    body('latitude')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
  ])
};

/**
 * Auth validation rules
 */
const authValidation = {
  // Register
  register: validate([
    body('firstname')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastname')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 1 }).withMessage('Password is required'),
    body('phone')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value) => {
        if (!value || value === '') return true; // Accepter chaîne vide
        return /^[\d\s\-\+\(\)]+$/.test(value);
      }).withMessage('Invalid phone number format'),
    body('position')
      .optional()
      .trim(),
    body('department')
      .optional()
      .trim(),
    body('address')
      .optional()
      .trim(),
    body('city')
      .optional()
      .trim(),
    body('postalCode')
      .optional()
      .trim(),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ]),
  
  // Login
  login: validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
  ])
};

module.exports = {
  validate,
  userValidation,
  messageValidation,
  groupValidation,
  notificationValidation,
  locationValidation,
  authValidation
};
