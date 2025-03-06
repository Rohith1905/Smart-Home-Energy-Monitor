import React, { useEffect, useState } from 'react';
import { Button, Card, ListGroup, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ name: '', type: 'appliance', location: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Axios instance with authorization header
  const api = axios.create({
    baseURL: '/api',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get('/devices');
        setDevices(res.data);
      } catch (err) {
        setError('Failed to fetch devices. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  // Add device
  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/devices', newDevice);
      setDevices([...devices, res.data]);
      setNewDevice({ name: '', type: 'appliance', location: '' });
    } catch (err) {
      setError('Failed to add device. Please try again.');
      console.error(err);
    }
  };

  // Delete device
  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await api.delete(`/devices/${deviceId}`);
        setDevices(devices.filter(device => device._id !== deviceId));
      } catch (err) {
        setError('Failed to delete device. Please try again.');
        console.error(err);
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4">My Devices</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <h4>Add New Device</h4>
          <form onSubmit={handleAddDevice}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Device Name"
                value={newDevice.name}
                onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                required
              />
            </div>
            <div className="mb-3">
              <select
                className="form-select"
                value={newDevice.type}
                onChange={(e) => setNewDevice({...newDevice, type: e.target.value})}
              >
                <option value="appliance">Appliance</option>
                <option value="solar">Solar Panel</option>
                <option value="meter">Meter</option>
              </select>
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Location"
                value={newDevice.location}
                onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
              />
            </div>
            <Button type="submit">Add Device</Button>
          </form>
        </Card.Body>
      </Card>

      {loading ? (
        <Spinner animation="border" />
      ) : devices.length === 0 ? (
        <p>No devices found. Add a new device to get started!</p>
      ) : (
        <ListGroup>
          {devices.map(device => (
            <ListGroup.Item key={device._id}>
              <h5>{device.name}</h5>
              <p>Type: {device.type} | Location: {device.location}</p>
              <Button
                variant="danger"
                onClick={() => handleDeleteDevice(device._id)}
              >
                Delete
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default DeviceList;