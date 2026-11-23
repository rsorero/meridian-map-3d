// Renders the PNG app icons from the SVG sources in src/icons. Needs Playwright with Chromium.
// Run after changing the artwork: node scripts/icons.js  (the PNGs are committed; the build only copies them)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'icons');
const jobs = [
  ['icon.svg', 'icon-192.png', 192, true],
  ['icon.svg', 'icon-512.png', 512, true],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512, false],
];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [src, out, size, transparent] of jobs) {
    const uri = 'data:image/svg+xml,' + encodeURIComponent(fs.readFileSync(path.join(dir, src), 'utf8'));
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0;background:transparent"><img src="${uri}" width="${size}" height="${size}" style="display:block"></body>`);
    await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
    await page.screenshot({ path: path.join(dir, out), omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
    console.log('wrote', out);
  }
  await browser.close();
})();
