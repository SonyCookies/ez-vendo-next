# Troubleshooting Connection Issues

## Problem: Can't reach https://192.168.1.50:3000

### Step 1: Check if the server is running

Open a terminal in the project directory and check if you see:
```
✅ Ready on https://localhost:3000
   Also accessible via: https://192.168.1.50:3000
```

If not, the server is not running.

### Step 2: Generate SSL Certificates (Required for HTTPS)

The HTTPS server requires SSL certificates. Run:

```bash
npm run generate-cert
```

This will create `cert.pem` and `key.pem` files in your project root.

### Step 3: Start the HTTPS Server

After generating certificates, start the server:

```bash
npm run dev:https
```

**Important:** Make sure you're using `npm run dev:https` (not `npm run dev`)

### Step 4: Check Your Local IP Address

The IP `192.168.1.50` might have changed. To find your current IP:

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Step 5: Firewall Check

Windows Firewall might be blocking the connection:

1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Firewall"
3. Make sure Node.js is allowed for both Private and Public networks

Or temporarily disable firewall to test.

### Step 6: Try HTTP Instead (For Testing)

If HTTPS continues to have issues, you can use HTTP for local testing:

1. Stop the HTTPS server (Ctrl+C)
2. Run: `npm run dev`
3. Access via: `http://192.168.1.50:3000`

**Note:** NFC will NOT work with HTTP - it requires HTTPS.

### Step 7: Check Network Connection

Make sure:
- Your phone/device is on the same Wi-Fi network
- Your computer and device can ping each other
- No VPN is interfering

### Common Issues:

1. **"SSL certificates not found"**
   - Solution: Run `npm run generate-cert`

2. **"Port 3000 already in use"**
   - Solution: Kill the process using port 3000 or change the port in `server.js`

3. **"ERR_CONNECTION_TIMED_OUT"**
   - Check if server is running
   - Check firewall settings
   - Verify IP address is correct
   - Try accessing from the same computer first: `https://localhost:3000`

4. **"ERR_CERT_AUTHORITY_INVALID" (Browser warning)**
   - This is normal for self-signed certificates
   - Click "Advanced" → "Proceed to 192.168.1.50 (unsafe)"
   - Or add the certificate to your device's trusted certificates

### Quick Checklist:

- [ ] SSL certificates generated (`cert.pem` and `key.pem` exist)
- [ ] Server is running (`npm run dev:https`)
- [ ] Correct IP address (check with `ipconfig`)
- [ ] Firewall allows Node.js
- [ ] Device is on same network
- [ ] Try `https://localhost:3000` first to verify server works


