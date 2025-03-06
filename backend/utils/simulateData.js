const Device = require('../models/Device');
const DeviceData = require('../models/DeviceData');

const simulateDeviceData = async () => {
  const generateData = async () => {
    try {
      const devices = await Device.find();
      const now = new Date();
      
      await Promise.all(devices.map(async (device) => {
        const baseLoad = device.type === 'solar' ? 
          Math.random() * 2000 : // Solar panels produce up to 2000W
          Math.random() * 1000;   // Other devices consume up to 1000W
        
        const newData = new DeviceData({
          deviceId: device._id,
          powerConsumption: baseLoad + (Math.random() * 200 - 100),
          voltage: device.type === 'solar' ? 
            48 + (Math.random() * 2 - 1) : // Solar systems typically 48V
            220 + (Math.random() * 10 - 5), // Standard voltage
          current: baseLoad / (device.type === 'solar' ? 48 : 220),
          energy: baseLoad * 0.5 // Assuming 30-minute intervals
        });
        
        await newData.save();
      }));
      
      console.log(`Simulated data generated at ${now}`);
    } catch (err) {
      console.error('Data simulation error:', err);
    }
  };

  // Initial generation
  await generateData();
  // Run every 5 minutes
  setInterval(generateData, 300000);
};

module.exports = { simulateDeviceData };