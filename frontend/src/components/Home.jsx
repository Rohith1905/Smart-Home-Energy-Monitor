import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, ProgressBar, Spinner, Button } from 'react-bootstrap';
import { FiSun, FiZap, FiActivity, FiBarChart2, FiCopy } from 'react-icons/fi';
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import axios from 'axios';
import './Home.css';
import ChatAssistant from './ChatAssistant';

const Home = () => {
  const [energyStats, setEnergyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const api = axios.create({
          baseURL: '/api',
          headers: { Authorization: `Bearer ${token}` }
        });

        const [devicesRes, historyRes] = await Promise.all([
          api.get('/devices'),
          api.get('/data/history?hours=24')
        ]);

        const devices = devicesRes.data;
        const historicalData = historyRes.data;

        const stats = historicalData.reduce((acc, data) => {
          const device = devices.find(d => d._id === data.deviceId);
          if (device) {
            if (device.type === 'solar') {
              acc.solar += data.energy || 0;
            } else {
              acc.consumption += data.energy || 0;
            }
          }
          return acc;
        }, { solar: 0, consumption: 0 });

        const efficiency = stats.consumption > 0 
          ? Math.min((stats.solar / stats.consumption) * 100, 100)
          : 0;

        setEnergyStats({
          solarProduction: Math.round(stats.solar),
          totalConsumption: Math.round(stats.consumption),
          efficiency: Math.round(efficiency)
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  const handleCopyStats = () => {
    const statsText = `Solar Production: ${energyStats?.solarProduction || 0}kWh\n` +
                      `Total Consumption: ${energyStats?.totalConsumption || 0}kWh\n` +
                      `System Efficiency: ${energyStats?.efficiency || 0}%`;
    
    navigator.clipboard.writeText(`'`+ statsText+ `' This is the energy stats for today!. give me some insights!`)
      .then(() => alert('Energy stats copied to clipboard! You can now paste them to the AI assistant'))
      .catch(err => console.error('Failed to copy stats:', err));
  };

  if (loading && isLoggedIn) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading energy data...</p>
      </div>
    );
  }


const renderTooltip = (message) => (
  <Tooltip id="tooltip" className="custom-tooltip">
    {message}
  </Tooltip>
);

  return (
    <Container className="home-container">
      <div className="hero-section text-center mb-5">
        <h1 className="hero-title mb-3">
          Smart Energy Management <FiZap className="pulse-icon" />
        </h1>
        <p className="hero-subtitle">
          Optimize your energy usage with real-time monitoring and AI-powered insights
        </p>
      </div>

      <Row className="g-4 mb-5">
  <Col md={4}>
    <OverlayTrigger
      placement="top"
      overlay={renderTooltip("Total energy generated from solar panels today")}
    >
      <Card className="energy-card energy-production">
        <Card.Body>
          <FiSun className="card-icon" />
          <Card.Title>Solar Production</Card.Title>
          <div className="card-stats">
            <h2>{energyStats?.solarProduction || 0}kWh</h2>
            <span className="text-success">Today's Total</span>
          </div>
          <ProgressBar now={60} variant="warning" className="mt-3" />
        </Card.Body>
      </Card>
    </OverlayTrigger>
  </Col>

  <Col md={4}>
    <OverlayTrigger
      placement="top"
      overlay={renderTooltip("Total energy consumed by all devices today")}
    >
      <Card className="energy-card energy-consumption">
        <Card.Body>
          <FiActivity className="card-icon" />
          <Card.Title>Total Consumption</Card.Title>
          <div className="card-stats">
            <h2>{energyStats?.totalConsumption || 0}kWh</h2>
            <span className="text-danger">Today's Total</span>
          </div>
          <ProgressBar now={80} variant="info" className="mt-3" />
        </Card.Body>
      </Card>
    </OverlayTrigger>
  </Col>

  <Col md={4}>
    <OverlayTrigger
      placement="top"
      overlay={renderTooltip("Ratio of total solar power-production to the total power consumption")}
    >
      <Card className="energy-card energy-efficiency">
        <Card.Body>
          <FiBarChart2 className="card-icon" />
          <Card.Title>System Efficiency</Card.Title>
          <div className="card-stats">
            <h2>{energyStats?.efficiency || 0}%</h2>
            <span className="text-success">
              {energyStats?.efficiency >= 75 ? "Optimal" : "Needs Attention"}
            </span>
          </div>
          <ProgressBar
            now={energyStats?.efficiency || 0}
            variant={energyStats?.efficiency >= 75 ? "success" : "warning"}
            className="mt-3"
          />
        </Card.Body>
      </Card>
    </OverlayTrigger>
  </Col>
</Row>


    
    <br/>
      {isLoggedIn ? (
        <>
        <div className="ai-assistant-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>AI Energy Assistant</h4>
            <Button variant="outline-primary" onClick={handleCopyStats}>
              <FiCopy className="me-2" />
              Share Stats with AI
            </Button>
          </div>
          <ChatAssistant />
        </div>
        <div className="text-center mt-3">
          <br />
  <p className='fs-5 text-muted'>
    Explore more insights on the  
    <a href="/dashboard" className="fw-bold text-primary ms-1">Dashboard</a>! 🚀
  </p>
</div>

        </>
      ) : (
        <div className="text-center p-4 border rounded">
          <h5>Want AI-powered insights?</h5>
          <p className="text-muted">
            <a href="/login">Login</a> to interact with our energy assistant
          </p>
        </div>
      )}
    </Container>
  );
};

export default Home;
