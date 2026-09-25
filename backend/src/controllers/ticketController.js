const db = require('../config/db');

/**
 * Get tickets list based on user role and query parameters
 * GET /api/tickets
 */
const getTickets = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { status, priority, assigned_to, search, sort } = req.query;

    let query = `
      SELECT 
        t.id,
        t.user_id,
        t.subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        customer.name AS customer_name,
        customer.email AS customer_email,
        agent.name AS assigned_agent_name,
        agent.email AS assigned_agent_email,
        COUNT(c.id) AS total_comments
      FROM tickets t
      INNER JOIN users customer ON t.user_id = customer.id
      LEFT JOIN users agent ON t.assigned_to = agent.id
      LEFT JOIN ticket_comments c ON t.id = c.ticket_id
      WHERE 1=1
    `;

    const params = [];

    // Role-based isolation: Customers can only access their own tickets
    if (role === 'customer') {
      query += ' AND t.user_id = ?';
      params.push(userId);
    }

    // Filters
    if (status) {
      query += ' AND t.status = ?';
      params.push(status.toUpperCase());
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority.toUpperCase());
    }

    if (assigned_to !== undefined && assigned_to !== '') {
      if (assigned_to === 'unassigned') {
        query += ' AND t.assigned_to IS NULL';
      } else if (assigned_to === 'me') {
        query += ' AND t.assigned_to = ?';
        params.push(userId);
      } else if (!isNaN(Number(assigned_to))) {
        query += ' AND t.assigned_to = ?';
        params.push(Number(assigned_to));
      }
    }

    // Search in subject, description, or customer name
    if (search && search.trim() !== '') {
      query += ' AND (t.subject LIKE ? OR t.description LIKE ? OR customer.name LIKE ?)';
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' GROUP BY t.id, customer.id, agent.id';

    // Sorting
    switch (sort) {
      case 'oldest':
        query += ' ORDER BY t.created_at ASC';
        break;
      case 'priority':
        query += ` ORDER BY 
          CASE t.priority 
            WHEN 'URGENT' THEN 1 
            WHEN 'HIGH' THEN 2 
            WHEN 'MEDIUM' THEN 3 
            WHEN 'LOW' THEN 4 
            ELSE 5 
          END ASC, t.created_at DESC`;
        break;
      case 'status':
        query += ` ORDER BY 
          CASE t.status 
            WHEN 'OPEN' THEN 1 
            WHEN 'IN_PROGRESS' THEN 2 
            WHEN 'RESOLVED' THEN 3 
            WHEN 'CLOSED' THEN 4 
            ELSE 5 
          END ASC, t.created_at DESC`;
        break;
      case 'newest':
      default:
        query += ' ORDER BY t.created_at DESC';
        break;
    }

    const [tickets] = await db.execute(query, params);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single ticket details by ID
 * GET /api/tickets/:id
 */
const getTicketById = async (req, res, next) => {
  try {
    const ticketId = req.params.id;

    const query = `
      SELECT 
        t.id,
        t.user_id,
        t.subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        customer.name AS customer_name,
        customer.email AS customer_email,
        agent.name AS assigned_agent_name,
        agent.email AS assigned_agent_email,
        COUNT(c.id) AS total_comments
      FROM tickets t
      INNER JOIN users customer ON t.user_id = customer.id
      LEFT JOIN users agent ON t.assigned_to = agent.id
      LEFT JOIN ticket_comments c ON t.id = c.ticket_id
      WHERE t.id = ?
      GROUP BY t.id, customer.id, agent.id
    `;

    const [tickets] = await db.execute(query, [ticketId]);

    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID #${ticketId} not found.`
      });
    }

    const ticket = tickets[0];

    // Role check: Customers can only view their own ticket
    if (req.user.role === 'customer' && ticket.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access forbidden: You do not have permission to view this ticket.'
      });
    }

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new ticket (Customers and Agents)
 * POST /api/tickets
 */
