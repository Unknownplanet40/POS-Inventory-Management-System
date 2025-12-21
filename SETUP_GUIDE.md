# POS System - Complete Setup Guide

This is a full-stack Point of Sale (POS) system with a React frontend and NestJS backend using SQLite database.

## Project Structure

```
local-stock-keeper/
├── src/                    # React frontend (Vite + TypeScript)
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth)
│   ├── lib/               # Utilities and API integration
│   ├── pages/             # Page components
│   └── main.tsx           # Entry point
├── server/                # NestJS backend
│   ├── src/
│   │   ├── entities/      # Database entities
│   │   ├── modules/       # Feature modules
│   │   ├── common/        # Shared guards, strategies
│   │   ├── main.ts        # Entry point
│   │   └── app.module.ts  # Main module
│   ├── package.json
│   └── README.md          # Backend documentation
├── package.json           # Frontend dependencies
└── README.md              # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Postman (optional, for testing API)
- Browser (Chrome, Firefox, etc.)

## Installation & Setup

### Step 1: Install Frontend Dependencies

```bash
cd POS-Inventory-Management-System
npm install
```

### Step 2: Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### Step 3: Start the Backend

Open a terminal and run:

```bash
cd server
npm run start:dev
```

The backend will start on `http://localhost:3000`

The SQLite database will be created automatically at `server/pos-database.sqlite`

### Step 4: Start the Frontend

Open another terminal and run:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Using the Application

### First Time Setup

1. Open the application at `http://localhost:5173`
2. You will see the Setup Wizard
3. Enter your store name and proceed
4. Create an admin account with a username and password
5. You're ready to use the system!

### User Roles

- **Admin**: Can access all features including product management, user management, sales reports
- **Cashier**: Can only access the checkout page to process sales

### Quick API Test

1. **Register a user:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123","role":"admin"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Get all products (requires token from login):**
   ```bash
   curl -X GET http://localhost:3000/api/products \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## Postman Collection

A Postman collection is included in `server/POS_System_API.postman_collection.json`

### Import Steps:

1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `server/POS_System_API.postman_collection.json`
4. Set up environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (leave empty initially, will auto-populate after login)
5. Run the "Login" request to get a token
6. Use the token for authenticated endpoints

## Features

### Frontend (React)
- User authentication and session management
- Product management with barcode scanning support
- Point of sale checkout
- Sales history and reports
- User management (admin only)
- Store settings configuration
- Receipt Printing
- Data export/import capabilities

### Backend (NestJS)
- RESTful API with JWT authentication
- User management with role-based access
- Product inventory management
- Sales transaction tracking
- Application settings management
- SQLite persistent database
- CORS enabled for frontend communication

## Database Schema

SQLite database is stored at: `server/pos-database.sqlite`

### Tables:
- **users**: User accounts with authentication
- **products**: Product inventory
- **sales**: Transaction records
- **settings**: Application configuration

The database is automatically initialized on first backend run.

## Available Commands

### Frontend
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### Backend
```bash
cd server
npm run start:dev     # Start in watch mode
npm run build         # Build for production
npm run start:prod    # Run production build
npm run lint          # Run ESLint
npm test              # Run tests
```

## Troubleshooting

### Backend won't start
- Make sure port 3000 is not in use
- Check Node.js version: `node --version`
- Try deleting `node_modules` and reinstalling: `npm install`

### Frontend can't connect to backend
- Ensure backend is running on `http://localhost:3000`
- Check browser console for CORS errors
- Make sure `http://localhost:5173` is allowed in backend CORS settings

### Database file not created
- The database is created automatically on first request
- Check `server/pos-database.sqlite` exists after starting backend
- If missing, check terminal for errors

### API Errors in Postman
- Ensure backend is running
- Check that token is set in environment variables (from login response)
- Verify request method (GET, POST, PUT, DELETE)
- Check request body is valid JSON

## Production Deployment

For production deployment:

1. Build frontend:
   ```bash
   npm run build
   ```

2. Build backend:
   ```bash
   cd server
   npm run build
   ```

3. Update environment variables:
   - Change JWT secret in `server/src/app.module.ts`
   - Update CORS origin for your domain
   - Use a production database path or external database

4. Start backend:
   ```bash
   npm run start:prod
   ```

5. Serve frontend files with a static server

## Security Notes

⚠️ **Development Mode Only**

The current setup is configured for development. For production:

- Change the JWT secret to a strong, random value
- Use environment variables for sensitive config
- Enable HTTPS for API communication
- Add rate limiting to API endpoints
- Implement proper error logging
- Use a more robust database solution
