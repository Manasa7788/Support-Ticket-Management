const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'support_ticket_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on module load
(async () => {
  try {
    const connection = await pool.getConnection();
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Database] Connected successfully to MySQL (${process.env.DB_NAME || 'support_ticket_db'}) on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    }
    connection.release();
  } catch (err) {
    console.error('[Database] Failed to connect to MySQL:', err.message);
  }
})();

module.exports = pool;
