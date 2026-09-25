const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_default');
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
};

/**
 * Middleware to authorize requests based on user roles
 * @param  {...string} roles Allowed roles (e.g. 'agent', 'admin')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: Requires one of [${roles.join(', ')}] roles.`
      });
    }

    next();
  };
};

/**
 * Middleware to ensure the user has access to a specific ticket.
 * Agents and Admins can access any ticket.
 * Customers can only access tickets they created.
 */
const authorizeTicketAccess = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format.'
      });
    }

    const [rows] = await db.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID #${ticketId} not found.`
      });
    }

    const ticket = rows[0];

    // Agents and admins have unrestricted access to all tickets
    if (req.user.role === 'agent' || req.user.role === 'admin') {
      req.ticket = ticket;
      return next();
    }

    // Customers can only access their own tickets
    if (req.user.role === 'customer') {
      if (ticket.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access forbidden: You do not have permission to view or modify this ticket.'
        });
      }
      req.ticket = ticket;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access forbidden.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  authorizeTicketAccess
};
