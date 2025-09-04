const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

// Serve static files from the dist directory (Expo export output)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${PORT}`);
  console.log('Serving static files from ./dist directory');
});