
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock API endpoints
app.get('/api/merchants', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Shell Gas Station',
        address: '123 Main St',
        latitude: 34.9592083,
        longitude: -116.419389,
        rating: 4.5,
        commodities: ['Premium Petrol', 'Diesel']
      }
    ]
  });
});

app.get('/api/merchants/nearby', (req, res) => {
  const { lat, lng } = req.query;
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Nearby Shell Station',
        address: '456 Oak Ave',
        latitude: parseFloat(lat) + 0.01,
        longitude: parseFloat(lng) + 0.01,
        distance: 1.2,
        rating: 4.3
      }
    ]
  });
});

app.get('/api/notifications/unread-count', (req, res) => {
  res.json({
    success: true,
    data: { count: 0 }
  });
});

app.get('/api/cart', (req, res) => {
  res.json({
    success: true,
    data: { items: [], total: 0 }
  });
});

// Payment methods endpoints
app.get('/api/payment-methods', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post('/api/payment-methods', (req, res) => {
  const paymentMethod = req.body;
  res.json({
    success: true,
    data: {
      id: Date.now().toString(),
      ...paymentMethod,
      createdAt: new Date().toISOString()
    }
  });
});

app.get('/api/merchants/nearby/live', (req, res) => {
  const { lat, lng, radius } = req.query;
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Live Nearby Shell Station',
        address: '456 Oak Ave',
        latitude: parseFloat(lat) + 0.01,
        longitude: parseFloat(lng) + 0.01,
        distance: 1.2,
        rating: 4.3,
        isOpen: true,
        category: 'Gas Station'
      }
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
