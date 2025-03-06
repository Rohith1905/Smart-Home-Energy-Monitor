const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const auth = require('../utils/auth');

// Data routes
router.get('/current', auth, dataController.getCurrentData);
router.get('/history', auth, dataController.getHistoricalData); // Corrected route
router.post('/update/:id', auth, dataController.updateDeviceData);
router.post('/update-all', auth, dataController.updateAllDevicesData);
router.post('/crop-data', auth, dataController.cropDeviceData);

module.exports = router;