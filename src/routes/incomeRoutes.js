const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { getIncome } = require('../controllers/transactionController');

const router = express.Router();
router.get('/', requireAuth, requireRole('freelancer'), getIncome);

module.exports = router;
