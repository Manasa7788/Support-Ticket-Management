const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
