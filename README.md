# CRM Application with MongoDB and WhatsApp Integration

## Setup Instructions

1. Install MongoDB
   - Download and install MongoDB Community Server
   - Start MongoDB service

2. Install Dependencies
   ```bash
   npm install
   ```

3. Configure Environment Variables
   - Copy `.env.example` to `.env`
   - Update MongoDB connection URL
   - Add WhatsApp API credentials

4. Start the Server
   ```bash
   npm run dev
   ```

5. Access the Application
   - Open `index.html` in your browser
   - Server runs on http://localhost:3000

## Features
- MongoDB database integration for persistent data storage
- RESTful API endpoints for client and follow-up management
- WhatsApp Business API integration for automated reminders
- Real-time data synchronization between frontend and backend

## API Endpoints

### Clients
- GET /api/clients - Get all clients
- POST /api/clients - Create new client
- PUT /api/clients/:id - Update client

### Follow-ups
- GET /api/followups - Get all follow-ups
- POST /api/followups - Create new follow-up
- PUT /api/followups/:id - Update follow-up

### WhatsApp Settings
- GET /api/whatsapp-settings - Get WhatsApp configuration
- PUT /api/whatsapp-settings - Update WhatsApp configuration