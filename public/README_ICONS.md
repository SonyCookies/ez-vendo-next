# PWA Icons Setup

To complete the PWA setup, you need to create two icon files:

1. **icon-192x192.png** (192x192 pixels)
2. **icon-512x512.png** (512x512 pixels)

## Quick Setup Options

### Option 1: Use Online Tool (Recommended)
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload your logo (ez-vendo-id.png)
3. Download the generated icons
4. Place them in the `public/` folder

### Option 2: Use Image Editor
1. Open `ez-vendo-id.png` in any image editor (Photoshop, GIMP, Canva, etc.)
2. Resize to 192x192 pixels, save as `icon-192x192.png`
3. Resize to 512x512 pixels, save as `icon-512x512.png`
4. Place both files in the `public/` folder

### Option 3: Use the Generator Script
1. Install sharp: `npm install sharp --save-dev`
2. Run: `node public/icon-generator.js`
3. The script will generate icons from `ez-vendo-id.png`

## Icon Requirements
- **Format**: PNG
- **Sizes**: 192x192 and 512x512 pixels
- **Shape**: Square (will be automatically masked to circle on some devices)
- **Background**: Transparent or solid color (white recommended)

## Verification
After creating the icons:
1. Build the app: `npm run build`
2. Check that icons are accessible at:
   - `/icon-192x192.png`
   - `/icon-512x512.png`
3. Test PWA installation in browser DevTools

