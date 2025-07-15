const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  require('dotenv').config();

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({ 
      message: 'OffersPSP API Server',
      version: '1.0.0',
      status: 'active'
    });
  });

  app.get('/api/v1/psp-offers', (req, res) => {
    res.json({
      offers: [
        {
          id: 1,
          name: "EU Payment Solutions",
          regions: ["EU", "UK"],
          methods: ["Cards", "Bank Transfer", "E-wallets"],
          description: "Tier 1 payment processing for European markets"
        },
        {
          id: 2,
          name: "Global Pay Partners",
          regions: ["Worldwide"],
          methods: ["Cards", "Crypto", "Alternative"],
          description: "Multi-region payment solutions with crypto support"
        }
      ]
    });
  });

  app.post('/api/v1/applications', (req, res) => {
    const { companyName, email, license, volume } = req.body;
    
    res.json({
      id: Date.now(),
      status: 'submitted',
      message: 'Application received. Qualification in progress.',
      estimatedTime: '2-3 business days'
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 OffersPSP API Server running on port ${PORT}`);
  });