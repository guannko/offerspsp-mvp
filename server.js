const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Handle form submission
app.post('/submit-form', async (req, res) => {
  const { name, email, idea } = req.body;
  const timestamp = new Date().toISOString();
  
  // Save to file (simple solution for now)
  const submission = `
=== NEW SUBMISSION ===
Time: ${timestamp}
Name: ${name}
Email: ${email}
Idea: ${idea}
==================

`;
  
  try {
    await fs.appendFile('submissions.txt', submission);
    
    // Send success response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank you!</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          h1 { color: #22c55e; }
          a { color: #1A1A2E; }
        </style>
      </head>
      <body>
        <h1>✅ Thank you!</h1>
        <p>We'll contact you within 24 hours.</p>
        <a href="/">← Back to home</a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).send('Error processing form');
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Annoris MVP Sprint landing running on port ${PORT}`);
});