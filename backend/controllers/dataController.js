const DeviceData = require('../models/DeviceData');
const Device = require('../models/Device');

// Generate random data for a device
const generateRandomData = (device) => {
  const isSolar = device.type === 'solar';
  const baseLoad = isSolar ? 
    Math.random() * 2000 + 800 : // Solar: 800-2800W during daylight
    device.type === 'appliance' ? 
      Math.random() * 800 + 200 : // Appliances: 200-1000W
      Math.random() * 1200 + 300; // Meters: 300-1500W

  return {
    deviceId: device._id,
    powerConsumption: isSolar ? 
      -(baseLoad + (Math.random() * 200 - 100)) : // Negative for solar
      baseLoad + (Math.random() * 200 - 100),
    voltage: isSolar ? 
      48 + (Math.random() * 2 - 1) : // Solar voltage range
      220 + (Math.random() * 10 - 5), // Standard voltage
    current: baseLoad / (isSolar ? 48 : 220),
    energy: baseLoad * 0.5 / 1000, // Convert to kWh (0.5h interval)
    timestamp: new Date()
  };
};

// Update device data
exports.updateDeviceData = async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!device) return res.status(404).json({ message: 'Device not found' });

    // Generate new data
    const newData = new DeviceData(generateRandomData(device));
    await newData.save();

    // Keep only the last 10 updates
    await DeviceData.deleteMany({
      deviceId: device._id,
      timestamp: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Delete data older than 24 hours
    });

    res.json(newData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAllDevicesData = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id });
    const newData = await Promise.all(
      devices.map(async (device) => {
        const data = generateRandomData(device);
        const newData = new DeviceData(data);
        await newData.save();
        return newData;
      })
    );
    
    res.json(newData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current data (latest for each device)
exports.getCurrentData = async (req, res) => {
  try {
    // Fetch user's devices
    const devices = await Device.find({ userId: req.user._id });
    if (devices.length === 0) {
      return res.json([]); // Return empty array if no devices
    }

    const deviceIds = devices.map(d => d._id);

    // Fetch latest data for each device
    const data = await DeviceData.aggregate([
      { $match: { deviceId: { $in: deviceIds } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$deviceId", latest: { $first: "$$ROOT" } } }
    ]).exec();

    res.json(data.map(d => d.latest));
  } catch (err) {
    console.error('Error in getCurrentData:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get historical data (last 10 updates for a device)
exports.getHistoricalData = async (req, res) => {
  try {
    const { deviceId, hours } = req.query;

    // If no deviceId is provided, fetch data for all user devices
    if (!deviceId) {
      const devices = await Device.find({ userId: req.user._id });
      if (devices.length === 0) {
        return res.json([]); // Return empty array if no devices
      }

      const deviceIds = devices.map(d => d._id);
      const cutoff = new Date(Date.now() - (hours || 24) * 60 * 60 * 1000);

      const data = await DeviceData.find({
        deviceId: { $in: deviceIds },
        timestamp: { $gte: cutoff }
      }).sort({ timestamp: -1 });

      return res.json(data);
    }

    // If deviceId is provided, fetch data for that specific device
    const device = await Device.findOne({ _id: deviceId, userId: req.user._id });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const cutoff = new Date(Date.now() - (hours || 24) * 60 * 60 * 1000);
    const data = await DeviceData.find({
      deviceId,
      timestamp: { $gte: cutoff }
    }).sort({ timestamp: -1 });

    res.json(data);
  } catch (err) {
    console.error('Error in getHistoricalData:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Crop old data entries
exports.cropDeviceData = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id });
    let totalDeleted = 0;

    for (const device of devices) {
      // Get the 10 oldest entries for the device
      const oldestEntries = await DeviceData.find({ deviceId: device._id })
        .sort({ timestamp: 1 })
        .limit(10);

      if (oldestEntries.length > 0) {
        const deleted = await DeviceData.deleteMany({
          _id: { $in: oldestEntries.map(e => e._id) }
        });
        totalDeleted += deleted.deletedCount;
      }
    }

    res.json({ deletedCount: totalDeleted });
  } catch (err) {
    console.error('Error cropping data:', err);
    res.status(500).json({ message: 'Server error' });
  }
};