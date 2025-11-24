// Simple script to generate PWA icons from an existing image
// This requires sharp package: npm install sharp
// Usage: node icon-generator.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];

async function generateIcons() {
  const inputImage = path.join(__dirname, 'ez-vendo-id.png');
  const outputDir = __dirname;

  if (!fs.existsSync(inputImage)) {
    console.error('Input image not found:', inputImage);
    console.log('Please place your logo/image at:', inputImage);
    console.log('Or manually create icon-192x192.png and icon-512x512.png in the public folder');
    return;
  }

  try {
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`Generated: ${outputPath}`);
    }
    console.log('✅ Icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();

