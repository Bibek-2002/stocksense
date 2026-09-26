const express = require('express');
const router = express.Router();
const { getKPIs, getReorderSuggestions, getLedger } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/kpis', protect, getKPIs);
router.get('/reorder-suggestions', protect, getReorderSuggestions);
router.get('/ledger', protect, getLedger);

module.exports = router;
