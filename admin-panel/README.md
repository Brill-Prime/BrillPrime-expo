
# Brill Prime Admin Panel

This is the standalone admin panel for the Brill Prime application.

## Features

- User Management
- KYC Verification
- Transaction Monitoring
- Escrow Management
- Fraud Detection
- Support Ticket Management
- Content Moderation
- Real-time System Monitoring

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Access the admin panel at: http://localhost:3001

## Components

- `admin-panel.tsx` - Main admin dashboard
- `admin-user-management.tsx` - User management interface
- `admin-kyc-verification.tsx` - KYC document review
- `admin-transactions.tsx` - Transaction monitoring
- `admin-escrow-management.tsx` - Escrow management
- `admin-fraud.tsx` - Fraud detection dashboard
- `admin-support.tsx` - Support ticket management
- `admin-moderation.tsx` - Content moderation
- `admin-monitoring.tsx` - Real-time system monitoring

## API Integration

The admin panel connects to the main Brill Prime backend API. Ensure the backend is running and accessible.

## Deployment

This can be deployed as a standalone application separate from the main mobile app.
