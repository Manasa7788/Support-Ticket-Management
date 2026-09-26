const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const cloudConfig = {
  host: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '4SFKuoyHoMbvyUB.root',
  password: 'ZD3P0Is6n5S4Gh6u',
  multipleStatements: true,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
};

async function migrateCloud() {
  console.log('[Cloud DB Migration] Connecting to TiDB Cloud...');
  const conn = await mysql.createConnection(cloudConfig);

  try {
    console.log('[Cloud DB Migration] Creating support_ticket_db database...');
    await conn.query('CREATE DATABASE IF NOT EXISTS support_ticket_db;');
    await conn.query('USE support_ticket_db;');

    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../../database/seed.sql');

    console.log('[Cloud DB Migration] Reading schema from:', schemaPath);
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Remove USE or DROP DATABASE commands to avoid conflict if any
    await conn.query(schemaSql);
    console.log('[Cloud DB Migration] Schema created successfully!');

    console.log('[Cloud DB Migration] Reading seed from:', seedPath);
    let seedSql = fs.readFileSync(seedPath, 'utf8');
    await conn.query(seedSql);
    console.log('[Cloud DB Migration] Seed data populated successfully!');

    // Verify records
    const [userCount] = await conn.query('SELECT count(*) as count FROM users;');
    const [ticketCount] = await conn.query('SELECT count(*) as count FROM tickets;');
    const [commentCount] = await conn.query('SELECT count(*) as count FROM ticket_comments;');

    console.log('--------------------------------------------------');
    console.log('✓ Cloud Migration Complete!');
    console.log(`Users seeded:    ${userCount[0].count}`);
    console.log(`Tickets seeded:  ${ticketCount[0].count}`);
    console.log(`Comments seeded: ${commentCount[0].count}`);
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await conn.end();
  }
}

migrateCloud();
