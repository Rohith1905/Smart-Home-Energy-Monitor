const Device = require('../models/Device');
const DeviceData = require('../models/DeviceData');

exports.registerDevice = async (req, res) => {
  try {
    const { name, type, location } = req.body;
    const device = new Device({
      name,
      type,
      location,
      userId: req.user._id
    });
    await device.save();
    res.status(201).json(device);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDeviceDetails = async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('latestData');
    
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a device and its data
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!device) return res.status(404).json({ message: 'Device not found' });

    // Delete all associated data
    await DeviceData.deleteMany({ deviceId: device._id });

    res.json({ message: 'Device deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};