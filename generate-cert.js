const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

// Try to use selfsigned package first (no OpenSSL required)
function generateWithSelfsigned() {
  try {
    const selfsigned = require('selfsigned');
    console.log('Generating self-signed SSL certificate using Node.js...\n');
    
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, {
      keySize: 4096,
      days: 365,
      algorithm: 'sha256'
    });
    
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
    
    console.log('✅ SSL certificates generated successfully!');
    console.log('   - cert.pem');
    console.log('   - key.pem\n');
    console.log('⚠️  Note: You may see a security warning in your browser.');
    console.log('   This is normal for self-signed certificates. Click "Advanced" and "Proceed" to continue.\n');
    return true;
  } catch (error) {
    return false;
  }
}

// Try OpenSSL as fallback
function generateWithOpenSSL() {
  // Find OpenSSL executable
  let opensslPath = 'openssl';

  // On Windows, check common Git for Windows installation paths
  if (os.platform() === 'win32') {
    const commonPaths = [
      'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
      'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe',
      'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
      'C:\\Program Files (x86)\\Git\\mingw64\\bin\\openssl.exe',
    ];

    // First, try if openssl is in PATH
    try {
      execSync('openssl version', { stdio: 'ignore' });
      opensslPath = 'openssl';
    } catch (error) {
      // Try common Git for Windows paths
      let found = false;
      for (const testPath of commonPaths) {
        if (fs.existsSync(testPath)) {
          opensslPath = testPath;
          found = true;
          break;
        }
      }
      
      if (!found) {
        return false;
      }
    }
  } else {
    // On Unix-like systems, just check if openssl is in PATH
    try {
      execSync('openssl version', { stdio: 'ignore' });
    } catch (error) {
      return false;
    }
  }

  // Generate self-signed certificate
  console.log('Generating self-signed SSL certificate using OpenSSL...\n');
  console.log(`Using OpenSSL at: ${opensslPath}\n`);

  const command = `"${opensslPath}" req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;

  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log('\n✅ SSL certificates generated successfully!');
    console.log('   - cert.pem');
    console.log('   - key.pem\n');
    console.log('⚠️  Note: You may see a security warning in your browser.');
    console.log('   This is normal for self-signed certificates. Click "Advanced" and "Proceed" to continue.\n');
    return true;
  } catch (error) {
    return false;
  }
}

// Main generation logic
console.log('Generating self-signed SSL certificate...\n');

// Try selfsigned package first (no external dependencies)
if (generateWithSelfsigned()) {
  // Success!
} else {
  // Fallback to OpenSSL
  if (generateWithOpenSSL()) {
    // Success!
  } else {
    console.error('❌ Failed to generate certificates.');
    console.error('\nTried methods:');
    console.error('  1. Node.js selfsigned package (not installed)');
    console.error('  2. OpenSSL (not found in PATH or Git for Windows)\n');
    console.error('Solutions:');
    console.error('  1. Install the selfsigned package: npm install --save-dev selfsigned');
    console.error('  2. Or add Git\\usr\\bin to your Windows PATH');
    console.error('  3. Or install OpenSSL from https://slproweb.com/products/Win32OpenSSL.html\n');
    process.exit(1);
  }
}

