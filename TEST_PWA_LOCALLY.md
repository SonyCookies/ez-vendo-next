# Testing PWA Locally

## Issue: Can't See Install Button

The PWA install button won't appear in development mode because:
1. PWA is disabled in development (for faster development)
2. Service worker is not generated in dev mode

## Solution: Test in Production Mode

### Option 1: Build and Run Production (Recommended)

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Access the app**:
   - Open: `http://localhost:3000`
   - The install button should now appear!

### Option 2: Enable PWA in Development (For Testing)

If you want to test PWA features during development:

1. **Edit `next.config.mjs`**:
   ```javascript
   disable: false, // Change from: process.env.NODE_ENV === "development"
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Note**: This will slow down development slightly, but allows PWA testing

## Requirements for Install Button

The install button will only appear if:

1. ✅ **Icons exist**: `icon-192x192.png` and `icon-512x512.png` in `public/` folder
2. ✅ **Manifest is valid**: `manifest.json` is accessible
3. ✅ **Service worker registered**: Service worker is active
4. ✅ **HTTPS or localhost**: Using HTTPS or localhost (localhost works for testing)
5. ✅ **PWA enabled**: Not disabled in config

## Testing Checklist

- [ ] Icons are correctly named (no double extensions)
- [ ] Built the app: `npm run build`
- [ ] Running production: `npm start`
- [ ] Accessing via `http://localhost:3000`
- [ ] Service worker is registered (check DevTools > Application > Service Workers)
- [ ] Manifest is accessible at `http://localhost:3000/manifest.json`

## Desktop Testing

**Chrome/Edge:**
- Look for install icon in address bar (usually appears after a few seconds)
- Or go to: Menu (⋮) > Install EZ-Vendo

**Firefox:**
- Menu > More Tools > Install Site as App

## Mobile Testing

**Android Chrome:**
- Menu (⋮) > Install app / Add to Home screen

**iOS Safari:**
- Share button > Add to Home Screen

## Troubleshooting

### Still No Install Button?

1. **Check Service Worker**:
   - Open DevTools (F12)
   - Go to Application tab
   - Check "Service Workers" section
   - Should show "activated and running"

2. **Check Manifest**:
   - Visit: `http://localhost:3000/manifest.json`
   - Should return valid JSON
   - Check for errors in console

3. **Check Icons**:
   - Visit: `http://localhost:3000/icon-192x192.png`
   - Visit: `http://localhost:3000/icon-512x512.png`
   - Both should load images

4. **Clear Cache**:
   - DevTools > Application > Clear storage
   - Reload page

5. **Check Console**:
   - Look for any errors in browser console
   - Service worker registration errors will appear here

## Quick Test Command

```bash
# Build and start production server
npm run build && npm start
```

Then open `http://localhost:3000` and check for install button!

