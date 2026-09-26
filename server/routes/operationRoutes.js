const express = require('express');
const router = express.Router();
const {
  createOperation,
  getOperations,
  getOperationById,
  updateOperation,
  validateOperation,
  cancelOperation
} = require('../controllers/operationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createOperation).get(protect, getOperations);
router.route('/:id').get(protect, getOperationById).put(protect, updateOperation);
router.post('/:id/validate', protect, validateOperation);
router.post('/:id/cancel', protect, cancelOperation);

module.exports = router;
