// backend/server_v3.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'offerspsp-mvp',
    version: 'v3.1',
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'OffersPSP MVP Backend v3.1',
    endpoints: {
      health: '/health',
      autosave: '/autosave',
      pulse: 'GitHub HEARTBEAT.json'
    }
  });
});

// Autosave endpoint (placeholder)
app.post('/autosave', (req, res) => {
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!authToken || authToken !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  // TODO: Implement actual autosave logic
  console.log('Autosave received:', text.substring(0, 100) + '...');
  
  res.json({
    success: true,
    message: 'Autosave processed',
    timestamp: new Date().toISOString()
  });
});

// Start server with Pulse Engine support
app.listen(PORT, () => {
  console.log(`Server v3.1 running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Безопасный запуск Pulse Engine
  if (process.env.PULSE_ENABLED === 'true') {
    try {
      const { startPulse } = require('./pulse_worker');
      startPulse();
      console.log('💓 Pulse Engine: STARTED');
    } catch (e) {
      console.warn('⚠️ Pulse disabled (init error):', e.message);
    }
  } else {
    console.log('💤 Pulse Engine: DISABLED');
  }
});
