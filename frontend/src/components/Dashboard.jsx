import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Button, Modal, Badge, Dropdown } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import ChatAssistant from './ChatAssistant';

Chart.register(...registerables);

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceHistory, setDeviceHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGraph, setSelectedGraph] = useState('net');
  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchData = async () => {
    try {
      const devicesRes = await api.get('/devices');
      setDevices(devicesRes.data);

      const currentRes = await api.get('/data/current');
      setCurrentData(currentRes.data);

      const historyRes = await api.get('/data/history?hours=24');
      setHistoricalData(historyRes.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateAll = async () => {
    try {
      const res = await api.post('/data/update-all');
      setCurrentData([...res.data, ...currentData]);
    } catch (err) {
      setError('Failed to update data. Please try again.');
    }
  };

  const handleCropData = async () => {
    try {
      const res = await api.post('/data/crop-data');
      alert(`Deleted ${res.data.deletedCount} old data entries!`);
      await fetchData();
    } catch (err) {
      setError('Failed to crop data. Please try again.');
    }
  };

  const handleShowHistory = async (device) => {
    try {
      setSelectedDevice(device);
      const historyRes = await api.get(`/data/history?deviceId=${device._id}&hours=24`);
      setDeviceHistory(historyRes.data);
      setShowModal(true);
    } catch (err) {
      setError('Failed to fetch device history');
    }
  };

  const calculateTotals = () => {
    return currentData.reduce((acc, data) => {
      const device = devices.find(d => d._id === data.deviceId);
      if (!device) return acc;

      if (device.type === 'solar') {
        acc.solarProduction += Math.abs(data.powerConsumption);
        acc.netPower -= Math.abs(data.powerConsumption);
      } else {
        acc.totalConsumption += data.powerConsumption;
        acc.netPower += data.powerConsumption;
      }
      return acc;
    }, { solarProduction: 0, totalConsumption: 0, netPower: 0 });
  };

  const totals = calculateTotals();

  const getDeviceColor = (type) => {
    return type === 'solar' ? 'success' : 'danger';
  };

  const processChartData = () => {
    const timeBuckets = historicalData.reduce((acc, data) => {
      const device = devices.find(d => d._id === data.deviceId);
      const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (!acc[time]) {
        acc[time] = { solar: 0, consumption: 0, net: 0 };
      }

      if (device?.type === 'solar') {
        acc[time].solar += Math.abs(data.powerConsumption);
        acc[time].net -= Math.abs(data.powerConsumption);
      } else {
        acc[time].consumption += data.powerConsumption;
        acc[time].net += data.powerConsumption;
      }

      return acc;
    }, {});

    const labels = Object.keys(timeBuckets);
    const values = Object.values(timeBuckets);

    let dataset;
    switch (selectedGraph) {
      case 'solar':
        dataset = {
          label: 'Solar Production (W)',
          data: values.map(b => -b.solar),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.1,
          fill: false
        };
        break;
      case 'consumption':
        dataset = {
          label: 'Power Consumption (W)',
          data: values.map(b => b.consumption),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          tension: 0.1,
          fill: false
        };
        break;
      case 'net':
      default:
        dataset = {
          label: 'Net Power (W)',
          data: values.map(b => b.net),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.1,
          fill: false
        };
        break;
    }

    return {
      labels,
      datasets: [dataset]
    };
  };

  const processDeviceChartData = (deviceData) => {
    const timeBuckets = deviceData.reduce((acc, data) => {
      const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (!acc[time]) {
        acc[time] = 0;
      }

      acc[time] = selectedDevice?.type === 'solar' 
        ? -Math.abs(data.powerConsumption)
        : Math.abs(data.powerConsumption);

      return acc;
    }, {});

    return {
      labels: Object.keys(timeBuckets),
      datasets: [{
        label: selectedDevice?.type === 'solar' ? 'Power Production (W)' : 'Power Consumption (W)',
        data: Object.values(timeBuckets),
        borderColor: selectedDevice?.type === 'solar' ? '#28a745' : '#dc3545',
        backgroundColor: selectedDevice?.type === 'solar' 
          ? 'rgba(40, 167, 69, 0.1)' 
          : 'rgba(220, 53, 69, 0.1)',
        tension: 0.1,
        fill: false
      }]
    };
  };

  const chartData = processChartData();
  const deviceChartData = processDeviceChartData(deviceHistory);

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Power (W)'
        },
        ticks: {
          callback: (value) => `${Math.abs(value)}W`
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${Math.abs(value).toFixed(1)}W`;
          }
        }
      }
    }
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div>
      <h2 className="mb-4">Energy Dashboard</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-4">
        <Button onClick={handleUpdateAll} className="me-2">
          Refresh All Devices
        </Button>
        <Button variant="warning" onClick={handleCropData}>
          Crop Data (Remove Oldest 10 Entries)
        </Button>
      </div>

      <div className="mt-3">
        <h4>System Summary</h4>
        <p className='fs-5'>Solar Production: <b>{totals.solarProduction.toFixed(1)}W</b></p>
        <p className='fs-5'>Total Consumption: <b>{totals.totalConsumption.toFixed(1)}W</b></p>
        <p className='fs-5'>Net Power: <b>{totals.netPower.toFixed(1)}W</b></p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Energy Graph</h4>
        <Dropdown>
          <Dropdown.Toggle variant="primary" id="graph-selector">
            {selectedGraph === 'solar' ? 'Solar Production' :
             selectedGraph === 'consumption' ? 'Total Consumption' : 'Net Power'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setSelectedGraph('solar')}>Solar Production</Dropdown.Item>
            <Dropdown.Item onClick={() => setSelectedGraph('consumption')}>Total Consumption</Dropdown.Item>
            <Dropdown.Item onClick={() => setSelectedGraph('net')}>Net Power</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <Line data={chartData} options={chartOptions} className="mb-4" />

      <Row className="g-4">
        {devices.map(device => (
          <Col md={4} key={device._id}>
            <Card className="dashboard-card h-100" onClick={() => handleShowHistory(device)}>
              <Card.Body>
                <Card.Title>
                  <Badge bg={getDeviceColor(device.type)} className="me-2">●</Badge>
                  {device.name}
                  <small className="text-muted d-block">{device.type.toUpperCase()}</small>
                </Card.Title>
                {currentData.filter(data => data.deviceId === device._id).map(data => (
                  <div key={data._id}>
                    <strong>{device.type === 'solar' ? 'Power Production' : 'Power Usage'}:</strong> 
                    {' '}{Math.abs(data.powerConsumption).toFixed(1)}W<br />
                    <strong>Voltage:</strong> {data.voltage.toFixed(1)}V<br />
                    <strong>Current:</strong> {data.current.toFixed(2)}A
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
<br />
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedDevice?.name} History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDevice && (
            <>
              <Line 
                data={deviceChartData} 
                options={chartOptions} 
              />
              <div className="mt-3">
                <h5>Recent Statistics</h5>
                <p>Average Power: {(
                  deviceHistory.reduce((sum, data) => sum + Math.abs(data.powerConsumption), 0) /
                  (deviceHistory.length || 1)
                ).toFixed(1)}W</p>
                <p>Total Energy: {(
                  deviceHistory.reduce((sum, data) => sum + (data.energy || 0), 0)
                ).toFixed(1)}kWh</p>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Dashboard;