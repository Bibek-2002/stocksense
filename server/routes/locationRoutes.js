const express = require('express');
const router = express.Router();
const { createLocation, getLocations, updateLocation, deleteLocation } = require('../controllers/locationController');
const { protect, requireManager } = require('../middleware/authMiddleware');

router.route('/').post(protect, requireManager, createLocation).get(protect, getLocations);
router.route('/:id').put(protect, requireManager, updateLocation).delete(protect, requireManager, deleteLocation);

module.exports = router;
