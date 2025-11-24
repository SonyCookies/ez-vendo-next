const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all interfaces
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Paths to certificate files
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

// Check if certificates exist
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('\n❌ SSL certificates not found!');
  console.error('Please run: npm run generate-cert\n');
  process.exit(1);
}

app.prepare().then(() => {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    const localIP = getLocalIP();
    console.log(`\n✅ Ready on https://localhost:${port}`);
    console.log(`   Also accessible via: https://${localIP}:${port}`);
    console.log(`   (Use your local IP address)\n`);
  });
});

