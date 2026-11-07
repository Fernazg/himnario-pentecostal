(async () => {
// Genera los íconos PNG de la PWA a partir de public/favicon.svg (requiere Playwright).
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const svg = readFileSync(path.join(__dirname, '../public/favicon.svg'), 'utf8');
const maskable = svg.replace('rx="112"', 'rx="0"').replace(/<path/g, '<path transform="translate(51 51) scale(0.8)"');
const targets = [
  ['pwa-192.png', 192, svg],
  ['pwa-512.png', 512, svg],
  ['apple-touch-icon.png', 180, maskable],
  ['pwa-maskable-512.png', 512, maskable],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, src] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>*{margin:0}body{background:transparent}</style>${src.replace('<svg ', `<svg width="${size}" height="${size}" `)}`);
  await page.screenshot({ path: path.join(__dirname, '../public', name), omitBackground: true });
}
await browser.close();
console.log('Íconos generados');
})();
