const db = require('../config/db');

/**
 * Get all comments for a ticket
 * GET /api/tickets/:id/comments
 */
const getComments = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { role, id: userId } = req.user;

    // Verify ticket exists
    const [tickets] = await db.execute('SELECT id, user_id FROM tickets WHERE id = ?', [ticketId]);
    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID #${ticketId} not found.`
      });
    }

    // Role check: Customers can only see comments on their own tickets
    if (role === 'customer' && tickets[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access forbidden: You cannot view comments on another customer\'s ticket.'
      });
    }

    const query = `
      SELECT 
        c.id,
        c.ticket_id,
        c.user_id,
        c.comment,
        c.created_at,
        u.name AS author_name,
        u.email AS author_email,
        u.role AS author_role
      FROM ticket_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `;

    const [comments] = await db.execute(query, [ticketId]);

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new comment to a ticket
 * POST /api/tickets/:id/comments
 */
const addComment = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { comment } = req.body;
    const { role, id: userId } = req.user;

    // Verify ticket exists
    const [tickets] = await db.execute('SELECT id, user_id, status FROM tickets WHERE id = ?', [ticketId]);
    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID #${ticketId} not found.`
      });
    }

    // Role check: Customers can only comment on their own tickets
    if (role === 'customer' && tickets[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access forbidden: You cannot add comments to another customer\'s ticket.'
      });
    }

    // Insert comment
    const [result] = await db.execute(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [ticketId, userId, comment]
    );

    const newCommentId = result.insertId;

    // Update ticket's updated_at timestamp
    await db.execute('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [ticketId]);

    // Fetch the inserted comment with author metadata
    const query = `
      SELECT 
        c.id,
        c.ticket_id,
        c.user_id,
        c.comment,
        c.created_at,
        u.name AS author_name,
        u.email AS author_email,
        u.role AS author_role
      FROM ticket_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;

    const [rows] = await db.execute(query, [newCommentId]);

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  addComment
};
