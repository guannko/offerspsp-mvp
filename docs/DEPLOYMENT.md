# OffersPSP MVP Deployment Guide

  ## 🚀 Quick Deploy to Cloudways

  ### Prerequisites
  - Cloudways account
  - Domain name configured  
  - GitHub repository access

  ### Step 1: Server Setup
  1. Create new server on Cloudways
  2. Choose: **PHP/Node.js Stack**
  3. Server size: **2GB RAM minimum**
  4. Location: **Europe/US**

  ### Step 2: Clone Repository
  ```bash
  git clone https://github.com/guannko/offerspsp-mvp.git
  cd offerspsp-mvp
  ```

  ### Step 3: Install Dependencies
  ```bash
  cd frontend && npm install
  cd ../backend && npm install
  cd ../telegram-bot && npm install
  ```

  ### Step 4: Environment Configuration
  ```bash
  cp .env.example .env
  nano .env
  ```

  ### Step 5: Build & Deploy
  ```bash
  # Build frontend
  cd frontend && npm run build

  # Start backend
  cd ../backend && npm start

  # Start Telegram bot
  cd ../telegram-bot && npm start
  ```

  ### Step 6: SSL & Domain
  1. Configure SSL certificate in Cloudways
  2. Point domain to server IP
  3. Update FRONTEND_URL in environment

  ---
  *Created by AI Team in TypingMind*