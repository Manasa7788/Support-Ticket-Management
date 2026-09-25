const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// User listing is restricted to Support Agents and Admins
router.use(authenticateToken);
router.use(requireRole('agent', 'admin'));

router.get('/', userController.getUsers);

module.exports = router;
