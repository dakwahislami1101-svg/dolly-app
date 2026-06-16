import sharp from 'sharp';
import fs from 'fs';

async function generateImages() {
  const svgPath = 'public/icon.svg';
  console.log('Starting asset regeneration from SVG...');

  // 1. Ensure assets/ and public/ dirs exist
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }

  // 2. Clear corrupted assets by deleting or preparing the file buffers
  const svgBuffer = fs.readFileSync(svgPath);

  // 3. Generate icon.png (512x512) for PWA/Web
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/icon.png');
  console.log('✓ Generated public/icon.png');

  // 4. Generate favicon.png (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.png');
  console.log('✓ Generated public/favicon.png');

  // 5. Generate JPG Dolly Logo (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .jpeg({ quality: 90 })
    .toFile('public/dolly_logo.jpg');
  console.log('✓ Generated public/dolly_logo.jpg');

  // 6. Generate JPG Icon (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .jpeg({ quality: 90 })
    .toFile('public/icon.jpg');
  console.log('✓ Generated public/icon.jpg');

  // --- GENERATING FOR ASSETS FOLDER (CAPACITOR) ---

  // 7. assets/icon.png (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon.png');
  console.log('✓ Generated assets/icon.png');

  // 8. assets/logo.png (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('assets/logo.png');
  console.log('✓ Generated assets/logo.png');

  // 9. assets/icon-only.png (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon-only.png');
  console.log('✓ Generated assets/icon-only.png');

  // 10. Adaptive background: solid rose pink (#f43f5e)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 244, g: 63, b: 94, alpha: 1 }
    }
  })
    .png()
    .toFile('assets/icon-background.png');
  console.log('✓ Generated assets/icon-background.png');

  // 11. Adaptive foreground: SVG logo centered inside transparent grid
  // We will scale down the SVG slightly to fit nicely as the adaptive foreground
  const foregroundOverlay = await sharp(svgBuffer)
    .resize(600, 600)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: foregroundOverlay, top: 212, left: 212 }])
    .png()
    .toFile('assets/icon-foreground.png');
  console.log('✓ Generated assets/icon-foreground.png');

  // 12. Splash Screen: Centered SVG on nice pink/gradient background
  const splashOverlay = await sharp(svgBuffer)
    .resize(600, 600)
    .png()
    .toBuffer();

  // Create solid dark splash
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 30, g: 30, b: 36, alpha: 1 } // Rich Charcoal/Black for dark-splash
    }
  })
    .composite([{ input: splashOverlay, top: 1066, left: 1066 }])
    .png()
    .toFile('assets/splash-dark.png');
  console.log('✓ Generated assets/splash-dark.png');

  // Create light splash with rose red center
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 244, g: 63, b: 94, alpha: 1 } // Rose pink active splash background
    }
  })
    .composite([{ input: splashOverlay, top: 1066, left: 1066 }])
    .png()
    .toFile('assets/splash.png');
  console.log('✓ Generated assets/splash.png');

  console.log('All brand assets successfully regenerated from vector master file.');
}

generateImages().catch(err => {
  console.error('Fatal error regenerating assets:', err);
  process.exit(1);
});