const createTicket = async (req, res, next) => {
  try {
    const { subject, description, priority } = req.body;
    const userId = req.user.id;
    const ticketPriority = priority ? priority.toUpperCase() : 'MEDIUM';

    const [result] = await db.execute(
      `INSERT INTO tickets (user_id, subject, description, priority, status)
       VALUES (?, ?, ?, ?, 'OPEN')`,
      [userId, subject, description, ticketPriority]
    );

    const newTicketId = result.insertId;

    // Fetch the newly created ticket with author details
    const [rows] = await db.execute(
      `SELECT 
        t.id,
        t.user_id,
        t.subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        customer.name AS customer_name,
        customer.email AS customer_email
      FROM tickets t
      INNER JOIN users customer ON t.user_id = customer.id
      WHERE t.id = ?`,
      [newTicketId]
    );

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully.',
      ticket: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket details
 * PUT /api/tickets/:id
 * - Support agents can update status, priority, and assigned_to agent
 * - Customers can update subject and description only if ticket is still OPEN
 */
const updateTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { role, id: userId } = req.user;
    const { status, priority, assigned_to, subject, description } = req.body;

    // Fetch current ticket
    const [tickets] = await db.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID #${ticketId} not found.`
      });
    }

    const currentTicket = tickets[0];

    // Authorization checks
    if (role === 'customer') {
      if (currentTicket.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access forbidden: You cannot modify another customer\'s ticket.'
        });
      }

      if (currentTicket.status === 'CLOSED' || currentTicket.status === 'RESOLVED') {
        return res.status(400).json({
          success: false,
          error: `Cannot modify ticket #${ticketId} because it is already ${currentTicket.status}.`
        });
      }

      // Customers can only update subject or description
      const newSubject = subject !== undefined ? subject : currentTicket.subject;
      const newDescription = description !== undefined ? description : currentTicket.description;

      await db.execute(
        'UPDATE tickets SET subject = ?, description = ? WHERE id = ?',
        [newSubject, newDescription, ticketId]
      );
    } else if (role === 'agent' || role === 'admin') {
      // Agents can update status, priority, assigned_to, subject, and description
      const updates = [];
      const params = [];

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status.toUpperCase());
      }

      if (priority !== undefined) {
        updates.push('priority = ?');
        params.push(priority.toUpperCase());
      }

      if (assigned_to !== undefined) {
        if (assigned_to === null || assigned_to === '') {
          updates.push('assigned_to = NULL');
        } else {
          // Verify assigned agent exists and is an agent/admin
          const [agentCheck] = await db.execute(
            "SELECT id FROM users WHERE id = ? AND role IN ('agent', 'admin')",
            [assigned_to]
          );
          if (agentCheck.length === 0) {
            return res.status(400).json({
              success: false,
              error: 'Assigned user does not exist or is not a support agent.'
            });
          }
          updates.push('assigned_to = ?');
          params.push(assigned_to);
        }
      }

      if (subject !== undefined) {
        updates.push('subject = ?');
        params.push(subject);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }

      if (updates.length > 0) {
        params.push(ticketId);
        await db.execute(
          `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      }
    }

    // Return the updated ticket with all details
    const [updatedRows] = await db.execute(
      `SELECT 
        t.id,
        t.user_id,
        t.subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.created_at,
        t.updated_at,
        customer.name AS customer_name,
        customer.email AS customer_email,
        agent.name AS assigned_agent_name,
        agent.email AS assigned_agent_email
      FROM tickets t
      INNER JOIN users customer ON t.user_id = customer.id
      LEFT JOIN users agent ON t.assigned_to = agent.id
      WHERE t.id = ?`,
      [ticketId]
    );

    return res.status(200).json({
      success: true,
      message: 'Ticket updated successfully.',
      ticket: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a ticket
 * DELETE /api/tickets/:id
 * - Support agents and Admins can delete any ticket
 * - Customers can delete their own ticket only if it is still OPEN
 */
const deleteTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { role, id: userId } = req.user;

    const [tickets] = await db.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Ticket with ID #${ticketId} not found.`
      });
    }

    const ticket = tickets[0];

    if (role === 'customer') {
      if (ticket.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access forbidden: You cannot delete another customer\'s ticket.'
        });
      }
      if (ticket.status !== 'OPEN') {
        return res.status(400).json({
          success: false,
          error: 'Customers can only delete tickets with OPEN status.'
        });
      }
    }

    await db.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);

    return res.status(200).json({
      success: true,
      message: `Ticket #${ticketId} has been successfully deleted.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ticket statistics for Agent Dashboard
 * GET /api/tickets/stats
 */
const getTicketStats = async (req, res, next) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) AS total_tickets,
        COALESCE(SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END), 0) AS open_tickets,
        COALESCE(SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0) AS in_progress_tickets,
        COALESCE(SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved_tickets,
        COALESCE(SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END), 0) AS closed_tickets,
        COALESCE(SUM(CASE WHEN priority IN ('HIGH', 'URGENT') AND status NOT IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END), 0) AS urgent_tickets,
        COALESCE(SUM(CASE WHEN assigned_to IS NULL AND status = 'OPEN' THEN 1 ELSE 0 END), 0) AS unassigned_tickets
      FROM tickets
    `);

    return res.status(200).json({
      success: true,
      stats: {
        total: Number(stats[0].total_tickets),
        open: Number(stats[0].open_tickets),
        in_progress: Number(stats[0].in_progress_tickets),
        resolved: Number(stats[0].resolved_tickets),
        closed: Number(stats[0].closed_tickets),
        urgent: Number(stats[0].urgent_tickets),
        unassigned: Number(stats[0].unassigned_tickets)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats
};
