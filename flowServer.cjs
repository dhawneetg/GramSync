const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FLOW_HTML_PATH = path.join(__dirname, 'public', 'flow.html');

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // Route /flow or /flow.html or /
  if (url === '/flow' || url === '/flow.html' || url === '/') {
    fs.readFile(FLOW_HTML_PATH, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error loading flow.html: ' + err.message);
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  } else {
    // Redirect anything else to /flow
    res.writeHead(302, { 'Location': '/flow' });
    res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[GramSync Archify Flow Server] Running at http://localhost:${PORT}/flow`);
});
