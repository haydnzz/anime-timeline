import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outDir = join(__dirname, 'temporary screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';

const existing = existsSync(outDir)
  ? readdirSync(outDir).filter(f => f.endsWith('.png')).length
  : 0;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Skip video intro
try {
  const skipBtn = await page.$('#video-skip');
  if (skipBtn) { await skipBtn.click(); await new Promise(r => setTimeout(r, 1200)); }
} catch(e) {}

const sections = [
  { id: 'global', label: 'era-global' },
  { id: 'streaming', label: 'era-streaming' },
  { id: 'world-map', label: 'world-map' },
  { id: 'data', label: 'data-section' },
];

let idx = existing + 1;
for (const s of sections) {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, s.id);
  await new Promise(r => setTimeout(r, 800));
  const path = join(outDir, `screenshot-${idx}-${s.label}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Saved: ${path}`);
  idx++;
}

await browser.close();
