const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// The path to the static files. As server.js is at the root, this will be the current directory.
const publicPath = path.join(__dirname, '/');

// Serve static files. This is the line you provided for deployment.
app.use(express.static(publicPath));

// For Single Page Application (SPA) routing, all other routes should serve the index.html file.
// This allows client-side routing to work correctly.
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
