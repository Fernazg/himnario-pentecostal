// Genera los íconos PNG de la PWA desde design/*.svg (requiere Playwright).
// Para cambiar el diseño: edite design/logo.py y ejecute `python3 design/logo.py design`.
(async () => {
  const { chromium } = require('playwright');
  const { readFileSync } = require('node:fs');
  const path = require('node:path');
  const svg = (n) => readFileSync(path.join(__dirname, '../design', n), 'utf8');
  const targets = [
    ['pwa-192.png', 192, svg('icon.svg')],
    ['pwa-512.png', 512, svg('icon.svg')],
    ['apple-touch-icon.png', 180, svg('icon-square.svg')],
    ['pwa-maskable-512.png', 512, svg('icon-maskable.svg')],
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
