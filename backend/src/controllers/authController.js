const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Register a new customer
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Enforce 'customer' role for public registration
    // (Agents must be created by administrators or seeded)
    const assignedRole = (role === 'admin' || role === 'agent') ? 'customer' : 'customer';

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // Hash the password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, assignedRole]
    );

    const newUserId = result.insertId;

    const payload = {
      id: newUserId,
      name,
      email,
      role: assignedRole
    };

    // Generate JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_jwt_key_default',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: payload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login (Customer and Support Agent)
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const [users] = await db.execute(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password against stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Generate JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_jwt_key_default',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: payload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const [users] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
