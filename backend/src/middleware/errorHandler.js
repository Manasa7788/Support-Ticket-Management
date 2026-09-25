/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Handle MySQL duplicate key error (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'A record with this information already exists.'
    });
  }

  // Handle MySQL foreign key constraint errors
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      error: 'Referenced entity does not exist.'
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
