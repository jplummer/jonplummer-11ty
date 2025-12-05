#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const toIco = require('to-ico');

/**
 * Generates favicon.ico and apple-touch-icon.png from icon.svg
 * 
 * This script:
 * - Renders the SVG to PNG at 32x32 for favicon.ico
 * - Renders the SVG to PNG at 180x180 for apple-touch-icon.png
 * - Creates favicon.ico from the 32x32 PNG
 * - Saves apple-touch-icon.png
 */

async function renderSvgToPng(svgPath, outputPath, width, height) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: 1
    });
    
    // Force light mode for static favicons (browser tabs/bookmarks are typically light)
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'light' }
    ]);
    
    // Read SVG content
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Create HTML wrapper for the SVG
    // Use light mode for favicons (dark mode is handled by the SVG itself in browsers)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${width}px;
              height: ${height}px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
            }
            svg {
              width: ${width}px;
              height: ${height}px;
            }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;
    
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: width,
        height: height
      },
      omitBackground: true
    });
  } finally {
    await browser.close();
  }
}

async function createFaviconIco(pngPath, icoPath) {
  const pngBuffer = fs.readFileSync(pngPath);
  const icoBuffer = await toIco([pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
}

async function main() {
  console.log('🎨 Generating favicons from SVG...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const svgPath = path.join(srcDir, 'assets', 'images', 'icon.svg');
  const assetsDir = path.join(srcDir, 'assets', 'images');
  
  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error(`❌ Error: SVG file not found at ${svgPath}`);
    process.exit(1);
  }
  
  // Generate 32x32 PNG for favicon.ico
  const png32Path = path.join(assetsDir, 'favicon-32x32.png');
  console.log('📸 Rendering 32x32 PNG...');
  await renderSvgToPng(svgPath, png32Path, 32, 32);
  
  // Generate favicon.ico
  const icoPath = path.join(srcDir, 'favicon.ico');
  console.log('🔷 Creating favicon.ico...');
  await createFaviconIco(png32Path, icoPath);
  
  // Generate 180x180 PNG for apple-touch-icon
  const appleTouchPath = path.join(assetsDir, 'apple-touch-icon.png');
  console.log('📸 Rendering 180x180 PNG for Apple devices...');
  await renderSvgToPng(svgPath, appleTouchPath, 180, 180);
  
  // Clean up temporary 32x32 PNG
  fs.unlinkSync(png32Path);
  
  console.log('\n✅ Favicons generated successfully!');
  console.log(`   - ${icoPath}`);
  console.log(`   - ${appleTouchPath}`);
}

main().catch(error => {
  console.error('❌ Error generating favicons:', error);
  process.exit(1);
});

