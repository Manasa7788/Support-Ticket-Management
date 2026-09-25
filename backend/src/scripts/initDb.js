const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDb() {
  console.log('[DB Init] Connecting to MySQL server...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../../database/seed.sql');

    console.log('[DB Init] Applying schema from:', schemaPath);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('[DB Init] Schema created successfully.');

    console.log('[DB Init] Applying seed data from:', seedPath);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log('[DB Init] Seed data inserted successfully.');

    console.log('[DB Init] Database initialization complete!');
  } catch (error) {
    console.error('[DB Init] Error during database initialization:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
