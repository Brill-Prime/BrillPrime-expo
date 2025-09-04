const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5000;
const EXPO_WEB_PORT = 8081;

// Proxy middleware configuration
const proxyOptions = {
  target: `http://localhost:${EXPO_WEB_PORT}`,
  changeOrigin: true,
  ws: true, // Enable websocket proxy for hot reloading
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.log('Proxy error:', err.message);
    res.status(500).send('Proxy error: Expo web server may not be running');
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.url} -> http://localhost:${EXPO_WEB_PORT}${req.url}`);
  }
};

// Create proxy middleware
const proxy = createProxyMiddleware(proxyOptions);

// Use proxy for all requests
app.use('/', proxy);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`Proxying to Expo web server at http://localhost:${EXPO_WEB_PORT}`);
  console.log('Make sure to start Expo web server with: npm run start-expo');
});