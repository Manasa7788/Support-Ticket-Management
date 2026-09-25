const db = require('../config/db');

/**
 * Get list of users (Support Agent only)
 * GET /api/users
 * Query params: role (e.g. ?role=agent)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    let query = 'SELECT id, name, email, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY name ASC';

    const [users] = await db.execute(query, params);

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers
};
