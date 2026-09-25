const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const commentController = require('../controllers/commentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  validateCreateTicket,
  validateUpdateTicket,
  validateComment
} = require('../middleware/validateMiddleware');

// All ticket routes require authentication
router.use(authenticateToken);

// Ticket statistics (Agent & Admin only)
router.get('/stats', requireRole('agent', 'admin'), ticketController.getTicketStats);

// List tickets (Role-filtered: customer sees own, agent sees all)
router.get('/', ticketController.getTickets);

// Create new ticket (Customer role primary, agent can also create)
router.post('/', validateCreateTicket, ticketController.createTicket);

// Single ticket operations
router.get('/:id', ticketController.getTicketById);
router.put('/:id', validateUpdateTicket, ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

// Nested comments routes
router.get('/:id/comments', commentController.getComments);
router.post('/:id/comments', validateComment, commentController.addComment);

module.exports = router;
