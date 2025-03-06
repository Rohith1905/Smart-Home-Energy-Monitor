const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const auth = require('../utils/auth');

// Device routes
router.post('/', auth, deviceController.registerDevice);
router.get('/', auth, deviceController.getUserDevices);
router.get('/:id', auth, deviceController.getDeviceDetails);
router.delete('/:id', auth, deviceController.deleteDevice);

module.exports = router;