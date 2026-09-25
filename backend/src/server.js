const app = require('./app');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Support Ticket Backend Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
