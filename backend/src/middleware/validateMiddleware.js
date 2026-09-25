/**
 * Request validation middlewares
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

const validateCreateTicket = (req, res, next) => {
  const { subject, description, priority } = req.body;
  const errors = [];

  if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
    errors.push('Subject is required and must be at least 3 characters.');
  } else if (subject.trim().length > 255) {
    errors.push('Subject cannot exceed 255 characters.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    errors.push('Description is required and must be at least 5 characters.');
  }

  if (priority && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  req.body.subject = subject.trim();
  req.body.description = description.trim();
  req.body.priority = priority ? priority.toUpperCase() : 'MEDIUM';
  next();
};

const validateUpdateTicket = (req, res, next) => {
  const { status, priority, assigned_to, subject, description } = req.body;
  const errors = [];

  if (status !== undefined && !VALID_STATUSES.includes(status.toUpperCase())) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (assigned_to !== undefined && assigned_to !== null && isNaN(Number(assigned_to))) {
    errors.push('Assigned agent ID must be a valid number or null.');
  }

  if (subject !== undefined && (typeof subject !== 'string' || subject.trim().length < 3)) {
    errors.push('Subject must be at least 3 characters if provided.');
  }

  if (description !== undefined && (typeof description !== 'string' || description.trim().length < 5)) {
    errors.push('Description must be at least 5 characters if provided.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  if (status) req.body.status = status.toUpperCase();
  if (priority) req.body.priority = priority.toUpperCase();
  next();
};

const validateComment = (req, res, next) => {
  const { comment } = req.body;
  const errors = [];

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    errors.push('Comment text is required.');
  } else if (comment.trim().length > 5000) {
    errors.push('Comment cannot exceed 5000 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  req.body.comment = comment.trim();
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateTicket,
  validateUpdateTicket,
  validateComment
};
