const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['solar', 'meter', 'appliance'], required: true },
  location: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);