const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { listUsers } = require('../controllers/adminController');
const { listAllTransactions } = require('../controllers/transactionController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));
router.get('/users', listUsers);
router.get('/transactions', listAllTransactions);

module.exports = router;
