// Test file for CodeRabbit integration testing
// This file contains intentional issues to test CodeRabbit's detection capabilities

const express = require('express');
const app = express();

// Issue 1: Missing input validation
app.post('/payment', (req, res) => {
  const amount = req.body.amount; // No validation!
  const currency = req.body.currency; // No validation!
  
  // Issue 2: Potential SQL injection vulnerability  
  const query = `SELECT * FROM payments WHERE amount = ${amount}`;
  
  // Issue 3: Missing error handling
  processPayment(amount, currency);
  
  res.json({ status: 'success' });
});

// Issue 4: Function not defined but used above
// processPayment is missing

// Issue 5: No input sanitization
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const userQuery = `SELECT * FROM users WHERE id = '${userId}'`; // SQL injection risk
  
  res.json({ user: 'data' });
});

// Issue 6: Hardcoded sensitive data
const API_KEY = 'sk-1234567890abcdef'; // Should be in env vars

// Issue 7: Missing async/await handling
function fetchUserData() {
  return fetch('/api/users'); // No await, no error handling
}

// Issue 8: Unused variable
const unusedVariable = 'this will never be used';

module.exports = app;