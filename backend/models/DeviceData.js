const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  timestamp: { type: Date, default: Date.now },
  powerConsumption: Number, // in watts
  voltage: Number,
  current: Number,
  energy: Number // in watt-hours
});

module.exports = mongoose.model('DeviceData', dataSchema);